'use strict';

var url = new URL(window.location.href);
var gTag = url.searchParams.get("tag");
console.log(window.location);
console.log("Tag:" + gTag);

if(gTag === null || gTag === undefined || gTag === ''){
    alert("invalid tag");
}

$('#info').text("QR code for previs tag: " + gTag);

var qrcode = new QRCode(document.getElementById("qrcode"), {
	text: gTag,
	width: 300,
	height: 300,
	colorDark : "#000000",
	colorLight : "#ffffff",
	correctLevel : QRCode.CorrectLevel.H
});

function downloadQRImage() {
    console.log('downloadQRImage');
    var img = $('img')[0];
    if(img !== undefined && img !== null) {
        var url = img.src.replace(/^data:image\/[^;]+/, 'data:application/octet-stream');
        console.log(url);
        //window.open(url);

        var downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = gTag + ".png";

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
}

function ImagetoPrint(source, tag)
{
    return "<html><head><title>" + tag + "</title><script>function step1(){\n" +
            "setTimeout('step2()', 10);}\n" +
            "function step2(){window.print();window.close()}\n" +
            "</scri" + "pt></head><body onload='step1()'>\n" +
            "<img src='" + source + "' /></body></html>";
}

function printQRImage() {
    console.log('printQRImage');
    var img = $('img')[0];
    var pwa = window.open("about:blank", "_new");
    pwa.document.open();
    pwa.document.write(ImagetoPrint(img.src, gTag));
    pwa.document.close();
}



