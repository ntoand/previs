#!/usr/bin/env bash 
#
# Wrapper for objcentre - with emergency rollback
#
# Copyright (C) 2016  Michael Eager (michael.eager@monash.edu)
# Licence:  GPLv3
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
###############################################

PROGNAME=$(basename "$0")
function error_exit(){
    echo "${PROGNAME}: ${1:-Unknown error}" 1>&2
    # Fail gracefully
    exit 0
}


E_BADDIR=85    # No such directory.
E_BADARGS=65   # Wrong number of arguments passed to script.
ARGS=1         # Script requires only 1 argument but can recieve 2 for quiet '-q'.
QUIET=0
obj_dir=""


if [ $# -lt "$ARGS" ] || [ $# -gt "2" ]
then
    echo "Usage: $PROGNAME [-q] path/to/obj/dir"
    exit $E_BADARGS
fi

if [ $# -eq "2" ] && [ "$1" = "-q" ]; then
    QUIET=1
    obj_dir="$2"
else
    obj_dir="$1"
fi

if [ ! -d "${obj_dir}" ]; then
    echo "Directory ${obj_dir} does not exist."
    exit $E_BADDIR
fi

# Delete any trailing slash
obj_dir="${obj_dir%/}"

if [ -z ${S2PATH+x} ]; then
    echo "BoundingBox: 0 0 0 0 0 0" > "${obj_dir}"/boundingbox.txt
    error_exit "S2PATH is not set. Cannot run objcentre."
fi

if [ ! -x objcentre ]; then
    echo "BoundingBox: 0 0 0 0 0 0" > "${obj_dir}"/boundingbox.txt
    error_exit "objcentre is not in PATH.  Ensure that S2PATH is in PATH environment variable."
fi



set +e  # Disable error in case objcentre fails
        # Hard work - allow bad return 
QARGS=""
[ "$QUIET" = "1" ] && QARGS="-q"

bb=$( find "${obj_dir}" -type f -name '*.obj' | xargs -t objcentre ${QARGS} )
# Review and clean up
if [ "$?" -ne 0 ]; then
    set -e
    echo "ObjCentre failed rolling back any -orig files with empty"
    for orig in $( find ${obj_dir} -type f -name '*-orig.obj' );do
        centred_file="${orig//-orig/}"
        # if newly created obj is empty, move the original back
        if [ -s "${centred_file}" ];then
            if [ -f "${orig}" ];then
                rm -f "${orig}"
            else
                error_exit "objcentre and rollback orig failed."
            fi
        else

            mv -f "${orig}" "${centred_file}"
        fi
    done
else
    [ "$QUIET" = "1" ] &&  echo "ObjCentre: successful - deleting all -orig files"
    find "${obj_dir}" -type f -name '*-orig.obj' -delete
fi

#bb=$(echo $bb | awk '/^BoundingBox:"/ {$1=""}1' )
echo "${bb}"
echo "${bb}" > "${obj_dir}"/boundingbox.txt
exit 
