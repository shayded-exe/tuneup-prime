import * as engine from '../engine';
import { FilterField, NumberFilterField } from './definitions';

export function getTrackColumnName(
  filterField: FilterField,
): keyof engine.Track {
  switch (filterField) {
    case NumberFilterField.Bpm:
      return 'bpmAnalyzed';
  }

  return filterField;
}
