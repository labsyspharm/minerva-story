```bash
npm install doca -g
rm -rf exhibit
doca init -i schema -o exhibit
rm exhibit/getting-started.json
cp schemas.js exhibit/schemas.js
cp config.js exhibit/config.js
cd exhibit
npm install
npm run build
```

See the generated [json-schema documentation](./exhibit/build/index.html)
