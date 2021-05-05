import Help from '@oclif/plugin-help';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { partialRight } from 'lodash';
import { EOL } from 'os';
import terminalLink from 'terminal-link';

import { isStandalone } from './utils';

export default class EnjinnHelp extends Help {
  showRootHelp() {
    const figletText = figlet.textSync('ENJINN', {
      font: 'Jacky',
      horizontalLayout: 'fitted',
    });
    console.log(`${EOL}${gradient.retro(figletText)}${EOL}`);

    console.log(`by ${gradient.morning('SHAYDED')}`);
    const email = 'shayded@shayded.com';
    const emailLink = terminalLink(email, `mailto:${email}`, {
      fallback: text => text,
    });
    console.log(chalk`  {blue ${emailLink}}`);
    const shaydedLink = terminalLink('shayded.com', 'http://shayded.com', {
      fallback: (_, url) => url,
    });
    console.log(chalk`  {blue ${shaydedLink}}${EOL}`);

    console.log(chalk`{magenta GitHub}`);
    const gitHubUrl = 'https://github.com/rshea0/enjinn';
    const gitHubLink = terminalLink(gitHubUrl, gitHubUrl, {
      fallback: (_, url) => url,
    });
    console.log(chalk`  {blue ${gitHubLink}}${EOL}`);

    if (!isStandalone()) {
      this.showDonationLinks();
    }

    super.showRootHelp();
  }

  private showDonationLinks() {
    console.log(
      chalk`If this tool saved you some headache, please consider donating a few bucks!`,
    );
    const donationLink = partialRight(terminalLink, {
      fallback: (text, url) => chalk`{green ${text}} {white ({blue ${url}})}`,
    });
    const venmoLink = donationLink('@SHAYDED', 'https://venmo.com/u/SHAYDED');
    console.log(chalk`  Venmo  {blue ${venmoLink}}`);
    const payPalLink = donationLink(
      '@SHAYDEDmusic',
      'https://paypal.me/SHAYDEDmusic',
    );
    console.log(chalk`  PayPal {blue ${payPalLink}}${EOL}`);
  }
}
