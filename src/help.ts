import Help from '@oclif/plugin-help';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { EOL } from 'os';
import terminalLink from 'terminal-link';

import { licenseState, LicenseState } from './licensing';
import { urlFallbackLink } from './utils';

export default class EnjinnHelp extends Help {
  showRootHelp() {
    this.showLogo();
    this.showContactInfo();
    this.showGitHubInfo();
    this.showLicenseInfo();

    super.showRootHelp();
  }

  private showLogo() {
    const figletText = figlet.textSync('ENJINN', {
      font: 'Jacky',
      horizontalLayout: 'fitted',
    });
    console.log(`${EOL}${gradient.retro(figletText)}${EOL}`);
  }

  private showContactInfo() {
    console.log(`by ${gradient.morning('SHAYDED')}`);
    const email = 'shayded@shayded.com';
    const emailLink = terminalLink(email, `mailto:${email}`, {
      fallback: text => text,
    });
    console.log(chalk`  {blue ${emailLink}}`);
    const shaydedLink = urlFallbackLink('shayded.com', 'http://shayded.com');
    console.log(chalk`  {blue ${shaydedLink}}${EOL}`);
  }

  private showGitHubInfo() {
    console.log(chalk`{magentaBright GitHub}`);
    const gitHubUrl = 'https://github.com/rshea0/enjinn';
    const gitHubLink = urlFallbackLink(gitHubUrl, gitHubUrl);
    console.log(chalk`  {blue ${gitHubLink}}${EOL}`);
  }

  private showLicenseInfo() {
    switch (licenseState()) {
      case LicenseState.Unlicensed:
        console.log(chalk.yellow('Free Edition'));
        const gumroadUrl = 'https://gum.co/enjinn';
        const gumroadLink = urlFallbackLink(gumroadUrl, gumroadUrl);
        console.log(
          chalk`  You can buy a license here: {blue ${gumroadLink}}${EOL}`,
        );
        break;
      case LicenseState.Invalid:
        console.log(chalk.bgRed('LICENSE INVALID'));
        console.log(
          `  Please re-enter your license key with 'enjinn activate <LICENSE KEY>'${EOL}`,
        );
        break;
    }
  }
}
