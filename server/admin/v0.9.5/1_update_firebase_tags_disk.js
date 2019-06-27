/*
DONT RUN THIS SCRIPT
The script is implemented to update disk space of tags
To run before upgrading to v0.9.5
*/
var FilebaseManager   = require('../../src/node-firebase');
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

object.getAllTags(function(err, res) {
   if(err) {
      console.log(err);
      return;
   }
   
   updateTagDisk(res, 0);
});

function updateTagDisk(tags, index=0) {
    if(index >= tags.length) return;

    var tag = tags[index];
    // update tag
    data = tag.data;
    console.log(data);

    const getSize = require('get-folder-size');
    const path = tagpath + data.dir;
    getSize(path, (err, size) => {
        if (err) {
            callback(err);
            return; 
        }
        const sizeMB = size / 1024 / 1024;
        object.updateTag(data.tag, {id: data.tag, disk: sizeMB}, function(err, res) {
            if(err) {
               console.log(err);
               return;
            }
            updateTagDisk(tags, index+1);
        });
    });
}