#!/bin/sh

# run from previs root dir
dir=`pwd`

# build client app first to reduce down time
if [ ! -d ${dir}/server/dist-dev ]; then
    echo "Build client app"
    cd ${dir}/client
    npm run build
fi

cp ${dir}/client-script/previs-upload.py ${dir}/server/dist/assets/previs-upload.py

rm -rf ${dir}/server/dist
mv ${dir}/server/dist-dev ${dir}/server/dist
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
NODE_ENV=production forever server.js
