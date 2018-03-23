var dbmanager   = require('../src/node-mongodb');

//var testcase = 0; // create, insert, display all tags
//var testcase = 1; // get a tag
var testcase = 1; // delete a tag
//var testcase = 3; // display all tags

if (testcase == 0) {
    dbmanager.createNewTag(function (err, tag) {
        console.log(tag);
        tag = {tag: tag, name: 'testname', desc: 'testdesc'};
        dbmanager.insertNewTag(tag, function(err, res) {
            console.log('all data:');
            dbmanager.getAllTags(function (err, results) {
                console.log(results); 
            });
        });
    });
}
else if (testcase == 1) {
    var tag = '8b9ace';
    dbmanager.getTag(tag, function(err, result) {
       console.log(result); 
    });
}
else if (testcase == 2) {
    var tag = '2d15aa';
    dbmanager.deleteTag(tag, function(err, result) {
       console.log(result); 
       dbmanager.getAllTags(function (err, results) {
            console.log(results); 
       });
    });
}
else if (testcase == 3) {
   dbmanager.getAllTags(function (err, results) {
        console.log(results); 
   });
}

