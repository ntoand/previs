#!/bin/sh

# create a virtual desktop for meshlab
killall Xvfb
Xvfb -screen 0 640x480x24 :100 &

node ./server.js