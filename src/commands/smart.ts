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

    const libraryFolder = appConf.get(AppConfKey.EngineLibraryFolder);
    console.log(libraryFolder);
    throw new Error();
    const playlistConfig = await readSmartPlaylistConfig(libraryFolder);
    const engineDb = engine.EngineDB.connect(libraryFolder);

    try {
      const outputs = await buildSmartPlaylists({
        config: playlistConfig,
        engineDb,
      });

      this.log(`SUCCESS - Created ${outputs.length} smart playlists`);

      outputs.forEach(x =>
        this.log(`\t${x.playlist.title} [${x.tracks.length} tracks]`),
      );
    } finally {
      engineDb.disconnect();
    }
  }
}
