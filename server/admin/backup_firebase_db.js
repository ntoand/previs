var FilebaseManager   = require('../src/node-firebase');
var object = new FilebaseManager();

let backup_dir;
if (process.env.NODE_ENV === "production")  {
   backup_dir='/dataprevis/data/backup/db/';
}
else {
   backup_dir='/mnt/data/git/previs/server/public/data/backup/db/';
}

var d = new Date();
var backup_file = backup_dir + new Date().toISOString() + '.json';
console.log('Backup to file: ', backup_file);

object.getAllTags(function(err, res) {
   if(err) {
      console.log(err);
      return;
   }
   
   console.log(res);
   var json = JSON.stringify(res, null, 4);
   var fs = require('fs');
   fs.writeFile(backup_file, json, 'utf8', function(err) {
      if(err) console.log(err);
      else console.log('done');      
   });

});