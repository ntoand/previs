// require variables to be declared
'use strict';

var fs 			= require('fs');
var path        = require('path');
var exec 		= require('child_process').exec;
var crypto 		= require('crypto');

var myutils 	= require('./node-utils');
var config		= require('./node-config').config; 
var dbmanager   = require('./node-dbmanager');

function processUploadFile(io, data) {
	var filename = data.file;
	var zipfile = config.tiff_data_dir + filename;
	var cmd = 'cd ' + config.scripts_dir + ' && python tiff2tga.py -i ' + zipfile + ' -o ' + config.tiff_data_dir;
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
	var tga_dir = config.tiff_data_dir + basename + '_tga';
	var result_dir = config.tiff_data_dir + basename + '_result';
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
	var result_dir = config.tiff_data_dir + basename + '_result';
	var cmd = 'cd ' + config.scripts_dir + ' && xrw2pngmos -f ' + result_dir + '/vol.xrw -o ' + result_dir + '/vol.png' 
			  + ' && convert ' + result_dir + '/vol.png -thumbnail 256 ' + result_dir + '/vol_thumb.png';
	console.log(cmd);

	exec(cmd, function(err, stdout, stderr) 
    {
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
	var xrwfile = config.tiff_data_dir + basename + '_result/vol.xrw';
	var pngfile = config.tiff_data_dir + basename + '_result/vol.png';
	var jsonfile = config.tiff_data_dir + basename + '_result/vol.json';
	var jsontemp = path.dirname(process.mainModule.filename) + '/src/template.json';

	var jsonurl = 'data/tiff/' + basename + '_result/vol.json';
	var thumburl = 'data/tiff/' + basename + '_result/vol_thumb.png';
	var pngurl = 'data/tiff/' + basename + '_result/vol.png';
	var xrwurl = 'data/tiff/' + basename + '_result/vol.xrw';

	fs.readFile(jsontemp, 'utf8', function (err, jsondata) {
		if (err) {
			io.emit('processuploadfile', {status: 'error', result: 'cannot_generate_json'});
			//throw err;
			return;
		} 
		var obj = JSON.parse(jsondata);
		obj.url = 'data/tiff/' + basename + '_result/vol.png';

		var cmd = 'xrwinfo ' + xrwfile + ' | grep dimensions';
		exec(cmd, function(err, stdout, stderr) 
	    {
    		if (err) {
				io.emit('processuploadfile', {status: 'error', result: 'cannot_run_xrwinfo'});
				//throw err;
				return;
			} 
	    	
	    	stdout = myutils.trim(stdout).trim();
	    	var res = stdout.split(" ");

	    	obj.res = [res[2], res[3], res[4]];

	    	//write
			fs.writeFile( jsonfile, JSON.stringify(obj, null, 4), function(err) {
				if (err) {
					io.emit('processuploadfile', {status: 'error', result: 'cannot_generate_json'});
					//throw err;
					return;
				} 
				//generete tag for later use
				dbmanager.createTag(data.cid, function(err, tag_str) {
					if(err) {
	    				io.emit('processuploadfile', {status: 'error', cid: data.cid, result: 'cannot_create_tag'});
	    				return;
	    			}
	    		
					var tag_json = {};
					tag_json.tag=tag_str;
					tag_json.type='localupload';
					tag_json.date=Date.now();
					var volumes = [];
					var volume = {};
					volume.json=jsonurl;
					volume.thumb=thumburl;
					volume.png=pngurl;
					volume.xrw=xrwurl;
					volume.res=obj.res;
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

module.exports.processUploadFile = processUploadFile;