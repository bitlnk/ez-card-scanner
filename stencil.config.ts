import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'ez-card-scanner',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    }
  ],
  rollupPlugins: {
    before: [],
    after: []
  }
};
