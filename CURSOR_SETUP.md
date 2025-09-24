# Setting Up Uber Ads MCP Server with Cursor

This guide will help you configure Cursor to use your Uber Ads MCP server.

## Method 1: Using Cursor Settings (Recommended)

1. **Open Cursor Settings**:
   - Press `Cmd + ,` (macOS) or `Ctrl + ,` (Windows/Linux)
   - Or go to `Cursor > Settings`

2. **Navigate to MCP Settings**:
   - In the settings search bar, type "MCP" or "Model Context Protocol"
   - Look for "MCP Servers" or similar setting

3. **Add the Server Configuration**:
   Add this configuration to your MCP servers:

   ```json
   {
     "uber-ads": {
       "command": "python",
       "args": [
         "-m", 
         "uber_ads_mcp_server.server"
       ],
       "cwd": "/Users/esk007/Desktop/HACKATHON_MCP",
       "env": {
         "UBER_CLIENT_ID": "optional_for_hardcoded_token",
         "UBER_CLIENT_SECRET": "optional_for_hardcoded_token",
         "UBER_BASE_URL": "https://api.uber.com"
       }
     }
   }
   ```

## Method 2: Configuration File

If Cursor supports configuration files, use the provided `cursor_mcp_config.json`:

1. **Copy the configuration**:
   ```bash
   cp cursor_mcp_config.json ~/.config/cursor/mcp_servers.json
   ```

2. **Or create manually**:
   Create `~/.config/cursor/mcp_servers.json` with the content from `cursor_mcp_config.json`

## Method 3: Direct Installation (Alternative)

If you've installed the package globally:

1. **Install the package**:
   ```bash
   cd /Users/esk007/Desktop/HACKATHON_MCP
   pip install -e .
   ```

2. **Use this simpler configuration**:
   ```json
   {
     "uber-ads": {
       "command": "uber-ads-mcp-server"
     }
   }
   ```

## Prerequisites

1. **Install Python dependencies**:
   ```bash
   cd /Users/esk007/Desktop/HACKATHON_MCP
   pip install -r requirements.txt
   ```

2. **Test the server manually**:
   ```bash
   python -m uber_ads_mcp_server.server
   ```

## Available Tools in Cursor

Once configured, you'll have access to these tools in Cursor:

- **`get_ad_accounts`**: Retrieve all ad accounts
- **`get_campaigns`**: Get campaigns with filtering options
- **`get_campaign_details`**: Get detailed campaign information  
- **`get_campaign_stats`**: Retrieve performance statistics

## Usage Examples

In Cursor, you can now ask questions like:

- "Show me all my Uber ad accounts"
- "Get the active campaigns for ad account d924b89c-09f9-477b-a3ae-5526aa533835"
- "What are the performance stats for my campaigns from last week?"

## Troubleshooting

1. **Server not starting**:
   - Check that Python dependencies are installed
   - Verify the working directory path is correct
   - Test the server manually first

2. **Authentication issues**:
   - The server uses a hardcoded token, so no OAuth setup needed
   - Check that the token hasn't expired

3. **Path issues**:
   - Make sure the `cwd` path points to your project directory
   - Use absolute paths in the configuration

## Configuration Details

- **command**: `python` - Uses system Python
- **args**: `["-m", "uber_ads_mcp_server.server"]` - Runs the server module
- **cwd**: `/Users/esk007/Desktop/HACKATHON_MCP` - Working directory
- **env**: Environment variables (optional with hardcoded token)

The server will automatically use your hardcoded OAuth token to authenticate with the Uber Ads API.
