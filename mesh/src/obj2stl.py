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
import sys,glob
import re
import numpy as np
import argparse
import logging
import zipfile



def convertobj2stl(ifilename,ofilename):
    obj = open(ifilename)
    _, _, _, _, _, _, np = obj.readline().strip().split()
    np = int(np)
    vertices=[]
    normals=[]
    triangles=[]

    # np vertices as (x,y,z)
    min_x, min_y, min_z = 0, 0, 0
    for i in range(np):
        x, y, z = map(float,obj.readline().strip().split()) 
        min_x, min_y, min_z = min(x,min_x), min(y,min_y), min(z,min_z)
        vertices.append((x, y, z))
    # move object to the positive quadrant
    for i in range(np): 
        x,y,z = vertices[i]
        vertices[i] = (x-min_x,y-min_y,z-min_z)

    assert obj.readline().strip() == ""
    # np normals as (x,y,z)
    for i in range(np):
        normals.append(tuple(map(float,obj.readline().strip().split())))

    assert obj.readline().strip() == ""
    nt=int(obj.readline().strip().split()[0]) # number of triangles
    _, _, _, _, _ = obj.readline().strip().split()
    assert obj.readline().strip() == ""
    # rest of the file is a list of numbers
    points = map(int, "".join(obj.readlines()).strip().split())
    points = points[nt:]  # ignore these.. (whatever they are)
    for i in range(nt): 
        triangles.append((points.pop(0), points.pop(0), points.pop(0)))

    print "solid surface"
    for triangle in triangles: 
        x1, y1, z1 = vertices[triangle[0]]
        x2, y2, z2 = vertices[triangle[1]]
        x3, y3, z3 = vertices[triangle[2]]
        # normal = (v2 - v1)x(p3-p1)
        # normal = (  (y2-y1)*(z3-z1)-(y3-y1)*(z2-z1), 
        #            (z2-z1)*(x3-x1)-(x2-x1)*(z3-z1), 
        #            (x2-x1)*(y3-y1)-(x2-x1)*(y2-y1) )
        print "\tfacet normal {0} {1} {2}".format(0, 0, 0)
        print "\t\tvertex {0:e} {1:e} {2:e}".format(x1, y1, z1)
        print "\t\tvertex {0:e} {1:e} {2:e}".format(x2, y2, z2)
        print "\t\tvertex {0:e} {1:e} {2:e}".format(x3, y3, z3)
        print "\tendloop"
    print "endfacet"


if __name__ == "__main__":

    # Parse command line arguments and validate img directory

    parser = argparse.ArgumentParser(usage='''obj2stl.py -i <zipfile>|<directory>|OBJ file  ''',                                     description='''Create Websurfer model.tok file from obj files.  Load a zip or directory (-i <file>) that contains OBJ  files.    ''' )
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

    
