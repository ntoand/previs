#!/usr/bin/env python
''' Unpack OBJ zip package


  (C) 2016 Michael Eager (michael.eager@monash.edu)
  
'''


import os
import sys
import getopt
from PIL import Image
import subprocess
import zipfile
import json
import time
import shutil

MAX_FILESIZE = 150 * 1024 * 1024

def help():
        print 'Usage: unpackOBJzip.py [-h] -i input_file -o output_dir'


def jsonError(errstr):
        json_ret = {}
        json_ret['status'] = 'error'
        json_ret['result'] = errstr
        return json.dumps(json_ret)

def main(argv):
    """
    Main function
    Input: daris cid and dicom directory
    """
    # parse parameters
    try:
        opts, args = getopt.getopt(argv,"i:o:",["ifile odir"])
    except getopt.GetoptError:
        help()
        sys.exit(2)
     
    input_file = ''
    ouput_dir = ''
    for opt, arg in opts:
        if opt == '-h':
            help()
            sys.exit()
        elif opt in ("-i", "--ifile"):
            input_file = arg
        elif opt in ("-o", "--odir"):
            ouput_dir = arg
            
    if (input_file == '' or ouput_dir == ''):
        #help()
        #return jsonError("wrong_parameters")
        print >> sys.stderr, "wrong_input_args"
        raise NameError("wrong_input_args")

    list_obj_files = []

    # uncompress zip file
    
    filebasename = os.path.basename(input_file)
    filename = os.path.splitext(filebasename)[0]
    fileext = os.path.splitext(filebasename)[1]

    if(fileext != '.zip'):
        #return jsonError("not_zip_file")
        print >> sys.stderr, "not_a_zip_file"
        raise NameError("not_a_zip_file")

    filesize = os.path.getsize(input_file)
    if filesize > MAX_FILESIZE:
	    #return jsonError("file_size_too_big")
        print >> sys.stderr, "file_size_too_big"
        raise NameError("file_size_too_big")

    """
    zfile = zipfile.ZipFile(input_file)
    zfile.extractall(ouput_dir + '/' + filename)
    """
    #unzip
    subprocess.check_output(['unzip', input_file, '-d', ouput_dir + '/' + filename])

    # convert tif files to tga
    tga_dir = ouput_dir + '/' + filename + '_tga'
    subprocess.check_output(['mkdir', '-p', tga_dir])

    for root, dirs, files in os.walk(ouput_dir):
        for file in files:
            if file.endswith(".tif") or file.endswith(".tiff"):
                 list_tiff_files.append(os.path.join(root, file))

    if not len(list_tiff_files):
	   #return jsonError("no_tiff_file")
       print >> sys.stderr, "no_tiff_file_found"
       raise NameError("no_tiff_file_found")

    # check for number of tiff files here
    list_tiff_files.sort()
    index = 0
    res_x = -1
    res_y = -1

    for tiff_file in list_tiff_files:
        base=os.path.basename(tiff_file)
        
        if(index == 0):
            im=Image.open(tiff_file)
            res_x, res_y = im.size

        tga_file = tga_dir + '/' + '%04d.tga' % index
        index = index + 1
        #print >> sys.stderr, 'convert ' + tiff_file + ' to ' + tga_file
        subprocess.check_output(['convert', tiff_file, tga_file])
        
    res_z = len(list_tiff_files)

    result_dir = ouput_dir + '/' + filename + '_result'
    subprocess.check_output(['mkdir', '-p', result_dir])

    # clean up
    #os.remove(input_file)
    shutil.rmtree(ouput_dir + '/' + filename)
    #shutil.rmtree(tga_dir)

    # save vol info
    json_ret = {}
    json_ret['res_x'] = res_x
    json_ret['res_y'] = res_y
    json_ret['res_z'] = res_z
    """
    with open(result_dir + '/vol.json', 'w') as fp:
        json.dump(json_ret, fp)
    """

    print >> sys.stderr, "convert to tga done!"
    print json.dumps(json_ret)

    return 0

# MAIN FUNCTION
if __name__ == "__main__":
    #tic = time.clock()
    main(sys.argv[1:])
    #toc = time.clock()
    #print 'Processing time: ' + str(toc-tic)
