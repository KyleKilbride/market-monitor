import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export async function getMonitorStatus() {
    try {
        const { stdout } = await execAsync('pm2 jlist');
        const processes = JSON.parse(stdout);
        const monitor = processes.find((p) => p.name === 'market-monitor');
        if (!monitor) {
            return { isRunning: false };
        }
        return {
            isRunning: monitor.pm2_env.status === 'online',
            uptime: formatUptime(Date.now() - monitor.pm2_env.pm_uptime),
            memory: formatMemory(monitor.monit.memory),
            cpu: `${monitor.monit.cpu}%`,
            restarts: monitor.pm2_env.restart_time
        };
    }
    catch (error) {
        return { isRunning: false };
    }
}
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0)
        return `${days}d ${hours % 24}h`;
    if (hours > 0)
        return `${hours}h ${minutes % 60}m`;
    if (minutes > 0)
        return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}
function formatMemory(bytes) {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
}
