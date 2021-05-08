import Command from '@oclif/command';
import gradient from 'gradient-string';

import { activateLicense } from '../licensing';
import { spinner } from '../utils';

export class Activate extends Command {
  static readonly description =
    'unlock the full version of ENJINN with a license key';

  static readonly args = [
    {
      name: 'license_key',
      required: true,
    },
  ];

  async run() {
    if (Activate.hidden) {
      return;
    }

    const {
      args: { license_key },
    } = this.parse(Activate);

    await spinner({
      text: 'Activating license',
      run: async ctx => {
        try {
          const result = await activateLicense(license_key);
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
        this.log(
          gradient.morning('  Thanks for buying the full version of ENJINN!'),
        );
      },
    });
  }
}
