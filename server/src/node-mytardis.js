'use strict';

var https       = require('https');
var myutils 	= require('./node-utils');

// main entry
function processMytardis(io, data) {
    if (data.task === 'get_json') {
        getJson(io, data);
    }
}

function genOptions(parameters) {
    var headers = {};
    if(typeof parameters.apikey !== 'undefined' && parameters.apikey !== '' ) {
        headers = {
            "Authorization": "ApiKey " + parameters.apikey,
            "Content-Type": "application/json",
            "Accept": "application/json"
        };
    }
    else {
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };
    }
    //console.log(headers);
    return {
        host: parameters.host,
        path: parameters.path,
        headers: headers
    }
}

function getJson(io, data) {
    
    //console.log(genOptions(parameters));
    https.request(genOptions(data), function(res) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        if(res.statusCode !== 200) {
            myutils.packAndSend(io, 'processmytardis', {status: 'error', task: data.task, datatype: data.datatype, result: 'Cannot get json data', detail: res});
            return;
        }
        var str = ''
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            //console.log('BODY: ' + chunk);
            str += chunk;
        });
        res.on('end', function () {
            myutils.packAndSend(io, 'processmytardis', {status: 'done', task: data.task, datatype: data.datatype, result: JSON.parse(str)});
        });
    }).end();
}

// EXPORT
module.exports.processMytardis = processMytardis;

