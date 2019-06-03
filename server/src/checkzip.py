import argparse
import io
import os
import json
import string
import subprocess
import zipfile

def isImageFile(file):
    """
    Check if file is an image file. Supports JPEG, PNG, TIFF
    """
    filename, ext = os.path.splitext(file)
    ext = ext.lower()
    if ext == ".tif" or ext == ".tiff" or ext == ".jpg" or ext == ".jpeg" or ext == ".png":
        return True
    return False
    
def isMeshFile(file):
    """
    Check if file is a mesh file. Support OBJ, MTL
    """
    filename, ext = os.path.splitext(file)
    ext = ext.lower()
    if ext == ".obj" or ext == ".mtl":
        return True
    return False
    
def isPointFile(file):
    """
    Check if file is a point file. Support .las, .laz, .ptx, .ply, .xyz, .txt
    """
    filename, ext = os.path.splitext(file)
    ext = ext.lower()
    if ext == ".las" or ext == ".laz" or ext == ".ptx" or ext == ".ply" or ext == ".xyz" or ext == ".txt":
        return True
    return False
    
def isPhotogrammetryFile(file):
    """
    Check if file is a photogrammetry file. Support .jpg   @AH add more? Don't know when this is called, or if it is called.
    """
    filename, ext = os.path.splitext(file)
    ext = ext.lower()
    if ext == ".jpg" or ext ==".jpeg":
        return True
    return False



def main():
    zname = ""
    type = ""
    parser = argparse.ArgumentParser(description='Checks if a zipfile has a tiff stack or OBJ files')
    parser.add_argument('-f', dest='filename', help='name of zipfile to process')
    parser.add_argument('-t', dest='type', help='type of data to check {volume, mesh, point, image, photogrammetry}')

    args = parser.parse_args()
    zname = args.filename
    type = args.type

    # open the zipfile
    zfile = zipfile.ZipFile(zname, 'r')
    zinfolist = zfile.infolist()

    #print "Files:"
    hasImage = False
    hasMesh = False
    hasPoint = False
    hasPhotogrammetry = False
    countImg = 0
    for cmpinfo in zinfolist:
        fname = string.lower(cmpinfo.filename)
        
        if isImageFile(fname):
            hasImage = True
            countImg = countImg + 1
        
        elif isMeshFile(fname):
            hasMesh = True
            
        elif isPointFile(fname):
            hasPoint = True
        
        elif isPhotogrammetryFile(fname):
            hasPhotogrammetry = True
            countImg = countImg + 1
        else:
            pass
    
    match = False
    errstr = ""
    if (type == "mesh"):
        if hasMesh:
            match = True
    
    elif (type == "point"):
        if hasPoint:
            match = True
            
    elif (type == "volume"):
        if hasImage and not hasMesh and not hasPoint:
            match = True
    
    elif (type == "image"):
        if hasImage and not hasMesh and not hasPoint:
            match = True
            
    elif (type == "photogrammetry"):
        # AH: really not the best test in the world :(
        if hasImage and not hasMesh and not hasPoint and countImg>2:
            match = True
    
    else:
        errstr = "Unsupported type or data. Please check the guide to prepare your data."
    
    ret = {}
    ret["match"] = match
    ret["err"] = errstr
    print json.dumps(ret)
    

if __name__ == '__main__':
    main()
