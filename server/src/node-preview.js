// require variables to be declared
'use strict';

var myutils 	= require('./node-utils');

function processTag(io, data) {
    
    console.log('node-preview - processTag');
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