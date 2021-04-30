import { Hook } from '@oclif/config';
import inquirer from 'inquirer';
import os from 'os';

import { appConf, AppConfKey } from '../../conf';
import { checkPathExists } from '../../utils';

export default hook;

export const hook: Hook<'init'> = async function (options) {
  let isLibraryFolderValid = true;
  let folder: string;

  if (!appConf.has(AppConfKey.EngineLibraryFolder)) {
    isLibraryFolderValid = false;
    folder = await promptForLibraryFolder();
    appConf.set(AppConfKey.EngineLibraryFolder, folder);
  }
};

async function promptForLibraryFolder(): Promise<string> {
  const { folder } = await inquirer.prompt<{ folder: string }>({
    type: 'input',
    name: 'folder',
    message: 'Where is your Engine library folder?',
    default: os.homedir(),
    validate: x => checkPathExists(x),
  });

  return folder;
}
