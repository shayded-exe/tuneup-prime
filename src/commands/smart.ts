import { Command, flags } from '@oclif/command';

import { appConf, AppConfKey } from '../conf';
import { EngineDB } from '../engine/engine-db';

export default class Smart extends Command {
  static readonly description = 'Generate smart playlists';

  static readonly flags = {
    help: flags.help({ char: 'h' }),
  };

  async run() {
    const {} = this.parse(Smart);

    const engineLibraryFolder = appConf.get(AppConfKey.EngineLibraryFolder);
    const engineDb = EngineDB.connect(engineLibraryFolder);

    const playlists = await engineDb.table('Playlist').select('*');
    console.log(playlists);

    engineDb.disconnect();
  }
}
