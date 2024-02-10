import { createServer } from 'flayer';
import type { Plugin } from 'vite';

const flayerServer = createServer({
  hello: require('./modules/hello')
});

if (process.env.NODE_ENV === 'development') {
  await flayerServer.generatePackage({
    path: './server-pkg'
  });
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
