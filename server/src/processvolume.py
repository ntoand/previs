import os
import sys
import getopt
import zipfile
import os.path
from PIL import Image
import struct
import json

# Author: Toan Nguyen
# Date: May 2018
# TODO: support nii and dcm files

def help():
    print ('Usage: volprocess.py [-h] -i input_file -o output_dir [-v]')
    print ('Example: volprocess.py -i /path/to/tiffs.zip -o /path/to/data')


def getImageType(fname):
    """
    Check if image file is supported
    :param fname: 
    :return: 
    """
    ext = os.path.splitext(fname)[1].lower()
    if ext == ".tif" or ext == ".tiff" or ext == ".jpg" or ext == ".jpeg" or ext == ".png":
        return 1
    elif ext == ".nii":
        return 2
    return 0

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


def processZipStack(infile, outdir, verbose = False):
    """
    Travel the zip file and generate meta data
    :param infile: 
    :param outdir: 
    :return: 
    """
    zfile = zipfile.ZipFile(infile, 'r')
    zinfolist = zfile.infolist()

    # get overall info
    numslices = 0
    hadsize = False
    volinfo = {}
    for cmpinfo in zinfolist:
        fname = cmpinfo.filename
        if not validFilename(fname) :
            continue
        imgtype = getImageType(fname)
        if imgtype == 0:
            continue

        numslices = numslices + 1
        if hadsize:
            continue

        if imgtype == 1: # normal image
            # read image data
            with zfile.open(cmpinfo) as imgfile:
                img = Image.open(imgfile)
                if verbose:
                    print(fname, img.size, img.mode, len(img.getdata()))
                volinfo["size"] = img.size
                hadsize = True

    volinfo["numslices"] = numslices

    lut = []
    for i in range(256):
        lut.append(i)
    lutarr = bytearray(lut)

    # convert to xrw
    xrw_filename = os.path.join(outdir, "vol.xrw")
    with open(xrw_filename, "wb") as xrwfile:
        # nx, ny, nz
        xrwfile.write(struct.pack('i', volinfo["size"][0]))
        xrwfile.write(struct.pack('i', volinfo["size"][1]))
        xrwfile.write(struct.pack('i', volinfo["numslices"]))

        # wdx, wdy, wdz (voxel dimensions)
        xrwfile.write(struct.pack('f', 1))
        xrwfile.write(struct.pack('f', 1))
        xrwfile.write(struct.pack('f', 1))

        # write slices
        for cmpinfo in zinfolist:
            fname = cmpinfo.filename
            if not validFilename(fname):
                continue

            imgtype = getImageType(fname)
            if imgtype == 0:
                continue

            if imgtype == 1:  # normal image
                with zfile.open(cmpinfo) as imgfile:
                    img = Image.open(imgfile)
                    channel = img.getchannel(0)
                    xrwfile.write(bytearray(channel.getdata()))

        # lut r, g, b
        xrwfile.write(lutarr)
        xrwfile.write(lutarr)
        xrwfile.write(lutarr)

    zfile.close()

    retjson = {}
    retjson["status"] = "done"
    retjson["size"] = [volinfo["size"][0], volinfo["size"][1], volinfo["numslices"]]
    print (json.dumps(retjson))


def main(argv):
    """
    Main function
    Input: 
    Output: 
    """
    # parse parameters
    try:
        opts, args = getopt.getopt(argv, "hi:o:v", ["ifile", "odir", "verbose"])
    except getopt.GetoptError as err:
        print (str(err))
        help()
        sys.exit(1)

    input_file = ''
    output_dir = ''
    verbose = False
    for opt, arg in opts:
        if opt == '-h':
            help()
            sys.exit()
        elif opt in ("-i", "--ifile"):
            input_file = arg
        elif opt in ("-o", "--odir"):
            output_dir = arg
        elif opt in ("-v", "--verbose"):
            verbose = True

    if (input_file == '' or output_dir == ''):
        print >> sys.stderr, "wrong_input_args"
        raise NameError("wrong_input_args")

    # get absopath of outdir
    output_dir = os.path.abspath(output_dir)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    if verbose:
        print ("input: " + input_file)
        print ("output: " + output_dir)

    # now process zip file
    processZipStack(input_file, output_dir, verbose)


# MAIN FUNCTION
if __name__ == "__main__":
    main(sys.argv[1:])