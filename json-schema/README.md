```bash
npm install doca -g
rm -rf exhibit
doca init -i schema -o exhibit
cd exhibit
npm install
npm run build
```

See the generated [json-schema documentation](./exhibit/build/index.html)
