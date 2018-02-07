// require variables to be declared
'use strict';

var fs = require('fs');
var https = require('https');

function fileExists(filepath){
    try
    {
        return fs.statSync(filepath).isFile();
    }
    catch (err)
    {
        return false;
    }
}

function trim(str) {
    return str.replace(/ +(?= )/g,'');
}

function packAndSend(io, action, data) {
    io.emit('message', {action: action, data: data});
}

function createDirSync(dir) {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

function moveFile(oldPath, newPath, callback) {
    fs.rename(oldPath, newPath, function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                copy();
            } else {
                callback(err);
            }
            return;
        }
        callback();
    });
    
    function copy() {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on('error', callback);
        writeStream.on('error', callback);

        readStream.on('close', function () {
            fs.unlink(oldPath, callback);
        });

        readStream.pipe(writeStream);
    }
}

function extractGoogleId(url) {
	var id = '';
	
	// first try with full link e.g. https://drive.google.com/file/d/17cgCGpOo-91kSkMe9limNZtKIV7LtIaq/view?usp=sharing
	var strs = url.split('/');
	for(var i=0; i < strs.length-1; i++) {
		if (strs[i] === 'd') {
			id = strs[i+1];
			break;
		}
	}
	if (id === '' || id.length < 25) {
		//retry with short link e.g. https://drive.google.com/open?id=17cgCGpOo-91kSkMe9limNZtKIV7LtIaq
		strs = url.split('=');
		console.log(strs);
		for (var i=0; i < strs.length-1; i++) {
			if (strs[i].indexOf('?id') !== -1) {
				id = strs[i+1];
				break;
			}
		}
	}
	
	return id;
}

function downloadFileHttps(url, apikey, dest, cb) {
    
    var opts = require('url').parse(url);
    if(typeof apikey !== 'undefined' && apikey !== '') {
        opts.headers = {
          'User-Agent': 'javascript',
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": "ApiKey " + apikey,
        };
    } else {
        opts.headers = {
          'User-Agent': 'javascript',
          "Content-Type": "application/json",
          "Accept": "application/json"
        };
    }
    var file = fs.createWriteStream(dest);
    var request = https.get(opts, function(response) {
        console.log(response);
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);  // close() is async, call cb after close completes.
        });
    }).on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (cb) cb(err.message);
    });
};

function zipDirectory(dir, dirname, zipfile, cb) {
    
    var archiver = require('archiver');
    var archive = archiver('zip');
    
    var output = fs.createWriteStream(zipfile);
    
    archive.on('error', function(err) {
      throw err;
      cb(err, '');
      return;
    });
    
    output.on('end', function() {
      console.log('Data has been drained');
      cb(null, 'end');
    });
    
    archive.pipe(output);
    if(dirname === '') {
        archive.directory(dir, false);
    }
    else {
        archive.directory(dir, dirname);
    }
    archive.finalize();
}

module.exports.fileExists = fileExists;
module.exports.trim = trim;
module.exports.packAndSend = packAndSend;
module.exports.createDirSync = createDirSync;
module.exports.moveFile = moveFile;
module.exports.extractGoogleId = extractGoogleId;
module.exports.downloadFileHttps = downloadFileHttps;
module.exports.zipDirectory = zipDirectory;