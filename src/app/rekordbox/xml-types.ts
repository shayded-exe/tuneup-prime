export type DateAttr = `${number}-${number}-${number}`;

export type LocationAttr = `file://localhost/${string}.${string}`;

export type KindAttr = `${string} File`;

export type MetroAttr = `${number}/${number}`;

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

export interface LibraryXml {
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
      TRACK: TrackElement[];
    };
    PLAYLISTS: {
      NODE: PlaylistNodeElement[];
    };
  };
}

export interface TrackElement {
  $: {
    TrackID: number;
    Name: string;
    Artist: string;
    Composer: string;
    Album: string;
    Grouping: string;
    Genre: string;
    Kind: KindAttr;
    Size: number; // bytes
    TotalTime: number; // seconds
    DiscNumber: number | '';
    TrackNumber: number | '';
    Year: number | '';
    AverageBpm: number | '';
    DateAdded: DateAttr;
    BitRate: number; // kbps
    SampleRate: number; // hz
    Comments: string;
    PlayCount: number;
    Rating: number | '';
    Location: LocationAttr;
    Remixer: string;
    Tonality: Tonality; // key
    Label: string;
    Mix: string; // idk
  };
  TEMPO: TempoElement[];
  POSITION_MARK: PositionMarkElement[];
}

export interface TempoElement {
  $: {
    Inzio: number; // start ms
    Bpm: number;
    Metro: MetroAttr;
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

export interface PositionMarkElement {
  $: {
    Name: string;
    Type: PositionMarkType;
    Start: number; // seconds
    End?: number; // seconds
    Num: number; // 0-7, -1 for mem cue
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

export type PlaylistNodeElement = PlaylistFolderElement | PlaylistElement;

export interface PlaylistFolderElement {
  $: {
    Name: string;
    Type: PlaylistType.Folder;
    Count: number;
  };
  NODE: PlaylistNodeElement[];
}

export interface PlaylistElement {
  $: {
    Name: string;
    Type: PlaylistType.Playlist;
    KeyType: PlaylistKeyType;
    Entries: number;
  };
  TRACK: PlaylistTrackElement[];
}

export interface PlaylistTrackElement {
  $: {
    Key: number | LocationAttr;
  };
}
