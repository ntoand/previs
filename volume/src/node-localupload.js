// require variables to be declared
'use strict';

var fs 			= require('fs');
var path        = require('path');
var exec 		= require('child_process').exec;

var myutils 	= require('./node-utils');
var config		= require('./node-config').config; 
var dbmanager   = require('./node-dbmanager');

function processUploadFile(io, data) {
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
					volume.data_dir='data/local/' + basename + '_result';
					volume.json_full=jsonurl_full;
					volume.json_web=jsonurl_web;
					volume.thumb=thumburl;
					volume.png=pngurl;
					volume.xrw=xrwurl;
					volume.res_full=obj_full.objects[0].volume.res;
					volume.res_web=obj_web.objects[0].volume.res;
					volumes.push(volume);
					tag_json.volumes=volumes;
	
					fs.writeFile( config.info_dir+'/'+tag_str+'.json', JSON.stringify(tag_json, null, 4), function(err) {
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

module.exports.processUploadFile = processUploadFile;