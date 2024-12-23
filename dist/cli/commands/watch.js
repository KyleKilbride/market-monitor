import { startMonitoring } from '../../services/monitor.js';
export function setupWatchCommand(program) {
    program
        .command('watch')
        .description('Watch RSS feeds for updates')
        .option('-i, --interval <minutes>', 'Check interval in minutes', '0.25')
        .option('-s, --silent', 'Disable desktop notifications', false)
        .action(async (options) => {
        const interval = parseFloat(options.interval);
        await startMonitoring({
            checkInterval: interval,
            silent: options.silent
        });
    });
}
