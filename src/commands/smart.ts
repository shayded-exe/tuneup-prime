import { Command, flags } from '@oclif/command';

import { appConf, AppConfKey } from '../conf';
import * as engine from '../engine';
import {
  buildSmartPlaylists,
  readSmartPlaylistConfig,
} from '../smart-playlist';

export default class Smart extends Command {
  static readonly description = 'Generate smart playlists';

  static readonly flags = {
    help: flags.help({ char: 'h' }),
  };

  async run() {
    const {} = this.parse(Smart);

    const engineLibraryFolder = appConf.get(AppConfKey.EngineLibraryFolder);
    const playlistConfig = await readSmartPlaylistConfig(engineLibraryFolder);
    const engineDb = engine.EngineDB.connect(engineLibraryFolder);

    try {
      await buildSmartPlaylists({
        config: playlistConfig,
        engineDb,
      });
    } finally {
      engineDb.disconnect();
    }
  }
}
