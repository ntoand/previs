#!/usr/bin/env python
# $Header$
# $Id$
# $Date$
#
#
# Copyright 2015,2016 Michael Eager (michael.eager@monash.edu)
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
import re
import numpy as np
import argparse
import logging
import zipfile

#import seaborn as sns

cmap = np.array([[0,    0.4470 ,   0.7410],
         [0.8500,    0.3250 ,   0.0980],
         [0.9290   , 0.6940,    0.1250],
         [0.4940 ,   0.1840,    0.5560],
         [0.4660 ,   0.6740    ,0.1880],
         [0.3010 ,   0.7450    ,0.9330],
         [0.6350 ,   0.0780    ,0.1840]])


if __name__ == "__main__":

    # Parse command line arguments and validate img directory

    parser = argparse.ArgumentParser(usage='''make_token_file.py -i <zipfile>|<directory>  ''',                                     description='''Create Websurfer model.tok file from obj files.  Load a zip or directory (-i <file>) that contains OBJ  files.    ''' )
    parser.add_argument(
        '-i', '--input', help='''Input directory or file name. Must be a directory containing obj files, or a subdirectory with obj files, or a zip file with similar properties ''', required=True)
    parser.add_argument(        '-v', '--verbose', help='Verbose.', action="store_true")
    args = parser.parse_args()
    if args.verbose:
        print args
    if not os.path.exists(args.input):
        print 'Error: Folder \'' + args.input+ '\' does not exist.'
#        logging.error(' Folder \'' + args.input + '\' does not exist.')
        sys.exit(1)


    if  os.path.isfile(args.input) and os.path.endswidth('.zip'):
        with zipfile.Zipfile(args.input,'r') as inputzip:
            inputzip.printdir()
            inputzip.extractall()
            inputzip.close()
        args.input = os.path.dirname(args.input)
    if not os.path.isdir(args.input):
        print 'Error: Folder \'' + args.input+ '\' does not exist.'
        sys.exit(1)

    # Ready to go
    files = os.listdir(args.input)
    if args.verbose:
        print files

    title,caption=[],[]
    if 'comments.txt' in files:
        with open('comments.txt','w') as comments:
            title = comments.readline()
            caption = comments.read()
        comments.close()
    else:
        title = 'Mesh viewer for CAVE2 - ' + args.input
        caption = ""

    if 'model.tok' not in files:
        print 'Creating model.tok file'
        model_token_filename = os.path.join(args.input,'model.tok')


        tmp_file = open(model_token_filename, 'w')
        tmp_file.write('''title_frag:%s
pdf_footer_txt:%s
camera_position:0:-180:0
camera_lookat:-40:0:0
camera_up:0:0:1
views:Left lateral:0,-180,0:-40,0,0:0,0,1
views:Right lateral:0,180,0:-40,0,0:0,0,1
views:Anterior:-180,0,0:-40,0,0:0,0,1
views:Posterior:180,0,0:-40,0,0:0,0,1
views:Dorsal:0,0,240:-40,0,0:1,0,0
views:Ventral:0,0,-240:-40,0,0:-1,0,0
grps:All:Z:true
''' % (title,caption))
        grps=[args.input]
        glabel=["a"]
        opacity=1.0
        gindex=0
        for subdir in files:
            print subdir
            if os.path.isdir(os.path.join(args.input,subdir)):
                grps.append(subdir)
                print subdir
                tmp_file.write('''grps:%s:%s:true\n''' % (subdir,glabel[gindex]))
                glabel.append(chr(ord(glabel[gindex]) + 1))
                gindex=gindex+1
        gindex=-1
        print 'Objects'
        for element in files:
            if os.path.isfile(os.path.join(args.input,element)) and element.endswith('.obj'):
                print element + ' is a file '
                #format:  objs:<object name>:<group label>:<filename>:R:G:B:A
                tmp_file.write('''objs:%s:%s:%s:%.2f:%.2f:%.2f:%.2f\n''' %
                               (os.path.basename(element),
                                'Z', element,cmap[0,0],
                                cmap[0,1],cmap[0,2],
                                opacity))
            if os.path.isdir( os.path.join(args.input,element)):
                gindex=gindex+1
                print element + ' is a directory '
                subfiles = os.listdir(os.path.join(args.input,element))
                for subelement in subfiles:
                    if os.path.isfile(os.path.join(args.input,element,subelement)) and subelement.endswith('.obj'):
                        print subelement
                        #format:  objs:<object name>:<group label>:<filename>:R:G:B:A
                        tmp_file.write('''objs:%s:%s:%s:%.2f:%.2f:%.2f:%.2f\n''' %
                               (element+'  '+subelement[:-4],
                                glabel[gindex], os.path.join(element,subelement),
                                cmap[gindex%7,0],
                                cmap[gindex%7,1], cmap[gindex%7,2],
                                opacity))
        tmp_file.close()


    tmp_file = open(model_token_filename, 'r')
    tmp = tmp_file.read()
    print tmp
    tmp_file.close()
