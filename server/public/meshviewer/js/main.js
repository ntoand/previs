'use strict';

var app = new PrevisMeshRenderer( document.getElementById( 'meshviewer' ) );

var resizeWindow = function () {
	app.resizeDisplayGL();
};

var render = function () {
	requestAnimationFrame( render );
	app.render();

	if(app.loaded && gHasThumbnail === false) {
		gHasThumbnail = true;
		saveThumbnail();
	}
};

var centreObjects = function () {
	app.centreObjects();
}

var resetTranslate = function() {
	app.resetTranslate();
}

var resetRenderOrder = function() {
	app.resetRenderOrder();
	buildGui();
}

var resetMessage = function() {
	showMessage('');
}

socket.on('savemeshjson', function(data) {
    console.log('savemeshjson');
    console.log(data);
    if(data.status == "error") {
        showMessage('Can not save view parameters!');
        setTimeout(resetMessage, 4000);
    }
    else {
    	showMessage("Saved settings successfully!");
        setTimeout(resetMessage, 4000);
    }
});

var saveSettings = function() {
	if(gTag === null || gTag === undefined) {
		return;
	}
	if(gTag.includes('000000_')) {
		showMessage('Sorry, cannot save an example!');
		setTimeout(resetMessage, 4000);
		return;
	}
	showMessage('Saving settings...', true);
	var json = Object.assign({}, app.json);
	const camSettings = {
      near: app.camera.near,
      far: app.camera.far,
      matrix: app.camera.matrix.toArray(),
      up: app.camera.up.toArray()
    };
    json.views.camera = camSettings;
    socket.emit('savemeshjson', {tag: gTag, dir: gDir, preset: gPreset, jsonStr: JSON.stringify(json, null, 4)});	
}

function saveSettingsAs() {
    let d = new Date();
    let tstr = d.getYear() + '' + d.getMonth() + '' + d.getDay() + '-' + d.getHours() + '' + d.getMinutes();
    var preset = prompt("Save current settings as", tstr);
    if (preset === null) return;
    if (preset === '') {
    	showMessage('Error! Cannot save empty preset!');
    	setTimeout(resetMessage, 3000);
    	return;
    }
    preset = preset.replace(/ /g,"_");
    
    gPreset = preset;
    saveSettings();
    socket.emit('getsavelist', { type: 'mesh', tag:  gTag, dir: gDir});
}

var loadSettings = function() {
	showMessage("Load settings from server!");
	app.loadJsonConfig(gPreset, function () {
		buildGui();
		app.updateAll();
		
		showMessage("Settings have been loaded successfully!");
        setTimeout(resetMessage, 4000);
	});
}

var saveThumbnail = function() {
	showMessage("Save current display as tag thumbnail");
	resizedImg = app.generateThumbnail(function(resizedImg) {
		socket.emit('savethumbnail', {type: 'mesh', tag:  gTag, dir: gDir, base64: resizedImg});
	});
}

var buildGui = function() {
	
	const json = app.json;
	console.log('buildGui', json);

	// init data
	var obj = {
		Preset: gPreset,
		saveSettings: saveSettings,
		saveSettingsAs: saveSettingsAs,
		saveThumbnail: saveThumbnail,
		cameraControl: cameraControlList[0],
		views: {
			background: json.views.backgroundColour,
			centreObjects: centreObjects,
			resetTranslate: resetTranslate,
			showAxis: json.views.showAxis,
			resetRenderOrder: resetRenderOrder
		},
    	objects: json.objects
	};
	
	// build gui
	if(gGui) gGui.destroy();
	gGui = new dat.GUI();
	var gui = gGui;
	
	// Control
	hPreset = gui.add(obj, 'Preset', presetList).name('Preset').listen();
    hPreset.onFinishChange(function(value) {
      gPreset = value;
      loadSettings();
	});
	
	if(!gTag.includes('000000')) {
		gui.add(obj, 'saveSettings').name('Save');
		gui.add(obj, 'saveSettingsAs').name('Save as');
		gui.add(obj, 'saveThumbnail').name('Save thumbnail');
	}

	var cameraControl = gui.add(obj, 'cameraControl', cameraControlList).name('Camera control').listen();
	cameraControl.onFinishChange(function(value) {
		app.switchCameraControl(value);
	});
	
	var views = gui.addFolder("Views");
	console.log(obj.views);
    var hBackground = views.addColor(obj.views, 'background').name('Background');
	hBackground.onChange(function(value) {
		//console.log('hBackground', value);
		json.views.backgroundColour = value;
		app.updateBackground();
	});
	
	var hAxis = views.add(obj.views, 'showAxis').name('Show axes');
	hAxis.onChange(function(value) {
		//console.log('hBackground', value);
		json.views.showAxis = value;
		app.updateAxis();
	});
	
	views.add(obj.views, 'centreObjects').name('Centre objects');
	views.add(obj.views, 'resetTranslate').name('Reset translate');
	views.add(obj.views, 'resetRenderOrder').name('Reset ren order');
	
	var groups = gui.addFolder("Mesh groups");
    groups.open();
    for(var i=0; i < obj.objects.length; i++) {

    	var groupItem = groups.addFolder(obj.objects[i].name + ' (' + obj.objects[i].objects.length + ')');
    	//groupItem.open();
    	
    	var hAlpha = groupItem.add(obj.objects[i], 'alpha').min(0).max(1).step(0.05);
		hAlpha.index = i;
		hAlpha.onChange(function(value) {
			//console.log('hAlpha', this.index, value);
			obj.objects[this.index].alpha = value;
			app.updateScene();
		});
		
		var hascolour = false;
		for(var j=0; j < obj.objects[i].objects.length; j++) {
			if(obj.objects[i].objects[j].hasmtl === false) {
				hascolour = true;
				break;
			}
		}
		if(hascolour) {
			console.log(obj.objects[i]);
			var hColour = groupItem.addColor(obj.objects[i], 'colour');
			hColour.index = i;
			hColour.onChange(function(value) {
				console.log('hColour', this.index, value);
				obj.objects[this.index].colour = value;
				app.updateScene();
			});
		}
		
    	var hVisible = groupItem.add(obj.objects[i], 'visible');
		hVisible.index = i;
		hVisible.onChange(function(value) {
			//console.log('hVisible', this.index, value);
			obj.objects[this.index].visible = value;
			app.updateScene();
		});

		var hRenderOrder = groupItem.add(obj.objects[i], 'renderOrder');
		hRenderOrder.index = i;
		hRenderOrder.onChange(function(value) {
			//console.log('hRenderOrder', this.index, value);
			const v = Math.round(value);
			obj.objects[this.index].renderOrder = v < 0 ? 0 : v;
			app.updateScene();
		});
		
    }
};

window.addEventListener( 'resize', resizeWindow, false );

socket.on('getsavelist', function(data) {
    if(data.status === 'error') {
    	showMessage("Error! Cannot get save list");
    	setTimeout(resetMessage, 3000);
    }
    else if(data.status == "done") {
    	presetList = data.result;
    	updateDatDropdown(hPreset, presetList);
    }
});

socket.on('savethumbnail', function(data) {
	if(data.status === 'error') {
		showMessage("Error! Cannot save thumbnail");
	}
	else {
		showMessage("Success: thumbnail saved");
	}
	setTimeout(resetMessage, 3000);
});

checkAndLoadPrevisTag(gTag, "", function(info) {
	console.log("success: now can load data", info);
	console.log( 'Starting initialisation phase...' );
	gDir = info.dir || gTag;
	gHasThumbnail = info.hasThumbnail ? info.hasThumbnail : false;
	app.initGL();
	app.resizeDisplayGL();
	app.initContent( gPreset, function() {
		buildGui();
		socket.emit('getsavelist', { type: 'mesh', tag:  gTag, dir: gDir});
	});
	// kick off main loop
	render();
});
