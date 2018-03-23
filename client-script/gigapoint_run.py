import gigapoint
from math import *
from euclid import *
from omega import *
from cyclops import *
from omegaToolkit import *
import json

config_filename = "gigapoint.json"

# pointcloud
gp = gigapoint.initialize()
gp.initPotree(config_filename)

#control
with open(config_filename) as json_file:    
    config = json.load(json_file)

cam = getDefaultCamera()
cam.setTrackingEnabled(True)

# menu
def updateMaterial(material):
	print material
	b11.getButton().setChecked(False)
	b12.getButton().setChecked(False)
	if material == "rgb":
		b11.getButton().setChecked(True)
	else:
		b12.getButton().setChecked(True)
	gp.updateMaterial(material)

def updateQuality(quality):
	print quality
	b21.getButton().setChecked(False)
	b22.getButton().setChecked(False)
	b23.getButton().setChecked(False)
	if quality == "square":
		b21.getButton().setChecked(True)
	elif quality == "circle":
		b22.getButton().setChecked(True)
	else:
		b23.getButton().setChecked(True)
	gp.updateQuality(quality)

def updateSizeType(type):
	print type
	b31.getButton().setChecked(False)
	b32.getButton().setChecked(False)
	if type == "fixed":
		b31.getButton().setChecked(True)
	else:
		b32.getButton().setChecked(True)
	gp.updateSizeType(type)

def updatePointScale(value):
	global pscale_min
	global pscale_max
	val = ((float(value) / 100) * (pscale_max - pscale_min) + pscale_min) / 100
	lscale.setText('Point scale: ' + str(val))
	gp.updatePointScale(val)

def updateFilter(filter):
	print filter
	b41.getButton().setChecked(False)
	b42.getButton().setChecked(False)
	if filter == "none":
		b41.getButton().setChecked(True)
	else:
		b42.getButton().setChecked(True)
	gp.updateFilter(filter)

def updateEdl(strength, radius):
	val = strength/100.0
	print str(val) + ' ' + str(radius)
	ledl_strength.setText('edl strength: ' + str(val))
	gp.updateEdl(val, radius)

def printInfo():
        global cam
        print 'Camera position: ' + str(cam.getPosition())
        print 'Camera orientation: ' + str(cam.getOrientation())
        gp.printInfo()

def updateElevationDirection(direction):
	print direction
	bEle11.getButton().setChecked(False)
	bEle12.getButton().setChecked(False)
	bEle13.getButton().setChecked(False)

	if direction == 0:
		bEle11.getButton().setChecked(True)
	elif direction == 1:
		bEle12.getButton().setChecked(True)
	else:
		bEle13.getButton().setChecked(True)
	gp.updateElevationDirection(direction)

def updateElevationMin(val):
	v = val/100.0
	lEleMin.setText('Min: ' + str(v))
	gp.updateElevationMin(v)

def updateElevationMax(val):
	v = val/100.0
	lEleMax.setText('Max: ' + str(v))
	gp.updateElevationMax(v)


mm = MenuManager.createAndInitialize()
menu = mm.getMainMenu()
mm.setMainMenu(menu)
campos = [0, 0, 0]
camori = [1, 0, 0, 0]
camtarget = [0, 0, -2]
camup = [0, 0, 1]
if "cameraPosition" in config:
	campos = config["cameraPosition"]
if "cameraOrientation" in config:
	camori = config["cameraOrientation"]
if "cameraTarget" in config:
	camtarget = config["cameraTarget"]
if "cameraUp" in config:
	camup = config["cameraUp"]
	
cmd = '';
if config["version"] == 1:
	cmd = 'cam.setPosition(Vector3(' + str(campos[0]) + ',' + str(campos[1]) + ',' + str(campos[2]) + ')),' + \
		'cam.setOrientation(Quaternion(' + str(camori[0]) + ',' + str(camori[1]) + ',' + str(camori[2]) + ',' + str(camori[3]) + '))'
else:
	cmd = 'cam.setPosition(Vector3(' + str(campos[0]) + ',' + str(campos[1]) + ',' + str(campos[2]) + ')),' + \
		'cam.lookAt(Vector3(' + str(camtarget[0]) + ',' + str(camtarget[1]) + ',' + str(camtarget[2]) + '), Vector3(' + \
		str(camup[0]) + ',' + str(camup[1]) + ',' + str(camup[2]) + '))'
print cmd
menu.addButton("Go to camera 1", cmd)

lscale = menu.addLabel("Point scale")
#l3.getWidget().setStyleValue('border-top', '1 white')
pscale = config["pointScale"]
pscale_value = 10
pscale_min = 1
pscale_max = 100
if "pointScale" in config:
	pscale_value = int(100*float(pscale[0]))
	pscale_min = int(100*float(pscale[1]))
	pscale_max = int(100*float(pscale[2]))
val = int( float(pscale_value - pscale_min) / (pscale_max-pscale_min) * 100 )
pointscale = menu.addSlider(100, "updatePointScale(%value%)")
pointscale.getSlider().setValue(val)
pointscale.getWidget().setWidth(200)
updatePointScale(val)

l1 = menu.addLabel("Material")
#l1.getWidget().setStyleValue('border-top', '1 white')
b11 = menu.addButton("rgb", "updateMaterial('rgb')")
b12 = menu.addButton("elevation", "updateMaterial('elevation')")
b11.getButton().setCheckable(True)
b12.getButton().setCheckable(True)
if "material" in config:
	updateMaterial(str(config["material"]))
else:
	updateMaterial("rgb")

# elevation setttings
eleMenu = menu.addSubMenu("Elevation options")
lEle1 = eleMenu.addLabel("Direction")
bEle11 = eleMenu.addButton("X", "updateElevationDirection(0)")
bEle12 = eleMenu.addButton("Y", "updateElevationDirection(1)")
bEle13 = eleMenu.addButton("Z", "updateElevationDirection(2)")
bEle11.getButton().setCheckable(True)
bEle12.getButton().setCheckable(True)
bEle13.getButton().setCheckable(True)
if "elevationDirection" in config:
	updateElevationDirection(config["elevationDirection"])
else:
	updateElevationDirection(2)

# range
elevMin = 0
elevMax = 100
if "elevationRange" in config:
	elevMin = int(100*float(config["elevationRange"][0]))
	elevMax = int(100*float(config["elevationRange"][1]))

lEleMin = eleMenu.addLabel("Min: " + str(elevMin/100.0))
sliderElevMin = eleMenu.addSlider(100, "updateElevationMin(%value%)")
sliderElevMin.getSlider().setValue(elevMin)
sliderElevMin.getWidget().setWidth(200)
updateElevationMin(elevMin)

lEleMax = eleMenu.addLabel("Max: " + str(elevMax/100.0))
sliderElevMax = eleMenu.addSlider(100, "updateElevationMax(%value%)")
sliderElevMax.getSlider().setValue(elevMax)
sliderElevMax.getWidget().setWidth(200)
updateElevationMax(elevMax)
# end elevation setttings


l2 = menu.addLabel("Quality")
#l2.getWidget().setStyleValue('border-top', '1 white')
b21 = menu.addButton("square", "updateQuality('square')")
b22 = menu.addButton("circle", "updateQuality('circle')")
b23 = menu.addButton("sphere", "updateQuality('sphere')")
b21.getButton().setCheckable(True)
b22.getButton().setCheckable(True)
b23.getButton().setCheckable(True)
if "quality" in config:
	updateQuality(str(config["quality"]))
else:
	updateQuality("square");

l3 = menu.addLabel("Size type")
#l2.getWidget().setStyleValue('border-top', '1 white')
b31 = menu.addButton("fixed", "updateSizeType('fixed')")
b32 = menu.addButton("adaptive", "updateSizeType('adaptive')")
b31.getButton().setCheckable(True)
b32.getButton().setCheckable(True)
if "sizeType" in config:
	updateSizeType(str(config["sizeType"]))
else:
	updateSizeType("adaptive");

l4 = menu.addLabel("Filter")
#l2.getWidget().setStyleValue('border-top', '1 white')
b41 = menu.addButton("none", "updateFilter('none')")
b42 = menu.addButton("edl", "updateFilter('edl')")
b41.getButton().setCheckable(True)
b42.getButton().setCheckable(True)
if "filter" in config and config["filter"] == "edl":
	updateFilter("edl")
else:
	updateFilter("none")

ledl_strength = menu.addLabel("edl strength")
#l3.getWidget().setStyleValue('border-top', '1 white')
pstrength = 1.0
radius = 1.4
if "filterEdl" in config:
	pstrength = config["filterEdl"][0]
	radius = config["filterEdl"][1]
pointscale = menu.addSlider(300, "updateEdl(%value%, radius)")
pointscale.getSlider().setValue(int(pstrength*100))
pointscale.getWidget().setWidth(200)
updateEdl(int(pstrength*100), int(radius))

menu.addButton("Print info", "printInfo()")


