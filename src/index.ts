#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';

// Validation schemas
const AuthTokenSchema = z.string().min(1, 'Authorization token is required').optional();

const AdAccountIdSchema = z.string().min(1, 'Ad account ID is required');

const CampaignIdSchema = z.string().min(1, 'Campaign ID is required');

const CampaignFiltersSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'DELETED']).optional(),
  limit: z.number().min(1).max(100).default(20).optional(),
  offset: z.number().min(0).default(0).optional(),
}).optional();

const CampaignCreateSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  status: z.enum(['ACTIVE', 'PAUSED']).default('ACTIVE'),
  budget_type: z.enum(['DAILY', 'LIFETIME']).default('DAILY'),
  budget_amount: z.number().positive('Budget amount must be positive'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  objective: z.enum(['AWARENESS', 'CONSIDERATION', 'CONVERSION']).default('CONVERSION'),
});

const CampaignUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
  budget_amount: z.number().positive().optional(),
  end_time: z.string().optional(),
});

// Base API configuration
const UBER_ADS_API_BASE_URL = 'https://api.uber.com/v1/ads';
const DEFAULT_AUTH_TOKEN = process.env.UBER_ADS_AUTH_TOKEN || '';

class UberExternalAdsAPIServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'uber-external-ads-api',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_campaigns',
            description: 'Get campaigns for an ad account',
            inputSchema: {
              type: 'object',
              properties: {
                auth_token: {
                  type: 'string',
                  description: 'Bearer token for authentication',
                },
                ad_account_id: {
                  type: 'string',
                  description: 'The ad account UUID',
                },
                filters: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['ACTIVE', 'PAUSED', 'DELETED'],
                      description: 'Filter campaigns by status',
                    },
                    limit: {
                      type: 'number',
                      minimum: 1,
                      maximum: 100,
                      default: 20,
                      description: 'Number of campaigns to return',
                    },
                    offset: {
                      type: 'number',
                      minimum: 0,
                      default: 0,
                      description: 'Number of campaigns to skip',
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ['ad_account_id'],
              additionalProperties: false,
            },
          },
          {
            name: 'get_campaign',
            description: 'Get details for a specific campaign',
            inputSchema: {
              type: 'object',
              properties: {
                auth_token: {
                  type: 'string',
                  description: 'Bearer token for authentication',
                },
                ad_account_id: {
                  type: 'string',
                  description: 'The ad account UUID',
                },
                campaign_id: {
                  type: 'string',
                  description: 'The campaign UUID',
                },
              },
              required: ['ad_account_id', 'campaign_id'],
              additionalProperties: false,
            },
          },
          {
            name: 'create_campaign',
            description: 'Create a new campaign',
            inputSchema: {
              type: 'object',
              properties: {
                auth_token: {
                  type: 'string',
                  description: 'Bearer token for authentication',
                },
                ad_account_id: {
                  type: 'string',
                  description: 'The ad account UUID',
                },
                campaign_data: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Campaign name',
                    },
                    status: {
                      type: 'string',
                      enum: ['ACTIVE', 'PAUSED'],
                      default: 'ACTIVE',
                      description: 'Campaign status',
                    },
                    budget_type: {
                      type: 'string',
                      enum: ['DAILY', 'LIFETIME'],
                      default: 'DAILY',
                      description: 'Budget type',
                    },
                    budget_amount: {
                      type: 'number',
                      minimum: 0.01,
                      description: 'Budget amount in USD',
                    },
                    start_time: {
                      type: 'string',
                      description: 'Campaign start time (ISO 8601)',
                    },
                    end_time: {
                      type: 'string',
                      description: 'Campaign end time (ISO 8601)',
                    },
                    objective: {
                      type: 'string',
                      enum: ['AWARENESS', 'CONSIDERATION', 'CONVERSION'],
                      default: 'CONVERSION',
                      description: 'Campaign objective',
                    },
                  },
                  required: ['name', 'budget_amount'],
                  additionalProperties: false,
                },
              },
              required: ['ad_account_id', 'campaign_data'],
              additionalProperties: false,
            },
          },
          {
            name: 'update_campaign',
            description: 'Update an existing campaign',
            inputSchema: {
              type: 'object',
              properties: {
                auth_token: {
                  type: 'string',
                  description: 'Bearer token for authentication',
                },
                ad_account_id: {
                  type: 'string',
                  description: 'The ad account UUID',
                },
                campaign_id: {
                  type: 'string',
                  description: 'The campaign UUID',
                },
                campaign_data: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Campaign name',
                    },
                    status: {
                      type: 'string',
                      enum: ['ACTIVE', 'PAUSED'],
                      description: 'Campaign status',
                    },
                    budget_amount: {
                      type: 'number',
                      minimum: 0.01,
                      description: 'Budget amount in USD',
                    },
                    end_time: {
                      type: 'string',
                      description: 'Campaign end time (ISO 8601)',
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ['ad_account_id', 'campaign_id', 'campaign_data'],
              additionalProperties: false,
            },
          },
          {
            name: 'delete_campaign',
            description: 'Delete a campaign',
            inputSchema: {
              type: 'object',
              properties: {
                auth_token: {
                  type: 'string',
                  description: 'Bearer token for authentication',
                },
                ad_account_id: {
                  type: 'string',
                  description: 'The ad account UUID',
                },
                campaign_id: {
                  type: 'string',
                  description: 'The campaign UUID',
                },
              },
              required: ['ad_account_id', 'campaign_id'],
              additionalProperties: false,
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_campaigns':
            return await this.getCampaigns(args);
          case 'get_campaign':
            return await this.getCampaign(args);
          case 'create_campaign':
            return await this.createCampaign(args);
          case 'update_campaign':
            return await this.updateCampaign(args);
          case 'delete_campaign':
            return await this.deleteCampaign(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getAuthToken(providedToken?: string): string {
    return providedToken || DEFAULT_AUTH_TOKEN;
  }

  private async getCampaigns(args: any) {
    const authToken = this.getAuthToken(args.auth_token);
    const adAccountId = AdAccountIdSchema.parse(args.ad_account_id);
    const filters = CampaignFiltersSchema.parse(args.filters);

    const url = `${UBER_ADS_API_BASE_URL}/${adAccountId}/campaigns`;
    const params = new URLSearchParams();

    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString());
    }

    try {
      const response = await axios.get(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  private async getCampaign(args: any) {
    const authToken = this.getAuthToken(args.auth_token);
    const adAccountId = AdAccountIdSchema.parse(args.ad_account_id);
    const campaignId = CampaignIdSchema.parse(args.campaign_id);

    const url = `${UBER_ADS_API_BASE_URL}/${adAccountId}/campaigns/${campaignId}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  private async createCampaign(args: any) {
    const authToken = this.getAuthToken(args.auth_token);
    const adAccountId = AdAccountIdSchema.parse(args.ad_account_id);
    const campaignData = CampaignCreateSchema.parse(args.campaign_data);

    const url = `${UBER_ADS_API_BASE_URL}/${adAccountId}/campaigns`;

    try {
      const response = await axios.post(url, campaignData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  private async updateCampaign(args: any) {
    const authToken = this.getAuthToken(args.auth_token);
    const adAccountId = AdAccountIdSchema.parse(args.ad_account_id);
    const campaignId = CampaignIdSchema.parse(args.campaign_id);
    const campaignData = CampaignUpdateSchema.parse(args.campaign_data);

    const url = `${UBER_ADS_API_BASE_URL}/${adAccountId}/campaigns/${campaignId}`;

    try {
      const response = await axios.patch(url, campaignData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  private async deleteCampaign(args: any) {
    const authToken = AuthTokenSchema.parse(args.auth_token);
    const adAccountId = AdAccountIdSchema.parse(args.ad_account_id);
    const campaignId = CampaignIdSchema.parse(args.campaign_id);

    const url = `${UBER_ADS_API_BASE_URL}/${adAccountId}/campaigns/${campaignId}`;

    try {
      const response = await axios.delete(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: `Campaign ${campaignId} deleted successfully`,
          },
        ],
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  private handleApiError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;
      const data = axiosError.response?.data;

      let errorMessage = `HTTP ${status} ${statusText}`;
      if (data && typeof data === 'object') {
        errorMessage += `\n${JSON.stringify(data, null, 2)}`;
      }

      return {
        content: [
          {
            type: 'text',
            text: `API Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
      isError: true,
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Uber External Ads API MCP server running on stdio');
  }
}

const server = new UberExternalAdsAPIServer();
server.run().catch(console.error);
