var glob = require('glob');
var path = require('path');

function getSaveList(data)
{
	let tag = data.tag;
	let type = data.type; // volume, mesh, point
	let dir;
	let options = {};
	let list = ['default'];
	if(type === 'volume') {
		dir = '/mnt/data/git/previs/server/public/data/tags/' + data.tag + '/volume_result/';
		console.log(dir);
		glob(dir + "vol_web_*.json", options, function (err, files) {
		    if(err) { 
		        console.log(err)
		        return;
		    }
		    console.log(files);
		    for(var i=0; i < files.length; i++) {
		        let basename = path.basename(files[i], '.json');
		        basename = basename.substr(8);
		        console.log(basename);
		        list.push(basename);
		    }
		    console.log(list);
		})
	}
}

let data = {
    type: 'volume',
    tag: '96e443'
};
getSaveList(data);