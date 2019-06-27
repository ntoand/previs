/*
DONT RUN THIS SCRIPT
The script is implemented to upgrade and clean up firebase database to support dir and password
To run before upgrading to v0.9.0
*/
var crypto 		= require('crypto');
var FilebaseManager   = require('../../src/node-firebase');
var object = new FilebaseManager();

if (process.env.NODE_ENV === "production")  {
   console.log('Mode: production')
}
else {
   console.log('Mod: development');
}

object.getAllTags(function(err, res) {
   if(err) {
      console.log(err);
      return;
   }
   
   updateTag(res, 0);
});

function updateTag(tags, index=0) {
    if(index >= tags.length) return;

    var tag = tags[index];
    // update tag
    data = tag.data;
    console.log(data);
    if(!tag.data.dir) {
        var dir = data.tag + '_' + crypto.randomBytes(3).toString('hex');
    
        delete data.data;
        const type = tag.data.type;
        if(data.volumes)
        {
            delete data.volumes[0].data_dir;    

            if(type === 'volume') {
                delete data.volumes[0].json;
                delete data.volumes[0].json_web;
                delete data.volumes[0].png;
                delete data.volumes[0].thumb;
                delete data.volumes[0].xrw;
            }
            else if(type === 'mesh') {
                delete data.volumes[0].initscr;
                delete data.volumes[0].json;
            }
            else if(type === 'point') {
                delete data.volumes[0].potree_url;
            }
            else if(type === 'image') {
    
            }
        }
        // add new
        data.dir = dir;
        if(type === 'mesh' || type === 'point' || type === 'image')
            data.processedData = 'data/tags/' + dir + '/' + type + '_processed.zip';
        else 
            delete data.processedData;
        
        if(data.volumes)
            data.volumes[0].subdir = type + '_result';

        console.log(JSON.stringify(data, null, 4));
        object.setTag(data.tag, data, function(err, res) {
            if(err) {
               console.log(err);
               return;
            }
            updateTag(tags, index+1);
        });
    }
    else {
        console.log('Skip ', tag.data.tag);
        // go to next tag
        updateTag(tags, index+1);
    }
}