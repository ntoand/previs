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
  firebase_service_acc_key: "/previs/server/private/previs2018-firebase-adminsdk-0nvys-6965ab85a6.json",
  firebase_service_acc_key_dev: "/previs/server/private/previs-dev-firebase-adminsdk-x41gl-b685332e46.json",
  firebase_db_url: "https://previs2018.firebaseio.com",
  firebase_db_url_dev: "https://previs-dev.firebaseio.com",
  hosturl: "https://mivp-dws1.erc.monash.edu:3000",
  hosturl_dev: "http://118.138.241.179:3000"
};

exports.config = config;