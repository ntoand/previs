// require variables to be declared
'use strict';

// node: built-in
var http 		  = require('http');
var socketio 	  = require('socket.io');
var express 	  = require('express');
var cors		  = require('cors');
var glob		  =	require("glob");

var path          = require('path');
var formidable 	  = require('formidable');
var bodyParser 	  = require('body-parser');
var fs 			  = require('fs');

var config 		  = require('./src/node-config').config;
var myadmin 	  = require('./src/node-admin');
var myupload	  = require('./src/node-upload');
var mytardis	  = require('./src/node-mytardis');
var myutils 	  = require('./src/node-utils');

var logFilename = "logs/combined.log";
if (process.env.NODE_ENV === "production")  {
	console.log("RUN PROD MODE");
	logFilename ='logs/combined_' + myutils.getTimeString() + '.log';
} else {
	console.log("RUN DEV MODE");
}

var FirebaseManager   = require('./src/node-firebase');
var fbmanager = new FirebaseManager();

// init default winston logger
const winston = require('winston');
winston.configure({
	format: winston.format.combine(
		winston.format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss'
		}),
		winston.format.errors({ stack: true }),
		winston.format.splat(),
		winston.format.json()
	),
	transports: [
		new winston.transports.File({ filename: logFilename }),
		new winston.transports.Console({ format: winston.format.simple() })
	]
});
winston.info('server starts');


process.argv.forEach(function (val, index, array) {
	winston.info(index + ': ' + val);
});


// ===== INITIALISATION ======
var app = express();
app.use(cors());
var server = http.createServer(app);
var io = socketio.listen(server);

app.use(express.static(path.resolve(__dirname, config.public_dir)));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//server.listen(process.env.PORT || config.port, process.env.IP || "0.0.0.0", function(){
server.listen(process.env.PORT || config.port, process.env.IP || "127.0.0.1", function(){
	var addr = server.address();
	winston.info("previs server listening at " + addr.address + ":" + addr.port);
});

// ===== REST SERVICES =======
// ===== LOCAL UPLOAD  =======
function doLocalUpload(req, res) {
	winston.info('doLocalUpload');
	var form = new formidable.IncomingForm(),
	files = [],
  	fields = [];

  	form.uploadDir = config.tags_data_dir;
  	form.encoding = 'utf-8';
  	form.multiples = false;
  	form.keepExtensions = true;

  	form
  	.on('field', function(field, value) {
    	winston.info(field, value);
    	fields.push([field, value]);
  	})
  	.on('file', function(field, file) {
    	winston.info(field);
    	winston.info(file);
    	files.push([field, file]);
  	})
  	.on('error', function(err) {
		winston.error(err);
		res.json({status: 'error', detail: err});
  	})
  	.on('end', function() {
    	winston.info('-> upload done');
    	var filebase = path.parse(files[0][1].path).base;
    	res.json({status: 'done', file: filebase});
    });

	form.parse(req);
}


app.post('/localupload', function (req, res) {
	winston.info('receive and process .zip file');
	
	var key = req.query.key;
	winston.info('localupload', key);
	// TODO: using key for web client upload
	const myio = {
		socket: null,
		res: res
	};
	if(key !== undefined && key !== null) {
		fbmanager.getKeyInfo(key, function(err, data) {
			if(err) {
				myutils.packAndSend(myio, 'processupload', {status: 'error', result: 'Invalid api key (processupload): ' + key});
			}
			else {
				doLocalUpload(req, res);
			}
		});
	}
	else {
		doLocalUpload(req, res);
	}
	return;
});


app.post('/rest/processupload', function (req, res) {
	//params = {"file", "key", "type", 'voxelSizeX', 'voxelSizeY', 'voxelSizeZ', 'channel', 'time', 'sendEmail'}
	var key = req.query.key;
	var file = req.query.file;
	winston.info('processupload ' + key + ' ' + file);
	const myio = {
		socket: null,
		res: res
	};
	fbmanager.getKeyInfo(key, function(err, keydata) {
		winston.error(err);
		winston.info(keydata);
		if(err) {
			myutils.packAndSend(myio, 'processupload', {status: 'error', result: 'Invalid api key (processupload): ' + key});
		}
		else {
			var data = {
				db: fbmanager,
				file: file,
				userDetails: {
					uid: keydata.id,
					email: keydata.email,
					displayName: keydata.name
				},
				datatype: req.query.type,
				settings: {
					voxelSizeX: parseFloat(req.query.voxelSizeX), 
					voxelSizeY: parseFloat(req.query.voxelSizeY), 
					voxelSizeZ: parseFloat(req.query.voxelSizeZ),
            		channel: parseInt(req.query.channel), 
            		time: parseInt(req.query.time), 
            		sendEmail: req.query.sendEmail === 'True'
				},
				uploadtype: 'restupload'
			};
			myupload.processUploadFile(myio, data);
		}
	});
	return;
});


app.post('/rest/adminlogin', function (req, res) {

	var user = req.body.user;
	var password = req.body.password;
	//console.log(user + ' ' + password);

	if(user != "admin" || password != "c4ve2016") {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({ status: "error", result: "Cannot run login" }, null, 4));
		return;
	}
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ status: "success", result: "Can login" }, null, 4));
});


//url/info?tag=tag
app.get('/rest/info', function (req, res) {
	var tag = req.query.tag;
	var key = req.query.key;
	winston.info(req.query);
	if(!key || !tag) {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({ status: "error", code: "100", result: "tag or api key is not provided" }, null, 4));
		return;
	}

	fbmanager.getKeyInfo(key, function(err, keydata) {
		winston.error(err);
		winston.info(keydata);
		if(err || keydata.type !== 'app') {
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({ status: "error", code: "100", result: "api key is nor provided or invalid" }, null, 4));
			return;
		}

		fbmanager.getTag(tag, function(err, info) { 
			winston.info(info);
			if(err || !info) {
				winston.error(err);
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({ status: "error", code: "100", result: "cannot get info" }, null, 4));
				return;
			}
			if(info.password) info.password = "******";
			res.setHeader('Content-Type', 'application/json');
			res.send(info);
		});
	});
	
});

app.post('/rest/info', function (req, res) {
	var tag = req.body.tag;
	var password = req.body.password;
	if(!tag) {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({ status: "error", code: "100", result: "no tag provided" }, null, 4));
		return;
	}
	winston.info('/rest/info POST ' + tag);
	
	let demoTags = ['000000_arteries_brain', '000000_galaxy', '000000_hoyoverde',
                    '000000_image_cmu1', '000000_mesh_baybridge', '000000_mesh_heart'];
    if(demoTags.includes(tag)) {
    	res.setHeader('Content-Type', 'application/json');
    	res.send(JSON.stringify({tag: tag, dir: tag}));
    	return;
    }
	
	fbmanager.getTag(tag, function(err, info) { 
		//console.log(info);
		if(err || !info) {
			winston.error(err);
			res.setHeader('Content-Type', 'application/json');
    		res.send(JSON.stringify({ status: "error", code: "100", result: "cannot get info" }, null, 4));
    		return;
		}
		if(info.password) {
			if(!password || password === '') {
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({ status: "error", code: "101", result: "password is required" }, null, 4));
				return;
			}
			if(info.password !== password) {
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({ status: "error", code: "102", result: "incorrect password" }, null, 4));
				return;
			}
			info.password = "******";
		}
		res.setHeader('Content-Type', 'application/json');
		res.send(info);
	});
});

app.get('*', function(req, res) {
    res.redirect('/');
});

// helper func
function createMsgData(action, msg) {
	let msgdata = msg;
	msgdata.action = action;
	msgdata.db = fbmanager;
	if(msgdata.userId === undefined) msgdata.userId = 'none';
	if(msgdata.userEmail === undefined) msgdata.userEmail = 'none';
	return msgdata;  
}

// ===== SOCKET IO ===========
io.on('connection', function (socket) {
	winston.info('A client connected');
	
	socket.on('disconnect', function(){
    	winston.info('user disconnected');
	});
	  
	// ==== client app messages ====
	// tag
	socket.on('admingettags', function(msg) {
		myadmin.getTagsByUserEmail({socket:socket, res:null}, createMsgData('admingettags', msg));
	});

	socket.on('adminupdatetag', function(msg) {
		myadmin.updateTag({socket:socket, res:null}, createMsgData('adminupdatetag', msg));
	});

	socket.on('adminupdatetagcollection', function(msg) {
		myadmin.updateTagCollection({socket:socket, res:null}, createMsgData('adminupdatetagcollection', msg));
	});

	socket.on('admindeletetags', function(msg) {
		myadmin.deleteTags({socket:socket, res:null}, createMsgData('admindeletetags', msg));
	});

	// collection
	socket.on('admingetcollections', function(msg) {
		myadmin.getCollectionsByUserEmail({socket:socket, res:null}, createMsgData('admingetcollections', msg));
	});

	socket.on('adminaddcollection', function(msg) {
		myadmin.addNewCollection({socket:socket, res:null}, createMsgData('adminaddcollection', msg));
	});

	socket.on('adminupdatecollection', function(msg) {
		myadmin.updateCollection({socket:socket, res:null}, createMsgData('adminupdatecollection', msg));
	});

	socket.on('admindeletecollection', function(msg) {
		myadmin.deleteCollection({socket:socket, res:null}, createMsgData('admindeletecollection', msg));
	});

	// sharing
	socket.on('adminupdateshareemail', function(msg) {
		myadmin.updateShareEmail({socket:socket, res:null}, createMsgData('adminupdateshareemail', msg));
	});

	// upload
	socket.on('processupload', function(msg) {
		myupload.processUpload({socket:socket, res:null}, createMsgData('processupload', msg));
	});

	socket.on('processmytardis', function(msg) {
		mytardis.processMytardis({socket:socket, res:null}, createMsgData('processmytardis', msg));
	});

	// user
	socket.on('admingetorcreateuser', function(msg) {
		myadmin.getOrCreateUser({socket:socket, res:null}, createMsgData('admingetorcreateuser', msg));
	});
	
	socket.on('processapikey', function(msg) {
		processApiKey({socket:socket, res:null}, createMsgData('processapikey', msg));
	});

  	
    // ==== sharevol ====
	socket.on('savedatajson', function(data) {
		winston.info(data);
		saveDataJson(socket, data);
	});

	// ==== meshviewer ====
	socket.on('savemeshjson', function(data) {
		winston.info(data);
		saveMeshParams(socket, data);
	});
	
	// ==== potree viewer ====
	socket.on('savepotreesettings', function(data) {
		winston.info(data);
		myupload.savePotreeSettings(socket, data);
	});

	socket.on('loadpotreesettings', function(data) {
		winston.info(data);
		myupload.loadPotreeSettings(socket, data);
	});
	
	// ==== get save list ====
	socket.on('getsavelist', function(data) {
		winston.info(data);
		getSaveList(socket, data);
	})
});

function saveDataJson(socket, data) {
	var filename = config.public_dir + "/" + data.file;
	winston.info('saveDataJson %s, %s', config.public_dir, filename);
	//write
	fs.writeFile( filename, data.json, function(err) {
		if (err) {
			winston.error(err);
			socket.emit('savedatajson', {status: 'error', result: 'cannot_save_json', detail: err });
			//throw err;
			return;
		}
		socket.emit('savedatajson', { status: 'done', result: data.file });
	});
}

function saveMeshParams(socket, data)
{
	winston.info("Received saveparams from mesh viewer");
	winston.info(data);
	
	let filename = 'mesh.json';
	let preset = data.preset;
	if(preset && preset !== 'default') {
		filename = 'mesh_' + preset + '.json';
	}
	var jsonfile = config.tags_data_dir + data.dir + '/mesh_result/' + filename;
	fs.writeFile(jsonfile, data.jsonStr, function(err) {
		if(err) {
			winston.error(err);
			// send a message to the viewer
			socket.emit('savemeshjson', { status: 'error', result: err });
			return;
		}
		
		winston.info("Saved mesh params");
		socket.emit('savemeshjson', { status: 'done', result: data });
	});
}


function getSaveList(socket, data)
{
	let tagdir = data.dir || data.tag;
	let type = data.type; // volume, mesh, point
	let dir = config.tags_data_dir + tagdir + '/';
	let options = {};
	let list = ['default'];
	
	let startind;
	if(type === 'volume') {
		dir += 'volume_result/vol_web_*.json';
		startind = 8;
	}
	else if (type === 'mesh') {
		dir += 'mesh_result/mesh_*.json';
		startind = 5;
	}
	else if (type === 'point') {
		dir += 'gigapoint_*.json';
		startind = 10;
	}
	winston.info(dir);
		
	glob(dir, options, function (err, files) {
	    if(err) { 
	        winston.error(err)
	        socket.emit('getsavelist', { status: 'done', result: list });
	        return;
	    }
	    //winston.info(files);
	    for(var i=0; i < files.length; i++) {
	        let basename = path.basename(files[i], '.json');
	        basename = basename.substr(startind);
	        list.push(basename);
	    }
	    winston.info(list);
	    socket.emit('getsavelist', { status: 'done', result: list });
	})
	
}

function processApiKey(myio, data)
{
	if(data.type === 'load') {
		fbmanager.loadApiKey(data.userDetails, function(err, keydata) {
			if(err) {
				myutils.packAndSend(myio, 'processapikey', {status: 'error', result: 'Failed to get api key'});
			}
			else {
				myutils.packAndSend(myio, 'processapikey', {status: 'done', result: keydata});
			}
		});
	}
	else if (data.type === 'generate') {
		fbmanager.generateApiKey(data.userDetails, function(err, keydata) {
			if(err) {
				myutils.packAndSend(myio, 'processapikey', {status: 'error', result: 'Failed to generate api key'});
			}
			else {
				myutils.packAndSend(myio, 'processapikey', {status: 'done', result: keydata});
			}
		});
	}
}