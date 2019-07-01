"""
Try to guess datatypes from input file
"""
import argparse
import io
import os
import json
import string
import subprocess
import zipfile
import imageio

import warnings
warnings.filterwarnings("ignore")

def endsWith(filepath, exts):
    """
    Check if filepath endwiths ext
    """
    for i in exts:
        if filepath.lower().endswith(i):
            return True
    return False


def processFile(filepath, zfile = None):
    """
    Get datatypes based on file extension
    """
    datatypes = []
    if endsWith(filepath, ['.nii', '.nii.gz', '.xrw', '.dcm']):
        datatypes = ['volume']
    elif endsWith(filepath, ['.obj', '.mtl']):
        datatypes = ['mesh']
    elif endsWith(filepath, ['.las', '.laz', '.ptx', '.ply', '.xyz', '.txt']):
        datatypes = ['point']
    elif endsWith(filepath, ['.jpg', '.jpeg', '.png', '.gif']):
        datatypes = ['image', 'photogrammetry']
    elif endsWith(filepath, ['.tif', '.tiff']):
        if(zfile != None):
            ofile = zfile.extract(filepath, path='/tmp/')
            img = imageio.volread(ofile)
            os.remove('/tmp/' + filepath)
        else:
            img = imageio.volread(filepath)
        shape = img.shape[::-1]
        dim = len(shape)
        if dim <= 2 or (dim == 3 and shape[2] <= 3):
            datatypes = ['image']
        else:
            datatypes = ['volume']
    return datatypes


def processZipFile(filepath):
    """
    Check zip file contents to extract datatypes
    """
    datatypes = []
    # open the zipfile
    zfile = zipfile.ZipFile(filepath, 'r')
    zinfolist = zfile.infolist()

    types = ['volume', 'mesh', 'point', 'image', 'photogrammetry']
    hasTypes = {
        'volume': False,
        'mesh': False,
        'point': False,
        'image': False,
        'photogrammetry': False
    }
    countImg = 0
    #for cmpinfo in zinfolist:
    for fname in zfile.namelist():
        types = processFile(fname, zfile)
        for t in types:
            if t in types:
                hasTypes[t] = True
                if t == 'image':
                    countImg = countImg + 1

    if countImg > 5:
        hasTypes['volume'] = True
        hasTypes['image'] = False

    for t in hasTypes:
        if hasTypes[t] == True:
            datatypes.append(t)

    return datatypes


def main():
    ret = {}
    ret["status"] = 'done'
    ret["detail"] = ''
    ret["datatypes"] = []
    filepath = ""
    parser = argparse.ArgumentParser(description='Guess datatypes from input file')
    parser.add_argument('-f', dest='file', help='file to process')

    args = parser.parse_args()
    filepath = args.file

    # get file ext
    if endsWith(filepath, ['.zip']):
        ret["datatypes"] = processZipFile(filepath)
    else:
        ret["datatypes"] = processFile(filepath)

    if len(ret["datatypes"]) == 0:
        status = 'error'
        detail = 'invalid file extension'

    # Done
    print (json.dumps(ret))


if __name__ == '__main__':
    main()
