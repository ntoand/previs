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

module.exports.fileExists = fileExists;
module.exports.trim = trim;