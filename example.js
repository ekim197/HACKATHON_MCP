#!/usr/bin/env node

/**
 * Example usage of the Uber Ads MCP Server
 * 
 * This example demonstrates how to interact with the MCP server
 * to retrieve ad accounts and campaigns.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the MCP server
const serverPath = join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    UBER_CLIENT_ID: process.env.UBER_CLIENT_ID || 'your_client_id',
    UBER_CLIENT_SECRET: process.env.UBER_CLIENT_SECRET || 'your_client_secret',
  }
});

let messageId = 1;

function sendMCPRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };
  
  server.stdin.write(JSON.stringify(request) + '\n');
}

function handleServerResponse(data) {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      console.log('Server Response:', JSON.stringify(response, null, 2));
    } catch (error) {
      console.log('Raw server output:', line);
    }
  });
}

// Handle server output
server.stdout.on('data', handleServerResponse);
server.stderr.on('data', (data) => {
  console.error('Server Error:', data.toString());
});

// Example interaction sequence
setTimeout(() => {
  console.log('🚀 Starting MCP Server interaction...\n');
  
  // 1. Initialize the server
  sendMCPRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {}
    },
    clientInfo: {
      name: 'uber-ads-example',
      version: '1.0.0'
    }
  });
  
  // 2. List available tools
  setTimeout(() => {
    console.log('📋 Listing available tools...');
    sendMCPRequest('tools/list');
  }, 1000);
  
  // 3. Get ad accounts
  setTimeout(() => {
    console.log('🏢 Getting ad accounts...');
    sendMCPRequest('tools/call', {
      name: 'get_ad_accounts',
      arguments: {}
    });
  }, 2000);
  
  // 4. Get campaigns (example with UUID format like d924b89c-09f9-477b-a3ae-5526aa533835)
  setTimeout(() => {
    console.log('📊 Getting campaigns...');
    sendMCPRequest('tools/call', {
      name: 'get_campaigns',
      arguments: {
        ad_account_id: 'd924b89c-09f9-477b-a3ae-5526aa533835', // Replace with your actual ad account ID
        limit: 5,
        status: 'ACTIVE'
      }
    });
  }, 3000);
  
  // 5. Close the server
  setTimeout(() => {
    console.log('🔚 Closing server...');
    server.kill();
  }, 5000);
  
}, 500);

// Handle process exit
process.on('exit', () => {
  if (!server.killed) {
    server.kill();
  }
});

console.log('🔧 Uber Ads MCP Server Example');
console.log('Make sure to set your UBER_CLIENT_ID and UBER_CLIENT_SECRET environment variables');
console.log('================================================================================\n');
