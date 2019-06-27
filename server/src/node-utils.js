// require variables to be declared
'use strict';

var fs = require('fs');
var https = require('https');

function fileExists(filepath){
    try
    {
        return fs.statSync(filepath).isFile();
    }
    catch (err)
    {
        return false;
    }
}

function trim(str) {
    return str.replace(/ +(?= )/g,'');
}

function packAndSend(io, action, data) {
    if(io.socket) {
        //io.socket.emit('message', {action: action, data: data});
        io.socket.emit(action, data);
    }
    else {
        if(io.res && data.status !== 'working') {
            io.res.json({action: action, data: data});
        }
    }
}

function createDirSync(dir) {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

function moveFile(oldPath, newPath, callback) {
    fs.rename(oldPath, newPath, function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                copy();
            } else {
                callback(err);
            }
            return;
        }
        callback();
    });
    
    function copy() {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on('error', callback);
        writeStream.on('error', callback);

        readStream.on('close', function () {
            fs.unlink(oldPath, callback);
        });

        readStream.pipe(writeStream);
    }
}

function extractGoogleId(url) {
	var id = '';
	
	// first try with full link e.g. https://drive.google.com/file/d/17cgCGpOo-91kSkMe9limNZtKIV7LtIaq/view?usp=sharing
	var strs = url.split('/');
	for(var i=0; i < strs.length-1; i++) {
		if (strs[i] === 'd') {
			id = strs[i+1];
			break;
		}
	}
	if (id === '' || id.length < 25) {
		//retry with short link e.g. https://drive.google.com/open?id=17cgCGpOo-91kSkMe9limNZtKIV7LtIaq
		strs = url.split('=');
		console.log(strs);
		for (var i=0; i < strs.length-1; i++) {
			if (strs[i].indexOf('?id') !== -1) {
				id = strs[i+1];
				break;
			}
		}
	}
	
	return id;
}

function downloadFileHttps(url, apikey, dest, cb) {
    
    var opts = require('url').parse(url);
    if(typeof apikey !== 'undefined' && apikey !== '') {
        opts.headers = {
          'User-Agent': 'javascript',
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": "ApiKey " + apikey,
        };
    } else {
        opts.headers = {
          'User-Agent': 'javascript',
          "Content-Type": "application/json",
          "Accept": "application/json"
        };
    }
    var file = fs.createWriteStream(dest);
    var request = https.get(opts, function(response) {
        console.log(response);
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);  // close() is async, call cb after close completes.
        });
    }).on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (cb) cb(err.message);
    });
};

function zipDirectory(dir, dirname, zipfile, cb) {
    
    var archiver = require('archiver');
    var archive = archiver('zip');
    
    var output = fs.createWriteStream(zipfile);
    
    archive.on('error', function(err) {
      cb(err, '');
      return;
    });
    
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes archived');
      cb(null, 'end');
    });
    
    archive.pipe(output);
    if(dirname === '') {
        archive.directory(dir, false);
    }
    else {
        archive.directory(dir, dirname);
    }
    archive.finalize();
}


function sendEmail(type, data, detail) {
    
    // send email
    if(!data.settings.sendEmail) return;
    
    const mail = {
		type: type,
		datatype: data.datatype,
		tag: data.tag,
		to: data.userDetails.email,
		userName: data.userDetails.displayName							
    };
    
    var nodemailer = require('nodemailer');
    var gmail = require('../private/gmail.json');
   
    var transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
            user: gmail.user,
            pass: gmail.pass
        }
    });
    
    var mail_subject = '';
    var userName = mail.userName ? mail.userName : 'previs user';
    var mail_body = '<p>Dear ' + userName + ',</p>';
    
    if(mail.type === 'ready') {
        mail_subject = 'You previs data with tag ' + mail.tag +  ' is ready';
        mail_body = mail_body + '<p>Your ' + mail.datatype + ' data uploaded to previs is now ready to view on web at the following link:</p>';
        
        const config	= require('./node-config').config; 
        var hosturl = '';
        if (process.env.NODE_ENV === "production")  {
            hosturl = config.hosturl;
        }
        else {
            hosturl = config.hosturl_dev;
        }
        var url = hosturl;
       
        if(mail.datatype === 'volume') {
            url = url + '/sharevol/?tag=' + mail.tag;
        }
        else if (mail.datatype === 'mesh') {
            url = url + '/meshviewer/?tag=' + mail.tag;
        }
        else if (mail.datatype === 'point') {
            url = url + '/pointviewer/?tag=' + mail.tag;
        }
        else if (mail.datatype === 'image') {
            url = url + '/imageviewer/?tag=' + mail.tag;
        }
        
        mail_body = mail_body + '<p>' + url + '</p>';
        mail_body = mail_body + '<p>It may take a few minutes to compress and prepare your data to view in the CAVE2</p>';
        mail_body = mail_body + '<p>You can also check all your tags on previs ' + hosturl + '</p>';
        mail_body = mail_body + '<p>Kind regards,</p><p>MIVP previs team</p>';
    }
    else if (mail.type === 'fail') {
        mail_subject = 'Previs failed to process your previs data';
        mail_body = mail_body + '<p>Unfortunately previs was unable to process your ' + mail.datatype + ' data. Please try again or contact MIVP team</p>';
        if(detail) mail_body = mail_body + '<p>Log:</p><p>' + JSON.stringify(detail) + '</p>'
        mail_body = mail_body + '<p>Kind regards,</p><p>MIVP previs team</p>';
    }
    
    var mailOptions = {
      from: '"MIVP Previs" <mivp.gacc@gmail.com>',
      to: mail.to,
      cc: 'mivp.gacc@gmail.com',
      subject: mail_subject,
      html: mail_body
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

}

function sendShareNotifyEmail(data) {
    if(!data || data.notify !== true) return;
    var nodemailer = require('nodemailer');
    var gmail = require('../private/gmail.json');
   
    var transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
            user: gmail.user,
            pass: gmail.pass
        }
    });

    const config	= require('./node-config').config; 
    var hosturl = '';
    if (process.env.NODE_ENV === "production")  {
        hosturl = config.hosturl;
    }
    else {
        hosturl = config.hosturl_dev;
    }
    
    var mail_subject = '[previs] ' + data.author + ' shared you a ' + data.for + ' ' + data.id;
    var mail_body = '<p>Hi there,</p>';
    mail_body += '<p>You can login and view your shared items in preview tab on previs ' + hosturl + '</p>';
    mail_body += '<p>Kind regards,</p></p><p>MIVP previs team</p>';
    var mailOptions = {
        from: '"MIVP Previs" <mivp.gacc@gmail.com>',
        to: data.email,
        cc: 'mivp.gacc@gmail.com',
        subject: mail_subject,
        html: mail_body
    };
      
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

function getTimeString() {
    const d = new Date();
    const monthstr = (d.getMonth()+1) < 9 ? '0'+ (d.getMonth()+1).toString() : (d.getMonth()+1).toString();
    const datestr = d.getDate() < 9 ? '0' + d.getDate().toString() : d.getDate().toString();
    const timestr = d.getFullYear().toString() + monthstr + datestr + '_' + d.toLocaleTimeString().replace(/:/g, '-');
    return timestr;
}


module.exports.fileExists = fileExists;
module.exports.trim = trim;
module.exports.packAndSend = packAndSend;
module.exports.createDirSync = createDirSync;
module.exports.moveFile = moveFile;
module.exports.extractGoogleId = extractGoogleId;
module.exports.downloadFileHttps = downloadFileHttps;
module.exports.zipDirectory = zipDirectory;
module.exports.sendEmail = sendEmail;
module.exports.getTimeString = getTimeString;
module.exports.sendShareNotifyEmail = sendShareNotifyEmail;