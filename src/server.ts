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
server.listen({ port: 3000 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
