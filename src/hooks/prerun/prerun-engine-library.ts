import { Hook } from '@oclif/config';
import chalk from 'chalk';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';
import { trueCasePath } from 'true-case-path';

import { appConf, AppConfKey } from '../../conf';
import * as engine from '../../engine';
import { checkPathExists, checkPathIsDir, spinner } from '../../utils';

export default prerunEngineLibrary;

export const prerunEngineLibrary: Hook<'prerun'> = async function (ctx) {
  if (ctx.Command.id === 'update') {
    return;
  }

  let needsUpdate = false;
  let folder = appConf.get(AppConfKey.EngineLibraryFolder);

  if (!folder) {
    needsUpdate = true;
  } else {
    const validationResult = await validateLibraryFolder(folder);

    if (validationResult !== true) {
      this.warn(`Engine library: ${validationResult} (${folder})`);
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    folder = await promptForLibraryFolder();
    appConf.set(AppConfKey.EngineLibraryFolder, folder);
  }

  await spinner({
    text: 'Detecting Engine library',
    run: async ctx => {
      const { version } = await engine.getLibraryInfo(folder);
      ctx.succeed(chalk`Detected Engine library [{green v${version}}]`);
    },
  });

  this.log(chalk`    {blue ${folder}}`);
};

async function promptForLibraryFolder(): Promise<string> {
  return inquirer
    .prompt<{ folder: string }>({
      type: 'input',
      name: 'folder',
      message: 'Where is your Engine library folder?',
      default: path.join(os.homedir(), 'Music', 'Engine Library'),
      validate: validateLibraryFolder,
    })
    .then(x => trueCasePath(x.folder));
}

async function validateLibraryFolder(folder: string): Promise<true | string> {
  if (!(await checkPathExists(folder))) {
    return `Path doesn't exist`;
  }
  if (!(await checkPathIsDir(folder))) {
    return `Path isn't a folder`;
  }
  if (!path.isAbsolute(folder)) {
    return 'Path must be absolute';
  }

  try {
    await engine.getLibraryInfo(folder);
  } catch {
    return `Path isn't an Engine library`;
  }

  return true;
}
