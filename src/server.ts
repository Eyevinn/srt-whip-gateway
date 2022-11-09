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
server.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
