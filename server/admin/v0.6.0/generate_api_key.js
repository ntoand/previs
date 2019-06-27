var config	= require('../../src/node-config').config; 
const fbadmin = require("firebase-admin");

var serviceAccount = null;
var dburl = null;
if (process.env.NODE_ENV === "production")  {
    serviceAccount = require(config.firebase_service_acc_key);
    dburl = "https://previs2018.firebaseio.com";
    console.log("Production firebase key " + config.firebase_service_acc_key);
}
else {
    serviceAccount = require(config.firebase_service_acc_key_dev);
    dburl = "https://previs-dev.firebaseio.com"
    console.log("Development firebase key " + config.firebase_service_acc_key_dev);
}
        
fbadmin.initializeApp({
    credential: fbadmin.credential.cert(serviceAccount),
    databaseURL: dburl
});


fbadmin.auth().getUserByEmail('ntoand@gmail.com')
    .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully fetched user data:", userRecord.toJSON());
        
        const uuidv1 = require('uuid/v1');
        
        var db = fbadmin.firestore();
        var data = {
          id: userRecord.uid,
          name: userRecord.displayName,
          email: userRecord.email,
          date: Date.now(),
          key: uuidv1()
        };
        console.log(data);
        
        var docRef = db.collection('keys').doc(userRecord.uid);
        docRef.set(data)
        .then(function() {
            console.log("Document successfully written!");
            console.log("key: ", data.key);
            // close
            fbadmin.app().delete();
        })
        .catch(function(error) {
            console.error("Error writing document: ", error);
            // close
            fbadmin.app().delete();
        });
    })
    .catch(function(error) {
        console.log("Error fetching user data:", error);
        
        // close 
        fbadmin.app().delete();
    });

