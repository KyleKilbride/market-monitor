import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { MainMenu } from './components/MainMenu.js';
import { MatchesDisplay } from './components/MatchesDisplay.js';
import { MonitorStatus } from './components/MonitorStatus.js';
export const App = () => {
    const { exit } = useApp();
    const [currentScreen, setCurrentScreen] = React.useState('menu');
    // Function to handle screen changes
    const changeScreen = (screen) => {
        console.clear();
        setCurrentScreen(screen);
    };
    useInput((input) => {
        if (input === 'q' && currentScreen !== 'menu') {
            changeScreen('menu');
        }
        else if (input === 'q' && currentScreen === 'menu') {
            exit();
        }
    });
    const handleMenuSelect = (item) => {
        if (item.value === 'exit') {
            exit();
        }
        changeScreen(item.value);
    };
    const renderScreen = () => {
        switch (currentScreen) {
            case 'menu':
                return (React.createElement(Box, { padding: 1 },
                    React.createElement(MainMenu, { onSelect: handleMenuSelect, currentScreen: currentScreen, isActive: true })));
            case 'matches':
                return (React.createElement(Box, { padding: 1 },
                    React.createElement(MatchesDisplay, { onBack: () => changeScreen('menu'), isActive: true })));
            case 'status':
                return (React.createElement(Box, { padding: 1 },
                    React.createElement(MonitorStatus, null),
                    React.createElement(Box, { marginTop: 1 },
                        React.createElement(Text, { dimColor: true }, "Press 'q' to return to menu"))));
            default:
                return (React.createElement(Box, { padding: 1 },
                    React.createElement(Text, null, "Invalid screen"),
                    React.createElement(Box, { marginTop: 1 },
                        React.createElement(Text, { dimColor: true }, "Press 'q' to return to menu"))));
        }
    };
    return (React.createElement(Box, { flexDirection: "column", padding: 1 }, renderScreen()));
};
