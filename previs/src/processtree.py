import argparse
import io
import os
import json
import string
import subprocess
import sys
import tempfile
import time
import zipfile

print "-- global-level message --"
zname = ""#"HeartBundle.zip"
# all groups with all obj files
allGroups = []
# all groups, but with a single, combined obj file for each group
allGroupsMerged = []
# all files associated with materials that need to be extracted in the second pass
allMaterialFiles = []
# all files to be packed into the target zip file
allOutputFiles = []

def findObjInDir(files):
    for filename in files:
        #if(string.find(string.lower(filename), ".obj") != -1):
        if(string.lower(filename).endswith(".obj")):
            return True
    return False

def addObjsToGroup(group, files, dirname):
    for filename in files:
        #if(string.find(string.lower(filename), ".obj") != -1):
        if(string.lower(filename).endswith(".obj")):
            # meshdesc includes a mesh name and its material library references
            #meshdesc = []

            # first check for material references
            # mtllibs: all .mtl library filenames encountered so far
            # mtlfiles: list of all mtl files referenced in the current .obj file
            # mtl: .
            mtllibs = []

            objfilename = dirname + "/" + filename
            #objfile = open(tempDir + "/" + dirname + "/" + filename)
            objfile = open(tempDir + "/" + objfilename)
            #allOutputFiles.append(objfilename)   # add meshes to output files

            for fileline in objfile:
                #if string.find(fileline, "mtllib") != -1:
                if "mtllib" in fileline:
                    # find anything that ends in .mtl, and filter out empty strings, whitespace and newlines
                    mtlfiles = filter(len, string.join(fileline.strip().split("mtllib ")[1:]).split(".mtl"))
                    #print "Material file(s) found for objfile " + filename + ": " + fileline
                    print "mtllib line: " + fileline
                    print "Material file(s) referenced for objfile " + filename + ": [" + str(len(mtlfiles)) + "]"
                    for mtlname in mtlfiles:
                        libname = mtlname.strip() + ".mtl"
                        mtllibs.append(unicode(libname, "utf-8"))
                        print "(" + libname + ")"

                        # now go through the material file and find texture references
                        matfilename = dirname + "/" + libname
                        #matfile = open(tempDir + "/" + dirname + "/" + libname, 'r')
                        try:
                            matfile = open(tempDir + "/" + matfilename, 'r')
                            allOutputFiles.append(matfilename)

                            for l in matfile:
                                if any(keyword in l for keyword in
                                    ("map_Ka", "map_Kd", "map_Ks", "map_Ns", "map_bump")):
                                    mapfiles = l.split()
                                    allMaterialFiles.append(mapfiles[-1])
                                    allOutputFiles.append(dirname + "/" + mapfiles[-1])
                        except IOError:
                            print "Material file " + matfilename + " not found, excluding.."

            # add the group
            #meshdesc.append(unicode(filename, "utf-8"))
            #meshdesc.append(mtllibs)
            print "Materials for this mesh: " + str(mtllibs)
            group.append((unicode(filename, "utf-8"), mtllibs))
            #group.append(mtllibs)
            #group.append(unicode(filename, "utf-8"))

def addObjs(meshGroup, pathName):
    currentDir = os.getcwd()
    files = os.walk(pathName)

    print currentDir

    for dircontents in files:
        dirname = os.path.split(dircontents[0])[1]
        # if there are any .obj files in the directory, go back to it
        #  and add them all to a new group
        if findObjInDir(dircontents[2]):
            meshGroup.append(dircontents)
            newgrp = []
            addObjsToGroup(newgrp, dircontents[2], dirname)
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
print "Build Meshlab command.."
print "All groups:"
print allGroups

for onegroup in allGroups:
    #inFilenames = ""
    #inFilenames = []
    launchCmdML = ["meshlabserver"]
    newgrp = [] # new group to hold the combined obj file
    grpmeshes = [] # a list of this group's mesh files and associated material files
    
    print "Group " + onegroup[0]
    print "================================================================================"
    print str(onegroup)
    print "================================================================================"
    #for filename in onegroup[1]:
    for filedesc in onegroup[1]:
        filename = filedesc[0]
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

    groupMaterialFile = ""

    #print str(onegroup[1]) + " Length: " + str(len(onegroup[1]))
    if len(allMaterialFiles) > 0:
        print "Mesh has materials"
        groupMaterialFile = onegroup[0] + ".mtl"
        launchCmdML.append("-m vc vf vn vt fc ff fq fn")    # make sure materials are generated in the output

    # pre-materials support
    #newgrp.append((onegroup[0] + ".obj", onegroup[1]))
    # materials support
    newgrp.append((onegroup[0] + ".obj", groupMaterialFile))
    # print "Adding group " + onegroup[0] + " to merged groups list"
    # print str(newgrp)
    allGroupsMerged.append((onegroup[0], newgrp))
    # add the output file
    #allOutputFiles.append(tempDir + "/" + onegroup[0] + "/" + onegroup[0] + ".obj")
    allOutputFiles.append(onegroup[0] + "/" + onegroup[0] + ".obj")

    print launchCmdML
    sys.stdout.flush()  # might be needed so that all text output is flushed before meshlab starts printing its own debug text
    #subprocess.call("launchml", launchCmdML)
    subprocess.call(launchCmdML)

# wait at least 5 seconds in case meshlab finished early
# TODO: a better way to do this
time.sleep(5)

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

# second extraction pass - get all material files
print "Referenced textures:"
for f in allMaterialFiles:
    print f + "(" + str(len(f)) + ") "
#print allMaterialFiles

print "Extracting texture files.."

for cmpinfo in zinfolist:
    if(cmpinfo.filename.endswith(tuple(allMaterialFiles))):
        print "Found material file " + cmpinfo.filename + "(" + str(len(cmpinfo.filename)) + ") "
        zfile.extract(cmpinfo, tempDir)
    else:
        print "Skipping " + cmpinfo.filename + "(" + str(len(cmpinfo.filename)) + ") " + ".."
        #pass

# cleanup
# - delete all source files, so only combined OBJ files remain
print "Cleaning up source OBJ files.."

for cmpinfo in zinfolist:
    if string.lower(cmpinfo.filename).endswith((".obj")):
        targetfile = tempDir + "/" + cmpinfo.filename
        print "Removing " + targetfile + ".."
        os.unlink(targetfile)
    else:
        #print "Skipping " + cmpinfo.filename + ".."
        pass

zfile.close()

print "All output files to be compressed:"
print allOutputFiles

# - create a new zip file that contains only the combined OBJ files
print "All groups:"
print allGroupsMerged
print "=================================================================================="
mergedzip = zipfile.ZipFile(os.path.splitext(zname)[0] + "_processed.zip", 'w')

# for grp in allGroupsMerged:
#     for obj in grp[1]:
#         objfilename = "".join(obj)
#         print "objfilename: " + objfilename
#         print "Writing " + tempDir + "/" + grp[0] + "/" + "".join(obj) + " as " + grp[0] + "/" + "".join(obj)
#         mergedzip.write(tempDir + "/" + grp[0] + "/" + "".join(obj), grp[0] + "/" + "".join(obj), zipfile.ZIP_DEFLATED)

for out in allOutputFiles:
    outfilename = "".join(out)
    print "objfilename: " + outfilename
    print "Writing " + outfilename
    mergedzip.write(tempDir + "/" + outfilename, outfilename, zipfile.ZIP_DEFLATED)
