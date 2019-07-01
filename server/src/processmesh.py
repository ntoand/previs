import os
import sys
import argparse
import zipfile
import os.path
import json
import shutil

# Author: Toan Nguyen
# Date: May 2018

import warnings
warnings.filterwarnings("ignore")

def validFilename(filename):
    """
    Check if finename is valid
    :param filename: 
    :return: 
    """
    if "__MACOSX" in filename or ".DS_Store" in filename:
        return False
    return True


def splitFilename(filename, hascontainer = False):
    if "/" in filename:
        parts = filename.split("/")
    else:
        parts = filename.split("\\")
    if(parts[len(parts)-1] == ""):
        parts = parts[:-1]
    if(hascontainer):
        parts = parts[1:]
    return parts


def fixMtlFile(mtlfile, verbose):
    """
    Check and fix texture path if needed (change absolute path to relative)    
    :param mtffile: 
    :return: 
    """
    if verbose:
        print ("fixing file " + mtlfile)
        
    content = ""
    with open(mtlfile, "rt") as file:
        for line in file:
            if len(line) > 3 and line[0:3] == "map":
                if verbose:
                    print ("find map texture: " + line)
                line = line.strip()
                parts1 = line.split(" ")
                mapname = parts1[0]
                texture = parts1[1]
                if "/" in texture:
                    parts2 = texture.split("/")
                    texture = parts2[len(parts2)-1]
                if "\\" in texture:
                    parts2 = texture.split("\\")
                    texture = parts2[len(parts2) - 1]
                line = mapname + " " + texture + "\n"
            content = content + line
        if verbose:
            print (content)
    
    # write back
    with open(mtlfile, "wt") as outfile:
        outfile.write(content)


def processMeshes(infile, outdir, verbose = False):
    """
    Travel the zip file and generate meta data
    :param infile: 
    :param outdir: 
    :return: 
    """
    zfile = zipfile.ZipFile(infile, 'r')
    zinfolist = zfile.infolist()

    # get overall info
    hasContainerDir = False
    for cmpinfo in zinfolist:
        fname = cmpinfo.filename
        if not validFilename(fname) :
            continue
        parts = splitFilename(fname)
        if len(parts) >= 3:
            hasContainerDir = True
            break


    groups = {}
    for cmpinfo in zinfolist:
        fname = cmpinfo.filename
        if not validFilename(fname) :
            continue
        parts = splitFilename(fname, hasContainerDir)
        if len(parts) == 2:
            groupname = parts[0]
            filename = parts[1]
            extension = os.path.splitext(filename)[1].lower()

            #extract
            groupdir = os.path.join(outdir, groupname)
            if not os.path.exists(groupdir):
                os.makedirs(groupdir)

            source = zfile.open(cmpinfo)
            target = file(os.path.join(groupdir, filename), "wb")
            with source, target:
                shutil.copyfileobj(source, target)

            if extension == ".obj" or extension == ".mtl":
                if groupname not in groups:
                    groups[groupname] = {"obj": [], "mtl": []}

                if extension == ".obj":
                    groups[groupname]["obj"].append(filename)
                else:
                    groups[groupname]["mtl"].append(filename)
                    mtlfile = os.path.join(os.path.join(outdir, groupname), filename)
                    fixMtlFile(mtlfile, verbose)

    zfile.close()
    if verbose:
        print groups

    objectcount = 0;
    metajson = []
    #python 2
    for key, value in groups.iteritems():
        groupjson = {}
        groupjson["name"] = key
        groupjson["visible"] = True
        groupjson["colour"] = [255, 255, 255]
        groupjson["alpha"] = 1
        groupjson["objects"] = []
        for objfile in groups[key]["obj"]:
            objjson = {}
            objjson["obj"] = objfile
            mtlname = os.path.splitext(objfile)[0] + ".mtl"
            if mtlname in groups[key]["mtl"]:
                objjson["hasmtl"] = True
                objjson["mtl"] = mtlname
            else:
                objjson["hasmtl"] = False
            groupjson["objects"].append(objjson)
            objectcount = objectcount + 1

        metajson.append(groupjson)
        
    meshjson = {};
    meshjson["views"] = {};
    meshjson["views"]["translate"] = [0, 0, 0];
    meshjson["objects"] = metajson;

    if verbose:
        print meshjson

    #write json file
    outfilename = os.path.join(outdir, "mesh.json")
    with open(outfilename, 'w') as outfile:
        json.dump(meshjson, outfile, sort_keys = True, indent = 4, ensure_ascii = False)
        
    print ('['+str(objectcount)+']')


def main():
    """
    Main function
    Input: 
    Output: 
    """
    # parse parameters
    infile = ""
    outdir = ""
    verbose = False

    parser = argparse.ArgumentParser(description='Convert image to deep zoom using vips')
    parser.add_argument('-i', '--infile', dest='infile', help='name of input file to process')
    parser.add_argument('-o', '--outdir', dest='outdir', help='ouput directory e.g. /path/to/tags/avc233')
    parser.add_argument('-v', '--verbose', action='store_true', help='verbose')

    args = parser.parse_args()
    infile = args.infile
    outdir = args.outdir
    verbose = args.verbose
    
    if (infile == '' or outdir == ''):
        print >> sys.stderr, "wrong_input_args"
        raise NameError("wrong_input_args")

    # get absopath of outdir
    outdir = os.path.abspath(outdir)
    if not os.path.exists(outdir):
        os.makedirs(outdir)

    if verbose:
        print (infile, outdir)

    # now process zip file
    processMeshes(infile, outdir, verbose)


# MAIN FUNCTION
if __name__ == "__main__":
    main()