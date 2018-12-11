#!/bin/sh

# run from previs root dir
dir=`pwd`
cp ${dir}/client-script/previs-upload.py ${dir}/server/dist/assets/previs-upload.py

cd ${dir}/server
NODE_ENV=production forever server.js
