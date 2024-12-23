import React, { useEffect, useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { loadFeedItems } from '../../services/storage.js';
import { SimpleTable } from './SimpleTable.js';
import { getMonitorStatus } from '../../services/monitor-status.js';
import { openUrl } from '../../services/open-url.js';
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
export const MatchesDisplay = ({ onBack, isActive }) => {
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [monitorStatus, setMonitorStatus] = useState({ isRunning: false });
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [showFullContent, setShowFullContent] = useState(false);
    const isMounted = useRef(true);
    const refreshTimeoutRef = useRef(null);
    const isNew = (item, index) => {
        return index < LATEST_NEW_COUNT;
    };
    const loadData = async () => {
        if (!isMounted.current)
            return;
        try {
            const [items, status] = await Promise.all([
                loadFeedItems(),
                getMonitorStatus()
            ]);
            if (!isMounted.current)
                return;
            const validItems = items
                .filter(item => Array.isArray(item.matchedKeywords) &&
                item.matchedKeywords.length > 0 &&
                item.matchedKeywords.every(k => k && k.keyword && typeof k.score === 'number'))
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
        }
        catch (error) {
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
        if (!isActive || !isMounted.current)
            return;
        if (key.return && selectedMatch) {
            openUrl(selectedMatch.link);
        }
        else if (input === 'e' && selectedMatch) {
            setShowFullContent(!showFullContent);
        }
    });
    const handleSelectMatch = (index) => {
        if (!isMounted.current)
            return;
        const match = matches[index];
        setSelectedMatch(match);
        setShowFullContent(false);
    };
    const formatKeywords = (match) => {
        if (!Array.isArray(match.matchedKeywords) || match.matchedKeywords.length === 0) {
            return '-';
        }
        const validMatches = match.matchedKeywords.filter(k => k && k.keyword && typeof k.score === 'number');
        if (validMatches.length === 0)
            return '-';
        // Show top 3 matches instead of 2
        const topMatches = validMatches
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        return topMatches
            .map(k => `${k.score}`)
            .join(',');
    };
    const formatContent = (content, full = false) => {
        if (!content)
            return '';
        if (full)
            return content;
        return content.length <= CONTENT_PREVIEW_LENGTH
            ? content
            : content.slice(0, CONTENT_PREVIEW_LENGTH) + '...';
    };
    const tableData = matches.map((match, index) => {
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
        if (!selectedMatch)
            return null;
        const topMatches = selectedMatch.matchedKeywords
            .filter(k => k && k.keyword && typeof k.score === 'number')
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        return (React.createElement(Box, { flexDirection: "column", marginTop: 1 },
            React.createElement(Box, null,
                React.createElement(Text, { bold: true }, "\uD83D\uDCF0 "),
                React.createElement(Text, null, selectedMatch.title)),
            (selectedMatch.author || selectedMatch.creator) && (React.createElement(Box, null,
                React.createElement(Text, { bold: true }, "\u270D\uFE0F "),
                React.createElement(Text, null, selectedMatch.author || selectedMatch.creator))),
            React.createElement(Box, null,
                React.createElement(Text, { bold: true }, "\uD83D\uDD17 "),
                React.createElement(Text, null, topMatches.map((m, i) => (React.createElement(Text, { key: i, color: m.score >= 8 ? 'green' : m.score >= 5 ? 'yellow' : 'red' },
                    m.keyword,
                    "(",
                    m.score,
                    ") ",
                    i < topMatches.length - 1 ? '• ' : ''))))),
            selectedMatch.categories && selectedMatch.categories.length > 0 && (React.createElement(Box, null,
                React.createElement(Text, { bold: true }, "\uD83C\uDFF7\uFE0F "),
                React.createElement(Text, null, selectedMatch.categories.join(', ')))),
            React.createElement(Box, null,
                React.createElement(Text, { bold: true }, "\uD83D\uDCDD "),
                React.createElement(Text, null, formatContent(selectedMatch.content, showFullContent))),
            selectedMatch.content.length > CONTENT_PREVIEW_LENGTH && (React.createElement(Text, { dimColor: true }, showFullContent ? 'Press e to show less' : 'Press e to show more')),
            React.createElement(Box, { marginTop: 1 },
                React.createElement(Text, { dimColor: true }, "\u21B5 open in browser \u2022 q return to menu \u2022 \u2191\u2193 navigate"))));
    };
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, null,
            React.createElement(Text, { bold: true }, "Recent Matches "),
            React.createElement(Text, null,
                "(",
                matches.length,
                " shown) "),
            !monitorStatus.isRunning && React.createElement(Text, { color: "yellow" }, "(Monitor not running) "),
            React.createElement(Text, { dimColor: true },
                "Last: ",
                lastUpdate.toLocaleTimeString())),
        matches.length === 0 ? (React.createElement(Box, { flexDirection: "column", marginTop: 1 },
            React.createElement(Text, null, "No matches found"),
            !monitorStatus.isRunning && (React.createElement(Text, { dimColor: true }, "Start monitor: npm run monitor:start")))) : (React.createElement(React.Fragment, null,
            React.createElement(SimpleTable, { data: tableData, columns: columns, onSelect: handleSelectMatch, isActive: isActive }),
            renderDetails()))));
};
