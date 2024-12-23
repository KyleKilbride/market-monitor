#!/usr/bin/env node
import { Command } from 'commander';
import { setupWatchCommand } from './cli/commands/watch.js';
import { setupKeywordCommands } from './cli/commands/keywords.js';
import { setupUICommand } from './cli/commands/ui.js';

async function main() {
  const program = new Command();
  
  program
    .name('market-monitor')
    .description('AI & Travel Industry Market Monitor')
    .version('1.0.0');

  setupWatchCommand(program);
  setupKeywordCommands(program);
  setupUICommand(program);
  
  program.parse();
}

main().catch(console.error); 