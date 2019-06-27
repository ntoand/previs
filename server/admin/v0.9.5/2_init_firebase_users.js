/*
DONT RUN THIS SCRIPT
The script is implemented to create users collection from authentication
To run before upgrading to v0.9.5
*/
var config	    = require('../../src/node-config').config;
var admin = require('firebase-admin');

if (process.env.NODE_ENV === "production")  {
    console.log('Mode: production')
    serviceAccount = require(config.firebase_service_acc_key);
    dburl = config.firebase_db_url;
}
else {
    console.log('Mod: development');
    serviceAccount = require(config.firebase_service_acc_key_dev);
    dburl = config.firebase_db_url_dev;
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: dburl
});
var db = admin.firestore();

// List batch of users, 1000 at a time.
admin.auth().listUsers(1000)
.then(function(listUsersResult) {
    var users = [];
    listUsersResult.users.forEach(function(userRecord) {
        const user = userRecord.toJSON();
        users.push({
            id: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
        });
    });
    console.log(users);
    createUser(users, 0);
})
.catch(function(error) {
    console.log("Error listing users:", error);
    admin.app().delete();
});

function createUser(users, index = 0) {

    if(index >= users.length) {
        admin.app().delete();
        return;
    }

    var user = users[index];
    var userRef = db.collection('users').doc(user.id);
    userRef.get()
    .then(doc => {
        if (!doc.exists) {
            user.numtags = 0;
            user.disk = 0;
            user.active = true;
            user.quota = 0;
            userRef.set(user, {merge: true})
            .then( () => {
                createUser(users, index + 1);
            })
            .catch( e => {
                console.log(e);
                createUser(users, index + 1);
            });
        }
        else {
            console.log('skip: user ', user.id, user.displayName);
            createUser(users, index + 1);
        }
    })
    .catch(err => console.log(err));
}