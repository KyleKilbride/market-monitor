import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';

interface Column {
  key: string;
  header: string;
  width: number;
}

interface SimpleTableProps {
  data: Record<string, string>[];
  columns: Column[];
  onSelect?: (index: number) => void;
  isActive?: boolean;
}

export const SimpleTable: React.FC<SimpleTableProps> = ({ data, columns, onSelect, isActive = true }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleIndexChange = useCallback((newIndex: number) => {
    setSelectedIndex(newIndex);
    if (onSelect) {
      onSelect(newIndex);
    }
  }, [onSelect]);

  useInput((input, key) => {
    if (!onSelect || !isActive) return;

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

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        {columns.map((col, i) => (
          <Box key={i} width={col.width} marginRight={1}>
            <Text bold>{col.header}</Text>
          </Box>
        ))}
      </Box>

      {/* Separator */}
      <Box>
        <Text>{'─'.repeat(columns.reduce((acc, col) => acc + col.width + 1, 0))}</Text>
      </Box>

      {/* Data rows */}
      {data.map((row, rowIndex) => (
        <Box key={rowIndex}>
          {columns.map((col, colIndex) => (
            <Box key={colIndex} width={col.width} marginRight={1}>
              <Text 
                wrap="truncate-end"
                color={onSelect && rowIndex === selectedIndex ? 'blue' : undefined}
                bold={onSelect && rowIndex === selectedIndex}
              >
                {row[col.key] || ''}
              </Text>
            </Box>
          ))}
        </Box>
      ))}

      {onSelect && isActive && (
        <Box marginTop={1}>
          <Text dimColor>Use ↑/↓ or j/k to view details</Text>
        </Box>
      )}
    </Box>
  );
}; 