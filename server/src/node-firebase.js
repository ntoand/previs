var crypto = require('crypto');
var config	= require('./node-config').config; 
const fbadmin = require("firebase-admin");

// Constructor
function FirebaseManager() {
    var serviceAccount = null;
    var dburl = null;
    if (process.env.NODE_ENV === "production")  {
        serviceAccount = require(config.firebase_service_acc_key);
        dburl = config.firebase_db_url;
        console.log("Production firebase key " + config.firebase_service_acc_key);
    }
    else {
        serviceAccount = require(config.firebase_service_acc_key_dev);
        dburl = config.firebase_db_url;
        console.log("Development firebase key " + config.firebase_service_acc_key_dev);
    }
            
    fbadmin.initializeApp({
        credential: fbadmin.credential.cert(serviceAccount),
        databaseURL: dburl
    });
    this.db = fbadmin.firestore();
}

// class methods
FirebaseManager.prototype.createNewTag = function(callback) {
    
    var self = this;
    
    var tagstr = crypto.randomBytes(3).toString('hex');
    
    this.getTag(tagstr, function(err, res) {
        if(err) {
            callback(err);
            return;
        }
        if(res !== null) { //found
            self.createNewTag(callback);
        }
        else {
            console.log('new tag created: ' + tagstr);
            callback(null, tagstr);
        }
    });
}

FirebaseManager.prototype.insertNewTag = function(tagdata, callback) {
    var docRef = this.db.collection('tags').doc(tagdata.tag);
    var setAda = docRef.set(tagdata);
    callback(null, setAda);
}

FirebaseManager.prototype.addNewTag = function(tag, data, callback) {
    var docRef = this.db.collection('tags').doc(tag);
    var setAda = docRef.set(data);
    callback(null, setAda);
}

FirebaseManager.prototype.getTag = function(tag, callback) {
    
    var tagRef = this.db.collection('tags').doc(tag);
    var getDoc = tagRef.get()
    .then(doc => {
        if (!doc.exists) {
            //console.log('No such document!');
            callback(null, null);
        } else {
            //console.log('Document data:', doc.data());
            callback(null, doc.data());
        }
    })
    .catch(err => {
        //console.log('Error getting document', err);
        callback(err);
    });
}

FirebaseManager.prototype.getTagsByUserEmail = function(email, callback) {
    
    var tagsRef = this.db.collection('tags');
    var query = tagsRef.where('userEmail', '==', email).get()
        .then(snapshot => {
            var data = [];
            snapshot.forEach(doc => {
                //console.log(doc.id, '=>', doc.data());
                data.push({id: doc.id, data: doc.data()});
            });
            // sort by date
            data.sort(function(a, b){
                if(a.data.date >  b.data.date) return -1;
                if(a.data.date <  b.data.date) return 1;
                return 0;
            });
            callback(null, data);
        })
        .catch(err => {
           //console.log('Error getting documents', err);
           callback(err);
        });
}

FirebaseManager.prototype.getAllTags = function(callback) {
    
    var tagsRef = this.db.collection('tags');
    var query = tagsRef.get()
        .then(snapshot => {
            var data = [];
            snapshot.forEach(doc => {
                //console.log(doc.id, '=>', doc.data());
                data.push({id: doc.id, data: doc.data()});
            });
            // sort by date
            data.sort(function(a, b){
                if(a.data.date >  b.data.date) return -1;
                if(a.data.date <  b.data.date) return 1;
                return 0;
            });
            callback(null, data);
        })
        .catch(err => {
           //console.log('Error getting documents', err);
           callback(err);
        });
}

FirebaseManager.prototype.deleteTag = function(tag, callback) {
    var tagRef = this.db.collection('tags').doc(tag);
    tagRef.delete()
    .then(doc => {
        callback(null);
    })
    .catch(err => {
        callback(err);
    });
}

FirebaseManager.prototype.updateTag = function(tag, data, callback) {
    var tagRef = this.db.collection('tags').doc(tag);
    tagRef.update(data)
    .then(doc => {
        callback(null);
    })
    .catch(err => {
        callback(err);
    });
}

FirebaseManager.prototype.setTag = function(tag, data, callback) {
    var tagRef = this.db.collection('tags').doc(tag);
    tagRef.set(data)
    .then(doc => {
        callback(null);
    })
    .catch(err => {
        callback(err);
    });
}

FirebaseManager.prototype.getKeyInfo = function(key, callback) {
    var ref = this.db.collection('keys').where('key','==',key);
    ref.get().then(querySnapshot => {
        var data = null;
        querySnapshot.forEach(function(doc) {
            data = doc.data();
        });
        if(data === null) callback('key not found');
        else callback(null, data);
    })
    .catch(err => {
        callback(err);
    });
}

FirebaseManager.prototype.loadApiKey = function(userDetails, callback) {
    var ref = this.db.collection('keys').doc(userDetails.uid);
    ref.get()
    .then(doc => {
        if (doc.exists) {
            callback(null, doc.data());
        } else {
            callback(null, {key: '(not available, please genenerate one)', date: ''});
        }
    })
    .catch(err => {
       callback(err); 
    });
}

FirebaseManager.prototype.generateApiKey = function(userDetails, callback) {
    var ref = this.db.collection('keys').doc(userDetails.uid);
    const uuidv4 = require('uuid/v4');
    var data = {
        id: userDetails.uid,
        name: userDetails.displayName,
        email: userDetails.email,
        date: Date.now(),
        key: uuidv4()
    };
    ref.set(data)
    .then(function() {
        callback(null, data);
    })
    .catch(err => {
        callback(err); 
    })
}

// export the class
module.exports = FirebaseManager;