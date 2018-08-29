'use strict';

var socket = io();

// ======== ARGUMENTS ======
var url = new URL(window.location.href);
var gTag = url.searchParams.get("tag");
console.log(window.location);
console.log("Tag:" + gTag);

if(gTag === null || gTag === undefined) {
    alert('Tag is not specified');
    throw new Error("Tag is not specified!");
}
// ======= END ARGUMENTS ===

// ======== PARAMETERS =====
var gGui = null;

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
// ======== END UTILS =============
