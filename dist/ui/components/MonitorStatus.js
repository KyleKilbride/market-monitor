import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { getMonitorStatus } from '../../services/monitor-status.js';
export const MonitorStatus = () => {
    const [status, setStatus] = useState({ isRunning: false });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadStatus = async () => {
            const result = await getMonitorStatus();
            setStatus(result);
            setLoading(false);
        };
        loadStatus();
        // Refresh status every 5 seconds
        const interval = setInterval(loadStatus, 5000);
        return () => clearInterval(interval);
    }, []);
    if (loading) {
        return (React.createElement(Box, { padding: 1 },
            React.createElement(Text, null, "Loading status...")));
    }
    return (React.createElement(Box, { padding: 1, flexDirection: "column" },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true }, "Monitor Status")),
        React.createElement(Box, null,
            React.createElement(Text, null, "Status: "),
            React.createElement(Text, { color: status.isRunning ? 'green' : 'yellow' }, status.isRunning ? 'Running' : 'Stopped')),
        status.isRunning && (React.createElement(React.Fragment, null,
            React.createElement(Box, { marginTop: 1, flexDirection: "column" },
                React.createElement(Text, null,
                    "Uptime: ",
                    status.uptime),
                React.createElement(Text, null,
                    "Memory Usage: ",
                    status.memory),
                React.createElement(Text, null,
                    "CPU Usage: ",
                    status.cpu),
                React.createElement(Text, null,
                    "Restarts: ",
                    status.restarts)),
            React.createElement(Box, { marginTop: 2, flexDirection: "column" },
                React.createElement(Text, { dimColor: true }, "Monitor Controls:"),
                React.createElement(Text, { dimColor: true }, "npm run monitor:stop - Stop the monitor"),
                React.createElement(Text, { dimColor: true }, "npm run monitor:logs - View monitor logs")))),
        !status.isRunning && (React.createElement(Box, { marginTop: 1, flexDirection: "column" },
            React.createElement(Text, null, "Start the monitor using:"),
            React.createElement(Text, { bold: true }, "npm run monitor:start")))));
};
