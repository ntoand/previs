#!/bin/sh

# run from previs root dir
dir=`pwd`

mkdir -p /previs/server/public/data/tags

cp ${dir}/client-script/previs-upload.py ${dir}/server/dist/assets/previs-upload.py

cd ${dir}/server/dist
ln -s ${dir}/server/public/data .
ln -s ${dir}/server/public/sharevol .
ln -s ${dir}/server/public/meshviewer .
ln -s ${dir}/server/public/imageviewer .
ln -s ${dir}/server/public/pointviewer .
ln -s ${dir}/server/public/qrcode .

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
NODE_ENV=production IP=0.0.0.0 node server.js
