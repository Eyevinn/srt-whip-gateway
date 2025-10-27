# SRT-WHIP GATEWAY
> *Open Source SRT WHIP Gateway*

[![Slack](http://slack.streamingtech.se/badge.svg)](http://slack.streamingtech.se)

A Docker container to receive MPEG-TS over SRT and stream to a WHIP compatible endpoint for WebRTC based broadcast distribution.

![System Diagram](docs/srt_whip_gw.png)

The receiving MPEG-TS can be restreamed to an SRT ingest endpoint for HTTP-based distribution in addition.

![System Diagram Restream](docs/srt_whip_gw_passthrough.png)

A transmitter is an SRT receiver and WHIP encoder based on the `whip-mpegts` [command line tool](https://github.com/Eyevinn/whip-mpegts). Each transmitter has a configured SRT port and can operate in either **listener mode** (default) or **caller mode**, configured for a specific WHIP URL. The transmitters can be managed via the REST API or the Web GUI.

![Screenshot of demo application](docs/screenshot.png)

## Features

- **SRT Listener Mode** (default): Gateway listens on a port and waits for incoming SRT connections
- **SRT Caller Mode**: Gateway actively connects to an SRT listener endpoint
- **Audio-Only Streaming**: Support for audio-only streams without video
- **SRT Passthrough**: Restream incoming MPEG-TS to an additional SRT endpoint
- **Web UI**: User-friendly interface for managing transmitters
- **REST API**: Programmatic control via RESTful API

## Supported input and output formats

| IN (SRT/MPEG-TS)  | UDP (MPEG-TS) | SRT (MPEG-TS) | WHIP (SRTP) |
| ----------------- | ------------- | ------------  | ----------- |
| AVC/AAC           | AVC/AAC       | AVC/AAC       | VP8/OPUS    |
| HEVC/AAC          | HEVC/AAC      | HEVC/AAC      | VP8/OPUS    |
| AAC (audio-only)  | AAC           | AAC           | OPUS        |

## Run SRT WHIP Gateway

To run the latest version of SRT WHIP Gateway.

```
docker run -d -p 3000:3000 -p 9000-9999:9000-9999/udp \
  eyevinntechnology/srt-whip
```

Run a specific version of SRT WHIP Gateway.

```
docker run -d -p 3000:3000 -p 9000-9999:9000-9999/udp \
  eyevinntechnology/srt-whip:<version number>
```

Once the container is up and running you can access the API at `http://localhost:3000/api/docs` and the Web GUI at `http://localhost:3000/ui`.

## Run SRT WHIP Gateway with WHIP/WHEP local

To run the SRT WHIP Gateway with [WHIP/WHEP local development environment](https://github.com/Eyevinn/whip-whep) you need to attach the SRT WHIP Gateway container to the same network as the WHIP/WHEP containers are running on.

Start the WHIP/WHEP containers:

```
curl -SL https://github.com/Eyevinn/whip-whep/releases/download/v0.2.0/docker-compose.yml | docker-compose -f - up
```

Find the network that these containers are running on

```
docker network ls

NETWORK ID     NAME                     DRIVER    SCOPE
d8e65abb5e48   host                     host      local
18bd740cfe25   none                     null      local
02eedf7089a9   whip-whep_default        bridge    local
```

In this case they are running on the docker network called `whip-whep_default`

Start the SRT WHIP Gateway on this network:

```
docker run --network whip-whep_default -p 3000:3000 -p 9000-9999:9000-9999/udp eyevinntechnology/srt-whip
```

And then use the following WHIP URL in the transmitter: `http://ingest:8200/api/v2/whip/sfu-broadcaster?channelId=test`

## Usage Guide

### Add a transmitter

To add a transmitter, configure the following settings:

1. **SRT Port**: Enter the SRT port number (e.g., 9000-9999 if using the default Docker port mapping)
2. **WHIP URL**: Enter the WHIP endpoint URL you want to stream to
3. **SRT Caller Mode** (optional): Enable this checkbox to use SRT caller mode instead of listener mode
   - When enabled, you must specify the **SRT Hostname** (e.g., `srt://hostname`)
   - The gateway will actively connect to the SRT endpoint instead of waiting for incoming connections
4. **No Video (Audio Only)** (optional): Enable this checkbox for audio-only streaming
5. **SRT Restream URL** (optional): Add an SRT URL (`srt://<ip>:<port>`) to restream to an additional SRT endpoint

Then press the `Add Transmitter` button.

### Start transmitter

A green border indicates that the transmitter is `idle` and can be started. Click anywhere in the white area within the green border to start a transmitter. Once the transmitter is running the box will turn red to indicate that it is a running transmitter.

When the transmitter is running, you can start your video software to stream. The approach differs based on the SRT mode:

#### Listener Mode (Default)

When using listener mode, the gateway waits for incoming SRT connections. Start streaming to the configured SRT port:

```bash
# Stream video with audio
ffmpeg -re -i video.mp4 -c:v libx264 -c:a aac -f mpegts "srt://localhost:9000?mode=caller"

# Generate test pattern with audio
ffmpeg -re -f lavfi -i testsrc=size=1280x720:rate=25 -f lavfi -i sine=frequency=1000:sample_rate=48000 \
  -c:v libx264 -preset veryfast -b:v 2000k -c:a aac -b:a 128k -f mpegts "srt://localhost:9000?mode=caller"

# Audio-only stream
ffmpeg -re -f lavfi -i sine=frequency=1000:sample_rate=48000 \
  -c:a aac -b:a 128k -f mpegts "srt://localhost:9000?mode=caller"
```

#### Caller Mode

When using caller mode, the gateway connects to your SRT endpoint. Start an SRT listener first:

```bash
# Stream video with audio in listener mode (gateway connects to this)
ffmpeg -re -i video.mp4 -c:v libx264 -c:a aac -f mpegts "srt://0.0.0.0:9000?mode=listener"

# Generate test pattern in listener mode
ffmpeg -re -f lavfi -i testsrc=size=1280x720:rate=25 -f lavfi -i sine=frequency=1000:sample_rate=48000 \
  -c:v libx264 -preset veryfast -b:v 2000k -c:a aac -b:a 128k -f mpegts "srt://0.0.0.0:9000?mode=listener"

# Audio-only stream in listener mode
ffmpeg -re -f lavfi -i sine=frequency=1000:sample_rate=48000 \
  -c:a aac -b:a 128k -f mpegts "srt://0.0.0.0:9000?mode=listener"
```

### Stop transmitter

To stop a running transmitter (indicated by red color) you click on the red area for the transmitter to stop.

### Remove transmitter

To remove a transmitter, click on the X in the top right corner of the transmitter.

**Note:** You cannot remove a transmitter while it is in the `RUNNING` state. If you attempt to remove a running transmitter, a warning modal will appear. You must first stop the transmitter before it can be removed.

## Contributing

If you're interested in contributing to the project:

- We welcome all people who want to contribute in a healthy and constructive manner within our community. To help us create a safe and positive community experience for all, we require all participants to adhere to the [Code of Conduct](docs/CODE_OF_CONDUCT.md).
- If you are looking to make a code change first learn how to setup your local environment in our [Developer guide](docs/developer.md). Then create a Pull Request with suggested changes.
- Report, triage bugs or suggest enhancements.
- Help others by answering questions.

## License (Apache-2.0)

```
Copyright 2022 Eyevinn Technology AB

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## Support

Join our [community on Slack](http://slack.streamingtech.se) where you can post any questions regarding any of our open source projects. Eyevinn's consulting business can also offer you:

- Further development of this component
- Customization and integration of this component into your platform
- Support and maintenance agreement

Contact [sales@eyevinn.se](mailto:sales@eyevinn.se) if you are interested.

## About Eyevinn Technology

[Eyevinn Technology](https://www.eyevinntechnology.se) is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor. As our way to innovate and push the industry forward we develop proof-of-concepts and tools. The things we learn and the code we write we share with the industry in [blogs](https://dev.to/video) and by open sourcing the code we have written.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!