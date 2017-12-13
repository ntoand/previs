// require variables to be declared
'use strict';

var dbmanager   = require('./node-mongodb');

function processTag(io, data) {
    
    dbmanager.getTag(data.tag, function(err, res){
        if (err) {
			io.emit('processtag', { status: 'error', result: err });
			//throw err;
			return;
		} 
		io.emit('processtag', { status: 'done', result: res });
    });
}

module.exports.processTag = processTag;