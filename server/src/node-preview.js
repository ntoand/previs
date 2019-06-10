// require variables to be declared
'use strict';

var myutils 	= require('./node-utils');
const winston   = require('winston');

function processTag(io, data) {
    
    winston.info('node-preview processTag email: %s', data.userEmail);
    if(data.userEmail !== undefined) {
        data.db.getTagsByUserEmail(data.userEmail, function(err, res){
           if(err) {
               myutils.packAndSend(io, 'processtag', {status: 'error', result: err});
    		   return;
           } 
           myutils.packAndSend(io, 'processtag', {status: 'done', result: res});
        });
    }
    else { //deprecated
        data.db.getTag(data.tag, function(err, res){
            if (err) {
                myutils.packAndSend(io, 'processtag', {status: 'error', result: err});
    			return;
    		} 
    		myutils.packAndSend(io, 'processtag', {status: 'done', result: res});
        });
    }
}

module.exports.processTag = processTag;