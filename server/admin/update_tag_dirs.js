/*
DONT RUN THIS SCRIPT
The script is implemented to update directories' names to match with dir in database
*/
var fs = require('fs');
var FilebaseManager   = require('../src/node-firebase');
var object = new FilebaseManager();
var tagpath = '';

if (process.env.NODE_ENV === "production")  {
   console.log('Mode: production')
   tagpath = '';
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
   
   for(var i=0; i < res.length; i++) {
        const data = res[i].data;
        const tag = data.tag;
        const dir = data.dir;
        console.log(tag, dir);
        if (fs.existsSync(tagpath + tag)) {
            console.log(tagpath + tag, tagpath + dir);
            fs.renameSync(tagpath + tag, tagpath + dir);
        }
   }
});

