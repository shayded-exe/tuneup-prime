export interface SmartPlaylistConfig {
  smartPlaylists: SmartPlaylist[];
}

export interface SmartPlaylist {
  name: string;
  sources?: string[];
  rules: PlaylistRule[];
}

type PlaylistRuleGroup = PlaylistRuleAndGroup | PlaylistRuleOrGroup;

type PlaylistRuleNode = PlaylistRule | PlaylistRuleGroup;

export interface PlaylistRuleAndGroup {
  and: PlaylistRuleNode[];
}

export interface PlaylistRuleOrGroup {
  or: PlaylistRuleNode[];
}

export interface PlaylistRule {
  field: StringFilterField;
  operator: StringFilterOperator;
  value: string;
  caseSensitive?: boolean;
}

export enum StringFilterField {
  Album = 'album',
  Artist = 'artist',
  Comment = 'comment',
  Composer = 'composer',
  Filename = 'filename',
  FileType = 'fileType',
  Genre = 'genre',
  Label = 'label',
  Path = 'path',
  Remixer = 'remixer',
  Title = 'title',
}

export enum NumberFilterField {
  // Key = 'key',
  Bitrate = 'bitrate',
  Bpm = 'bpm',
  Length = 'length',
  Rating = 'rating',
  Year = 'year',
}

export type FilterField = StringFilterField | NumberFilterField;

export enum StringFilterOperator {
  Equals = '=',
  NotEqual = '!=',
  Contains = 'contains',
  Excludes = 'excludes',
  Regex = 'regex',
}

export enum NumberFilterOperator {
  Equals = '=',
  NotEqual = '!=',
  LessThan = '<',
  LessThanEquals = '<=',
  GreaterThan = '>',
  GreaterThanEquals = '>=',
}
