'use strict';

var socket = io();

// ======== ARGUMENTS ======
var url = new URL(window.location.href);
var gTag = url.searchParams.get("tag");
var gDir = null;
var gHasThumbnail = false;
console.log(window.location);
console.log("Tag:" + gTag);

if(gTag === null || gTag === undefined) {
    alert('Tag is not specified or invalid');
    throw new Error("Tag is not specified or invalid!");
}

var gPreset = url.searchParams.get("preset");
if(gPreset === null || gPreset === undefined) {
    gPreset = 'default';
}
// ======= END ARGUMENTS ===

// ======== PARAMETERS =====
var gGui = null;
var hPreset = null;
var presetList = ['default'];
var cameraControlList = ['Orbit control', 'Fly control'];

// ===== END PARAMETERS ====


// ======== UTILS ==========
// show status message
function showMessage(message, loading = false) {
    var icon = document.getElementById("status-icon");
    icon.style.display = loading ? "inline" : "none";
    document.getElementById("status-message").innerHTML=message; 
    console.log(message);
}

function getCenter(bbox) {
    const center = {
        x: (bbox.min.x + bbox.max.x)/2,
        y: (bbox.min.y + bbox.max.y)/2,
        z: (bbox.min.z + bbox.max.z)/2
    }
    return center;
}

function updateDatDropdown(target, list){   
    let innerHTMLStr = "";
    if(list.constructor.name == 'Array'){
        for(var i=0; i<list.length; i++){
            var str = "<option value='" + list[i] + "'>" + list[i] + "</option>";
            innerHTMLStr += str;        
        }
    }
    
    if(list.constructor.name == 'Object'){
        for(var key in list){
            var str = "<option value='" + list[key] + "'>" + key + "</option>";
            innerHTMLStr += str;
        }
    }
    if (innerHTMLStr != "") target.domElement.children[0].innerHTML = innerHTMLStr;
}

function resizeImage(base64Str, callback) {
    var MAX_WIDTH = 512;
    var MAX_HEIGHT = 512;

    var img = new Image();
    img.src = base64Str;
    img.onload = function(){
        var height = img.height;
        var width = img.width;
        if (width > height) {
            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
        } 
        else {
            if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
            }
        }
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL());
    }   
}

// ======== END UTILS =============
