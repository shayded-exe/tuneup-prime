import { Except } from 'type-fest';

import * as publicSchema from '../public-schema';
import { IntBoolean, SQLITE_SEQUENCE } from '../sqlite-types';

export interface Tables {
  SQLITE_SEQUENCE: SQLITE_SEQUENCE;
  Information: publicSchema.Information;
  List: List;
  ListTrackList: ListTrackList;
  ListParentList: ListParentList;
  ListHierarchy: ListHierarchy;
  Crate: Crate;
  Track: Track;
  MetaData: MetaData;
  MetaDataInteger: MetaDataInteger;
  CopiedTrack: CopiedTrack;
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

export interface PlaylistInput extends publicSchema.PlaylistInput {
  type?: ListType;
  path?: string;
}

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

export interface ListHierarchy {
  listId: number;
  listType: ListType;
  listIdChild: number;
  listTypeChild: ListType;
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
  fileBytes: number;
  filename: string;
  isBeatGridLocked: IntBoolean;
  isExternalTrack: IntBoolean;
  length: number;
  path: string;
  playOrder?: number;
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
  meta?: TrackMeta;
}

export enum MetaDataType {
  album = 3,
  artist = 2,
  comment = 5,
  composer = 7,
  fileType = 13,
  genre = 4,
  label = 6,
  title = 1,
}

export interface MetaData {
  id: number;
  type: MetaDataType;
  text: string;
}

export enum MetaDataIntegerType {
  dateLastPlayed = 1,
  dateAdded = 2,
  dateCreated = 3,
  key = 4,
  rating = 5,
}

export interface MetaDataInteger {
  id: number;
  type: MetaDataIntegerType;
  value: number;
}

export interface CopiedTrack {
  trackId: number;
  uuidOfSourceDatabase: string;
  idOfTrackInSourceDatabase: number;
}
