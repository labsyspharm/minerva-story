# Minerva Story 

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
