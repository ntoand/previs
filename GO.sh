#!/bin/sh

# run from previs root dir
dir=`pwd`

cd ${dir}/client
npm run build

rm -rf ${dir}/server/dist
mv ${dir}/server/dist-dev ${dir}/server/dist
cd ${dir}/server/dist
ln -s ${dir}/server/public/data .
ln -s ${dir}/server/public/sharevol .
ln -s ${dir}/server/public/meshviewer .
ln -s ${dir}/server/public/imageviewer .
ln -s ${dir}/server/public/pointviewer .

cd ${dir}/server/dist/sharevol
unlink data
ln -s ${dir}/server/public/data .

cd ${dir}/server/dist/meshviewer
unlink data
ln -s ${dir}/server/public/data .

cd ${dir}/server/dist/imageviewer
unlink data
ln -s ${dir}/server/public/data . 

cd ${dir}/server/dist/pointviewer
unlink data
ln -s ${dir}/server/public/data . 

cd ${dir}/server
NODE_ENV=production node server.js
