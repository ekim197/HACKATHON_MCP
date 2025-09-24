#!/usr/bin/env python3
"""Uber Ads MCP Server.

A Model Context Protocol server that provides access to the Uber Ads External API.
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    CallToolRequest,
    CallToolResult,
    ListToolsRequest,
    ListToolsResult,
    TextContent,
    Tool,
)
from pydantic import ValidationError

from .types import (
    UberAdsConfig,
    GetCampaignsArgs,
    GetCampaignDetailsArgs,
    GetCampaignStatsArgs,
)
from .uber_ads_client import UberAdsClient, UberAdsAPIError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the MCP server
app = Server("uber-ads-mcp-server")


class UberAdsMCPServer:
    """MCP Server for Uber Ads API."""
    
    def __init__(self):
        """Initialize the server."""
        self.config = self._load_config()
        self.client = UberAdsClient(self.config)
    
    def _load_config(self) -> UberAdsConfig:
        """Load configuration from environment variables."""
        return UberAdsConfig(
            client_id=os.getenv("UBER_CLIENT_ID"),
            client_secret=os.getenv("UBER_CLIENT_SECRET"),
            base_url=os.getenv("UBER_BASE_URL", "https://api.uber.com"),
        )
    
    async def handle_get_ad_accounts(self) -> CallToolResult:
        """Handle get_ad_accounts tool call."""
        try:
            ad_accounts = self.client.get_ad_accounts()
            result_data = [account.model_dump() for account in ad_accounts]
            
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=json.dumps(result_data, indent=2, default=str)
                    )
                ]
            )
        except UberAdsAPIError as e:
            logger.error(f"API error in get_ad_accounts: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text", 
                        text=f"Error retrieving ad accounts: {e.message}"
                    )
                ],
                isError=True
            )
        except Exception as e:
            logger.error(f"Unexpected error in get_ad_accounts: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Unexpected error: {str(e)}"
                    )
                ],
                isError=True
            )
    
    async def handle_get_campaigns(self, arguments: Dict[str, Any]) -> CallToolResult:
        """Handle get_campaigns tool call."""
        try:
            # Validate arguments
            args = GetCampaignsArgs(**arguments)
            
            # Create options from args
            from .types import GetCampaignsOptions
            options = GetCampaignsOptions(
                limit=args.limit,
                offset=args.offset,
                status=args.status
            )
            
            # Get campaigns
            campaigns = self.client.get_campaigns(
                ad_account_id=args.ad_account_id,
                options=options
            )
            
            result_data = [campaign.model_dump() for campaign in campaigns]
            
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=json.dumps(result_data, indent=2, default=str)
                    )
                ]
            )
        except ValidationError as e:
            logger.error(f"Validation error in get_campaigns: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Invalid arguments: {str(e)}"
                    )
                ],
                isError=True
            )
        except UberAdsAPIError as e:
            logger.error(f"API error in get_campaigns: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Error retrieving campaigns: {e.message}"
                    )
                ],
                isError=True
            )
        except Exception as e:
            logger.error(f"Unexpected error in get_campaigns: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Unexpected error: {str(e)}"
                    )
                ],
                isError=True
            )
    
    async def handle_get_campaign_details(self, arguments: Dict[str, Any]) -> CallToolResult:
        """Handle get_campaign_details tool call."""
        try:
            # Validate arguments
            args = GetCampaignDetailsArgs(**arguments)
            
            # Get campaign details
            campaign = self.client.get_campaign_details(
                ad_account_id=args.ad_account_id,
                campaign_id=args.campaign_id
            )
            
            result_data = campaign.model_dump()
            
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=json.dumps(result_data, indent=2, default=str)
                    )
                ]
            )
        except ValidationError as e:
            logger.error(f"Validation error in get_campaign_details: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Invalid arguments: {str(e)}"
                    )
                ],
                isError=True
            )
        except UberAdsAPIError as e:
            logger.error(f"API error in get_campaign_details: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Error retrieving campaign details: {e.message}"
                    )
                ],
                isError=True
            )
        except Exception as e:
            logger.error(f"Unexpected error in get_campaign_details: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Unexpected error: {str(e)}"
                    )
                ],
                isError=True
            )
    
    async def handle_get_campaign_stats(self, arguments: Dict[str, Any]) -> CallToolResult:
        """Handle get_campaign_stats tool call."""
        try:
            # Validate arguments
            args = GetCampaignStatsArgs(**arguments)
            
            # Get campaign stats
            stats = self.client.get_campaign_stats(
                ad_account_id=args.ad_account_id,
                campaign_ids=args.campaign_ids,
                start_date=args.start_date,
                end_date=args.end_date,
                metrics=args.metrics
            )
            
            result_data = [stat.model_dump() for stat in stats]
            
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=json.dumps(result_data, indent=2, default=str)
                    )
                ]
            )
        except ValidationError as e:
            logger.error(f"Validation error in get_campaign_stats: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Invalid arguments: {str(e)}"
                    )
                ],
                isError=True
            )
        except UberAdsAPIError as e:
            logger.error(f"API error in get_campaign_stats: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Error retrieving campaign stats: {e.message}"
                    )
                ],
                isError=True
            )
        except Exception as e:
            logger.error(f"Unexpected error in get_campaign_stats: {e}")
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Unexpected error: {str(e)}"
                    )
                ],
                isError=True
            )


# Initialize server instance
server_instance = UberAdsMCPServer()


@app.list_tools()
async def list_tools() -> ListToolsResult:
    """List available tools."""
    return ListToolsResult(
        tools=[
            Tool(
                name="get_ad_accounts",
                description="Retrieve all ad accounts for the authenticated user",
                inputSchema={
                    "type": "object",
                    "properties": {},
                }
            ),
            Tool(
                name="get_campaigns",
                description="Retrieve campaigns for a specific ad account",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "ad_account_id": {
                            "type": "string",
                            "description": "The ID of the ad account to retrieve campaigns for"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of campaigns to retrieve (default: 50)",
                            "default": 50
                        },
                        "offset": {
                            "type": "integer",
                            "description": "Number of campaigns to skip (default: 0)",
                            "default": 0
                        },
                        "status": {
                            "type": "string",
                            "enum": ["ACTIVE", "PAUSED", "ARCHIVED"],
                            "description": "Filter campaigns by status"
                        }
                    },
                    "required": ["ad_account_id"]
                }
            ),
            Tool(
                name="get_campaign_details",
                description="Get detailed information about a specific campaign",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "ad_account_id": {
                            "type": "string",
                            "description": "The ID of the ad account"
                        },
                        "campaign_id": {
                            "type": "string",
                            "description": "The ID of the campaign to retrieve details for"
                        }
                    },
                    "required": ["ad_account_id", "campaign_id"]
                }
            ),
            Tool(
                name="get_campaign_stats",
                description="Retrieve performance statistics for campaigns",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "ad_account_id": {
                            "type": "string",
                            "description": "The ID of the ad account"
                        },
                        "campaign_ids": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Array of campaign IDs to get stats for"
                        },
                        "start_date": {
                            "type": "string",
                            "description": "Start date for stats in YYYY-MM-DD format"
                        },
                        "end_date": {
                            "type": "string",
                            "description": "End date for stats in YYYY-MM-DD format"
                        },
                        "metrics": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "enum": ["impressions", "clicks", "spend", "conversions", "ctr", "cpm"]
                            },
                            "description": "Metrics to retrieve"
                        }
                    },
                    "required": ["ad_account_id", "campaign_ids", "start_date", "end_date"]
                }
            )
        ]
    )


@app.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> CallToolResult:
    """Handle tool calls."""
    try:
        if name == "get_ad_accounts":
            return await server_instance.handle_get_ad_accounts()
        elif name == "get_campaigns":
            return await server_instance.handle_get_campaigns(arguments)
        elif name == "get_campaign_details":
            return await server_instance.handle_get_campaign_details(arguments)
        elif name == "get_campaign_stats":
            return await server_instance.handle_get_campaign_stats(arguments)
        else:
            return CallToolResult(
                content=[
                    TextContent(
                        type="text",
                        text=f"Unknown tool: {name}"
                    )
                ],
                isError=True
            )
    except Exception as e:
        logger.error(f"Error in call_tool for {name}: {e}")
        return CallToolResult(
            content=[
                TextContent(
                    type="text",
                    text=f"Tool execution failed: {str(e)}"
                )
            ],
            isError=True
        )


async def main():
    """Run the MCP server."""
    logger.info("Starting Uber Ads MCP Server...")
    
    # Load environment variables from .env file if it exists
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        # dotenv not installed, skip
        pass
    
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
