import os
import sys
import argparse
import zipfile
import os.path
from PIL import Image
import struct
import json
import numpy as np
import imageio
import gzip
import shutil
from math import sqrt
from scipy import ndimage, misc

import warnings
warnings.filterwarnings("ignore")

# Author: Toan Nguyen
# Date: May 2018
# Modified: June 2019
# TODO: support nii and dcm files


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


def is16bit(mode):
    return mode in ["uint16", "I;16", "I;16B", "I;16S"]


def convertImage16To8(img16):
    data = np.array(img16).astype(np.float32)
    data = data / 256.0
    if (data.max() > 0):
        data *= 255.0 / data.max()

    data = np.array(data, dtype=np.uint8)
    img8 = Image.fromarray(data)
    return img8


def calculateMosaicSize(H, W, D):
    mos_ncols = round(sqrt(H * D / W))
    mos_nrows = round((D - 1) / mos_ncols) + 1
    return [mos_ncols, mos_nrows]


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
                    print(fname, img.size, img.mode, len(img.getdata()), is16bit(img.mode))
                volinfo["size"] = img.size
                volinfo["mode"] = img.mode
                #if img.mode != "L" and not is16bit(img.mode):
                #    raise NameError("not_8_or_16_bit_data")
                hadsize = True

    volinfo["numslices"] = numslices
    volinfo["voxelsizes"] = [1, 1, 1]

    lut = []
    for i in range(256):
        lut.append(i)
    lutarr = bytearray(lut)

    # calculate number of cols in mosaic image
    img_W = volinfo["size"][0]
    img_H = volinfo["size"][1]
    [mos_ncols, mos_nrows] = calculateMosaicSize(img_H, img_W, volinfo["numslices"])

    # convert to xrw and mosaic png
    max_size = 10000.0
    factor = ((max_size*max_size) / (img_W*img_H*volinfo["numslices"]))**(1./3.)
    need_resize = False
    if factor < 1.0 and factor > 0.0:
        need_resize = True
        data3D = np.zeros( (img_H, img_W, volinfo["numslices"]), np.uint8)
    else:
        mos_data = np.zeros((int(mos_nrows * img_H), int(mos_ncols * img_W)), dtype=np.uint8)
        mos_col = 0
        mos_row = 0

    xrw_filename = os.path.join(outdir, "vol.xrw")
    with open(xrw_filename, "wb") as xrwfile:
        # nx, ny, nz
        xrwfile.write(struct.pack('i', volinfo["size"][0]))
        xrwfile.write(struct.pack('i', volinfo["size"][1]))
        xrwfile.write(struct.pack('i', volinfo["numslices"]))

        # wdx, wdy, wdz (voxel dimensions)
        xrwfile.write(struct.pack('f', volinfo["voxelsizes"][0]))
        xrwfile.write(struct.pack('f', volinfo["voxelsizes"][1]))
        xrwfile.write(struct.pack('f', volinfo["voxelsizes"][2]))

        # write slices
        slice_ind = 0
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

                    if is16bit(volinfo["mode"]):
                        img = convertImage16To8(img)

                    if(len(img.getbands()) > 1):
                        channel = img.getchannel(0)
                        data = channel.getdata()
                    else:
                        data = img.getdata()

                    xrwfile.write(bytearray(data))

                    if need_resize:
                        data3D[:, :, slice_ind] = np.asarray(data).reshape((img_H, img_W))
                    else:
                        mos_data[int(mos_row * img_H):int((mos_row + 1) * img_H),
                        int(mos_col * img_W):int((mos_col + 1) * img_W)] = np.asarray(data).reshape((img_H, img_W))
                        mos_col += 1
                        if (mos_col >= mos_ncols):
                            mos_col = 0
                            mos_row = mos_row + 1

                    slice_ind = slice_ind + 1

        # lut r, g, b
        xrwfile.write(lutarr)
        xrwfile.write(lutarr)
        xrwfile.write(lutarr)

    # save mosaic png
    if need_resize:
        resized_data = ndimage.zoom(data3D, factor)
        newImgH = resized_data.shape[0]
        newImgW = resized_data.shape[1]
        newImgD = resized_data.shape[2]
        [mos_ncols, mos_nrows] = calculateMosaicSize(newImgH, newImgW, newImgD)
        mos_data = np.zeros((int(mos_nrows * newImgH), int(mos_ncols * newImgW)), dtype=np.uint8)
        mos_col = 0
        mos_row = 0
        for d in range(newImgD):
            mos_data[int(mos_row * newImgH):int((mos_row + 1) * newImgH),
            int(mos_col * newImgW):int((mos_col + 1) * newImgW)] = resized_data[:, :, d]
            mos_col += 1
            if (mos_col >= mos_ncols):
                mos_col = 0
                mos_row = mos_row + 1

    # save image and thumbnail
    impng = Image.fromarray(mos_data)
    impng.save(os.path.join(outdir, "vol_web.png"))
    impng.thumbnail((512, 512))
    impng.save(os.path.join(outdir, "vol_web_thumb.png"))

    zfile.close()

    retjson = {}
    retjson["status"] = "done"
    retjson["size"] = [volinfo["size"][0], volinfo["size"][1], volinfo["numslices"]]
    if need_resize:
        retjson["newsize"] = [resized_data.shape[1], resized_data.shape[0], resized_data.shape[2]]
    else:
        retjson["newsize"] = retjson["size"]
    print (json.dumps(retjson))


def parseVolInfo(shape):
    """
    Parse volume info from shape read from imageio
    :param shape: 
    :return: 
    """
    shape = shape[::-1]
    volinfo = {}
    volinfo["size"] = [shape[0], shape[1]]
    dim = len(shape)
    numslices = 1
    numtimes = 1
    numchannels = 1
    if dim == 3:
        numslices = shape[2]
    elif dim == 4:
        if shape[2] <= 3:
            numchannels = shape[2]
            numslices = shape[3]
        else:
            numslices = shape[2]
            numtimes = shape[3]
    elif dim == 5:
        numchannels = shape[2]
        numslices = shape[3]
        numtimes = shape[4]
    else:
        raise NameError("unsupported number of dimensions = " + str(dim))

    volinfo["numslices"] = numslices
    volinfo["numchannels"] = numchannels
    volinfo["numtimes"] = numtimes
    volinfo["voxelsizes"] = [1, 1, 1]
    return volinfo


def getFrameData(img, volinfo, i, channel, timestep):
    """
    Get frame data from imageio img    
    :param img: 
    :param volinfo: 
    :param i: 
    :param channel: 
    :param timestep: 
    :return: 
    """
    # check inputs
    channel = int(channel)
    timestep = int(timestep)
    if channel < 0: channel = 0
    if channel > volinfo["numchannels"]-1 : channel = volinfo["numchannels"]-1
    if timestep < 0: timestep = 0
    if timestep > volinfo["numtimes"]-1 : channel = volinfo["numtimes"]-1
    
    shape = volinfo["shape"]
    shape = shape[::-1]
    dim = len(shape)
    if dim == 3:
        data = img[i, :, :]
    elif dim == 4:
        if shape[2] <= 3:
            data = img[i,channel,:,:]
        else:
            data = img[timestep,i,:,:]
    elif dim == 5:
        data = img[timestep,i,channel,:,:]

    if is16bit(volinfo["mode"]):
        data = data / 256
        data = np.array(data, dtype=np.uint8)
    return data.tobytes()


def processTiffStack(infile, outdir, channel, timestep, verbose):
    """
    Process multi-dimensional tiff
    :param infile: 
    :param outdir: 
    :param verbose: 
    :return: 
    """
    #img = Image.open(infile)
    img = imageio.volread(infile)
    volinfo = parseVolInfo(img.shape)
    volinfo["mode"] = img.dtype.name
    volinfo["shape"] = img.shape
    if verbose:
        print(volinfo)

    if volinfo["numslices"] < 5:
        raise NameError("Tiff has less than 5 frames")

    lut = []
    for i in range(256):
        lut.append(i)
    lutarr = bytearray(lut)

    xrw_filename = os.path.join(outdir, "vol.xrw")
    with open(xrw_filename, "wb") as xrwfile:
        # nx, ny, nz
        xrwfile.write(struct.pack('i', volinfo["size"][0]))
        xrwfile.write(struct.pack('i', volinfo["size"][1]))
        xrwfile.write(struct.pack('i', volinfo["numslices"]))

        # wdx, wdy, wdz (voxel dimensions)
        xrwfile.write(struct.pack('f', volinfo["voxelsizes"][0]))
        xrwfile.write(struct.pack('f', volinfo["voxelsizes"][1]))
        xrwfile.write(struct.pack('f', volinfo["voxelsizes"][2]))

        for i in range(volinfo["numslices"]):
            data = getFrameData(img, volinfo, i, channel, timestep)
            xrwfile.write(data)

        # lut r, g, b
        xrwfile.write(lutarr)
        xrwfile.write(lutarr)
        xrwfile.write(lutarr)

    retjson = {}
    retjson["status"] = "done"
    retjson["size"] = [volinfo["size"][0], volinfo["size"][1], volinfo["numslices"]]
    print(json.dumps(retjson))


def processXRWFile(infile, outdir, verbose):
    """
    Process XRW file. Only compressed XRW file is supported now
    :param infile:
    :param outdir:
    :param verbose:
    :return:
    """
    xrw_filename = os.path.join(outdir, "vol.xrw")
    with gzip.open(infile, 'rb') as f_in:
        with open(xrw_filename, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)

    # read some info from file
    size_x = 0
    size_y = 0
    numslides = 0
    with gzip.open(infile, 'rb') as f_in:
        size_x = struct.unpack('i', f_in.read(4))
        size_y = struct.unpack('i', f_in.read(4))
        numslides = struct.unpack('i', f_in.read(4))

    retjson = {}
    retjson["status"] = "done"
    retjson["size"] = [size_x, size_y, numslides]
    print(json.dumps(retjson))


def main(argv):
    """
    Main function
    Input: 
    Output: 
    """
    # parse parameters
    parser = argparse.ArgumentParser(description='Convert image to deep zoom using vips')
    parser.add_argument('-i', '--infile', dest='infile', help='name of input file to process')
    parser.add_argument('-o', '--outdir', dest='outdir', help='ouput directory e.g. /path/to/tags/avc233')
    parser.add_argument('-c', '--channel', dest='channel', help='channel index (from 0) e.g. 0', default=0)
    parser.add_argument('-t', '--timestep', dest='timestep', help='timestep (from 0) e.g. 0', default=0)
    parser.add_argument('-v', '--verbose', action='store_true', help='verbose')

    args = parser.parse_args()
    infile = args.infile
    outdir = args.outdir
    channel = args.channel
    timestep = args.timestep
    verbose = args.verbose

    if verbose:
        print(infile, outdir)

    if infile == "" or outdir == "":
        print >> sys.stderr, "wrong_input_args"
        raise NameError("wrong_input_args")

    # get absopath of outdir
    outdir = os.path.abspath(outdir)
    if not os.path.exists(outdir):
        os.makedirs(outdir)

    # now process zip file
    filename, ext = os.path.splitext(infile)
    ext = ext.lower()
    if ext == ".zip":
        processZipStack(infile, outdir, verbose)
    elif ext == ".tif" or ext == ".tiff":
        processTiffStack(infile, outdir, channel, timestep, verbose)
    elif ext == ".xrw":
        processXRWFile(infile, outdir, verbose)
    else:
        raise NameError("wrong_input_file_ext")


# MAIN FUNCTION
if __name__ == "__main__":
    main(sys.argv[1:])