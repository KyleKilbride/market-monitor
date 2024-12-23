import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { App } from '../../ui/App.js';

export function setupUICommand(program: Command) {
  program
    .command('ui')
    .description('Launch interactive UI')
    .action(() => {
      render(React.createElement(App));
    });
} 