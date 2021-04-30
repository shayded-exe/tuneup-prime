import { Hook } from '@oclif/config';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';

import { appConf, AppConfKey } from '../../conf';
import {
  checkPathExists,
  checkPathIsFile,
  checkPathIsFolder,
} from '../../utils';

export default hook;

export const hook: Hook<'init'> = async function (options) {
  let folderNeedsUpdate = false;
  let folder = appConf.get(AppConfKey.EngineLibraryFolder);

  if (!folder) {
    folderNeedsUpdate = true;
  } else {
    const validationResult = await validateLibraryFolder(folder);

    if (validationResult !== true) {
      this.warn(`Engine library: ${validationResult} (${folder})`);
      folderNeedsUpdate = true;
    }
  }

  if (folderNeedsUpdate) {
    folder = await promptForLibraryFolder();
    appConf.set(AppConfKey.EngineLibraryFolder, folder);
  }
};

async function promptForLibraryFolder(): Promise<string> {
  let isValid: boolean | string = false;

  const { folder } = await inquirer.prompt<{ folder: string }>({
    type: 'input',
    name: 'folder',
    message: 'Where is your Engine library folder?',
    default: path.join(os.homedir(), 'Music', 'Engine Library'),
    validate: async value => {
      isValid = await validateLibraryFolder(value);
      return isValid;
    },
    filter: value => (!isValid ? value : path.normalize(value)),
  });

  return folder;
}

async function validateLibraryFolder(folder: string): Promise<true | string> {
  if (!(await checkPathExists(folder))) {
    return `Path doesn't exist`;
  }
  if (!(await checkPathIsFolder(folder))) {
    return `Path isn't a folder`;
  }
  const dbFile = path.resolve(folder, 'Database2', 'm.db');
  // TODO: Work for Engine 1.6
  if (!(await checkPathIsFile(dbFile))) {
    return `Path isn't an Engine library folder`;
  }

  return true;
}
