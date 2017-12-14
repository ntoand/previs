/*!
  Copy of Toan Nyugen's tag.js in sharevol
  */
//implement
var socket = io();
   
$("#tag_btnGo").click(function(event){
    var input_tag = $("#input_tag").val().trim();
    if(input_tag == '') {
        BootstrapDialog.show({
            title: 'Error',
            message: 'Please input your query!',
            type: BootstrapDialog.TYPE_DANGER
        });
        return;
    } 
    
    console.log(input_tag);
   
    socket.emit("processtag", { tag: input_tag });
   
}); // end daris_btnSearch clicked

socket.on("processtag", function (data) {
    console.log(data);
    if(data.status === "error") {
        var result_div = document.getElementById("result_div");
        result_div.innerHTML = "";
        result_div.innerHTML = "<b>Not found " + data.result.code + "</b>";
        var grid_div = document.getElementById("grid_div");
        grid_div.innerHTML = "";
        return;
    }
    else if(data.status === "done") {
        var result_div = document.getElementById("result_div");
        result_div.innerHTML = "";
        
        var tag_label = document.createElement("label");
        tag_label.setAttribute("class", "result_label");
        tag_label.innerHTML = "Tag: " + data.result.tag;
        
        var type_label = document.createElement("label");
        type_label.setAttribute("class", "result_label");
        type_label.innerHTML = "Type: " + data.result.type + " (" + data.result.source + ")";
        
        var d = new Date(data.result.date);
        var date_label = document.createElement("label");
        date_label.setAttribute("class", "result_label");
        date_label.innerHTML = "Date: " + d.toString(); 
        
        result_div.appendChild(tag_label); 
        result_div.appendChild(type_label); 
        result_div.appendChild(date_label);
        
        if(data.result.type === "volume" ) {
            generateLocalUploadGrid(data.result.volumes);
        }
        else if(data.result.type === "mesh") {
            console.log("This tag is for a mesh - data object is:");
            console.log(data.result);
            generateLocalUploadMeshGrid(data.result.volumes);
        }
        else if(data.result.type === "point") {
            console.log(data.result);
            generateLocalUploadPointGrid(data.result.volumes);
        }
        else {
            console.log("invalid data type");
        }
    }
});

// DW: TODO - rewrite this to display mesh info and a 'launch viewer' button to jump into the three.js viewer
function generateLocalUploadMeshGrid(meshes) {
    var grid_div = document.getElementById("grid_div");
    grid_div.innerHTML = "";
    
    // DW: show all mesh groups here if this is really necessary - previewing probably doesn't make a lot of sense though
    //      (and isn't straightforward to do!)
    for(var i=0; i < meshes.length; i++) {
        var vol = meshes[i];
        
        var grid_item = document.createElement("div");
        grid_item.setAttribute("class", "grid-item");

        // DW: display any details/thumbnail perhaps (one could be generated when the user saves parameters from the web viewer)
        
        // var img_div = document.createElement("div");
        // var img_a = document.createElement("a");
        // img_a.href = vol.png; img_a.target = "_blank";
        // var img = document.createElement("img");
        // img.setAttribute("class", "result_img");
        // img.src = vol.thumb;
        // img_a.appendChild(img);
        // img_div.appendChild(img_a);
        // grid_item.appendChild(img_div);
    
        // var header_label = document.createElement("label");
        // header_label.setAttribute("class", "result_label");
        // header_label.innerHTML = "Vol " + (i+1).toString() + " (" + vol.res + ")";
        // grid_item.appendChild(header_label);
        
        var view_button = document.createElement("button");
        view_button.setAttribute("class", "view_button");
        view_button.setAttribute("id", vol.json_web);
        view_button.innerHTML = 'View';
        view_button.onclick = function () {
            var meshSrc = vol.json;
            //window.open('sharevol/index.html?data=' + $(this).prop('id') + '&reset', target="_blank");
            var pos1 = meshSrc.indexOf("data/");
            var pos2 = meshSrc.indexOf("/mesh.json");
            //window.open('websurfer/index.html?model=' + model.slice(pos1,pos2) + '', target="_blank");
            //window.open('viewer/index.html?tag=' + model.slice(pos1,pos2) + '', target="_blank");
            window.open('viewer/index.html?tag=' + meshSrc.slice(pos1, pos2) + '', target="_blank");
            
        };
        grid_item.appendChild(view_button);
        
        grid_div.appendChild(grid_item);
    }
    
    $("#grid_div").imagesLoaded( function(){
         $("#grid_div").masonry({
            // options
            itemSelector : '.grid-item',
            columnWidth : 280
            //gutter: 20
        });
    });
}

function generateLocalUploadGrid(volumes) {
    var grid_div = document.getElementById("grid_div");
    grid_div.innerHTML = "";
    
    for(var i=0; i < volumes.length; i++) {
        var vol = volumes[i];
        
        var grid_item = document.createElement("div");
        grid_item.setAttribute("class", "grid-item");
        
        var img_div = document.createElement("div");
        var img_a = document.createElement("a");
        img_a.href = vol.png; img_a.target = "_blank";
        var img = document.createElement("img");
        img.setAttribute("class", "result_img");
        img.src = vol.thumb;
        img_a.appendChild(img);
        img_div.appendChild(img_a);
        grid_item.appendChild(img_div);
    
        var header_label = document.createElement("label");
        header_label.setAttribute("class", "result_label");
        header_label.innerHTML = "Vol " + (i+1).toString() + " (" + vol.res + ")";
        grid_item.appendChild(header_label);
        
        var view_button = document.createElement("button");
        view_button.setAttribute("class", "view_button");
        view_button.setAttribute("id", vol.json_web);   // DW: 20170607 - changed to load json_web instead, the 'full' json didn't seem to work
        view_button.innerHTML = 'View';
        view_button.onclick = function () {
            window.open('sharevol/index.html?data=' + $(this).prop('id') + '&reset', target="_blank");
        };
        grid_item.appendChild(view_button);
        
        grid_div.appendChild(grid_item);
    }
    
    $("#grid_div").imagesLoaded( function(){
         $("#grid_div").masonry({
            // options
            itemSelector : '.grid-item',
            columnWidth : 280
            //gutter: 20
        });
    });
}

function generateLocalUploadPointGrid(volumes) {
    var grid_div = document.getElementById("grid_div");
    grid_div.innerHTML = "";
    
    for(var i=0; i < volumes.length; i++) {
        var vol = volumes[i];
        
        var grid_item = document.createElement("div");
        grid_item.setAttribute("class", "grid-item");
        
        var view_button = document.createElement("button");
        view_button.setAttribute("class", "view_button");
        view_button.setAttribute("id", vol.potree_url);
        view_button.innerHTML = 'View';
        view_button.onclick = function () {
            window.open($(this).prop('id'), target="_blank");
        };
        grid_item.appendChild(view_button);
        
        grid_div.appendChild(grid_item);
    }
    
    $("#grid_div").imagesLoaded( function(){
         $("#grid_div").masonry({
            // options
            itemSelector : '.grid-item',
            columnWidth : 280
            //gutter: 20
        });
    });
}


function searchKeyPress(e)
{
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode == 13)
    {
        document.getElementById('tag_btnGo').click();
        return false;
    }
    return true;
}
