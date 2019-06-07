/*
DONT RUN THIS SCRIPT
The script is implemented to generate api key for an app
*/
var config	= require('../src/node-config').config; 
var FilebaseManager   = require('../src/node-firebase');
var object = new FilebaseManager();

if (process.env.NODE_ENV === "production")  {
   console.log('Mode: production')
}
else {
   console.log('Mod: development');
}

console.log(process.argv);
var appname = process.argv[2];
if(!appname) {
    console.log("Error: need to provide app name");
    process.exit(0);
}

// check if key exists
object.getKeyByAppName(appname, function(err, data) {
   if(data) {
       console.log('Api key for ' + appname + ' already exists');
       return;
   } 
   // create new key for the appname
   const uuidv1 = require('uuid/v1');
   const keyinfo = {
        type: 'app',
        appname: appname,
        key: uuidv1(),
        date: Date.now(),
        email: 'mivp.gacc@gmail.com'
   };
   object.generateAppApiKey(keyinfo, function(err, ret) {
      if(err) console.log('Failed to generate app api key', err);
      else console.log('App api key generated successfully', ret);
   });
});

console.log('Done');