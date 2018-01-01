$.jgrid.defaults.responsive = true;
$.jgrid.defaults.styleUI = 'Bootstrap';
   
//implement
var socket = io();

var selected_tags = [];

function loginKeyPress(e)
{
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode == 13)
    {
        document.getElementById('admin_btnLogin').click();
        return false;
    }
    return true;
}

$("#admin_btnLogin").click(function(event){

    if( $("#admin_user").val() == '' || $("#admin_password").val() == '' ) {
        $("#admin_loginfail").text("Please input values in all fields!");
        $("#admin_loginfail").show();
        return;
    }               

    var user_str=$("#admin_user").val();
    var password_str=$("#admin_password").val();

    $.ajax({
        url: "http://mivp-dws1.erc.monash.edu:3000/rest/adminlogin",
        dataType: "json",
        method: "POST",
        data: { user: user_str, password: password_str },
        statusCode: {
            401: function() {
                $("#admin_loginfail").text("Authentication failed! Please try again.");
                $("#admin_loginfail").show();
            },
        },
        success: function(retjson) {

            if(retjson.status === "error") {
                $("#admin_loginfail").text("Authentication failed! Please try again.");
                $("#admin_loginfail").show();
                return;
            }

            $("#admin_labelLogoff").text("Logged in");
            $("#admin_div_login").hide();
            $("#admin_div_logoff").show();
            $("#admin_loginfail").hide();
            $("#admin_tags_container").show();
        },
    });
}); // end admin_btnLogin clicked

$("#admin_btnLogoff").click(function(event){
    $("#admin_div_login").show();
    $("#admin_div_logoff").hide();
    $("#admin_tags_container").hide();
    jQuery('#jqGrid_tags').jqGrid('clearGridData');
    selected_tags = [];
}); // end admin_btnLogoff clicked

$("#admin_btnGetTags").click(function(event){
    socket.emit('admingettags', {task: "admingettags"});
}); // end admin_btnGetTags clicked


// grid
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
    for (var i=0; i < selected_tags.length; i++) {
        if( selected_tags[i].tag == id)
            return i;
    }
    return -1;
}

// create tags grid with empty data
function createTagsGrid(){
    $("#jqGrid_tags").jqGrid({
        datatype: "local",
		data: [],
        height: 400,
        colModel: [
            //checkbox
            {
                name: 'enbl', index: 'enbl', width: 60, align: 'center',
                formatter: 'checkbox', editoptions: { value: '1:0' },
                formatoptions: { disabled: false },
            },
            { label: 'Tag', name: 'tag', width: 80, key:true },
            { label: 'Type', name: 'type', width: 80 },
            { label: 'Source', name: 'source', width: 100 },
            { label: 'Date created', name: 'date', width: 260 },
            { label: 'Data', name: 'data', width: 340 },
            { label: 'Size', name: 'size', width: 120 },
        ],
        viewrecords: true, // show the current page, data rang and total records on the toolbar
        caption: "Tags in database",
        pager: "#jqGridPager_tags",
        rowNum: 30,
        loadComplete: function () {
            var iCol = getColumnIndexByName($(this), 'enbl'), rows = this.rows, i, c = rows.length;
            for (i = 0; i < c; i += 1) {
                $(rows[i].cells[iCol]).click(function (e) {
                    var id = $(e.target).closest('tr')[0].id, isChecked = $(e.target).is(':checked');
                    var s = $("#jqGrid_tags").jqGrid ('getCell', id, 'source');
                    var d = $("#jqGrid_tags").jqGrid ('getCell', id, 'data');
                    var desc = "dataset: " + id + " | " + $("#jqGrid_tags").jqGrid ('getCell', id, 'name') + ' | '
                                +  $("#jqGrid_tags").jqGrid ('getCell', id, 'size') + '|' + isChecked;
                    console.log(id + ' ' + desc);
                    
                    if(isChecked) {
                        if (findDataset(id) == -1)
                            selected_tags.push({tag: id, source: s, data: d}); //using unshift to add to the front
                    }
                    else {
                        var ind = findDataset(id);
                        if (ind != -1) 
                            selected_tags.splice(ind, 1);
                    }
                });
            }
        }
    });
}
 
 
$("#admin_btnDeleteTags").click(function(event){
    console.log(selected_tags);
    socket.emit('admindeletetags', selected_tags);
});


socket.on('admingettags', function(data) {
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
       
       jQuery('#jqGrid_tags').jqGrid('clearGridData');
       
       //var resultdata = $.parseJSON(data.result);
       
       jQuery('#jqGrid_tags').jqGrid('setGridParam', {data: data.result});
       jQuery('#jqGrid_tags').jqGrid('setGridParam', {data: data.result});
       jQuery('#jqGrid_tags').jqGrid('setGridParam', {data: data.result});

       jQuery('#jqGrid_tags').trigger('reloadGrid');
       
       selected_tags = [];
    }
});

socket.on('admindeletetags', function(data) {
    if (data.status === 'error') {
        BootstrapDialog.show({
            title: 'Error',
            message: data.detail,
            type: BootstrapDialog.TYPE_DANGER
        });
    }
    else if (data.status === 'done') {
        console.log('tags deleted');
        document.getElementById('admin_btnGetTags').click();
        return false;
    }
});


// run
createTagsGrid();