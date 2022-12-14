import gui from '@fastify/static';
import path from 'path';
import api from "./api";
import { Engine } from "./engine";

const engine = new Engine();

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

server.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(address);
});
