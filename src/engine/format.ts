import moment from 'moment';

const ENGINE_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export function formatDate(date: Date): string {
  return moment(date).format(ENGINE_DATE_FORMAT);
}
