// require variables to be declared
'use strict';

var fs = require('fs');

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


module.exports.fileExists = fileExists;
module.exports.trim = trim;
module.exports.packAndSend = packAndSend;
module.exports.createDirSync = createDirSync;
module.exports.moveFile = moveFile;