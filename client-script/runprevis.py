import os
import sys
import getopt
import urllib2
import json
import zipfile
import requests
import subprocess

version = "v0.1.1"
host = 'https://mivp-dws1.erc.monash.edu:3000'
localdir = 'data'
key = ""


def getInfo(tag, key):
    """
    Get Info in json format from tag
    :param tag: 
    :return: 
    """
    url = host + '/rest/info?tag=' + tag + '&key=' + key
    r = requests.get(url)
    if(r.status_code != 200):
        raise Exception("Cannot get json")
    return r.json()


def downloadFile(remote_file, local_file):
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


def runViewer(info):
    os.chdir(info['local_tag_dir'])
    if(info['type'] == 'point'):
        subprocess.check_output(['orun','-s', 'run_gigapoint.py'])
    elif (info['type'] == 'mesh'):
        subprocess.check_output(info['lavavu'])
    elif (info['type'] == 'image'):
        print ('Run: ' + str(info['imagecmd']))
        subprocess.check_output(info['imagecmd'])
    elif (info['type'] == 'volume'):
        subprocess.check_output([info['lavavu']])
    else:
        print 'Invalid type'
    os.chdir(info['cwd'])


def runVolume(info):
    """
    Run volume with LavaVR
    :param info: 
    :return: 
    """
    #download xrw
    file_url = host + '/data/tags/' + info['tag_dir'] + '/volume_result/vol.xrw'
    file_local = info['local_tag_dir'] + '/vol.xrw'
    if not os.path.exists(file_local):
        print 'download', file_url
        downloadFile(file_url, file_local)

    #json
    file_url = host + '/data/tags/' + info['tag_dir'] + '/volume_result/vol_full.json'
    file_local = info['local_tag_dir'] + '/vol_full.json'
    r = requests.get(file_url)
    if (r.status_code != 200):
        raise Exception("Cannot get json")
    jsondata = r.json()
    res =jsondata['objects'][0]['volume']['res'];
    #print('volfull', jsondata)
    
    file_url = host + '/data/tags/' + info['tag_dir'] + '/volume_result/vol_web.json'
    file_local = info['local_tag_dir'] + '/vol_web.json'
    r = requests.get(file_url)
    jsondata = r.json()
    if (r.status_code != 200):
        raise Exception("Cannot get json")
    jsondata['views'][0]['rotate'] = [0, 0, 0, 1]
    jsondata['objects'][0]['volume']['res'] = res
    
    print ('vol_web', jsondata)
    with open(file_local, 'w') as outfile:
        json.dump(jsondata, outfile, sort_keys=False, indent=4, ensure_ascii=False)
    
    # LavaVR run script    
    cmd = ['cp', 'run_volume.py', info['local_tag_dir'] + '/init.py']
    subprocess.check_output(cmd)
    
    #run
    runViewer(info)


def runMesh(info):
    """
    run mesh with LavaVR
    :param info: 
    :return: 
    """
    #download data
    file_url = host + '/data/tags/' + info['tag_dir'] + '/mesh_processed.zip'
    file_local = info['local_tag_dir'] + '/mesh_processed.zip'
    if not os.path.exists(file_local):
        print 'download', file_url
        downloadFile(file_url, file_local)
        #unzip
        os.chdir(info['local_tag_dir'])
        cmd='unzip -o mesh_processed.zip | pv -l >/dev/null'
        subprocess.check_output(cmd,shell=True)
        os.chdir(info['cwd'])
    
    # download update json
    file_url = host + '/data/tags/' + info['tag_dir'] + '/mesh_result/mesh.json'
    file_local = info['local_tag_dir'] + '/mesh.json'
    os.remove(file_local)
    print 'download', file_url
    downloadFile(file_url, file_local)

    cmd = ['cp', 'run_mesh.py', info['local_tag_dir'] + '/init.py']
    subprocess.check_output(cmd)

    #run
    runViewer(info)


def runPoint(info):
    """
    run pointcloud with gigapoint
    :param info: 
    :return: 
    """
    # download data
    file_url = host + '/data/tags/' + info['tag_dir'] + '/point_processed.zip'
    file_local = info['local_tag_dir'] + '/point_processed.zip'
    if not os.path.exists(file_local):
        print 'download', file_url
        downloadFile(file_url, file_local)
        # unzip
        os.chdir(info['local_tag_dir'])
        cmd='unzip -o point_processed.zip | pv -l >/dev/null'
        subprocess.check_output(cmd,shell=True)

    if not os.path.exists(info['local_tag_dir'] + '/gigapoint_resource'):
        subprocess.check_output(['ln','-s','/home/toand/git/projects/gigapoint/gigapoint/dist/gigapoint_resource'])
    if not os.path.exists(info['local_tag_dir'] + '/gigapoint.so'):
        subprocess.check_output(['ln','-s','/home/toand/git/projects/gigapoint/gigapoint/dist/gigapoint.so'])
    os.chdir(info['cwd'])

    #copy
    cmd = ['cp', 'run_gigapoint.py', info['local_tag_dir']]
    subprocess.check_output(cmd)
    
    # download gigapoint.json file
    file_url = host + '/data/tags/' + info['tag_dir'] + '/gigapoint.json'
    file_local = info['local_tag_dir'] + '/gigapoint.json'
    print 'download', file_url
    downloadFile(file_url, file_local)

    # run
    runViewer(info)


def runImage(info):
    """
    run high-res image with dzviewer
    :param info: 
    :return: 
    """
    # download data
    file_url = host + '/data/tags/' + info['tag_dir'] + '/image_processed.zip'
    file_local = info['local_tag_dir'] + '/image_processed.zip'
    
    if not os.path.exists(file_local):
        print 'download', file_url
        downloadFile(file_url, file_local)
        # unzip
        os.chdir(info['local_tag_dir'])
        cmd='unzip -o image_processed.zip | pv -l >/dev/null'
        subprocess.check_output(cmd,shell=True)        
        os.chdir(info['cwd'])

    # generate run command
    #cmd = 'GO_CAVE2_DZ -b 256 -t 4 -p -m'
    cmd = '/home/toand/git/projects/vsviewer/build/CAVE2/GO_CAVE2_DZ -b 256 -t 4 -p -m'
    jsonfile = info['local_tag_dir'] + '/image.json'
    with open(jsonfile, 'rt') as f:
        data = json.load(f)
        for img in data:
            cmd = cmd + ' -i ' + info['local_tag_dir']+'/'+img
    info['imagecmd'] = cmd.encode('ascii','ignore').split()

    if not os.path.exists(info['local_tag_dir'] + '/default.cfg'):
        #print "tagdir:", info['tag_dir']
        subprocess.check_output(['ln','-t',info['local_tag_dir'],'-s','/home/toand/git/projects/vsviewer/data/default.cfg'])

    # run
    runViewer(info)


def help():
    print "runprevis.py [-s host] [-d localdir] -k apikey input_tag"

def main(argv):

    try:
        opts, args = getopt.getopt(argv, "s:d:k:", ["server=", "dir=", "key="])
    except getopt.GetoptError:
        raise NameError("Cannot parse input arguments")

    global host
    global datadir
    global key
    for opt, arg in opts:
        if opt == '-h':
            help()
            sys.exit()
        elif opt in ("-s", "--server"):
            host = arg
        elif opt in ("-d", "--dir"):
            localdir = arg
        elif opt in ("-k", "--key"):
            key = arg

    if key == "":
        print("Error: api key is required")
        return

    tag = args[0]
    print tag, key, host, localdir
    info = getInfo(tag, key)
    tag_type = info['type']
    tag_dir = info['dir']
    if(not tag_dir):
        tag_dir = tag

    #create output directory
    local_tag_dir = localdir + '/' + tag
    print 'create directory:', local_tag_dir
    if not os.path.exists(local_tag_dir):
        os.makedirs(local_tag_dir)
    info['local_tag_dir'] = os.path.abspath(local_tag_dir)
    info['lavavu'] = 'LavaVR.sh'
    info['cwd'] = os.getcwd()
    info['tag_dir'] = tag_dir

    print info
    if tag_type == 'volume':
        runVolume(info)
    elif tag_type == 'mesh':
        runMesh(info)
    elif tag_type == 'point':
        runPoint(info)
    elif tag_type == 'image':
        runImage(info);
    else:
        raise Exception("invalid type")


# MAIN FUNCTION
if __name__ == "__main__":
    main(sys.argv[1:])
