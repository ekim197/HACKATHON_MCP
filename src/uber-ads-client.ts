import axios, { AxiosInstance, AxiosResponse } from "axios";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  UberAdsConfig,
  AdAccount,
  Campaign,
  CampaignStats,
  GetCampaignsOptions,
  CampaignStatus,
  MetricType,
  OAuthTokenResponse,
} from "./types.js";

export class UberAdsClient {
  private client: AxiosInstance;
  private accessToken: string = "IA.AQAAAATlHYAkrhJsBvg2h_K7dmXYDF_9LQAe8gEiCkd7Wyd79AB36AmskjmnMMPtDOwrWBgnGuHNb0Esrh2dScncw8weNgx5kjMNtxP88XJSdDzjfdOmcWe3Zvc0rHx-p5ldHqmXvDvUnjndiPqXigz_yg332ek6b_dmR-1KRus";
  private tokenExpiry: Date | null = null;

  constructor(private config: UberAdsConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to handle authentication with hardcoded token
    this.client.interceptors.request.use(async (config) => {
      config.headers.Authorization = `Bearer ${this.accessToken}`;
      return config;
    });

    // Add response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          throw new McpError(
            this.mapHttpStatusToErrorCode(status),
            `Uber Ads API error: ${data.message || data.error || error.message}`
          );
        } else if (error.request) {
          throw new McpError(
            ErrorCode.InternalError,
            "Network error: Unable to reach Uber Ads API"
          );
        } else {
          throw new McpError(
            ErrorCode.InternalError,
            `Request error: ${error.message}`
          );
        }
      }
    );
  }

  private mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ErrorCode.InvalidParams;
      case 401:
        return ErrorCode.InvalidRequest;
      case 403:
        return ErrorCode.InvalidRequest;
      case 404:
        return ErrorCode.InvalidRequest;
      case 429:
        return ErrorCode.InternalError;
      default:
        return ErrorCode.InternalError;
    }
  }

  // Using hardcoded token - no need for token refresh methods

  async getAdAccounts(): Promise<AdAccount[]> {
    try {
      const response: AxiosResponse = await this.client.get("/v1/ads");
      return response.data.data || response.data;
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to retrieve ad accounts: ${error}`
      );
    }
  }

  async getCampaigns(
    adAccountId: string,
    options: GetCampaignsOptions = {}
  ): Promise<Campaign[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) {
        params.append("limit", options.limit.toString());
      }
      
      if (options.offset) {
        params.append("offset", options.offset.toString());
      }
      
      if (options.status) {
        params.append("status", options.status);
      }

      const queryString = params.toString();
      const url = `/v1/ads/${adAccountId}/campaigns${
        queryString ? `?${queryString}` : ""
      }`;

      const response: AxiosResponse = await this.client.get(url);
      return response.data.data || response.data;
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to retrieve campaigns: ${error}`
      );
    }
  }

  async getCampaignDetails(
    adAccountId: string,
    campaignId: string
  ): Promise<Campaign> {
    try {
      const response: AxiosResponse = await this.client.get(
        `/v1/ads/${adAccountId}/campaigns/${campaignId}`
      );
      return response.data.data || response.data;
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to retrieve campaign details: ${error}`
      );
    }
  }

  async getCampaignStats(
    adAccountId: string,
    campaignIds: string[],
    startDate: string,
    endDate: string,
    metrics?: string[]
  ): Promise<CampaignStats[]> {
    try {
      const params = new URLSearchParams();
      params.append("start_date", startDate);
      params.append("end_date", endDate);
      
      campaignIds.forEach((id) => {
        params.append("campaign_ids", id);
      });

      if (metrics && metrics.length > 0) {
        metrics.forEach((metric) => {
          params.append("metrics", metric);
        });
      }

      const response: AxiosResponse = await this.client.get(
        `/v1/ads/${adAccountId}/reports/campaigns?${params.toString()}`
      );
      
      return response.data.data || response.data;
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to retrieve campaign stats: ${error}`
      );
    }
  }

  // Additional utility methods
  async getCampaignsByStatus(
    adAccountId: string,
    status: CampaignStatus
  ): Promise<Campaign[]> {
    return this.getCampaigns(adAccountId, { status });
  }

  async getActiveCampaigns(adAccountId: string): Promise<Campaign[]> {
    return this.getCampaignsByStatus(adAccountId, "ACTIVE");
  }

  async getPausedCampaigns(adAccountId: string): Promise<Campaign[]> {
    return this.getCampaignsByStatus(adAccountId, "PAUSED");
  }

  async getArchivedCampaigns(adAccountId: string): Promise<Campaign[]> {
    return this.getCampaignsByStatus(adAccountId, "ARCHIVED");
  }
}
