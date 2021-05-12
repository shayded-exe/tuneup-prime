import chalk from 'chalk';
import * as path from 'path';
import prompts from 'prompts';

import { BaseEngineCommand } from '../base-commands';
import * as engine from '../engine';
import { multiConnect, MultiEngineDB } from '../engine';
import { getExtDrives, MULTISELECT_PROMPT_HINT, spinner } from '../utils';

export default class ImportExt extends BaseEngineCommand {
  static readonly description = 'import playlists from libraries on USB drives';

  private extEngineDbs?: MultiEngineDB;

  async run() {
    await this.connectToEngine();

    if (this.engineDb.version === engine.Version.V2_0) {
      this.error(`import-ext doesn't support Engine 2.0 yet`);
    }

    const extLibraries = await spinner({
      text: 'Detect external Engine libraries',
      run: async ctx => {
        const libraries = await this.getExtLibraries();
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

    this.extEngineDbs = await spinner({
      text: 'Connect to external Engine DBs',
      successMessage: 'Connected to external Engine DBs',
      run: async () => multiConnect(selectedLibraries),
    });
  }

  async finally() {
    if (this.extEngineDbs) {
      await this.extEngineDbs.disconnect();
    }

    await super.finally();
  }

  private async getExtLibraries(): Promise<engine.LibraryInfo[]> {
    const drives = await getExtDrives();
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
      hint: MULTISELECT_PROMPT_HINT,
    }).then(x => x.libraries);
  }

  // private async getPlaylistsInLibraries(libraries: engine.LibraryInfo[])
}
