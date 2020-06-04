#!/usr/bin/env sh

set -e

npm run docs:build

cd docs/.vuepress/dist

echo 'cheers-mp.com' > CNAME

git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:cheers-mp/cheers-mp.git master:gh-pages

cd -
