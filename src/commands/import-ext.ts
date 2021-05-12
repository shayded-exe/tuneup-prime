import chalk from 'chalk';
import * as path from 'path';
import prompts from 'prompts';

import { BaseEngineCommand } from '../base-commands';
import * as engine from '../engine';
import { isLicensed } from '../licensing';
import { asyncSeries, getExtDrives, PromptHints, spinner } from '../utils';

export default class ImportExt extends BaseEngineCommand {
  static readonly description = 'import playlists from libraries on USB drives';

  private extEngineDb?: engine.EngineDB;

  async run() {
    if (!this.checkLicense()) {
      return;
    }

    await this.connectToEngine();

    if (this.engineDb.version === engine.Version.V2_0) {
      this.error(`import-ext doesn't support Engine 2.0 yet`);
    }

    const extLibraries = await spinner({
      text: 'Detect external Engine libraries',
      run: async ctx => {
        const libraries = await this.getExtLibraries();
        const length = libraries.length;
        if (length) {
          ctx.succeed(
            chalk`Found {blue ${length.toString()}} external ${
              length > 1 ? 'libraries' : 'library'
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

    const selectedLibrary = await this.promptForExtLibrarySelection(
      extLibraries,
    );

    this.extEngineDb = await spinner({
      text: 'Connect to external Engine DB',
      successMessage: 'Connected to external Engine DB',
      run: async () => engine.connect(selectedLibrary, { skipBackup: true }),
    });

    const extPlaylists = await spinner({
      text: 'Find external playlists',
      run: async ctx => {
        const extPlaylists = await this.extEngineDb!.getPlaylists();
        const length = extPlaylists.length;
        if (length) {
          ctx.succeed(
            chalk`Fond {blue ${length.toString()}} external playlists`,
          );
        } else {
          ctx.warn(`Didn't find any external playlists`);
        }
        return extPlaylists;
      },
    });

    const selectedPlaylists = await this.promptForExtPlaylistSelection(
      extPlaylists,
    );

    const importedPlaylists = await spinner({
      text: 'Import playlists',
      run: async ctx => {
        const imported = await this.importPlaylists(selectedPlaylists);
      },
    });
  }

  async finally() {
    if (this.extEngineDb) {
      await this.extEngineDb.disconnect();
    }

    await super.finally();
  }

  private checkLicense(): boolean {
    if (!isLicensed()) {
      this.log(
        chalk`{yellow Warning} The import-ext command isn't included in the free version.`,
      );
      return false;
    }

    return true;
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

  private async promptForExtLibrarySelection(
    libraries: engine.LibraryInfo[],
  ): Promise<engine.LibraryInfo> {
    return prompts<'library'>({
      type: 'select',
      name: 'library',
      message: 'Which library would you like to import from?',
      choices: libraries.map(l => ({ title: l.folder, value: l })),
      hint: PromptHints.Select,
    }).then(x => x.library);
  }

  private async promptForExtPlaylistSelection(
    playlists: engine.Playlist[],
  ): Promise<engine.Playlist[]> {
    return prompts<'playlists'>({
      type: 'multiselect',
      name: 'playlists',
      message: 'Which playlists would you like to import?',
      choices: playlists.map(p => ({ title: p.title, value: p })),
      min: 1,
      instructions: false,
      hint: PromptHints.Multiselect,
    }).then(x => x.playlists);
  }

  private async importPlaylists(
    extPlaylists: engine.Playlist[],
  ): Promise<engine.Playlist[]> {
    return asyncSeries(
      extPlaylists.map(extPlaylist => async () => {
        const tracks = await this.extEngineDb!.getPlaylistTracks(
          extPlaylist.id,
        );
        const mapping = await this.extEngineDb!.getExtTrackMapping(tracks);

        return this.engineDb.createOrUpdatePlaylist({
          title: extPlaylist.title,
          tracks: tracks.map(t => mapping[t.id]),
        });
      }),
    );
  }
}
