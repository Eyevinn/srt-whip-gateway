import gui from '@fastify/static';
import path from 'path';
import api from "./api";
import { Engine } from "./engine";
import { FileTransmitterStore } from "./store";

const DATA_DIR = process.env.DATA_DIR ? process.env.DATA_DIR : path.join(process.cwd(), 'data');

const engine = new Engine({ store: new FileTransmitterStore(DATA_DIR) });

const server = api({
  engine: engine,
  apiKey: process.env.API_KEY,
});
server.register(gui, {
  root: path.join(__dirname, 'ui'),
  prefix: '/ui/',
});
server.get('/ui/', (req, reply) => {
  reply.sendFile('index.html');
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const start = async () => {
  // Reload previously configured transmitters before serving requests.
  await engine.load();

  server.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(address);
  });
};

start();
