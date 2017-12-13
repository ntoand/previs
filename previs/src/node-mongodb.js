var crypto = require('crypto');
var config	= require('./node-config').config; 
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/previsdb";

var MonDBManager = function () {};

MonDBManager.prototype.createNewTag = function(callback) {
    
    var self = this;
    
    var tagstr = crypto.randomBytes(3).toString('hex');
    var query = { tag: tagstr };
    
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection("tags").findOne(query, function(err, result) {
            if (err) throw err;
            if(result != null) {
                self.createNewTag(callback);
            }
            else {
                console.log('new tag: ' + tagstr);
                callback(null, tagstr);
            }
            db.close();
        });
    });
}

MonDBManager.prototype.insertNewTag = function(tagobj, callback) {
    
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        
        db.collection("tags").insertOne(tagobj, function(err, res) {
            if (err) throw err;
            callback(null, res);
            db.close();
        });
    });
}


MonDBManager.prototype.getAllTags = function(callback) {
    
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection("tags").find({}).toArray(function(err, results) {
            if (err) throw err;
            callback(null, results);
            db.close();
        });
    });
}

MonDBManager.prototype.getTag = function(tag, callback) {
    
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var query = {tag: tag};
        
        db.collection("tags").findOne(query, function(err, result) {
            if (err) throw err;
            callback(null, result);
            db.close();
        });
    });
}

MonDBManager.prototype.deleteTag = function(tag, callback) {
    
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var query = {tag: tag};
        
        db.collection("tags").deleteOne(query, function(err, result) {
            if (err) throw err;
            callback(null, result);
            db.close();
        });
    });
}

module.exports = new MonDBManager();

