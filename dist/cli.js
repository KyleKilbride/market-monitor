import { Command } from 'commander';
const program = new Command();
program
    .name('market-watch')
    .description('AI & Travel Industry Market Monitor')
    .version('1.0.0');
program
    .command('watch')
    .description('Start monitoring feeds')
    .option('-i, --interval <minutes>', 'Check interval', '15')
    .action(async (options) => {
    // Monitor feeds
});
program.parse();
