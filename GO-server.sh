#!/bin/sh

# run from previs root dir
dir=`pwd`

cd ${dir}/server
NODE_ENV=production forever server.js
