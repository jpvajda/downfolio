import * as figlet from 'figlet';
import * as p from '@clack/prompts';

export function showBanner(): void {
  try {
    const banner = figlet.textSync('DOWNFOLIO', {
      font: 'Standard', // You can change to 'Block', 'Slant', 'Big', etc.
      horizontalLayout: 'default',
      verticalLayout: 'default',
    });

    // Display banner with Clack's intro styling
    console.log('\n');
    console.log(banner);
    console.log('\n');
    p.log.info('AI-powered CLI tool for generating customized resumes and cover letters from markdown templates.');
    console.log('\n');
  } catch (error) {
    // Fallback if figlet fails
    console.log('\n');
    console.log('╔════════════════════════════════════╗');
    console.log('║         DOWNFOLIO                 ║');
    console.log('╚════════════════════════════════════╝');
    console.log('\n');
    p.log.info('AI-powered CLI tool for generating customized resumes and cover letters from markdown templates.');
    console.log('\n');
  }
}
