var mytardis = require('../src/node-mytardis');

var parameters = {
    host: 'store.erc.monash.edu',
    path: '/api/v1/experiment/?format=json'
    //apikey: 'toand:4c3f0abc9825e8f44804493e36623476584087eb'
};

mytardis.getExperiments(parameters, function(err, json) {
  if(err) {
    console.log(err);
    return;
  }
  else {
    console.log(json.meta);
  }
  
});