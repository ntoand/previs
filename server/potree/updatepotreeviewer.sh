#!/bin/sh

cd potree
./node_modules/gulp/bin/gulp.js build
cd ..

# run after build.sh
# now install to pointviewer (not PotreeConverter anymore)
rm -rf ../public/pointviewer/libs
cp -r potree/libs ../public/pointviewer
cp -r potree/build/potree ../public/pointviewer/libs
cp -r potree/libs/dat.gui ../public/pointviewer/libs
