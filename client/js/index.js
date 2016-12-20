var setting = {};
var dataset_info = {};


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
    // Prepare Data
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
            dataset_info = JSON.parse(jsondata);
            console.log(dataset_info);
            var d = new Date(dataset_info.date);

            if (dataset_info.type == 'volume'){
                document.getElementById("general_info").innerHTML = 
                    "Tag: " + dataset_info.tag + "<br/>" + 
                    "Type: " + dataset_info.type + " (" + dataset_info.source + ")<br/>" + 
                    "Date: " + d.toString() + "<br/>" +
                    "Number of volumes: " + dataset_info.volumes.length;

                var dataset_content = "";
                for (i=0,l=dataset_info.volumes.length; i < l; i++) {
                    vol = dataset_info.volumes[i];
                    
                    var vol_name = '';
                    if(dataset_info.source == 'daris') {
                        vol_name = vol.name;
                    }
                    else {
                        vol_name = 'Volume ' + (i+1).toString();
                    }
                    
                    dataset_content += '<div class="mdl-cell mdl-cell--4-col-tablet">' + 
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
                        '     <label onClick="runDesktopVol(' + i +  ')"' + 
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
                //console.log(dataset_content);
                document.getElementById("volumes").innerHTML = dataset_content;
                
            }
            else if (dataset_info.type == "mesh"){
                document.getElementById("general_info").innerHTML = 
                    "Tag: " + dataset_info.tag + "<br/>" + 
                    "Type: " + dataset_info.type + " (" + dataset_info.source + ")<br/>" + 
                    "Date: " + d.toString() + "<br/>" +
                    "Number of meshes: " + dataset_info.meshes.length;

                var dataset_content = "";
                for (i=0,l=dataset_info.meshes.length; i < l; i++) {
                    mesh_dataset = dataset_info.meshes[i];
                    
                    var _name = '';
                    if(dataset_info.source == 'daris') {
                        mesh_dataset_name = mesh_dataset.name;
                    }
                    else {
                        mesh_dataset_name = 'Mesh_Datasetume ' + (i+1).toString();
                    }
                    
                    dataset_content += '<div class="mdl-cell mdl-cell--4-col-tablet">' + 
                        ' <div class="mesh_dataset-card mdl-card mdl-shadow--2dp">' +
                        '   <div class="mdl-card__title">' + 
                        '     <h2 class="mdl-card__title-text">' + mesh_dataset_name + '</h2>' +
                        '   </div>' +
                        '   <div class="mdl-card__media">' +
                        '     <img src="' + mesh_dataset.thumb + '" alt="" />' +
                        '   </div>' +
                        '   <div class="mdl-card__supporting-text">' +
                        '     Resolution: ' + mesh_dataset.res.toString() +
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
                //console.log(dataset_content);
                document.getElementById("meshes").innerHTML = dataset_content;

            }
            
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

function runDesktop(dataset_index) {
    console.log(dataset_index);
    if (dataset_info.type == "volume") {
        var dataset = dataset_info.volumes[dataset_index];
    } else if  (dataset_info.type == "mesh") {
        var dataset = dataset_info.volumes[dataset_index];
    } else{
        showMessage("Cannot find type info in volume or mesh dataset");
    }
    if (dataset) {
        var cmd = 'cd ' + dataset.dir + ' && LavaVu';
        runCommand(cmd)
    }
    else {
        showMessage("Cannot find volume or mesh data");
    }
    
}

function runCAVE2(vol_index) {
    console.log(vol_index);
}

// main
loadSetting();
