#!/usr/bin/env python
#convert mosaiced png X * Y * Z to tiff images in a folder

import os
import sys
import getopt
from PIL import Image
import subprocess

def help():
	print 'Usage: mos2tiffs [-h] -i mosaiced_image -o out_dir [-x x_res] [-y y_res] [-z z_res]'
	print 'Default value of X_res, Y_res, Z_res is 256'
	print 'Example: mos2tiffs -o tiffs data.jpg'

def main(argv):
    """
    Main function
    Input: daris cid and dicom directory
    """

    res = [256, 256, 256]

    # parse parameters
    try:
        opts, args = getopt.getopt(argv,"i:o:x:y:z:",["ifile", "odir=", "x_res", "y_res", "z_res"])
    except getopt.GetoptError:
        help()
        sys.exit(2)
     
    input_file = ''
    output_dir = ''
    for opt, arg in opts:
        if opt == '-h':
            help()
            sys.exit()
        elif opt in ("-i", "--ifile"):
            input_file = arg
        elif opt in ("-o", "--odir"):
            output_dir = arg
        elif opt in ("-x", "--x_res"):
        	res[0] = int(arg)
        elif opt in ("-y", "--y_res"):
        	res[1] = int(arg)
       	elif opt in ("-z", "--z_res"):
        	res[2] = int(arg)
            
    if (input_file == '' or output_dir == ''):
        help()
        sys.exit(2)

    print 'in file: ' + input_file + '\nout dir:' + output_dir
    print 'res: ' + str(res)

    im = Image.open(input_file)
    width, height = im.size

    ncols = width / res[0]

    for i in range(0, res[2]):
    	col = i / ncols
    	row = i % ncols
    	top_x = col * res[0]
    	top_y = row * res[1]
    	print 'top_x: ' + str(top_x) + ' top_y: ' + str(top_y)

    	output_filename = output_dir + '/%03d.tif' % (i)
    	print output_filename

    	region = '%dx%d+%d+%d' % (res[1], res[0], top_y, top_x)
    	print str(['convert', '-crop', region, input_file, output_filename])
    	subprocess.check_output(['convert', '-crop', region, input_file, output_filename])


# MAIN FUNCTION
if __name__ == "__main__":
    main(sys.argv[1:])