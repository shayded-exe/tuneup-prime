import * as licensing from './licensing-ipc-main';
import * as shell from './shell-ipc-main';
import * as updates from './updates-ipc-main';

export function init() {
  licensing.registerHandlers();
  shell.registerHandlers();
  updates.registerHandlers();
}
