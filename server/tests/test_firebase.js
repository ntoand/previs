var FilebaseManager   = require('../src/node-firebase');

var object = new FilebaseManager();

test = 2; //0: add/get some data;  1: check and create new tag; 2: retrieve tags; 3: get a tag

if(test === 0) {
    var tag = '1111';
    var data = {
      userId: 'abc',
      userEmail: 'a@c',
      type: 'test',
      description: 'test desc'
    };
    object.addNewTag(tag, data, function(err, res) {
        if(err) console.log(err); 
    });
    
    tag = '2222';
    data = {
      userId: 'edf',
      userEmail: 'e@f',
      type: 'test2222',
      description: 'test2222 desc'
    };
    object.addNewTag(tag, data, function(err, res) {
        if(err) console.log(err); 
    });
    
    tag = '1111';
    object.getTag(tag, function(err, res) {
       if(err) {
           console.log(err);
       } 
       else {
           console.log(res);
       }
    });
}

else if(test === 1) {
    object.createNewTag(function(err, res) {
       if(err) console.log(err);
    });
}

else if(test === 2) {
    
    /*
    object.getAllTags(function(err, res) {
       if(err) console.log(err);
       else console.log(res);
    });
    */
    
    object.getTagsByUserEmail('ntoand@gmail.com', function(err, res) {
       if(err) console.log(err);
       else console.log(res);
    });
}

else if(test ===3) {
    var tag = '6b4a6e';
    object.getTag(tag, function(err, res){
       if(err) console.log(err);
       else console.log(res);
    });
}