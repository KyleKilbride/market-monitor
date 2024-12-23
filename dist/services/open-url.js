import { exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';
const execAsync = promisify(exec);
export async function openUrl(url) {
    if (!url) {
        console.error('No URL provided');
        return;
    }
    try {
        // Ensure URL is properly formatted
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        console.log('Opening URL:', formattedUrl);
        const command = platform() === 'win32'
            ? `start "${formattedUrl}"`
            : platform() === 'darwin'
                ? `open "${formattedUrl}"`
                : `xdg-open "${formattedUrl}"`;
        console.log('Executing command:', command);
        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            console.error('Command stderr:', stderr);
        }
        if (stdout) {
            console.log('Command stdout:', stdout);
        }
    }
    catch (error) {
        console.error('Failed to open URL:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
    }
}
