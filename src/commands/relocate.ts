import Command from '@oclif/command';
import chalk from 'chalk';
import cli from 'cli-ux';
import inquirer from 'inquirer';
import { keyBy, partition } from 'lodash';
import path from 'path';
import { trueCasePath } from 'true-case-path';

import { appConf, AppConfKey } from '../conf';
import * as engine from '../engine';
import { EngineDB } from '../engine';
import { checkPathExists, checkPathIsDir, getFilesInDir } from '../utils';

export default class Relocate extends Command {
  static readonly description = 'relocate missing tracks';

  private libraryFolder!: string;
  private engineDb!: EngineDB;

  async run() {
    const {} = this.parse(Relocate);

    this.libraryFolder = appConf.get(AppConfKey.EngineLibraryFolder);

    cli.action.start('Connecting to Engine DB');
    this.engineDb = await engine.connect(this.libraryFolder);
    cli.action.stop();

    cli.action.start('Find missing tracks');
    const missingTracks = await this.findMissingTracks();
    cli.action.stop();
    this.log();

    this.log(
      chalk`Found {red ${missingTracks.length.toString()}} missing tracks:`,
    );
    this.logTracks(missingTracks);

    const searchFolder = await this.promptForSearchFolder();

    cli.action.start('Relocate missing tracks');
    const { relocated, stillMissing } = await this.relocateMissingTracks({
      missingTracks,
      searchFolder,
    });
    cli.action.stop();
    this.log();

    this.log(chalk`Relocated {green ${relocated.length.toString()}} tracks:`);
    this.logTracks(relocated);

    this.log(
      chalk`Couldn't find {red ${stillMissing.length.toString()}} tracks:`,
    );
    this.logTracks(stillMissing);

    cli.action.start('Save relocated tracks in Engine');
    await this.engineDb.updateTrackPaths(relocated);
    cli.action.stop();
  }

  protected async finally() {
    await this.engineDb.disconnect();
  }

  private async findMissingTracks(): Promise<engine.Track[]> {
    const tracks = await this.engineDb.getTracks();
    const missing = [];

    for (const track of tracks) {
      const resolvedPath = path.resolve(this.libraryFolder, track.path);
      if (!(await checkPathExists(resolvedPath))) {
        missing.push(track);
      }
    }

    return missing;
  }

  private async promptForSearchFolder(): Promise<string> {
    async function validateSearchFolder(
      folder: string,
    ): Promise<true | string> {
      if (!(await checkPathExists(folder))) {
        return `Path doesn't exist`;
      }
      if (!(await checkPathIsDir(folder))) {
        return `Path isn't a folder`;
      }
      if (!path.isAbsolute(folder)) {
        return 'Path must be absolute';
      }
      return true;
    }

    const { searchFolder } = await inquirer.prompt<{ searchFolder: string }>({
      type: 'input',
      name: 'searchFolder',
      message: 'What folder would you like to search for your tracks in?',
      validate: validateSearchFolder,
    });
    this.log();

    return trueCasePath(searchFolder);
  }

  private async relocateMissingTracks({
    missingTracks,
    searchFolder,
  }: {
    missingTracks: engine.Track[];
    searchFolder: string;
  }): Promise<{ relocated: engine.Track[]; stillMissing: engine.Track[] }> {
    const searchFiles = await getFilesInDir({
      path: searchFolder,
      maxDepth: 5,
    });
    const searchFileMap = keyBy(searchFiles, x => x.name);

    const [relocated, stillMissing] = partition(missingTracks, track => {
      const newPath = searchFileMap[track.filename];
      if (!newPath) {
        return false;
      }

      track.path = path
        .relative(this.libraryFolder, newPath.path)
        .replace(/\\/g, '/');

      return true;
    });

    return { relocated, stillMissing };
  }

  private logTracks(tracks: engine.Track[]) {
    tracks.forEach(t => this.log(chalk`\t{blue ${t.path}}`));
    this.log();
  }
}
