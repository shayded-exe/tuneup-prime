import { Command, flags } from '@oclif/command';

export default class Smart extends Command {
  static readonly description = 'Generate smart playlists';

  static readonly flags = {
    help: flags.help({ char: 'h' }),
  };

  static args = [
    {
      name: 'firstArg',
      required: false,
    },
  ];

  async run() {
    const { args } = this.parse(Smart);

    this.log(`hi ${args.firstArg}`);
  }
}
