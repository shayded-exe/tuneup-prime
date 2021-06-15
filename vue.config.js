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
    appId: 'com.shayded.tuneup-prime',
    productName: 'tuneup PRIME',
    afterSign: 'electron-builder-notarize',
    directories: {
      buildResources: 'build-resources',
    },
    win: {
      target: 'nsis',
      icon: 'build-resources/icon.png',
    },
    mac: {
      target: 'dmg',
      icon: 'build-resources/icon.icns',
      category: 'public.app-category.utilities',
      entitlements: 'build-resources/entitlements.mac.plist',
      entitlementsInherit: 'build-resources/entitlements.mac.plist',
    },
    dmg: {
      background: 'build-resources/dmg-background.tiff',
      icon: 'build-resources/icon.icns',
      title: '${productName}',
    },
    publish: {
      provider: 'github',
      owner: 'rshea0',
      repo: 'tuneup-prime',
      vPrefixedTagName: true,
    },
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
      title: 'tuneup PRIME',
    },
  },
  pluginOptions: {
    electronBuilder: vuePluginOptions,
  },
  productionSourceMap: false,
};
