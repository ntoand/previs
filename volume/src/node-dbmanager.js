sqlite3 = require('sqlite3').verbose()

var DBManager = function () {};

DBManager.prototype.addNew = function (basename) {
	var crypto = require('crypto');
	var dbname = './db/webcave2.db';
	var db = new sqlite3.Database(dbname);
	var id = '';

	var found = 1;
	while (found == 1){
		id = crypto.randomBytes(3).toString('hex');

		db.serialize(function() {
			// create Tag table if needed
		  	db.run('CREATE TABLE if not exists Tag (id TEXT, basename TEXT, create_date INTEGER, modify_date INTEGER)');
		  	
		  	// find id in the database
		  	found = 0;
		  	db.each('SELECT id AS tag_id FROM Tag WHERE id="' + id + '"', function(err, row) {
		  		if(err)
		  		{
		  			console.log(err);
		  			return;
		  		}
		  		found = 1;
		  	});

		  	// insert
		  	if(found == 0)
		  	{
		  		var stmt = db.prepare("INSERT INTO Tag VALUES (?, ?, ?, ?)");
			    stmt.run([id, basename, Date.now(), Date.now()]);
				stmt.finalize();
			}	  	
		});
	};

	/*
	db.serialize(function() {
		// print out
	  	db.each("SELECT * FROM Tag", function(err, row) {
	  		console.log(row.id + ", " + row.basename + ", " + row.create_date + ", " + row.modify_date);
	  		var c_date = new Date();
	  		c_date.setTime(row.create_date);
	  		console.log(c_date.toDateString() + " " + c_date.toTimeString());
	  	});
	});
	*/

	db.close();

	return id;
};

DBManager.prototype.getFilename = function (tag, callback) {

	var dbname = './db/webcave2.db';
	var db = new sqlite3.Database(dbname);
	var filename = '';

	db.all('SELECT * FROM Tag WHERE id="' + tag + '"',function(err,rows){
		//console.log(rows);
		if(rows.length > 0)
			callback(rows[0].basename);
		else
			callback('');
	});
	
	db.close();
};

module.exports = new DBManager();