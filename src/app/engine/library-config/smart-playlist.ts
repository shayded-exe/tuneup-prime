export type PlaylistNode = PlaylistFolder | Playlist;

export interface PlaylistFolder {
  name: string;
  children: PlaylistNode[];
}

export interface Playlist {
  name: string;
  isCrate?: boolean;
  // TODO: Support
  sources?: string[];
  rules: PlaylistRuleGroup;
}

export function isPlaylistNodeFolder(
  node: PlaylistNode,
): node is PlaylistFolder {
  return 'children' in node;
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

export type StringPlaylistRule =
  | StringPlaylistRuleObject
  | StringPlaylistRuleArray;

export interface StringPlaylistRuleObject extends StringPlaylistRuleOptions {
  field: StringFilterField;
  operator: StringFilterOperator;
  value: string;
}

export type StringPlaylistRuleArray = [
  StringFilterField,
  StringFilterOperator,
  string,
  StringPlaylistRuleOptions?,
];

export interface StringPlaylistRuleOptions {
  caseSensitive?: boolean;
}

export type NumericPlaylistRule =
  | NumericPlaylistRuleObject
  | NumericPlaylistRuleArray;

export interface NumericPlaylistRuleObject {
  field: NumericFilterField;
  operator: NumericFilterOperator;
  value: number;
}

export type NumericPlaylistRuleArray = [
  NumericFilterField,
  NumericFilterOperator,
  number,
];

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
