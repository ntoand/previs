import os
import sys
import getopt
import urllib2
import json

#remote_host="http://mivp-dws1.erc.monash.edu:3000/"
#local_data_dir="/Users/toand/Downloads/previs/"

def help():
    print "run_prepare_data.py -t input_tag"

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
        raise NameError("Error to download file" + remote_file)
        #sys.exit(-1)

def main(argv):
    try:
        opts, args = getopt.getopt(argv,"t:s:d:",["tag=", "server=", "dir="])
    except getopt.GetoptError:
        raise NameError("Cannot parse input arguments")
        #help()
        #sys.exit(-1)

    input_tag = ''
    server = ''
    local_data_dir = ''
    for opt, arg in opts:
        if opt == '-h':
            help()
            sys.exit()
        elif opt in ("-t", "--tag"):
            input_tag = arg
        elif opt in ("-s", "--server"):
            server = arg
        elif opt in ("-d", "--dir"):
            local_data_dir = arg
            
    if(input_tag == '' or server == '' or local_data_dir == ''):
        #help()
        raise NameError("Wrong arguments")
        #sys.exit(-1)

    if ~server.endswith('/'):
        server += '/'
    if ~local_data_dir.endswith('/'):
        local_data_dir += '/'

    print "Tag: " + input_tag
    print "Server: " + server
    print "Local data dir: " + local_data_dir
    
    #create tag directory
    tag_dir = local_data_dir + input_tag
    if not os.path.exists(tag_dir):
        os.makedirs(tag_dir)
    tag_dir += "/";

    #download json file
    print "Download " + input_tag + ".json file..."
    tag_json_filename = tag_dir + input_tag + ".json"
    downloadfile(server + "data/info/" + input_tag + ".json", tag_json_filename)

    #parse json file
    with open(tag_json_filename) as tag_json_file:    
        data = json.load(tag_json_file)
        #download vol_json
        vol_type = data["type"]
        print "Type: " + vol_type
        source = data["source"]

        local_json = {}
        local_json["tag"] = input_tag
        local_json["type"] = data["type"]
        local_json["source"] = data["source"]
        local_json["date"] = data["date"]
        local_json["volumes"] = []
        
        if(vol_type == "volume" and source == "localupload"):    
            vols = data["volumes"]
            for ii in range(len(vols)):
                print "Volume: " + str(ii)

                vol_dir = tag_dir + "/vol" + str(ii) + "/"
                if not os.path.exists(vol_dir):
                    os.makedirs(vol_dir)

                vol_thumb_filename = vol_dir + "vol1_thumb.png"
                vol_thumb = data["volumes"][ii]["thumb"]
                print "Download " + vol_thumb + " file..."
                downloadfile(server + vol_thumb, vol_thumb_filename)

                vol_json_filename = vol_dir + "vol1.json"
                vol_json = data["volumes"][ii]["json"]
                print "Download " + vol_json + " file..."
                downloadfile(server + vol_json, vol_json_filename)

                vol_xrw_filename = vol_dir + "vol1.xrw"
                vol_xrw = data["volumes"][ii]["xrw"]
                print "Download " + vol_xrw + " file..."
                downloadfile(server + vol_xrw, vol_xrw_filename)

                vol_ele = {}
                vol_ele["thumb"] = vol_thumb_filename
                vol_ele["dir"] = vol_dir
                vol_ele["res"] = data["volumes"][ii]["res"]
                local_json["volumes"].append(vol_ele)

                with open(vol_dir + "/init.script", "wt") as f:
                    f.write("file " + vol_xrw_filename + "\n")
                    f.write("file " + vol_json_filename)

        elif (vol_type == "volume" and source == "daris"):
            cids = data["cid"]
            for ii in range(len(cids)):
                print "Volume: " + str(ii) 
                cid = cids[ii]

                vol_dir = tag_dir + '/vol' + str(ii) + "/"
                if not os.path.exists(vol_dir):
                    os.makedirs(vol_dir)

                vol_thumb_filename = vol_dir + cid + "_thumb.png"
                vol_thumb = "data/daris/" + cid + "/0001_thumb.png"
                print "Download " + vol_thumb + " file..."
                downloadfile(server + vol_thumb, vol_thumb_filename)

                vol_json_filename = vol_dir + cid + ".json"
                vol_json = "data/daris/" + cid + "/0001.json"
                print "Download " + vol_json + " file..."
                downloadfile(server + vol_json, vol_json_filename)

                vol_xrw_filename = vol_dir + cid + ".xrw"
                vol_xrw = "data/daris/" + cid + "/0001.xrw"
                print "Download " + vol_xrw + " file..."
                downloadfile(server + vol_xrw, vol_xrw_filename)

                vol_ele = {}
                vol_ele["thumb"] = vol_thumb_filename
                vol_ele["dir"] = vol_dir
                vol_ele["res"] = data["res"][ii]
                local_json["volumes"].append(vol_ele)

                with open(vol_dir + "/init.script", "wt") as f:
                    f.write("file " + vol_xrw_filename + "\n")
                    f.write("file " + vol_json_filename)

        else:
            raise NameError("Invalid type")
            #print "invalid type"

        with open(tag_dir + input_tag + "_local.json", 'w') as jf:
            json.dump(local_json, jf, sort_keys=True, indent=4)

    print "Done!"

# MAIN FUNCTION
if __name__ == "__main__":
    main(sys.argv[1:])