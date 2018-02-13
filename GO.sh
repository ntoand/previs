#!/bin/sh

# create a virtual display for meshlab
killall Xvfb
Xvfb -screen 0 640x480x24 :100 &

# run from previs root dir
dir=`pwd`

cd ${dir}/client
npm run build

rm -rf ${dir}/server/dist
mv ${dir}/server/dist-dev ${dir}/server/dist
cd ${dir}/server/dist
ln -s ${dir}/server/public/data .
ln -s ${dir}/server/public/sharevol .
ln -s ${dir}/server/public/viewer .
ln -s ${dir}/server/public/admin .

cd ${dir}/server/dist/sharevol
unlink data
ln -s ${dir}/server/public/data .

cd ${dir}/server/dist/viewer
unlink data
ln -s ${dir}/server/public/data .

cd ${dir}/server
node server.js