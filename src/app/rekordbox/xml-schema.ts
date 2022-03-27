export type Date = `${number}-${number}-${number}`;

export type Location = `file://localhost/${string}`;

export type FileKind = `${string} File`;

export type Metro = `${number}/${number}`;

export type Tonality =
  | 'C'
  | 'Am'
  | 'G'
  | 'Em'
  | 'D'
  | 'Bm'
  | 'A'
  | 'F#m'
  | 'E'
  | 'Dbm'
  | 'B'
  | 'Abm'
  | 'F#'
  | 'Ebm'
  | 'Db'
  | 'Bbm'
  | 'Ab'
  | 'Fm'
  | 'Eb'
  | 'Cm'
  | 'Bb'
  | 'Gm'
  | 'F'
  | 'Dm';

export interface Library {
  DJ_PLAYLISTS: {
    $: {
      Version: '1.0.0';
    };
    PRODUCT: {
      $: {
        Name: 'rekordbox';
        Version: '5.6.0';
        Company: 'Pioneer DJ';
      };
    };
    COLLECTION: {
      $: {
        Entries: number;
      };
      TRACK: Track[];
    };
    PLAYLISTS: {
      NODE: PlaylistNode[];
    };
  };
}

export interface Track {
  $: {
    TrackID: number;
    Album?: string;
    Artist?: string;
    AverageBpm?: string;
    BitRate: number; // kbps
    Comments?: string;
    Composer?: string;
    DateAdded: Date;
    DiscNumber?: number;
    Genre?: string;
    Grouping?: string;
    Kind: FileKind;
    Label?: string;
    Location: Location;
    Mix?: string; // idk
    Name: string;
    PlayCount?: number;
    Rating?: number;
    Remixer?: string;
    SampleRate?: number; // hz
    Size: number; // bytes
    Tonality?: Tonality; // key
    TotalTime: number; // seconds
    TrackNumber?: number;
    Year?: number;
  };
  TEMPO: Tempo[];
  POSITION_MARK: PositionMark[];
}

export interface Tempo {
  $: {
    Inzio: string; // start seconds
    Bpm: string;
    Metro: Metro;
    Battito: number; // beat in bar
  };
}

export enum PositionMarkType {
  Cue = 0,
  FadeIn = 1,
  FadeOut = 2,
  Load = 3,
  Loop = 4,
}

export interface PositionMark {
  $: {
    Name: string;
    Type: PositionMarkType;
    Start: string; // seconds
    End?: string; // seconds
    Num: number; // 0-7, -1 for mem cue or loop
    Red?: number;
    Green?: number;
    Blue?: number;
  };
}

export enum PlaylistType {
  Folder = 0,
  Playlist = 1,
}

export enum PlaylistKeyType {
  TrackId = 0,
  Location = 1,
}

export type PlaylistNode = PlaylistFolder | Playlist;

export interface PlaylistFolder {
  $: {
    Name: string;
    Type: PlaylistType.Folder;
    Count: number;
  };
  NODE: PlaylistNode[];
}

export interface Playlist {
  $: {
    Name: string;
    Type: PlaylistType.Playlist;
    KeyType: PlaylistKeyType;
    Entries: number;
  };
  TRACK: PlaylistTrack[];
}

export interface PlaylistTrack {
  $: {
    Key: number | Location;
  };
}
