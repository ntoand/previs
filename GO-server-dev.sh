#!/bin/sh

# create a virtual display for meshlab
killall Xvfb
Xvfb -screen 0 640x480x24 :100 &

# run from previs root dir
dir=`pwd`

cd ${dir}/server
NODE_ENV=development node server.js
