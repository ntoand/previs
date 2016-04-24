var setting = {};
var vols_info = {};

var fs = require('fs');
function loadSetting() {
  fs.readFile("setting.json", 'utf8', function (err, jsondata) {
    if (err) {
      console.log(err);
      return;
    } 
    setting = JSON.parse(jsondata);
    console.log(setting);
    document.getElementById('setting-server').value = setting.server;
    document.getElementById('setting-local-data-dir').value = setting.local_data_dir;
  });
}

function saveSetting() {
  setting.server = document.getElementById('setting-server').value;
  setting.local_data_dir = document.getElementById('setting-local-data-dir').value;
  fs.writeFile( "setting.json", JSON.stringify(setting, null, 4), function(err) {
    if (err) {
      showMessage("Error! Check err msg in console");
      console.log(err);
      return;
    } 
    document.getElementById('setting-message').innerHTML = "Saved successfully!";
    document.getElementById('setting-message').style.display = 'block';
    setTimeout(function(){ document.getElementById('setting-message').style.display = 'none'; }, 1500);
  });
}

document.addEventListener("keydown", function (e) {
  if (e.which === 123) {
    toogleDebug();
  } else if (e.which === 116) {
    location.reload();
  }
});

function toogleDebug() {
  require('remote').getCurrentWindow().toggleDevTools();
}

function searchKeyPress(e)
{
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode == 13)
    {
        document.getElementById('btnSearch').click();
        return false;
    }
    return true;
}

function showMessage(msg) {
  var snackbarContainer = document.getElementById('snackbar-message');
  var data = {
    message: msg,
    timeout: 3000
  };
  snackbarContainer.MaterialSnackbar.showSnackbar(data);
}

function processTag() {
  var tag = document.getElementById('tag-input').value.trim();
  console.log("Tag: " + tag);
  if(tag.length != 6) {
    showMessage("invalid tag format (must be 6-character long)");
    return;
  }
  var spinner = document.getElementById('spinnerTop');
  spinner.style.display = 'block';
  var exec = require('child_process').exec;
  var cmd = 'cd ./src && python run_prepare_data.py -t ' + tag + ' -s ' + setting.server +
            ' -d ' + setting.local_data_dir;
  console.log(cmd);
  exec(cmd, function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if(err){
      showMessage("Error! Check err msg in console");
      console.log(err);
      spinner.style.display = 'none';
      return;
    }
    showMessage("Data preparation -- Done");
    var local_json = setting.local_data_dir + '/' + tag + '/' + tag + '_local.json';
    console.log("local json: " + local_json);

    fs.readFile(local_json, 'utf8', function (err, jsondata) {
      if (err) {
        showMessage("Error! Check err msg in console");
        console.log(err);
        spinner.style.display = 'none';
        return;
      } 
      vols_info = JSON.parse(jsondata);
      console.log(vols_info);
      var d = new Date(vols_info.date);
      document.getElementById("general_info").innerHTML = 
              "Tag: " + vols_info.tag + "<br/>" + 
              "Type: " + vols_info.type + " (" + vols_info.source + ")<br/>" + 
              "Date: " + d.toString() + "<br/>" +
              "Number of volumes: " + vols_info.volumes.length;

      var vols_content = "";
      for (i=0,l=vols_info.volumes.length; i < l; i++) {
        vol = vols_info.volumes[i];

        var vol_name = '';
        if(vols_info.source == 'daris') {
          vol_name = vol.name;
        }
        else {
          vol_name = 'Volume ' + (i+1).toString();
        }

        vols_content += '<div class="mdl-cell mdl-cell--4-col-tablet">' + 
                        ' <div class="vol-card mdl-card mdl-shadow--2dp">' +
                        '   <div class="mdl-card__title">' + 
                        '     <h2 class="mdl-card__title-text">' + vol_name + '</h2>' +
                        '   </div>' +
                        '   <div class="mdl-card__media">' +
                        '     <img src="' + vol.thumb + '" alt="" />' +
                        '   </div>' +
                        '   <div class="mdl-card__supporting-text">' +
                        '     Resolution: ' + vol.res.toString() +
                        '   </div>' +
                        '   <div class="mdl-card__actions mdl-card--border">' +
                        '     <label onClick="runDesktop(' + i +  ')"' + 
                        '            class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">' +
                        '      Desktop' +
                        '     </label>' +
                        '     <label onClick="runCAVE2(' + i +  ')"' +
                        '            class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect">' +
                        '      CAVE2' +
                        '     </label>' +
                        '   </div>' +
                        ' </div>' + 
                        '</div>';
      }
      //console.log(vols_content);
      document.getElementById("volumes").innerHTML = vols_content;
      spinner.style.display = 'none';

    }); //fs.readFile

  }); // exec
}

function runCommand(cmd) {
  var exec = require('child_process').exec;
  console.log(cmd);
  exec(cmd, function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if(err){
      showMessage("Error! Check err msg in console");
      console.log(err);
      return;
    }
    showMessage("Done!");
  });
}

function runDesktop(vol_index) {
  console.log(vol_index);
  var vol = vols_info.volumes[vol_index];
  if (vol) {
    var cmd = 'cd ' + vol.dir + ' && LavaVu';
    runCommand(cmd)
  }
  else {
    showMessage("Cannot find volume data");
  }
}

function runCAVE2(vol_index) {
  console.log(vol_index);
}

// main
loadSetting();