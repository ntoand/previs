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
import nibabel as nib
import pydicom

import warnings
warnings.filterwarnings("ignore")

# Author: Toan Nguyen
# Date: May 2018
# Modified: June 2019

def getImageType(fname):
    """
    Check if image file is supported
    :param fname: 
    :return: 
    """
    ext = os.path.splitext(fname)[1].lower()
    if ext == ".tif" or ext == ".tiff" or ext == ".jpg" or ext == ".jpeg" or ext == ".png":
        return 1
    elif ext == ".dcm":
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


def getNumpyType(mode):
    # ["uint16", "I;16", "I;16B", "I;16S"]
    if mode == "L" or mode == "P" or mode == "uint8":
        return np.dtype(np.uint8)
    elif mode == "uint16":
        return np.dtype(np.uint16)
    return np.dtype(np.int16)


def calculateMosaicSize(H, W, D):
    mos_ncols = round(sqrt(H * D / W))
    mos_nrows = int((D - 1) / mos_ncols) + 1
    return [mos_ncols, mos_nrows]


def normalize16bitData(voldata, verbose = False):
    # normalize 16 bit data
    if verbose: print('normalize16bitData')
    voldata = voldata.astype(np.float32)
    voldata = voldata / 256.0
    if (voldata.max() > 0):
        voldata *= 255.0 / voldata.max()
    return voldata.astype(np.uint8)


def saveVolume(voldata, volinfo, outdir, verbose = False, savexrw = True):
    """
    Volume which are read from input files (zip, tiff, xrw, nifti or DICOM)
    is resized (if needed), saved to xrw, mosaic png and thumbnail
    :param data: 3d numpy array
    :param volinfo: information of the 3D volume
    :param outdir: output directory
    :param verbose:
    :return:
    """

    if verbose: print('saveVolume to', outdir)

    #1. write 3d data to xrw file
    if savexrw == True:
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

            for slice in range(volinfo["numslices"]):
                xrwfile.write(voldata[:, :, slice].tobytes())

            # lut r, g, b
            lut = []
            for i in range(256):
                lut.append(i)
            lutarr = bytearray(lut)
            xrwfile.write(lutarr)
            xrwfile.write(lutarr)
            xrwfile.write(lutarr)

    #2. check if we need to resize the volume for web viwewer
    max_size = 10000.0 # texture width/height
    fullW = volinfo["size"][0]
    fullH = volinfo["size"][1]
    [mos_ncols, mos_nrows] = calculateMosaicSize(fullH, fullW, volinfo["numslices"])
    factor = ((max_size * max_size) / (fullW * fullH * volinfo["numslices"])) ** (1. / 3.)

    mos_col = 0
    mos_row = 0
    newsize = [volinfo["size"][0], volinfo["size"][1], volinfo["numslices"]]
    if factor < 1.0 and factor > 0.0: # need to resize
        if verbose: print('resize volume')
        resized_data = ndimage.zoom(voldata, factor)
        newImgH = resized_data.shape[0]
        newImgW = resized_data.shape[1]
        newImgD = resized_data.shape[2]
        [mos_ncols, mos_nrows] = calculateMosaicSize(newImgH, newImgW, newImgD)
        mos_data = np.zeros((int(mos_nrows * newImgH), int(mos_ncols * newImgW)), dtype=np.uint8)
        for d in range(newImgD):
            mos_data[int(mos_row * newImgH):int((mos_row + 1) * newImgH),
            int(mos_col * newImgW):int((mos_col + 1) * newImgW)] = resized_data[:, :, d]
            mos_col += 1
            if (mos_col >= mos_ncols):
                mos_col = 0
                mos_row = mos_row + 1
        newsize = [resized_data.shape[1], resized_data.shape[0], resized_data.shape[2]]

    else:
        mos_data = np.zeros((int(mos_nrows * fullH), int(mos_ncols * fullW)), dtype=np.uint8)
        for slice in range(volinfo["numslices"]):
            data = voldata[:, :, slice]
            mos_data[int(mos_row * fullH):int((mos_row + 1) * fullH),
                     int(mos_col * fullW):int((mos_col + 1) * fullW)] = data
            mos_col += 1
            if (mos_col >= mos_ncols):
                mos_col = 0
                mos_row = mos_row + 1

    # save image 
    impng = Image.fromarray(mos_data)
    impng.save(os.path.join(outdir, "vol_web.png"))
    # and thumbnail
    thumbdata = voldata[:, :, int(volinfo["numslices"]/2)]
    thumbimg = Image.fromarray(thumbdata)
    thumbimg.thumbnail((512, 512))
    thumbimg.save(os.path.join(outdir, "vol_web_thumb.png"))
    # print output
    retjson = {}
    retjson["status"] = "done"
    retjson["size"] = [volinfo["size"][0], volinfo["size"][1], volinfo["numslices"]]
    retjson["newsize"] = newsize
    if ("writevoxelsizes" in volinfo) and (volinfo["writevoxelsizes"] == True):
        retjson["voxelsizes"] = volinfo["voxelsizes"]
    print(json.dumps(retjson))


def processZipStack(infile, outdir, verbose = False):
    """
    Read volume data & info from images in a zip file
    :param infile: 
    :param outdir: 
    :return: 
    """
    if(verbose): print('processZipStack')
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

        # read image data
        volinfo["imgtype"] = imgtype
        volinfo["16bit"] = False
        with zfile.open(cmpinfo) as imgfile:
            if imgtype == 1:  # normal image
                img = Image.open(imgfile)
                if verbose: print(fname, img.size, img.mode, len(img.getdata()))
                if (img.mode == "RGB"):
                    img = img.convert('L')
                volinfo["size"] = img.size
                volinfo["voxelsizes"] = [1, 1, 1]
                volinfo["dtype"] = getNumpyType(img.mode)

            elif imgtype == 2: # dicom
                if verbose: print(imgfile.name)
                with open(os.path.join(outdir, "tmp.dcm"), 'w') as f_tmp:
                    f_tmp.write(imgfile.read())
                RefDs = pydicom.read_file(os.path.join(outdir, "tmp.dcm"))
                volinfo["size"] = [RefDs.Columns, RefDs.Rows]
                volinfo["voxelsizes"] = [float(RefDs.PixelSpacing[0]), float(RefDs.PixelSpacing[1]), float(RefDs.SliceThickness)]
                volinfo["writevoxelsizes"] = True
                volinfo["dtype"] = RefDs.pixel_array.dtype

            else:
                NameError('Invalid image type')

            hadsize = True

    volinfo["numslices"] = numslices

    # read volume data to 3D numpy array
    fullW = volinfo["size"][0]
    fullH = volinfo["size"][1]
    voldata = np.zeros( (fullH, fullW, volinfo["numslices"]), dtype=volinfo["dtype"])

    # read slices
    slice_ind = 0
    for cmpinfo in zinfolist:
        fname = cmpinfo.filename
        if not validFilename(fname):
            continue

        imgtype = getImageType(fname)
        if imgtype == 0:
            continue

        with zfile.open(cmpinfo) as imgfile:
            if imgtype == 1:  # normal image
                img = Image.open(imgfile)
                if (img.mode == "RGB"):
                    img = img.convert('L')
                if imgtype == 1:
                    if (len(img.getbands()) > 1):
                        channel = img.getchannel(0)
                        data = channel.getdata()
                    else:
                        data = img.getdata()
                voldata[:, :, slice_ind] = np.asarray(data).reshape((fullH, fullW))

            elif imgtype == 2: # dicom
                with open(os.path.join(outdir, "tmp.dcm"), 'w') as f_tmp:
                    f_tmp.write(imgfile.read())
                RefDs = pydicom.read_file(os.path.join(outdir, "tmp.dcm"))
                data = RefDs.pixel_array
                voldata[:, :, slice_ind] = data.reshape((fullH, fullW))

            slice_ind = slice_ind + 1

    zfile.close()

    # normalize 16 bit data
    if volinfo["dtype"] == np.dtype(np.uint16) or volinfo["dtype"] == np.dtype(np.int16):
        voldata = normalize16bitData(voldata, verbose)

    saveVolume(voldata, volinfo, outdir, verbose)


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

    return data


def processTiffStack(infile, outdir, channel, timestep, verbose):
    """
    Process multi-dimensional tiff
    :param infile: 
    :param outdir: 
    :param verbose: 
    :return: 
    """
    if verbose: print('processTiffStack')
    #img = Image.open(infile)
    img = imageio.volread(infile)
    volinfo = parseVolInfo(img.shape)
    volinfo["shape"] = img.shape
    #volinfo["dtype"] = getNumpyType(img.dtype.name)
    volinfo["dtype"] = getFrameData(img, volinfo, 0, 0, 0).dtype
    if verbose:
        print(volinfo)

    if volinfo["numslices"] < 5:
        raise NameError("Tiff has less than 5 frames")

    fullW = volinfo["size"][0]
    fullH = volinfo["size"][1]
    voldata = np.zeros((fullH, fullW, volinfo["numslices"]), volinfo["dtype"])

    for i in range(volinfo["numslices"]):
        voldata[:, :, i] = getFrameData(img, volinfo, i, channel, timestep)

    # normalize 16 bit data
    if volinfo["dtype"] == np.dtype(np.uint16) or volinfo["dtype"] == np.dtype(np.int16):
        voldata = normalize16bitData(voldata, verbose)

    saveVolume(voldata, volinfo, outdir, verbose)


def processXRWFile(infile, outdir, verbose):
    """
    Process XRW file. Only compressed XRW file is supported now
    :param infile:
    :param outdir:
    :param verbose:
    :return:
    """
    #make sure input file name is not vol.xrw
    tmp_infile = os.path.join(outdir, "input.xrw")
    shutil.move(infile, tmp_infile)
    xrw_filename = os.path.join(outdir, "vol.xrw")

    is_gzip = True
    with gzip.open(tmp_infile, 'rb') as f_in:
        try:
            f_in.read(4)
        except IOError as e:
            is_gzip = False

    if is_gzip:
        with gzip.open(tmp_infile, 'rb') as f_in:
            with open(xrw_filename, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
    else:
        shutil.move(tmp_infile, xrw_filename)

    # read some info from file
    volinfo = {}
    size_x = 0
    size_y = 0
    numslides = 0
    voldata = []
    with open(xrw_filename, 'rb') as f_in:
        size_x = struct.unpack('i', f_in.read(4))[0]
        size_y = struct.unpack('i', f_in.read(4))[0]
        numslides = struct.unpack('i', f_in.read(4))[0]

        voldata = np.zeros((size_y, size_x, numslides), dtype=np.uint8)
        for slice in range(numslides):
            data = f_in.read(int(size_x * size_y))
            voldata[:, :, slice] = np.frombuffer(data, dtype=np.uint8).reshape( (size_y, size_x))

    volinfo["size"] = [size_x, size_y]
    volinfo["numslices"] = numslides
    volinfo["voxelsizes"] = [1, 1, 1]

    saveVolume(voldata, volinfo, outdir, verbose, False)


def processNiftiFile(infile, outdir, timestep, verbose):
    """
    Process nifti file
    :param infile:
    :param outdir:
    :param timestep: (4D data)
    :param verbose:
    :return:
    """
    if verbose: print('processNiftiFile')

    img = nib.load(infile)
    if verbose: print(img.shape, img.get_data_dtype(), img.header.get_zooms())

    volinfo = {}
    volinfo["size"] = [img.shape[1], img.shape[0]]
    volinfo["numslices"] = img.shape[2]
    volinfo["voxelsizes"] = []
    for i in range(3):
        volinfo["voxelsizes"].append(round(float(img.header.get_zooms()[i]), 2))
    volinfo["writevoxelsizes"] = True

    voldata = np.array(img.dataobj)
    if len(img.shape) > 3:
        if timestep >= img.shape[3]:
            timestep = img.shape[3]-1
        voldata = voldata[:, :, :, timestep]

    # normalize 16 bit data
    if img.get_data_dtype() == np.dtype(np.int16) or img.get_data_dtype() == np.dtype(np.uint16):
        voldata = normalize16bitData(voldata, verbose)

    saveVolume(voldata, volinfo, outdir, verbose)


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
    if verbose:
        print(filename, ext)
    ext = ext.lower()
    if ext == ".zip":
        processZipStack(infile, outdir, verbose)
    elif ext == ".tif" or ext == ".tiff":
        processTiffStack(infile, outdir, channel, timestep, verbose)
    elif ext == ".xrw":
        processXRWFile(infile, outdir, verbose)
    elif ext == ".nii" or ext == ".gz" or ".nii.gz" in infile:
        if ext == ".gz" and ".nii.gz" not in infile:
            shutil.move(infile, os.path.join(outdir, filename + '.nii.gz'))
            infile = os.path.join(outdir, filename + '.nii.gz')
        processNiftiFile(infile, outdir, timestep, verbose)
    else:
        raise NameError("wrong_input_file_ext")


# MAIN FUNCTION
if __name__ == "__main__":
    main(sys.argv[1:])