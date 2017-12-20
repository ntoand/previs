// require variables to be declared
'use strict';

var dbmanager   = require('./node-mongodb');

function processTag(io, data) {
    
    console.log('node-preview - processTag');
    dbmanager.getTag(data.tag, function(err, res){
        if (err) {
			io.emit('message', { action: 'processtag', data: {status: 'error', result: err } });
			//throw err;
			return;
		} 
		io.emit('message', { action: 'processtag', data: { status: 'done', result: res } });
    });
}

module.exports.processTag = processTag;