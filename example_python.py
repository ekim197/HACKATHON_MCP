#!/usr/bin/env python3
"""Example usage of the Uber Ads MCP Server in Python.

This example demonstrates how to interact with the MCP server
to retrieve ad accounts and campaigns.
"""

import asyncio
import json
import subprocess
import sys
from typing import Dict, Any


class MCPClient:
    """Simple MCP client for testing."""
    
    def __init__(self, server_command: list):
        """Initialize the MCP client.
        
        Args:
            server_command: Command to start the MCP server
        """
        self.server_command = server_command
        self.process = None
        self.message_id = 1
    
    async def start_server(self):
        """Start the MCP server process."""
        self.process = await asyncio.create_subprocess_exec(
            *self.server_command,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
    
    async def send_request(self, method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send an MCP request to the server.
        
        Args:
            method: MCP method name
            params: Request parameters
            
        Returns:
            Server response
        """
        if not self.process:
            raise RuntimeError("Server not started")
        
        request = {
            "jsonrpc": "2.0",
            "id": self.message_id,
            "method": method,
            "params": params or {}
        }
        
        self.message_id += 1
        
        # Send request
        request_json = json.dumps(request) + "\n"
        self.process.stdin.write(request_json.encode())
        await self.process.stdin.drain()
        
        # Read response
        response_line = await self.process.stdout.readline()
        if not response_line:
            raise RuntimeError("No response from server")
        
        try:
            response = json.loads(response_line.decode().strip())
            return response
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Invalid JSON response: {e}")
    
    async def close(self):
        """Close the server process."""
        if self.process:
            self.process.terminate()
            await self.process.wait()


async def main():
    """Run the example."""
    print("🔧 Uber Ads MCP Server Python Example")
    print("=" * 50)
    
    # Start the MCP server
    server_command = [sys.executable, "-m", "uber_ads_mcp_server.server"]
    client = MCPClient(server_command)
    
    try:
        print("🚀 Starting MCP server...")
        await client.start_server()
        
        # Wait a moment for server to initialize
        await asyncio.sleep(1)
        
        # 1. Initialize the server
        print("\n📋 Initializing server...")
        init_response = await client.send_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "clientInfo": {
                "name": "uber-ads-python-example",
                "version": "1.0.0"
            }
        })
        print(f"Init Response: {json.dumps(init_response, indent=2)}")
        
        # 2. List available tools
        print("\n📋 Listing available tools...")
        tools_response = await client.send_request("tools/list")
        print(f"Tools: {json.dumps(tools_response, indent=2)}")
        
        # 3. Get ad accounts
        print("\n🏢 Getting ad accounts...")
        accounts_response = await client.send_request("tools/call", {
            "name": "get_ad_accounts",
            "arguments": {}
        })
        print(f"Ad Accounts: {json.dumps(accounts_response, indent=2)}")
        
        # 4. Get campaigns (replace with actual ad account ID)
        print("\n📊 Getting campaigns...")
        campaigns_response = await client.send_request("tools/call", {
            "name": "get_campaigns",
            "arguments": {
                "ad_account_id": "d924b89c-09f9-477b-a3ae-5526aa533835",  # Replace with actual ID
                "limit": 5,
                "status": "ACTIVE"
            }
        })
        print(f"Campaigns: {json.dumps(campaigns_response, indent=2)}")
        
        # 5. Get campaign details (if campaigns exist)
        print("\n📝 Getting campaign details...")
        # This would need a real campaign ID from the previous response
        # details_response = await client.send_request("tools/call", {
        #     "name": "get_campaign_details",
        #     "arguments": {
        #         "ad_account_id": "d924b89c-09f9-477b-a3ae-5526aa533835",
        #         "campaign_id": "your_campaign_id_here"
        #     }
        # })
        # print(f"Campaign Details: {json.dumps(details_response, indent=2)}")
        
        print("\n✅ Example completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        
    finally:
        print("\n🔚 Closing server...")
        await client.close()


if __name__ == "__main__":
    print("Make sure to install dependencies first:")
    print("pip install -e .")
    print("Set UBER_CLIENT_ID and UBER_CLIENT_SECRET environment variables (optional for hardcoded token)")
    print("-" * 80)
    
    asyncio.run(main())
