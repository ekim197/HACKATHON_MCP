#!/usr/bin/env node

/**
 * Simple validation test for MCP server
 */

import { spawn } from 'child_process';

async function testServer() {
  console.log('Testing MCP server startup...');

  const server = spawn('npm', ['run', 'dev'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  let output = '';

  server.stdout.on('data', (data) => {
    output += data.toString();
  });

  server.stderr.on('data', (data) => {
    const message = data.toString();
    console.log('Server output:', message.trim());

    if (message.includes('MCP server running')) {
      console.log('✅ Server started successfully!');
      server.kill();
      process.exit(0);
    }
  });

  // Test basic JSON-RPC request
  setTimeout(() => {
    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: "test-client",
          version: "1.0.0"
        }
      }
    };

    console.log('Sending initialize request...');
    server.stdin.write(JSON.stringify(initRequest) + '\n');
  }, 1000);

  setTimeout(() => {
    console.log('❌ Server failed to start within timeout');
    server.kill();
    process.exit(1);
  }, 5000);
}

testServer();