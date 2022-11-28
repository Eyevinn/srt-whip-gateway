FROM ubuntu:latest

## To build the UI with parcel we need to run it on latest ubuntu and why
## we need this multi-stage build approach here
##
RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs
RUN apt-get install -y make gcc g++ patch

ADD . /src
WORKDIR /src
RUN npm install
RUN patch node_modules/lightningcss/node/index.js < lightningcss.patch
RUN npm run build
RUN npm run build:ui

FROM eyevinntechnology/mpegts-whip:v0.5.0

RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app
COPY --from=0 /src/dist ./dist
COPY --from=0 /src/package.json ./
COPY --from=0 /src/package-lock.json ./
RUN npm install --omit=dev
RUN cp ./whip-mpegts /usr/bin/

ENTRYPOINT [ "npm", "start" ]
