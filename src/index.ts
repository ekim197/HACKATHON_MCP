#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { UberAdsClient } from "./uber-ads-client.js";
import { z } from "zod";

// Configuration schema - OAuth credentials now optional since we're using hardcoded token
const ConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  baseUrl: z.string().default("https://api.uber.com"),
});

type Config = z.infer<typeof ConfigSchema>;

class UberAdsMCPServer {
  private server: Server;
  private uberAdsClient: UberAdsClient;

  constructor() {
    this.server = new Server(
      {
        name: "uber-ads-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Load configuration from environment variables
    const config = this.loadConfig();
    this.uberAdsClient = new UberAdsClient(config);

    this.setupToolHandlers();
  }

  private loadConfig(): Config {
    const config = {
      clientId: process.env.UBER_CLIENT_ID || undefined,
      clientSecret: process.env.UBER_CLIENT_SECRET || undefined,
      baseUrl: process.env.UBER_BASE_URL || "https://api.uber.com",
    };

    try {
      return ConfigSchema.parse(config);
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Invalid configuration: ${error}`
      );
    }
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_ad_accounts",
          description: "Retrieve all ad accounts for the authenticated user",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_campaigns",
          description: "Retrieve campaigns for a specific ad account",
          inputSchema: {
            type: "object",
            properties: {
              ad_account_id: {
                type: "string",
                description: "The ID of the ad account to retrieve campaigns for",
              },
              limit: {
                type: "number",
                description: "Maximum number of campaigns to retrieve (default: 50)",
                default: 50,
              },
              offset: {
                type: "number",
                description: "Number of campaigns to skip (default: 0)",
                default: 0,
              },
              status: {
                type: "string",
                enum: ["ACTIVE", "PAUSED", "ARCHIVED"],
                description: "Filter campaigns by status",
              },
            },
            required: ["ad_account_id"],
          },
        },
        {
          name: "get_campaign_details",
          description: "Get detailed information about a specific campaign",
          inputSchema: {
            type: "object",
            properties: {
              ad_account_id: {
                type: "string",
                description: "The ID of the ad account",
              },
              campaign_id: {
                type: "string",
                description: "The ID of the campaign to retrieve details for",
              },
            },
            required: ["ad_account_id", "campaign_id"],
          },
        },
        {
          name: "get_campaign_stats",
          description: "Retrieve performance statistics for campaigns",
          inputSchema: {
            type: "object",
            properties: {
              ad_account_id: {
                type: "string",
                description: "The ID of the ad account",
              },
              campaign_ids: {
                type: "array",
                items: { type: "string" },
                description: "Array of campaign IDs to get stats for",
              },
              start_date: {
                type: "string",
                description: "Start date for stats in YYYY-MM-DD format",
              },
              end_date: {
                type: "string",
                description: "End date for stats in YYYY-MM-DD format",
              },
              metrics: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["impressions", "clicks", "spend", "conversions", "ctr", "cpm"],
                },
                description: "Metrics to retrieve",
              },
            },
            required: ["ad_account_id", "campaign_ids", "start_date", "end_date"],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_ad_accounts":
            return await this.handleGetAdAccounts();

          case "get_campaigns":
            return await this.handleGetCampaigns(args);

          case "get_campaign_details":
            return await this.handleGetCampaignDetails(args);

          case "get_campaign_stats":
            return await this.handleGetCampaignStats(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error}`
        );
      }
    });
  }

  private async handleGetAdAccounts() {
    const adAccounts = await this.uberAdsClient.getAdAccounts();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(adAccounts, null, 2),
        },
      ],
    };
  }

  private async handleGetCampaigns(args: any) {
    const { ad_account_id, limit = 50, offset = 0, status } = args;
    
    if (!ad_account_id) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "ad_account_id is required"
      );
    }

    const campaigns = await this.uberAdsClient.getCampaigns(
      ad_account_id,
      { limit, offset, status }
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(campaigns, null, 2),
        },
      ],
    };
  }

  private async handleGetCampaignDetails(args: any) {
    const { ad_account_id, campaign_id } = args;
    
    if (!ad_account_id || !campaign_id) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Both ad_account_id and campaign_id are required"
      );
    }

    const campaignDetails = await this.uberAdsClient.getCampaignDetails(
      ad_account_id,
      campaign_id
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(campaignDetails, null, 2),
        },
      ],
    };
  }

  private async handleGetCampaignStats(args: any) {
    const { ad_account_id, campaign_ids, start_date, end_date, metrics } = args;
    
    if (!ad_account_id || !campaign_ids || !start_date || !end_date) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "ad_account_id, campaign_ids, start_date, and end_date are required"
      );
    }

    const stats = await this.uberAdsClient.getCampaignStats(
      ad_account_id,
      campaign_ids,
      start_date,
      end_date,
      metrics
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start the server
async function main() {
  const server = new UberAdsMCPServer();
  await server.run();
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
