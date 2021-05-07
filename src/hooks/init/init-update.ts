import { Hook } from '@oclif/config';

import { isStandalone } from '../../utils';

export default initUpdate;

// Remove update command in npm version
// Only standalone version is auto-updatable
export const initUpdate: Hook<'ini'> = async function () {
  if (!isStandalone()) {
    const updateCmd = this.config.findCommand('update', { must: true });
    updateCmd.hidden = true;
  }
};
