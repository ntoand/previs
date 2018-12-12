#=== run previs in docker ===
# docker build . -t ubuntu/previs
# docker run -v /path/to/data:/data -p 9000:9000 -p 3001:3001 -it ubuntu/previs
# Run previs: ./GO.sh
# the /path/to/data should contains example and tags folders
# run web client: http://localhost:9000

FROM    ubuntu:16.04
MAINTAINER	MIVP Toan Nguyen <toan.nguyen@monash.edu>
RUN     apt-get update && apt-get install -y \
		build-essential python-dev git curl \
		vim cmake

#Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs
RUN npm install -g @angular/cli --unsafe
RUN npm install -g gulp --unsafe

#copy data
RUN mkdir /previs 
COPY . /previs

#patch
RUN cp /previs/docker-support/node-config.js /previs/server/src/node-config.js

#s2plot
RUN cd /previs/docker-support && tar xvzf s2plot.tar.gz
RUN cd /previs/docker-support && tar xvzf s2volsurf.tar.gz
ENV PATH=/previs/docker-support/s2plot/linux-gnu-x86_64:/previs/docker-support/s2volsurf:${PATH}
ENV LD_LIBRARY_PATH=/previs/docker-support/s2plot/linux-gnu-x86_64:/previs/docker-support/s2volsurf:${LD_LIBRARY_PATH}

#PotreeConverter
RUN mkdir -p /previs/server/potree/PotreeConverter/build
RUN cp -r /previs/docker-support/PotreeConverter /previs/server/potree/PotreeConverter/build
RUN chmod +x /previs/server/potree/PotreeConverter/build/PotreeConverter/PotreeConverter

#potree
RUN cd /previs/server/potree/potree && npm install && npm install --only=dev
RUN cd /previs/server/potree && ./updatepotreeviewer.sh

#client
RUN cd /previs/client && npm install && npm install --only=dev

#server
RUN cd /previs/server && npm install && npm install --only=dev

#data dir
RUN cd /previs/server/public && ln -s /data .
RUN mkdir -p /previs/server/public/data/tags

#clean
RUN rm -rf /var/lib/apt/lists/*

EXPOSE  9000
EXPOSE  3001
WORKDIR /previs
#CMD ["./GO.sh"]
