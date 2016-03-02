// require variables to be declared
'use strict';

// node: built-in
var http 		  = require('http');
var socketio 	  = require('socket.io');
var express 	  = require('express');
var path          = require('path');
var fs 			  = require('fs'); 

var config 		  = require('./src/node-config').config;

// ===== INITIALISATION ======
var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

var options = {
  index: "cave2.html"
};

app.use(express.static(path.resolve(__dirname, config.public_dir), options));

server.listen(process.env.PORT || config.cave2_port, process.env.IP || "0.0.0.0", function(){
	var addr = server.address();
  	console.log("previs cave2 server listening at", addr.address + ":" + addr.port);
});

// ===== SOCKET IO ===========
io.on('connection', function (socket) {
	console.log("A client connected!");

	socket.on('disconnect', function(){
    	console.log('user disconnected');
  	});

	socket.on('processtag', function(data) {
		console.log(data);
		processTag(io, data);
	});
    
});

function processTag(io, data) {
	var jsonfile = config.info_dir + data.tag + '.json';
	fs.readFile( jsonfile, 'utf8', function (err, jsondata) {
		if (err) {
			io.emit('processtag', { status: 'error', result: err });
			//throw err;
			return;
		} 
		var obj = JSON.parse(jsondata);
		io.emit('processtag', { status: 'done', result: obj });
	});
}
