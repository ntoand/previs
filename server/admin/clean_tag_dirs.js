/*
DONT RUN THIS SCRIPT
The script is implemented to clean up directories with tag reference from the database
*/
var fs = require('fs');
var FilebaseManager   = require('../src/node-firebase');
var object = new FilebaseManager();
var tagpath = '';
var trashdir = '';

if (process.env.NODE_ENV === "production")  {
   console.log('Mode: production')
   tagpath = '/home/ubuntu/git/previs/server/public/data/tags/';
   trashdir = '/dataprevis/_trash/20190603/';
}
else {
   console.log('Mod: development');
   tagpath = '/home/ubuntu/git/previs/server/public/data/tags/';
   trashdir = '/home/ubuntu/git/previs/server/public/data/_trash/';
}

// get list of directories
const { lstatSync, readdirSync } = require('fs');
const { join } = require('path');
const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)).filter(isDirectory);


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
            console.log(dirname);
            console.log(dirname, dirs[i], trashdir+dirname);
            if (fs.existsSync(dirs[i])) {
                fs.renameSync(dirs[i], trashdir+dirname);
                count = count + 1;
            }
       }
   }
   console.log('moved',count, 'items');
   
});