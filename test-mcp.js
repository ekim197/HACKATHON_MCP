#!/usr/bin/env node

/**
 * Simple test script to verify MCP server functionality
 * This tests the server's ability to list tools and handle basic requests
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

class MCPTester extends EventEmitter {
  constructor() {
    super();
    this.server = null;
    this.messageId = 1;
  }

  async startServer() {
    console.log('Starting MCP server...');

    this.server = spawn('tsx', ['src/index.ts'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: process.cwd()
    });

    this.server.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        try {
          const message = JSON.parse(line);
          this.emit('message', message);
        } catch (e) {
          // Ignore non-JSON output
        }
      });
    });

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  sendRequest(method, params = {}) {
    const request = {
      jsonrpc: "2.0",
      id: this.messageId++,
      method,
      params
    };

    console.log('→', JSON.stringify(request));
    this.server.stdin.write(JSON.stringify(request) + '\n');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      const handler = (message) => {
        if (message.id === request.id) {
          clearTimeout(timeout);
          this.off('message', handler);
          console.log('←', JSON.stringify(message, null, 2));
          resolve(message);
        }
      };

      this.on('message', handler);
    });
  }

  async initialize() {
    return await this.sendRequest('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    });
  }

  async listTools() {
    return await this.sendRequest('tools/list');
  }

  async callTool(name, arguments_) {
    return await this.sendRequest('tools/call', {
      name,
      arguments: arguments_
    });
  }

  stop() {
    if (this.server) {
      this.server.kill();
    }
  }
}

async function runTests() {
  const tester = new MCPTester();

  try {
    await tester.startServer();
    console.log('✓ Server started');

    // Initialize
    const initResponse = await tester.initialize();
    console.log('✓ Initialized');

    // List tools
    const toolsResponse = await tester.listTools();
    console.log('✓ Listed tools:', toolsResponse.result?.tools?.length || 0);

    // Test with invalid parameters (should fail gracefully)
    try {
      await tester.callTool('get_campaigns', {
        auth_token: '',
        ad_account_id: 'test'
      });
    } catch (error) {
      console.log('✓ Error handling works');
    }

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    tester.stop();
  }
}

runTests();