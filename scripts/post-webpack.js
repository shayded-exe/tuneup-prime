const execa = require('execa');
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
  // await pack();
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
      (value, key) => rootPackage.dependencies[key] || value,
    ),
  };
  newPackage.oclif.plugins.push('@oclif/plugin-update');
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

async function pack() {
  const packScript = root('scripts', 'pack.sh');
  const packTarget = async target => {
    console.log(`Packing ${target}`);
    const sub = execa('bash', [packScript, target]);
    sub.stdout.pipe(process.stdout);
    await sub;
    await fse.remove(root(PACK_DIR, 'tmp'));
  };

  await packTarget('win32');
  await packTarget('darwin');
}

run().catch(e => console.error(e));
