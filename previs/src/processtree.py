import argparse
import io
import os
import json
import string
import subprocess
import tempfile
import zipfile

print "-- global-level message --"
zname = ""#"HeartBundle.zip"
# all groups with all obj files
allGroups = []
# all groups, but with a single, combined obj file for each group
allGroupsMerged = []

def findObjInDir(files, dirname):
    for filename in files:
        #if(string.find(string.lower(filename), ".obj") != -1):
        if(string.lower(filename).endswith(".obj")):
            return True
    return False

def addObjsToGroup(group, files):
    for filename in files:
        #if(string.find(string.lower(filename), ".obj") != -1):
        if(string.lower(filename).endswith(".obj")):
            group.append(unicode(filename, "utf-8"))

def addObjs(meshGroup, pathName):
    currentDir = os.getcwd()
    files = os.walk(pathName)

    print currentDir

    for dircontents in files:
        dirname = os.path.split(dircontents[0])[1]
        # if there are any .obj files in the directory, go back to it
        #  and add them all to a new group
        if findObjInDir(dircontents[2], dirname):
            meshGroup.append(dircontents)
            newgrp = []
            addObjsToGroup(newgrp, dircontents[2])
            allGroups.append((unicode(dirname, "utf-8"), newgrp))

    # for filename in files:
    #     if len(filename[2]) > 0:
    #         grp.append(filename)
    #         print filename[0]

parser = argparse.ArgumentParser(description='Extracts a tree of meshes from a zipfile for viewing in mesh previs')
parser.add_argument('-f', dest='filename', help='name of zipfile to process')
parser.add_argument('-o', dest='outpath', help='location to store output tree')
parser.add_argument('-n', dest='outname', help='name of output folder, if none specified, a random one will be created')
parser.add_argument('-t', dest='tag', help='tag name to use for output')

args = parser.parse_args()
zname = args.filename

# create a temporary directory to work in
#if args.tag:
rootLocation = '.'

if args.outpath:
    rootLocation = args.outpath

if args.outname:
    os.mkdir(rootLocation + '/' + args.outname)
    tempDir = os.path.abspath(rootLocation + '/' + args.outname)
else:    
    tempDir = tempfile.mkdtemp(dir=rootLocation)

print tempDir

# open the zipfile
zfile = zipfile.ZipFile(zname, 'r')
zinfolist = zfile.infolist()

print "Extracting:"

for cmpinfo in zinfolist:
    #if(string.find(string.lower(cmpinfo.filename), ".obj") != -1):
    #if(string.lower(cmpinfo.filename).endswith(".obj")):
    if(string.lower(cmpinfo.filename).endswith((".obj", ".mtl"))):
        print cmpinfo.filename
        zfile.extract(cmpinfo, tempDir)
    else:
        print "Skipping " + cmpinfo.filename + ".."

#zfile.extractall(tempDir)

grp = []

addObjs(grp, tempDir)

# report all files in all groups, and build the MeshLab launch command

for onegroup in allGroups:
    #inFilenames = ""
    #inFilenames = []
    launchCmdML = ["meshlabserver"]
    newgrp = [] # new group to hold the combined obj file
    
    print "Group " + onegroup[0]
    print "================================================================================"
    for filename in onegroup[1]:
        print filename
        #inFilenames = inFilenames + "-i " + tempDir + "/" + filename + " "
        #launchCmdML.append("-i " + tempDir + "/" + onegroup[0] + "/" + filename)
        launchCmdML.append("-i")
        launchCmdML.append(tempDir + "/" + onegroup[0] + "/" + filename)
    
    #launchCmdML = inFilenames + " -o " + tempDir + "/" + onegroup[0] + ".obj" + " -s flatten_preserve_duplicate_vertices.mlx"
    #launchCmdML.append("-o " + onegroup[0] + ".obj")
    launchCmdML.append("-o")
    launchCmdML.append(tempDir + "/" + onegroup[0] + "/" + onegroup[0] + ".obj")
    launchCmdML.append("-s")
    launchCmdML.append("flatten_preserve_duplicate_vertices.mlx")

    newgrp.append(onegroup[0] + ".obj")
    allGroupsMerged.append((onegroup[0], newgrp))

    print launchCmdML
    #subprocess.call("launchml", launchCmdML)
    subprocess.call(launchCmdML)

#print inFilenames

# save to JSON
#jsonName = os.path.split(tempDir)[1]
#out = io.open(jsonName + ".json", 'w')
jsonName = tempDir + "/meshgroups.json"
out = io.open(jsonName, 'w')

#json.dump(allGroups, out)

# save the whole group structure (with individual obj files)
#v = json.dumps(allGroups)

# save the simpler group structure (with one single, merged obj file per group)
v = json.dumps(allGroupsMerged)

out.write(unicode(v, "utf-8"))

# cleanup
# - delete all source files, so only combined OBJ files remain
print "Cleaning up source OBJ files.."

for cmpinfo in zinfolist:
    if string.lower(cmpinfo.filename).endswith((".obj", ".mtl")):
        targetfile = tempDir + "/" + cmpinfo.filename
        print "Removing " + targetfile + ".."
        os.unlink(targetfile)
    else:
        print "Skipping " + cmpinfo.filename + ".."

zfile.close()

# - create a new zip file that contains only the combined OBJ files
print "All groups:"
print allGroupsMerged
print "=================================================================================="
mergedzip = zipfile.ZipFile(os.path.splitext(zname)[0] + "_processed.zip", 'w')

for grp in allGroupsMerged:
    for obj in grp[1]:
        objfilename = "".join(obj)
        print "objfilename: " + objfilename
        print "Writing " + tempDir + "/" + grp[0] + "/" + "".join(obj) + " as " + grp[0] + "/" + "".join(obj)
        mergedzip.write(tempDir + "/" + grp[0] + "/" + "".join(obj), grp[0] + "/" + "".join(obj), zipfile.ZIP_DEFLATED)
