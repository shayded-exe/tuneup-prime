export enum IpcChannel {
  Licensing_GetState = 'licensing:get-state',
  Licensing_Activate = 'licensing:activate',
  Licensing_ActivateTrial = 'licensing:activate-trial',
  Shell_EditFile = 'shell:edit-file',
  Shell_OpenFolder = 'shell:open-folder',
  Shell_OpenUrl = 'shell:open-url',
  Updates_CheckUpdates = 'updates:check-updates',
  Updates_UpdateAvailable = 'updates:update-available',
}
