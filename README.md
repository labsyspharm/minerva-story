# Minerva Story 

## Local build instructions

### Install dependencies

Install Ruby 2.6.6 from https://www.ruby-lang.org
(On Windows, install Ruby+devkit)

```bash
gem install jekyll bundler
bundle install
```

### Run development server

In the project folder, run command:
```bash
bundle exec jekyll serve
```

Open browser to localhost:4000

## Rebuilding minerva-browser

If you update the version of Minerva Browser in `package.json`, you will need to rebuild with webpack as shown below:
```
npm i
npm run build
```

Then you can run the development server with `bundle exec jekyll serve` as normal.
