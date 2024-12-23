import React, { FC, useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { getMonitorStatus, MonitorStatus as Status } from '../../services/monitor-status.js';

export const MonitorStatus: FC = () => {
  const [status, setStatus] = useState<Status>({ isRunning: false });
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
    return (
      <Box padding={1}>
        <Text>Loading status...</Text>
      </Box>
    );
  }

  return (
    <Box padding={1} flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Monitor Status</Text>
      </Box>

      <Box>
        <Text>Status: </Text>
        <Text color={status.isRunning ? 'green' : 'yellow'}>
          {status.isRunning ? 'Running' : 'Stopped'}
        </Text>
      </Box>

      {status.isRunning && (
        <>
          <Box marginTop={1} flexDirection="column">
            <Text>Uptime: {status.uptime}</Text>
            <Text>Memory Usage: {status.memory}</Text>
            <Text>CPU Usage: {status.cpu}</Text>
            <Text>Restarts: {status.restarts}</Text>
          </Box>

          <Box marginTop={2} flexDirection="column">
            <Text dimColor>Monitor Controls:</Text>
            <Text dimColor>npm run monitor:stop - Stop the monitor</Text>
            <Text dimColor>npm run monitor:logs - View monitor logs</Text>
          </Box>
        </>
      )}

      {!status.isRunning && (
        <Box marginTop={1} flexDirection="column">
          <Text>Start the monitor using:</Text>
          <Text bold>npm run monitor:start</Text>
        </Box>
      )}
    </Box>
  );
}; 