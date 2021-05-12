import chalk from 'chalk';
import * as path from 'path';
import prompts from 'prompts';

import { BaseEngineCommand } from '../base-commands';
import * as engine from '../engine';
import { getExternalDrives, spinner } from '../utils';

export default class ImportExt extends BaseEngineCommand {
  static readonly description = 'import playlists from libraries on USB drives';

  async run() {
    await this.connectToEngine();

    if (this.engineDb.version === engine.Version.V2_0) {
      this.error(`import-ext doesn't support Engine 2.0 yet`);
    }

    const extLibraries = await spinner({
      text: 'Detect external Engine libraries',
      run: async ctx => {
        const libraries = await this.getExternalLibraries();
        const numLibraries = libraries.length;
        if (numLibraries) {
          ctx.succeed(
            chalk`Found {blue ${numLibraries.toString()}} external ${
              numLibraries > 1 ? 'libraries' : 'library'
            }`,
          );
        } else {
          ctx.warn(`Didn't find any external Engine libraries`);
        }
        return libraries;
      },
    });

    if (!extLibraries.length) {
      return;
    }

    const selectedLibraries = await this.promptForLibrarySelection(
      extLibraries,
    );
    console.log(selectedLibraries);
  }

  private async getExternalLibraries(): Promise<engine.LibraryInfo[]> {
    const drives = await getExternalDrives();
    const libraries = [];

    for (let drive of drives) {
      try {
        const libraryPath = path.join(
          drive.mounted,
          engine.DEFAULT_LIBRARY_FOLDER,
        );
        const info = await engine.getLibraryInfo(libraryPath);
        if (info.version === this.engineDb.version) {
          libraries.push(info);
        }
      } catch {}
    }

    return libraries.map(l => l);
  }

  private async promptForLibrarySelection(
    libraries: engine.LibraryInfo[],
  ): Promise<engine.LibraryInfo[]> {
    return prompts<'libraries'>({
      type: 'multiselect',
      name: 'libraries',
      message: 'Which libraries would you like to import from?',
      choices: libraries.map(l => ({ title: l.folder, value: l })),
      min: 1,
      instructions: false,
      hint: 'use space to select, enter to submit',
    }).then(x => x.libraries);
  }
}
