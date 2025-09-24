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
  page_limit: z.number().min(1).max(100).default(20).optional(),
  page_token: z.string().optional(),
}).optional();

const AdGroupFiltersSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'DELETED']).optional(),
  page_limit: z.number().min(1).max(100).default(20).optional(),
  page_token: z.string().optional(),
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

const ReportRequestSchema = z.object({
  account_id: z.string().min(1, 'Account ID is required'),
  report_type: z.enum(['AD_PERFORMANCE', 'CAMPAIGN_PERFORMANCE', 'CREATIVE_PERFORMANCE']),
  time_range: z.object({
    start_time: z.string().min(1, 'Start time is required'),
    end_time: z.string().min(1, 'End time is required'),
  }),
  columns: z.array(z.string()).min(1, 'At least one column is required'),
  time_unit: z.enum(['SUMMARY', 'DAILY', 'WEEKLY', 'MONTHLY']),
});

const ReportIdSchema = z.string().min(1, 'Report ID is required');

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
                    page_limit: {
                      type: 'number',
                      minimum: 1,
                      maximum: 100,
                      default: 20,
                      description: 'Maximum number of campaigns to return per page',
                    },
                    page_token: {
                      type: 'string',
                      description: 'Token for retrieving the next page of results. Use the next_page_token from previous response.',
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
            name: 'get_ad_groups',
            description: 'Get ad groups for a specific campaign',
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
                  description: 'The campaign UUID to get ad groups for',
                },
                filters: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['ACTIVE', 'PAUSED', 'DELETED'],
                      description: 'Filter ad groups by status',
                    },
                    page_limit: {
                      type: 'number',
                      minimum: 1,
                      maximum: 100,
                      default: 20,
                      description: 'Maximum number of ad groups to return per page',
                    },
                    page_token: {
                      type: 'string',
                      description: 'Token for retrieving the next page of results. Use the next_page_token from previous response.',
                    },
                  },
                  additionalProperties: false,
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
          {
            name: 'generate_report',
            description: 'Generate a report for an ad account, poll until CSV is ready, and fetch the CSV data. Returns CSV data, download URL, and report schema (column meanings for headerless CSV).',
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
                report_data: {
                  type: 'object',
                  properties: {
                    account_id: {
                      type: 'string',
                      description: 'Account ID for the report',
                    },
                    report_type: {
                      type: 'string',
                      enum: ['AD_PERFORMANCE', 'CAMPAIGN_PERFORMANCE', 'CREATIVE_PERFORMANCE'],
                      description: 'Type of report to generate',
                    },
                    time_range: {
                      type: 'object',
                      properties: {
                        start_time: {
                          type: 'string',
                          description: 'Start time in ISO 8601 format (e.g., 2025-07-10T00:00:00Z)',
                        },
                        end_time: {
                          type: 'string',
                          description: 'End time in ISO 8601 format (e.g., 2025-07-21T00:00:00Z)',
                        },
                      },
                      required: ['start_time', 'end_time'],
                      additionalProperties: false,
                    },
                    columns: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                      description: 'Array of columns to include in the report (e.g., ["campaign_id", "currency_code", "ad_spend", "impressions", "clicks"])',
                    },
                    time_unit: {
                      type: 'string',
                      enum: ['SUMMARY', 'DAILY', 'WEEKLY', 'MONTHLY'],
                      description: 'Time unit for aggregation',
                    },
                  },
                  required: ['account_id', 'report_type', 'time_range', 'columns', 'time_unit'],
                  additionalProperties: false,
                },
              },
              required: ['ad_account_id', 'report_data'],
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
          case 'get_ad_groups':
            return await this.getAdGroups(args);
          case 'create_campaign':
            return await this.createCampaign(args);
          case 'update_campaign':
            return await this.updateCampaign(args);
          case 'delete_campaign':
            return await this.deleteCampaign(args);
          case 'generate_report':
            return await this.generateReport(args);
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
    if (filters?.page_limit) {
      params.append('page_limit', filters.page_limit.toString());
    }
    if (filters?.page_token) {
      params.append('page_token', filters.page_token);
    }

    try {
      const response = await axios.get(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });

      // Extract pagination info from response
      const data = response.data;
      const hasNextPage = data.next_page_token ? true : false;
      const campaignCount = data.campaigns ? data.campaigns.length : 0;
      
      let responseText = JSON.stringify(data, null, 2);
      
      // Add pagination summary at the top
      if (hasNextPage || filters?.page_token) {
        responseText = `📄 Pagination Info:
- Campaigns returned: ${campaignCount}
- Has next page: ${hasNextPage ? 'Yes' : 'No'}
${hasNextPage ? `- Next page token: ${data.next_page_token}` : ''}
${filters?.page_token ? `- Current page token: ${filters.page_token}` : ''}

📊 Campaign Data:
${responseText}`;
      }

      return {
        content: [
          {
            type: 'text',
            text: responseText,
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

  private async getAdGroups(args: any) {
    const authToken = this.getAuthToken(args.auth_token);
    const adAccountId = AdAccountIdSchema.parse(args.ad_account_id);
    const campaignId = CampaignIdSchema.parse(args.campaign_id);
    const filters = AdGroupFiltersSchema.parse(args.filters);

    const url = `${UBER_ADS_API_BASE_URL}/${adAccountId}/campaigns/${campaignId}/ad-groups`;
    const params = new URLSearchParams();

    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.page_limit) {
      params.append('page_limit', filters.page_limit.toString());
    }
    if (filters?.page_token) {
      params.append('page_token', filters.page_token);
    }

    try {
      const response = await axios.get(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });

      // Extract pagination info from response
      const data = response.data;
      const hasNextPage = data.next_page_token ? true : false;
      const adGroupCount = data.adgroups ? data.adgroups.length : (data.ad_groups ? data.ad_groups.length : 0);
      
      let responseText = JSON.stringify(data, null, 2);
      
      // Add pagination summary at the top
      if (hasNextPage || filters?.page_token) {
        responseText = `📄 Pagination Info:
- Ad groups returned: ${adGroupCount}
- Has next page: ${hasNextPage ? 'Yes' : 'No'}
${hasNextPage ? `- Next page token: ${data.next_page_token}` : ''}
${filters?.page_token ? `- Current page token: ${filters.page_token}` : ''}
- Campaign ID: ${campaignId}

📊 Ad Groups Data:
${responseText}`;
      }

      return {
        content: [
          {
            type: 'text',
            text: responseText,
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

  private async generateReport(args: any) {
    const authToken = this.getAuthToken(args.auth_token);
    const adAccountId = AdAccountIdSchema.parse(args.ad_account_id);
    const reportData = ReportRequestSchema.parse(args.report_data);

    const url = `${UBER_ADS_API_BASE_URL}/${adAccountId}/reporting/report`;

    try {
      // Step 1: Generate the report
      const response = await axios.post(url, reportData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const reportId = response.data.report_id;
      if (!reportId) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: No report ID returned from API',
            },
          ],
          isError: true,
        };
      }

      // Step 2: Poll for report status until CSV is ready
      const pollResult = await this.pollReportStatus(authToken, adAccountId, reportId);

      if (pollResult.success) {
        // Step 3: Fetch the CSV data from the download URL
        const csvResult = await this.fetchCsvData(pollResult.download_url);
        
        const responseData: any = {
          report_id: reportId,
          status: 'COMPLETED',
          download_url: pollResult.download_url,
          report_schema: pollResult.report_schema,
          file_size: pollResult.file_size,
          url_expires_at: pollResult.url_expires_at,
          message: pollResult.message,
          schema_info: {
            description: "The CSV file has no headers. Use the report_schema array to understand column meanings.",
            columns: pollResult.report_schema
          },
          full_response: pollResult.data
        };

        if (csvResult.success) {
          responseData.csv_data = csvResult.data;
          responseData.csv_fetch_status = 'SUCCESS';
        } else {
          responseData.csv_fetch_status = 'FAILED';
          responseData.csv_fetch_error = csvResult.error;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(responseData, null, 2),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                report_id: reportId,
                status: 'FAILED',
                message: pollResult.message,
                full_response: pollResult.data || null
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  private async fetchCsvData(downloadUrl: string): Promise<{success: boolean, data?: string, error?: string}> {
    try {
      const response = await axios.get(downloadUrl, {
        headers: {
          'Accept': 'text/csv',
        },
        timeout: 30000, // 30 second timeout for CSV download
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error) 
        ? `Failed to fetch CSV: HTTP ${error.response?.status} ${error.response?.statusText}`
        : `Failed to fetch CSV: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private async pollReportStatus(authToken: string, adAccountId: string, reportId: string): Promise<any> {
    const url = `${UBER_ADS_API_BASE_URL}/${adAccountId}/reporting/${reportId}`;
    const maxAttempts = 60; // 5 minutes max (60 attempts * 5 seconds)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json',
          },
        });

        const status = response.data.status;

        // If report is ready and has a download URL, return it
        if (status === 'COMPLETED' && response.data.result?.success_result?.report_url) {
          return {
            success: true,
            data: response.data,
            download_url: response.data.result.success_result.report_url,
            report_schema: response.data.result.success_result.report_schema || [],
            file_size: response.data.result.success_result.file_size,
            url_expires_at: response.data.result.success_result.url_expires_at,
            message: `Report completed successfully. CSV available at: ${response.data.result.success_result.report_url}`
          };
        }

        // If report failed, return error
        if (status === 'FAILED') {
          return {
            success: false,
            data: response.data,
            message: 'Report generation failed'
          };
        }

        // If still processing, wait and try again
        if (status === 'PROCESSING' || status === 'PENDING') {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          continue;
        }

        // Unknown status
        return {
          success: false,
          data: response.data,
          message: `Unknown report status: ${status}`
        };

      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }

    return {
      success: false,
      message: 'Report polling timeout after 5 minutes'
    };
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