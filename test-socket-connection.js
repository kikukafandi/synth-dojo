// Simple test to check socket connection
import { io as Client } from 'socket.io-client';

const URL = "http://localhost:3001";

console.log('Testing socket connection...');

const client = Client(URL, { forceNew: true });

client.on('connect', () => {
    console.log('✓ Connected to socket server');
    client.disconnect();
    process.exit(0);
});

client.on('connect_error', (error) => {
    console.error('✗ Connection failed:', error);
    process.exit(1);
});

client.connect();

// Timeout after 5 seconds
setTimeout(() => {
    console.error('✗ Connection timeout');
    client.disconnect();
    process.exit(1);
}, 5000);