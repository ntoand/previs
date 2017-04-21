//init
//$.jgrid.defaults.width = 780;
$.jgrid.defaults.responsive = true;
$.jgrid.defaults.styleUI = 'Bootstrap';
   
//implement
var socket = io();

//
var saved_datasets = [];
var num_processed_datasets = 0;
   
var getColumnIndexByName = function (grid, columnName) {
    var cm = grid.jqGrid('getGridParam', 'colModel'), i, l;
    for (i = 0, l = cm.length; i < l; i += 1) {
        if (cm[i].name === columnName) {
            return i; // return the index
        }
    }
    return -1;
};

// find if dataset is in saved_datatsets
function findDataset(id) {
    for (var i=0; i < saved_datasets.length; i++) {
        if( saved_datasets[i].cid == id)
            return i;
    }
    return -1;
}

// called when user clicks on checkbox of tree/grid
function processClickDataset(id, desc, isChecked) {
    if(isChecked) {
        if (findDataset(id) == -1) {
            saved_datasets.push({cid: id, title: desc}); //using unshift to add to the front
        }
    }
    else {
        var ind = findDataset(id);
        if (ind != -1) {
            saved_datasets.splice(ind, 1);
            
            // uncheck tree item
            var tree = $("#daris_tree").fancytree("getTree");
            var node_to_deselect = tree.getNodeByKey(id);
            if(node_to_deselect)
                node_to_deselect.setSelected(false);
         
            // uncheck jsgrid
            $("#jqGrid_search").find('input[type=checkbox]').each(function() {
                if( $(this).is(':checked')) {
                    var thisrowcid = $(this).closest('tr')[0].id;
                    if(thisrowcid == id) {
                        $(this).prop("checked", false);
                    }
                }
            });
        }
    }
    displaySelectedDatasets();
}

// enable/disable dataset buttons
function disableDatatasetButtons(cid, value) {
    
    var delete_button = document.getElementById(cid+"_delete_button");
    delete_button.disabled = value;
    
    var view_button = document.getElementById(cid+"_view_button");
    view_button.disabled = value;
    
    var cave_button = document.getElementById(cid+"_cave_button");
    cave_button.disabled = value;
}

function disableGenerateCAVE2Button(value) {
    var generate_cave2 = document.getElementById("btnGenerateCAVE2Data");
    generate_cave2.disabled = value;
}

// display selected datasets
function displaySelectedDatasets (){
    
    $("#datasets").html("");
    
    for (var i = 0; i < saved_datasets.length; i++) {
        var row_div = document.createElement("div");
        row_div.setAttribute("id", saved_datasets[i].cid + "_SEL");
        
        var x_button = document.createElement("button");
        x_button.innerHTML = 'X';
        x_button.setAttribute("class", "delete_button");
        x_button.setAttribute("id", saved_datasets[i].cid+"_delete_button");
        x_button.onclick = function() {
            var rowcid = $(this).parent().prop('id');
            rowcid = rowcid.substr(0, rowcid.length - 4);
            
            // remote the item from save_datasets
            saved_datasets.splice(findDataset(rowcid), 1);
            
            // remove row
            document.getElementById(rowcid+"_SEL").remove();
         
            // uncheck tree item
            var tree = $("#daris_tree").fancytree("getTree");
            var node_to_deselect = tree.getNodeByKey(rowcid);
            if(node_to_deselect)
                node_to_deselect.setSelected(false);
         
            // uncheck jsgrid
            $("#jqGrid_search").find('input[type=checkbox]').each(function() {
                if( $(this).is(':checked')) {
                    var thisrowcid = $(this).closest('tr')[0].id;
                    if(thisrowcid == rowcid) {
                        $(this).prop("checked", false);
                    }
                }
            });
        };
        
        var view_button = document.createElement("button");
        view_button.setAttribute("class", "view_button");
        view_button.setAttribute("id", saved_datasets[i].cid+"_view_button");
        view_button.innerHTML = 'Create tag & View';
        view_button.onclick = function () {
            var rowcid = $(this).parent().prop('id');
            rowcid = rowcid.substr(0, rowcid.length - 4);
            socket.emit('viewdataset', {task: "webview", sid: $.cookie("DARIS-SESSION"), cid: rowcid});

            var lstatus = document.getElementById(rowcid + "_status");
            var imgprocess = document.getElementById(rowcid + "_img");
            lstatus.style.color = "blue";
            lstatus.innerHTML = "Working..." ;
            disableDatatasetButtons(rowcid, true);
        };
        
        var cave_button = document.createElement("button");
        cave_button.setAttribute("class", "cave_button");
        cave_button.setAttribute("id", saved_datasets[i].cid+"_cave_button");
        cave_button.innerHTML = 'Create tag';
        cave_button.onclick = function () {
            var rowcid = $(this).parent().prop('id');
            rowcid = rowcid.substr(0, rowcid.length - 4);
            socket.emit('viewdataset', {task: "caveview", sid: $.cookie("DARIS-SESSION"), cid: rowcid});

            var lstatus = document.getElementById(rowcid + "_status");
            var imgprocess = document.getElementById(rowcid + "_img");
            lstatus.style.color = "blue";
            lstatus.innerHTML = "Working..." ;
            disableDatatasetButtons(rowcid, true);
        };
        
        var content_span = document.createElement("span");
        content_span.setAttribute("id", "dataset");
        content_span.innerHTML = saved_datasets[i].title;
        
        var process_img = document.createElement("img");
        process_img.setAttribute("src", "data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH+GkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQACgABACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkEAAoAAgAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkEAAoAAwAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkEAAoABAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQACgAFACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQACgAGACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAAKAAcALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==");
        process_img.setAttribute("id", saved_datasets[i].cid + "_img");
        process_img.setAttribute("class", "img_process");
        
        var status_label = document.createElement("label");
        status_label.setAttribute("id", saved_datasets[i].cid + "_status");
        status_label.setAttribute("class", "status_label");
        status_label.innerHTML = "";
        
        row_div.appendChild(x_button); 
        row_div.appendChild(view_button);
        row_div.appendChild(cave_button);
        row_div.appendChild(content_span);
        row_div.appendChild(status_label);
        row_div.appendChild(process_img);
        $('#datasets').append(row_div);
    }
}

// create search grid with empty data
function createSearchGrid(){
    $("#jqGrid_search").jqGrid({
        datatype: "local",
		data: [],
        height: 300,
        colModel: [
            //checkbox
            {
                name: 'enbl', index: 'enbl', width: 60, align: 'center',
                formatter: 'checkbox', editoptions: { value: '1:0' },
                formatoptions: { disabled: false },
            },
            { label: 'cid', name: 'cid', width: 140, key:true },
            { label: 'Name', name: 'name', width: 400 },
            { label: 'Description', name: 'description', width: 400 },
            { label: 'Size', name: 'datasize', width: 80 },
        ],
        viewrecords: true, // show the current page, data rang and total records on the toolbar
        caption: "Return datasets from DaRIS",
        pager: "#jqGridPager_search",
        rowNum: 20,
        loadComplete: function () {
            var iCol = getColumnIndexByName($(this), 'enbl'), rows = this.rows, i, c = rows.length;
            for (i = 0; i < c; i += 1) {
                $(rows[i].cells[iCol]).click(function (e) {
                    var id = $(e.target).closest('tr')[0].id, isChecked = $(e.target).is(':checked');
                    var desc = "dataset: " + id + " | " + $("#jqGrid_search").jqGrid ('getCell', id, 'name') + ' | '
                                +  $("#jqGrid_search").jqGrid ('getCell', id, 'datasize');
                    
                    processClickDataset(id, desc, isChecked);
                });
            }
        }
    });
}
   
   // ============ SOCKET communication =============
socket.on('viewdataset', function (data) {
    console.log(data);
    var lstatus = document.getElementById(data.cid + "_status");
    var imgprocess = document.getElementById(data.cid + "_img");
    if(data.status === 'working') {                         
        imgprocess.style.visibility = 'visible';            
        lstatus.style.color = 'blue';
        lstatus.innerHTML = "Working... " + data.result;
    }
    else if (data.status === 'done') {
        imgprocess.style.visibility = 'hidden';
        if(data.task == 'webview') {
            console.log('done, now open new page');
            window.open('sharevol/index.html?data=' + data.json + '&reset', target="_blank");
            lstatus.style.color = 'blue';
            lstatus.innerHTML = 'Tag: <font color="red">' + data.tag + '</font> Please write down for later use';
        }
        else if (data.task == 'caveview') {
            console.log('caveview'); 
            lstatus.style.color = 'blue';
            lstatus.innerHTML = 'Tag: <font color="red">' + data.tag + '</font> Please write down for later use';
        }
        else if (data.task == 'multicaveview') {
            lstatus.style.color = 'blue';
            lstatus.innerHTML = 'done';
            
            saved_datasets[num_processed_datasets].res = data.res;
            
            num_processed_datasets += 1;
            if(num_processed_datasets < saved_datasets.length) {
                socket.emit('viewdataset', {task: "multicaveview", sid: $.cookie("DARIS-SESSION"), cid: saved_datasets[num_processed_datasets].cid });
                disableDatatasetButtons(saved_datasets[num_processed_datasets].cid, true);
            }
            else {
                console.log("processed all datasets successfully!");
                socket.emit('tagmulticaveview', { datasets: saved_datasets } )
            }
        }
    }
    else if (data.status === 'error') {
        imgprocess.style.visibility = 'hidden';
        lstatus.style.color = 'red';
        lstatus.innerHTML = "Error: " + data.result;
        BootstrapDialog.show({
            title: 'Error',
            message: data.detail,
            type: BootstrapDialog.TYPE_DANGER
        });
        //alert(data.detail);
        disableGenerateCAVE2Button(false);
    }
    //enable buttons again
    disableDatatasetButtons(data.cid, false);
});

socket.on('tagmulticaveview', function(data) {
    var multicave_label = document.getElementById("multicave_label");
    multicave_label.innerHTML = '<h4>Tag: <font color="red">' + data.tag + '</font> Please write down for later use</h4>';
    document.getElementById("btnGenerateCAVE2Data").disabled = false;
});

socket.on('searchdataset', function(data) {
   if (data.status === 'error') {
       BootstrapDialog.show({
            title: 'Error',
            message: data.detail,
            type: BootstrapDialog.TYPE_DANGER
        });
       //alert("Error");
   }
   else if (data.status === 'done') {
       console.log(data.result);
       jQuery('#jqGrid_search').jqGrid('clearGridData');
       
       var resultdata = $.parseJSON(data.result);
       
       jQuery('#jqGrid_search').jqGrid('setGridParam', {data: resultdata});
        
       jQuery('#jqGrid_search').trigger('reloadGrid');
       
       // set checkbox for selected datasets
       $("#jqGrid_search").find('input[type=checkbox]').each(function() {
            var thisrowcid = $(this).closest('tr')[0].id;
            if(findDataset(thisrowcid) != -1) {
                $(this).prop("checked", true);
            }
        });
    }
});

// =======  DARIS tree ========
// create DaRIS tree
function darisTreeCreate()
{
    var daris_session = $.cookie("DARIS-SESSION");
    $("#daris_tree").fancytree(
    { 
        source: 
        {
            url: "rest/projects?sid=" + daris_session
        },
        // Called when a lazy node is expanded for the first time
        lazyLoad: function(event, data){
            var node = data.node;
            // Load child nodes via ajax GET /getTreeData?mode=children&parent=1234
            data.result = {
                url: "rest/members",
                data: {sid: daris_session, cid: node.key},
                cache: false
            };
        },
        
        checkbox: true,

        postProcess: function(event, data) {
            var orgResponse = data.response;

            if( orgResponse.status === "ok" ) {
                data.result = orgResponse.result;
                for(var i=0; i < data.result.length; i++) {
                    var item = data.result[i];
                    if(item.folder == false) {
                        if(findDataset(item.key) != -1)
                            data.result[i].selected = true;
                    }
                }
            } else {
                console.log(orgResponse.result);
                // Signal error condition to tree loader
                data.result = {
                  error: "ERROR: " + orgResponse.result
                }

                if(orgResponse.result === "session_invalid") {
                    $("#daris_tree").fancytree('destroy');
                    $("#daris_div_login").show();
                    $("#daris_select_container").hide();
                    $("#daris_div_logoff").hide();
                }
            }
        },

        select: function(event, data) {
            var node = data.node;
            
            processClickDataset(node.key, node.title, node.selected);
        }
    });
}

// ========================================
var daris_session = $.cookie("DARIS-SESSION");
if(daris_session)
{
    darisTreeCreate();
    $("#daris_labelLogoff").text("Logged in");
    $("#daris_div_login").hide();
    $("#daris_div_logoff").show();
    $("#daris_select_container").show();
    $("#daris_loginfail").hide();
}

$("#daris_btnLogin").click(function(event){

    if($("#daris_domain").val() == '' || $("#daris_user").val() == '' || $("#daris_password").val() == '' ) {
        $("#daris_loginfail").text("Please input values in all fields!");
        $("#daris_loginfail").show();
        return;
    }               

    var domain_str=$("#daris_domain").val()
    var user_str=$("#daris_user").val();
    var password_str=$("#daris_password").val();

    $.ajax({
        url: "rest/login",
        dataType: "json",
        method: "POST",
        data: { domain: domain_str, user: user_str, password: password_str },
        statusCode: {
            401: function() {
                $("#daris_loginfail").text("Authentication failed! Please try again.");
                $("#daris_loginfail").show();
            },
        },
        success: function(retjson) {

            if(retjson.status === "error") {
                $("#daris_loginfail").text("Authentication failed! Please try again.");
                $("#daris_loginfail").show();
                return;
            }

            var daris_session = retjson.result;
            
            $.cookie("DARIS-SESSION", daris_session);

            darisTreeCreate();
            
            $("#daris_labelLogoff").text("Logged in");
            $("#daris_div_login").hide();
            $("#daris_div_logoff").show();
            $("#daris_select_container").show();
            $("#daris_loginfail").hide();
        },
    });
}); // end daris_btnLogin clicked

$("#daris_btnLogoff").click(function(event){
    var daris_session = $.cookie("DARIS-SESSION");
    $.ajax({
        url: "rest/logoff",
        dataType: "json",
        data: { sid: daris_session }
    });
    $("#daris_tree").fancytree('destroy');
    $("#daris_div_login").show();
    $("#daris_select_container").hide();
    $("#daris_div_logoff").hide();
    $.cookie("DARIS-SESSION", null, { path: '/' });
}); // end daris_btnLogoff clicked

// ===== DARIS SEARCH =====
$("#daris_btnSearch").click(function(event){
    if($("#daris_search_cid").val() == '' && $("#daris_search_keyword").val() == '') {
        BootstrapDialog.show({
            title: 'Error!',
            message: 'Please input your query',
            type: BootstrapDialog.TYPE_DANGER
        });
        //alert("Please input your query");
        return;
    } 
    var daris_search_cid = $("#daris_search_cid").val();
    var daris_search_keyword = $("#daris_search_keyword").val();
    socket.emit('searchdataset', {task: "searchdataset", sid: $.cookie("DARIS-SESSION"), 
                                  cid: daris_search_cid, keyword: daris_search_keyword });
                                  
}); // end daris_btnSearch clicked

$("#btnGenerateCAVE2Data").click(function(event){
    
    num_processed_datasets = 0;
    
    if(saved_datasets.length == 0) {
        BootstrapDialog.show({
            title: 'Error!',
            message: 'Please select datasets first',
            type: BootstrapDialog.TYPE_DANGER
        });
        //alert("Please select datasets first");
    }
    
    socket.emit('viewdataset', {task: "multicaveview", sid: $.cookie("DARIS-SESSION"), cid: saved_datasets[0].cid });
    
    disableDatatasetButtons(saved_datasets[0].cid, true);
    disableGenerateCAVE2Button(true);
}); // end btnRunOnCAVE clicked


function loginKeyPress(e)
{
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode == 13)
    {
        document.getElementById('daris_btnLogin').click();
        return false;
    }
    return true;
}

function searchKeyPress(e)
{
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode == 13)
    {
        document.getElementById('daris_btnSearch').click();
        return false;
    }
    return true;
}

createSearchGrid();