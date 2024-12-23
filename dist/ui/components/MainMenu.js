import React from 'react';
import { Box, Text } from 'ink';
import { CustomSelect } from './CustomSelect.js';
const menuItems = [
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
export const MainMenu = ({ onSelect, currentScreen, isActive = true }) => {
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true }, "Market Monitor")),
        React.createElement(CustomSelect, { items: menuItems, onSelect: onSelect, activeValue: currentScreen, isActive: isActive }),
        React.createElement(Box, { marginTop: 1, flexDirection: "column" },
            React.createElement(Text, { dimColor: true }, "Controls:"),
            React.createElement(Text, { dimColor: true }, "\u2191/\u2193 or j/k: Navigate"),
            React.createElement(Text, { dimColor: true }, "Enter: Select"),
            React.createElement(Text, { dimColor: true }, "Tab: Switch focus"),
            React.createElement(Text, { dimColor: true }, "q: Quit"))));
};
