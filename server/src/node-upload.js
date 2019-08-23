// require variables to be declared
'use strict';

var fs 			= require('fs');
var path        = require('path');
var exec 		= require('child_process').exec;
var execSync	= require('child_process').execSync;

var myutils 	= require('./node-utils');
var config		= require('./node-config').config; 
var extract 	= require('extract-zip');
var crypto 		= require('crypto');

const winston 	= require('winston');

function processUpload(io, data) {
	let uploadtype = data.uploadtype;

	winston.info(['processUpload', data.uploadtype, data.datatype]);
	if(data.task === 'getdatatypes') {
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
			winston.info ('Invalid upload type');
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'Invalid upload type'});
			return;
		}
	}
	else if (data.task === 'process') {
		// data.file contains information the file to be processed
		// no need to download the file again
		processUploadFile(io, data);
	}
	else {
		myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'Unnown task'});
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
		myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'Fail to extract id'});
		return;
	}
	
	var destfile = config.tags_data_dir + id + '.' + data.ext;
	var cmd = 'cd ' + config.scripts_dir + ' && python downloadlink.py ' + service + ' ' + id + ' ' + destfile;
	winston.info(cmd);
	myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Downloading file from shared link...'})
	exec(cmd, function(err, stdout, stderr) 
    {
    	winston.info(stdout);
    	winston.info(stderr);
    	if(err)
		{
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot download file from shared link', detail: stderr});
			myutils.sendEmail('fail', data, {status: 'error', result: 'cannot download file from shared link', detail: stderr});
			return;
		}
		//check file exist
		if(myutils.fileExists(destfile) === false) {
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot download file from shared link', detail: stderr});
			myutils.sendEmail('fail', data, {status: 'error', result: 'cannot download file from shared link', detail: stderr});
			return;
		}
		
		myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Processing downloaded file...'});
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
	winston.info(url);
	myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Downloading file from mytardis...'})
	myutils.downloadFileHttps(url, apikey, destfile, function(err) {
		if(err) {
			winston.error(err);
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'Fail to download file ' + fileid});
			myutils.sendEmail('fail', data, {status: 'error', result: 'Fail to download file ' + fileid});
			return;
		}

	   //check file exist
		if(myutils.fileExists(destfile) === false) {
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot download file from mytardis'});
			myutils.sendEmail('fail', data, {status: 'error', result: 'cannot download file from mytardis'});
			return;
		}
		
		myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Processing downloaded file...'});
		data.file = fileid + '_' + filename;
		processUploadFile(io, data);
	});
}

function processUploadFile(io, data) {
	var file = data.file;
	var filepath = config.tags_data_dir + file;
	var fileext = file.split('.').pop().toLowerCase();
	var datatype = data.datatype;

	// check file to guess datatypes and send back to client
	if(data.task === 'getdatatypes') {
		myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Detecting datatype...'});
		var cmd = 'cd ' + config.scripts_dir + ' && python getdatatypes.py -f ' + filepath;
		exec(cmd, function(err, stdout, stderr) {
			winston.info(stdout);
			winston.info(stderr);
			if(err) {
				myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'failed to get datatypes from uploaded file', detail: stderr});
				return;
			}
			var info = JSON.parse(stdout);
			winston.info(info);
			if(info.status === 'error') {
				myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'no datatype can be found, please check input file', detail: info.detail});
				return;
			}
			myutils.packAndSend(io, 'processupload', {status: 'done', task: data.task, result: {'datatypes': info.datatypes, 'file': data.file}});
			return;
		});
	}

	// process upload file
	else {
		data.db.createNewTag(function(err, tag_str) {
			if(err) {
				myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot create tag'});
				return;
			}
			data.tag = tag_str;
			data.dir = tag_str + '_' + crypto.randomBytes(3).toString('hex');
			data.tagdir = config.tags_data_dir + data.dir;
			data.inputfile = data.tagdir + '/' + datatype + '.' + fileext;
			data.inputfilename = datatype;
			data.inputfileext = fileext;
			// create tag dir
			myutils.createDirSync(data.tagdir);
			
			myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Renaming file'});
			myutils.moveFile(filepath, data.inputfile, function(err) {
				if(err) {
					myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot move file to tag dir'});
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
				else if (datatype === 'image') {
					processUploadFile_Images(io, data);
				}
				else if (datatype === 'photogrammetry') {
					processUploadFile_Photogrammetry(io, data);
				}
				else {
					myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'unsupported data type'});
				}
			});
		});
	} // else
}

// process zip volume file
function processUploadFile_Volumes(io, data) {
	winston.info('processUploadFile_Volumes');
	
	var inputfile = data.inputfile;
	var settings = data.settings; // vol voxel size x, y, z, channel, timestep
	var out_dir = data.tagdir + '/volume_result';
	var cmd = 'cd ' + config.scripts_dir + ' && python processvolume.py -i ' + inputfile + ' -o ' + out_dir + ' -c ' + settings.channel + ' -t ' + settings.time;
	winston.info(cmd);
	myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Converting image stack to xrw and mosaic png...'})
	exec(cmd, function(err, stdout, stderr) {
    	winston.info(stdout);
    	winston.info(stderr);
    	if(err) {
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot convert image stack to xrw', detail: stderr});
			myutils.sendEmail('fail', data, {status: 'error', result: 'cannot convert image stack to xrw', detail: stderr});
			return;
		}
		// parse output to get size
		var info = JSON.parse(stdout.trim());
		var settings = data.settings;
		if("voxelsizes" in info) {
			settings.voxelSizeX = info.voxelsizes[0];
			settings.voxelSizeY = info.voxelsizes[1];
			settings.voxelSizeZ = info.voxelsizes[2];
		}
		data.vol_res_full = info.size;
    	data.vol_res_web = info.newsize;
    	//calculate scale
    	var xref_full = data.vol_res_full[0]*settings.voxelSizeX;
    	data.vol_scale_full = [1, data.vol_res_full[1]*settings.voxelSizeY/xref_full, data.vol_res_full[2]*settings.voxelSizeZ/xref_full];
    	var xref_web = data.vol_res_web[0]*settings.voxelSizeX;
    	data.vol_scale_web = [1, data.vol_res_web[1]*settings.voxelSizeY/xref_web, data.vol_res_web[2]*settings.voxelSizeZ/xref_web];
    	
		myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Preparing json file...'});
		sendViewDataToClient_Volume(io, data);
    });
}

// DW
function processUploadFile_Meshes(io, data) {
	winston.info('processUploadFile_Meshes');
	
	myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Processing meshes...'});
	var inputfile = data.inputfile;
	
	var out_dir = data.tagdir + '/mesh_result';
	var cmd = 'cd ' + config.scripts_dir + ' && python processmesh.py -i ' + inputfile + ' -o ' + out_dir;
	winston.info(cmd);
	exec(cmd, function(err, stdout, stderr) 
    {
    	winston.info(stdout);
    	winston.info(stderr);
    	if(err)
		{
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'Processing the meshes archive failed!', detail: stderr});
			myutils.sendEmail('fail', data, {status: 'error', result: 'Processing the meshes archive failed!', detail: stderr});
			return;
		}
		data.numobjects = JSON.parse(stdout);
	    myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Files unpacked, all groups processed..'})
		sendViewDataToClient_Meshes(io, data);
    });
}

//NH
// process zip photogrammetry file @AH
function processUploadFile_Photogrammetry(io, data) {
	winston.info('processUploadFile_Photogrammetry');
	
	var inputfile = data.inputfile;
	var settings = data.settings; // vol voxel size x, y, z, channel, timestep
	var out_dir = data.tagdir + '/photogrammetry_result';
	var cmd = 'cd ' + config.scripts_dir + ' && python processphotogrammetry.py -i ' + inputfile + ' -o ' + out_dir;
	winston.info(cmd);
	myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Processing photogrammetry images...'})
	exec(cmd, function(err, stdout, stderr) 
    {
    	winston.info(stdout);
    	winston.info(stderr);
    	if(err)
		{
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'Processing images failed', detail: stderr});
			myutils.sendEmail('fail', data, {status: 'error', result: 'Processing photogrammetry images failed.', detail: stderr});
			return;
		}
		myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Processing photogrammetry...You will be notified via email when finished'+data.tag});
		//myutils.packAndSend(io, 'processupload', {status: 'done', result: tag_json});
    });
    //myutils.packAndSend(io, 'processupload', {status: 'done', result: "unknown"});
}

function processUploadFile_Points(io, data)
{
	var filename = data.inputfilename;
	var fileext = data.inputfileext;
	if (fileext === 'zip') {
		var out_dir = data.tagdir + '/' + filename + '_result';
		extract(data.inputfile, { dir: out_dir }, function (err) {
			if(err) {
				myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot unzip file', detail: err});
				return;
			}
			fs.unlinkSync(data.inputfile);
			fs.readdir(out_dir, function(err, items) {
			    winston.info(items);
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
			    	myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'Cannot find pointcloud file', detail: err});
			    	myutils.sendEmail('fail', data, {status: 'error', task: data.task, result: 'Cannot find pointcloud file', detail: err});
					return;
			    }
			});
		})
	}
	else {
		convertPointcloud(io, data, data.inputfile);
	}
}

// process images file
function processUploadFile_Images(io, data) {
	winston.info('processUploadFile_Images');
	
	var inputfile = data.inputfile;
	var out_dir = data.tagdir + '/image_result';
	var cmd = 'cd ' + config.scripts_dir + ' && python processimage.py -i ' + inputfile + ' -o ' + out_dir;
	winston.info(cmd);
	myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Converting images...'})
	exec(cmd, function(err, stdout, stderr) {
    	winston.info(stdout);
    	winston.info(stderr);
    	if(err) {
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'Failed to convert images', detail: stderr});
			myutils.sendEmail('fail', data, {status: 'error', result: 'Failed to convert images', detail: stderr});
			return;
		}
		
		var outputimages = JSON.parse(stdout);
		
		//save to database
		//var tag_url = 'data/tags/' + data.dir + '/';
		var tag_json = {};
		tag_json.id = data.tag;
		tag_json.tag=data.tag;
		tag_json.dir=data.dir;
		tag_json.type=data.datatype;
		tag_json.source=data.uploadtype;
		tag_json.date=Date.now();
		//tag_json.data = tag_url + data.inputfilename + data.inputfileext;
		tag_json.processedData = 'data/tags/' + data.dir + '/image_processed.zip';
		tag_json.userId = data.userDetails.uid;
		tag_json.userEmail = data.userDetails.email;
		tag_json.disk = 0;
		tag_json.numtags = 0;
		tag_json.status = 'processing';
			
		var volumes = [];
		var volume = {};
		//volume.data_dir = tag_url + 'image_result';
		volume.subdir = 'image_result';
		volume.images = outputimages;
		volume.res = [outputimages.length];
		volumes.push(volume);
		tag_json.volumes=volumes;

		data.db.insertNewTag(tag_json, function(err, res) {
			if (err) {
				myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'Cannot insert new tag'});
				return;
			} 
			myutils.packAndSend(io, 'processupload', {status: 'done', task: data.task, result: tag_json});
			// zip pointcloids folder
			myutils.zipDirectory(out_dir, '', data.tagdir + '/image_processed.zip', function(err){
				if(err) winston.error(err);
				data.db.updateTagSize(data.tag, data.tagdir, data.userDetails.uid, function(err) {
					if(err) winston.error(err);
				})
			});
			// email
			myutils.sendEmail('ready', data);
		});
		
    });
}


function sendViewDataToClient_Volume(io, data) {
	
	var basename = data.inputfilename;
	var jsonfile_full = data.tagdir + '/' + basename + '_result/vol_full.json';
	var jsonfile_web = data.tagdir + '/'  + basename + '_result/vol_web.json';
	var jsontemp = path.dirname(process.mainModule.filename) + '/src/template.json';

	var tag_url = 'data/tags/' + data.dir + '/';
	
	fs.readFile(jsontemp, 'utf8', function (err, jsondata) {
		if (err) {
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot_generate_json'});
			return;
		} 
		var obj_full = JSON.parse(jsondata);
		var obj_web = JSON.parse(jsondata);
		obj_full.objects[0].volume.url = 'none'; //'data/local/' + basename + '_result/vol_web.png';
    	obj_full.objects[0].volume.res = data.vol_res_full;
    	obj_full.objects[0].volume.scale = data.vol_scale_full;
    	
    	obj_web.objects[0].volume.url = tag_url + basename + '_result/vol_web.png';
    	obj_web.objects[0].volume.res = data.vol_res_web;
    	obj_web.objects[0].volume.scale = data.vol_scale_web;

    	//write json first
		fs.writeFile( jsonfile_full, JSON.stringify(obj_full, null, 4), function(err) {
			if (err) {
				myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot_generate_json_full'});
				return;
			} 
			
			//write json file for web
			fs.writeFile( jsonfile_web, JSON.stringify(obj_web, null, 4), function(err) {
				if (err) {
					myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot_generate_json_full'});
					return;
				} 
				
				// save to database
				var tag_json = {};
				tag_json.id = data.tag;
				tag_json.tag = data.tag;
				tag_json.dir = data.dir;
				tag_json.type = 'volume'
				tag_json.source = data.uploadtype;
				tag_json.date=Date.now();
				//tag_json.data = data.tagdir + '/' + data.inputfilename + '.' + data.inputfileext;
				tag_json.userId = data.userDetails.uid;
				tag_json.userEmail = data.userDetails.email;
				tag_json.disk = 0;
				tag_json.numtags = 0;
				tag_json.status = 'processing';
					
				var volumes = [];
				var volume = {};
				volume.subdir='volume_result';
				volume.res=obj_full.objects[0].volume.res;
				volume.res_web=obj_web.objects[0].volume.res;
				volumes.push(volume);
				tag_json.volumes=volumes;
				
				data.db.insertNewTag(tag_json, function(err, res) {
					if (err) {
						myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot_generate_tag_json'});
						return;
					} 
					myutils.packAndSend(io, 'processupload', {status: 'done', task: data.task, result: tag_json});
				
					// email
					myutils.sendEmail('ready', data);
					data.db.updateTagSize(data.tag, data.tagdir, data.userDetails.uid, function(err) {
						if(err) winston.error(err);
					})
				});
			});
	    });		
	});
}

function sendViewDataToClient_Meshes(io, data) {
	
	var basename = data.inputfilename;

	var tag_url = 'data/tags/' + data.dir + '/';
	//var jsonurl = tag_url + basename + '_result/mesh.json';
	//var initurl = tag_url + basename + '_result/init.script';

	// write to database
	var tag_json = {};
	tag_json.id = data.tag;
	tag_json.tag=data.tag;
	tag_json.dir=data.dir;
	tag_json.type='mesh'
	tag_json.source= data.uploadtype;
	tag_json.date=Date.now();
	//tag_json.data = data.file;
	tag_json.processedData = 'data/tags/' + data.dir + '/mesh_processed.zip';
	tag_json.userId = data.userDetails.uid;
	tag_json.userEmail = data.userDetails.email;
	tag_json.disk = 0;
	tag_json.numtags = 0;
	tag_json.status = 'processing';

	var volumes = [];
	var volume = {};
	//volume.data_dir=tag_url + basename + '_result';
	//volume.json=jsonurl;
	//volume.initscr = initurl;
	volume.subdir = 'mesh_result';
	volume.res = data.numobjects; //[0, 0, 0];
	volumes.push(volume);
	tag_json.volumes=volumes;
	
	data.db.insertNewTag(tag_json, function(err, res) {
		if (err) {
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot_generate_tag_json'});
			return;
		} 
		myutils.packAndSend(io, 'processupload', {status: 'done', task: data.task, result: tag_json});
		
		// clean up and zip mesh folder
		myutils.zipDirectory(data.tagdir + '/mesh_result', '', data.tagdir + '/mesh_processed.zip', function(err){
			winston.info('compressed file, now updateTagSize');
			if(err) winston.error(err);
			if (myutils.fileExists(data.inputfile)) {
				fs.unlink(data.inputfile);
			}
			data.db.updateTagSize(data.tag, data.tagdir, data.userDetails.uid, function(err) {
				if(err) winston.error(err);
			})
		});
		
		// email
		myutils.sendEmail('ready', data);
	});
}


function convertPointcloud(io, data, in_file) {
	var basename = data.inputfilename;
	var fileext = in_file.split('.').pop().toLowerCase();;
	var out_dir = data.tagdir + '/' + basename + '_result';
	var convert_out_dir = out_dir + '/pointclouds/potree'; // to be compatible with previous converter having output html page
	var tag_url = 'data/tags/' + data.dir + '/';
	
	var cmd = '';
	if (fileext === 'xyz' || fileext === 'txt') {
		cmd = 'cd ' + config.potree_converter_dir + ' && ./PotreeConverter ' + in_file + ' -o ' + convert_out_dir + ' -f xyzrgb';
	} else {
		cmd = 'cd ' + config.potree_converter_dir + ' && ./PotreeConverter ' + in_file + ' -o ' + convert_out_dir;
	} 
	winston.info(cmd);
	myutils.packAndSend(io, 'processupload', {status: 'working', task: data.task, result: 'Converting pointcloud...(it takes long time to process big data e.g. ~10min for 100k points)'});
	exec(cmd, function(err, stdout, stderr) {
    	winston.info(stdout);
    	winston.info(stderr);
    	if(err) {
			myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot_convert_pointcloud', detail: stderr});
			myutils.sendEmail('fail', data, {status: 'error', result: 'cannot_convert_pointcloud', detail: stderr});
			return;
		}
		
		saveDefaultPotreeSetting(data, function(err){
			if(err) {
				myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: "cannot_save_default_json"});
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
			winston.info(numpoints);
			if(numpoints === '0') {
				myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: "numpoints = 0; failed to convert pointcloud, please check data format"});
				myutils.sendEmail('fail', data, {status: 'error', result: "numpoints = 0; failed to convert pointcloud, please check data format"});
				return;
			}
	
			//save to database
			var tag_json = {};
			tag_json.id = data.tag;
			tag_json.tag=data.tag;
			tag_json.dir=data.dir;
			tag_json.type='point'
			tag_json.source='localupload';
			tag_json.date=Date.now();
			tag_json.processedData = 'data/tags/' + data.dir + '/point_processed.zip';
			tag_json.userId = data.userDetails.uid;
			tag_json.userEmail = data.userDetails.email;
			tag_json.disk = 0;
			tag_json.numtags = 0;
			tag_json.status = 'processing';
				
			var potree_url = tag_url + basename + '_result/potree.html';
			var volumes = [];
			var volume = {};
			//volume.data_dir = tag_url + basename + '_result';
			//volume.potree_url = potree_url;
			volume.subdir = 'point_result';
			volume.res = [numpoints];
			volumes.push(volume);
			tag_json.volumes=volumes;
			
			data.db.insertNewTag(tag_json, function(err, res) {
				if (err) {
					myutils.packAndSend(io, 'processupload', {status: 'error', task: data.task, result: 'cannot_generate_tag_json'});
					//throw err;
					return;
				} 
				myutils.packAndSend(io, 'processupload', {status: 'done', task: data.task, result: tag_json});
				// zip pointcloids folder
				myutils.zipDirectory(out_dir + '/pointclouds/potree', 'potree', data.tagdir + '/point_processed.zip', function(err){
					if(err) winston.error(err);
					data.db.updateTagSize(data.tag, data.tagdir, data.userDetails.uid, function(err) {
						if(err) winston.error(err);
					})
				});
				// email
				myutils.sendEmail('ready', data);
			});
		});
    });
}

function saveDefaultPotreeSetting(data, callback) {
	var dir = data.dir;
	var destfile = config.tags_data_dir + dir + '/gigapoint.json';
	var jsonObj = {
		version: 2,
		dataDir: "potree",
		visiblePointTarget: 30000000,
		minNodePixelSize: 100,
		material: "rgb",
		pointScale: [0.05,0.01,1.0],
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
	var cloudfile = config.tags_data_dir + dir + "/point_result/pointclouds/potree/cloud.js";
	fs.readFile(cloudfile, 'utf8', function (err, data) {
	    if (err) {
	    	callback(err);
	    	return;
	    }
	    //winston.info(data);
	    var obj = JSON.parse(data);
	    var tbb = obj.tightBoundingBox;
	    var center = [(tbb.ux+tbb.lx)/2, (tbb.uy+tbb.ly)/2, (tbb.uz+tbb.lz)/2];
	    var target = [center[0], center[1], center[2]-2];
	    jsonObj.cameraPosition = center;
	    jsonObj.cameraTarget = target;
	    
	    var json = JSON.stringify(jsonObj, null, 4);
		//winston.info(json);
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
function getDirectionIndexFromString(direction) {
	if(direction == 'X')
		return 0;
	if(direction == 'Y')
		return 1;
	return 2;
}

function savePotreeSettings(io, data) {
	var dir = data.Dir;
	var destfile = config.tags_data_dir + dir + '/gigapoint.json';
	if(data.Preset && data.Preset !== 'default') {
		destfile = config.tags_data_dir + dir + '/gigapoint_' + data.Preset + '.json';
	}
	if(myutils.fileExists(destfile)) {
		fs.unlinkSync(destfile);
	}
	//winston.info(destfile);
	
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
		elevationDirection: getDirectionIndexFromString(data.ElevDirection),
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
		cameraUp: [0, 0, 1],
		//for web only
		forWebOnly: {
			PointBudget: data.PointBudget,
			FOV: data.FOV,
			PointSize: data.PointSize
		}
	};
	
	var json = JSON.stringify(jsonObj, null, 4);
	//winston.info(json);
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
	var dir = data.Dir;
	var preset = data.Preset;
	var jsonfile = config.tags_data_dir + dir + '/gigapoint.json';
	if(preset && preset !== 'default') {
		jsonfile = config.tags_data_dir + dir + '/gigapoint_' + preset + '.json';
	}
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
module.exports.processUploadFile = processUploadFile;	//for REST upload using scripts 
module.exports.savePotreeSettings = savePotreeSettings;
module.exports.loadPotreeSettings = loadPotreeSettings;
