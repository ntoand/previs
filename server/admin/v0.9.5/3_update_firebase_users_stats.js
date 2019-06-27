/*
DONT RUN THIS SCRIPT
The script is implemented to update disk space of tags
To run before upgrading to v0.9.5
*/
var FilebaseManager   = require('../../src/node-firebase');
var object = new FilebaseManager();
if (process.env.NODE_ENV === "production")  {
   console.log('Mode: production')
}
else {
   console.log('Mod: development');
}

object.getAllUsers(function(err, res) {
   if(err) {
      console.log(err);
      return;
   }
   updateUserStats(res, 0);
});

function updateUserStats(users, index=0) {
    if(index >= users.length) return;

    var user = users[index];
    object.getTagsByUserEmail(user.email, 'my', function(err, tags) {
        if(err) {
            console.log(err);
            return;
        }
        var disk = 0;
        for(var i=0; i < tags.length; i++) {
            disk += tags[i].data.disk;
        }
        disk = Number.parseFloat(disk.toFixed(2));
        console.log(user.email + ', ' + disk + ' MB, ' + tags.length + ' tags');
        object.updateUser(user.id, {disk: disk, numtags: tags.length}, function(err) {
            if(err) {
                console.log(err);
                return;
            }
            updateUserStats(users, index + 1);
        })
    });
}