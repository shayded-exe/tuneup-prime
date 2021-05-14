import { Hook } from '@oclif/config';
import chalk from 'chalk';
import os from 'os';
import path from 'path';
import prompts from 'prompts';
import { trueCasePath } from 'true-case-path';

import { Activate } from '../../commands/activate';
import { appConf, AppConfKey } from '../../conf';
import * as engine from '../../engine';
import {
  checkPathExists,
  checkPathIsDir,
  resolvePathToCwdIfRelative,
  spinner,
} from '../../utils';

export default prerunEngineLibrary;

export const prerunEngineLibrary: Hook<'prerun'> = async function (ctx) {
  if ([Activate.id, 'update'].includes(ctx.Command.id)) {
    return;
  }

  let needsUpdate = false;
  let folder = appConf().get(AppConfKey.EngineLibraryFolder);

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
    appConf().set(AppConfKey.EngineLibraryFolder, folder);
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
  return prompts<'folder'>({
    type: 'text',
    name: 'folder',
    message: 'Where is your Engine library folder?',
    initial: path.join(os.homedir(), 'Music', engine.DEFAULT_LIBRARY_FOLDER),
    validate: v => validateLibraryFolder(resolvePathToCwdIfRelative(v)),
    format: v => trueCasePath(resolvePathToCwdIfRelative(v)),
  }).then(x => x.folder);
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
