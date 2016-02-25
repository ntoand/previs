// require variables to be declared
'use strict';

var fs 			= require('fs');
var path        = require('path');
var exec        = require('child_process').exec;
var crypto 		= require('crypto');

var myutils 	= require('./node-utils');
var config		= require('./node-config').config;  

//=============================
function viewDataset(io, data){
	//console.log('downloadData: ' + data);
	var result_msg = 'download ok. Now convert to nifti';
	var compdicomfile = config.daris_data_dir + data.cid + '.zip';
	if(!myutils.fileExists(compdicomfile)) {
		var cmd = 'cd ' + config.scripts_dir + ' && python run_daris.py -t download -s ' + data.sid + ' -c ' + data.cid + ' -a ' + compdicomfile;
		console.log(cmd);
		exec(cmd, function(err, stdout, stderr) 
	    {
	    	console.log(stdout);
	    	console.log(stderr);
	    	if(err)
			{
				io.emit('viewdataset', {status: 'error', cid: data.cid, result: 'cannot_download_file'});
				return;
			}
			io.emit('viewdataset', {status: 'working', cid: data.cid, result: result_msg})
			convertToNifti(io, data);

	    });
	}
	else {
		console.log("exist, can process zip file now");
		io.emit('viewdataset', {status: 'working', cid: data.cid, result: result_msg})
		convertToNifti(io, data);
	}
}

function convertToNifti(io, data) {
	var result_msg = 'convert to nii ok. Now convert to xwr';
	var dirpath = config.daris_data_dir + data.cid;
	if(!myutils.fileExists(dirpath + '/0001.nii')) {
		var cmd = 'cd ' + config.scripts_dir + ' && python dcm2nii.py -i ' + dirpath;
		console.log(cmd);
		exec(cmd, function(err, stdout, stderr) 
	    {
	    	console.log(stdout);
	    	console.log(stderr);
	    	if(err)
			{
				io.emit('viewdataset', {status: 'error', cid: data.cid, result: 'cannot_convert_to_nii'});
				return;
			}
			io.emit('viewdataset', {status: 'working', cid: data.cid, result: result_msg})
			convertToXRW(io, data);
	    });
	}
	else {
		console.log("exist, can process nii file now");
		io.emit('viewdataset', {status: 'working', cid: data.cid, result: result_msg})
		convertToXRW(io, data);
	}
}

function convertToXRW(io, data) {
	var result_msg = 'convert to xrw ok. Now convert to png';
	var dirpath = config.daris_data_dir + data.cid;
	var niifile = dirpath + '/0001.nii';
	var xrwfile = dirpath + '/0001.xrw';
	if(!myutils.fileExists(xrwfile)) {
		var cmd = 'nifti2xrw -f ' + niifile + ' -o ' + xrwfile;
		console.log(cmd);
		exec(cmd, function(err, stdout, stderr) 
	    {
	    	console.log(stdout);
	    	console.log(stderr);
	    	if(err)
			{
				io.emit('viewdataset', {status: 'error', cid: data.cid, result: 'cannot_convert_to_xrw', detail: stderr});
				return;
			}
			io.emit('viewdataset', {status: 'working', cid: data.cid, result: result_msg});
			
			convertToPng(io, data);

	    });
	}
	else {
		console.log("exist, can process xrw file now");
		io.emit('viewdataset', {status: 'working', cid: data.cid, result: result_msg});
		convertToPng(io, data);
	}
}

function convertToPng(io, data) {
	var result_msg = 'convert to png ok. Now prepare json file';
	var dirpath = config.daris_data_dir + data.cid;
	var xrwfile = dirpath + '/0001.xrw';
	var pngfile = dirpath + '/0001.png';
	
	if(!myutils.fileExists(pngfile)) {
		var cmd = 'xrw2pngmos -f ' + xrwfile + ' -o ' + pngfile;
		console.log(cmd);
		exec(cmd, function(err, stdout, stderr) 
	    {
	    	console.log(stdout);
	    	console.log(stderr);
	    	if(err)
			{
				io.emit('viewdataset', {status: 'error', cid: data.cid, result: 'cannot_convert_to_png'});
				return;
			}
			io.emit('viewdataset', {status: 'working', cid: data.cid, result: result_msg});
			sendViewDataToClient(io, data);
	    });
	}
	else {
		console.log("exist, can process png file now");
		io.emit('viewdataset', {status: 'working', cid: data.cid, result: result_msg});
		sendViewDataToClient(io, data);
	}
}

function sendViewDataToClient(io, data) {
	var dirpath = config.daris_data_dir + data.cid;
	var xrwfile = dirpath + '/0001.xrw';
	var pngfile = dirpath + '/0001.png';
	var jsonfile = dirpath + '/0001.json';
	var jsontemp = path.dirname(process.mainModule.filename) + '/src/template.json';
	var jsonurl = 'data/daris/' + data.cid + '/0001.json';

	fs.readFile(jsontemp, 'utf8', function (err, jsondata) {
		if (err) {
			io.emit('viewdataset', {status: 'error', cid: data.cid, result: 'cannot_generate_json'});
			throw err;
		} 
		var obj = JSON.parse(jsondata);
		obj.url = 'data/daris/' + data.cid + '/0001.png';

		var cmd = 'xrwinfo ' + xrwfile + ' | grep dimensions';
		exec(cmd, function(err, stdout, stderr) 
	    {
    		if (err) {
				io.emit('viewdataset', {status: 'error', cid: data.cid, result: 'cannot_run_xrwinfo'});
				throw err;
			} 
				
	    	stdout = myutils.trim(stdout).trim();
	    	var res = stdout.split(" ");

	    	obj.res = [res[2], res[3], res[4]];

	    	//write
			fs.writeFile( jsonfile, JSON.stringify(obj, null, 4), function(err) {
				if (err) {
					io.emit('viewdataset', {status: 'error', cid: data.cid, result: 'cannot_generate_json'});
					throw err;
				} 
				console.log('sendViewDataToClient');
				console.log(data);
				if(data.task == 'caveview') {
					//generete tag for later use
					var found = 1;
					var tag_str = '';
					while (found == 1){
						tag_str = crypto.randomBytes(3).toString('hex');
						if(!myutils.fileExists(config.info_dir+'/'+tag_str+'.json')) {
							found = 0;
						}
					};
					console.log(tag_str);
					
					var tag_json = {};
					tag_json.tag=tag_str;
					tag_json.date=Date.now();
					var volumes = [];
					var volume = {};
					volume.type='daris';
					volume.json=jsonurl;
					volumes.push(volume);
					tag_json.volumes=volumes;
	
					fs.writeFile( config.info_dir+'/'+tag_str+'.json', JSON.stringify(tag_json, null, 4), function(err) {
						if (err) {
							io.emit('viewdataset', {status: 'error', result: 'cannot_generate_tag_json'});
							throw err;
						} 
						io.emit('viewdataset', {status: 'done', cid:data.cid, task: data.task, 
												  tag: tag_str, json: jsonurl});
					});	
					
				}
				else if( data.task == 'webview') {
					io.emit('viewdataset', {status: 'done', cid: data.cid, task: data.task, json: jsonurl});
				}
				
			});
	    });		
	});
}

// ===============================
function searchDataset(io, data) {

	var cmd = 'cd ' + config.scripts_dir + ' && python run_daris.py -t search -s ' + data.sid + ' -c ' + data.cid + ' -a ' + data.keyword;
	console.log(cmd);
	exec(cmd, function(err, stdout, stderr) 
    {
    	console.log(stdout);
    	console.log(stderr);
    	if(err)
		{
			io.emit('searchdataset', {status: 'error', result: 'cannot_search_dataset', detail: stderr});
			return;
		}
		io.emit('searchdataset', {status: 'done', result: stdout})
    });
}

module.exports.viewDataset = viewDataset;
module.exports.searchDataset = searchDataset;