#!/usr/bin/env python
# make_token_file.py
# $Header$
# $Id$
# $Date$
#
#
# Copyright 2016 Michael Eager (michael.eager@monash.edu)
#
# This file is part of the previs package
# See https://github.com/mivp/previs/ for documentation.
#
# previs is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# previs is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with previs. If not, see <http://www.gnu.org/licenses/>.

"""
Model tok files are generated using older formats for websurfer

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

xkcd_cmap = np.array([[0,    0.4470,   0.7410],
                      [0.8500,    0.3250,   0.0980],
                      [0.9290, 0.6940,    0.1250],
                      [0.4940,   0.1840,    0.5560],
                      [0.4660,   0.6740, 0.1880],
                      [0.3010,   0.7450, 0.9330],
                      [0.6350,   0.0780, 0.1840]])


def hex_to_rgb(value):
    value = value.lstrip('#')
    lv = len(value)
    rgb = tuple(int(value[i:i + lv // 3], 16) for i in range(0, lv, lv // 3))
    return np.array([float(rgb[0]) / 256.0,    float(rgb[1]) / 256.0, float(rgb[2]) / 256.0])


crayons_cmap = np.array([
    hex_to_rgb("#FEFEFA"),  # Baby Powder
    hex_to_rgb("#FFD12A"),  # Banana
    hex_to_rgb("#4F86F7"),  # Blueberry
    hex_to_rgb("#FFD3F8"),  # Bubble Gum
    hex_to_rgb("#C95A49"),  # Cedar Chest
    hex_to_rgb("#DA2647"),  # Cherry
    hex_to_rgb("#BD8260"),  # Chocolate
    hex_to_rgb("#FEFEFE"),  # Coconut
    hex_to_rgb("#FFFF31"),  # Daffodil
    hex_to_rgb("#9B7653"),  # Dirt
    hex_to_rgb("#44D7A8"),  # Eucalyptus
    hex_to_rgb("#A6E7FF"),  # Fresh Air
    hex_to_rgb("#6F2DA8"),  # Grape
    hex_to_rgb("#DA614E"),  # Jelly Bean
    hex_to_rgb("#253529"),  # Leather Jacket
    hex_to_rgb("#FFFF38"),  # Lemon
    hex_to_rgb("#1A1110"),  # Licorice
    hex_to_rgb("#DB91EF"),  # Lilac
    hex_to_rgb("#B2F302"),  # Lime
    hex_to_rgb("#FFE4CD"),  # Lumber
    hex_to_rgb("#214FC6"),  # New Car
    hex_to_rgb("#FF8866"),  # Orange
    hex_to_rgb("#FFD0B9"),  # Peach
    hex_to_rgb("#45A27D"),  # Pine
    hex_to_rgb("#FF5050"),  # Rose
    hex_to_rgb("#FFCFF1"),  # Shampoo
    hex_to_rgb("#738276"),  # Smoke
    hex_to_rgb("#CEC8EF"),  # Soap
    hex_to_rgb("#FC5A8D"),  # Strawberry
    hex_to_rgb("#FF878D"),  # Tulip
])


qualitative_brew = np.array([	hex_to_rgb('#a6cee3'),
                              hex_to_rgb('#1f78b4'),
                              hex_to_rgb('#b2df8a'),
                              hex_to_rgb('#33a02c'),
                              hex_to_rgb('#fb9a99'),
                              hex_to_rgb('#e31a1c'),
                              hex_to_rgb('#fdbf6f'),
                              hex_to_rgb('#ff7f00'),
                              hex_to_rgb('#cab2d6'),
                              hex_to_rgb('#6a3d9a'),
                              hex_to_rgb('#ffff99'),
                              hex_to_rgb('#b15928')])


cmap = crayons_cmap
num_colours = len(cmap)


def CreateModelTokFile(args, model_token_filename):
    print 'Creating model.tok file'

    # Ready to go
    files = os.listdir(args.output)
    if args.verbose:
        print files

    title, caption = [], []
    if 'comments.txt' in files:
        with open('comments.txt', 'w') as comments:
            title = comments.readline()
            caption = comments.read()
        comments.close()
    else:
        title = 'Mesh viewer for CAVE2 - ' + args.output
        caption = ""

    # print model_token_filename
    tok_file = open(model_token_filename, 'w')
    tok_file.write('''title_frag:%s
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
''' % (title, caption))
    grps = ['Root folder']
    glabel = ["a"]
    opacity = 0.8
    gindex = 0
    for subdir in files:
        print subdir
        if os.path.isdir(os.path.join(args.output, subdir)):

            grps.append(subdir)
            print subdir
            tok_file.write('''grps:%s:%s:true\n''' % (subdir, glabel[gindex]))
            glabel.append(chr(ord(glabel[gindex]) + 1))
            gindex = gindex + 1
    gindex = -1
    print 'Sub directory objects'
    for element in files:
        if os.path.isfile(os.path.join(args.output, element)) and element.endswith('.obj'):
            print element + ' is a file '
            # format:  objs:<object name>:<group label>:<filename>:R:G:B:A
            tok_file.write('''objs:%s:%s:%s:%.2f:%.2f:%.2f:%.2f\n''' %
                           (os.path.basename(element),
                            'Z', element, cmap[0, 0],
                            cmap[0, 1], cmap[0, 2],
                            opacity))
        if os.path.isdir(os.path.join(args.output, element)):
            gindex = gindex + 1
            print element + ' is a directory '
            subfiles = os.listdir(os.path.join(args.output, element))
            for subelement in subfiles:
                if os.path.isfile(os.path.join(args.output, element, subelement)) and subelement.endswith('.obj'):
                    print subelement
                    # format:  objs:<object name>:<group
                    # label>:<filename>:R:G:B:A
                    tok_file.write('''objs:%s:%s:%s:%.2f:%.2f:%.2f:%.2f\n''' %
                                   (element + '  ' + subelement[:-4],
                                    glabel[gindex], os.path.join(
                                        element, subelement),
                                       cmap[gindex % num_colours, 0],
                                       cmap[gindex % num_colours, 1],
                                       cmap[gindex % num_colours, 2],
                                       opacity))
    tok_file.close


if __name__ == "__main__":

    # Parse command line arguments and validate img directory

    parser = argparse.ArgumentParser(
        usage='''make_token_file.py -i <zipfile>|<directory>  ''',
        description='''Create Websurfer model.tok file from obj files.  Load a zip or directory (-i <file>) that contains OBJ  files.    ''' )
    parser.add_argument(
        '-i', '--input', help='''Input directory or file name. Must be a directory containing obj files, or a subdirectory with obj files, or a zip file with similar properties ''', required=True)
 parser.add_argument(
        '-i', '--input', help='''Input directory or file name. Must be a directory containing obj files, or a subdirectory with obj files, or a zip file with similar properties ''', required=True)
    parser.add_argument(
        '-o', '--output', help='''Output directory''', required=True)
    parser.add_argument('-v', '--verbose', help='Verbose.',
                        action="store_true")
    args = parser.parse_args()
    if args.verbose:
        print "Arguments:", args

    if os.path.isfile(args.input) and args.input.endswith('.zip'):
        with zipfile.ZipFile(args.input, 'r') as inputzip:
            if not os.path.isdir(args.output):
                os.mkdir(args.output)

            inputzip.printdir()
            inputzip.extractall(args.output)
            inputzip.close()
    else:
        print 'Error: Zip \'' + args.input + '\' does not exist.'
        sys.exit(1)

    if not os.path.isdir(args.output):
        print 'Error: Folder \'' + args.input + '\' does not exist.'
        sys.exit(1)

    model_token_filename = os.path.join(args.output, 'model.tok')
    print model_token_filename
    if not os.path.isfile(model_token_filename):
        CreateModelTokFile(args, model_token_filename)

    tok_file = open(model_token_filename, 'r')
    tmp = tok_file.read()
    print tmp
    tok_file.close()
