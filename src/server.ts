import api from "./api";
import { Engine } from "./engine";

const engine = new Engine();

const server = api({
  engine: engine,
  apiKey: process.env.API_KEY,
});
server.listen({ port: 3000 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});