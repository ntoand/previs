'use strict';

var socket = io();

// ======== ARGUMENTS ======
var url = new URL(window.location.href);
var gTag = url.searchParams.get("tag");
var gDir = null;
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
// ======== END UTILS =============
