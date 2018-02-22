import os
import sys
import getopt
import urllib2
import json
import zipfile
import requests
import subprocess

host = 'https://mivp-dws1.erc.monash.edu:3000'
localdir = 'data'


def getInfo(tag):
    """
    Get Info in json format from tag
    :param tag: 
    :return: 
    """
    url = host + '/rest/info?tag=' + tag
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
    os.chdir(info['tag_dir'])
    if(info['type'] == 'point'):
        subprocess.check_output(['orun','-s', 'gigapoint_run.py'])
    else:
        subprocess.check_output([info['lavavr']])
    os.chdir(info['cwd'])


def runVolume(info):
    """
    Run volume with LavaVR
    :param info: 
    :return: 
    """
    #download xrw
    file_url = host + '/data/tags/' + info['tag'] + '/volume_result/vol.xrw'
    file_local = info['tag_dir'] + '/vol.xrw'
    print 'download', file_url
    downloadFile(file_url, file_local)

    #json
    file_url = host + '/data/tags/' + info['tag'] + '/volume_result/vol_full.json'
    file_local = info['tag_dir'] + '/vol_full.json'
    r = requests.get(file_url)
    if (r.status_code != 200):
        raise Exception("Cannot get json")
    jsondata = r.json()
    jsondata['views'][0]['rotate'] = [0, 0, 0, 1]
    print jsondata
    with open(file_local, 'w') as outfile:
        json.dump(jsondata, outfile, sort_keys=False, indent=4, ensure_ascii=False)

    #inif.script
    with open(info['tag_dir'] + '/init.script', 'wt') as outfile:
        outfile.write('file vol.xrw\n')
        outfile.write('file vol_full.json')
    #run
    runViewer(info)


def runMesh(info):
    """
    run mesh with LavaVR
    :param info: 
    :return: 
    """
    #download data
    file_url = host + '/data/tags/' + info['tag'] + '/mesh_processed.zip'
    file_local = info['tag_dir'] + '/mesh_processed.zip'
    print 'download', file_url
    downloadFile(file_url, file_local)
    #unzip
    os.chdir(info['tag_dir'])
    cmd = ['unzip', '-o', 'mesh_processed.zip']
    subprocess.check_output(cmd)
    os.chdir(info['cwd'])
    #download init.script
    file_url = host + '/data/tags/' + info['tag'] + '/mesh_result/init.script'
    file_local = info['tag_dir'] + '/init.script'
    print 'download', file_url
    downloadFile(file_url, file_local)
    #run
    runViewer(info)


def runPoint(info):
    """
    run pointcloud with gigapoint
    :param info: 
    :return: 
    """
    # download data
    file_url = host + '/data/tags/' + info['tag'] + '/point_processed.zip'
    file_local = info['tag_dir'] + '/point_processed.zip'
    print 'download', file_url
    downloadFile(file_url, file_local)
    # unzip
    os.chdir(info['tag_dir'])
    cmd = ['unzip', '-o', 'point_processed.zip']
    subprocess.check_output(cmd)
    if not os.path.exists(info['tag_dir'] + '/gigapoint_resource'):
    	subprocess.check_output(['ln','-s','/home/toand/git/projects/gigapoint/gigapoint/dist/gigapoint_resource'])
    if not os.path.exists(info['tag_dir'] + '/gigapoint.so'):
    	subprocess.check_output(['ln','-s','/home/toand/git/projects/gigapoint/gigapoint/dist/gigapoint.so'])
    os.chdir(info['cwd'])

    #copy
    cmd = ['cp', 'gigapoint_run.py', info['tag_dir']]
    subprocess.check_output(cmd)
    
    # download gigapoint.json file
    file_url = host + '/data/tags/' + info['tag'] + '/gigapoint.json'
    file_local = info['tag_dir'] + '/gigapoint.json'
    print 'download', file_url
    downloadFile(file_url, file_local)

    # run
    runViewer(info)


def help():
    print "runprevis.py [-s host] [-d localdir] input_tag"

def main(argv):

    try:
        opts, args = getopt.getopt(argv, "s:d:", ["server=", "dir="])
    except getopt.GetoptError:
        raise NameError("Cannot parse input arguments")

    global host
    global datadir
    for opt, arg in opts:
        if opt == '-h':
            help()
            sys.exit()
        elif opt in ("-s", "--server"):
            host = arg
        elif opt in ("-d", "--dir"):
            localdir = arg

    tag = args[0]
    print tag, host, localdir
    info = getInfo(tag)
    type = info['type']

    #create output directory
    tag_dir = localdir + '/' + tag
    print 'create directory:', tag_dir
    if not os.path.exists(tag_dir):
        os.makedirs(tag_dir)
    info['tag_dir'] = os.path.abspath(tag_dir)
    info['lavavr'] = 'LavaVR.sh'
    info['cwd'] = os.getcwd()

    print info
    if type == 'volume':
        runVolume(info)
    elif type == 'mesh':
        runMesh(info)
    elif type == 'point':
        runPoint(info)
    else:
        raise Exception("invalid type")


# MAIN FUNCTION
if __name__ == "__main__":
    main(sys.argv[1:])
