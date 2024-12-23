import React from 'react';
import { Box, Text, useInput } from 'ink';
export function CustomSelect({ items, onSelect, activeValue, isActive = true }) {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    // Update selected index when active value changes
    React.useEffect(() => {
        if (activeValue !== undefined) {
            const activeIndex = items.findIndex(item => item.value === activeValue);
            if (activeIndex !== -1) {
                setSelectedIndex(activeIndex);
            }
        }
    }, [activeValue, items]);
    useInput((input, key) => {
        if (!isActive)
            return;
        if (key.upArrow || input === 'k') {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
            return;
        }
        if (key.downArrow || input === 'j') {
            setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
            return;
        }
        if (key.return) {
            onSelect(items[selectedIndex]);
        }
    }, { isActive: true });
    return (React.createElement(Box, { flexDirection: "column" }, items.map((item, index) => {
        const isSelected = index === selectedIndex;
        const isActiveItem = item.value === activeValue;
        return (React.createElement(Box, { key: index },
            React.createElement(Text, { color: isSelected && isActive ? 'blue' : isActiveItem ? 'green' : undefined, bold: isActiveItem, dimColor: !isActive && !isActiveItem },
                isSelected ? '> ' : '  ',
                item.label)));
    })));
}
