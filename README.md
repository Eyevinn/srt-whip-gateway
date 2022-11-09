# SRT-WHIP GATEWAY
> *Open Source SRT WHIP Gateway

[![Slack](http://slack.streamingtech.se/badge.svg)](http://slack.streamingtech.se)

A Docker container to receive MPEG-TS over SRT and stream to a WHIP compatible endpoint for WebRTC based broadcast distribution.

![System Diagram](docs/srt_whip_gw.png)

A transmitter is an SRT receiver and WHIP encoder based on the `whip-mpegts` [command line tool](https://github.com/Eyevinn/whip-mpegts). Each transmitter has an configured SRT port in listener mode and configured for a specific WHIP URL. The transmitters can be managed via the REST API or the Web GUI.

![Screenshot of demo application](docs/screenshot.png)

## Run SRT WHIP Gateway

To run the latest version of SRT WHIP Gateway.

```
docker run -d -p 3000:3000 -p 9000-9999:9000-9999/udp eyevinntechnology/srt-whip
```

Run a specific version of SRT WHIP Gateway.

```
docker run -d -p 3000:3000 -p 9000-9999:9000-9999/udp eyevinntechnology/srt-whip:<version number>
```

Once the container is up and running you can access the API at `http://localhost:3000/api/docs` and the Web GUI at `http://localhost:3000/ui`.

## Usage Guide

### Add a transmitter

To add a transmitter enter the `SRT Port` to listen to. If you have followed the above container running instructions you can choose a port number between 9000 and 9999. Then enter the `WHIP Url` to the WHIP endpoint you want to stream to. Then press `Add` button.

### Start transmitter

A green border indicates that the transmitter is `idle` and can be started. Click anywhere in the white area within the green border to start a transmitter. Once the transmitter is running the box will turn red to indicate that it is a running transmitter.

When the transmitter is running you can start your video software to stream to the designated SRT port that you have configured for this transmitter. The below `ffmpeg` command line illustrates an example.

```
ffmpeg -re -i video.mp4 -c:v libx264 -c:a aac -f mpegts srt://localhost:9191/
```

### Stop transmitter

To stop a running transmitter (indicated by red color) you click on the red area for the transmitter to stop.

### Remove transmitter

To remove a transmitter click on the X in the top right corner of the transmitter.