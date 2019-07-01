/*
DONT RUN THIS SCRIPT
The script is implemented to clean up directories with tag reference from the database
*/
var fs = require('fs');
var path        = require('path');
var FilebaseManager   = require('../src/node-firebase');
var object = new FilebaseManager();
var tagpath = '';

if (process.env.NODE_ENV === "production")  {
   console.log('Mode: production')
   tagpath = '/home/ubuntu/git/previs/server/public/data/tags/';
}
else {
   console.log('Mod: development');
   tagpath = '/home/ubuntu/git/previs/server/public/data/tags/';
}

// get list of directories
const { lstatSync, readdirSync } = require('fs');
const { join } = require('path');
const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)).filter(isDirectory);

var deleteFolderRecursive = function(dir) {
     if( fs.existsSync(dir) ) {
          fs.readdirSync(dir).forEach(function(file,index){
          var curDir = path.join(dir, file);
          if(fs.lstatSync(curDir).isDirectory()) { // recurse
               deleteFolderRecursive(curDir);
          } else { // delete file
               fs.unlinkSync(curDir);
          }
          });
          fs.rmdirSync(dir);
     }
};

object.getAllTags(function(err, res) {
   if(err) {
        console.log(err);
        return;
   }
   
   // create tag dir dictionary
   var tagdir = {}
   for(var i=0; i < res.length; i++) {
        const data = res[i].data;
        const tag = data.tag;
        const dir = data.dir;
        tagdir[dir] = true;
   }
   console.log(tagdir);
   
   var dirs = getDirectories(tagpath);
   let count = 0;
   for(var i=0; i < dirs.length; i++) {
       let parts = dirs[i].split('/');
       let dirname = parts[parts.length-1];
       if(!dirname.includes('000000') && tagdir[dirname] !== true) {
            console.log(dirname, dirs[i]);
            count += 1
            if (fs.existsSync(dirs[i])) {
               deleteFolderRecursive(dirs[i]);
            }
       }
   }
   console.log('cleaned',count, 'items');
   
});