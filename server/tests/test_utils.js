var myutils 	= require('../src/node-utils');
const test = 0;

if(test === 0) {
  var tagdir = '/data/git/previs/server/public/data/tags/point0_manual';
  var out_dir = tagdir + '/point_result';
  myutils.zipDirectory(out_dir + '/pointclouds/potree', 'potree', tagdir + '/point_processed.zip', function(err){
	  if(err) console.log(err);
	  console.log('Done');
  });
}

else if(test === 1) {
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
}