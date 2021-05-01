import { Except } from 'type-fest';

import * as publicSchema from '../public-schema';
import { SQLITE_SEQUENCE } from '../sqlite-types';

export interface Tables {
  SQLITE_SEQUENCE: SQLITE_SEQUENCE;
  Information: publicSchema.Information;
}

export type TableNames = keyof Tables;

export enum ListType {
  Playlist = 1,
  History = 2,
  Prepare = 3,
  Crate = 4,
}

export interface List {
  id: number;
  type: ListType;
  title: string;
  path: string;
  isFolder: boolean;
  trackCount: number;
  ordering: number;
  isExplicitlyExported: boolean;
}

export type NewList = Except<List, 'trackCount' | 'ordering'>;

export interface ListTrackList {
  id: number;
  listId: number;
  listType: ListType;
  trackId: number;
  trackIdInOriginDatabase: number;
  databaseUuid: string;
  trackNumber: number;
}

export type NewListTrackList = Except<ListTrackList, 'id'>;

export interface Crate {
  id: number;
  title: string;
  path: string;
}

export enum TrackType {
  Track = 1,
}

export interface Track {
  id: number;
  bitrate: number;
  bpmAnalyzed: number;
  isBeatGridLocked: boolean;
  isExternalTrack: boolean;
  length: number;
  path: string;
  trackType: TrackType;
  year: number;
}

export enum MetaDataType {
  Title = 1,
  Artist = 2,
  Album = 3,
  Genre = 4,
  Comment = 5,
  Label = 6,
  Composer = 7,
  FileType = 13,
}

export interface MetaData {
  id: number;
  type: MetaDataType;
  text: string;
}

export enum MetaDataIntegerType {
  DateAdded = 2,
  DateCreated = 3,
  Key = 4,
}

export interface MetaDataInteger {
  id: number;
  type: MetaDataIntegerType;
  value: number;
}
