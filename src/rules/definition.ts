export interface SmartPlaylist {
  name: string;
  sources?: string[];
  rules: SmartPlaylistRule[];
}

export interface SmartPlaylistRule {
  field: StringFilterField;
}

export enum StringFilterField {
  Length = 'length',
  Year = 'year',
  Path = 'path',
  Filename = 'filename',
  Title = 'title',
  Artist = 'artist',
  Album = 'album',
  Genre = 'genre',
  Comment = 'comment',
  Label = 'label',
  Composer = 'composer',
  Remixer = 'remixer',
  FileType = 'fileType',
}

export enum NumberFilterField {
  // Key = 'key',
  Rating = 'rating',
  Bitrate = 'bitrate',
  Bpm = 'bpm',
}

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
