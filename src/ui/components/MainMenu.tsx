import React from 'react';
import { Box, Text } from 'ink';
import { CustomSelect } from './CustomSelect.js';
import type { SelectItem } from '../types.js';

interface MainMenuProps {
  onSelect: (item: SelectItem<string>) => void;
  currentScreen: string;
  isActive?: boolean;
}

const menuItems: Array<SelectItem<string>> = [
  {
    label: '📊 Monitor Status',
    value: 'status'
  },
  {
    label: '🔍 View Matches',
    value: 'matches'
  },
  {
    label: '🔑 Manage Keywords',
    value: 'keywords'
  },
  {
    label: '⚙️ Settings',
    value: 'settings'
  },
  {
    label: '❌ Exit',
    value: 'exit'
  }
];

export const MainMenu: React.FC<MainMenuProps> = ({ onSelect, currentScreen, isActive = true }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Market Monitor</Text>
      </Box>

      <CustomSelect 
        items={menuItems} 
        onSelect={onSelect}
        activeValue={currentScreen}
        isActive={isActive}
      />

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Controls:</Text>
        <Text dimColor>↑/↓ or j/k: Navigate</Text>
        <Text dimColor>Enter: Select</Text>
        <Text dimColor>Tab: Switch focus</Text>
        <Text dimColor>q: Quit</Text>
      </Box>
    </Box>
  );
}; 