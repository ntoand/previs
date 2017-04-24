'use strict';

var fs 			= require('fs');
var dbmanager   = require('./node-dbmanager');
var path        = require('path');
var config		= require('./node-config').config; 

// ===============================
function getTags(io, data) {

    var tags = [];
  
    dbmanager.getTags(function(err, rows) { 
        //console.log(err);
        //console.log(rows);
        if(err) {
            io.emit('admingettags', {status: 'error', result: 'cannot_get_tags', detail: 'cannot_get_tags'});
            return;
        }
        for (var i=0, l=rows.length; i < l; i++) {
            
            var tag = rows[i].tag;
            var jsonfile = config.info_dir + tag + '.json';
            console.log(jsonfile);
            
            var t = {};
            t.tag = tag;
            try {
                var jsondata = fs.readFileSync(jsonfile, 'utf8');
                var obj = JSON.parse(jsondata);
    		    t.type = obj.type;
    		    t.source = obj.source;
    		    var d = new Date(obj.date);
    		    t.date = d.toString();
    		    t.size = obj.volumes[0].res.toString();
    		    t.data = rows[i].data;
                tags.push(t);
                
            } catch (err) {
                t.type = 'invalid';
    		    t.source = 'invalid';
    		    t.date = 'invalid';
    		    t.size = 'invalid';
    		    t.data = 'invalid';
    		    tags.push(t);
                continue;
                // If the type is not what you want, then just throw the error again.
                //if (err.code !== 'ENOENT') continue;//throw err;
                // Handle a file-not-found error
            }
        }
        console.log(tags);
        io.emit('admingettags', {status: 'done', result: tags});
    });
}


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

// ===============================
function deleteTags(io, data) {
    for (var i=0, l=data.length; i < l; i++) {
        var tag =  data[i].tag;
        if(data[i].source === 'localupload') {
            //delete data
            var basename = path.basename(data[i].data, '.zip');
	        var result_dir = config.local_data_dir + basename + '_result';
	        var zip_file = config.local_data_dir + data[i].data;
	        var jsonfile = config.info_dir + tag + '.json';
	        //console.log(result_dir);
	        //console.log(zip_file);
	        //console.log(json_file);
	        deleteFolderRecursive(result_dir);
	        fs.unlinkSync(zip_file);
	        fs.unlinkSync(jsonfile);
        }
        else if(data[i].source === 'daris') {
            io.emit('admindeletetags', {status: 'error', result: data, detail: 'not implemented'});
            return;
        }
        
        //delete tag in database
        dbmanager.deleteTag(tag, function(err) {
            if(err)
                io.emit('admindeletetags', {status: 'error', result: data, detail: 'failed to delete tag'});
            else
                io.emit('admindeletetags', {status: 'done', result: data});
        });
    }
}

module.exports.getTags = getTags;
module.exports.deleteTags = deleteTags;