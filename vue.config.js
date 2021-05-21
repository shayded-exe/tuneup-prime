// @ts-check

/** @typedef {import('@vue/cli-service').ProjectOptions} ProjectOptions */
/** @typedef {import('vue-cli-plugin-electron-builder').PluginOptions} VuePluginOptions */

/** @type {VuePluginOptions} */
const vuePluginOptions = {
  mainProcessFile: 'src/electron/main.ts',
};

/** @type {ProjectOptions} */
module.exports = {
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
          @import '@/app/scss/_prepend';
        `,
      },
    },
  },
  pages: {
    index: {
      entry: 'src/app/renderer.ts',
      title: 'ENJINN',
    },
  },
  pluginOptions: {
    electronBuilder: vuePluginOptions,
    chainWebpack(config) {
      config.resolve.alias.delete('@');
      config.resolve
        .plugin('tsconfig-paths')
        .use(require('tsconfig-paths-webpack-plugin'));
    },
  },
};
