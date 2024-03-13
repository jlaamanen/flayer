import { createServer } from 'flayer';
import type { Plugin } from 'vite';

const flayerServer = createServer({
  hello: require('./modules/hello')
});

const mode = process.env.MODE?.split(',') ?? ['server'];

if (mode.includes('generate')) {
  await flayerServer.generatePackage({
    path: './server-pkg'
  });
}

// Exit the entire process if server shouldn't be started
if (!mode.includes('server')) {
  process.exit(0);
}

function startServer() {
  flayerServer.start({
    port: 1234,
    session: {
      secret: 'V3ryZ3kr3tW0rd'
    }
  });
}

startServer();

export const flayerPlugin: Plugin = {
  name: 'flayer',
  configureServer() {
    startServer();
  },
  buildEnd() {
    flayerServer.stop();
  }
};
