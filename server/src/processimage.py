import os
import sys
import argparse
import subprocess
import zipfile
import shutil
import json
import numpy as np
from PIL import Image

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


def isImageFile(file):
    """
    Check if file is an image file. Supports JPEG, PNG, TIFF
    """
    filename, ext = os.path.splitext(file)
    ext = ext.lower()
    if ext == ".tif" or ext == ".tiff" or ext == ".jpg" or ext == ".jpeg" or ext == ".png":
        return True
    return False


def is16bit(mode):
    return mode in ["I;16", "I;16B", "I;16S"]


def convertImage16To8(img16):
    data = np.array(img16) / 256
    data = np.array(data, dtype=np.uint8)
    img8 = Image.fromarray(data)
    return img8


def checkAndConvertTiff(infile):
    img = Image.open(infile)
    filename, ext = os.path.splitext(infile)
    outfile = filename + '_8bit' + ext
    if is16bit(img.mode):
        img = convertImage16To8(img)
        img.save(outfile)
        return outfile
    return infile


def processZipFile(infile, outdir, verbose):
    """
    Process zip file
    :param infile: 
    :param outdir: 
    :param verbose: 
    :return: 
    """
    zfile = zipfile.ZipFile(infile, 'r')
    zinfolist = zfile.infolist()

    tmpdir = os.path.join(outdir,'tmp')
    if not os.path.exists(tmpdir):
        os.makedirs(tmpdir)

    outputfiles = []
    thumb = True
    for cmpinfo in zinfolist:
        fname = cmpinfo.filename
        if not validFilename(fname):
            continue

        if not isImageFile(fname):
            continue

        base = os.path.basename(fname)
        filename, ext = os.path.splitext(base)
        source = zfile.open(cmpinfo)
        tmpfile = os.path.join(tmpdir, filename + ext)

        target = file(tmpfile, "wb")
        with source, target:
            shutil.copyfileobj(source, target)
        # then process tmp image file
        if verbose:
            print('processZipFile', filename, tmpfile, outdir)
        processImageFile(tmpfile, outdir, verbose, thumb)
        thumb = False

        outputfiles.append(filename + ".dzi")

    shutil.rmtree(tmpdir)
    if verbose:
        print(outputfiles)

    return outputfiles


def processImageFile(infile, outdir, verbose, thumb = True):
    """
    Process image file
    :param infile: 
    :param outdir: 
    :param verbose: 
    :return: 
    """
    base = os.path.basename(infile)
    filename, ext = os.path.splitext(base)
    outfile = os.path.join(outdir, filename)
    if verbose:
        print('processImageFile', infile, filename, outdir, outfile)
    #ret = subprocess.check_output(['vips','dzsave',infile,outfile,'--tile-size','1024','--depth','onetile'])

    #if(ext == '.tif' or ext == '.tiff'):
    #    infile = checkAndConvertTiff(infile)

    ret = subprocess.check_output(['vips','dzsave',infile,outfile])
    if verbose:
        print(ret)
        
    if(thumb):
        path_to_file = os.path.join(outdir, filename + "_files/8/0_0.jpeg")
        if os.path.isfile(path_to_file):
            shutil.copyfile(path_to_file, outdir+'/thumb.jpeg')
        

    return [filename + ".dzi"]


def main():
    """
    Main function
    :return: 
    """
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

    if verbose:
        print(infile, outdir)

    if infile == "" or outdir == "":
        print >> sys.stderr, "wrong_input_args"
        raise NameError("wrong_input_args")

    outdir = os.path.abspath(outdir)
    if os.path.exists(outdir):
        shutil.rmtree(outdir)
    os.makedirs(outdir)

    filename, ext = os.path.splitext(infile)
    ext = ext.lower()
    outputfiles = []
    if(ext == ".zip"):
        outputfiles = processZipFile(infile, outdir, verbose)
    else:
        outputfiles = processImageFile(infile, outdir, verbose)

    outfilename = os.path.join(outdir, "image.json")
    with open(outfilename, 'w') as outfile:
        json.dump(outputfiles, outfile, sort_keys = True, indent = 4, ensure_ascii = False)
    print (json.dumps(outputfiles))


# MAIN FUNCTION
if __name__ == "__main__":
    main()