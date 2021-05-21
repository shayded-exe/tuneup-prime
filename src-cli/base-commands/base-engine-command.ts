import Command from '@oclif/command';
import chalk from 'chalk';

import { appConf, AppConfKey } from '../conf';
import * as engine from '../engine';
import { spinner } from '../utils';

export abstract class BaseEngineCommand extends Command {
  protected libraryFolder!: string;
  protected engineDb!: engine.EngineDB;

  log(message = '', { indent = 0 }: { indent?: number } = {}) {
    const indentStr = ' '.repeat(indent);
    super.log(indentStr + message);
  }

  logBlock(message: string, opts?: { indent?: number }) {
    super.log();
    this.log(message, opts);
    super.log();
  }

  warn(message: string, opts?: { indent?: number }) {
    this.log(chalk`{yellow Warning}  ${message}`, opts);
  }

  warnBlock(message: string, { indent = 0 }: { indent?: number } = {}) {
    super.log();
    this.warn('', { indent });
    this.log(message, { indent: indent + 2 });
    super.log();
  }

  protected async init() {
    this.libraryFolder = appConf().get(AppConfKey.EngineLibraryFolder);
  }

  protected async finally() {
    if (this.engineDb) {
      await spinner({
        text: 'Disconnect from Engine DB',
        successMessage: 'Disconnected from Engine DB',
        run: async () => this.engineDb.disconnect(),
      });
    }
  }

  protected async connectToEngine() {
    this.engineDb = await spinner({
      text: 'Connect to Engine DB',
      successMessage: 'Connected to Engine DB',
      run: async () => engine.connect(this.libraryFolder),
    });
  }

  protected logTracks(
    tracks: engine.Track[],
    {
      indent = 4,
      color = 'blue',
    }: {
      indent?: number;
      color?: string;
    } = {},
  ) {
    tracks.forEach(t => {
      this.log((chalk as any)[color](t.path), { indent });
    });
  }

  protected logPlaylistsWithTrackCount(
    playlists: engine.PlaylistInput[],
    { indent = 4 }: { indent?: number } = {},
  ) {
    playlists.forEach(({ title, tracks }) => {
      const numTracks = tracks.length;
      if (numTracks) {
        this.log(
          chalk`{blue ${title}} [{green ${numTracks.toString()}} tracks]`,
          { indent },
        );
      } else {
        this.log(chalk`{blue ${title}} [{yellow 0} tracks]`, { indent });
      }
    });
  }
}
