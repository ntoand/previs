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

    if not server.endswith('/'):
        server += '/'
    if not local_data_dir.endswith('/'):
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
        # download dataset_json
        dataset_type = data["type"]
        print "Type: " + data["type"]
        source = data["source"]

        local_json = {}
        local_json["tag"] = input_tag
        local_json["type"] = data["type"]
        local_json["source"] = data["source"]
        local_json["date"] = data["date"]
        
        if(dataset_type == "volume" and source == "localupload"):    
            local_json["volumes"] = []

            vols = data["volumes"]
            for ii in range(len(vols)):
                print "Volume: " + str(ii)

                dataset_dir = tag_dir + "/vol" + str(ii) + "/"
                if not os.path.exists(dataset_dir):
                    os.makedirs(dataset_dir)

                dataset_thumb_filename = dataset_dir + "vol1_thumb.png"
                dataset_thumb = data["volumes"][ii]["thumb"]
                print "Download " + dataset_thumb + " file..."
                downloadfile(server + dataset_thumb, dataset_thumb_filename)

                dataset_json_filename = dataset_dir + "vol1.json"
                dataset_json = data["volumes"][ii]["json"]
                print "Download " + dataset_json + " file..."
                downloadfile(server + dataset_json, dataset_json_filename)

                dataset_xrw_filename = dataset_dir + "vol1.xrw"
                dataset_xrw = data["volumes"][ii]["xrw"]
                print "Download " + dataset_xrw + " file..."
                downloadfile(server + dataset_xrw, dataset_xrw_filename)

                dataset_ele = {}
                dataset_ele["thumb"] = dataset_thumb_filename
                dataset_ele["dir"] = dataset_dir
                dataset_ele["res"] = data["volumes"][ii]["res"]
                dataset_ele["name"] = ""
                local_json["volumes"].append(dataset_ele)

                with open(dataset_dir + "/init.script", "wt") as f:
                    f.write("file " + dataset_xrw_filename + "\n")
                    f.write("file " + dataset_json_filename)

        elif (dataset_type == "volume" and source == "daris"):
            cids = data["cid"]
            for ii in range(len(cids)):
                print "Volume: " + str(ii) 
                cid = cids[ii]

                dataset_dir = tag_dir + '/vol' + str(ii) + "/"
                if not os.path.exists(dataset_dir):
                    os.makedirs(dataset_dir)

                dataset_thumb_filename = dataset_dir + cid + "_thumb.png"
                dataset_thumb = "data/daris/" + cid + "/0001_thumb.png"
                print "Download " + dataset_thumb + " file..."
                downloadfile(server + dataset_thumb, dataset_thumb_filename)

                dataset_json_filename = dataset_dir + cid + ".json"
                dataset_json = "data/daris/" + cid + "/0001.json"
                print "Download " + dataset_json + " file..."
                downloadfile(server + dataset_json, dataset_json_filename)

                dataset_xrw_filename = dataset_dir + cid + ".xrw"
                dataset_xrw = "data/daris/" + cid + "/0001.xrw"
                print "Download " + dataset_xrw + " file..."
                downloadfile(server + dataset_xrw, dataset_xrw_filename)

                dataset_ele = {}
                dataset_ele["thumb"] = dataset_thumb_filename
                dataset_ele["dir"] = dataset_dir
                dataset_ele["res"] = data["res"][ii]
                dataset_ele["name"] = cid
                local_json["volumes"].append(dataset_ele)

                with open(dataset_dir + "/init.script", "wt") as f:
                    f.write("file " + dataset_xrw_filename + "\n")
                    f.write("file " + dataset_json_filename)

        if(dataset_type == "mesh" and source == "localupload"):    
            local_json["meshes"] = []
            if not os.path.isfile(os.path.join(mesh_dir, "init.script")):
                

            meshObjs = data["meshes"]
            for ii in range(len(meshObj)):
                print "Mesh object: " + str(ii)

                mesh_dir = tag_dir + "/mesh" + str(ii) + "/"
                if not os.path.exists(mesh_dir):
                    os.makedirs(mesh_dir)

                mesh_thumb_filename = mesh_dir + "mesh1_thumb.png"
                mesh_thumb = data["meshes"][ii]["thumb"]
                print "Download " + mesh_thumb + " file..."
                downloadfile(server + mesh_thumb, mesh_thumb_filename)

                mesh_json_filename = mesh_dir + "mesh.json"
                mesh_json = data["meshes"][ii]["json"]
                print "Download " + mesh_json + " file..."
                downloadfile(server + mesh_json, mesh_json_filename)

                #TODO
                #mesh_obj_filename = mesh_dir + "vol1.xrw"
                #mesh_obj = data["meshes"][ii]["obj"]
                #print "Download " + mesh_obj + " file..."
                #downloadfile(server + mesh_obj, mesh_obj_filename)

                mesh_ele = {}
                mesh_ele["thumb"] = mesh_thumb_filename
                mesh_ele["dir"] = mesh_dir
                mesh_ele["res"] = data["meshes"][ii]["res"]
                mesh_ele["name"] = ""
                local_json["meshes"].append(mesh_ele)

                if not os.path.isfile(os.path.join(mesh_dir, "init.script")):
                    with open(dataset_dir + "/init.script", "wt") as f:
                        f.write("file " + mesh_obj_filename + "\n")
                        f.write("file " + mesh_json_filename)

        else:
            raise NameError("Invalid type")
            #print "invalid type"

        with open(tag_dir + input_tag + "_local.json", 'w') as jf:
            json.dump(local_json, jf, sort_keys=True, indent=4)

    print "Done!"

# MAIN FUNCTION
if __name__ == "__main__":
    main(sys.argv[1:])
