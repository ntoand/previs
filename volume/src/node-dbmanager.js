var sqlite3 = require('sqlite3').verbose()
var crypto = require('crypto');
var config	= require('./node-config').config; 

var DBManager = function () {};

function generateTag(callback) {
	var dbname = config.database;
	var db = new sqlite3.Database(dbname);
	var tag = crypto.randomBytes(3).toString('hex');
	db.all('SELECT * FROM Tag WHERE tag="' + tag + '"', function(err, rows) {
		if(rows.length > 0)
			generateTag(callback);
		else 
			callback(null, tag);
	});
}

DBManager.prototype.createTag = function(data, callback) {
	var dbname = config.database;
	var db = new sqlite3.Database(dbname);
	
	db.serialize(function() {
		// create Tag table if needed
	  	db.run('CREATE TABLE if not exists Tag (tag TEXT,  data TEXT, date_added INTEGER)');
	  	
	  	db.all('SELECT * FROM Tag WHERE data="' + data + '"', function(err, rows) {
	  		console.log(rows);
	  		if(rows.length > 0) {
	  			callback(null, rows[0].tag);
	  		}
	  		else {
	  			console.log("createTag");
	  			generateTag( function(err, tag) {
	  				var stmt = db.prepare("INSERT INTO Tag VALUES (?, ?, ?)");
					stmt.run([tag, data, Date.now()]);
					stmt.finalize();
					callback(null, tag);
	  			});
	  		}
	  	});
	});
}

DBManager.prototype.getTags = function(callback) {
	var dbname = config.database;
	var db = new sqlite3.Database(dbname);
	db.all('SELECT * FROM Tag', function(err, rows) {
		callback(err, rows);
	});
}

DBManager.prototype.deleteTag = function(tag, callback) {
	var dbname = config.database;
	var db = new sqlite3.Database(dbname);
	db.run("DELETE FROM Tag WHERE tag=(?)", tag, function(err) {
	    callback(err);
        db.close();
    });
}

module.exports = new DBManager();