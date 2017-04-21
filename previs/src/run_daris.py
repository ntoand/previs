import DarisServices as dis

import os
import sys
import getopt

daris_server = 'mf-erc'
if(daris_server == 'mf-erc'):
    server = 'mf-erc.its.monash.edu'
    port = 8443
    #domain = 'mon-daris'
    #user = 'dev'
    #passwd = 'dev123'
else:
    server = 'titanium.cave.monash.edu'
    port = 8085
    #domain = 'mivp'
    #user = 'toand'
    #passwd = 'test123'


def main(argv):
    try:
        opts, args = getopt.getopt(
            argv, "t:s:c:a:", ["task=", "sid=", "cid=", "args="])
    except getopt.GetoptError:
        # help()
        sys.exit(-1)

    sid = ''
    args = ''
    for opt, arg in opts:
        if opt == '-h':
            # help()
            print 'help'
            sys.exit()
        elif opt in ("-t", "--task"):
            task = arg
        elif opt in ("-s", "--sid"):
            sid = arg
        elif opt in ("-c", "--cid"):
            cid = arg
        elif opt in ("-a", "--args"):
            args = arg

    serv = dis.DarisServices(server, port)
    if(task == 'logon'):
        # print '\nConnect to DaRIS'
        print serv.connect(args)

    if(task == 'logoff'):
        print serv.disconnect(sid)

    elif (task == 'projects'):
        # print '\nGet projects'
        print serv.getProjects(sid)

    elif (task == 'members'):
        print serv.getMembers(sid, cid)

    elif (task == 'logoff'):
        # print '\nDisconnect'
        print serv.disconnect(sid)

    elif (task == 'download'):
        print serv.download(sid, cid, args)

    elif (task == 'search'):
        print serv.search(sid, cid, args)

# MAIN FUNCTION
if __name__ == "__main__":
    main(sys.argv[1:])
