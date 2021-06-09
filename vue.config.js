// @ts-check

const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

/** @typedef {import('@vue/cli-service').ProjectOptions} ProjectOptions */
/** @typedef {import('vue-cli-plugin-electron-builder').PluginOptions} VuePluginOptions */

/** @type {VuePluginOptions} */
const vuePluginOptions = {
  // @ts-ignore
  nodeIntegration: true,
  mainProcessFile: 'src/electron/main.ts',
  chainWebpackMainProcess(config) {
    config.resolve.alias.delete('@');
    config.resolve.plugin('tsconfig-paths').use(TsconfigPathsPlugin);
  },
  chainWebpackRendererProcess(config) {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.whitespace = 'condense';
        return options;
      });
  },
  mainProcessWatch: ['src/electron/**/*'],
  removeElectronJunk: true,
  builderOptions: {
    appId: 'com.shayded.enjinn',
    productName: 'ENJINN',
  },
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
  },
  productionSourceMap: false,
};
