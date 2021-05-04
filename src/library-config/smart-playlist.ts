export interface SmartPlaylist {
  name: string;
  // TODO: Support
  sources?: string[];
  rules: PlaylistRuleGroup;
}

export type PlaylistRuleGroup = PlaylistRuleAndGroup | PlaylistRuleOrGroup;

export type PlaylistRuleNode = PlaylistRule | PlaylistRuleGroup;

export interface PlaylistRuleAndGroup {
  and: PlaylistRuleNode[];
}

export interface PlaylistRuleOrGroup {
  or: PlaylistRuleNode[];
}

export type PlaylistRule = StringPlaylistRule | NumericPlaylistRule;

export interface StringPlaylistRule {
  field: StringFilterField;
  operator: StringFilterOperator;
  value: string;
  caseSensitive?: boolean;
}

export interface NumericPlaylistRule {
  field: NumericFilterField;
  operator: NumericFilterOperator;
  value: number;
}

export type FilterField = StringFilterField | NumericFilterField;

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

export enum NumericFilterField {
  // Key = 'key',
  Bitrate = 'bitrate',
  Bpm = 'bpm',
  Length = 'length',
  Rating = 'rating',
  Year = 'year',
}

export enum StringFilterOperator {
  Equals = 'equals',
  NotEqual = 'notequal',
  Contains = 'contains',
  Excludes = 'excludes',
  Regex = 'regex',
}

export enum NumericFilterOperator {
  Equals = '=',
  NotEqual = '!=',
  GreaterThan = '>',
  GreaterThanEquals = '>=',
  LessThan = '<',
  LessThanEquals = '<=',
}
