var path = require('path');

var config = {
    port: 3000,
    cave2_port: 3003,
	public_dir: 'public',
	scripts_dir: './src',
	local_data_dir: path.dirname(require.main.filename) +  '/public/data/local/',
	daris_data_dir: path.dirname(require.main.filename) +  '/public/data/daris/',
	info_dir: path.dirname(require.main.filename) + '/public/data/info/',
	database: path.dirname(require.main.filename) + '/public/data/previs-tags.db'
};

exports.config = config;