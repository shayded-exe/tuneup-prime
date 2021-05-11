import Command from '@oclif/command';
import gradient from 'gradient-string';
import prompts from 'prompts';

import { activateLicense } from '../licensing';
import { spinner } from '../utils';

export class Activate extends Command {
  static readonly description =
    'unlock the full version of ENJINN with a license key';

  async run() {
    if (Activate.hidden) {
      return;
    }

    const licenseKey = await this.promptForLicenseKey();

    await spinner({
      text: 'Activating license',
      run: async ctx => {
        try {
          const result = await activateLicense(licenseKey);
          if (!result) {
            ctx.fail(`License isn't valid`);
            return;
          }
        } catch {
          ctx.fail(
            'Unable to reach the license server, please check your internet connection',
          );
          return;
        }

        ctx.succeed('Activated license');
        this.log();
        this.log(
          gradient.morning('  Thanks for buying the full version of ENJINN!'),
        );
        this.log();
      },
    });
  }

  private async promptForLicenseKey(): Promise<string> {
    function validateLicenseKey(licenseKey: string): true | string {
      const LICENSE_KEY_REGEX =
        /^[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}$/;
      const sampleFormat = Array(4).fill('X'.repeat(8)).join('-');

      if (!LICENSE_KEY_REGEX.test(licenseKey)) {
        return `Format is invalid. Should look like '${sampleFormat}'`;
      }
      return true;
    }

    return prompts<'licenseKey'>({
      type: 'text',
      name: 'licenseKey',
      message: 'What is your license key?',
      validate: validateLicenseKey,
    }).then(x => x.licenseKey);
  }
}
