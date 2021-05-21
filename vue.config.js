// @ts-check

/** @typedef {import('@vue/cli-service').ProjectOptions} ProjectOptions */
/** @typedef {import('vue-cli-plugin-electron-builder').PluginOptions} VuePluginOptions */

/** @type {VuePluginOptions} */
const vuePluginOptions = {};

/** @type {ProjectOptions} */
module.exports = {
  pages: {
    index: {
      entry: 'src/main.ts',
      title: 'ENJINN',
    },
  },
  pluginOptions: vuePluginOptions,
};
