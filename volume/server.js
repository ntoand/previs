// require variables to be declared
'use strict';

// node: built-in
var fs            = require('fs');               // filesystem access
var os            = require('os');               // operating system access
var path          = require('path');             // file path management
var readline      = require('readline');         // to build an evaluation loop
var url           = require('url');              // parses urls
var exec          = require('child_process').exec;
var express       = require('express');
var app 		  = require('express')();
var http 		  = require('http').Server(app);
var io 			  = require('socket.io')(http);
var formidable 	  = require('formidable')
var bodyParser = require('body-parser');

var myutils	      = require('./src/node-utils');
var mydaris		  = require('./src/node-daris');
var mylocalupload = require('./src/node-localupload');

// ===== INITIALISATION ======
var scripts_dir = './src';
var tiff_data_dir = './public/data/tiff/';

app.use(express.static('public'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//app.listen(3000, function () {
http.listen(3000, function(){
	console.log('Listening on port 3000!');
});

// ===== REST SERVICES =======
// ===== LOCAL UPLOAD  =======
app.post('/localupload', function (req, res) {
	console.log('receive and process .zip file');

	var form = new formidable.IncomingForm(),
		files = [],
	  	fields = [];

	  	form.uploadDir = tiff_data_dir;
	  	form.encoding = 'utf-8';
	  	form.multiples = false;
	  	form.keepExtensions = true;

	  	form
	  	.on('field', function(field, value) {
	    	console.log(field, value);
	    	fields.push([field, value]);
	  	})
	  	.on('file', function(field, file) {
	    	console.log(field);
	    	console.log(file.name);
	    	console.log(file.path);
	    	files.push([field, file]);
	  	})
	  	.on('end', function() {
	    	console.log('-> upload done');
	    	var filebase = path.parse(files[0][1].path).base;
	    	res.redirect('local.html?file=' + filebase);
	    });

	form.parse(req);

	return;
});

// ===== DARIS SELECT  =======
app.post('/rest/login', function (req, res) {

	var domain = req.body.domain;
	var user = req.body.user;
	var password = req.body.password;
	//console.log(domain + ' ' + user + ' ' + password);

	var cmd = 'cd ' + scripts_dir + ' && python run_daris.py -t logon -a ' + domain + '/' + user + '/' + password;
    console.log(cmd);
    exec(cmd, function(err, stdout, stderr) 
    {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			console.log(err);
			res.setHeader('Content-Type', 'application/json');
    		res.send(JSON.stringify({ status: "error", result: "Cannot run login" }, null, 4));
			return;
		}
		res.setHeader('Content-Type', 'application/json');
    	res.send(stdout);
    });
});

app.get('/rest/logoff', function (req, res) {
	var sid = req.query.sid;

	var cmd = 'cd ' + scripts_dir + ' && python run_daris.py -t logoff -s' + sid;
    console.log(cmd);
    exec(cmd, function(err, stdout, stderr) 
    {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			console.log(err);
			res.setHeader('Content-Type', 'application/json');
    		res.send(JSON.stringify({ status: "error", result: "Cannot run logoff" }, null, 4));
			return;
		}
		res.setHeader('Content-Type', 'application/json');
    	res.send(stdout);
    });
});

app.get('/rest/projects', function (req, res) {
	var sid = req.query.sid;

	var cmd = 'cd ' + scripts_dir + ' && python run_daris.py -t projects -s ' + sid;
    console.log(cmd);
    exec(cmd, function(err, stdout, stderr) 
    {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			console.log(err);
			res.setHeader('Content-Type', 'application/json');
    		res.send(JSON.stringify({ error: "Cannot get projects" }, null, 4));
			return;
		}
		res.setHeader('Content-Type', 'application/json');
    	res.send(stdout);
    });
});

app.get('/rest/members', function (req, res) {
	var cid = req.query.cid;
	var sid = req.query.sid;
	console.log(cid);

	var cmd = 'cd ' + scripts_dir + ' && python run_daris.py -t members -s ' + sid + ' -c ' + cid;
    console.log(cmd);
    exec(cmd, function(err, stdout, stderr) 
    {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			console.log(err);
			res.setHeader('Content-Type', 'application/json');
    		res.send(JSON.stringify({ error: "Cannot get members" }, null, 4));
			return;
		}
		res.setHeader('Content-Type', 'application/json');
    	res.send(stdout);
    });
});

// ===== SOCKET IO ===========
io.on('connection', function (socket) {
	console.log("A client connected!");

	socket.on('disconnect', function(){
    	console.log('user disconnected');
  	});

  	socket.on('viewdataset', function (data) {
  		console.log(data);
  		mydaris.downloadData(io, data);
  	});

  	socket.on('processuploadfile', function (data) {
  		console.log(data);
  		mylocalupload.processUploadFile(io, data);
  	});

  	socket.on('searchdataset', function(data) {
  		console.log(data);
  		mydaris.searchDataset(io, data);
  	});
});

