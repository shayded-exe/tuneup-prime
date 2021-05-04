import chalk from 'chalk';
import inquirer from 'inquirer';
import { keyBy, partition } from 'lodash';
import path from 'path';
import { trueCasePath } from 'true-case-path';

import { BaseEngineCommand } from '../base-commands';
import * as engine from '../engine';
import {
  checkPathExists,
  checkPathIsDir,
  getFilesInDir,
  spinner,
} from '../utils';

export default class Relocate extends BaseEngineCommand {
  static readonly description = 'relocate missing tracks';

  async run() {
    await this.connectToEngine();

    const missingTracks = await spinner({
      text: 'Find missing tracks',
      run: async ctx => {
        const missing = await this.findMissingTracks();
        if (missing.length) {
          ctx.succeed(
            chalk`Found {red ${missing.length.toString()}} missing tracks`,
          );
          this.logTracks(missing);
        } else {
          ctx.warn(`Didn't find any missing tracks`);
        }
        return missing;
      },
    });

    if (!missingTracks.length) {
      return;
    }

    const searchFolder = await this.promptForSearchFolder();

    const relocated = await spinner({
      text: 'Relocate missing tracks',
      run: async ctx => {
        const { relocated, stillMissing } = await this.relocateMissingTracks({
          missingTracks,
          searchFolder,
        });

        const numRelocated = relocated.length.toString();
        const numMissing = stillMissing.length.toString();

        if (!relocated.length) {
          ctx.fail(chalk`Couldn't find {red ${numMissing}} tracks`);
        } else if (stillMissing.length) {
          ctx.warn(
            chalk`Relocated {green ${numRelocated}} tracks, couldn't find {red ${numMissing}} tracks`,
          );
        } else {
          ctx.succeed(chalk`Relocated {green ${numRelocated}} tracks`);
        }
        this.logTracks(relocated);
        if (stillMissing.length) {
          this.log('  [still missing]');
          this.logTracks(stillMissing, { color: 'red' });
        }

        return relocated;
      },
    });

    await spinner({
      text: 'Save relocated tracks to Engine',
      run: async () => this.engineDb.updateTrackPaths(relocated),
    });
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

    this.log();
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
}
