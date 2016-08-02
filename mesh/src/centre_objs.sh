#!/bin/sh
#
# Wrapper for objcentre - with emergency rollback
#
# Copyright (C) 2016  Michael Eager (michael.eager@monash.edu)
# Licence:  GPLv3

set -e  # Disable error in case objcentre fails
E_BADDIR=85                       # No such directory.
ARGS=1         # Script requires only 1 argument.
E_BADARGS=85   # Wrong number of arguments passed to script.

if [ $# -ne "$ARGS" ]
then
    echo "Usage: `basename $0` path/to/obj/root"
    exit $E_BADARGS
fi

if [ -d "$1" ]
then
    obj_dir=$1
else
    echo "Directory \"$1\" does not exist."
    exit $E_BADARGS
fi

# Hard work
find ${obj_dir} -type f -name '*.obj' | xargs -t objcentre

# Review and clean up
if [ "$?" -ne 0 ]; then
    echo "ObjCentre failed rolling back any -orig files with empty"
    for orig in $(find ${obj_dir} -type f -name '*-orig.obj');do
        centred_file=$(echo $(orig)| sed 's/-orig//')
        # if newly created obj is empty, move the original back
        if [ -s ${centred_file} ];then 
            rm -f ${orig}
        else
            mv ${orig} ${centred_file}
        fi
    done
else
    echo "ObjCentre: successful - deleting all -orig files"
    find ${obj_dir} -type f -name '*-orig.obj' -delete
fi
