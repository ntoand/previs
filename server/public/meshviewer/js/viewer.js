// previs viewer and editor for multiple OBJ files
// by dw in 2017 for MIVP
// modified by Toan Nguyen in June 2018
var scene, camera, renderer;
var g_lights = [];                // g_lights that surround the meshes
var g_light1;
var g_light_cam;                  // camera-bound light
var g_width, g_height;
var g_prevMouseX = 0, g_prevMouseY = 0;
var g_camDistance = 1.0;
var g_camRotX = 0.0, g_camRotY = 0.0;
var g_camTransX = 0.0, g_camTransY = 0.0, g_camTransZ = 0.0;
var model;
var camTransform = new THREE.Matrix4();
var g_gui;
var g_properties;
var g_responder;
var g_tempScene;                // object to hold load/save data
var g_tempSceneJSON;            // a temporary string to hold JSON of all mesh parameters
var socket = io();
var g_sourceName = "";          // the name of the directory/file used as a source of scene data
var g_sceneOBJCount = 0;
var g_sceneOBJLoaded = 0;
var g_objectBounds;
var g_allObjectsGroup;
var g_showAxisLines = true;
var g_axisLines;
var g_boundsSize = 1.0;         // the longest distance in any dimension that the mesh extends from the origin
var g_tag;

var CAMERA_DISTANCE_MIN = 0.1;

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
    this.nodes = [];
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
    
    this.findGroup = function(name) {
        for(var i=0; i < this.groups.length; i++) {
            if(this.groups[i].name === name) {
                return this.groups[i];
            }
        }
        return null;
    }

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
    console.log("finaliseScene");
    resetTitle();
    g_properties.refresh();
    refreshGUI(g_gui);
};

// resetTitle() - sets the main title back to its default, just used for now until a modal dialog is added for feedback
function resetTitle()
{
    var title = document.getElementById("viewertitle");
    if(title != null)
    {
        title.innerHTML = "MIVP mesh viewer";
    }
}

// responder - contains callbacks for dat.gui events
var responder = function()
{
    this.showAxis = true;

    this.loadAll = function()
    {
        console.log("responder: Loading scene");
        loadScene(jsonObj);
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

    this.toggleAxis = function()
    {
        console.log("Toggle axis lines");
        //g_showAxisLines = !g_showAxisLines;

        //g_axisLines.visible = g_showAxisLines;
        g_axisLines.visible = this.showAxis;
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
            }

            allGroups.push(group);
        }

    };
};

function loadParamsFromString(params)
{

}

var jsonObj;

main();
render();

// loadOBJ() - load a model
function loadOBJ(filename, groupname, object)
{
    var path =  "data/tags/" + g_tag + "/mesh_result/" + groupname + "/";
    console.log('loadOBJ: path=' + path);
    console.log(object);
    
    if(object.hasmtl) {
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath(path);
        mtlLoader.load(object.mtl, function(materials) {
            console.log("Material loaded " + object.mtl);
            materials.preload();
            console.log(materials);
            loadOBJOnly(filename, path, object, materials);
        },
        function () {
             // progress
        },
        function(err) {
            console.log("MTLLoader error: " + err)
        });
    }
    else {
        var mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        loadOBJOnly(filename, path, object, mat);
    }
}

function loadOBJOnly(filename, path, object, materials) {
    var loader = new THREE.OBJLoader();
    loader.setPath(path);
    if(object.hasmtl) {
        loader.setMaterials(materials);
    }
    console.log("loadOBJOnly: path=" + path + " name=" + object.obj)
    
    var obj = null;
    loader.load(object.obj, function(object) {
        console.log("Model loaded " + name);
        object.position.y = 0;
        //object.scale.set(20, 20, 20);
        object.rotation.set(1.5708, 0.0, 0.0);
        scene.add(object);

        // step through the model hierarchy and smooth everything
        object.traverse( function(node) {
            if(node.geometry !== undefined) {
                console.log("Smoothing and recomputing normals..");
                var g = new THREE.Geometry()
                g.fromBufferGeometry(node.geometry);
                g.mergeVertices();
                g.computeVertexNormals();
                node.geometry.fromGeometry(g);
            }
        });

        g_properties.attachModel(filename, object, materials);
        g_sceneOBJLoaded++;

        var title = document.getElementById("viewertitle");
        if(title != null && g_sceneOBJCount > 0) {
            var amtLoaded = g_sceneOBJLoaded / g_sceneOBJCount;
            title.innerHTML = "Loading, " + amtLoaded.toFixed(0) + "%";
        }

        g_allObjectsGroup.add(object);

        // update the bounding box
        g_objectBounds.setFromObject(g_allObjectsGroup);

        g_lights[0].position.x = g_objectBounds.max.x;
        g_lights[0].position.y = g_objectBounds.max.y;
        g_lights[0].position.z = g_objectBounds.max.z;
        g_lights[1].position.x = g_objectBounds.min.x;
        g_lights[1].position.y = g_objectBounds.min.y;
        g_lights[1].position.z = g_objectBounds.min.z;

        console.log("Bounding box: (" +
            g_objectBounds.min.x + ", " + g_objectBounds.min.y + ", " + g_objectBounds.min.z + ")-(" +
            g_objectBounds.max.x + ", " + g_objectBounds.max.y + ", " + g_objectBounds.max.z + ")");
        console.log("Simple centroid: (" +
            ((g_objectBounds.min.x + g_objectBounds.max.x) / 2) + ", " +
            ((g_objectBounds.min.y + g_objectBounds.max.y) / 2) + ", " +
            ((g_objectBounds.min.z + g_objectBounds.max.z) / 2) + ")");

        var maxCoord = Math.max(g_objectBounds.min.x, g_objectBounds.min.y, g_objectBounds.min.z, g_objectBounds.max.x, g_objectBounds.max.y, g_objectBounds.max.z);
        var minCoord = Math.min(g_objectBounds.min.x, g_objectBounds.min.y, g_objectBounds.min.z, g_objectBounds.max.x, g_objectBounds.max.y, g_objectBounds.max.z);

        var targetDist = Math.max(Math.abs(maxCoord), Math.abs(minCoord));
        g_boundsSize = targetDist;

        g_camDistance = targetDist * 1.5;

        // change the far clipping plane
        camera.far = targetDist * 8.0;  // arbitarily chosen for now, 8x the size of the bounding box

        // reset the camera
        placeCamera(0, 0, 0, g_camDistance);
        camera.updateProjectionMatrix();

        // update the axis lines to be at least the length of the clipping region
        updateAxisLines(g_boundsSize * 8.0);

        if(g_sceneOBJLoaded == g_sceneOBJCount && g_sceneOBJCount > 0) {
            finaliseScene();
        }
    }, 
    function () {
         // progress
    },
    function(err) {
        console.log("OBJLoader error: " + err)
    });
}

function updateLights()
{
    // move the camera light
    g_light_cam.position.set(camera.position.x, camera.position.y, camera.position.z);
}

function main()
{
    
    var url = new URL(window.location.href);
    g_tag = url.searchParams.get("tag");
    console.log(window.location);
    console.log("Tag:" + g_tag);
    
    if(g_tag === null || g_tag === undefined) {
        console.log("Tag not specified");
        return;
    }
   
    g_properties = new OBJViewProperties();

    scene = new THREE.Scene();
    //camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    g_allObjectsGroup = new THREE.Group();  // create a group for all objects

    scene.add(g_allObjectsGroup);
    
    g_objectBounds = new THREE.Box3();

    // g_light1 = new THREE.PointLight(0xffffff, 1, 500);
    g_light1 = new THREE.PointLight(0xffffff, 1);
    //g_light1.position.set(4, 4, -5);
    g_light1.position.set(8, 8, -10);
    g_light1.intensity = 1;
    scene.add(g_light1);

    g_lights.push(g_light1);

    // var light2 = new THREE.PointLight(0xffffff, 1, 500);
    var light2 = new THREE.PointLight(0xffffff, 1);
    light2.position.set(20, 20, 10);
    light2.intensity = 1;
    scene.add(light2); // double check, why g_light1?

    g_lights.push(light2);

    g_light_cam = new THREE.PointLight(0xfff0f8, 1);
    g_light_cam.position.set(0, 30, -2);
    g_light_cam.intensity = 0.5;
    camera.add(g_light_cam);
    scene.add(g_light_cam);

    var ambLight = new THREE.AmbientLight(0x808088);
    scene.add(ambLight);

    // axis display
    var materialLine1 = new THREE.LineBasicMaterial( { color: 0xff0000 } );
    var materialLine2 = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
    var materialLine3 = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    var geometryLine1 = new THREE.Geometry();
    var geometryLine2 = new THREE.Geometry();
    var geometryLine3 = new THREE.Geometry();

    var lineLength = 1.0;

    geometryLine1.vertices.push(
        new THREE.Vector3(-lineLength, 0.0, 0.0),
        new THREE.Vector3(lineLength, 0.0, 0.0)
    );
    geometryLine2.vertices.push(
        new THREE.Vector3(0.0, -lineLength, 0.0),
        new THREE.Vector3(0.0, lineLength, 0.0)
    );
    geometryLine3.vertices.push(
        new THREE.Vector3(0.0, 0.0, -lineLength),
        new THREE.Vector3(0.0, 0.0, lineLength)
    );

    g_axisLines = new THREE.Group();

    var line1 = new THREE.Line(geometryLine1, materialLine1);
    var line2 = new THREE.Line(geometryLine2, materialLine2);
    var line3 = new THREE.Line(geometryLine3, materialLine3);

    g_axisLines.add(line1);
    g_axisLines.add(line2);
    g_axisLines.add(line3);

    scene.add(g_axisLines);
    // scene.add(line2);
    // scene.add(line3);

    updateAxisLines(500);

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
            // sort by group name
            jsonObj.sort(function(a, b) {
               if(a.name > b.name) return 1;
               if(a.name < b.name) return -1;
               return 0;
            });
            console.log(jsonObj);
            console.log("Length: " + jsonObj.length);

            for(var i = 0; i < jsonObj.length; i++)
            {
                var objgroup = new OBJGroup();
                objgroup.name = jsonObj[i].name;
                objgroup.visible = jsonObj[i].visible;
                objgroup.colour = jsonObj[i].colour;
                objgroup.alpha = jsonObj[i].alpha;
                console.log("main: Group: " + objgroup.name);
                console.log(objgroup);

                var meshGroup = jsonObj[i].objects;
                
                for(var j = 0; j < meshGroup.length; j++)
                {
                    var filename = objgroup.name + "/" + meshGroup[j].obj;
                    console.log("Opening " + filename + "...");

                    loadOBJ(filename, objgroup.name, meshGroup[j]);
                    g_sceneOBJCount++;

                    var groupmodel = new OBJModel();
                    groupmodel.name = meshGroup[j].obj;
                    groupmodel.filename = filename;

                    objgroup.nodes.push(groupmodel);
                    console.log("Nodes in group " + jsonObj[i].name + ": " + objgroup.nodes.length);
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
    xmlreq.open("GET", "data/tags/" + g_tag + "/mesh_result/mesh.json");   // 20170411 - server provdes full filename now, don't need to add .json
    xmlreq.send();
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
    //g_responder['Toggle axis lines'] = g_responder.toggleAxis;
    g_responder['Show axis lines'] = g_responder.showAxis;
    
    console.log("setupGUI(): Global group count: " + g_properties.groups.length);

    //btn = g_gui.add(g_responder, "saveAll");
    //g_gui.add(g_responder, "reportSave");
    //g_gui.add(g_responder, "resetAll");
    //g_gui.add(g_responder, "loadAll");
    btn = g_gui.add(g_responder, ['Save settings']);
    g_gui.add(g_responder, ['Reset all']);
    g_gui.add(g_responder, ['Reload settings']);
    //g_gui.add(g_responder, ['Toggle axis lines']);
    var axisEvent = g_gui.add(g_responder, ['Show axis lines']);
    axisEvent.onChange(function(value) {
        g_responder.showAxis = value;
        g_responder.toggleAxis();
    });

    var folderMeshGroups = g_gui.addFolder("Mesh groups");

    for (var i=0; i < g_properties.groups.length; i++) {
        var group = g_properties.groups[i];
        console.log("Adding group " + group.name + " to GUI... (# nodes: " + group.nodes.length +  ")");
        
        var currentGroup = folderMeshGroups.addFolder(group.name);
        var element = currentGroup.add(g_properties.groups[i], 'visible');
        element.onChange(function(value){
            g_properties.refresh();
        });
        var colourPicker = currentGroup.addColor(g_properties.groups[i], "colour");
        colourPicker.onChange(function(value){
            g_properties.refresh();
        });
        var alphaSlider = currentGroup.add(g_properties.groups[i], "alpha", 0.0, 1.0);
        alphaSlider.onChange(function(value){
            g_properties.refresh();
        });
    }

    // mesh groups folder is open by default
    folderMeshGroups.open();
}

// render() - draw everything
function render()
{
    requestAnimationFrame(render);
    // if(g_totalLoaded < 3)
    // {
    //     return;
    // }
    //console.log("Frame"); // write to log for all frames, only needed for debugging (to check for renderer stopping)
    renderer.render(scene, camera);
}

// resetView() - sets up the camera and canvas to suit current window parameters
function resetView()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event)
{
    var vx = event.clientX;
    var vy = event.clientY;
    var vz = 1.0;

    var xDelta = vx - g_prevMouseX;
    var yDelta = vy - g_prevMouseY;

    var translating = false;
    var dragging = false;
    var rolling = false;

    if(event.buttons != 0)
    {
        dragging = true;
    }

    if(event.ctrlKey || (event.buttons & 2))
    {
        translating = true;
    }

    if(event.buttons & 4)
    {
        rolling = true;
    }

    if(dragging)
    {
        if(translating)
        {
            // var scaleX = 7.0;
            // var scaleY = 7.0;
            // set a scale based on the object size and the window size
            var scaleX = 3.0 * (g_boundsSize / g_width);
            var scaleY = 3.0 * (g_boundsSize / g_height);

            // adjust the scale based on the distance between the camera and the object            
            var c = camera.position.clone();
            c.negate();
            var distanceToOrigin = c.length();

            // a little clumsy but log of camera distance to origin is a decent relationship for now..
            scaleX *= (0.3 * Math.log(distanceToOrigin));
            scaleY *= (0.3 * Math.log(distanceToOrigin));

            // generate a vector from mouse movement
            var translateLocal = new THREE.Vector3(xDelta * scaleX, -yDelta * scaleY, 0.0);
            //console.log("Translate camera: " + translateLocal.x + ", " + translateLocal.y + ", " + translateLocal.z);
            // var transX = xDelta;
            // var transY = yDelta;

            // remember the length of the mouse movement vector because transformDirection() will normalise it
            var translateLength = translateLocal.length();

            // rotate the vector to be relative to the camera's direction, then restore the vector's length
            translateLocal.transformDirection(camera.matrixWorld);
            translateLocal.multiplyScalar(translateLength);
            //translateLocal *= (camera.getWorldDirection());
            //translateLocal.multiplyVectors(camera.getWorldDirection(), translateLocal);

            // translate the object
            // g_allObjectsGroup.position.x += (translateLocal.x);
            // g_allObjectsGroup.position.y += (translateLocal.y);
            // g_allObjectsGroup.position.z += (translateLocal.z);

            // translate the camera by subtracting the translation that was meant for the object
            camera.position.x -= translateLocal.x;
            camera.position.y -= translateLocal.y;
            camera.position.z -= translateLocal.z;

            // update the camera's attached light
            updateLights();

            //console.log("Translate camera: " + translateLocal.x + ", " + translateLocal.y + ", " + translateLocal.z);

            //var c = new THREE.Vector3(0, 0, 0);
            //camera.lookAt(c);
        }
        else if(!rolling)
        {
            var scaleX = 2.0;
            var scaleY = 2.0;
            
            // desired rotation offset
            var camRotY = (-xDelta / g_width) * scaleX;
            var camRotX = (-yDelta / g_height) * scaleY;
            
            var rotateOffset = new THREE.Matrix4();

            var rotateX = new THREE.Matrix4();
            var rotateY = new THREE.Matrix4();
            
            // get camera's world matrix
            var camMat = new THREE.Matrix4;
            camMat.extractRotation(camera.matrixWorld);

            // calculate camera's up and right vectors
            var camUp = new THREE.Vector3(0, 1, 0);
            var camRight = new THREE.Vector3(1, 0, 0);
            camUp.applyMatrix4(camMat);
            camRight.applyMatrix4(camMat);

            // generate rotation matrices for local X and Y
            rotateX.makeRotationAxis(camUp, camRotY);
            rotateY.makeRotationAxis(camRight, camRotX);

            // apply rotation Y then X
            rotateOffset.multiplyMatrices(rotateY, rotateOffset);
            rotateOffset.multiplyMatrices(rotateX, rotateOffset);

            // apply the final rotation to the camera's world matrix            
            camera.applyMatrix(rotateOffset);

            // update after these changes
            camera.updateMatrixWorld();
            updateLights();
        }
        else
        {
            var scaleX = 4.0;
            
            // console.log("Rolling..");

            // desired rotation offset
            var camRotZ = (-xDelta / g_width) * scaleX;
            
            var rotateOffset = new THREE.Matrix4();

            var rotateZ = new THREE.Matrix4();
            
            // get camera's world matrix
            var camMat = new THREE.Matrix4;
            camMat.extractRotation(camera.matrixWorld);

            // calculate camera's direction vector
            var camDir = new THREE.Vector3(0, 0, 1);
            camDir.applyMatrix4(camMat);

            // generate rotation matrix for local Z
            rotateZ.makeRotationAxis(camDir, camRotZ);

            // apply rotation Z
            rotateOffset.multiplyMatrices(rotateZ, rotateOffset);

            // apply the final rotation to the camera's world matrix            
            camera.applyMatrix(rotateOffset);

            // update after these changes
            camera.updateMatrixWorld();

            updateLights();
        }
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
    // step the same amount regardless of how far the browser reported the wheel moved
    var delta = 55 * Math.sign(event.deltaY);

    // NEW ZOOM ROUTINE
    //var wheelLength = -event.deltaY;
    var wheelLength = -delta;

    var c = camera.position.clone();
    c.negate();
    //g_camDistance = camera.position.distanceTo(c);
    //var directionTo
    var distanceToOrigin = c.length();
    
    // work out direction to origin
    var directionToOrigin = c.clone();
    directionToOrigin.normalize();

    directionToOrigin = camera.getWorldDirection();

    // work out how far to move
    var targetOffset = directionToOrigin.clone();
    targetOffset.multiplyScalar(wheelLength * (g_boundsSize * .001));

    // if zooming in would go through the origin, then cancel (but always allow zooming out)
    if(wheelLength > 0.0 && targetOffset.length() >= distanceToOrigin)
    {
        return;
    }

    camera.position.add(targetOffset);
    camera.updateMatrixWorld();

    updateLights();
}

function placeCamera(rotX, rotY, rotZ, dist, up)
{
    // g_camDistance += (event.deltaY * .1);
    
    // rotX = g_camRotX;// % (Math.PI * 2.0);
    // rotY = g_camRotY;// % (Math.PI * 2.0);
        
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

function updateAxisLines(scale)
{
    console.log("Scaling axis lines to " + scale);

    //var mat = new THREE.Matrix4();
    //mat.makeScale(scale, scale, scale);

    //g_axisLines.matrix = mat;
    g_axisLines.scale.set(scale, scale, scale);
    g_axisLines.updateMatrixWorld();
}

function onDocumentResize()
{
    resetView();
}

function onDocumentContextMenu(event)
{
    // stop context menu from appearing when user right-clicks to translate the camera
    event.preventDefault();
    return false;
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

    // reset the object's transform
    g_allObjectsGroup.position.x = 0.0;
    g_allObjectsGroup.position.y = 0.0;
    g_allObjectsGroup.position.z = 0.0;
};

// saveScene() - save all view parameters to JSON and export a LavaVu init script to match view settings
function saveScene()
{
    console.log("Saving mesh parameters to JSON..");
    
    for(var i=0; i < jsonObj.length; i++) {
        var group = g_properties.findGroup(jsonObj[i].name);
        jsonObj[i].alpha = group.alpha;
        jsonObj[i].colour = group.colour;
        jsonObj[i].visible = group.visible;
    }
    
    socket.emit('savemeshjson', {tag: g_tag, jsonStr: JSON.stringify(jsonObj, null, 4)});
};


socket.on('savemeshjson', function(data) {
    if(data.status == "error") {
        console.log("Can't save view parameters for examples - aborting!");
        var title = document.getElementById("viewertitle");
        if(title != null) {
            title.innerHTML = "Can't save examples!";
        }
        
        setTimeout(resetTitle, 4000);
    }
    else {
        var title = document.getElementById("viewertitle");
        if(title != null) {
            title.innerHTML = "Saved settings successfully!";
        }
        setTimeout(resetTitle, 4000);
    }
});


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
    // load the json file, as a test..
    var xmlreq = new XMLHttpRequest();
    xmlreq.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            jsonObj = JSON.parse(this.responseText);
            // sort by group name
            jsonObj.sort(function(a, b) {
               if(a.name > b.name) return 1;
               if(a.name < b.name) return -1;
               return 0;
            });
            console.log(jsonObj);
            console.log("Length: " + jsonObj.length);

            for(var i = 0; i < jsonObj.length; i++) {
                var group = g_properties.findGroup(jsonObj[i].name);
                group.alpha = jsonObj[i].alpha;
                group.colour = jsonObj[i].colour;
                group.visible = jsonObj[i].visible;
            }
            
            g_properties.refresh();
            refreshGUI(g_gui);
        }
    }
    xmlreq.open("GET", "data/tags/" + g_tag + "/mesh_result/mesh.json");   // 20170411 - server provdes full filename now, don't need to add .json
    xmlreq.send();
};