import os
import DarisUtils as daris
from lxml import etree
import json

class DarisServices:
	"""
	Provide DaRIS DarisServices
	"""
	def __init__(self, server, port, domain, username, password):
		self.server = server
		self.port = port
		self.domain = domain
		self.username = username
		self.password = password
		daris.DarisUtils.init(server, port)

	def connect(self):
		#print self.server + " " + str(self.port) + " " + self.domain + " " + self.username + " " +  self.password
		ret = daris.DarisUtils.daris_logon(self.server, self.port, self.domain, self.username, self.password)
		if(ret == -1):
			return self.jsonError("authentication_failure")
		json_ret = {}
		json_ret['status'] = 'ok'
		json_ret['result'] = ret
		return json.dumps(json_ret)
        
	def disconnect(self, sid):
		ret = daris.DarisUtils.daris_logoff(sid)
		if(ret == -1):
			return self.jsonError("cannot_logoff")
		json_ret = {}
		json_ret['status'] = 'ok'
		json_ret['result'] = ret
		return json.dumps(json_ret)

	def jsonError(self, errstr):
		json_ret = {}
		json_ret['status'] = 'error'
		json_ret['result'] = errstr
		return json.dumps(json_ret)

	def getProjects(self, sid):
		"""
		Get list of DaRIS projects that the user can access
		"""

		'get root uid of DaRIS repo'
		repoid=''
		query = "om.pssd.project.root" 
		xmlstr = daris.DarisUtils.daris_runcommand(query, sid)
		if (xmlstr == -1):
			return self.jsonError('session_invalid') 
        #print xmlstr
		try:
			doc = etree.XML(xmlstr.strip())
			elements = doc.xpath('/result/id')
			repoid = elements[0].text
			#print "Repo ID: " + repoid
		except etree.XMLSyntaxError:
			print >> sys.stderr, 'XML parsing error' 
			return self.jsonError('XML_parsing_error') 
        
		'get list of projects and return a dictionary {project cid, project name]'
		projects=[]
		query = "asset.query :where \"cid starts with '" + repoid + "' and model='om.pssd.project'\" :action get-meta :size infinity"
		xmlstr = daris.DarisUtils.daris_runcommand(query, sid)
		xmlstr = xmlstr.replace("daris:pssd-object","pssd-object")
		try:
			doc = etree.XML(xmlstr.strip())
			elements = doc.xpath('/result/asset')
			for ele in elements:
				project={}
				project['cid'] = ele.xpath('cid')[0].text
				name = ele.xpath("meta/pssd-object/name")
				if (name):
					project['name'] = name[0].text
				else:
					project['name']=''
				description = ele.xpath('meta/pssd-object/description')
				if (description):
					project['description'] = description[0].text
				else:
					project['description'] = ''                  
				project['ctime'] = ele.xpath('ctime')[0].text
				project['mtime'] = ele.xpath('mtime')[0].text
				projects.append(project)
		except etree.XMLSyntaxError:
			print >> sys.stderr, 'XML parsing error' 
			return self.jsonError('XML_parsing_error')  
            
		projects_json = []

		for project in projects:
			pro_json = {}
			pro_json['key'] = project['cid']
			pro_json['title'] = 'project: ' + project['cid'] + " | " + project['name'] + " | " + project['description']
			pro_json['folder'] = True
			pro_json['lazy'] = True
			pro_json['hideCheckbox'] = True
			projects_json.append(pro_json)
		
		json_ret = {}
		json_ret['status'] = 'ok'
		json_ret['result'] = projects_json
		return json.dumps(json_ret)

	def getMembers(self, sid, cid):
		"""
		Get list of DaRIS members that the user can access
		"""        
		'get list of members'
		members=[]
		query = "om.pssd.collection.members :id " + cid + " :size infinity"
		#print query

		xmlstr = daris.DarisUtils.daris_runcommand(query, sid)
		if (xmlstr == -1):
			return self.jsonError('session_invalid') 
		#print xmlstr
		try:
			doc = etree.XML(xmlstr.strip())
			elements = doc.xpath('/result/object')
			for ele in elements:
				member={}
				member['type'] = ele.xpath('@type')[0]
				member['cid'] = ele.xpath("id")[0].text
				name = ele.xpath("name")
				if (name):
					member['name'] = name[0].text
				else:
					member['name']=''
				description = ele.xpath('description')
				if (description):
					member['description'] = description[0].text
				else:
					member['description'] = ''   
				if(member['type'] == 'dataset'):
					datatype=ele.xpath('type')
					if(datatype):
						member['datatype']=datatype[0].text
					else: 
						member['datatype']=''

					datasize=ele.xpath('data/size/@h')   
					if(datasize):
						member['datasize']=datasize[0]
					else: 
						member['datasize']=''      
				members.append(member)
		except etree.XMLSyntaxError:
			print >> sys.stderr, 'XML parsing error' 
			return self.jsonError('XML_parsing_error')
            
		members_json = []

		for member in members:
			member_json = {}
			member_json['key'] = member['cid']
			if(member['type'] != 'dataset'):
				member_json['title'] = member['type'] + ': ' + member['cid'] + " | " + member['name'] + " | " + member['description']
				member_json['folder'] = True
				member_json['lazy'] = True
				member_json['hideCheckbox'] = True
			else:
				member_json['title'] = member['type'] + ': ' + member['cid'] + " | " + member['name'] + " | " + member['datatype'] + " | " + member['datasize']
				member_json['folder'] = False
				member_json['lazy'] = False
				member_json['hideCheckbox'] = False

			members_json.append(member_json)

		json_ret = {}
		json_ret['status'] = 'ok'
		json_ret['result'] = members_json
		return json.dumps(json_ret)

	def download(self, sid, cid, args):
		"""
		Download dataset given cid and output file name args
		"""
		query = "asset.get :cid " + cid + " :out file:" + args
		#print query

		xmlstr = daris.DarisUtils.daris_runcommand(query, sid)
		if (xmlstr == -1):
			return self.jsonError('session_invalid') 

		json_ret = {}
		json_ret['status'] = 'ok'
		json_ret['result'] = args
		return json.dumps(json_ret)