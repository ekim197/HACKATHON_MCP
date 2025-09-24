# Uber Ads MCP Server

A Model Context Protocol (MCP) server that provides access to the Uber Ads External API. This server allows you to retrieve ad accounts, campaigns, campaign details, and performance statistics through a standardized MCP interface.

**Now available in Python!** This server has been converted from TypeScript to Python for easier integration and deployment.

## Features

- **Ad Account Management**: Retrieve all ad accounts for authenticated users
- **Campaign Operations**: Get campaigns with filtering options (status, pagination)
- **Campaign Details**: Fetch detailed information about specific campaigns
- **Performance Analytics**: Retrieve campaign statistics and metrics
- **OAuth 2.0 Authentication**: Secure authentication using Uber's OAuth 2.0 flow
- **Error Handling**: Comprehensive error handling with proper MCP error codes

## Available Tools

### 1. `get_ad_accounts`
Retrieve all ad accounts for the authenticated user.

**Parameters**: None

**Example Response**:
```json
[
  {
    "id": "account_123",
    "name": "My Ad Account",
    "currency": "USD",
    "timezone": "America/New_York",
    "status": "ACTIVE",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

### 2. `get_campaigns`
Retrieve campaigns for a specific ad account with optional filtering.

**Parameters**:
- `ad_account_id` (required): The ID of the ad account
- `limit` (optional): Maximum number of campaigns to retrieve (default: 50)
- `offset` (optional): Number of campaigns to skip (default: 0)
- `status` (optional): Filter by campaign status ("ACTIVE", "PAUSED", "ARCHIVED")

**Example**:
```json
{
  "ad_account_id": "account_123",
  "limit": 10,
  "status": "ACTIVE"
}
```

### 3. `get_campaign_details`
Get detailed information about a specific campaign.

**Parameters**:
- `ad_account_id` (required): The ID of the ad account
- `campaign_id` (required): The ID of the campaign

### 4. `get_campaign_stats`
Retrieve performance statistics for campaigns within a date range.

**Parameters**:
- `ad_account_id` (required): The ID of the ad account
- `campaign_ids` (required): Array of campaign IDs to get stats for
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `metrics` (optional): Array of metrics to retrieve (impressions, clicks, spend, conversions, ctr, cpm)

## Setup

### Prerequisites

- Python 3.8 or higher
- Uber Developer Account with Ads API access
- Uber App credentials (Client ID and Client Secret) - Optional for current hardcoded token setup

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd uber-ads-mcp-server
```

2. Install the package:
```bash
pip install -e .
```

Or install dependencies manually:
```bash
pip install -r requirements.txt
```

3. Token Configuration:
The server is currently configured with a hardcoded OAuth token for quick testing. For production use, set up environment variables:
```bash
cp env.example .env
```

Edit `.env` and add your Uber API credentials (optional for current hardcoded setup):
```bash
UBER_CLIENT_ID=your_actual_client_id
UBER_CLIENT_SECRET=your_actual_client_secret
UBER_BASE_URL=https://api.uber.com
```

### Getting Uber API Credentials

1. Go to the [Uber Developer Dashboard](https://developer.uber.com/dashboard)
2. Create a new app or select an existing one
3. Enable the Ads API for your app
4. Note your Client ID and Client Secret from the app settings
5. Ensure your app has the required scopes: `ads.read` and `ads.write`

## Usage

### Running the Server

Start the MCP server:
```bash
python -m uber_ads_mcp_server.server
```

Or if installed as a package:
```bash
uber-ads-mcp-server
```

For development, you can also run directly:
```bash
python src/uber_ads_mcp_server/server.py
```

### Integration with MCP Clients

This server implements the Model Context Protocol and can be used with any MCP-compatible client. The server communicates via stdio and provides the tools listed above.

Example MCP client configuration:
```json
{
  "mcpServers": {
    "uber-ads": {
      "command": "python",
      "args": ["-m", "uber_ads_mcp_server.server"],
      "env": {
        "UBER_CLIENT_ID": "your_client_id",
        "UBER_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

Or using the installed package:
```json
{
  "mcpServers": {
    "uber-ads": {
      "command": "uber-ads-mcp-server",
      "env": {
        "UBER_CLIENT_ID": "your_client_id",
        "UBER_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

## API Reference

### Uber Ads API Endpoints Used

- `GET /v1/ads` - Retrieve ad accounts
- `GET /v1/ads/{ad_account_id}/campaigns` - Get campaigns
- `GET /v1/ads/{ad_account_id}/campaigns/{campaign_id}` - Get campaign details
- `GET /v1/ads/{ad_account_id}/reports/campaigns` - Get campaign statistics
- `POST /oauth/v2/token` - OAuth 2.0 token endpoint

### Example API Call

Based on the Uber Ads API documentation, here's an example of how the API is called:

```bash
curl -X GET "https://api.uber.com/v1/ads/d924b89c-09f9-477b-a3ae-5526aa533835/campaigns" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Accept: application/json"
```

The MCP server handles the authentication and token management automatically.

### Authentication

The server uses OAuth 2.0 Client Credentials flow for authentication. Access tokens are automatically managed and refreshed as needed.

## Error Handling

The server provides comprehensive error handling:

- **Invalid Configuration**: Missing or invalid environment variables
- **Authentication Errors**: Invalid credentials or expired tokens
- **API Errors**: Proper mapping of Uber API errors to MCP error codes
- **Network Errors**: Connection and timeout handling

## Development

### Project Structure

```
src/uber_ads_mcp_server/
├── __init__.py           # Package initialization
├── server.py             # Main MCP server implementation
├── uber_ads_client.py    # Uber Ads API client
└── types.py              # Pydantic type definitions
```

### Development

Install in development mode:
```bash
pip install -e .
```

Run tests (if available):
```bash
python -m pytest
```

### Example Usage

Run the Python example:
```bash
python example_python.py
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues related to:
- **MCP Server**: Open an issue in this repository
- **Uber Ads API**: Check the [Uber Developer Documentation](https://developer.uber.com/docs/ads)
- **MCP Protocol**: See the [Model Context Protocol documentation](https://modelcontextprotocol.io)

## Changelog

### v1.0.0
- Initial release
- Support for ad accounts, campaigns, and campaign statistics
- OAuth 2.0 authentication
- Comprehensive error handling
