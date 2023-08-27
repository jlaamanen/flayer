import { createServer } from 'flayer';
import type { Plugin } from 'vite';

const flayerServer = createServer({
  hello: require('./modules/hello')
});

if (process.env.NODE_ENV === 'development') {
  await flayerServer.generatePackage({
    path: './server-pkg',
    packageName: 'server'
  });
}

function startServer() {
  flayerServer.start({
    port: 1234,
    session: {
      secret: 'lolz'
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
