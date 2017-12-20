import argparse
import io
import os
#import json
import string
import subprocess
#import tempfile
import zipfile

def main():
    zname = ""
    containsTiffs = False
    containsMeshes = False

    parser = argparse.ArgumentParser(description='Checks if a zipfile has a tiff stack or OBJ files')
    parser.add_argument('-f', dest='filename', help='name of zipfile to process')

    args = parser.parse_args()
    zname = args.filename

    # open the zipfile
    zfile = zipfile.ZipFile(zname, 'r')
    zinfolist = zfile.infolist()

    #print "Files:"

    for cmpinfo in zinfolist:
        fname = string.lower(cmpinfo.filename)
        
        if(fname.endswith((".obj", ".mtl"))):
            #print cmpinfo.filename
            containsMeshes = True
            #zfile.extract(cmpinfo, tempDir)
        elif(fname.endswith((".tif", ".tiff"))):
            #print cmpinfo.filename
            containsTiffs = True
        else:
            pass
            #print "File " + cmpinfo.filename + " not a supported type.."

    if containsTiffs and not containsMeshes:
        print "Zip file contains TIFF files"
    elif containsMeshes and not containsTiffs:
        print "Zip file contains meshes"
    elif containsTiffs and containsMeshes:
        print "Zip file contains both images and meshes - not yet supported"
    else:
        print "Zip file doesn't contain any supported files"

# end main()

if __name__ == '__main__':
    main()
