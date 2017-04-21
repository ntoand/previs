// previs viewer and editor for multiple OBJ files
// by dw in 2017 for MIVP
var scene, camera, renderer;
var lights = [];
var light1;
var light_cam;  // camera-bound light
var g_width, g_height;
var g_prevMouseX = 0, g_prevMouseY = 0;
var g_camDistance = 1.0;
var g_camRotX = 0.0, g_camRotY = 0.0;
var model;
var g_totalLoaded = 0;
var camTransform = new THREE.Matrix4();
var g_gui;
var g_properties;
//var dataPrefix = "data/";
var dataPrefix = "";    // 20170411 - not needed
var g_responder;
var g_jsonTransport;
var g_tempScene;        // object to hold load/save data
var g_tempSceneJSON;    // a temporary string to hold JSON of all mesh parameters
var socket = io();
var g_sourceName = "";       // the name of the directory/file used as a source of scene data (a tempfile or eventually, a tag)
var g_sceneOBJCount = 0;
var g_sceneOBJLoaded = 0;
var g_objectBounds;
var g_allObjectsGroup;

// SceneTransport holds data about groups and models, used for saving/reconstructing
var SceneTransport = function()
{
    this.groups = [];
    this.models = [];
};

// OBJModel_store - the base version of an OBJModel, which contains the data that should persist on the server
//                - these can be saved/loaded as JSON objects
var OBJModel_store = function()
{
    this.name = "";
    this.filename = "";
    this.colour = [ 255, 255, 255 ];
    this.alpha = 1.0;
    //this.material = null;
};

// OBJModel - a specialised version of OBJModel that contains anything needed for the viewing session (e.g. three.js references)
//          - don't store an entire OBJModel as JSON
var OBJModel = function()
{
    // this.name = "";
    // this.filename = "";
     this.model = null;
    // this.colour = [ 255, 255, 255 ];
    // this.alpha = 1.0;
    this.material = null;// = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // OBJModel.applySettings() - traverses the mesh and applies alpha/colour parameters to its materials
    //                            .. not the ideal way to do this, but it works for now!
    this.applySettings = function()
    {
        if(this.model == null)
        {
            console.log("Can't apply settings, model is not set");
            return;
        }

        console.log(this.model);
        console.log("Applying settings");

        var meshes = [];

        (function(model, meshlist) {
            if(model instanceof THREE.Mesh)
            {
                meshlist.push(model);
            }

            for(var i = 0; i < model.children.length; i++)
            {
                arguments.callee(model.children[i], meshlist);
            }
        }(this.model, meshes));

        for(var i = 0; i < meshes.length; i++)
        {
            meshes[i].material.color.setRGB(this.colour[0] / 255, this.colour[1] / 255, this.colour[2] / 255);
            meshes[i].material.opacity = this.alpha;
            meshes[i].material.transparent = (this.alpha < 1.0);
        }
    };
};

OBJModel.prototype = new OBJModel_store();

// OBJGroup_store - the base version of an OBJGroup, which contains the data that should persist on the server
var OBJGroup_store = function()
{
    this.name = "";
    // this.nodes = [];
    this.visible = true;
    this.colour = [ 255, 255, 255 ];
    this.alpha = 1.0;
};

// OBJGroup - a specialised version of OBJGroup that contains anything needed for the viewing session (e.g. three.js references)
var OBJGroup = function()
{
    console.log("Creating new OBJGroup");
    // this.name = "";
    this.nodes = [];
    // this.visible = true;
    // this.colour = [ 255, 255, 255 ];
    // this.alpha = 1.0;
    // OBJGroup.refresh() - apply alpha/colour settings to all meshes in the group
    this.refresh = function()
    {
        console.log("Updating group " + this.name + "..");
        for(i = 0; i < this.nodes.length; i++)
        {
            //console.log(i + ": (" + this.nodes[i].name + ", " + this.nodes[i].model + ")");
            this.nodes[i].model.visible = this.visible;
            console.log("[" + i + "/" + this.nodes.length + "] " + this.nodes[i].filename + ": " + this.nodes[i].model.visible);
            
            if(this.visible)
            {
                this.nodes[i].colour = this.colour;
                this.nodes[i].alpha = this.alpha;
                this.nodes[i].applySettings();
            }
        }
    };
};

OBJGroup.prototype = new OBJGroup_store();

// OBJViewProperties - contains all information about the current scene
var OBJViewProperties = function()
{
    this.camDistance = 10.0;
    this.camRotX = 0.0;
    this.camRotY = 0.0;
    this.groups = [];
    // OBJViewProperties.refresh() - refresh all models in the scene
    this.refresh = function()
    {
        console.log(this);
        var groupCount = this.groups.length;

        for(var i = 0; i < groupCount; i++)
        {
            console.log("Refreshing group " + i + "/" + groupCount + "..");
            console.log(this.groups[i]);
            this.groups[i].refresh();
        }
    };

    // OBJViewProperties.findNode() - find a node (mesh) in the scene by name
    this.findNode = function(filename)
    {
        console.log("Looking for node to match " + filename + "...");
        for(var i = 0; i < this.groups.length; i++)
        {
            //console.log("Looking in " + this.groups[i].name);
            for(j = 0; j < this.groups[i].nodes.length; j++)
            {
                if(this.groups[i].nodes[j].filename == filename)
                {
                    console.log(this.groups[i].nodes[j].filename + " matches!");
                    return this.groups[i].nodes[j];
                }
            }
        }

        console.log("No matches found");

        return null;
    };

    // OBJViewProperties.attachModel() - store a reference to a model
    this.attachModel = function(filename, model, material)
    {
        console.log("OBJViewProperties.attachModel(): Looking for node to match " + filename + "...");
        for(var i = 0; i < this.groups.length; i++)
        {
            //console.log("Looking in " + this.groups[i].name);
            for(var j = 0; j < this.groups[i].nodes.length; j++)
            {
                if(this.groups[i].nodes[j].filename == filename)
                {
                    console.log(this.groups[i].nodes[j].filename + " matches!");
                    console.log("Setting model reference..");
                    if(model == null)
                    {
                        console.log(" .. model is missing");
                    }
                    if(material == null)
                    {
                        console.log(" .. material is missing");
                    }
                    this.groups[i].nodes[j].model = model;
                    this.groups[i].nodes[j].material = material;
                    return;
                }
            }
        }

        console.log("No matches found - could not set model reference");
    };    
};

// finaliseScene() - update the page when everything is loaded
function finaliseScene()
{
    var title = document.getElementById("viewertitle");
    if(title != null)
    {
        title.innerHTML = "Web mesh previs";
    }

    g_responder.loadAll();
};

// responder - contains callbacks for dat.gui events
var responder = function()
{
    this.loadAll = function()
    {
        console.log("Loading scene");
        //loadScene(g_tempSceneJSON);
        //requestLoad("testsave.json");
        requestLoad(g_sourceName + "_params.json");
    };

    this.saveAll = function()
    {
        console.log("Saving scene");
        saveScene();
    };

    this.resetAll = function()
    {
        console.log("Resetting scene");
        resetScene();
        g_properties.refresh();
        refreshGUI(g_gui);
    };

    this.reportSave = function()
    {
        //console.log(localStorage);
        //console.log(g_gui.getSaveObject());

        var allGroups = [];
        var allModels = [];

        for(var i = 0; i < g_properties.groups.length; i++)
        {
            console.log("Saving group " + g_properties.groups[i].name + "..");

            var group = new OBJGroup_store();
            //var groupKeys = Object.keys(group);
            var groupNames = Object.getOwnPropertyNames(group);
            //var origKeys = Object.keys(g_properties.groups[i]);
            var origNames = Object.getOwnPropertyNames(g_properties.groups[i]);

            //console.log(groupNames);

            for(var k = 0; k < groupNames.length; k++)
            {
                //group.push(origNames[k]);
                group[groupNames[k]] = g_properties.groups[i][groupNames[k]];
            }

            for(var j = 0; j < g_properties.groups[i].nodes.length; j++)
            {
                console.log("Saving model " + g_properties.groups[i].nodes[j].name + "..");

                var model = new OBJModel_store();

                var modelNames = Object.getOwnPropertyNames(model);
                var origNames = Object.getOwnPropertyNames(g_properties.groups[i].nodes[j]);

                for(var k = 0; k < modelNames.length; k++)
                {
                    //group.push(origNames[k]);
                    console.log("Saving property " + modelNames[k] + ": " + g_properties.groups[i].nodes[j][modelNames[k]]);
                    model[modelNames[k]] = g_properties.groups[i].nodes[j][modelNames[k]];
                }

                allModels.push(model);

                // console.log("Original object:");
                // console.log(g_properties.groups[i]);
                // console.log("Saved object:");
                // console.log(group);
            }

            allGroups.push(group);
        }

        console.log("Groups");
        console.log("======");
        console.log(allGroups);
        console.log("Models");
        console.log("======");
        console.log(allModels);
    };
};

function loadParamsFromString(params)
{

}

var jsonObj;

main();
render();

// loadOBJ() - load a model
function loadOBJ(filename)
{
    var loader = new THREE.OBJLoader();
    var obj = null;
    var filelocation = dataPrefix + filename;

    //loader.load(filename,
    loader.load(filelocation,
        function(object)
        {
            console.log("Model loaded");
            //model = object;

            // object.traverse(
            //     function(node)
            //     {
            //         if(node instanceof THREE.Mesh)
            //         {
            //             console.log("Assigning texture");
            //             //node.material.map = objTexture;
            //             //node.material.shininess = 80;
            //             //node.material.specularMap = objSpecMap;
            //             //node.material.color = 0xff0000;
            //             //node.material.emissive = 0xffffff;
            //             //node.material.color.set(0xff00ff);
                        
            //             var r = Math.random();
            //             var g = Math.random();
            //             var b = Math.random();

            //             node.material.color.copy(new THREE.Color(r, g, b));
            //         }
            //     }
            // );

            object.position.y = 0;
            //object.scale.set(20, 20, 20);
            object.rotation.set(1.5708, 0.0, 0.0);
            scene.add(object);

            // step through the model hierarchy and smooth everything
            object.traverse(
                function(node)
                {
                    if(node.geometry !== undefined)
                    {
                        console.log("Smoothing and recomputing normals..");
                        var g = new THREE.Geometry()
                        g.fromBufferGeometry(node.geometry);

                        // node.geometry.mergeVertices();
                        // node.geometry.computeVertexNormals();
                        g.mergeVertices();
                        g.computeVertexNormals();
                        node.geometry.fromGeometry(g);
                    }
            });

            var mat = new THREE.MeshBasicMaterial({ color: 0xffffff });

            g_properties.attachModel(filename, object, mat);

            g_totalLoaded++;
            g_sceneOBJLoaded++;

            var title = document.getElementById("viewertitle");
            if(title != null && g_sceneOBJCount > 0)
            {
                var amtLoaded = g_sceneOBJLoaded / g_sceneOBJCount;

                title.innerHTML = "Loading, " + amtLoaded.toFixed(0) + "%";
            }

            g_allObjectsGroup.add(object);

            // update the bounding box
            g_objectBounds.setFromObject(g_allObjectsGroup);

            lights[0].position.x = g_objectBounds.max.x;
            lights[0].position.y = g_objectBounds.max.y;
            lights[0].position.z = g_objectBounds.max.z;
            lights[1].position.x = g_objectBounds.min.x;
            lights[1].position.y = g_objectBounds.min.y;
            lights[1].position.z = g_objectBounds.min.z;

            if(g_sceneOBJLoaded == g_sceneOBJCount && g_sceneOBJCount > 0)
            {
                finaliseScene();
            }
        }
    );
}

function updateLights()
{
    // move the camera light
    light_cam.position.set(camera.position.x, camera.position.y, camera.position.z);
}

function main()
{
    // check if the query string has a tag in it
    var tagPosition = location.search.indexOf("tag=");
    var tagEndPosition = -1;
    
    if(tagPosition == -1)
    {
        console.log("Tag not specified");
    }
    else
    {
        // work out where to stop getting the filename from - either the next value or the end of the query string
        tagEndPosition = location.search.indexOf("&", tagPosition);

        if(tagEndPosition == -1)
        {
            g_sourceName = location.search.substr(tagPosition + 4); // use the rest of the string
        }
        else
        {
            // need the length of the string here, not the actual end position
            tagEndPosition -= tagPosition;

            g_sourceName = location.search.substr(tagPosition + 4, tagEndPosition);
        }

        // 20170420 - remember path prefix instead of baking it into filenames in the json file
        dataPrefix = g_sourceName + "/";
    }

    console.log("Source name: " + g_sourceName);

    g_properties = new OBJViewProperties();

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    g_allObjectsGroup = new THREE.Group();  // create a group for all objects

    scene.add(g_allObjectsGroup);
    
    g_objectBounds = new THREE.Box3();

    light1 = new THREE.PointLight(0xffffff, 1, 500);
    //light1.position.set(4, 4, -5);
    light1.position.set(8, 8, -10);
    light1.intensity = 1;
    scene.add(light1);

    lights.push(light1);

    var light2 = new THREE.PointLight(0xffffff, 1, 500);
    light2.position.set(20, 20, 10);
    light2.intensity = 1;
    scene.add(light1);

    lights.push(light2);

    light_cam = new THREE.PointLight(0xfff0f8, 1);
    light_cam.position.set(0, 30, -2);
    light_cam.intensity = 0.5;
    camera.add(light_cam);
    scene.add(light_cam);

    var ambLight = new THREE.AmbientLight(0x808088);
    scene.add(ambLight);

    // axis display
    var materialLine1 = new THREE.LineBasicMaterial( { color: 0xff0000 } );
    var materialLine2 = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
    var materialLine3 = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    var geometryLine1 = new THREE.Geometry();
    var geometryLine2 = new THREE.Geometry();
    var geometryLine3 = new THREE.Geometry();

    geometryLine1.vertices.push(
        new THREE.Vector3(-500.0, 0.0, 0.0),
        new THREE.Vector3(500.0, 0.0, 0.0)
    );
    geometryLine2.vertices.push(
        new THREE.Vector3(0.0, -500.0, 0.0),
        new THREE.Vector3(0.0, 500.0, 0.0)
    );
    geometryLine3.vertices.push(
        new THREE.Vector3(0.0, 0.0, -500.0),
        new THREE.Vector3(0.0, 0.0, 500.0)
    );

    var line1 = new THREE.Line(geometryLine1, materialLine1);
    var line2 = new THREE.Line(geometryLine2, materialLine2);
    var line3 = new THREE.Line(geometryLine3, materialLine3);

    scene.add(line1);
    scene.add(line2);
    scene.add(line3);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    var cube = new THREE.Mesh(geometry, material);
    //scene.add(cube);

    var objTexture = new THREE.Texture();
    var objSpecMap = new THREE.Texture();

    var loader = new THREE.ImageLoader();
    loader.load('obj/vive/onepointfive_texture.png',
        function(object) {
            g_totalLoaded++;
            console.log("Texture loaded: " + object.width + "x" + object.height);
            objTexture.image = object;
        }
    );

    var loader = new THREE.ImageLoader();
    loader.load('obj/vive/onepointfive_spec.png',
        function(object) {
            g_totalLoaded++;
            console.log("Specular map loaded: " + object.width + "x" + object.height);
            objSpecMap.image = object;
        }
    );

    var loader = new THREE.OBJLoader();

    loader.load('obj/vive/vr_controller_vive_1_5.obj',
        function(object)
        {
            console.log("Model loaded");
            model = object;

            object.traverse(
                function(node)
                {
                    if(node instanceof THREE.Mesh)
                    {
                        console.log("Assigning texture");
                        //node.material.map = objTexture;
                        //node.material.shininess = 80;
                        node.material.specularMap = objSpecMap;
                        //node.material.color = 0xff0000;
                        //node.material.emissive = 0xffffff;
                        node.material.color.set(0xff00ff);
                    }
                }
            );

            object.position.y = 0;
            object.scale.set(20, 20, 20);
            object.rotation.set(1.5708, 0.0, 0.0);
            scene.add(object);

            g_totalLoaded++;
        }
    );

    g_width = window.innerWidth;
    g_height = window.innerHeight;

    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x404048, 1);
    document.body.appendChild(renderer.domElement);

    // load the json file, as a test..
    var xmlreq = new XMLHttpRequest();
    xmlreq.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            jsonObj = JSON.parse(this.responseText);

            console.log(jsonObj);

            console.log("Length: " + jsonObj.length);

            for(var i = 0; i < jsonObj.length; i++)
            {
                var objgroup = new OBJGroup();
                objgroup.name = jsonObj[i][0];

                console.log("Group name: " + objgroup.name);

                var meshGroup = jsonObj[i][1];
                //console.log("Group: [length " + jsonObj[i].length + "], meshes: " + jsonObj[i][1].length);
                
                for(var j = 0; j < meshGroup.length; j++)
                {
                    /*
                    var filename = dataPrefix + g_sourceName + "/";
                    //filename += pair;
                    filename += jsonObj[i][0];
                    filename += "/";
                    filename += meshGroup[j]
                    */
                    var filename = jsonObj[i][0] + "/" + meshGroup[j];    // 20170420: don't store full pathname, that's in dataPrefix

                    console.log("Opening " + filename + "...");
                    //console.log("Opening something..");

                    loadOBJ(filename);
                    g_sceneOBJCount++;

                    var groupmodel = new OBJModel();
                    groupmodel.name = meshGroup[j];
                    groupmodel.filename = filename;

                    objgroup.nodes.push(groupmodel);
                    console.log("Nodes in group " + jsonObj[i][0] + ": " + objgroup.nodes.length);
                    var title = document.getElementById("viewertitle");
                    if(title != null)
                    {
                        title.innerHTML = "Loading, " + g_sceneOBJLoaded + "/" + g_sceneOBJCount;
                    }
                }

                g_properties.groups.push(objgroup);
                console.log("Global group count: " + g_properties.groups.length);
            }

            // all loading is done, setup GUI
            setupGUI();
        }
    }
    //xmlreq.open("GET", g_sourceName + ".json");
    xmlreq.open("GET", g_sourceName + "/meshgroups.json");   // 20170411 - server provdes full filename now, don't need to add .json
    xmlreq.send();

    //socket.on('loadjson', loadParamsFromString(msg));
    socket.on('loadjson', function(msg)
    {
        console.log("Received scene parameters from server, loading..");
        console.log(msg);

        loadScene(msg);

        console.log("Updated scene parameters from server");
    });
}

// setupGUI() - what it says on the tin
function setupGUI()
{
    g_gui = new dat.GUI({load: JSON, preset: 'test'});
    g_responder = new responder();
    // some cheeky JS to get dat.gui to give buttons friendly names - create JS
    // object properties with friendly names that alias actual functions
    g_responder['Save settings'] = g_responder.saveAll;
    g_responder['Reload settings'] = g_responder.loadAll;
    g_responder['Reset all'] = g_responder.resetAll;
    
    // var camdist = g_gui.add(g_properties, 'camDistance');
    // g_gui.add(g_properties, "camRotX");
    // g_gui.add(g_properties, "camRotY");
    // g_gui.add(g_properties, 'camRotX').listen();
    // g_gui.add(g_properties, 'camRotY').listen();
    console.log("setupGUI(): Global group count: " + g_properties.groups.length);

    //g_gui.remember(g_properties);

    //btn = g_gui.add(g_responder, "saveAll");
    btn = g_gui.add(g_responder, ['Save settings']);
    //g_gui.add(g_responder, "reportSave");
    //g_gui.add(g_responder, "resetAll");
    g_gui.add(g_responder, ['Reset all']);
    //g_gui.add(g_responder, "loadAll");
    g_gui.add(g_responder, ['Reload settings']);

    var folderMeshGroups = g_gui.addFolder("Mesh groups");

    for(var i = 0; i < g_properties.groups.length; i++)
    {
        console.log("Adding group " + g_properties.groups[i].name + " to GUI.. (nodes: " + g_properties.groups[i].nodes.length + ")");
        var currentGroup = folderMeshGroups.addFolder(g_properties.groups[i].name);

        // add control for mesh toggle
        var element = currentGroup.add(g_properties.groups[i], 'visible');
        element.onChange(function(value){
            g_properties.refresh();
        });
        element.name("Visible");

        var colourPicker = currentGroup.addColor(g_properties.groups[i], "colour");
        colourPicker.onChange(function(value){
            g_properties.refresh();
        });
        var alphaSlider = currentGroup.add(g_properties.groups[i], "alpha", 0.0, 1.0);
        alphaSlider.onChange(function(value){
            g_properties.refresh();
        });

        // g_gui.remember(g_properties.groups[i]);

        //colourPicker.onFinishChange = g_properties.groups[i]
    }

    // mesh groups folder is open by default
    folderMeshGroups.open();

    //for(group in g_properties.groups)
    // for(var i = 0; i < g_properties.groups.length; i++)
    // {
    //     console.log("Adding group " + g_properties.groups[i].name + " to GUI.. (nodes: " + g_properties.groups[i].nodes.length + ")");
    //     // add control for mesh toggle
    //     var element = folderMeshGroups.add(g_properties.groups[i], 'visible');
    //     element.onChange(function(value){
    //         g_properties.refresh();
    //     });
    //     element.name(g_properties.groups[i].name);
    // }
}

// render() - draw everything
function render()
{
    requestAnimationFrame(render);
    if(g_totalLoaded < 3)
    {
        return;
    }
    console.log("Frame");
    renderer.render(scene, camera);
}

function onDocumentMouseMove(event)
{
    vx = event.clientX;
    vy = event.clientY;
    vz = 1.0;

    xDelta = vx - g_prevMouseX;
    yDelta = vy - g_prevMouseY;

    if(event.buttons & 1)
    {
        //var camPos = camera.position;
        //camPos.z += (event.deltaY * .1);
        //g_camDistance += (event.deltaY * .1);
        var scaleX = 5.0;
        var scaleY = 5.0;
        
        g_camRotY -= (xDelta / g_width) * scaleX;
        g_camRotX -= (yDelta / g_height) * scaleY;

        g_camRotX = Math.min(Math.max(-Math.PI / 2.0, g_camRotX), Math.PI / 2.0);
        //g_camRotY = Math.min(Math.max(0.0, g_camRotY), Math.PI * 2.0);

        rotX = g_camRotX;// % (Math.PI * 2.0);
        rotY = g_camRotY;// % (Math.PI * 2.0);

        g_properties.camRotX = rotX;
        g_properties.camRotY = rotY;
        
        var transform = new THREE.Matrix4();
        var translate = new THREE.Matrix4();
        var rotate = new THREE.Matrix4();

        var rotateX = new THREE.Matrix4();
        var rotateY = new THREE.Matrix4();
        rotateX.makeRotationFromEuler(new THREE.Euler(rotX, 0.0, 0.0), "XYZ");
        rotateY.makeRotationFromEuler(new THREE.Euler(0.0, rotY, 0.0), "XYZ");

        translate.makeTranslation(0.0, 0.0, 1.0);
        rotate.makeRotationFromEuler(new THREE.Euler(rotX, rotY, 0.0), "XYZ");

        //transform = rotate.multiply(translate);
        //transform.multiplyMatrices(rotate, translate);

        transform.multiplyMatrices(rotateX, translate);
        transform.multiplyMatrices(rotateY, transform);
        
        var camPos = new THREE.Vector3(0.0, 0.0, g_camDistance);
        camPos.applyMatrix4(transform);
        
        var c = new THREE.Vector3(0, 0, 0);

        //camera.position.x = vx;
        camera.position.x = camPos.x;
        camera.position.y = camPos.y;
        camera.position.z = camPos.z;
        camera.lookAt(c);

        updateLights();

        // // model.rotateZ((xDelta * 0.01) * Math.PI);
        // // model.rotateX((yDelta * 0.01) * Math.PI);
        // // model.updateMatrix();

        // g_camRotX = (xDelta * 0.1);
        // g_camRotY = (yDelta * 0.1);

        // var c = new THREE.Vector3(0, 0, 0);
        // var camPos = new THREE.Vector3(0, 0, 0);
        // camPos.x = Math.sin(g_camRotX % Math.PI);
        // camPos.y = Math.cos(g_camRotY % Math.PI);
        // camPos.z = -1.0;

        // camPos.multiplyScalar(g_camDistance);

        console.log("xDelta" + xDelta + " yDelta: " + yDelta);
        console.log("rotX: " + rotX + " rotY: " + rotY);
        console.log(camera.position);

        // camera.position = camPos;
        // camera.lookAt(c);        
    }
    //else
    {
        // var camPos = camera.position;
        // camPos.x = ((vx / g_width) - 0.5) * 2.0;
        // camPos.y = ((vy / g_height) - 0.5) * 2.0;
        // var c = new THREE.Vector3(0, 0, 0);

        // //camera.position.x = vx;
        // camera.position = camPos;
        // camera.lookAt(c);
    }

    g_prevMouseX = vx;
    g_prevMouseY = vy;
}

function onDocumentMouseWheel(event)
{
    //var camPos = camera.position;
    //camPos.z += (event.deltaY * .1);
    g_camDistance += (event.deltaY * .1);
    
    rotX = g_camRotX;// % (Math.PI * 2.0);
    rotY = g_camRotY;// % (Math.PI * 2.0);
        
    var transform = new THREE.Matrix4();
    var translate = new THREE.Matrix4();
    var rotate = new THREE.Matrix4();
/*
    translate.makeTranslation(0.0, 0.0, 1.0);
    rotate.makeRotationFromEuler(new THREE.Euler(rotX, rotY, 0.0), "XYZ");

    //transform = rotate.multiply(translate);
    transform.multiplyMatrices(rotate, translate);
  */

    var rotateX = new THREE.Matrix4();
    var rotateY = new THREE.Matrix4();
    rotateX.makeRotationFromEuler(new THREE.Euler(rotX, 0.0, 0.0), "XYZ");
    rotateY.makeRotationFromEuler(new THREE.Euler(0.0, rotY, 0.0), "XYZ");

    translate.makeTranslation(0.0, 0.0, 1.0);
    rotate.makeRotationFromEuler(new THREE.Euler(rotX, rotY, 0.0), "XYZ");

    //transform = rotate.multiply(translate);
    //transform.multiplyMatrices(rotate, translate);

    transform.multiplyMatrices(rotateX, translate);
    transform.multiplyMatrices(rotateY, transform);

    var camPos = new THREE.Vector3(0.0, 0.0, g_camDistance);
    camPos.applyMatrix4(transform);
    
    var c = new THREE.Vector3(0, 0, 0);

    //camera.position.x = vx;
    camera.position.x = camPos.x;
    camera.position.y = camPos.y;
    camera.position.z = camPos.z;
    camera.lookAt(c);

    updateLights();

    // update dat.gui
    
}

function loader_getGroup(groupName)
{
    console.log("Checking scene for group name " + groupName + "..");

    // get a group from the properties object
    for(var i = 0; i < g_properties.groups.length; i++)
    {
        if(g_properties.groups[i].name == groupName)
        {
            console.log(g_properties.groups[i].name + " matches!");

            return g_properties.groups[i];
        }

        console.log(g_properties.groups[i].name + " does not match");
    }

    console.log("No matches for " + groupName + " found!");
    
    return null;
};

// resetScene() - reset all view parameters to default for everything in the scene (excluding the camera for now)
function resetScene()
{
    for(var i = 0; i < g_properties.groups.length; i++)
    {
        g_properties.groups[i].visible = true;
        g_properties.groups[i].colour = [255, 255, 255];
        g_properties.groups[i].alpha = 1.0;

        for(var j = 0; j < g_properties.groups[i].length; j++)
        {
            g_properties.groups[i].nodes[j].colour = [255, 255, 255];
            g_properties.groups[i].nodes[j].alpha = 1.0;
        }
    }
};

// saveScene() - save all view parameters to JSON and export a LavaVu init script to match view settings
function saveScene()
{
    console.log("Saving mesh parameters to JSON..");

    // don't need tempscene's original content
    g_tempScene = {};

    g_tempScene.groups = [];
    g_tempScene.models = [];

    for(var i = 0; i < g_properties.groups.length; i++)
    {
        var grp = new OBJGroup_store();
        var grpKeys = Object.keys(grp);
        console.log(Object.keys(grp));

        for(var j = 0; j < grpKeys.length; j++)
        {
            if(grpKeys[j] in g_properties.groups[i])
            {
                console.log("Storing property " + grpKeys[j] + "..");
                grp[grpKeys[j]] = g_properties.groups[i][grpKeys[j]];

                if(!grp.hasOwnProperty(grpKeys[j]))
                {
                    console.log("Shouldn't be storing this property!");
                }
            }
        }

        for(var j = 0; j < g_properties.groups[i].nodes.length; j++)
        {
            var model = new OBJModel_store();
            var modelKeys = Object.keys(model);
            console.log(Object.keys(model));

            for(var k = 0; k < modelKeys.length; k++)
            {
                if(modelKeys[k] in g_properties.groups[i].nodes[j])
                {
                    console.log("Storing mesh property " + modelKeys[k] + "..");
                    model[modelKeys[k]] = g_properties.groups[i].nodes[j][modelKeys[k]];

                    if(!model.hasOwnProperty(modelKeys[k]))
                    {
                        console.log("Shouldn't be storing this property!");
                    }                    
                }
            }

            g_tempScene.models.push(model);
        }

        g_tempScene.groups.push(grp);
    }

    console.log(g_tempScene);

    g_tempSceneJSON = JSON.stringify(g_tempScene);

    // create LavaVu init script
    var initscript = new String();
    var initGroups = [];
    var initModels = [];

    console.log(g_properties.groups);

    for(var i = 0; i < g_properties.groups.length; i++)
    {
        var grp = new Object;
        grp.name = g_properties.groups[i].name;
        grp.colour = g_properties.groups[i].colour;
        grp.alpha = g_properties.groups[i].alpha;
        grp.models = [];

        for(var j = 0; j < g_properties.groups[i].nodes.length; j++)
        {
            var mdl = new Object;
            mdl.filename = g_properties.groups[i].nodes[j].filename;
            //mdl.filename = g_properties.groups[i].nodes[j].filename.split("_result/")[1];
            mdl.colour = g_properties.groups[i].nodes[j].colour;
            mdl.alpha = g_properties.groups[i].nodes[j].alpha;

            grp.models.push(mdl);
        }

        initGroups.push(grp);
    }

    initscript += "#verbose\n";
    initscript += "trisplit=1\n";
    initscript += "#swapyz=1\n";
    initscript += "\n";

    //initscript += "select\n";

    for(var i = 0; i < initGroups.length; i++)
    {
        //initscript += "select " + (i + 1) + "\n";
        
        for(var j = 0; j < initGroups[i].models.length; j++)
        {
            initscript += 'file "' + initGroups[i].models[j].filename + '"\n';
            if(j == 0)
            {
                // loaded the first model, so a new object is created
                initscript += "select " + (i + 1) + "\n";
            }
            initscript += "colour [" + (initGroups[i].models[j].colour[0] / 255.0) + "," +
                (initGroups[i].models[j].colour[1] / 255.0) + "," +
                (initGroups[i].models[j].colour[2] / 255.0) + "," +
                "1.0] append\n";
        }

        initscript += "\n";
        initscript += "select\n";
    }

    for(var i = 0; i < initGroups.length; i++)
    {
        initscript += "name " + (i + 1) + ' "' + initGroups[i].name + '"\n';
    }

    initscript += "\n";

    // hide and change opacity where needed
    for(var i = 0; i < initGroups.length; i++)
    {
        initscript += "select " + (i + 1) + "\n";
        initscript += "opacity=" + initGroups[i].alpha + "\n";

        if(!g_properties.groups[i].visible)
        {
            initscript += "hide " + (i + 1) + "\n";
        }
    }

    initscript += "\n";
    initscript += "open\n";
    initscript += "#translation 0 0 -120\n";
    initscript += "#rotation 0 1 0 0\n";
    initscript += "\n";
    initscript += "border off\n";
    initscript += "axis off\n";
    initscript += "nearclip 0.2\n";
    initscript += "eyeseparation 0.12\n";

    console.log(initscript);

    // var saveArgs = [];
    // saveArgs[0] = 'testsave.json';
    // saveArgs[1] = g_tempSceneJSON;
    var saveArgs = { filename: g_sourceName + '/mesh_params.json', params: g_tempSceneJSON, script: initscript, scriptFilename: g_sourceName + '/init.script' };

    //socket.emit('saveparams', g_tempSceneJSON);
    socket.emit('saveparams', saveArgs);
};

// requestLoad() - request the view parameters JSON file from the server
function requestLoad()
{
    //paramFilename = g_sourceName + "_params.json";
    paramFilename = g_sourceName + "/mesh_params.json";

    console.log("Requesting to load " + paramFilename + "..");
    // socket.emit('loadparams', paramFilename);

    // load the json file, as a test..
    var xmlreq = new XMLHttpRequest();
    xmlreq.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            console.log("Got file from server, loading scene parameters..");

            loadScene(xmlreq.responseText);

            console.log("Updated scene parameters from server");
        }
    }

    xmlreq.open("GET", paramFilename);
    xmlreq.send();
}

// refreshGUI() - update the GUI
function refreshGUI(gui)
{
    var folderKeys = Object.keys(gui.__folders);

    console.log(gui.name + ": Refreshing " + gui.__controllers.length + " controllers..");

    for(var j = 0; j < gui.__controllers.length; j++)
    {
        gui.__controllers[j].updateDisplay();
    }

    console.log(gui.name + ": Refreshing " + folderKeys.length + " GUI folders..");

    for(var i = 0; i < folderKeys.length; i++)
    {
        var subfolder = gui.__folders[folderKeys[i]];

        refreshGUI(subfolder);
    }
}

// loadScene() - load view parameters from a JSON object
function loadScene(sceneData)
{
    console.log("Loading mesh parameters from JSON..");

    g_jsonTransport = JSON.parse(sceneData);

    console.log("Groups: " + g_jsonTransport.groups.length + ", meshes: " + g_jsonTransport.models.length);

    console.log("Groups");
    console.log("======");
    console.log(g_jsonTransport.groups);
    console.log("Models");
    console.log("======");
    console.log(g_jsonTransport.models);

    for(var i = 0; i < g_jsonTransport.groups.length; i++)
    {
        var grp = loader_getGroup(g_jsonTransport.groups[i].name);

        // group not found.. eep!
        if(grp == null)
        {
            console.log("loadScene(): group " + g_jsonTransport.groups[i].name + " not found in scene, skipping! (this shouldn't happen)");

            continue;
        }

        // group was found, populate it with data from the JSON
        var grpKeys = Object.keys(g_jsonTransport.groups[i]);

        for(var j = 0; j < grpKeys.length; j++)
        {
            if(grpKeys[j] in grp)
            {
                console.log("Loading property " + grpKeys[j] + "..");
                grp[grpKeys[j]] = g_jsonTransport.groups[i][grpKeys[j]];
            }
        }
    }

    for(var i = 0; i < g_jsonTransport.models.length; i++)
    {
        var obj = g_properties.findNode(g_jsonTransport.models[i].filename);

        // model not found.. eeeeep!
        if(obj == null)
        {
            console.log("loadScene(): model " + g_jsonTransport.models[i].filename + " not found in scene, skipping! (this shouldn't happen)");

            continue;
        }

        // model was found, populate it with data from the JSON
        var modelKeys = Object.keys(g_jsonTransport.models[i]);

        for(var j = 0; j < modelKeys.length; j++)
        {
            if(modelKeys[j] in obj)
            {
                console.log("Loading mesh property " + modelKeys[j] + "..");
                obj[modelKeys[j]] = g_jsonTransport.models[i][modelKeys[j]];
            }
        }
    }

    // make sure everything looks the way it should
    g_properties.refresh();

    // make sure the GUI is up to date
    console.log("Refreshing " + g_gui.__controllers.length + " GUI controllers..");
    // for(var i in g_gui.__controllers)
    // {
    //     g_gui.__controllers[i].updateDisplay();
    // }

    // refresh GUI
    refreshGUI(g_gui);
};