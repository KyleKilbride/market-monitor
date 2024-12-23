import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { MainMenu } from './components/MainMenu.js';
import { MatchesDisplay } from './components/MatchesDisplay.js';
import { MonitorStatus } from './components/MonitorStatus.js';
import type { SelectItem } from './types.js';

type Screen = 'menu' | 'matches' | 'keywords' | 'settings' | 'status';

export const App: React.FC = () => {
  const { exit } = useApp();
  const [currentScreen, setCurrentScreen] = React.useState<Screen>('menu');

  // Function to handle screen changes
  const changeScreen = (screen: Screen) => {
    console.clear();
    setCurrentScreen(screen);
  };

  useInput((input: string) => {
    if (input === 'q' && currentScreen !== 'menu') {
      changeScreen('menu');
    } else if (input === 'q' && currentScreen === 'menu') {
      exit();
    }
  });

  const handleMenuSelect = (item: SelectItem<string>) => {
    if (item.value === 'exit') {
      exit();
    }
    changeScreen(item.value as Screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <Box padding={1}>
            <MainMenu 
              onSelect={handleMenuSelect} 
              currentScreen={currentScreen}
              isActive={true}
            />
          </Box>
        );
      case 'matches':
        return (
          <Box padding={1}>
            <MatchesDisplay 
              onBack={() => changeScreen('menu')} 
              isActive={true}
            />
          </Box>
        );
      case 'status':
        return (
          <Box padding={1}>
            <MonitorStatus />
            <Box marginTop={1}>
              <Text dimColor>Press 'q' to return to menu</Text>
            </Box>
          </Box>
        );
      default:
        return (
          <Box padding={1}>
            <Text>Invalid screen</Text>
            <Box marginTop={1}>
              <Text dimColor>Press 'q' to return to menu</Text>
            </Box>
          </Box>
        );
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {renderScreen()}
    </Box>
  );
}; 