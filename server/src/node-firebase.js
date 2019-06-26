var crypto      = require('crypto');
var config	    = require('./node-config').config; 
const fbadmin   = require("firebase-admin");

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
// ==== tag ====
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

FirebaseManager.prototype.getTagsByUserEmail = function(email, collection = 'my', callback) {
    
    var tagsRef = this.db.collection('tags');
    var query;
    if(!collection || collection === 'my') {
        query = tagsRef.where('userEmail', '==', email);
    }
    else if(collection === 'shared') {
        var path = new fbadmin.firestore.FieldPath('share', email);
        query = tagsRef.where(path, '>', 0);
    }
    else {
        query = tagsRef.where('collection', '==', collection);
    }

    query.get()
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

FirebaseManager.prototype.deleteTag = function(tag, collection, callback) {
    var tagRef = this.db.collection('tags').doc(tag);
    var scope = this;
    tagRef.delete()
    .then(doc => {
        if(collection && collection.length > 0) {
            var ref = scope.db.collection('collections').doc(collection);
            scope.db.runTransaction(t => {
                return t.get(ref)
                .then(doc => {
                    let newNumTags = doc.data().numtags - 1;
                    if(newNumTags < 0) newNumTags = 0;
                    t.update(ref, {numtags: newNumTags});
                });
            }).then(result => {
                console.log('transaction decrease numtags for old collection success!');
                callback(null);
            }).catch(err => {
                console.log('transaction decrease numtags for old collection failure:', err);
                callback(err);
            });
        }
        else {
            callback(null);
        }
    })
    .catch(err => {
        callback(err);
    });
}

FirebaseManager.prototype.updateTag = function(tag, data, callback) {
    var tagRef = this.db.collection('tags').doc(tag);
    tagRef.set(data, {merge: true})
    .then(doc => {
        callback(null);
    })
    .catch(err => {
        callback(err);
    });
}

FirebaseManager.prototype.updateTagCollection = function(tag, collectionPrev, data, callback) {
    var tagRef = this.db.collection('tags').doc(tag);
    var scope = this;
    tagRef.update(data)
    .then(doc => {
        //update count
        if(data.collection && data.collection.length > 0) {
            var ref1 = scope.db.collection('collections').doc(data.collection);
            scope.db.runTransaction(t => {
                return t.get(ref1)
                .then(doc => {
                    let newNumTags = doc.data().numtags + 1;
                    t.update(ref1, {numtags: newNumTags});
                });
            }).then(result => {
                console.log('transaction increase numtags for new collection success!');
            }).catch(err => {
                console.log('transaction increase numtags for new collection failure:', err);
            });
        }

        if(collectionPrev && collectionPrev.length > 0) {
            var ref2 = scope.db.collection('collections').doc(collectionPrev);
            scope.db.runTransaction(t => {
                return t.get(ref2)
                .then(doc => {
                    let newNumTags = doc.data().numtags - 1;
                    t.update(ref2, {numtags: newNumTags});
                });
            }).then(result => {
                console.log('transaction decrease numtags for old collection success!');
            }).catch(err => {
                console.log('transaction decrease numtags for old collection failure:', err);
            });
        }

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

// ==== collection ====
FirebaseManager.prototype.createNewCollectionID = function(callback) {
    
    var self = this;
    
    var id = crypto.randomBytes(4).toString('hex');
    
    this.getCollection(id, function(err, res) {
        if(err) {
            callback(err);
            return;
        }
        if(res !== null) { //found
            self.createNewCollectionID(callback);
        }
        else {
            console.log('new collection id: ' + id);
            callback(null, id);
        }
    });
}

FirebaseManager.prototype.getCollection = function(id, callback) {
    
    var tagRef = this.db.collection('collections').doc(id);
    var getDoc = tagRef.get()
    .then(doc => {
        if (!doc.exists) {
            callback(null, null);
        } else {
            callback(null, doc.data());
        }
    })
    .catch(err => {
        callback(err);
    });
}

FirebaseManager.prototype.addNewCollection = function(data, callback) {
    var scope = this;
    this.createNewCollectionID( function(err, id) {
        if(err) {
            callback(err);
            console.log(err);
            return;
        }
        data.id = id;
        data.date = Date.now();
        scope.db.collection('collections').doc(id).set(data);
        callback(null, data);
    });
}

FirebaseManager.prototype.updateCollection = function(id, data, callback) {
    var tagRef = this.db.collection('collections').doc(id);
    tagRef.set(data, {merge: true})
    .then(doc => {
        callback(null, data);
    })
    .catch(err => {
        callback(err);
    });
}

FirebaseManager.prototype.deleteCollection = function(data, callback) {
    var tagRef = this.db.collection('collections').doc(data.id);
    tagRef.delete()
    .then( () => {
        callback(null, data);
    })
    .catch(err => {
        callback(err);
    });
}

FirebaseManager.prototype.getCollectionsByUserEmail = function(email, callback) {
    
    var myQuery = this.db.collection('collections').where('userEmail', '==', email).get();
    var path = new fbadmin.firestore.FieldPath('share', email);
    var shareQuery = this.db.collection('collections').where(path, '>', 0).get();
    Promise.all([myQuery, shareQuery]).then(snapshot => {
        var data = [];
        snapshot[0].forEach(doc => {
            data.push({id: doc.id, data: doc.data()});
        });
        snapshot[1].forEach(doc => {
            data.push({id: doc.id, data: doc.data()});
        });
        callback(null, data);
    })
    .catch(err => {
        callback(err);
    });
}

// ==== bundle for client ====
FirebaseManager.prototype.getDataBundleByUserEmail = function(email, collection='my', callback) {
    // get collections, tags, users
    var query;
    var path = new fbadmin.firestore.FieldPath('share', email);
    if(!collection || collection === 'my') {
        query = this.db.collection('tags').where('userEmail', '==', email);
    }
    else if(collection === 'shared') {
        query = this.db.collection('tags').where(path, '>', 0);
    }
    else {
        query = this.db.collection('tags').where('collection', '==', collection);
    }
    var tagQuery = query.get();

    var collectionQuery = this.db.collection('collections').where('userEmail', '==', email).get();
    var collectionQuery2 = this.db.collection('collections').where(path, '>', 0).get();
    Promise.all([tagQuery, collectionQuery, collectionQuery2]).then(snapshot => {
        var tags = [];
        snapshot[0].forEach(doc => {
            tags.push({id: doc.id, data: doc.data()});
        });
        var collections = [];
        snapshot[1].forEach(doc => {
            collections.push({id: doc.id, data: doc.data()});
        });
        snapshot[2].forEach(doc => {
            collections.push({id: doc.id, data: doc.data()});
        });
        // sort by date
        tags.sort(function(a, b){
            if(a.data.date >  b.data.date) return -1;
            if(a.data.date <  b.data.date) return 1;
            return 0;
        });
        callback(null, {tags: tags, collections: collections});
    })
    .catch(err => {
        callback(err);
    });
}


// ==== key ====
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

FirebaseManager.prototype.getKeyByAppName = function(appname, callback) {
    var ref = this.db.collection('keys').where('appname','==',appname);
    ref.get().then(querySnapshot => {
        var data = null;
        querySnapshot.forEach(function(doc) {
            data = doc.data();
        });
        callback(null, data);
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


FirebaseManager.prototype.generateAppApiKey = function(keyinfo, callback) {
    var ref = this.db.collection('keys').doc();
    keyinfo.id = ref.id;
    ref.set(keyinfo)
    .then(function() {
        callback(null, keyinfo);
    })
    .catch(err => {
        callback(err); 
    })
}


// export the class
module.exports = FirebaseManager;