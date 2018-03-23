var path = require('path');

var config = {
  port: 9000,
  cave2_port: 3003,
  public_dir: 'dist',
  scripts_dir: './src',
  local_data_dir: path.dirname(require.main.filename) +  '/public/data/local/',
  tags_data_dir: path.dirname(require.main.filename) +  '/public/data/tags/',
  info_dir: path.dirname(require.main.filename) + '/public/data/info/',
  potree_converter_dir: path.dirname(require.main.filename) + '/potree/PotreeConverter/build/PotreeConverter',
  //firebase_service_acc_key: path.dirname(require.main.filename) + '/private/previs2018-firebase-adminsdk-0nvys-6965ab85a6.json'
  firebase_service_acc_key: "/data/git/previs/server/private/previs2018-firebase-adminsdk-0nvys-6965ab85a6.json"
};

exports.config = config;
