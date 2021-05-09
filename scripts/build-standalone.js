// @ts-check
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const _ = require('lodash');

const root = (...paths) => path.resolve(__dirname, '..', ...paths);
const BIN_DIR = 'bin';
const PACK_DIR = 'pack';

async function run() {
  await makePackage();
  await copyBin();
  await copyFonts();
}

async function makePackage() {
  const rootPackage = require('../package.json');
  const webpackPackage = require('../package.webpack.json');
  const newPackage = {
    ...rootPackage,
    ...webpackPackage,
    // Copy package versions from root
    dependencies: _.mapValues(
      webpackPackage.dependencies,
      (_, key) => rootPackage.dependencies[key],
    ),
  };
  delete newPackage.devDependencies;

  await fse.writeJson(root(PACK_DIR, 'package.json'), newPackage);
}

async function copyBin() {
  await fse.copy(root(BIN_DIR), root(PACK_DIR, BIN_DIR));
}

async function copyFonts() {
  const fontFile = name => root('node_modules', 'figlet', 'fonts', name);
  const outFile = name => root(PACK_DIR, 'fonts', name);

  const fonts = ['Jacky.flf'];

  for (let font of fonts) {
    await fse.copy(fontFile(font), outFile(font));
  }
}

run().catch(e => console.error(e));
