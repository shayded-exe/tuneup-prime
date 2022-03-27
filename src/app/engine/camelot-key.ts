import { CamelotKeyId } from './schema';

enum CamelotKeyMap {
  '1B' = 10,
  '1A' = 11,
  '2B' = 12,
  '2A' = 13,
  '3B' = 14,
  '3A' = 15,
  '4B' = 16,
  '4A' = 17,
  '5B' = 18,
  '5A' = 19,
  '6B' = 20,
  '6A' = 21,
  '7B' = 22,
  '7A' = 23,
  '8B' = 0,
  '8A' = 1,
  '9B' = 2,
  '9A' = 3,
  '10B' = 4,
  '10A' = 5,
  '11B' = 6,
  '11A' = 7,
  '12B' = 8,
  '12A' = 9,
}

type KeyPart =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12';

type ScalePart = 'B' | 'A';

export type CamelotKeyCode = `${KeyPart}${ScalePart}`;

export function camelotKeyIdToCode(id: CamelotKeyId): CamelotKeyCode {
  return CamelotKeyMap[+id] as CamelotKeyCode;
}

function camelotKeyIdToCode2(id: CamelotKeyId): CamelotKeyCode {
  let key = +id + 2;
  let scale: ScalePart = 'B';
  if (key % 2 == 1) {
    key -= 1;
    scale = 'A';
  }
  key = key / 2 - 5;
  if (key <= 0) {
    key += 12;
  }
  return `${key}${scale}` as CamelotKeyCode;
}

export function camelotKeyCodeToId(code: CamelotKeyCode): CamelotKeyId {
  return CamelotKeyMap[code] as unknown as CamelotKeyId;
}
