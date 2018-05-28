// require variables to be declared
'use strict';

var fs 			= require('fs');
var path        = require('path');
var exec 		= require('child_process').exec;
var execSync	= require('child_process').execSync;

var myutils 	= require('./node-utils');
var config		= require('./node-config').config; 
var extract 	= require('extract-zip')

function processUpload(io, data) {
	
	var file = data.file;
	var filepath = config.tags_data_dir + file;
	var datatype = data.datatype;
	var uploadtype = data.uploadtype;
	
	if (uploadtype === 'local') {
		processUploadFile(io, data);
	}
	else if (uploadtype === 'link') {
		processUploadLink(io, data);
	}
	else if (uploadtype === 'mytardis') {
		processUploadMytardis(io, data);
	}
	else {
		console.log ('Invalid upload type');
		myutils.packAndSend(io, 'processupload', {status: 'error', result: 'Invalid upload type'});
		return;
	}
}

function processUploadLink(io, data) {
	var url = data.url;
	
	var id = '';
	var service = '';
	
	if (url.indexOf("google") !== -1) {
		id = myutils.extractGoogleId(url);
		service = "google";
	}
	
	if (id === '' || id.length < 25) {
		myutils.packAndSend(io, 'processupload', {status: 'error', result: 'Fail to extract id'});
		return;
	}
	
	var destfile = config.tags_data_dir + id + '.' + data.ext;
	var cmd = 'cd ' + config.scripts_dir + ' && python downloadlink.py ' + service + ' ' + id + ' ' + destfile;
	console.log(cmd);
	myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Downloading file from shared link...'})
	exec(cmd, function(err, stdout, stderr) 
    {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot download file from shared link', detail: stderr});
			return;
		}
		//check file exist
		if(myutils.fileExists(destfile) === false) {
			myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot download file from shared link', detail: stderr});
			return;
		}
		
		myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Processing downloaded file...'});
		data.file = id + '.' + data.ext;
		processUploadFile(io, data);
    });
}

function processUploadMytardis(io, data) {

	var host = data.auth.host;
	var apikey = data.auth.apiKey;
	var fileid = data.fileid;
	var filename = data.filename;
	var destfile =  config.tags_data_dir + fileid + '_' + filename;
	
	// download file
	var url = 'https://' + host + '/api/v1/dataset_file/' + fileid + '/download/';
	console.log(url);
	myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Downloading file from mytardis...'})
	myutils.downloadFileHttps(url, apikey, destfile, function(err) {
		if(err) {
			console.log(err);
			myutils.packAndSend(io, 'processupload', {status: 'error', result: 'Fail to download file ' + fileid});
			return;
		}

	   //check file exist
		if(myutils.fileExists(destfile) === false) {
			myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot download file from mytardis'});
			return;
		}
		
		myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Processing downloaded file...'});
		data.file = fileid + '_' + filename;
		processUploadFile(io, data);
	});
}

function processUploadFile(io, data) {
	var file = data.file;
	var filepath = config.tags_data_dir + file;
	var fileext = file.split('.').pop().toLowerCase();
	var datatype = data.datatype;
	
	// check zip file
	myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Checking zipfile...'});
	var cmd_test = 'cd ' + config.scripts_dir + ' && python checkzip.py -f ' + filepath + " -t " + datatype;
	
	try {
		console.log(cmd_test);
		var out = execSync(cmd_test).toString();
		out = JSON.parse(out)
		console.log(out);
		if (!out.match) {
			myutils.packAndSend(io, 'processupload', {status: 'error', result: out.err});
			return;
		}
	}
	catch(err) {
		console.log("Error!: " + err.message);
		myutils.packAndSend(io, 'processupload', {status: 'error', result: 'Checking zip file type failed!', detail: err.message});
		return;
	}
	
	data.db.createNewTag(function(err, tag_str) {
		if(err) {
			myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot create tag'});
			return;
		}
		data.tag = tag_str;
		data.tagdir = config.tags_data_dir + tag_str;
		data.inputfile = data.tagdir + '/' + datatype + '.' + fileext;
		data.inputfilename = datatype;
		data.inputfileext = fileext;
		// create tag dir
		myutils.createDirSync(data.tagdir);
		
		myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Renaming file'});
		myutils.moveFile(filepath, data.inputfile, function(err) {
			if(err) {
				myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot move file to tag dir'});
				return;
			}
			if(datatype === 'volume') {
				processUploadFile_Volumes(io, data);
			}
			else if (datatype === 'mesh') {
				processUploadFile_Meshes(io, data);
			}
			else if (datatype === 'point') {
				processUploadFile_Points(io, data);
			}
		});
	});
}

// process zip volume file
function processUploadFile_Volumes(io, data) {
	console.log('processUploadFile_Volumes');
	console.log(data);
	
	var inputfile = data.inputfile;
	var out_dir = data.tagdir + '/volume_result';
	var cmd = 'cd ' + config.scripts_dir + ' && python processvolume.py -i ' + inputfile + ' -o ' + out_dir;
	console.log(cmd);
	myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Converting image stack to xrw...'})
	exec(cmd, function(err, stdout, stderr) 
    {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot convert image stack to xrw', detail: stderr});
			return;
		}
		myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Converting xrw to png...'});
		convertXRWToPNG(io, data);
    });
}

// DW
function processUploadFile_Meshes(io, data) {
	console.log('processUploadFile_Meshes');
	console.log(data);
	
	myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Processing meshes...'});
	var filename = data.file;
	var inputfile = data.inputfile;
	var inputfilename = data.inputfilename;

	var out_dir = data.tagdir + '/mesh_result';
	var cmd = 'cd ' + config.scripts_dir + ' && python processmesh.py -i ' + inputfile + ' -o ' + out_dir;
	console.log(cmd);
	exec(cmd, function(err, stdout, stderr) 
    {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			myutils.packAndSend(io, 'processupload', {status: 'error', result: 'Processing the meshes archive failed!', detail: stderr});
			return;
		}
	    myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Files unpacked, all groups processed..'})
		sendViewDataToClient_Meshes(io, data);
    });
}

function processUploadFile_Points(io, data)
{
	var filename = data.inputfilename;
	var fileext = data.inputfileext;
	if (fileext === 'zip') {
		var out_dir = data.tagdir + '/' + filename + '_result';
		extract(data.inputfile, { dir: out_dir }, function (err) {
			if(err) {
				myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot unzip file', detail: err});
				return;
			}
			fs.unlinkSync(data.inputfile);
			fs.readdir(out_dir, function(err, items) {
			    console.log(items);
			    var found = false;
			    for (var i=0; i<items.length; i++) {
			        var ext = items[i].split('.').pop().toLowerCase();
			        if (ext === 'las' || ext === 'laz' || ext === 'ptx' || ext === 'ply' || ext === 'xyz' || ext === 'txt') {
			        	convertPointcloud(io, data, out_dir + '/' + items[i]);
			        	found = true;
			        	break;
			        }
			    }
			    if (found === false) {
			    	myutils.packAndSend(io, 'processupload', {status: 'error', result: 'Cannot find pointcloud file', detail: err});
					return;
			    }
			});
		})
	}
	else {
		convertPointcloud(io, data, data.inputfile);
	}
}

function convertXRWToPNG(io, data) {
	
	var result_dir = data.tagdir + '/volume_result';
	var xrwfile = result_dir + '/vol.xrw';
	
	var cmd = 'xrwinfo ' + xrwfile + ' | grep dimensions';
	console.log(cmd);
	
	exec(cmd, function(err, stdout, stderr) {
		if (err) {
			myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot_run_xrwinfo'});
			return;
		} 
    	
    	stdout = myutils.trim(stdout).trim();
    	var res = stdout.split(" ");
    	var vol_res = [parseInt(res[2]), parseInt(res[3]), parseInt(res[4])];
    	var max_val = Math.max.apply(Math, vol_res);
    	var resize_factor = 1;
    	if(max_val > 4069)
    		resize_factor = 8;
    	else if(max_val > 2048)
    		resize_factor = 4;
    	else if (max_val > 1024)
    		resize_factor = 2;
    	data.resize_factor = resize_factor;
    	data.vol_res_full = vol_res;
    	data.vol_res_web = [ Math.floor(vol_res[0]/resize_factor), Math.floor(vol_res[1]/resize_factor), Math.floor(vol_res[2]/resize_factor)];
    	console.log(data);
    
    	var cmd = 'cd ' + config.scripts_dir + ' && xrw2pngmos -f ' + result_dir + '/vol.xrw -o ' + result_dir + '/vol_web.png -s ' 
    		 	+ resize_factor + ' ' + resize_factor + ' ' + resize_factor  
			  	+ ' && convert ' + result_dir + '/vol_web.png -thumbnail 256 ' + result_dir + '/vol_web_thumb.png';
		console.log(cmd);
	
		exec(cmd, function(err, stdout, stderr) {
	    	console.log(stdout);
	    	console.log(stderr);
	    	if(err)
			{
				myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot_convert_to_png', detail: stderr});
				return;
			}
			myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Preparing json file...'});
			sendViewDataToClient(io, data);
	    });
	});
}

function sendViewDataToClient(io, data) {
	
	var basename = data.inputfilename;
	var jsonfile_full = data.tagdir + '/' + basename + '_result/vol_full.json';
	var jsonfile_web = data.tagdir + '/'  + basename + '_result/vol_web.json';
	var jsontemp = path.dirname(process.mainModule.filename) + '/src/template.json';

	var tag_url = 'data/tags/' + data.tag + '/';
	var jsonurl_full = tag_url + basename + '_result/vol_full.json';
	var jsonurl_web = tag_url + basename + '_result/vol_web.json';
	var thumburl = tag_url + basename + '_result/vol_web_thumb.png';
	var pngurl = tag_url + basename + '_result/vol_web.png';
	var xrwurl = tag_url + basename + '_result/vol.xrw';

	fs.readFile(jsontemp, 'utf8', function (err, jsondata) {
		if (err) {
			myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot_generate_json'});
			return;
		} 
		var obj_full = JSON.parse(jsondata);
		var obj_web = JSON.parse(jsondata);
		obj_full.objects[0].volume.url = 'none'; //'data/local/' + basename + '_result/vol_web.png';
    	obj_full.objects[0].volume.res = data.vol_res_full;
    	
    	obj_web.objects[0].volume.url = tag_url + basename + '_result/vol_web.png';
    	obj_web.objects[0].volume.res = data.vol_res_web;

    	//write json first
		fs.writeFile( jsonfile_full, JSON.stringify(obj_full, null, 4), function(err) {
			if (err) {
				myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot_generate_json_full'});
				return;
			} 
			
			//write json file for web
			fs.writeFile( jsonfile_web, JSON.stringify(obj_web, null, 4), function(err) {
				if (err) {
					myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot_generate_json_full'});
					return;
				} 
			
				// save to database
				var tag_json = {};
				tag_json.tag=data.tag;
				tag_json.type='volume'
				tag_json.source='localupload';
				tag_json.date=Date.now();
				tag_json.data = data.tagdir + '/' + data.inputfilename + '.' + data.inputfileext;
				tag_json.userId = data.userId;
				tag_json.userEmail = data.userEmail;
					
				var volumes = [];
				var volume = {};
				volume.data_dir='data/local/' + basename + '_result';
				volume.json=jsonurl_full;
				volume.json_web=jsonurl_web;
				volume.thumb=thumburl;
				volume.png=pngurl;
				volume.xrw=xrwurl;
				volume.res=obj_full.objects[0].volume.res;
				volume.res_web=obj_web.objects[0].volume.res;
				volumes.push(volume);
				tag_json.volumes=volumes;
				
				data.db.insertNewTag(tag_json, function(err, res) {
					if (err) {
						io.emit('processupload', {status: 'error', result: 'cannot_generate_tag_json'});
						//throw err;
						return;
					} 
					myutils.packAndSend(io, 'processupload', {status: 'done', result: tag_json});
				});
			});
	    });		
	});
}

function sendViewDataToClient_Meshes(io, data) {
	
	var basename = data.inputfilename;

	var tag_url = 'data/tags/' + data.tag + '/';
	var jsonurl = tag_url + basename + '_result/mesh.json';
	var initurl = tag_url + basename + '_result/init.script';

	// write to database
	var tag_json = {};
	tag_json.tag=data.tag;
	tag_json.type='mesh'
	tag_json.source= data.uploadtype;
	tag_json.date=Date.now();
	tag_json.data = data.file;
	tag_json.processedData = 'data/tags/' + data.tag + '/mesh_processed.zip';
	tag_json.userId = data.userId;
	tag_json.userEmail = data.userEmail;

	var volumes = [];
	var volume = {};
	volume.data_dir=tag_url + basename + '_result';
	volume.json=jsonurl;
	volume.initscr = initurl;
	volume.res = [0, 0, 0];
	volumes.push(volume);
	tag_json.volumes=volumes;
	
	data.db.insertNewTag(tag_json, function(err, res) {
		if (err) {
			myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot_generate_tag_json'});
			return;
		} 
		myutils.packAndSend(io, 'processupload', {status: 'done', result: tag_json});
		
		// clean up and zip mesh folder
		myutils.zipDirectory(data.tagdir + '/mesh_result', '', data.tagdir + '/mesh_processed.zip');
		if (myutils.fileExists(data.inputfile)) {
			fs.unlink(data.inputfile);
		}
	});
}


function convertPointcloud(io, data, in_file) {
	var basename = data.inputfilename;
	var fileext = in_file.split('.').pop().toLowerCase();;
	var out_dir = data.tagdir + '/' + basename + '_result';
	var tag_url = 'data/tags/' + data.tag + '/';
	
	var cmd = '';
	if (fileext === 'xyz' || fileext === 'txt') {
		cmd = 'cd ' + config.potree_converter_dir + ' && ./PotreeConverter ' + in_file + ' -o ' + out_dir + ' -p potree -f xyzrgb';
	} else {
		cmd = 'cd ' + config.potree_converter_dir + ' && ./PotreeConverter ' + in_file + ' -o ' + out_dir + ' -p potree';
	} 
	console.log(cmd);
	myutils.packAndSend(io, 'processupload', {status: 'working', result: 'Converting pointcloud...(it takes long time to process big data e.g. ~10min for 100k points)'});
	exec(cmd, function(err, stdout, stderr) {
    	console.log(stdout);
    	console.log(stderr);
    	if(err) {
			myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot_convert_pointcloud', detail: stderr});
			return;
		}
		
		saveDefaultPotreeSetting(data, function(err){
			if(err) {
				myutils.packAndSend(io, 'processupload', {status: 'error', result: "cannot_save_default_json"});
				return;
			}
			
			stdout = myutils.trim(stdout).trim();
			stdout = stdout.split(' ');
			var numpoints = '0';
			for(var i=1; i < stdout.length; i++) {
				var item = stdout[i].trim();
				if(item === 'points')
					numpoints = stdout[i-1];
			}
			console.log(numpoints);
	
			//save to database
			var tag_json = {};
			tag_json.tag=data.tag;
			tag_json.type='point'
			tag_json.source='localupload';
			tag_json.date=Date.now();
			tag_json.data = tag_url + data.inputfilename + data.inputfileext;
			tag_json.processedData = 'data/tags/' + data.tag + '/point_processed.zip';
			tag_json.userId = data.userId;
			tag_json.userEmail = data.userEmail;
				
			var potree_url = tag_url + basename + '_result/potree.html';
			var volumes = [];
			var volume = {};
			volume.data_dir = tag_url + basename + '_result';
			volume.potree_url = potree_url;
			volume.res = [numpoints];
			volumes.push(volume);
			tag_json.volumes=volumes;
			
			data.db.insertNewTag(tag_json, function(err, res) {
				if (err) {
					myutils.packAndSend(io, 'processupload', {status: 'error', result: 'cannot_generate_tag_json'});
					//throw err;
					return;
				} 
				myutils.packAndSend(io, 'processupload', {status: 'done', result: tag_json});
				// zip pointcloids folder
				myutils.zipDirectory(out_dir + '/pointclouds/potree', 'potree', data.tagdir + '/point_processed.zip');
			});
		});
    });
}

function saveDefaultPotreeSetting(data, callback) {
	var tag = data.tag;
	var destfile = config.tags_data_dir + tag + '/gigapoint.json';
	var jsonObj = {
		version: 2,
		dataDir: "potree",
		visiblePointTarget: 30000000,
		minNodePixelSize: 100,
		material: "rgb",
		pointScale: [0.1,0.01,1.5],
		pointSizeRange: [2, 600],
		sizeType: "adaptive",
		quality: "circle",
		elevationDirection: 2,
		elevationRange: [0, 1],
		filter: "none",
		filterEdl: [0.4, 1.4],
		numReadThread: 6,
		preloadToLevel: 5,
		maxNodeInMem: 100000,
		maxLoadSize: 200,
		cameraSpeed: 10,
		cameraUpdatePosOri: 1,
		cameraPosition: [0, 0, 0],
		cameraTarget: [0, 0, -2],
		cameraUp: [0, 0, 1]
	};
	var cloudfile = config.tags_data_dir + tag + "/point_result/pointclouds/potree/cloud.js";
	fs.readFile(cloudfile, 'utf8', function (err, data) {
	    if (err) {
	    	callback(err);
	    	return;
	    }
	    //console.log(data);
	    var obj = JSON.parse(data);
	    var tbb = obj.tightBoundingBox;
	    var center = [(tbb.ux+tbb.lx)/2, (tbb.uy+tbb.ly)/2, (tbb.uz+tbb.lz)/2];
	    var target = [center[0], center[1], center[2]-2];
	    jsonObj.cameraPosition = center;
	    jsonObj.cameraTarget = target;
	    
	    var json = JSON.stringify(jsonObj, null, 4);
		//console.log(json);
		fs.writeFile(destfile, json, 'utf8', function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null);
		});
	});
}

// ==== for potree viewer ====
function savePotreeSettings(io, data) {
	var tag = data.Tag;
	var destfile = config.tags_data_dir + tag + '/gigapoint.json';
	if(myutils.fileExists(destfile)) {
		fs.unlinkSync(destfile);
	}
	//console.log(destfile);
	
	var range_min = Math.min(data.ElevRangeMin, data.ElevRangeMax);
	var range_max = Math.max(data.ElevRangeMin, data.ElevRangeMax);
	var jsonObj = {
		version: 2,
		dataDir: "potree",
		visiblePointTarget: 30000000,
		minNodePixelSize: 100,
		material: data.PointColorType.toLowerCase(),
		pointScale: [0.1,0.01,1.5],
		pointSizeRange: [2, 600],
		sizeType: data.PointSizing.toLowerCase(),
		quality: data.PointShape.toLowerCase(),
		elevationDirection: 1,
		elevationRange: [range_min, range_max],
		filter: data.EDL ? "edl" : "none",
		filterEdl: [data.EDLStrength, data.EDLRadius],
		numReadThread: 6,
		preloadToLevel: 5,
		maxNodeInMem: 100000,
		maxLoadSize: 200,
		cameraSpeed: 10,
		cameraUpdatePosOri: 1,
		cameraPosition: data.CamLocation,
		cameraTarget: data.CamTarget,
		cameraUp: [0, 0, 1]
	};
	
	var json = JSON.stringify(jsonObj, null, 4);
	//console.log(json);
	fs.writeFile(destfile, json, 'utf8', function(err) {
		if (err) {
			io.emit('savepotreesettings', {status: 'error', result: 'cannot_save_json_file'});
			return;
		}
		io.emit('savepotreesettings', {status: 'done', result: jsonObj});
	});
}

// for potree viewer
function loadPotreeSettings(io, data) {
	var tag = data.Tag;
	var jsonfile = config.tags_data_dir + tag + '/gigapoint.json';
	fs.readFile(jsonfile, 'utf8', function (err, data) {
	    if (err) {
	    	io.emit('loadpotreesettings', {status: 'error', result: 'cannot_load_json_file'});
	    	return;
	    }
	    var obj = JSON.parse(data);
	    io.emit('loadpotreesettings', {status: 'done', result: obj});
	});
}

// EXPORT
module.exports.processUpload = processUpload;
module.exports.savePotreeSettings = savePotreeSettings;
module.exports.loadPotreeSettings = loadPotreeSettings;
