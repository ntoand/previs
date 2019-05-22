function askPassword(msg) {
    var modal = document.getElementById("passwordModalDialog");
    modal.style.display = "block";
    var status = document.getElementById("password-status");
    if(msg) {
        status.style.display = "block";
        status.innerHTML = msg;
    }
    else {
        status.style.display = "none";
    }
}

function checkAndLoadPrevisTag(tag, password, success, first=true) {
    var http = new XMLHttpRequest();
    var url = "/rest/info";
    var params = 'tag=' + tag;
    if(password) {
        params += '&password=' + password;;
    } 
    http.open('POST', url, true);

    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
            var data = JSON.parse(http.responseText);
            if(data.status === 'error') {
                if(data.code === '101' || data.code === '102') {
                    data.code === '102' ? askPassword("Error: incorrect password"): askPassword();
                    if(first) {
                        var button = document.getElementById("password-button");
                        button.addEventListener('click', function(){
                            var modal = document.getElementById("passwordModalDialog");
                            modal.style.display = "none";
                            var password = document.getElementById("password").value;
                            if(password === '') {
                                askPassword();
                            }
                            else {
                                checkAndLoadPrevisTag(tag, password, success, false);
                            }
                        });
                    }
                }
                else {
                    alert('unknown error');
                }
            }
            else {
                // can load data here
                if(!data.dir) data.dir = data.tag;
                success(data);
            }
        }
    }
    http.send(params);
}