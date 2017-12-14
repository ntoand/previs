// require variables to be declared
'use strict';

var fs 			= require('fs');
var path        = require('path');
var exec 		= require('child_process').exec;
var execSync	= require('child_process').execSync;

var myutils 	= require('./node-utils');
var config		= require('./node-config').config; 
var dbmanager   = require('./node-mongodb');
var extract 	= require('extract-zip')

function processUploadFile(io, data) {
	
	var file = data.file;
	var filepath = config.local_data_dir + file;
	var type = data.type;
	
	// check zip file
	if (type === 'volume' || type === 'mesh') {
		io.emit('processuploadfile', {status: 'working', result: 'Checking zipfile...'});
		var cmd_test = 'cd ' + config.scripts_dir + ' && python checkzip.py -f ' + filepath;
		try
		{
			console.log(cmd_test);
			var out = execSync(cmd_test).toString();
			console.log(out);
	
			if(type === 'mesh' && out.indexOf("Zip file contains meshes") == -1) {
				io.emit('processuploadfile', {status: 'error', result: 'Zip file has no obj file'});
				return;
			}
			if(type === 'volume' && out.indexOf("Zip file contains TIFF files") == -1) {
				io.emit('processuploadfile', {status: 'error', result: 'Zip file has no TIFF file'});
				return;
			}
			if(out.indexOf("Zip file contains meshes") != -1 && out.indexOf("Zip file contains TIFF files") != -1) {
				io.emit('processuploadfile', {status: 'error', result: 'Zip file contains both images and meshes - not yet supported'});
				return;
			}
		}
		catch(err)
		{
			console.log("Error!: " + err.message);
			io.emit('processuploadfile', {status: 'error', result: 'Checking zip file type failed!', detail: err.message});
			return;
		}
	}
	
	if(type === 'volume') {
		processUploadFile_Volumes(io, data);
	}
	else if (type === 'mesh') {
		processUploadFile_Meshes(io, data);
	}
	else if (type === 'point') {
		processUploadFile_Points(io, data);
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

function processUploadFile_Points(io, data)
{
	var file = data.file;
	var filepath = config.local_data_dir + file;
	var filename = path.parse(filepath).name;
	var fileext =file.split('.').pop().toLowerCase();
	if (fileext === 'zip') {
		var out_dir = config.local_data_dir + filename + '_result';
		extract(filepath, { dir: out_dir }, function (err) {
			if(err) {
				io.emit('processuploadfile_point', {status: 'error', result: 'cannot unzip file', detail: err});
				return;
			}
			fs.unlinkSync(filepath);
			fs.readdir(out_dir, function(err, items) {
			    console.log(items);
			    var found = false;
			    for (var i=0; i<items.length; i++) {
			        var ext = items[i].split('.').pop().toLowerCase();
			        if (ext === 'las' || ext === 'laz' || ext === 'ptx' || ext === 'ply') {
			        	convertPointcloud(io, data, out_dir + '/' + items[i]);
			        	found = true;
			        	break;
			        }
			    }
			    if (found === false) {
			    	io.emit('processuploadfile_point', {status: 'error', result: 'Cannot find pointcloud file', detail: err});
					return;
			    }
			});
		})
	}
	else {
		convertPointcloud(io, data, filepath);
	}
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
	
	var xrwfile = result_dir + '/vol.xrw';
	var cmd = 'xrwinfo ' + xrwfile + ' | grep dimensions';
	console.log(cmd);
	exec(cmd, function(err, stdout, stderr) {
		if (err) {
			io.emit('processuploadfile', {status: 'error', result: 'cannot_run_xrwinfo'});
			//throw err;
			return;
		} 
    	
    	stdout = myutils.trim(stdout).trim();
    	var res = stdout.split(" ");
    	var vol_res = [parseInt(res[2]), parseInt(res[3]), parseInt(res[4])];
    	var max_val = Math.max.apply(Math, vol_res);
    	var resize_factor = 1;
    	if(max_val > 2048)
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
				io.emit('processuploadfile', {status: 'error', result: 'cannot_convert_to_png', detail: stderr});
				return;
			}
			io.emit('processuploadfile', {status: 'working', result: 'convert xrw to png ok. Now prepare json file'});
			sendViewDataToClient(io, data);
	    });
	});
}

function sendViewDataToClient(io, data) {
	var basename = path.basename(data.file, '.zip');
	var jsonfile_full = config.local_data_dir + basename + '_result/vol_full.json';
	var jsonfile_web = config.local_data_dir + basename + '_result/vol_web.json';
	var jsontemp = path.dirname(process.mainModule.filename) + '/src/template.json';

	var jsonurl_full = 'data/local/' + basename + '_result/vol_full.json';
	var jsonurl_web = 'data/local/' + basename + '_result/vol_web.json';
	var thumburl = 'data/local/' + basename + '_result/vol_web_thumb.png';
	var pngurl = 'data/local/' + basename + '_result/vol_web.png';
	var xrwurl = 'data/local/' + basename + '_result/vol.xrw';

	fs.readFile(jsontemp, 'utf8', function (err, jsondata) {
		if (err) {
			io.emit('processuploadfile', {status: 'error', result: 'cannot_generate_json'});
			//throw err;
			return;
		} 
		var obj_full = JSON.parse(jsondata);
		var obj_web = JSON.parse(jsondata);
		obj_full.objects[0].volume.url = 'none'; //'data/local/' + basename + '_result/vol_web.png';
    	obj_full.objects[0].volume.res = data.vol_res_full;
    	
    	obj_web.objects[0].volume.url = 'data/local/' + basename + '_result/vol_web.png';
    	obj_web.objects[0].volume.res = data.vol_res_web;

    	//write json first
		fs.writeFile( jsonfile_full, JSON.stringify(obj_full, null, 4), function(err) {
			if (err) {
				io.emit('processuploadfile', {status: 'error', result: 'cannot_generate_json_full'});
				//throw err;
				return;
			} 
			
			//write json file for web
			fs.writeFile( jsonfile_web, JSON.stringify(obj_web, null, 4), function(err) {
				if (err) {
					io.emit('processuploadfile', {status: 'error', result: 'cannot_generate_json_full'});
					//throw err;
					return;
				} 
			
				//generete tag for later use
				dbmanager.createNewTag(function(err, tag_str) {
					if(err) {
	    				io.emit('processuploadfile', {status: 'error', cid: data.cid, result: 'cannot_create_tag'});
	    				return;
	    			}
	    	
					var tag_json = {};
					tag_json.tag=tag_str;
					tag_json.type='volume'
					tag_json.source='localupload';
					tag_json.date=Date.now();
					tag_json.data = data.file;
						
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
					
					dbmanager.insertNewTag(tag_json, function(err, res) {
						if (err) {
							io.emit('processuploadfile', {status: 'error', result: 'cannot_generate_tag_json'});
							//throw err;
							return;
						} 
						io.emit('processuploadfile', {status: 'done', tag: tag_str, json: jsonurl_web, thumb: thumburl, 
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
	var initfile = config.local_data_dir + basename + '_result/init.script';
	var jsontemp = path.dirname(process.mainModule.filename) + '/src/template.json';
	var processedzip = basename + '_processed.zip';

	var jsonurl = 'data/local/' + basename + '_result/mesh.json';
	var initurl = 'data/local/' + basename + '_result/init.script';
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
			dbmanager.createNewTag(function(err, tag_str) {
				if(err) {
					io.emit('processOBJuploadfile', {status: 'error', cid: data.cid, result: 'cannot_create_tag'});
					return;
				}

				var tag_json = {};
				tag_json.tag=tag_str;
				tag_json.type='mesh'
				tag_json.source='localupload';
				tag_json.date=Date.now();
				tag_json.data = data.file;

				var volumes = [];
				var volume = {};
				volume.data_dir='data/local/' + basename + '_result';
				volume.json=jsonurl;
				volume.initscr = initurl;
				volume.thumb=thumburl;
				volume.png=pngurl;
				volume.xrw=xrwurl;
				volume.zip=zipurl;
				volume.res=obj.objects[0].volume.res;
				volumes.push(volume);
				tag_json.volumes=volumes;
				
				dbmanager.insertNewTag(tag_json, function(err, res) {
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


function convertPointcloud(io, data, in_file) {
	var file = data.file;
	var filepath = config.local_data_dir + file;
	var basename = path.parse(filepath).name;
	var out_dir = config.local_data_dir + basename + '_result';
	
	var cmd = 'cd ' + config.potree_converter_dir + ' && ./PotreeConverter -o ' + out_dir + ' -i ' + in_file + ' -p potree';
	console.log(cmd);
	io.emit('processuploadfile_point', {status: 'working', result: 'Converting pointcloud...(it takes long time to process big data e.g. ~10min for 100k points)'});
	exec(cmd, function(err, stdout, stderr) {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			io.emit('processuploadfile_point', {status: 'error', result: 'cannot_convert_pointcloud', detail: stderr});
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

		//generete tag for later use
		dbmanager.createNewTag(function(err, tag_str) {
			if(err) {
				io.emit('processuploadfile_point', {status: 'error', cid: data.cid, result: 'cannot_create_tag'});
				return;
			}
	
			var tag_json = {};
			tag_json.tag=tag_str;
			tag_json.type='point'
			tag_json.source='localupload';
			tag_json.date=Date.now();
			tag_json.data = data.file;
				
			var potree_url = 'data/local/'+basename + '_result/potree.html';
			var volumes = [];
			var volume = {};
			volume.data_dir ='data/local/' + basename + '_result';
			volume.potree_url = potree_url;
			volume.res = [numpoints];
			volumes.push(volume);
			tag_json.volumes=volumes;
			
			dbmanager.insertNewTag(tag_json, function(err, res) {
				if (err) {
					io.emit('processuploadfile_point', {status: 'error', result: 'cannot_generate_tag_json'});
					//throw err;
					return;
				} 
				io.emit('processuploadfile_point', {status: 'done', tag: tag_str, potree_url: potree_url});
			});
		});
    });
}

//module.exports.processUploadFile = processUploadFile_Meshes;
module.exports.processUploadFile = processUploadFile;
