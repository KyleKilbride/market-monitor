import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
export const SimpleTable = ({ data, columns, onSelect, isActive = true }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const handleIndexChange = useCallback((newIndex) => {
        setSelectedIndex(newIndex);
        if (onSelect) {
            onSelect(newIndex);
        }
    }, [onSelect]);
    useInput((input, key) => {
        if (!onSelect || !isActive)
            return;
        if (key.upArrow || input === 'k') {
            const newIndex = selectedIndex > 0 ? selectedIndex - 1 : data.length - 1;
            handleIndexChange(newIndex);
        }
        if (key.downArrow || input === 'j') {
            const newIndex = selectedIndex < data.length - 1 ? selectedIndex + 1 : 0;
            handleIndexChange(newIndex);
        }
        if (key.return || input === '\r') {
            handleIndexChange(selectedIndex);
        }
    }, { isActive: true });
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, null, columns.map((col, i) => (React.createElement(Box, { key: i, width: col.width, marginRight: 1 },
            React.createElement(Text, { bold: true }, col.header))))),
        React.createElement(Box, null,
            React.createElement(Text, null, '─'.repeat(columns.reduce((acc, col) => acc + col.width + 1, 0)))),
        data.map((row, rowIndex) => (React.createElement(Box, { key: rowIndex }, columns.map((col, colIndex) => (React.createElement(Box, { key: colIndex, width: col.width, marginRight: 1 },
            React.createElement(Text, { wrap: "truncate-end", color: onSelect && rowIndex === selectedIndex ? 'blue' : undefined, bold: onSelect && rowIndex === selectedIndex }, row[col.key] || ''))))))),
        onSelect && isActive && (React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Use \u2191/\u2193 or j/k to view details")))));
};
