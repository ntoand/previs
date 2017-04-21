/*
// OBJ manager
// Michael Eager -based on Toan's node-local



// require variables to be declared
'use strict';

var fs 			= require('fs');
var path        = require('path');
var exec        = require('child_process').exec;
var crypto 		= require('crypto');

var myutils 	= require('./node-utils');
var config		= require('./node-config').config;
var dbmanager   = require('./node-dbmanager');



function processUploadObjFile(io, data) {
    var basename = path.basename(data.file, '.zip');
	  var filename = data.file;
	  var zipfile = config.local_data_dir + filename;
	  var result_dir = config.local_data_dir + basename + '_result';
    var result_msg = 'Uploaded valid zip file';
	 	var cmd = 'if test ${PIP_REQUIRE_VIRTUALENV+defined}; then PIP_REQUIRE_VIRTUALENV="";fi;cd ' + config.scripts_dir +' && python verifyZipOBJ.py -i ' + zipfile + ' -o ' + result_dir;

	  console.log(cmd);
	  exec(cmd, function(err, stdout, stderr) 
         {
    	       console.log(stdout);
    	       console.log(stderr);
    	       if(err)
		         {
			           io.emit('processOBJuploadfile', {status: 'error', result: 'cannot validate zip file', detail: stderr});
			           return;
		         }
		         io.emit('processOBJuploadfile', {status: 'working', result: ' Zip file has valid components for OBJ/Mesh viewing.'})
             createWebSurferTokFile(io, data);
         });

}

function createWebSurferTokFile(io, data) {
    var basename = path.basename(data.file, '.zip');
	  var result_msg = 'Uploaded ';
	  var filename = data.file;
	  var zipfile = config.local_data_dir + filename;
    var result_dir = config.local_data_dir + basename + '_result';

    var cmd = 'if test ${PIP_REQUIRE_VIRTUALENV+defined}; then PIP_REQUIRE_VIRTUALENV="";fi;cd ' + config.scripts_dir + ' && python make_token_file.py -i ' + result_dir;

	  console.log(cmd);
	  exec(cmd, function(err, stdout, stderr) 
         {
    	       console.log(stdout);
    	       console.log(stderr);
    	       if(err)
		         {
			           io.emit('processOBJuploadfile', {status: 'error', result: 'cannot create Websurfer model.tok file', detail: stderr});
			           return;
		         }
		         io.emit('processOBJuploadfile', {status: 'working', result: 'creating on model.tok ok. Now creating LavaVu init.script'})
		         createLavaVuInitScript(io, data);
             
         });
}

function createLavaVuInitScript(io, data) {
    var basename = path.basename(data.file, '.zip');
	  var result_msg = 'LavaVu init script created';
	  var filename = data.file;
	  var zipfile = config.local_data_dir + filename;
    var result_dir = config.local_data_dir + basename + '_result';
	  var cmd = 'if test ${PIP_REQUIRE_VIRTUALENV+defined}; then PIP_REQUIRE_VIRTUALENV="";fi;cd ' + config.scripts_dir +' && python make_lavaVu_script.py -i ' + result_dir;

	  console.log(cmd);
	  exec(cmd, function(err, stdout, stderr) 
         {
    	       console.log(stdout);
    	       console.log(stderr);
    	       if(err)
		         {
			           io.emit('processOBJuploadfile', {status: 'error', result: 'cannot create LavaVu init.script file', detail: stderr});
			           return;
		         }
		         io.emit('processOBJuploadfile', {status: 'working', result: ' init.script created. Centering OBJ files.'})
             centreObjects(io, data);
         });
}

function centreObjects(io, data) {
    var basename = path.basename(data.file, '.zip');
	  var result_msg = 'Centre all objects to origin!';
	  var filename = data.file;
	  var zipfile = config.local_data_dir + filename;
    var result_dir = config.local_data_dir + basename + '_result';
	  var cmd = 'cd ' + config.scripts_dir +' && ./centre_objs.sh -q ' + result_dir  ;

	  console.log(cmd);
	  exec(cmd, function(err, stdout, stderr){
             console.log(stderr);
    	       console.log(stdout);
    	       //console.log(err)
    	       if(err)
		         {
			           io.emit('processOBJuploadfile', {status: 'error', result: 'cannot centre OBJ files.', detail: 'See log file'});
			           return;
		         }

		         io.emit('processOBJuploadfile', {status: 'working', result: ' All obj files centred. Creating JSON file.'})
             console.log('Finished centering objects.')
             sendViewDataToClient2(io, data);
         });
}


function sendViewDataToClient2(io, data) {
	  var basename = path.basename(data.file, '.zip');
	  var result_path = config.local_data_dir + basename + '_result/';
	  var modeltok = result_path + '/model.tok';
	  var jsonfile = result_path +  '/mesh.json';
	  var jsontemp = path.dirname(process.mainModule.filename) + '/src/meshtemplate.json';
	  var jsonurl = result_path + '/mesh.json';
	  var thumburl = 'img/knot.png';
    //	var pngurl = 'data/local/' + basename + '_result/vol.png';
    //	var xrwurl = 'data/local/' + basename + '_result/vol.xrw';
    console.log('In sendViewDataToClient.')
	  fs.readFile(jsontemp, 'utf8', function (err, jsondata) {
		    if (err) {
			      io.emit('processuploadfile', {status: 'error', result: 'cannot_read_template_json'});
			      //throw err;
			      return;
		    } 
		    var obj = JSON.parse(jsondata);
        console.log('Default mesh: ' + obj.objects[0].mesh)

		    obj.objects[0].mesh.url = result_path;
        
        //2>&1 | awk '/OBJ vertex range/ { print $4, $6}' | tr ',' ' ' | tr -d '()'
		    var cmd = 'grep BoundingBox ' + result_path + '/boundingbox.txt  ';
		    exec(cmd, function(err, stdout, stderr) {
    		    if (err) {
				        io.emit('processuploadfile', {status: 'error', result: 'cannot_run_grep_boundingbox'});
				        //throw err;
				        return;
			      }
            console.log('Stdout bb: ' + stdout)
            stdout = myutils.trim(stdout).trim();
	    	    var res = stdout.split(" ");
            console.log(res)
	    	    obj.objects[0].mesh.xrange = [ res[1], res[4] ];
            obj.objects[0].mesh.yrange = [ res[2], res[5] ];
	    	    obj.objects[0].mesh.zrange = [ res[3], res[6] ];


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
					          tag_json.type='mesh'
					          tag_json.source='localOBJupload';
					          tag_json.date=Date.now();

					          var meshes = [];
					          var mesh = {};
                    mesh.url=result_path;
					          mesh.json=jsonurl;
                    mesh.thumburl=thumburl;
                    mesh.xrange=obj.objects[0].mesh.xrange;
                    mesh.yrange=obj.objects[0].mesh.yrange;
                    mesh.zrange=obj.objects[0].mesh.zrange;
					          meshes.push(mesh);
					          tag_json.meshes=meshes;

					          fs.writeFile( config.info_dir+'/'+tag_str+'.json', JSON.stringify(tag_json, null, 4), function(err) {
						            if (err) {
							              io.emit('processOBJuploadfile', {status: 'error', result: 'cannot_generate_json_file'});
							              //throw err;
							              return;
						            }
						            io.emit('processOBJuploadfile', {status: 'done', tag: tag_str, json: jsonurl, thumb: thumburl});
					          }); //writeFile	
				        });  //dbmanager
			      });   //fs.writeFile
        }); //exec
	  });		//fs.readFIle
}

module.exports.processUploadObjFile = processUploadObjFile;

*/