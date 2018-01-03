#!/bin/sh

dir=`pwd`

#build LASzip
cd ${dir}/LAStools/LASzip
mkdir -p build
cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make

#build PotreeConverter
cd ${dir}/PotreeConverter
mkdir -p build
cd build
cmake -DCMAKE_BUILD_TYPE=Release -DLASZIP_INCLUDE_DIRS=${dir}/LAStools/LASzip/dll -DLASZIP_LIBRARY=${dir}/LAStools/LASzip/build/src/liblaszip.so ..
make
cd PotreeConverter
unlink resources
ln -s ../../PotreeConverter/resources .
