import * as engine from '@/app/engine';
import dateFormat from 'dateformat';
import fs from 'fs';
import { uniqBy } from 'lodash';
import { Builder } from 'xml2js';

import { DateAttr, LibraryXml, TrackElement } from './xml-types';

export async function exportXml(
  filePath: string,
  playlists: engine.PlaylistInput[],
): Promise<void> {
  const xmlObject = buildXmlObject(playlists);
  const xml = new Builder({
    xmldec: {
      version: '1.0',
      encoding: 'UTF-8',
      standalone: undefined,
    },
  }).buildObject(xmlObject);

  await fs.promises.writeFile(filePath, xml, 'utf-8');
}

function buildXmlObject(playlists: engine.PlaylistInput[]): LibraryXml {
  const tracks = uniqBy(
    playlists.flatMap(p => p.tracks),
    t => t.id,
  );

  return {
    DJ_PLAYLISTS: {
      $: {
        Version: '1.0.0',
      },
      PRODUCT: {
        $: {
          Name: 'rekordbox',
          Version: '5.6.0',
          Company: 'Pioneer DJ',
        },
      },
      COLLECTION: {
        $: {
          Entries: tracks.length,
        },
        TRACK: tracks.map(buildTrackElement),
      },
    },
  };
}

function buildTrackElement(track: engine.Track): TrackElement {
  return {
    $: {
      TrackID: track.id,
      Name: track.title ?? '',
      Artist: track.artist ?? '',
      Composer: track.composer ?? '',
      Album: track.album ?? '',
      Grouping: '',
      Genre: track.genre ?? '',
      Kind: `${track.fileType.toUpperCase()} File` as const,
      Size: track.fileBytes,
      TotalTime: track.length,
      // I don't think we care enough about this enough to read the file tags to get it
      DiscNumber: 1,
      TrackNumber: track.playOrder ?? '',
      Year: track.year ?? '',
      AverageBpm: track.bpmAnalyzed ?? '',
      DateAdded: formatDate(track.dateAdded!),
      BitRate: track.bitrate,
      // TODO: Pull from trackdata
      SampleRate: 0,
      Comments: track.comment ?? '',
      PlayCount: track.timeLastPlayed ? 1 : 0,
      // TODO: Convert
      Rating: track.rating ?? '',
      // TODO
      Location: '',
      Remixer: track.remixer ?? '',
      // TODO
      Tonality: '',
      Label: track.label ?? '',
      Mix: '',
    },
    // TODO
    TEMPO: [],
    POSITION_MARK: [],
  };
}

function formatDate(epoch: number): DateAttr {
  return dateFormat(epoch, 'isoDate') as DateAttr;
}
