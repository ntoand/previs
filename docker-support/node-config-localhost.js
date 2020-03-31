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
  firebase_service_acc_key: "/previs/server/private/previs-david-firebase-adminsdk-awbpj-e4a88e7011.json",
  firebase_service_acc_key_dev: "/previs/server/private/previs-david-firebase-adminsdk-awbpj-e4a88e7011.json",
  firebase_db_url: "https://previs-david.firebaseio.com",
  firebase_db_url_dev: "https://previs-david.firebaseio.com",
  hosturl: "http://localhost:3000",
  hosturl_dev: "http://127.0.0.1:3000"
};

exports.config = config;