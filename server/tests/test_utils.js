var myutils 	= require('../src/node-utils');

//var tagdir = '/home/ubuntu/git/previs/server/public/data/tags/demop1'
//myutils.zipDirectory(tagdir + '/point_result/pointclouds/potree', 'potree', tagdir + '/point_processed.zip');

// test send email
var data = {
  datatype: 'volume',
  tag: '123abc',
  settings: {
    sendEmail: true
  },
  userDetails: {
    uid: 'id',
    email: 'toan.nguyen@monash.edu',
    displayName: 'Toan Nguyen'
  },
};
myutils.sendEmail('ready', data);