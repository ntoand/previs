// require variables to be declared
'use strict';

var fs 			= require('fs');
var path        = require('path');
//var dbmanager = require('./src/dbmanager.js');
var exec 		= require('child_process').exec;

var myutils 	  = require('./node-utils');

var tiff_data_dir = path.dirname(process.mainModule.filename) + '/public/data/tiff/';
var scripts_dir = './src';

function processUploadFile(io, data) {
	var filename = data.file;
	var zipfile = tiff_data_dir + filename;
	var cmd = 'cd ' + scripts_dir + ' && python tiff2tga.py -i ' + zipfile + ' -o ' + tiff_data_dir;
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
		io.emit('processuploadfile', {status: 'working', cid: data.cid, result: 'convert tiff to tga ok. Now convert to xrw'})
		convertToXRW(io, data);

    });
}

function convertToXRW(io, data) {
	var filename = data.file;
	var basename = path.basename(filename, '.zip');
	var tga_dir = tiff_data_dir + basename + '_tga';
	var result_dir = tiff_data_dir + basename + '_result';
	var cmd = 'cd ' + scripts_dir + ' && tgastack2xrw -f ' + tga_dir + '/%04d.tga -o ' + result_dir + '/vol.xrw && rm -rf ' + tga_dir;
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
		io.emit('processuploadfile', {status: 'working', cid: data.cid, result: 'convert tga to xrw ok. Now convert to png'})

		convertToPNG(io, data);
    });
}

function convertToPNG(io, data) {
	var filename = data.file;
	var basename = path.basename(filename, '.zip');
	var result_dir = tiff_data_dir + basename + '_result';
	var cmd = 'cd ' + scripts_dir + ' && xrw2pngmos -f ' + result_dir + '/vol.xrw -o ' + result_dir + '/vol.png' 
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
		io.emit('processuploadfile', {status: 'working', cid: data.cid, result: 'convert xrw to png ok. Now prepare json file'});
		sendViewDataToClient(io, data);
    });
}

function sendViewDataToClient(io, data) {
	var basename = path.basename(data.file, '.zip');
	var xrwfile = tiff_data_dir + basename + '_result/vol.xrw';
	var pngfile = tiff_data_dir + basename + '_result/vol.png';
	var jsonfile = tiff_data_dir + basename + '_result/vol.json';
	var jsontemp = path.dirname(process.mainModule.filename) + '/src/template.json';

	var jsonurl = 'data/tiff/' + basename + '_result/vol.json';
	var thumburl = 'data/tiff/' + basename + '_result/vol_thumb.png';
	var pngurl = 'data/tiff/' + basename + '_result/vol.png';
	var xrwurl = 'data/tiff/' + basename + '_result/vol.xrw';

	fs.readFile(jsontemp, 'utf8', function (err, jsondata) {
		if (err) {
			io.emit('processuploadfile', {status: 'error', cid: data.cid, result: 'cannot_generate_json'});
			throw err;
		} 
		var obj = JSON.parse(jsondata);
		obj.url = 'data/tiff/' + basename + '_result/vol.png';

		var cmd = 'xrwinfo ' + xrwfile + ' | grep dimensions';
		exec(cmd, function(err, stdout, stderr) 
	    {
	    	stdout = myutils.trim(stdout).trim();
	    	var res = stdout.split(" ");

	    	obj.res = [res[2], res[3], res[4]];

	    	//write
			fs.writeFile( jsonfile, JSON.stringify(obj, null, 4), function(err) {
				if (err) {
					io.emit('processuploadfile', {status: 'error', cid: data.cid, result: 'cannot_generate_json'});
					throw err;
				} 
				io.emit('processuploadfile', {status: 'done', cid: data.cid, json: jsonurl, thumb: thumburl, 
											  png: pngurl, xwr: xrwurl});
			});
	    });		
	});
}

module.exports.processUploadFile = processUploadFile;