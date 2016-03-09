import os
import sys
import getopt
import urllib2
import json

remote_host="http://mivp-dws1.erc.monash.edu:3000/"

#local_data_dir="/data/big/toand/previs/"
local_data_dir="/Users/toand/Downloads/previs/"

def help():
    print "run_cave2 -t input_tag"

def downloadfile(remote_file, local_file):
    u = urllib2.urlopen(remote_file)
    h = u.info()
    totalSize = int(h["Content-Length"])

    print "Downloading %s bytes..." % totalSize,
    fp = open(local_file, 'wb')

    blockSize = 8192 #100000 # urllib.urlretrieve uses 8192
    count = 0
    while True:
        chunk = u.read(blockSize)
        if not chunk: break
        fp.write(chunk)
        count += 1
        if totalSize > 0:
            percent = int(count * blockSize * 100 / totalSize)
            if percent > 100: percent = 100
            print "%2d%%" % percent,
            if percent < 100:
                print "\b\b\b\b\b",  # Erase "NN% "
            else:
                print "Done."

    fp.flush()
    fp.close()
    if not totalSize:
        print "Error to download file" + remote_file
        sys.exit(-1)

def main(argv):
    try:
        opts, args = getopt.getopt(argv,"t:",["tag="])
    except getopt.GetoptError:
        #help()
        sys.exit(-1)

    input_tag = ''
    for opt, arg in opts:
        if opt == '-h':
            help()
            sys.exit()
        elif opt in ("-t", "--tag"):
            input_tag = arg
            
    if(input_tag == ''):
        help()
        sys.exit(-1)

    print "Tag: " + input_tag
    
    #create tag directory
    tag_dir = local_data_dir + input_tag
    if not os.path.exists(tag_dir):
        os.makedirs(tag_dir)
    tag_dir += "/";

    #download json file
    print "Download " + input_tag + ".json file..."
    tag_json_filename = tag_dir + input_tag + ".json"
    downloadfile(remote_host + "data/info/" + input_tag + ".json", tag_json_filename)

    #parse json file
    with open(tag_json_filename) as tag_json_file:    
        data = json.load(tag_json_file)
        #download vol_json
        vol_type = data["type"]
        print "Type: " + vol_type
        
        if(vol_type == "localupload"):    
            vols = data["volumes"]
            for ii in range(len(vols)):
                print "Volume: " + str(ii)

                vol_json_filename = tag_dir + "vol1.json"
                vol_json = data["volumes"][ii]["json"]
                print "Download " + vol_json + " file..."
                downloadfile(remote_host + vol_json, vol_json_filename)

                vol_xrw_filename = tag_dir + "vol1.xrw"
                vol_xrw = data["volumes"][ii]["xrw"]
                print "Download " + vol_xrw + " file..."
                downloadfile(remote_host + vol_xrw, vol_xrw_filename)

        elif (vol_type == "daris"):
            cids = data["cid"]
            for ii in range(len(cids)):
                print "Volume: " + str(ii) 
                cid = cids[ii]

                vol_json_filename = tag_dir + cid + ".json"
                vol_json = "data/daris/" + cid + "/0001.json"
                print "Download " + vol_json + " file..."
                downloadfile(remote_host + vol_json, vol_json_filename)

                vol_xrw_filename = tag_dir + cid + ".xrw"
                vol_xrw = "data/daris/" + cid + "/0001.xrw"
                print "Download " + vol_xrw + " file..."
                downloadfile(remote_host + vol_xrw, vol_xrw_filename)

        else:
            print "invalid type"

    print "Done!"

# MAIN FUNCTION
if __name__ == "__main__":
    main(sys.argv[1:])