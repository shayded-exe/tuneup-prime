import Conf from 'conf';
import yaml from 'js-yaml';

export const appConfig = new Conf({
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load as any,
  schema: {
    engineLibraryFolder: {
      type: 'string',
    },
  },
});
