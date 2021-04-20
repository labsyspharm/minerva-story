import hashlib
import pathlib
import botocore
import boto3
import yaml
import sys
import time
import argparse
import itertools
from bs4 import BeautifulSoup
from markdown import markdown

def make_key(text_key):
    return f"speech/{text_key}.mp3"

def upload_hash_async(polly_client, text_md, text_key, bucket):
    text_html = BeautifulSoup(markdown(text_md), features="html.parser")
    text = ''.join(text_html.findAll(text=True))
    response = polly_client.start_speech_synthesis_task(Text=text, OutputFormat="mp3", VoiceId="Matthew", Engine="standard",
                                                        OutputS3BucketName=bucket, OutputS3KeyPrefix="speech/")
    task = response.get('SynthesisTask', {})
    return {
        'status': task.get('TaskStatus', 'failed'),
        'id': task.get('TaskId', ''),
        'hash': text_key,
        'bucket': bucket
    }

def filter_current_tasks(current_tasks):
    filtered_tasks = []
    for task in current_tasks:
        if task['status'] in ['scheduled', 'inProgress']:
            if all([task.get(k) for k in ['id', 'bucket', 'hash']]):
                filtered_tasks.append(task)
    return filtered_tasks

def awaiting_any_tasks(current_tasks):
    return len(filter_current_tasks(current_tasks)) > 0

def delete_full_key(s3_client, full_key, bucket):
    s3_client.delete_object(Bucket=bucket, Key=full_key)

def delete_hash(s3_client, text_key, bucket):
    delete_full_key(s3_client, make_key(text_key), bucket)

def list_hash(bucket):
    s3_client = boto3.client("s3")
    response = s3_client.list_objects_v2(Bucket=bucket, Prefix=f"speech/")
    contents = response.get('Contents', None)
    if contents:
        return [c['Key'].split('/')[1].split('.')[0] for c in contents]
    return []

def do_sha1(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()

def yield_paths(data_path):
    yml_paths = data_path.glob('*/*.yml')
    yaml_paths = data_path.glob('*/*.yaml')
    for path in itertools.chain(yml_paths, yaml_paths):
        yield path

def yield_texts(paths):
    for path in paths:
        with open(path, 'r') as op:
            parsed = yaml.load(op, Loader=yaml.FullLoader)
            exhibit = parsed.get('Exhibit', {})
            stories = exhibit.get('Stories', [])
            header = exhibit.get('Header', '')
            if len(header):
                yield (path, 'header', header)
            for s_id, s in enumerate(stories):
                waypoints = s.get('Waypoints', [])
                for w_id, w in enumerate(waypoints):
                    if len(w['Description']):
                        yield (path, f'{s_id}:{w_id}', w['Description'])

if __name__ == "__main__":

    s3_client = boto3.client("s3")
    polly_client = boto3.client('polly')
    parser = argparse.ArgumentParser()
    parser.add_argument("bucket")
    args = parser.parse_args()
    bucket = args.bucket

    try:
        list_hash(bucket)
    except botocore.exceptions.NoCredentialsError as e:
        print('No Available AWS Credentials')
        print(e)
        sys.exit(0)

    root = pathlib.Path(__file__).resolve().parents[1]
    paths = [p for p in yield_paths(root / "_data")]
    sha1_texts = {do_sha1(t):(p,k,t) for (p,k,t) in yield_texts(paths)}

    needed_sha1 = set(sha1_texts.keys())
    existing_sha1 = set(list_hash(bucket))
    current_tasks = []

    print(f'{len(needed_sha1)} mp3 files total, {len(existing_sha1)} mp3 files on s3')
    for h in needed_sha1 - existing_sha1:
        path, key, text = sha1_texts[h]
        latest_task = upload_hash_async(polly_client, text, h, bucket)
        current_tasks.append(latest_task)
        print(f'scheduled upload of {path} {key} to {h}')
    for h in existing_sha1 - needed_sha1:
        delete_hash(s3_client, h, bucket)
        print(f'deleted {h}')

    while awaiting_any_tasks(current_tasks):
        filtered_tasks = filter_current_tasks(current_tasks)
        print(f'Checking {len(filtered_tasks)} scheduled uploads...')
        for task in filtered_tasks:
            h = task['hash']
            task_id = task['id']
            task_bucket = task['bucket']
            response = polly_client.get_speech_synthesis_task(TaskId=task_id)

            new_task = response.get('SynthesisTask', {})
            task['status'] = new_task.get('TaskStatus', task['status'])
            source_full_uri = new_task.get('OutputUri', '')
            source_key = source_full_uri.split(task_bucket + '/')[-1]
            source_uri = f'/{task_bucket}/{source_key}'

            if source_key and task['status'] == 'completed':
                s3_client.copy_object(ACL="public-read", ContentType="audio/mpeg", StorageClass="REDUCED_REDUNDANCY",
                                      Bucket=task_bucket, Key=make_key(h), CopySource=source_uri)
                delete_full_key(s3_client, source_key, bucket)
                print(f'Finished upload to {h}')
        time.sleep(5)
