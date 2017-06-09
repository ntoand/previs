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
    # launchCmdML.append("flatten_preserve_duplicate_vertices_recentre.mlx")

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

# save the structure as a LavaVu init script
f = open(tempDir + "/init.script", "wt")
f.write("#verbose\n")
f.write("trisplit=1\n")
f.write("#swapyz=1\n")
f.write('\n')
grpid = 1

for onegroup in allGroups:
    f.write('file "' + onegroup[0] + '/' + onegroup[0] + '.obj"\n')
    f.write('select ' + str(grpid) + '\n')
    grpid += 1
    f.write('colour [1,1,1,1.0] append\n')
    f.write('\n')
    f.write('select\n')

# write group names
grpid = 1

for onegroup in allGroups:
    f.write('name ' + str(grpid) + ' "' + onegroup[0] + '"\n')
    grpid += 1

f.write('\n')

for i in range(1, grpid):
    f.write('select ' + str(i) + '\n')
    f.write('opacity=1\n')

f.write('\n')
# write options
f.write('open\n')
f.write('#translation 0 0 -120\n')
f.write('#rotation 0 1 0 0\n')
f.write('\n')
f.write('border off\n')
f.write('axis off\n')
f.write('nearclip 0.2\n')
f.write('eyeseparation 0.12\n')

    #for groups with multiple 
    #for mesh in onegroup[1:]:
    #f.write('file "' + onegroup[0] + '/' + mesh[0] + '.obj"\n')

# with open(dataset_dir + "/init.script", "wt") as f:
#     f.write("file " + dataset_xrw_filename + "\n")
#     f.write("file " + dataset_json_filename)

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
