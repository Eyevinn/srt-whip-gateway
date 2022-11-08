FROM eyevinntechnology/mpegts-whip:v0.4.0

RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

ADD . /app
WORKDIR /app
RUN npm install
RUN npm run build
RUN npm run build:ui
RUN cp ./whip-mpegts /usr/bin/
ENTRYPOINT [ "npm", "start" ]