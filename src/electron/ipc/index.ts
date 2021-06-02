import * as licensing from './licensing-ipc-main';
import * as shell from './shell-ipc-main';

export function init() {
  licensing.registerHandlers();
  shell.registerHandlers();
}
