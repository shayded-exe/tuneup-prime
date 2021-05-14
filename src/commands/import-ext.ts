import chalk from 'chalk';
import * as path from 'path';
import pluralize from 'pluralize';
import prompts from 'prompts';

import { BaseEngineCommand } from '../base-commands';
import * as engine from '../engine';
import { isLicensed } from '../licensing';
import { asyncSeries, getExtDrives, PromptHints, spinner } from '../utils';

export default class ImportExt extends BaseEngineCommand {
  static readonly description = 'import playlists from libraries on USB drives';

  protected engineDb!: engine.V1_6.EngineDB_1_6;

  private extEngineDb?: engine.V1_6.EngineDB_1_6;

  async run() {
    if (!this.checkLicense()) {
      return;
    }

    await this.connectToEngine();

    if (this.engineDb.version === engine.Version.V2_0) {
      this.error(`${ImportExt.name} doesn't support Engine 2.0`);
    }

    const extLibraries = await spinner({
      text: 'Detect external Engine libraries',
      run: async ctx => {
        const libraries = await this.getExtLibraries();
        const length = libraries.length;
        if (length) {
          ctx.succeed(
            chalk`Found {blue ${length.toString()}} external ${pluralize(
              'library',
              length,
            )}`,
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
      run: async () =>
        engine.connect<engine.V1_6.EngineDB_1_6>(selectedLibrary, {
          skipBackup: true,
        }),
    });

    const extPlaylists = await spinner({
      text: 'Find external playlists',
      run: async ctx => {
        const extPlaylists = await this.extEngineDb!.getPlaylists();
        const length = extPlaylists.length;
        if (length) {
          ctx.succeed(
            chalk`Found {blue ${length.toString()}} external ${pluralize(
              'playlist',
              length,
            )}`,
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

    const inputs = await spinner({
      text: 'Import external playlists',
      run: async ctx => {
        const imported = await this.importPlaylists(selectedPlaylists);

        ctx.succeed(
          chalk`Imported {blue ${imported.length.toString()}} external ${pluralize(
            'playlist',
            imported.length,
          )}`,
        );
        this.logPlaylistsWithTrackCount(imported);

        return imported;
      },
    });

    await spinner({
      text: 'Save external playlists to Engine',
      successMessage: 'Saved external playlists to Engine',
      run: async () =>
        asyncSeries(
          inputs.map(
            input => async () => this.engineDb.createOrUpdatePlaylist(input),
          ),
        ),
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
        chalk`{yellow Warning} The {cyan ${ImportExt.name}} command isn't included in the free version.`,
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
  ): Promise<engine.V1_6.PlaylistInput[]> {
    return asyncSeries(
      extPlaylists.map(extPlaylist => async () => {
        const tracks = await this.extEngineDb!.getPlaylistTracks(
          extPlaylist.id,
        );
        const mapping = await this.extEngineDb!.getExtTrackMapping(tracks);

        return {
          title: extPlaylist.title,
          path: extPlaylist.path,
          tracks: tracks.map(t => mapping[t.id]),
        };
      }),
    );
  }
}
