var myutils 	= require('../src/node-utils');

var tagdir = '/home/ubuntu/git/previs/server/public/data/tags/demoi1'
myutils.zipDirectory(tagdir + '/image_result', '', tagdir + '/image_processed.zip');