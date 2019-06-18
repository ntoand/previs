'use strict';

var fs 			= require('fs');
var path        = require('path');
var config		= require('./node-config').config; 
var myutils 	= require('./node-utils');

const winston   = require('winston');

// ===============================
function getTags(io, data) {

    var tags = [];
  
    data.db.getAllTags(function(err, rows) { 
        //console.log(err);
        //console.log(rows);
        if(err) {
            myutils.packAndSend(io, 'admingettags', {status: 'error', result: 'cannot_get_tags'});
            return;
        }
        for (var i=0, l=rows.length; i < l; i++) {
            
            var row = rows[i];
            var tag = row.tag;
    
            var t = {};
            t.tag = tag;
            t.type = row.type;
            t.source = row.source;
            var d = new Date(row.date);
            t.date = d.toString();
            t.size = row.volumes[0].res.toString();
            t.data = row.data;
            tags.push(t);
        }
        //console.log(tags);
        myutils.packAndSend(io, 'admingettags', {status: 'done', result: tags});
    });
}

var deleteFolderRecursive = function(dir) {
  if( fs.existsSync(dir) ) {
    fs.readdirSync(dir).forEach(function(file,index){
      var curDir = path.join(dir, file);
      if(fs.lstatSync(curDir).isDirectory()) { // recurse
        deleteFolderRecursive(curDir);
      } else { // delete file
        fs.unlinkSync(curDir);
      }
    });
    fs.rmdirSync(dir);
  }
};

function deleteTag(io, data, item) {
    var tag = item.tag;
    var dir = item.dir || tag;
    var collection = item.collection;
    var userId = item.userId;
    data.db.getTag(tag, function(err, res){
        if (err) {
            myutils.packAndSend(io, data.action, {status: 'error', result: err});
    		return;
    	} 
    	if(res === null) {
    	    myutils.packAndSend(io, data.action, {status: 'error', result: 'tag not found'});
    		return;
    	}
    	if(res.userId !== userId) {
    	    myutils.packAndSend(io, data.action, {status: 'error', result: 'userId not match'});
    		return;
    	}
    	//delete tag and data
    	var tag_dir = config.tags_data_dir + dir;
        winston.info('delete ' + tag_dir);
        deleteFolderRecursive(tag_dir);
        
        //delete tag in database
        data.db.deleteTag(tag, collection, function(err) {
            if(err) {
                myutils.packAndSend(io, data.action, {status: 'error', result: data, detail: 'failed to delete tag'});
            }
            else {
                myutils.packAndSend(io, data.action, {status: 'done', result: data});
            }
        });
    });
}

// ===============================
function deleteTags(io, data) {
    for (var i=0, l=data.tags.length; i < l; i++) {
        var item =  data.tags[i];
        winston.info(item);
        deleteTag(io, data, item);
    }
}

function updateTag(io, data) {
    var tag = data.tag;
    var type = data.type || '';
    var updatedata = data.data;
    
    data.db.updateTag(tag, updatedata, function(err) {
        if (err) 
            myutils.packAndSend(io, data.action, {status: 'error', type: type, result: err});
    	else 
    	    myutils.packAndSend(io, data.action, {status: 'done', type: type, result: {tag: tag, data: updatedata}});
    });
}

function updateTagCollection(io, collectionPrev, data) {
    var tag = data.tag;
    var type = data.type || '';
    var updatedata = data.data;
    
    winston.info('updateTagCollection %s %s', collectionPrev, updatedata.collection);
    data.db.updateTagCollection(tag, collectionPrev, updatedata, function(err) {
        if (err) {
            myutils.packAndSend(io, data.action, {status: 'error', type: type, result: err});
        }
    	else {
            myutils.packAndSend(io, data.action, {status: 'done', type: type, result: {tag: tag, data: updatedata}});
        }
    });
}

function getTagsByUserEmail(io, data) {
    
    winston.info('node-admin getTagsByUserEmail email: %s, collection: %s', data.userEmail, data.collection);
    data.db.getTagsByUserEmail(data.userEmail, data.collection, function(err, res){
        if(err) {
            myutils.packAndSend(io, data.action, {status: 'error', result: err});
            return;
        } 
        myutils.packAndSend(io, data.action, {status: 'done', result: res});
    });
}

function getCollectionsByUserEmail(io, data) {
    
    winston.info('node-admin getCollectionsByUserEmail email: %s', data.userEmail);
    data.db.getCollectionsByUserEmail(data.userEmail, function(err, res){
        if(err) {
            myutils.packAndSend(io, data.action, {status: 'error', result: err});
            return;
        } 
        myutils.packAndSend(io, data.action, {status: 'done', result: res});
    });
}

function addNewCollection(io, data) {
    winston.info('node-admin addNewCollection');
    data.db.addNewCollection(data.data, function(err, res){
        if(err) {
            myutils.packAndSend(io, data.action, {status: 'error', result: err});
            return;
        } 
        myutils.packAndSend(io, data.action, {status: 'done', result: res});
    });
}

function updateCollection(io, data) {
    winston.info('node-admin updateCollection');
    data.db.updateCollection(data.data.id, data.data, function(err, res){
        if(err) {
            myutils.packAndSend(io, data.action, {status: 'error', result: err});
            return;
        } 
        myutils.packAndSend(io, data.action, {status: 'done', result: res});
    });
}

function deleteCollection(io, data) {
    winston.info('node-admin deleteCollection');
    data.db.deleteCollection(data.data, function(err, res){
        if(err) {
            myutils.packAndSend(io, data.action, {status: 'error', result: err});
            return;
        } 
        myutils.packAndSend(io, data.action, {status: 'done', result: res});
    });
}

// bundle
function getDataBundleByUserEmail(io, data) {
    winston.info('node-admin getDataBundleByUserEmail email: %s, collection: %s', data.userEmail, data.collection);
    data.db.getDataBundleByUserEmail(data.userEmail, data.collection, function(err, res){
        if(err) {
            myutils.packAndSend(io, data.action, {status: 'error', result: err});
            return;
        } 
        myutils.packAndSend(io, data.action, {status: 'done', result: res});
    });
}

// sharing
function updateShareEmail(io, data) {
    let d = data.data;
    winston.info('node-admin updateShareEmail for: %s id: %s', d.for, d.id);
    //d{for: , id: , action:, email: , notify: }
    var updatedata =  {share: {}};
    updatedata.share[d.email] = d.action === 'add' ? 1 : 0;
    if(d.for === 'tag') {
        data.db.updateTag(d.id, updatedata, function(err) {
            if (err) {
                winston.error(err);
                myutils.packAndSend(io, data.action, {status: 'error', result: err});
            }   
            else {
                myutils.packAndSend(io, data.action, {status: 'done', result: d});
                myutils.sendShareNotifyEmail(d);
            }
        });
    }
    else { // collection
        data.db.updateCollection(d.id, updatedata, function(err) {
            if (err) {
                winston.error(err);
                myutils.packAndSend(io, data.action, {status: 'error', result: err});
            }   
            else {
                myutils.packAndSend(io, data.action, {status: 'done', result: d});
                myutils.sendShareNotifyEmail(d);
            }
        });
    }
}

module.exports.getTags = getTags;
module.exports.deleteTags = deleteTags;
module.exports.updateTag = updateTag;
module.exports.updateTagCollection = updateTagCollection;
module.exports.getTagsByUserEmail = getTagsByUserEmail;
module.exports.getCollectionsByUserEmail = getCollectionsByUserEmail;
module.exports.addNewCollection = addNewCollection;
module.exports.updateCollection = updateCollection;
module.exports.deleteCollection = deleteCollection;
module.exports.getDataBundleByUserEmail = getDataBundleByUserEmail;
module.exports.updateShareEmail = updateShareEmail;