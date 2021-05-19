import chalk from 'chalk';
import pluralize from 'pluralize';

import { BaseEngineCommand } from '../base-commands';
import * as engine from '../engine';
import { isLicensed } from '../licensing';
import { spinner } from '../utils';

export default class StripAccents extends BaseEngineCommand {
  async run() {
    if (!this.checkLicense()) {
      return;
    }

    this.warnBlock(
      `This will NOT update tags in your files. It will only update tags in the Engine DB.`,
    );

    await this.connectToEngine();

    const accentedTracks = await spinner({
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
        [
          track.album,
          track.artist,
          track.comment,
          track.composer,
          track.filename,
          track.genre,
          track.label,
          track.remixer,
          track.title,
        ].join(''),
      ),
    );
  }
}

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
  Ææ: 'AE',
  Œœ: 'OE',
  Ðð: 'DH',
  Þþ: 'TH',
  Çç: 'C',
  ß: 'S',
  '¢£€¤¥': '$',
  '©': '©',
  '«»': '"',
  // '·': '.',
  '¡': '!',
  '¿': '?',
  '×': '*',
  '÷': '/',
} as const;
// spell-checker: enable

const ALL_ACCENTS = Object.keys(ACCENT_MAP).join('');
const ACCENTS_REGEX = new RegExp(`[${ALL_ACCENTS}]`);
