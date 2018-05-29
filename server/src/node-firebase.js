var crypto = require('crypto');
var config	= require('./node-config').config; 
const fbadmin = require("firebase-admin");

// Constructor
function FilebaseManager() {
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
    this.db = fbadmin.firestore();
}

// class methods
FilebaseManager.prototype.createNewTag = function(callback) {
    
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

FilebaseManager.prototype.insertNewTag = function(tagdata, callback) {
    var docRef = this.db.collection('tags').doc(tagdata.tag);
    var setAda = docRef.set(tagdata);
    callback(null, setAda);
}

FilebaseManager.prototype.addNewTag = function(tag, data, callback) {
    var docRef = this.db.collection('tags').doc(tag);
    var setAda = docRef.set(data);
    callback(null, setAda);
}

FilebaseManager.prototype.getTag = function(tag, callback) {
    
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

FilebaseManager.prototype.getTagsByUserEmail = function(email, callback) {
    
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

FilebaseManager.prototype.getAllTags = function(callback) {
    
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

FilebaseManager.prototype.deleteTag = function(tag, callback) {
    var tagRef = this.db.collection('tags').doc(tag);
    tagRef.delete()
    .then(doc => {
        callback(null);
    })
    .catch(err => {
        callback(err);
    });
}

FilebaseManager.prototype.updateTag = function(tag, data, callback) {
    var tagRef = this.db.collection('tags').doc(tag);
    tagRef.update(data)
    .then(doc => {
        callback(null);
    })
    .catch(err => {
        callback(err);
    });
}

// export the class
module.exports = FilebaseManager;