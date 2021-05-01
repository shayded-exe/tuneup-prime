import { Except } from 'type-fest';

import * as publicSchema from '../public-schema';
import { IntBoolean, SQLITE_SEQUENCE } from '../sqlite-types';

export interface Tables {
  SQLITE_SEQUENCE: SQLITE_SEQUENCE;
  Information: publicSchema.Information;
  List: List;
  ListTrackList: ListTrackList;
  ListParentList: ListParentList;
  Crate: Crate;
  Track: Track;
  MetaData: MetaData;
  MetaDataInteger: MetaDataInteger;
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
  isFolder: IntBoolean;
  isExplicitlyExported: IntBoolean;
  trackCount: number;
  ordering: number;
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

export interface ListParentList {
  listOriginId: number;
  listOriginType: ListType;
  listParentId: number;
  listParentType: ListType;
}

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
  filename: string;
  isBeatGridLocked: boolean;
  isExternalTrack: boolean;
  length: number;
  path: string;
  trackType: TrackType;
  year: number;
}

export interface TrackMeta {
  album: string;
  artist: string;
  comment: string;
  composer: string;
  dateAdded: number;
  dateCreated: number;
  fileType: string;
  genre: string;
  key: publicSchema.CamelotKeyId;
  label: string;
  title: string;
}

export interface TrackWithMeta extends Track {
  meta: TrackMeta;
}

export enum MetaDataType {
  Album = 3,
  Artist = 2,
  Comment = 5,
  Composer = 7,
  FileType = 13,
  Genre = 4,
  Label = 6,
  Title = 1,
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
