#=== run previs with Docker ===
# docker build . -t ubuntu/previs
# docker run -v /path/to/data:/data -p 9000:9000 -p 3001:3001 -it ubuntu/previs
# Run previs: ./GO.sh
# the /path/to/data should contain example and tags folders
# run web client: http://localhost:9000

FROM    ubuntu:16.04
RUN     apt-get update && apt-get install -y \
		build-essential python-dev git curl wget \
		vim cmake python-pip pkg-config \
		python-matplotlib python-scipy

RUN pip install --upgrade numpy==1.10.1 Pillow==5.1.0 imageio==2.3.0 enum34==1.1.2 futures==3.2.0 nibabel==2.4.1 pydicom==1.2.2

#copy data
COPY . /previs

#setup node.js
RUN cd /previs/docker-support && wget --no-check-certificate https://mivp-dws1.erc.monash.edu.au:/sites/data/node-v8.9.3-linux-x64.tar.gz && \
	tar xzf node-v8.9.3-linux-x64.tar.gz
ENV PATH="/previs/docker-support/node-v8.9.3-linux-x64/bin:${PATH}"

#patch
RUN cp /previs/docker-support/node-config-localhost.js /previs/server/src/node-config.js && \
	cp /previs/docker-support/client-enviroment.prod.ts /previs/client/src/environments/environment.prod.ts && \
	cp /previs/docker-support/client-enviroment.ts /previs/client/src/environments/environment.ts

#PotreeConverter & potree
RUN mkdir -p /previs/server/potree/PotreeConverter/build && \
	cp -r /previs/docker-support/PotreeConverter /previs/server/potree/PotreeConverter/build && \
	chmod +x /previs/server/potree/PotreeConverter/build/PotreeConverter/PotreeConverter && \
	cd /previs/server/potree/potree && npm install && npm install --only=dev && \
	cd /previs/server/potree && ./updatepotreeviewer.sh

#client & server & data
RUN cd /previs/client && npm install --unsafe-perm && npm install --only=dev && \
	cd /previs/server && npm install --unsafe-perm && npm install --only=dev && \
	cd /previs/client && npm run build && mv /previs/server/dist-dev /previs/server/dist && \
	rm -rf /var/lib/apt/lists/*

WORKDIR /previs
EXPOSE  9000
EXPOSE  3000
EXPOSE  3001
CMD ["./GO-docker.sh"]
