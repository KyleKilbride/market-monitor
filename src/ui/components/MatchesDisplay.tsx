import React, { FC, useEffect, useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { FeedItem } from '../../types/sources.js';
import { loadFeedItems } from '../../services/storage.js';
import { SimpleTable } from './SimpleTable.js';
import { getMonitorStatus, MonitorStatus } from '../../services/monitor-status.js';
import { openUrl } from '../../services/open-url.js';

interface MatchesDisplayProps {
  onBack: () => void;
  isActive: boolean;
}

interface TableRow extends Record<string, string> {
  title: string;
  matches: string;
  source: string;
}

const columns = [
  { key: 'title', header: 'Title', width: 60 },
  { key: 'matches', header: '🎯', width: 15 },
  { key: 'source', header: '📰', width: 12 }
];

const NEW_THRESHOLD_MS = 60 * 60 * 1000;
const REFRESH_INTERVAL_MS = 5000;
const CONTENT_PREVIEW_LENGTH = 120;
const MAX_TITLE_LENGTH = 50;
const MAX_VISIBLE_MATCHES = 25;
const LATEST_NEW_COUNT = 3;

export const MatchesDisplay: FC<MatchesDisplayProps> = ({ onBack, isActive }) => {
  const [matches, setMatches] = useState<FeedItem[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<FeedItem | null>(null);
  const [monitorStatus, setMonitorStatus] = useState<MonitorStatus>({ isRunning: false });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showFullContent, setShowFullContent] = useState(false);
  const isMounted = useRef(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isNew = (item: FeedItem, index: number): boolean => {
    return index < LATEST_NEW_COUNT;
  };

  const loadData = async () => {
    if (!isMounted.current) return;

    try {
      const [items, status] = await Promise.all([
        loadFeedItems(),
        getMonitorStatus()
      ]);
      
      if (!isMounted.current) return;

      const validItems = items
        .filter(item => 
          Array.isArray(item.matchedKeywords) && 
          item.matchedKeywords.length > 0 &&
          item.matchedKeywords.every(k => k && k.keyword && typeof k.score === 'number')
        )
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .slice(0, MAX_VISIBLE_MATCHES);
      
      // Compare actual match content and order
      const currentContent = matches.map(m => ({
        id: m.link + m.addedAt,
        title: m.title,
        content: m.content,
        keywords: m.matchedKeywords,
        addedAt: m.addedAt
      }));
      
      const newContent = validItems.map(m => ({
        id: m.link + m.addedAt,
        title: m.title,
        content: m.content,
        keywords: m.matchedKeywords,
        addedAt: m.addedAt
      }));
      
      const hasChanges = JSON.stringify(currentContent) !== JSON.stringify(newContent);
      
      if (hasChanges) {
        setMatches(validItems);
        setLastUpdate(new Date());
      }
      
      // Always update monitor status
      setMonitorStatus(status);

      // Schedule next refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(loadData, REFRESH_INTERVAL_MS);
    } catch (error) {
      console.error('Error loading data:', error);
      // Retry on error after a short delay
      refreshTimeoutRef.current = setTimeout(loadData, 1000);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      isMounted.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Force refresh when component becomes active
  useEffect(() => {
    if (isActive) {
      loadData();
    }
  }, [isActive]);

  useInput((input, key) => {
    if (!isActive || !isMounted.current) return;
    
    if (key.return && selectedMatch) {
      openUrl(selectedMatch.link);
    } else if (input === 'e' && selectedMatch) {
      setShowFullContent(!showFullContent);
    }
  });

  const handleSelectMatch = (index: number) => {
    if (!isMounted.current) return;
    const match = matches[index];
    setSelectedMatch(match);
    setShowFullContent(false);
  };

  const formatKeywords = (match: FeedItem): string => {
    if (!Array.isArray(match.matchedKeywords) || match.matchedKeywords.length === 0) {
      return '-';
    }

    const validMatches = match.matchedKeywords.filter(k => k && k.keyword && typeof k.score === 'number');
    if (validMatches.length === 0) return '-';

    // Show top 3 matches instead of 2
    const topMatches = validMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return topMatches
      .map(k => `${k.score}`)
      .join(',');
  };

  const formatContent = (content: string, full: boolean = false): string => {
    if (!content) return '';
    if (full) return content;
    return content.length <= CONTENT_PREVIEW_LENGTH 
      ? content 
      : content.slice(0, CONTENT_PREVIEW_LENGTH) + '...';
  };

  const tableData: TableRow[] = matches.map((match, index) => {
    const matchScores = formatKeywords(match);
    const sourceName = match.sourceName || new URL(match.source).hostname.split('.')[0];
    const itemIsNew = isNew(match, index);
    const title = match.title.slice(0, MAX_TITLE_LENGTH) + (match.title.length > MAX_TITLE_LENGTH ? '...' : '');
    const pubDate = new Date(match.timestamp).toLocaleTimeString();

    return {
      title: `${itemIsNew ? '🆕 ' : ''}${title}`,
      matches: matchScores,
      source: `${sourceName} ${pubDate}`
    };
  });

  const renderDetails = () => {
    if (!selectedMatch) return null;

    const topMatches = selectedMatch.matchedKeywords
      .filter(k => k && k.keyword && typeof k.score === 'number')
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return (
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text bold>📰 </Text>
          <Text>{selectedMatch.title}</Text>
        </Box>
        {(selectedMatch.author || selectedMatch.creator) && (
          <Box>
            <Text bold>✍️ </Text>
            <Text>{selectedMatch.author || selectedMatch.creator}</Text>
          </Box>
        )}
        <Box>
          <Text bold>🔗 </Text>
          <Text>
            {topMatches.map((m, i) => (
              <Text key={i} color={m.score >= 8 ? 'green' : m.score >= 5 ? 'yellow' : 'red'}>
                {m.keyword}({m.score}) {i < topMatches.length - 1 ? '• ' : ''}
              </Text>
            ))}
          </Text>
        </Box>
        {selectedMatch.categories && selectedMatch.categories.length > 0 && (
          <Box>
            <Text bold>🏷️ </Text>
            <Text>{selectedMatch.categories.join(', ')}</Text>
          </Box>
        )}
        <Box>
          <Text bold>📝 </Text>
          <Text>{formatContent(selectedMatch.content, showFullContent)}</Text>
        </Box>
        {selectedMatch.content.length > CONTENT_PREVIEW_LENGTH && (
          <Text dimColor>{showFullContent ? 'Press e to show less' : 'Press e to show more'}</Text>
        )}
        <Box marginTop={1}>
          <Text dimColor>↵ open in browser • q return to menu • ↑↓ navigate</Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>Recent Matches </Text>
        <Text>({matches.length} shown) </Text>
        {!monitorStatus.isRunning && <Text color="yellow">(Monitor not running) </Text>}
        <Text dimColor>Last: {lastUpdate.toLocaleTimeString()}</Text>
      </Box>
      
      {matches.length === 0 ? (
        <Box flexDirection="column" marginTop={1}>
          <Text>No matches found</Text>
          {!monitorStatus.isRunning && (
            <Text dimColor>Start monitor: npm run monitor:start</Text>
          )}
        </Box>
      ) : (
        <>
          <SimpleTable 
            data={tableData} 
            columns={columns}
            onSelect={handleSelectMatch}
            isActive={isActive}
          />
          {renderDetails()}
        </>
      )}
    </Box>
  );
}; 