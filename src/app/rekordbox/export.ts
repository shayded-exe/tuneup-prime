import * as engine from '@/app/engine';
import dateFormat from 'dateformat';
import fs from 'fs';
import { uniqBy } from 'lodash';
import { Builder } from 'xml2js';

import * as xmlSchema from './xml-schema';

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

function buildXmlObject(playlists: engine.PlaylistInput[]): xmlSchema.Library {
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
        TRACK: tracks.map(buildTrack),
      },
      PLAYLISTS: {
        NODE: [],
      },
    },
  };
}

function buildTrack(track: engine.Track): xmlSchema.Track {
  return {
    $: {
      TrackID: track.id,
      Album: track.album,
      Artist: track.artist,
      AverageBpm: track.bpmAnalyzed?.toFixed(2),
      BitRate: track.bitrate,
      Comments: track.comment,
      Composer: track.composer,
      DateAdded: formatDate(track.dateAdded),
      DiscNumber: 1,
      Genre: track.genre,
      Kind: `${track.fileType.toUpperCase()} File` as const,
      Label: track.label,
      Location: getLocation(track),
      Name: track.title,
      PlayCount: +track.isPlayed,
      Rating: track.normalizedRating * 51,
      Remixer: track.remixer,
      SampleRate: track.beatData?.sampleRate,
      Size: track.fileBytes,
      // TODO
      Tonality: 'C',
      TotalTime: track.length,
      TrackNumber: track.playOrder,
      Year: track.year,
    },
    // TODO
    TEMPO: buildTempos(track),
    POSITION_MARK: buildPositionMarks(track),
  };
}

function formatDate(epoch: number): xmlSchema.Date {
  return dateFormat(epoch, 'isoDate') as xmlSchema.Date;
}

function getLocation(track: engine.Track): xmlSchema.Location {
  return `file://localhost/${encodeURI(track.absolutePath)}` as const;
}

function buildTempos(track: engine.Track): xmlSchema.Tempo[] {
  if (!track.isAnalyzed) {
    return [];
  }

  const { sampleRate, markers } = track.beatData!;

  return markers.slice(0, -1).map<xmlSchema.Tempo>((marker, i) => {
    const nextMarker = markers[i + 1];
    let startTime = marker.sample / sampleRate;
    const nextStartTime = nextMarker.sample / sampleRate;
    const secondsPerBeat = (nextStartTime - startTime) / marker.beatsToNext;

    // Shift by one bar so start time is positive
    if (marker.beatIndex < 0) {
      startTime += secondsPerBeat * 4;
    }

    return {
      $: {
        Inzio: startTime.toFixed(3),
        Bpm: (60 / secondsPerBeat).toFixed(2),
        Metro: '4/4',
        Battito: (Math.abs(marker.beatIndex) + 1) % 4,
      },
    };
  });
}

function buildPositionMarks(track: engine.Track): xmlSchema.PositionMark[] {
  if (!track.isAnalyzed) {
    return [];
  }

  const { sampleRate } = track.beatData!;

  const hotCues = track.quickCues!.map<xmlSchema.PositionMark>(cue => {
    const startTime = cue.sample / sampleRate;
    const { red, green, blue } = cue.color;

    return {
      $: {
        Name: cue.name,
        Type: xmlSchema.PositionMarkType.Cue,
        Start: startTime.toFixed(3),
        Num: cue.index,
        Red: red,
        Green: green,
        Blue: blue,
      },
    };
  });

  const loops = track.loops!.map<xmlSchema.PositionMark>(loop => {
    const startTime = loop.startSample / sampleRate;
    const endTime = loop.endSample / sampleRate;
    const { red, green, blue } = loop.color;

    return {
      $: {
        Name: loop.name,
        Type: xmlSchema.PositionMarkType.Loop,
        Start: startTime.toFixed(3),
        End: endTime.toFixed(3),
        Num: -1,
        Red: red,
        Green: green,
        Blue: blue,
      },
    };
  });

  return [...hotCues, ...loops];
}
