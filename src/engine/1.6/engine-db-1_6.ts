import { EngineDB } from '../engine-db';
import { Playlist, PlaylistInput, Track } from '../public-schema';

export class EngineDB_1_6 extends EngineDB {
  static async connect(dbPath: string): Promise<EngineDB_1_6> {
    const db = new EngineDB_1_6(dbPath);
    await db.init();

    return db;
  }

  getPlaylists(): Promise<Playlist[]> {
    throw new Error('Method not implemented.');
  }
  createPlaylist(input: PlaylistInput): Promise<Playlist> {
    throw new Error('Method not implemented.');
  }
  getTracks(): Promise<Track[]> {
    throw new Error('Method not implemented.');
  }
}
