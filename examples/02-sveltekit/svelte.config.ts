import adapter from '@sveltejs/adapter-auto';
import { Config } from '@sveltejs/kit';
import { vitePreprocess } from '@sveltejs/kit/vite';

const config: Config = {
  preprocess: [vitePreprocess()],
  kit: {
    adapter: adapter()
  }
};

export default config;
