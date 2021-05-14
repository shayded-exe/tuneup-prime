// @ts-check
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const libEntry = name => ({
  [name]: {
    import: `./src/${name}`,
    filename: '[name].js',
  },
});

const commandEntry = name => ({
  [name]: {
    import: `./src/commands/${name}`,
    filename: `commands/[name].js`,
  },
});

const hookEntry = (type, name) => {
  const filename = `${type}-${name}`;
  return {
    [filename]: {
      import: `./src/hooks/${type}/${filename}`,
      filename: `hooks/${type}/[name].js`,
    },
  };
};

module.exports = {
  mode: 'production',
  target: 'node14.16',
  entry: {
    ...libEntry('help'),
    ...commandEntry('activate'),
    ...commandEntry('import-ext'),
    ...commandEntry('relocate'),
    ...commandEntry('smart'),
    ...hookEntry('init', 'conf'),
    ...hookEntry('init', 'update'),
    ...hookEntry('prerun', 'engine-library'),
  },
  output: {
    path: path.join(__dirname, 'pack', 'lib'),
    filename: '[name].js',
    chunkFilename: '[name].js',
    library: {
      type: 'commonjs2',
    },
  },
  resolve: {
    extensions: ['.ts', '...'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.node$/,
        loader: 'node-loader',
      },
    ],
  },
  externals: {
    knex: 'commonjs2 knex',
    '@oclif/command': 'commonjs2 @oclif/command',
    '@oclif/config': 'commonjs2 @oclif/config',
    '@oclif/plugin-help': 'commonjs2 @oclif/plugin-help',
    '@oclif/plugin-update': 'commonjs2 @oclif/plugin-update',
    '@oclif/plugin-warn-if-update-available':
      'commonjs2 @oclif/plugin-warn-if-update-available',
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        common: {
          name: 'common',
          chunks: 'initial',
          priority: -20,
          minChunks: 2,
        },
      },
    },
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
};
