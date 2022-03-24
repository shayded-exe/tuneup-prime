export * from './async';
export * from './file-system';
export * from './network';
export * from './os';
export * from './tree';

export function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}
