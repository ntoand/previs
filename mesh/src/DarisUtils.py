import os
import sys
import subprocess


class DarisUtils:
    host = None
    port = None
    mfsid = None

    @staticmethod
    def init(server, port):
        DarisUtils.host = server
        DarisUtils.port = port

    @staticmethod
    def buildbasecomnand():

        classpath = os.path.join(os.getcwd(), 'lib')
        # classpath='src/lib'
        transport = ''
        if (DarisUtils.port == 8443):
            transport = '-Dmf.transport=https'
        else:
            transport = '-Dmf.transport=http'
        base_command = ['java', '-Djava.net.preferIPv4Stack=true', '-Dmf.host=' + DarisUtils.host,
                        '-Dmf.port=' + str(DarisUtils.port), transport,
                        '-Dmf.sid=' + DarisUtils.mfsid, '-Dmf.result=xml', '-cp', classpath + '/aterm.jar',
                        'arc.mf.command.Execute']
        return base_command

    @staticmethod
    def daris_logon(server, port, domain, user, password):
        """
        DaRIS logon
        """
        DarisUtils.host = server
        DarisUtils.port = port
        DarisUtils.mfsid = ''
        base_command = DarisUtils.buildbasecomnand()
        try:
            MFLUX_SID = subprocess.check_output(
                base_command + ['logon', domain, user, password])
            DarisUtils.mfsid = MFLUX_SID.strip()
        except subprocess.CalledProcessError as e:
            print >> sys.stderr, "Error: " + \
                str(e.returncode) + " Output:" + e.output.decode()
            return -1

        return DarisUtils.mfsid

    @staticmethod
    def daris_logoff(mfsid=''):
        """
        DaRIS logoff
        """
        if(mfsid != ''):
            DarisUtils.mfsid = mfsid

        base_command = DarisUtils.buildbasecomnand()
        try:
            subprocess.check_output(base_command + ['logoff'])
        except subprocess.CalledProcessError as e:
            print >> sys.stderr, "Error: " + \
                str(e.returncode) + " Output:" + e.output.decode()
            return -1
        DarisUtils.host = None
        DarisUtils.fmsid = None
        return 0

    @staticmethod
    def daris_runcommand(strcommand, mfsid=''):
        """
        Run a DaRIS command and return XML format
        """
        if(mfsid != ''):
            DarisUtils.mfsid = mfsid

        base_command = DarisUtils.buildbasecomnand()
        try:
            retxml = subprocess.check_output(
                base_command + strcommand.split(), stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            print >> sys.stderr, "Error: " + \
                str(e.returncode) + " Output:" + e.output.decode()
            return -1
        return retxml
