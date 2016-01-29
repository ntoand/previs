#!/usr/bin/env python
#convert DICOM files into nifiti files
# input: DICOM directory
# output: nifti files in the same directory 

import os
import sys
import getopt
import subprocess
import json

def help():
	print 'Usage: dcm2nii.py [-h] -i input_dir'
 	print 'Example: dcm2nii.py -i /path/to/dicom_study'

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
        opts, args = getopt.getopt(argv,"i:",["ifile"])
    except getopt.GetoptError:
        help()
        sys.exit(2)
     
    input_dir = ''
    for opt, arg in opts:
        if opt == '-h':
            help()
            sys.exit()
        elif opt in ("-i", "--ifile"):
            input_dir = arg
            
    if (input_dir == ''):
        #help()
        #return jsonError("wrong_parameters")
        print >> sys.stderr, "wrong_input_args"
        raise NameError("wrong_input_args")

    #unzip
    subprocess.check_output(['unzip', input_dir+'.zip', '-d', input_dir])

    # convert to nifti
    subprocess.check_output(['java', '-jar', 'loni-debabeler.jar', '-mapping', 'DicomToNifti_Wilson_14Aug2012.xml',
                             '-target', 'nifti', '-recursive', '-input', input_dir])

    # remove dcm files
    subprocess.check_output(['find', input_dir, '-name', '*.dcm', '-type', 'f', '-delete'])

    # rename the first file to 0001.nii
    count = 1
    for filename in os.listdir(input_dir):
        if filename.endswith(".nii"):
            newname = '%04d.nii' % count
            count = count + 1
            os.rename(input_dir+'/'+filename, input_dir+'/'+newname)

    return 0

# MAIN FUNCTION
if __name__ == "__main__":
    #tic = time.clock()
    main(sys.argv[1:])
    #toc = time.clock()
    #print 'Processing time: ' + str(toc-tic)
