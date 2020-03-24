import hashlib
import pathlib
import botocore
import boto3
import yaml
import sys
import argparse
from bs4 import BeautifulSoup
from markdown import markdown

def upload_hash(text_md, text_key, bucket):
    polly_client = boto3.client('polly')
    text_html = BeautifulSoup(markdown(text_md), features="html.parser")
    text = ''.join(text_html.findAll(text=True))
    response = polly_client.synthesize_speech(Text=text, OutputFormat="mp3", VoiceId="Matthew")
    audio = response['AudioStream'].read()
    s3_client = boto3.client("s3")
    s3_client.put_object(ACL="public-read", Body=audio, Bucket=bucket, ContentType="audio/mpeg", StorageClass="REDUCED_REDUNDANCY", Key=f"speech/{text_key}.mp3")

def delete_hash(text_key, bucket):
    s3_client = boto3.client("s3")
    s3_client.delete_object(Bucket=bucket, Key=f"speech/{text_key}.mp3")

def list_hash(bucket):
    s3_client = boto3.client("s3")
    response = s3_client.list_objects_v2(Bucket=bucket, Prefix=f"speech/")
    contents = response.get('Contents', None)
    if contents:
        return [c['Key'].split('/')[1].split('.')[0] for c in contents]
    return []

def do_sha1(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()

def yield_texts(data_path):
    cycif_paths = data_path.glob('*/*.yml')
    for path in cycif_paths:
        with open(path, 'r') as op:
            parsed = yaml.load(op, Loader=yaml.FullLoader)
            exhibit = parsed.get('Exhibit', {})
            stories = exhibit.get('Stories', [])
            header = exhibit.get('Header', '')
            if len(header):
                yield header
            for s_id, s in enumerate(stories):
                waypoints = s.get('Waypoints', [])
                for w_id, w in enumerate(waypoints):
                    if len(w['Description']):
                        yield w['Description']

if __name__ == "__main__":
  
    parser = argparse.ArgumentParser()
    parser.add_argument("bucket")
    args = parser.parse_args()
    bucket = args.bucket

    try:
        list_hash(bucket)
    except botocore.exceptions.NoCredentialsError as e:
        print('No Available AWS Credentials')
        sys.exit(0)
 
    root = pathlib.Path(__file__).resolve().parents[1]
    texts = [t for t in yield_texts(root / "_data")]
    sha1_texts = {do_sha1(t):t for t in texts} 

    needed_sha1 = set(sha1_texts.keys())
    existing_sha1 = set(list_hash(bucket))

    for h in needed_sha1 - existing_sha1:
        upload_hash(sha1_texts[h], h, bucket)
        print(f'uploaded {h}')
    for h in existing_sha1 - needed_sha1:
        delete_hash(h, bucket)
        print(f'deleted {h}')
    
