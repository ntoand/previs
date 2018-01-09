var myutils = require('../src/node-utils');

myutils.downloadFileHttps('https://store.erc.monash.edu/api/v1/dataset_file/5816173/download/', '5816173.zip', function(err) {
   if(err) {
       console.log(err);
   }
});