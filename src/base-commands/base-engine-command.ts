import Command from '@oclif/command';
import chalk from 'chalk';

import { appConf, AppConfKey } from '../conf';
import * as engine from '../engine';
import { spinner } from '../utils';

export abstract class BaseEngineCommand extends Command {
  protected libraryFolder!: string;
  protected engineDb!: engine.EngineDB;

  protected async init() {
    this.libraryFolder = appConf().get(AppConfKey.EngineLibraryFolder);
  }

  protected async finally() {
    await this.engineDb?.disconnect();
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
    const indentStr = ' '.repeat(indent);
    tracks.forEach(t =>
      this.log(`${indentStr}${(chalk as any)[color](t.path)}`),
    );
  }

  protected logPlaylistsWithTrackCount(
    playlists: engine.PlaylistInput[],
    { indent = 4 }: { indent?: number } = {},
  ) {
    const indentStr = ' '.repeat(indent);
    playlists.forEach(({ title, tracks }) => {
      const numTracks = tracks.length;
      if (numTracks) {
        this.log(
          chalk`${indentStr}{blue ${title}} [{green ${numTracks.toString()}} tracks]`,
        );
      } else {
        this.log(chalk`${indentStr}{blue ${title}} [{yellow 0} tracks]`);
      }
    });
  }
}
