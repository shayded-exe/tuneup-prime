import { Command, flags } from '@oclif/command';

import * as smart from '../command-libs/smart';
import { appConf, AppConfKey } from '../conf';
import * as engine from '../engine';
import { readLibraryConfig } from '../library-config';

export default class Smart extends Command {
  static readonly description = 'generate smart playlists';

  static readonly flags = {
    help: flags.help({ char: 'h' }),
  };

  async run() {
    const {} = this.parse(Smart);

    const libraryFolder = appConf.get(AppConfKey.EngineLibraryFolder);
    const libraryConfig = await readLibraryConfig(libraryFolder);
    const engineDb = await engine.connect(libraryFolder);

    try {
      const outputs = await smart.buildSmartPlaylists({
        config: libraryConfig,
        engineDb,
      });

      this.log(`SUCCESS - Created ${outputs.length} smart playlists`);

      outputs.forEach(x =>
        this.log(`\t${x.title} [${x.tracks.length} tracks]`),
      );
    } finally {
      await engineDb.disconnect();
    }
  }
}
