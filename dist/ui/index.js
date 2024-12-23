import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
// Clear the console
console.clear();
// Track active instance
let activeInstance = null;
// Cleanup function
const cleanup = () => {
    if (activeInstance) {
        activeInstance.unmount();
        activeInstance = null;
    }
};
// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
// Cleanup any existing instance
cleanup();
// Render the main App component
activeInstance = render(React.createElement(App));
// Handle cleanup when the app exits
activeInstance.waitUntilExit().then(() => {
    cleanup();
    process.exit(0);
});
