import chalk from 'chalk';
import fs from 'fs';
import { compact, pick } from 'lodash';
import path from 'path';
import pluralize from 'pluralize';

import { BaseEngineCommand } from '../base-commands';
import * as engine from '../engine';
import { isLicensed } from '../licensing';
import { asyncSeries, spinner } from '../utils';

export default class StripAccents extends BaseEngineCommand {
  static readonly description = 'strip accents from tags and filenames';

  async run() {
    if (!this.checkLicense()) {
      return;
    }

    this.warnBlock(
      `This will NOT update tags in your files. It will only update tags in the Engine DB.`,
    );

    await this.connectToEngine();

    this.log();
    const accented = await spinner({
      text: 'Find accented tracks',
      run: async ctx => {
        const accented = await this.findTracksWithAccents();
        const length = accented.length;

        const msgSuffix = `${pluralize(
          'track',
          length,
        )} with accents in their filename or tags`;

        if (length) {
          ctx.succeed(chalk`Found {yellow ${length.toString()}} ${msgSuffix}`);
          this.logTracks(accented);
        } else {
          ctx.warn(`Didn't find any ${msgSuffix}`);
        }

        return accented;
      },
    });
    this.log();

    if (!accented.length) {
      return;
    }

    await spinner({
      text: 'Strip accents from tracks and save to Engine DB',
      successMessage: 'Stripped accents from tracks and saved to Engine DB',
      run: async () =>
        asyncSeries(
          accented.map(
            track => async () => this.stripAccentsAndSaveTrack(track),
          ),
        ),
    });
  }

  private checkLicense(): boolean {
    if (!isLicensed()) {
      this.warnBlock(
        chalk`The {cyan ${StripAccents.id}} command isn't included in the free version.`,
      );
      return false;
    }

    return true;
  }

  private async findTracksWithAccents(): Promise<engine.Track[]> {
    const tracks = await this.engineDb.getTracks();

    return tracks.filter(track =>
      ACCENTS_REGEX.test(
        compact(Object.values(pick(track, TRACK_ACCENT_FIELDS))).join(''),
      ),
    );
  }

  private async stripAccentsAndSaveTrack(track: engine.Track) {
    const origFilename = track.filename;

    TRACK_ACCENT_FIELDS.forEach(field => {
      const value = track[field];

      if (value) {
        track[field] = ACCENT_REPLACE_FUNCS.reduce((v, func) => func(v), value);
      }
    });

    if (track.filename !== origFilename) {
      const oldPath = track.path;
      const parsedPath = path.parse(oldPath);
      track.path = path.join(parsedPath.dir, track.filename);

      const oldFile = path.resolve(this.libraryFolder, oldPath);
      const newFile = path.resolve(this.libraryFolder, track.path);

      await fs.promises.rename(oldFile, newFile);
    }

    await this.engineDb.updateTracks([track]);
  }
}

const TRACK_ACCENT_FIELDS = [
  'album',
  'artist',
  'comment',
  'composer',
  'filename',
  'genre',
  'label',
  'remixer',
  'title',
] as const;

// spell-checker: disable
const ACCENT_MAP = {
  ÀÁÂÃÄÅ: 'A',
  àáâãäå: 'a',
  ÈÉÊË: 'E',
  èéêë: 'e',
  ÌÍÎÏ: 'I',
  ìíîï: 'i',
  ÒÓÔÕÖØ: 'O',
  òóôõöø: 'o',
  ÙÚÛÜ: 'U',
  ùúûüµ: 'u',
  ß: 'B',
  Ç: 'C',
  ç: 'c',
  Ææ: 'AE',
  Œœ: 'OE',
  Ðð: 'DH',
  Þþ: 'TH',
  '¢£€¤¥': '$',
  '©': 'c',
  '¡': '!',
  '×': 'x',
  '·': '.',
  '¿÷«»': '_',
} as const;
// spell-checker: enable

const ALL_ACCENTS = Object.keys(ACCENT_MAP).join('');
const ACCENTS_REGEX = new RegExp(`[${ALL_ACCENTS}]`, 'g');
const ACCENT_REPLACE_FUNCS = Object.entries(ACCENT_MAP).map(([key, value]) => {
  const regex = new RegExp(`[${key}]`, 'g');

  return (v: string) => v.replace(regex, value);
});
