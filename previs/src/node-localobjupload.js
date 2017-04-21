// require variables to be declared
'use strict';

var fs 			= require('fs');
var path        = require('path');
var exec 		= require('child_process').exec;
var execSync	= require('child_process').execSync;

var myutils 	= require('./node-utils');
var config		= require('./node-config').config; 
var dbmanager   = require('./node-dbmanager');

function processUploadFile(io, data) {
	io.emit('processuploadfile', {status: 'working', result: 'Checking if zipfile contains volumes or meshes'});
	var filename = data.file;
	var zipfile = config.local_data_dir + filename;
	var zipfilename = path.parse(zipfile).name;

	// check zip file type first
	console.log("Checking zipfile for meshes or TIFF images");
	var cmd_test = 'cd ' + config.scripts_dir + ' && python checkzip.py -f ' + zipfile;

	var containsMeshes = false;
	var containsVolumes = false;

	try
	{
		console.log(cmd_test);
		//exec(cmd_test, function(err, stdout, stderr) 
		var out = execSync(cmd_test).toString();
		console.log(out);

		if(out.indexOf("Zip file contains meshes") != -1)
		{
			containsMeshes = true;
		}
		else if(out.indexOf("Zip file contains TIFF files") != -1)
		{
			containsVolumes = true;
		}
		else if(out.indexOf("Zip file contains both images and meshes - not yet supported") != -1)
		{
			containsMeshes = containsVolumes = true;
		}
		else
		{
			// zipfile doesn't contain meshes or volumes
		}
	}
	catch(err)
	{
		console.log("Error!: " + err.message);
		// console.log(stdout);
		// console.log(stderr);
		io.emit('processuploadfile', {status: 'error', result: 'Checking zip file type failed!', detail: err.message});
		return;
	}

	if(containsMeshes && !containsVolumes)
	{
		console.log("Zipfile contains meshes, processing..");
		processUploadFile_Meshes(io, data);
	}
	else if(containsVolumes && !containsMeshes)
	{
		console.log("Zipfile contains volumes, processing..");
		processUploadFile_Volumes(io, data);
	}
	else if(containsVolumes && containsMeshes)
	{
		console.log("Can't process this zipfile, it must contain only meshes");
		io.emit('processuploadfile', {status: 'error', result: 'Zip contains both images and meshes - this is not yet supported', detail: "(unsupported)"});
		return;
	}
	else
	{
		console.log("Can't process this zipfile, it doesn't seem to contain meshes or volumes");
		io.emit('processuploadfile', {status: 'error', result: 'Zip must contain either TIFF files for volumes or OBJ files for meshes', detail: "(unknown file)"});
		return;
	}
}

// DW: process an upload file with volumes, after it is determined the zipfile contains TIFF images
function processUploadFile_Volumes(io, data)
{
	var filename = data.file;
	var zipfile = config.local_data_dir + filename;
	var cmd = 'cd ' + config.scripts_dir + ' && python tiff2tga.py -i ' + zipfile + ' -o ' + config.local_data_dir;
	console.log(cmd);
	exec(cmd, function(err, stdout, stderr) 
    {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			io.emit('processuploadfile', {status: 'error', result: 'cannot_convert_to_tga', detail: stderr});
			return;
		}
		io.emit('processuploadfile', {status: 'working', result: 'convert tiff to tga ok. Now convert to xrw'})
		convertToXRW(io, data);
    });
}

// DW: process an upload file with meshes - TODO add a function that detects likely type of zip and chooses which function to call
function processUploadFile_Meshes(io, data) {
	io.emit('processuploadfile', {status: 'working', result: 'Processing tree of meshes'});
	var filename = data.file;
	var zipfile = config.local_data_dir + filename;
	var zipfilename = path.parse(zipfile).name;

	//var cmd = 'cd ' + config.scripts_dir + ' && python tiff2tga.py -i ' + zipfile + ' -o ' + config.local_data_dir;
	var cmd = 'cd ' + config.scripts_dir + ' && python processtree.py -f ' + zipfile + ' -o ' + config.local_data_dir + ' -n ' + zipfilename + '_result';
	console.log(cmd);
	exec(cmd, function(err, stdout, stderr) 
    {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			io.emit('processuploadfile', {status: 'error', result: 'Processing the meshes archive failed!', detail: stderr});
			return;
		}
		//io.emit('processuploadfile', {status: 'working', result: 'OBJ tree processed'})
        io.emit('processOBJuploadfile', {status: 'working', result: 'Files unpacked, all groups processed..'})
		sendMeshViewDataToClient(io, data);
    });
}

function convertToXRW(io, data) {
	var filename = data.file;
	var basename = path.basename(filename, '.zip');
	var tga_dir = config.local_data_dir + basename + '_tga';
	var result_dir = config.local_data_dir + basename + '_result';
	var cmd = 'cd ' + config.scripts_dir + ' && tgastack2xrw -f ' + tga_dir + '/%04d.tga -o ' + result_dir + '/vol.xrw && rm -rf ' + tga_dir;
	console.log(cmd);

	exec(cmd, function(err, stdout, stderr) 
    {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			io.emit('processuploadfile', {status: 'error', result: 'cannot_convert_to_xrw', detail: stderr});
			return;
		}
		io.emit('processuploadfile', {status: 'working', result: 'convert tga to xrw ok. Now convert to png'})

		convertToPNG(io, data);
    });
}

function convertToPNG(io, data) {
	var filename = data.file;
	var basename = path.basename(filename, '.zip');
	var result_dir = config.local_data_dir + basename + '_result';
	var cmd = 'cd ' + config.scripts_dir + ' && xrw2pngmos -f ' + result_dir + '/vol.xrw -o ' + result_dir + '/vol.png' 
			  + ' && convert ' + result_dir + '/vol.png -thumbnail 256 ' + result_dir + '/vol_thumb.png';
	console.log(cmd);

	exec(cmd, function(err, stdout, stderr) {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			io.emit('processuploadfile', {status: 'error', result: 'cannot_convert_to_png', detail: stderr});
			return;
		}
		io.emit('processuploadfile', {status: 'working', result: 'convert xrw to png ok. Now prepare json file'});
		sendViewDataToClient(io, data);
    });
}

function sendViewDataToClient(io, data) {
	var basename = path.basename(data.file, '.zip');
	var xrwfile = config.local_data_dir + basename + '_result/vol.xrw';
	var pngfile = config.local_data_dir + basename + '_result/vol.png';
	var jsonfile = config.local_data_dir + basename + '_result/vol.json';
	var jsontemp = path.dirname(process.mainModule.filename) + '/src/template.json';

	var jsonurl = 'data/local/' + basename + '_result/vol.json';
	var thumburl = 'data/local/' + basename + '_result/vol_thumb.png';
	var pngurl = 'data/local/' + basename + '_result/vol.png';
	var xrwurl = 'data/local/' + basename + '_result/vol.xrw';

	fs.readFile(jsontemp, 'utf8', function (err, jsondata) {
		if (err) {
			io.emit('processuploadfile', {status: 'error', result: 'cannot_generate_json'});
			//throw err;
			return;
		} 
		var obj = JSON.parse(jsondata);
		obj.objects[0].volume.url = 'data/local/' + basename + '_result/vol.png';

		var cmd = 'xrwinfo ' + xrwfile + ' | grep dimensions';
		exec(cmd, function(err, stdout, stderr) {
    		if (err) {
				io.emit('processuploadfile', {status: 'error', result: 'cannot_run_xrwinfo'});
				//throw err;
				return;
			} 
	    	
	    	stdout = myutils.trim(stdout).trim();
	    	var res = stdout.split(" ");

	    	obj.objects[0].volume.res = [res[2], res[3], res[4]];

	    	//write
			fs.writeFile( jsonfile, JSON.stringify(obj, null, 4), function(err) {
				if (err) {
					io.emit('processuploadfile', {status: 'error', result: 'cannot_generate_json'});
					//throw err;
					return;
				} 
				//generete tag for later use
				dbmanager.createTag(data.file, function(err, tag_str) {
					if(err) {
	    				io.emit('processuploadfile', {status: 'error', cid: data.cid, result: 'cannot_create_tag'});
	    				return;
	    			}
	    		
					var tag_json = {};
					tag_json.tag=tag_str;
					tag_json.type='volume'
					tag_json.source='localupload';
					tag_json.date=Date.now();
						
					var volumes = [];
					var volume = {};
					volume.json=jsonurl;
					volume.thumb=thumburl;
					volume.png=pngurl;
					volume.xrw=xrwurl;
					volume.res=obj.objects[0].volume.res;
					volumes.push(volume);
					tag_json.volumes=volumes;
	
					fs.writeFile( config.info_dir+'/'+tag_str+'.json', JSON.stringify(tag_json, null, 4), function(err) {
						if (err) {
							io.emit('processuploadfile', {status: 'error', result: 'cannot_generate_tag_json'});
							//throw err;
							return;
						} 
						io.emit('processuploadfile', {status: 'done', tag: tag_str, json: jsonurl, thumb: thumburl, 
												  png: pngurl, xrw: xrwurl});
					});	
				});
			});
	    });		
	});
}

function sendMeshViewDataToClient(io, data) {
	var basename = path.basename(data.file, '.zip');
	var xrwfile = config.local_data_dir + basename + '_result/vol.xrw';
	var pngfile = config.local_data_dir + basename + '_result/vol.png';
	var jsonfile = config.local_data_dir + basename + '_result/mesh.json';
	var jsontemp = path.dirname(process.mainModule.filename) + '/src/template.json';
	var processedzip = basename + '_processed.zip';

	var jsonurl = 'data/local/' + basename + '_result/mesh.json';
	var thumburl = 'data/local/' + basename + '_result/vol_thumb.png';
	var pngurl = 'data/local/' + basename + '_result/vol.png';
	var xrwurl = 'data/local/' + basename + '_result/vol.xrw';
	var zipurl = 'data/local/' + processedzip;

	fs.readFile(jsontemp, 'utf8', function (err, jsondata) {
		if (err) {
			io.emit('processOBJuploadfile', {status: 'error', result: 'cannot_generate_json'});
			console.log(err);
			//throw err;
			return;
		} 
		var obj = JSON.parse(jsondata);
		obj.objects[0].volume.url = 'data/local/' + basename + '_result/vol.png';

		// normally, we would get the properties of the volume here, but this is for meshes!
		// get any additional mesh properties if needed (e.g. mesh count, face/vertex count, group count, bounding box etc.)

		obj.objects[0].volume.res = [0, 0, 0];

		//write
		fs.writeFile( jsonfile, JSON.stringify(obj, null, 4), function(err) {
			if (err) {
				io.emit('processOBJuploadfile', {status: 'error', result: 'cannot_generate_json'});
				console.log(err);
				//throw err;
				return;
			} 
			//generete tag for later use
			dbmanager.createTag(data.file, function(err, tag_str) {
				if(err) {
					io.emit('processOBJuploadfile', {status: 'error', cid: data.cid, result: 'cannot_create_tag'});
					return;
				}
			
				var tag_json = {};
				tag_json.tag=tag_str;
				tag_json.type='mesh'
				tag_json.source='localupload';
				tag_json.date=Date.now();
					
				var volumes = [];
				var volume = {};
				volume.json=jsonurl;
				volume.thumb=thumburl;
				volume.png=pngurl;
				volume.xrw=xrwurl;
				volume.zip=zipurl;
				volume.res=obj.objects[0].volume.res;
				volumes.push(volume);
				tag_json.volumes=volumes;

				fs.writeFile( config.info_dir+'/'+tag_str+'.json', JSON.stringify(tag_json, null, 4), function(err) {
					if (err) {
						io.emit('processOBJuploadfile', {status: 'error', result: 'cannot_generate_tag_json'});
						//throw err;
						return;
					} 
					io.emit('processOBJuploadfile', {status: 'done', tag: tag_str, json: jsonurl, thumb: thumburl, 
												png: pngurl, xrw: xrwurl});
				});	
			});
	    });		
	});
}

//module.exports.processUploadFile = processUploadFile_Meshes;
module.exports.processUploadFile = processUploadFile;
