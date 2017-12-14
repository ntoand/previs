var path = require('path');

var config = {
    port: 3000,
    cave2_port: 3003,
	public_dir: 'public',
	scripts_dir: './src',
	local_data_dir: path.dirname(require.main.filename) +  '/public/data/local/',
	info_dir: path.dirname(require.main.filename) + '/public/data/info/',
	potree_converter_dir: path.dirname(require.main.filename) + '/potree/PotreeConverter/build/PotreeConverter'
};

exports.config = config;