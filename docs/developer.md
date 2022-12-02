# Developer Guide

Prerequisites:
- Node 16+
- Docker
- [Eyevinn WHIP-mpegts CLI](https://github.com/Eyevinn/whip-mpegts)

## Install Node dependencies

```
npm install
```

## Build server and GUI

```
npm run build
npm run build:ui
```

## Start server

Start server that serves the REST API and Web User Interface.

```
npm start
```

To start server in developer mode and that build and restarts on code change you run:

```
npm run dev
```

Similary if you want to run the UI in developer mode you run:

```
npm run dev:ui
```

and point your browser to `http://localhost:1234/ui` instead.

## Testing

If you don't have a WHIP endpoint available you can spin up a [local WHIP/WHEP development environment](https://github.com/Eyevinn/whip-whep).

```
curl -SL https://github.com/Eyevinn/whip-whep/releases/download/v0.2.0/docker-compose.yml | docker-compose -f - up
```

This spins up a WHIP endpoint, SFU:s and WHEP endpoint. Then you can setup a transmitter to stream to `http://localhost:8200/api/v2/whip/sfu-broadcaster?channelId=test` and test playback from WHEP endpoint `http://localhost:8300/whep/channel/test` in that case.

If you want to test the docker container with the WHIP/WHEP docker-compose setup above you need to connect the container to the same docker network as the WHIP/WHEP containers are attached to. Assuming that the network is called `whip_whep_default`:

```
docker run -d --network whip_whep_default \
  -p 3000:3000 -p 9000-9999:9000-9999/udp \
    eyevinntechnology/srt-whip:<version number>
```

And then use the WHIP endpoint `http://ingest:8200/api/v2/whip/sfu-broadcaster?channelId=test` when setting up a transmitter.