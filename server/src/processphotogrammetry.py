import os
import sys
import argparse
import zipfile
import os.path
import json
import shutil

def copyToDroneCluster(infile):
    call='scp -r ' +infile.replace('/photogrammetry.zip','') + ' handreas@monash@drone1.erc.monash.edu:e:/handreas/incoming/'
    print(call)
    os.system(call)
   
def triggerComputeOnDroneCluster(infile):
    tag=infile.replace('/mnt/data/git/previs/server/public/data/tags/','').replace('/photogrammetry.zip','')
    call="ssh handreas@monash@drone1.erc.monash.edu 'e:/handreas/dev/go.bat e:/handreas/incoming/011768_9f0e26'"
    print(call)
    os.system(call)
   
def main():
    
    """
    Main function
    Input: 
    Output: 
    """
    # parse parameters
    infile = ""
    outdir = ""
    verbose = False

    parser = argparse.ArgumentParser(description='Convert image to deep zoom using vips')
    parser.add_argument('-i', '--infile', dest='infile', help='name of input file to process')
    parser.add_argument('-o', '--outdir', dest='outdir', help='ouput directory e.g. /path/to/tags/avc233')
    parser.add_argument('-v', '--verbose', action='store_true', help='verbose')

    args = parser.parse_args()
    infile = args.infile
    outdir = args.outdir
    verbose = args.verbose
    
    if (infile == '' or outdir == ''):
        print >> sys.stderr, "wrong_input_args"
        raise NameError("wrong_input_args")

    # get absopath of outdir
    outdir = os.path.abspath(outdir)
    if not os.path.exists(outdir):
        os.makedirs(outdir)
    
    copyToDroneCluster(infile)
    triggerComputeOnDroneCluster(infile)
    
    retjson = {}
    retjson["status"] = "done"
    print(json.dumps(retjson))
    
# MAIN FUNCTION
if __name__ == "__main__":
    main()
    #cd /mnt/data/git/previs/server
    #cd ./src && python processphotogrammetry.py 
        #-i /mnt/data/git/previs/server/public/data/tags/011768_9f0e26/photogrammetry.zip 
        #-o /mnt/data/git/previs/server/public/data/tags/011768_9f0e26/photogrammetry_result && cd ..
    
