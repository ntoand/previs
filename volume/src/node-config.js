var path = require('path');

var config = {
    port: 3000,
	public_dir: 'public',
	scripts_dir: './src',
	tiff_data_dir: path.dirname(require.main.filename) +  '/public/data/tiff/',
	daris_data_dir: path.dirname(require.main.filename) +  '/public/data/daris/',
	info_dir: path.dirname(require.main.filename) + '/public/data/info/'
};

exports.config = config;