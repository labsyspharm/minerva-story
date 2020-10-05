# Minerva Story 

## Minerva Repository Structure

### Minerva Story
The GitHub Pages site build is stored at [minerva-story](https://github.com/labsyspharm/minerva-story). The source code for the minified bundle is stored at [minerva-browser](https://github.com/labsyspharm/minerva-browser).

### Minerva Author
The Python Flask server along with automated testing is stored at [minerva-author](https://github.com/labsyspharm/minerva-author). The React UI is stored at [minerva-author-ui](https://github.com/labsyspharm/minerva-author-ui)

## Running Minerva Story

### Clone repository

```bash
git clone git@github.com:labsyspharm/minerva-story.git
cd minerva-story
```

### Install npm

Download and install [Node.js for your platform](https://nodejs.org/en/).

Install `npx` to run the `http-server`:

```bash
npm install -g npx
```

### Run local server

In the project folder, run command:
```bash
npx http-server -p 8000
```

Open browser to localhost:8000

## Rebuilding minerva-browser

If you update the version of Minerva Browser in `package.json`, you will need to rebuild with webpack as shown below:
```
npm i
npm run build
```

Then you can run the local server with `npx http-server -p 8000` as normal.
