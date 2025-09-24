# Uber External Ads API MCP Server

An MCP (Model Context Protocol) server that provides access to Uber's External Ads API for campaign management.

## Features

- **Get Campaigns**: Retrieve campaigns for an ad account with optional filtering
- **Get Campaign**: Get details for a specific campaign
- **Create Campaign**: Create new advertising campaigns
- **Update Campaign**: Modify existing campaigns
- **Delete Campaign**: Remove campaigns

## Installation

```bash
npm install
npm run build
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Available Tools

### get_campaigns
Retrieve campaigns for an ad account.

**Parameters:**
- `auth_token` (required): Bearer token for authentication
- `ad_account_id` (required): The ad account UUID
- `filters` (optional): Object with filtering options
  - `status`: Filter by campaign status (ACTIVE, PAUSED, DELETED)
  - `limit`: Number of campaigns to return (1-100, default: 20)
  - `offset`: Number of campaigns to skip (default: 0)

### get_campaign
Get details for a specific campaign.

**Parameters:**
- `auth_token` (required): Bearer token for authentication
- `ad_account_id` (required): The ad account UUID
- `campaign_id` (required): The campaign UUID

### create_campaign
Create a new campaign.

**Parameters:**
- `auth_token` (required): Bearer token for authentication
- `ad_account_id` (required): The ad account UUID
- `campaign_data` (required): Campaign configuration object
  - `name` (required): Campaign name
  - `budget_amount` (required): Budget amount in USD
  - `status`: Campaign status (ACTIVE, PAUSED) - default: ACTIVE
  - `budget_type`: Budget type (DAILY, LIFETIME) - default: DAILY
  - `start_time`: Campaign start time (ISO 8601)
  - `end_time`: Campaign end time (ISO 8601)
  - `objective`: Campaign objective (AWARENESS, CONSIDERATION, CONVERSION) - default: CONVERSION

### update_campaign
Update an existing campaign.

**Parameters:**
- `auth_token` (required): Bearer token for authentication
- `ad_account_id` (required): The ad account UUID
- `campaign_id` (required): The campaign UUID
- `campaign_data` (required): Updates to apply
  - `name`: Campaign name
  - `status`: Campaign status (ACTIVE, PAUSED)
  - `budget_amount`: Budget amount in USD
  - `end_time`: Campaign end time (ISO 8601)

### delete_campaign
Delete a campaign.

**Parameters:**
- `auth_token` (required): Bearer token for authentication
- `ad_account_id` (required): The ad account UUID
- `campaign_id` (required): The campaign UUID

## Example Usage

Using the provided curl request as an example:

```typescript
// Get campaigns
await callTool('get_campaigns', {
  auth_token: 'IA.AQAAAATlHYAkrhJsBvg2h_K7dmXYDF_9LQAe8gEiCkd7Wyd79AB36AmskjmnMMPtDOwrWBgnGuHNb0Esrh2dScncw8weNgx5kjMNtxP88XJSdDzjfdOmcWe3Zvc0rHx-p5ldHqmXvDvUnjndiPqXigz_yg332ek6b_dmR-1KRus',
  ad_account_id: 'd924b89c-09f9-477b-a3ae-5526aa533835',
  filters: {
    status: 'ACTIVE',
    limit: 10
  }
});
```

## Configuration

The server uses the Uber External Ads API base URL: `https://api.uber.com/v1/ads`

All requests require a valid Bearer token for authentication.

## Error Handling

The server provides detailed error messages for:
- Authentication failures
- Invalid parameters
- API errors
- Network issues

Errors are returned with `isError: true` and descriptive messages.

## Security

- All authentication tokens are validated
- Input parameters are validated using Zod schemas
- API responses are properly formatted and sanitized