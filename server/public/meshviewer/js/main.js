'use strict';

var app = new PrevisMeshRenderer( document.getElementById( 'meshviewer' ) );

var resizeWindow = function () {
	app.resizeDisplayGL();
};

var render = function () {
	requestAnimationFrame( render );
	app.render();
};

var centreObjects = function () {
	app.centreObjects();
}

var resetTranslate = function() {
	app.resetTranslate();
}

var resetMessage = function() {
	showMessage('');
}

socket.on('savemeshjson', function(data) {
    console.log('savemeshjson');
    console.log(data);
    if(data.status == "error") {
        showMessage('Can not save view parameters for examples - aborting!');
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
	showMessage('Saving settings...', true);
	var json = Object.assign({}, app.json);
	const camSettings = {
      near: app.camera.near,
      far: app.camera.far,
      matrix: app.camera.matrix.toArray(),
      up: app.camera.up.toArray()
    };
    json.views.camera = camSettings;
    socket.emit('savemeshjson', {tag: gTag, jsonStr: JSON.stringify(json, null, 4)});	
}

var reloadSettings = function() {
	showMessage("Reloading settings from server!");
	app.loadJsonConfig(function () {
		buildGui();
		app.updateAll();
		
		showMessage("Reloaded settings successfully!");
        setTimeout(resetMessage, 4000);
	});
}

var buildGui = function() {
	
	const json = app.json;
	console.log('buildGui', json);

	// init data
	var obj = {
		saveSettings: saveSettings,
		reloadSettings: reloadSettings,
		views: {
			background: json.views.backgroundColour,
			centreObjects: centreObjects,
			resetTranslate: resetTranslate,
			showAxis: json.views.showAxis
		},
    	objects: json.objects
	};
	
	// build gui
	if(gGui) gGui.destroy();
	gGui = new dat.GUI();
	var gui = gGui;
	
	gui.add(obj, 'saveSettings').name('Save settings');
	gui.add(obj, 'reloadSettings').name('Reload settings');
	
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
		
    }
};

window.addEventListener( 'resize', resizeWindow, false );

console.log( 'Starting initialisation phase...' );
app.initGL();
app.resizeDisplayGL();
app.initContent( function() {
	buildGui();
});

// kick off main loop
render();
