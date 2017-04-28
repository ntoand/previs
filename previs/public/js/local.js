var socket = io();

$('#btnUploadFile').on('click', function (){
    $('#upload-input').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
});

$('#objzip_help').on('click', function(event) {
     event.preventDefault();

            var msg_content =   '<div>'+
                '<p>Example data <a href="data/example/heart-bp3.0.zip">heart-bp3.0.zip</a></p>' +
                '<p><b>How to prepare data:</b>' +
                '<ul>' +
                '<li>Create a directory to store OBJ files</li>' +
                '<li>Add subdirectories for each group, named as the group should be named (only a depth of one directory is currently supported)</li>' +
                '<li>Add OBJ files to the appropriate group subdirectories</li>' +
                '<li>Compress all subdirectories into one zip file</li>' +
                '</ul>' +
                '<p>Your zip should look something like this:</p>' +
                '<p><ul class="example-code">' +
                'group1/<br/>' +
                'group1/first-mesh.obj<br/>' +
                'group1/other-mesh.obj<br/>' +
                'group2/<br/>' +
                'group2/another-mesh.obj<br/>' +
                'group3/<br/>' +
                'group3/yet-another-mesh.obj<br/>' +
                'group3/and-another-mesh.obj<br/>' +
                '</ul></p>' +
                '<p>Please contact us if you need any help to prepare your data</p>' +
                /*
                '<p>Example data <a href="data/example/heart-bp3.0.zip">heart-bp3.0.zip</a></p>' +
                '<p><b>How to prepare data:</b><li>Create a directory to store OBJ files</li>' +
                '<li>Create subdirectories for groups with appropriate names. Only a depth of one will be recognised as a group.</li>' +
                '<li>Copy obj files to the group folders.</li>' +
                '<li>[Optional] Create a comment.txt file in the main directory with the first line being the title, and th remainder will be the summary.</li>' +
                '<li>Compress the directory into a zip file</li></p>' +
                ' <p>Please contact us if you need any help to prepare your data</p>' +
                */
                '</div>'

    BootstrapDialog.show({
        title: 'OBJ zipped folder(s)',
        message: msg_content,
    });
});

$('#tiffstack_help').on('click', function(event) {
    event.preventDefault();
    
    var msg_content =   '<div>' + 
                            '<p>Example data <a href="data/example/tiffstack-foot.zip">tiffstack-foot.zip</a></p>' + 
                            '<p><b>How to prepare data:</b>' +
                            '<li>Create a directory to store slices</li>' +
                            '<li>Convert slices to tiff format if needed using image editors (e.g. ImageMagick)</li>' +
                            '<li>Slices (tiff images) are named in order (e.g. 0001.tif, 0002.tif, ...)</li>' +
                            '<li>Compress the directory into a zip file</li>' +
                            '</p>' +
                            '<p>Your zip should look something like this:</p>' +
                            '<p><ul class="example-code">' +
                            'tiffs/<br/>' +
                            'tiffs/0001.tif<br/>' +
                            'tiffs/0002.tif<br/>' +
                            'tiffs/0003.tif<br/>' +
                            'tiffs/0004.tif<br/>' +
                            '</ul></p>' +                            
                            '<p>Please contact us if you need any help to prepare your data</p>'
                        '</div>'
    
    BootstrapDialog.show({
                        title: 'TIFF image stack',
                        message: msg_content,
                    });
});


$('#upload-input').on('change', function(){
    console.log("upload-input change");
    var files = $(this).get(0).files;

    console.log("# of files: " + files.length);
    
    if (files.length > 0){
        file = files[0];
        console.log(file);
        document.getElementById("upload_filename").innerHTML = "File selected: " + file.name + ' (size: ' + file.size + ')';
        var formData = new FormData();
        formData.append('uploads', file, file.name);
        console.log(formData);
        
        $.ajax({
            url: '/localupload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(data){
                console.log(data);
                if(data.status == 'error') {
                    BootstrapDialog.show({
                        title: 'Fail to upload file',
                        message: data.detail,
                        type: BootstrapDialog.TYPE_DANGER
                    });
                    return;
                }
                document.getElementById("local_upload_message").style.display = "block";
                var lmessage = document.getElementById("message_label");
                lmessage.style.color = 'blue';
                lmessage.innerHTML = "Uploaded successfully! Now working... " + data.file;
                process_img = document.getElementById("process_img");
                process_img.style.visibility = 'visible';  
                socket.emit('processOBJuploadfile', {task: "process", file: data.file});
            },
            xhr: function() {
                // create an XMLHttpRequest
                var xhr = new XMLHttpRequest();
                
                // listen to the 'progress' event
                xhr.upload.addEventListener('progress', function(evt) {
                
                if (evt.lengthComputable) {
                    // calculate the percentage of upload completed
                    var percentComplete = evt.loaded / evt.total;
                    percentComplete = parseInt(percentComplete * 100);
                    
                    // update the Bootstrap progress bar with the new percentage
                    $('.progress-bar').text(percentComplete + '%');
                    $('.progress-bar').width(percentComplete + '%');
                    
                    // once the upload reaches 100%, set the progress bar text to done
                    if (percentComplete === 100) {
                        $('.progress-bar').html('Done');
                    }
                }
            
            }, false);
            
            return xhr;
            }
        });
    }
});


socket.on('processuploadfile', function (data) {
    console.log("socket/processuploadfile");
    var lmessage = document.getElementById("message_label");
    var process_img = document.getElementById("process_img");
    console.log(data);
    if(data.status === 'working') {   
        process_img.style.visibility = 'visible';                      
        lmessage.style.color = 'blue';
        lmessage.innerHTML = "Working... " + data.result;
    }
    else if (data.status === 'done') {
        process_img.style.visibility = 'hidden';
        lmessage.style.color = 'blue';
        lmessage.innerHTML = '';
        $("#local_upload_message").hide();
        
        var local_upload_result_container = document.getElementById("local_upload_result_container");
        local_upload_result_container.innerHTML = "";
        
        var img_div = document.createElement("div");
        var img_a = document.createElement("a");
        img_a.href = data.png; img_a.target = "_blank";
        var img = document.createElement("img");
        img.setAttribute("class", "result_img");
        img.src = data.thumb;
        img_a.appendChild(img);
        img_div.appendChild(img_a);
        local_upload_result_container.appendChild(img_div);
    
        var tag_label = document.createElement("label");
        tag_label.setAttribute("class", "result_label");
        tag_label.innerHTML = '<h4>Tag: <b><font color="red">' + data.tag + '</font></b> Please write down for later use</h4>';
        local_upload_result_container.appendChild(tag_label);
        
        var view_button = document.createElement("button");
        view_button.setAttribute("class", "view_button");
        view_button.setAttribute("id", data.json);
        view_button.innerHTML = 'View';
        view_button.onclick = function () {
            window.open('sharevol/index.html?data=' + $(this).prop('id') + '&reset', target="_blank");
        };
        local_upload_result_container.appendChild(view_button);
        
    }
    else if (data.status === 'error') {
        lmessage.style.color = 'red';
        lmessage.innerHTML = "Error: " + data.result;
        process_img.style.visibility = 'hidden';
        BootstrapDialog.show({
            title: 'Error',
            message: data.detail,
            type: BootstrapDialog.TYPE_DANGER
        });
    }
});

// DW: variant that launches three.js viewer
socket.on('processOBJuploadfile', function (data) {
    console.log('processing done..');
    var lmessage = document.getElementById("message_label");
    var process_img = document.getElementById("process_img");
    console.log(data);
    if(data.status === 'working') {   
        process_img.style.visibility = 'visible';                      
        lmessage.style.color = 'blue';
        lmessage.innerHTML = "Working... " + data.result;
    }
    else if (data.status === 'done') {
        process_img.style.visibility = 'hidden';
        lmessage.style.color = 'blue';
        lmessage.innerHTML = '';
        $("#local_upload_message").hide();
        
        var local_upload_result_container = document.getElementById("local_upload_result_container");
        local_upload_result_container.innerHTML = "<b>No preview yet (create one by saving from web view)</b>";
/*        
        var img_div = document.createElement("div");
        var img_a = document.createElement("a");
        img_a.href = data.png; img_a.target = "_blank";
        var img = document.createElement("img");
        img.setAttribute("class", "result_img");
        img.src = data.thumb;
        img_a.appendChild(img);
        img_div.appendChild(img_a);
        local_upload_result_container.appendChild(img_div);
*/
    
        var tag_label = document.createElement("label");
        tag_label.setAttribute("class", "result_label");
        tag_label.innerHTML = '<h4>Tag: <b><font color="red">' + data.tag + '</font></b> - Please write this down and use to retrieve for further viewing</h4>';
        local_upload_result_container.appendChild(tag_label);
        
        var view_button = document.createElement("button");
        view_button.setAttribute("class", "view_button");
        view_button.setAttribute("id", data.json);
        view_button.innerHTML = 'View';

        view_button.onclick = function () {
            var model = $(this).prop('id')
            console.log("Model: " + model);
            //var pos1 = model.indexOf("data/local/");
            var pos1 = model.indexOf("data/");
            var pos2 = model.indexOf("/mesh.json");
            //window.open('websurfer/index.html?model=' + model.slice(pos1,pos2) + '', target="_blank");
            //window.open('viewer/index.html?tag=' + model.slice(pos1,pos2) + '', target="_blank");
            window.open('viewer/index.html?tag=' + model.slice(pos1, pos2) + '', target="_blank");
        };
        local_upload_result_container.appendChild(view_button);
        
    }
    else if (data.status === 'error') {
        lmessage.style.color = 'red';
        lmessage.innerHTML = "Error: " + data.result;
        process_img.style.visibility = 'hidden';
        BootstrapDialog.show({
            title: 'Error',
            message: data.detail,
            type: BootstrapDialog.TYPE_DANGER
        });
    }
});
