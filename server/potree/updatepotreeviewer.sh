#!/bin/sh

# run after build.sh
rm -rf PotreeConverter/build/PotreeConverter/resources/page_template/libs
cp -r potree/libs PotreeConverter/build/PotreeConverter/resources/page_template
cp -r potree/build/potree PotreeConverter/build/PotreeConverter/resources/page_template/libs
cp -r potree/libs/dat.gui PotreeConverter/build/PotreeConverter/resources/page_template/libs
cp -r viewer_template.html potree/libs PotreeConverter/build/PotreeConverter/resources/page_template