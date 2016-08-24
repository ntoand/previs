#!/usr/bin/env python
# make_lavaVu_initscript.py
#    Create init.script fpr LavaVu from directory of OBJ files.
#  This can be used with a zip/gzip file
#  Usage: make_lavaVu_initscript.py -i [Folder name | zip file]
#
# Michael Eager

# Copyright 2016 Michael Eager (michael.eager@monash.edu)
#
# This file is part of the websurfer package
# See https://github.com/mivp/websurfer/ for documentation.
#
# websurfer is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# websurfer is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with websurfer. If not, see <http://www.gnu.org/licenses/>.

"""

"""

import os
import subprocess
import sys
import glob
import re
import numpy as np
import argparse
import logging
import zipfile
import tarfile

#import seaborn as sns

# cmap = np.array([[0,    0.4470 ,   0.7410],
#         [0.8500,    0.3250 ,   0.0980],
#         [0.9290   , 0.6940,    0.1250],
#         [0.4940 ,   0.1840,    0.5560],
#         [0.4660 ,   0.6740    ,0.1880],
#         [0.3010 ,   0.7450    ,0.9330],
#         [0.6350 ,   0.0780    ,0.1840]])

cmap = np.array([[0.3333, 0.3333, 0.0000],
                 [0.3333, 0.6667, 0.0000],
                 [0.3333, 1.0000, 0.0000],
                 [0.6667, 0.3333, 0.0000],
                 [0.6667, 0.6667, 0.0000],
                 [0.6667, 1.0000, 0.0000],
                 [1.0000, 0.3333, 0.0000],
                 [1.0000, 0.6667, 0.0000],
                 [1.0000, 1.0000, 0.0000],
                 [0.0000, 0.3333, 0.5000],
                 [0.0000, 0.6667, 0.5000],
                 [0.0000, 1.0000, 0.5000],
                 [0.3333, 0.0000, 0.5000],
                 [0.3333, 0.3333, 0.5000],
                 [0.3333, 0.6667, 0.5000],
                 [0.3333, 1.0000, 0.5000],
                 [0.6667, 0.0000, 0.5000],
                 [0.6667, 0.3333, 0.5000],
                 [0.6667, 0.6667, 0.5000],
                 [0.6667, 1.0000, 0.5000],
                 [1.0000, 0.0000, 0.5000],
                 [1.0000, 0.3333, 0.5000],
                 [1.0000, 0.6667, 0.5000],
                 [1.0000, 1.0000, 0.5000],
                 [0.0000, 0.3333, 1.0000],
                 [0.0000, 0.6667, 1.0000],
                 [0.0000, 1.0000, 1.0000],
                 [0.3333, 0.0000, 1.0000],
                 [0.3333, 0.3333, 1.0000],
                 [0.3333, 0.6667, 1.0000],
                 [0.3333, 1.0000, 1.0000],
                 [0.6667, 0.0000, 1.0000],
                 [0.6667, 0.3333, 1.0000],
                 [0.6667, 0.6667, 1.0000],
                 [0.6667, 1.0000, 1.0000],
                 [1.0000, 0.0000, 1.0000],
                 [1.0000, 0.3333, 1.0000],
                 [1.0000, 0.6667, 1.0000],
                 [0.1667, 0.0000, 0.0000],
                 [0.3333, 0.0000, 0.0000],
                 [0.5000, 0.0000, 0.0000],
                 [0.6667, 0.0000, 0.0000],
                 [0.8333, 0.0000, 0.0000],
                 [1.0000, 0.0000, 0.0000],
                 [0.0000, 0.1667, 0.0000],
                 [0.0000, 0.3333, 0.0000],
                 [0.0000, 0.5000, 0.0000],
                 [0.0000, 0.0000, 1.0000],
                 [0.0000, 0.0000, 0.0000],
                 [0.1429, 0.1429, 0.1429],
                 [0.2857, 0.2857, 0.2857],
                 [0.4286, 0.4286, 0.4286],
                 [0.5714, 0.5714, 0.5714],
                 [0.7143, 0.7143, 0.7143],
                 [0.8571, 0.8571, 0.8571],
                 [1.0000, 1.0000, 1.0000]])


palette = np.array([[166.0 / 256.0, 206.0 / 256.0, 227.0 / 256.0],
                    [31.0 / 256.0, 120.0 / 256.0, 180.0 / 256.0],
                    [178.0 / 256.0, 223.0 / 256.0, 138.0 / 256.0],
                    [51.0 / 256.0, 160.0 / 256.0, 44.0 / 256.0],
                    [251.0 / 256.0, 154.0 / 256.0, 153.0 / 256.0],
                    [227.0 / 256.0, 26.0 / 256.0, 28.0 / 256.0],
                    [253.0 / 256.0, 191.0 / 256.0, 111.0 / 256.0],
                    [255.0 / 256.0, 127.0 / 256.0, 0.0 / 256.0],
                    [202.0 / 256.0, 178.0 / 256.0, 214.0 / 256.0],
                    [106.0 / 256.0, 61.0 / 256.0, 154.0 / 256.0],
                    [255.0 / 256.0, 255.0 / 256.0, 153.0 / 256.0],
                    [177.0 / 256.0, 89.0 / 256.0, 40.0 / 256.0]])
npal = 12


if __name__ == "__main__":

    # Parse command line arguments and validate img directory

    parser = argparse.ArgumentParser(usage='''make_lavaVu_script.py -i <zipfile>|<directory>  ''',
                                     description='''Create Websurfer model.tok file from obj files.  Load a zip or directory (-i <file>) that contains OBJ  files.    ''' )
    parser.add_argument(
        '-i', '--input', help='''Input directory or file name. Must be a directory containing obj files, or a subdirectory with obj files, or a zip file with similar properties ''', required=True)
    parser.add_argument('-v', '--verbose', help='Verbose.',
                        action="store_true")
    args = parser.parse_args()
    if args.verbose:
        print args
    if not os.path.exists(args.input):
        print 'Error: Folder \'' + args.input + '\' does not exist.'
#        logging.error(' Folder \'' + args.input + '\' does not exist.')
        sys.exit(1)

    objdir = ""
    if os.path.isfile(args.input) and args.input.endswidth('.zip'):
        with zipfile.Zipfile(args.input, 'r') as inputzip:
            objdir = inputzip.printdir()
            inputzip.extractall()
            inputzip.close()

    elif os.path.isfile(args.input) and tarfile.is_tarfile(args.input):
        with tarfile.open(args.input) as inputtar:
            objdir = inputtar.firstmember.name
            inputtar.extractall()

    if not objdir:
        objdir = args.input
    objdir = os.path.abspath(objdir)
    if not os.path.isdir(objdir):
        print 'Error: Folder \'' + objdir + '\' does not exist.'
        print 'Input args: ' + args.input
        sys.exit(1)

    # Ready to go
    files = os.listdir(args.input)
    if args.verbose:
        print files

    title, caption = [], []
    if 'comments.txt' in files:
        with open('comments.txt', 'r') as comments:
            title = comments.readline()
            caption = comments.read()
        comments.close()
    else:
        title = 'Mesh viewer for CAVE2 - ' + args.input
        caption = ""

    if 'init.script' not in files:
        print 'Creating init.script file'
        script_filename = os.path.join(args.input, 'init.script')

        tmp_file = open(script_filename, 'w')
        tmp_file.write('''verbose
trisplit=1
swapyz=true

''' )
        grps = [args.input]  # top level obj files go in
        glabel = ["a"]
        opacity = 0.4
        gindex = 0
        obj_names = list()
        for subdir in files:
            if os.path.isdir(os.path.join(args.input, subdir)):
                grps.append(subdir)
                print 'Found directory', subdir
                #tmp_file.write('''grps:%s:%s:true\n''' % (subdir,glabel[gindex]))
                glabel.append(chr(ord(glabel[gindex]) + 1))
                gindex = gindex + 1
        nsubdirs = gindex
        gindex = -0
        print 'Printing objects'

        if glob.glob(args.input + '/*.obj'):
            for element in files:
                if os.path.isfile(os.path.join(args.input, element)) and element.endswith('.obj'):
                    print element + ' is a file '
                    # format:  file <filename>\n
                    tmp_file.write('file "%s"\n' % element)
                    gindex = gindex + 1
            if gindex > 0:
                tmp_file.write('''colour 1 [%.2f,%.2f,%.2f,%.1f]\n\n''' %
                               (cmap[0, 0],
                                cmap[0, 1], cmap[0, 2],
                                opacity))
        ntoplevelfiles = gindex
        gindex = 1
        firstobj = 1
        for element in files:
            if os.path.isdir(os.path.join(args.input, element)):
                print element + ' is a directory '
                subfiles = os.listdir(os.path.join(args.input, element))

                if glob.glob(os.path.join(args.input, element) + '/*.obj'):
                    tmp_file.write('select\n')  # Clear selected objects
                    gindex = gindex + 1
                    obj_names.append(element)
                    firstobj = 1
                    for subelement in subfiles:
                        if subelement.endswith('.obj'):
                            # os.path.isfile(os.path.join(args.input,element,subelement))
                            # and
                            print subelement
                            # format:  file <filename>\ncolour [R,G,B,A]\n
                            tmp_file.write('''file "%s"\n''' %
                                           os.path.join(element, subelement))
                            if firstobj:
                                tmp_file.write('select %d\n' % (gindex - 1))
                                firstobj = 0
                            tmp_file.write('''colour [%.2f,%.2f,%.2f,%.1f]\n''' %
                                           (cmap[gindex % 64, 0],
                                            cmap[gindex % 64, 1], cmap[
                                                gindex % 64, 2],
                                            opacity))
                tmp_file.write('\n')
        tmp_file.write('select\n\n')

        for i in xrange(0, ntoplevelfiles):
            tmp_file.write('''select %d
colour=[170,151,114]
opacity=0.5
''' % (i))
        tmp_file.write('\n')
        if any(obj_names):
            tmp_file.write('select\n')
            for i in xrange(0, len(obj_names)):
                tmp_file.write('name %d "%s"\n' %
                               (ntoplevelfiles + i + 1, obj_names[i]))

        tmp_file.write('''
# translation 0 0 -120
rotation 0 1 0 0

border off
axis off
list objects
''' )

        tmp_file.close()

    print '###########init.script###############'

    tmp_file = open(script_filename, 'r')
    tmp = tmp_file.read()
    print tmp
    tmp_file.close()
