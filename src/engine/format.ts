import dateFormat from 'dateformat';

const ENGINE_DATE_FORMAT = 'yyyy-mm-dd HH:MM:ss';

export function formatDate(date: Date): string {
  return dateFormat(date, ENGINE_DATE_FORMAT);
}
