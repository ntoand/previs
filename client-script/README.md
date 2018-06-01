# Run previs at client side

## Sample bash script to call runprevis.py from sabi.js in CAVE2

```
#!/bin/bash

. /usr/share/Modules/3.2.10/init/bash
#module load omegalib/13-c++11
module load LavaVu/new
module load anaconda
export PATH=/home/toand/git/projects/vsviewer/build/CAVE2:${PATH}
/cave/sabi.js/scripts/GL-highperformance

cd /cave/git/previs/client-script
echo $1
xterm -e python runprevis.py -s https://mivp-dws1.erc.monash.edu:3000 -d /cave/git/previs/data $1
```