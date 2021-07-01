### About this script

This script runs AWS Polly text to speech to create and store MP3 audio by reading each
waypoint `Description` available in your Minerva Story's exhibit.json.

### Requirements

**This script requires** you have a Minerva Story configuration file (e.g. `/PATH/TO/MINERVA/STORY/exhibit.json`)
and a publicly accessable AWS S3 bucket (e.g. `NAME_OF_YOUR_BUCKET`), as well as the credentials necessary to write to that bucket.

### Using this script

1. [Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html).

2. [Configure your AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-config).

3. Clone this repository:

```
git clone git@github.com:labsyspharm/minerva-story.git
cd minerva-story/scripts
```

4. Install the python requirements:

```
pip install -r requirements.txt
```

4. Run the script, filling in the two arugements:
```
python run_polly.py NAME_OF_YOUR_BUCKET /PATH/TO/MINERVA/STORY/exhibit.json
```

After the script is complete, each  waypoint `Description` will be stored as an MP3 file in your AWS S3 bucket.
To enable Minerva Story to access the bucket, pass the `speech_bucket` parameter when initializing Minerva Browser:
```
window.viewer = MinervaStory.default.build_page({
    embedded: true,
    id: "minerva-browser",
    exhibit: "exhibit.json",
    speech_bucket: "NAME_OF_YOUR_BUCKET"
});
```
