//load mesh object
/*
    bytes 0-3 = number of vertices
    bytes 4-7 = number of faces
    vertex = 6x4 bytes position followed by normal
    faces = 3x2 bytes as unsigned 16 bit indices
*/
 
function loadVBO(url, vbo) {
    var xhr = new XMLHttpRequest();
 
    xhr.onreadystatechange = function () { 
        if (xhr.readyState == xhr.DONE) {
            if (xhr.status == 200 && xhr.response) {
                loadBuffers(xhr.response,vbo);
            } else {
                console.log("Failed to download:" + xhr.status + " " + xhr.statusText);
            }
        }
    } 
    // Open the request for the provided url 
    xhr.open("GET", url, true);
    // Set the responseType to 'arraybuffer' for ArrayBuffer response 
    xhr.responseType = "arraybuffer";    
    xhr.send();
}
 
//read ArrayBuffer into gl buffers
function loadBuffers(buffer, vbo) {
    var reader = new DataView(buffer);
        //get number of vertices and faces
    var numVertices = reader.getUint32(0);
    var numFaces = reader.getUint32(4);
    vbo.numVertices = numVertices;
    vbo.numFaces = numFaces;
    //put that data in some arrays
    vbo.vertexData = new Float32Array(buffer,8,numVertices*6);
    vbo.indexData = new Uint16Array(buffer, numVertices*24+8, numFaces*3);
    //push that data to the GPU
    vbo.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vbo.vertexData, gl.STATIC_DRAW);
     
    vbo.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vbo.indexData, gl.STATIC_DRAW);
}
