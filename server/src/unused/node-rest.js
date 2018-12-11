// require variables to be declared
'use strict';

var fs 			= require('fs');
var path        = require('path');
var exec 		= require('child_process').exec;
var execSync	= require('child_process').execSync;

var myutils 	= require('./node-utils');
var config		= require('./node-config').config; 
var extract 	= require('extract-zip')


function processUploadFile(response, data) {
	/*
	response: to response
	file: uploaded file
	key: api key information
	*/
	console.log('processUploadFile');
	//console.log(data);
	var filepath = config.tags_data_dir + data.file;
	var fileext = data.file.split('.').pop().toLowerCase();
	var datatype = data.datatype;
	
	if (fileext === "zip") {
		// check zip file
		var cmd_test = 'cd ' + config.scripts_dir + ' && python checkzip.py -f ' + filepath + " -t " + datatype;
		
		try {
			console.log(cmd_test);
			var out = execSync(cmd_test).toString();
			out = JSON.parse(out)
			console.log(out);
			if (!out.match) {
				response.json({status: 'error', detail: 'Zip file contents do not match type'});
				return;
			}
		}
		catch(err) {
			console.log("Error!: " + err.message);
			response.json({status: 'error', detail: err.message});
			return;
		}
	}
	
	data.db.createNewTag(function(err, tag_str) {
		if(err) {
			response.json({status: 'error', detail: 'cannot create tag'});
			return;
		}
		data.tag = tag_str;
		data.tagdir = config.tags_data_dir + tag_str;
		data.inputfile = data.tagdir + '/' + datatype + '.' + fileext;
		data.inputfilename = datatype;
		data.inputfileext = fileext;
		// create tag dir
		myutils.createDirSync(data.tagdir);
		
		myutils.moveFile(filepath, data.inputfile, function(err) {
			if(err) {
				response.json({status: 'error', detail: 'cannot move file to tag dir'});
				return;
			}
			if(datatype === 'volume') {
				processUploadFile_Volumes(response, data);
			}
			else if (datatype === 'mesh') {
				processUploadFile_Meshes(response, data);
			}
			else if (datatype === 'point') {
				processUploadFile_Points(response, data);
			}
			else if (datatype === 'image') {
				processUploadFile_Images(response, data);
			}
			else {
				response.json({status: 'error', detail: 'unsupported data type'});
			}
		});
	});
}

// process zip volume file
function processUploadFile_Volumes(response, data) {
	console.log('processUploadFile_Volumes');
	console.log(data);
	
	var inputfile = data.inputfile;
	var settings = data.settings; // vol voxel size x, y, z, channel, timestep
	var out_dir = data.tagdir + '/volume_result';
	var cmd = 'cd ' + config.scripts_dir + ' && python processvolume.py -i ' + inputfile + ' -o ' + out_dir + ' -c ' + settings.channel + ' -t ' + settings.time;
	console.log(cmd);
	//Converting image stack to xrw...'
	exec(cmd, function(err, stdout, stderr)  {
    	console.log(stdout);
    	console.log(stderr);
    	if(err) {
    		response.json({status: 'error', detail: 'cannot convert image stack to xrw' + stderr});
			return;
		}
		//'Converting xrw to png...'
		convertXRWToPNG(response, data);
    });
}

// DW
function processUploadFile_Meshes(response, data) {
	console.log('processUploadFile_Meshes');
	console.log(data);
	
	var inputfile = data.inputfile;
	var out_dir = data.tagdir + '/mesh_result';
	var cmd = 'cd ' + config.scripts_dir + ' && python processmesh.py -i ' + inputfile + ' -o ' + out_dir;
	console.log(cmd);
	exec(cmd, function(err, stdout, stderr) {
    	console.log(stdout);
    	console.log(stderr);
    	if(err) {
    		response.json({status: 'error', detail: 'Processing the meshes archive failed!' + stderr});
			return;
		}
		data.numobjects = JSON.parse(stdout);
	    //Files unpacked, all groups processed..'
		sendViewDataToClient_Meshes(response, data);
    });
}

function processUploadFile_Points(response, data)
{
	var filename = data.inputfilename;
	var fileext = data.inputfileext;
	if (fileext === 'zip') {
		var out_dir = data.tagdir + '/' + filename + '_result';
		extract(data.inputfile, { dir: out_dir }, function (err) {
			if(err) {
				response.json({status: 'error', detail: 'cannot unzip file ' + err});
				return;
			}
			fs.unlinkSync(data.inputfile);
			fs.readdir(out_dir, function(err, items) {
			    console.log(items);
			    var found = false;
			    for (var i=0; i<items.length; i++) {
			        var ext = items[i].split('.').pop().toLowerCase();
			        if (ext === 'las' || ext === 'laz' || ext === 'ptx' || ext === 'ply' || ext === 'xyz' || ext === 'txt') {
			        	convertPointcloud(response, data, out_dir + '/' + items[i]);
			        	found = true;
			        	break;
			        }
			    }
			    if (found === false) {
			    	response.json({status: 'error', detail: 'Cannot find pointcloud file ' + err});
			    	return;
			    }
			});
		})
	}
	else {
		convertPointcloud(response, data, data.inputfile);
	}
}

// process images file
function processUploadFile_Images(response, data) {
	console.log('processUploadFile_Images');
	console.log(data);
	
	var inputfile = data.inputfile;
	var out_dir = data.tagdir + '/image_result';
	var cmd = 'cd ' + config.scripts_dir + ' && python processimage.py -i ' + inputfile + ' -o ' + out_dir;
	console.log(cmd);
	//Converting images...
	exec(cmd, function(err, stdout, stderr) {
    	console.log(stdout);
    	console.log(stderr);
    	if(err) {
    		response.json({status: 'error', detail: 'Failed to convert images ' + err});
			return;
		}
		
		var outputimages = JSON.parse(stdout);
		
		//save to database
		var tag_url = 'data/tags/' + data.tag + '/';
		var tag_json = {};
		tag_json.tag=data.tag;
		tag_json.type=data.datatype;
		tag_json.source=data.uploadtype;
		tag_json.date=Date.now();
		tag_json.data = tag_url + data.inputfilename + data.inputfileext;
		tag_json.processedData = 'data/tags/' + data.tag + '/image_processed.zip';
		tag_json.userId = data.userDetails.uid;
		tag_json.userEmail = data.userDetails.email;
			
		var volumes = [];
		var volume = {};
		volume.data_dir = tag_url + 'image_result';
		volume.images = outputimages;
		volume.response = [outputimages.length];
		volumes.push(volume);
		tag_json.volumes=volumes;
		
		data.db.insertNewTag(tag_json, function(err, ret) {
			if (err) {
				response.json({status: 'error', detail: 'Cannot insert new tag'});
				return;
			} 
			response.json({status: 'done', result: tag_json});
			// zip pointcloids folder
			myutils.zipDirectory(out_dir, '', data.tagdir + '/image_processed.zip');
			// email
			myutils.sendEmail('ready', data);
		});
		
    });
}


function convertXRWToPNG(response, data) {
	
	var result_dir = data.tagdir + '/volume_result';
	var xrwfile = result_dir + '/vol.xrw';
	
	var cmd = 'xrwinfo ' + xrwfile + ' | grep dimensions';
	console.log(cmd);
	
	exec(cmd, function(err, stdout, stderr) {
		if (err) {
			response.json({status: 'error', detail: 'Failed to run xrwinfo'});
			return;
		} 
    	
    	stdout = myutils.trim(stdout).trim();
    	var resolution = stdout.split(" ");
    	var vol_res = [parseInt(resolution[2]), parseInt(resolution[3]), parseInt(resolution[4])];
    	var resize_factor = 1;
    	var total_res = parseInt(resolution[2]) * parseInt(resolution[3]) * parseInt(resolution[4]);
    	console.log('total resolution: ', total_res);
    	if(total_res > 4069*4096*4096)
    		resize_factor = 9;
    	else if(total_res > 2048*2048*2048)
    		resize_factor = 5;
    	else if(total_res > 1024*1024*1024)
    		resize_factor = 3;
    	else if(total_res > 512*512*512)
    		resize_factor = 2;
    	
    	data.resize_factor = resize_factor;
    	data.vol_res_full = vol_res;
    	data.vol_res_web = [ Math.floor(vol_res[0]/resize_factor), Math.floor(vol_res[1]/resize_factor), Math.floor(vol_res[2]/resize_factor)];
    	//calculate scale
    	var settings = data.settings;
    	var xref_full = data.vol_res_full[0]*settings.voxelSizeX;
    	data.vol_scale_full = [1, data.vol_res_full[1]*settings.voxelSizeY/xref_full, data.vol_res_full[2]*settings.voxelSizeZ/xref_full];
    	var xref_web = data.vol_res_web[0]*settings.voxelSizeX;
    	data.vol_scale_web = [1, data.vol_res_web[1]*settings.voxelSizeY/xref_web, data.vol_res_web[2]*settings.voxelSizeZ/xref_web];
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
				response.json({status: 'error', detail: 'Failed to convet to png ' + stderr});
				return;
			}
			sendViewDataToClient(response, data);
	    });
	});
}

function sendViewDataToClient(response, data) {
	
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
			response.json({status: 'error', detail: 'Failed to generate json'});
			return;
		} 
		var obj_full = JSON.parse(jsondata);
		var obj_web = JSON.parse(jsondata);
		obj_full.objects[0].volume.url = 'none'; //'data/local/' + basename + '_result/vol_web.png';
    	obj_full.objects[0].volume.response = data.vol_res_full;
    	obj_full.objects[0].volume.scale = data.vol_scale_full;
    	
    	obj_web.objects[0].volume.url = tag_url + basename + '_result/vol_web.png';
    	obj_web.objects[0].volume.response = data.vol_res_web;
    	obj_web.objects[0].volume.scale = data.vol_scale_web;

    	//write json first
		fs.writeFile( jsonfile_full, JSON.stringify(obj_full, null, 4), function(err) {
			if (err) {
				response.json({status: 'error', detail: 'Failed to generate json full'});
				return;
			} 
			
			//write json file for web
			fs.writeFile( jsonfile_web, JSON.stringify(obj_web, null, 4), function(err) {
				if (err) {
					response.json({status: 'error', detail: 'Failed to generate json web'});
					return;
				} 
				
				// save to database
				var tag_json = {};
				tag_json.tag=data.tag;
				tag_json.type='volume'
				tag_json.source='localupload';
				tag_json.date=Date.now();
				tag_json.data = data.tagdir + '/' + data.inputfilename + '.' + data.inputfileext;
				tag_json.userId = data.userDetails.uid;
				tag_json.userEmail = data.userDetails.email;
					
				var volumes = [];
				var volume = {};
				volume.data_dir='data/local/' + basename + '_result';
				volume.json=jsonurl_full;
				volume.json_web=jsonurl_web;
				volume.thumb=thumburl;
				volume.png=pngurl;
				volume.xrw=xrwurl;
				volume.response=obj_full.objects[0].volume.response;
				volume.res_web=obj_web.objects[0].volume.response;
				volumes.push(volume);
				tag_json.volumes=volumes;
				
				data.db.insertNewTag(tag_json, function(err, ret) {
					if (err) {
						response.json({status: 'error', detail: 'Failed to generate tag json'});
						return;
					} 
					response.json({status: 'done', result: tag_json});
					
					// email
					myutils.sendEmail('ready', data);
				});
			});
	    });		
	});
}

function sendViewDataToClient_Meshes(response, data) {
	
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
	tag_json.userId = data.userDetails.uid;
	tag_json.userEmail = data.userDetails.email;

	var volumes = [];
	var volume = {};
	volume.data_dir=tag_url + basename + '_result';
	volume.json=jsonurl;
	volume.initscr = initurl;
	volume.response = data.numobjects; //[0, 0, 0];
	volumes.push(volume);
	tag_json.volumes=volumes;
	
	console.log(tag_json);
	data.db.insertNewTag(tag_json, function(err, ret) {
		if (err) {
			response.json({status: 'error', detail: 'Failed to generate tag json'});
			return;
		}
		response.json({status: 'done', result: tag_json});
		
		// clean up and zip mesh folder
		myutils.zipDirectory(data.tagdir + '/mesh_result', '', data.tagdir + '/mesh_processed.zip');
		if (myutils.fileExists(data.inputfile)) {
			fs.unlink(data.inputfile);
		}
		
		// email
		myutils.sendEmail('ready', data);
	});
}


function convertPointcloud(response, data, in_file) {
	var basename = data.inputfilename;
	var fileext = in_file.split('.').pop().toLowerCase();;
	var out_dir = data.tagdir + '/' + basename + '_result';
	var convert_out_dir = out_dir + '/pointclouds/potree'; // to be compatible with previous converter having output html page
	var tag_url = 'data/tags/' + data.tag + '/';
	
	var cmd = '';
	if (fileext === 'xyz' || fileext === 'txt') {
		cmd = 'cd ' + config.potree_converter_dir + ' && ./PotreeConverter ' + in_file + ' -o ' + convert_out_dir + ' -f xyzrgb';
	} else {
		cmd = 'cd ' + config.potree_converter_dir + ' && ./PotreeConverter ' + in_file + ' -o ' + convert_out_dir;
	} 
	console.log(cmd);
	//Converting pointcloud...(it takes long time to process big data e.g. ~10min for 100k points)
	exec(cmd, function(err, stdout, stderr) {
    	console.log(stdout);
    	console.log(stderr);
    	if(err) {
    		response.json({status: 'error', detail: 'Failed to convert pointcloud ' + stderr});
			return;
		}
		
		saveDefaultPotreeSetting(data, function(err){
			if(err) {
				response.json({status: 'error', detail: 'Failed to save default json '});
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
			if(numpoints === '0') {
				response.json({status: 'error', detail: 'numpoints = 0; failed to convert pointcloud, please check data format'});
				return;
			}
	
			//save to database
			var tag_json = {};
			tag_json.tag=data.tag;
			tag_json.type='point'
			tag_json.source='localupload';
			tag_json.date=Date.now();
			tag_json.data = tag_url + data.inputfilename + data.inputfileext;
			tag_json.processedData = 'data/tags/' + data.tag + '/point_processed.zip';
			tag_json.userId = data.userDetails.uid;
			tag_json.userEmail = data.userDetails.email;
				
			var potree_url = tag_url + basename + '_result/potree.html';
			var volumes = [];
			var volume = {};
			volume.data_dir = tag_url + basename + '_result';
			volume.potree_url = potree_url;
			volume.response = [numpoints];
			volumes.push(volume);
			tag_json.volumes=volumes;
			
			data.db.insertNewTag(tag_json, function(err, ret) {
				if (err) {
					response.json({status: 'error', detail: 'cannot generate tag json'});
					return;
				} 
				response.json({status: 'done', result: tag_json})
				myutils.zipDirectory(out_dir + '/pointclouds/potree', 'potree', data.tagdir + '/point_processed.zip');
				// email
				myutils.sendEmail('ready', data);
			});
		});
    });
}


// EXPORT
module.exports.processUploadFile = processUploadFile;
