var myutils 	= require('../src/node-utils');

var tagdir = '/home/ubuntu/git/previs/server/public/data/tags/demop1'
myutils.zipDirectory(tagdir + '/point_result/pointclouds/potree', 'potree', tagdir + '/point_processed.zip');