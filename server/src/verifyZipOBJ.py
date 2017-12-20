#!/usr/bin/env python
# verifyZipOBJ.py
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


'''
verifyZipOBJ takes an uploaded zip file and checks that it contains valid OBJ files.
'''

import os
# import subprocess
import sys
import argparse
# import logging
import zipfile


def FirstPassCheck(args):
    print 'Verifying files'


if __name__ == "__main__":

    # Parse command line arguments and validate img directory

    parser = argparse.ArgumentParser(
        usage='''verifyZipOBJ.py -i <zipfile> -o <output directory>  ''',
        description='''Create Websurfer model.tok file from obj files.
        Load a zip or directory (-i <file>) that contains OBJ  files.''')
    parser.add_argument('-i', '--input',
                        help='''Input directory or file name. Must be a
                        directory containing obj files, or a subdirectory with
                        obj files, or a zip file with similar properties ''',
                        required=True)
    parser.add_argument('-o', '--output',
                        help='''Output directory''', required=True)
    parser.add_argument('-v', '--verbose',
                        help='Verbose.', action="store_true")
    args = parser.parse_args()
    if args.verbose:
        print "Arguments:", args

    if not os.path.isdir(args.output):
        try:
            os.mkdir(args.output)
        except IOError as e:
            print ("I/O error({0}): {1}").format(e.errno, e.strerror)
        # print()rint 'Error: Folder \'' + args.output + '\' does not exist.'
        # sys.exit(1)

    if os.path.isfile(args.input) and args.input.endswith('.zip'):
        with zipfile.ZipFile(args.input, 'r') as inputzip:
            inputzip.printdir()
            inputzip.extractall(args.output)
            inputzip.close()
    elif os.path.isfile(args.input) and args.input.endswith('.obj'):
        try:
            os.mkdir('OBJdir')
        except IOError as e:
            print ("I/O error({0}): {1} ").format(e.errno, e.strerror)
        except:
            print "Unexpected error:", sys.exc_info()[0]
            raise
        try:
            os.rename(args.input, os.path.join(
                os.path.dirname(args.input),
                'OBJdir',
                os.path.basename(args.input))+'.obj')
        except IOError as e:
            print ("I/O error({0}): {1} ").format(e.errno, e.strerror)
        except:
            print "Unexpected error:", sys.exc_info()[0]
            raise
        args.input = os.path.join(
            os.path.dirname(args.input), 'OBJdir')
    else:
        print 'Error: Zip \'' + args.input + '\' does not exist.'
        sys.exit(1)

