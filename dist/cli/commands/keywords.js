import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
async function loadConfig() {
    const configPath = join(process.cwd(), 'config.json');
    const data = await readFile(configPath, 'utf-8');
    return JSON.parse(data);
}
async function saveConfig(config) {
    const configPath = join(process.cwd(), 'config.json');
    await writeFile(configPath, JSON.stringify(config, null, 2));
}
function formatKeyword(k, i) {
    if (typeof k === 'string') {
        return `${i + 1}. ${k} (simple match)`;
    }
    return `${i + 1}. ${k.value} (${k.type}, weight: ${k.weight})`;
}
export function setupKeywordCommands(program) {
    const keywords = program.command('keywords');
    keywords
        .command('add')
        .description('Add a new keyword to monitor')
        .argument('<value>', 'Keyword or phrase to match')
        .option('-t, --type <type>', 'Match type: exact, fuzzy, or phrase', 'fuzzy')
        .option('-w, --weight <number>', 'Keyword weight (1-10)', '5')
        .option('-c, --case-sensitive', 'Enable case-sensitive matching')
        .action(async (value, options) => {
        try {
            const config = await loadConfig();
            const keyword = {
                value,
                type: options.type,
                weight: parseInt(options.weight),
                caseSensitive: options.caseSensitive
            };
            config.sources[0].keywords.push(keyword);
            await saveConfig(config);
            console.log(chalk.green('Added new keyword:'));
            console.log(chalk.blue(JSON.stringify(keyword, null, 2)));
        }
        catch (error) {
            console.error(chalk.red('Error adding keyword:'), error);
        }
    });
    keywords
        .command('list')
        .description('List all monitored keywords')
        .action(async () => {
        try {
            const config = await loadConfig();
            console.log(chalk.cyan('\nCurrent keywords:'));
            config.sources[0].keywords.forEach((k, i) => {
                if (typeof k === 'string') {
                    console.log(chalk.blue(`${i + 1}. ${k} (simple match)`));
                }
                else {
                    console.log(chalk.blue(`${i + 1}. ${k.value}`));
                    console.log(chalk.gray(`   Type: ${k.type}`));
                    console.log(chalk.gray(`   Weight: ${k.weight}`));
                    console.log(chalk.gray(`   Case-sensitive: ${k.caseSensitive}`));
                }
            });
        }
        catch (error) {
            console.error(chalk.red('Error listing keywords:'), error);
        }
    });
    keywords
        .command('remove')
        .description('Remove keywords interactively')
        .action(async () => {
        try {
            const config = await loadConfig();
            const choices = config.sources[0].keywords.map((k, i) => ({
                name: formatKeyword(k, i),
                value: i
            }));
            const { selected } = await inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'selected',
                    message: 'Select keywords to remove (use space to select, enter to confirm):',
                    choices
                }
            ]);
            if (selected.length === 0) {
                console.log(chalk.yellow('No keywords selected'));
                return;
            }
            // Sort indices in descending order to avoid shifting issues
            const indices = selected.sort((a, b) => b - a);
            const removed = [];
            for (const idx of indices) {
                removed.push(config.sources[0].keywords.splice(idx, 1)[0]);
            }
            await saveConfig(config);
            console.log(chalk.green('\nRemoved keywords:'));
            removed.reverse().forEach((k) => {
                if (typeof k === 'string') {
                    console.log(chalk.blue(`- ${k}`));
                }
                else {
                    console.log(chalk.blue(`- ${k.value}`));
                    console.log(chalk.gray(`  Type: ${k.type}, Weight: ${k.weight}`));
                }
            });
        }
        catch (error) {
            console.error(chalk.red('Error removing keywords:'), error);
        }
    });
}
