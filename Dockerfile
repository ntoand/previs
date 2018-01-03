#=== Setup development environment to develop on difference machines ===
#docker build . -t ubuntu/previs
#docker run -v D:\git\previs:/previs -p 3000:3000 -p 3001:3001 -it ubuntu/previs
#Then manually install modules and run client and server
# cd previs/client --> npm run install
# cd previs/server --> npm run install
# cd previs/server/potree --> ./build.sh
# Run client in dev mode: cd previs/client --> npm run dev
# Run server in dev mode: cd previs/server --> node server.js
#previs then can be edited from host machine

FROM    ubuntu:16.04
MAINTAINER	MIVP Toan Nguyen <toan.nguyen@monash.edu>
RUN     apt-get update && apt-get install -y \
		build-essential python-dev git curl \
		vim meshlab xvfb cmake

#Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs
RUN npm install -g @angular/cli --unsafe
RUN npm install -g gulp --unsafe

#s2plot
COPY docker-support /docker-support
RUN cd /docker-support && tar xvzf s2volsurf.tar.gz
ENV PATH=/docker-support/s2volsurf:${PATH}

#meshlab
ENV DISPLAY=:100

#clean
RUN rm -rf /var/lib/apt/lists/*

EXPOSE  3000
EXPOSE  3001
WORKDIR /previs
#CMD ["nodejs", "/sage2/server.js", "-f", "/sage2/config/docker-cfg.json", "-i"]
