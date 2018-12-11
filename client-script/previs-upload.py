"""
To upload data to previs
Author: Toan Nguyen (toan.nguyen@monash.edu)
Date: December 2018
Version: 1.0.0
Usage: python previs-upload --help
"""

from __future__ import print_function
import os
import sys
import getopt
import json
import requests
from requests_toolbelt import MultipartEncoder, MultipartEncoderMonitor

config = {}
config['server'] = 'https://mivp-dws1.erc.monash.edu:3000'
config['file'] = ''
config['type'] = ''
config['key'] = ''
config['notify'] = False

current_percent = 0
def upload_callback(monitor):
    """
    To show upload progress
    :param monitor:
    :return:
    """
    global current_percent
    percent = 100.0*monitor.bytes_read / monitor.len
    if(percent > current_percent or percent >=100):
        print(str(percent) + '%')
        current_percent = current_percent + 10


def uploadFile(file):
    """
    Upload file to server
    :param file:
    :return: json
    """
    global config
    key = config['key']
    file = config['file']
    base = os.path.basename(file)
    url = config['server'] + '/localupload'
    json = {}

    session = requests.Session()
    with open(file, 'rb') as f:
        form = MultipartEncoder({
            "documents": (base, f, "application/octet-stream"),
            "composite": "NONE"
        })
        m = MultipartEncoderMonitor(form, upload_callback)

        headers = {"Prefer": "respond-async", "Content-Type": m.content_type}
        params = {"key": key}
        resp = session.post(url, params=params, headers=headers, data=m)
        json = resp.json()
    session.close()

    return json


def help():
    print('python previs-upload.py [-s server] -f file -t type -k key [-n]')
    print('  Example: -s -f data/tiffstack-foot.zip -t volume -k 11e94460-*******')
    print('  -s, --server defaults to https://mivp-dws1.erc.monash.edu:3000')
    print('  -f, --file: path to file to upload')
    print('  -t, --type: data type {volume, mesh, point, image}')
    print('  -k, --key: api key provided by previs admin')
    print('  -n, --notify: notify by email when data is ready to view on web')


def main(argv):

    try:
        opts, args = getopt.getopt(argv, "s:f:t:k:n", ["server=", "file=", "type=", "key="])
    except getopt.GetoptError:
        raise NameError("Cannot parse input arguments")

    global config
    for opt, arg in opts:
        if opt == '-h':
            help()
            sys.exit()
        elif opt in ("-s", "--server"):
            config['server'] = arg
        elif opt in ("-f", "--file"):
            config['file'] = arg
        elif opt in ("-t", "--type"):
            config['type'] = arg
        elif opt in ("-k", "--key"):
            config['key'] = arg
        elif opt in ("-n", "--notify"):
            config['notify'] = True

    if file == '':
        raise NameError("Please provide file to upload")

    print('Upload file ' + config['file'] + ' (' + config['type'] + ') to server ' +  config['server'])
    if(config['server'] == '' or config['file'] == '' or config['type'] == '' or config['key'] == ''):
        print('Invalid parameters. Please check again')

    # upload file to server
    json = uploadFile(file)
    # for quick dev
    """
    json = {}
    json['status'] = 'done'
    json['file'] = 'upload_01328cb9d811756f2db6ba289acee18f.zip'
    """
    print(json)

    if(json['status'] != 'done'):
        sys.exit('Failed to upload file. ' + json['file'])

    print('Now processing uploaded file...')
    url = config['server'] + '/rest/processupload'
    headers = {'content-type': 'application/json'}
    params = {"file": json['file'], "key": config['key'], "type": config['type'],
            'voxelSizeX': 1, 'voxelSizeY': 1, 'voxelSizeZ': 1,
              'channel': 0, 'time': 0, 'sendEmail': config['notify']}
    resp = requests.post(url, params=params, headers=headers)
    json = resp.json()['data']
    print(json)

    if (json['status'] != 'done'):
        sys.exit('Failed to process uploaded file. ' + json['result'])

    print('\nThe data has been uploaded to previs successfully!')
    tag = json['result']['tag']
    print('TAG: ' + tag)
    url = config['server']
    if (config['type'] == 'volume'):
        url = url + '/sharevol/index.html?data=data/tags/' + tag + '/volume_result/vol_web.json&reset'
    elif (config['type'] == 'mesh'):
        url = url + '/meshviewer/?tag=' + tag
    elif (config['type'] == 'point'):
        url = url + '/pointviewer/?tag=' + tag
    elif (config['type'] == 'image'):
        url = url + '/imageviewer/?tag=' + tag
    print('View on web: ' + url)


# MAIN FUNCTION
if __name__ == "__main__":
    main(sys.argv[1:])


print('DONE!')