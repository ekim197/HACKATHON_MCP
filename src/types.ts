// Uber Ads API Types

export interface UberAdsConfig {
  clientId?: string;
  clientSecret?: string;
  baseUrl: string;
}

export interface AdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  objective: string;
  budget_type: BudgetType;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  targeting?: CampaignTargeting;
  creative_specs?: CreativeSpec[];
}

export interface CampaignTargeting {
  locations?: LocationTargeting[];
  demographics?: DemographicTargeting;
  interests?: string[];
  behaviors?: string[];
}

export interface LocationTargeting {
  type: "city" | "region" | "country" | "postal_code";
  value: string;
  radius?: number;
}

export interface DemographicTargeting {
  age_min?: number;
  age_max?: number;
  genders?: ("male" | "female" | "all")[];
}

export interface CreativeSpec {
  id: string;
  name: string;
  type: "image" | "video" | "carousel";
  assets: CreativeAsset[];
}

export interface CreativeAsset {
  id: string;
  type: "image" | "video" | "text";
  url?: string;
  text?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface CampaignStats {
  campaign_id: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpm: number;
  cpc: number;
  conversion_rate: number;
  date_range: {
    start_date: string;
    end_date: string;
  };
  breakdown?: {
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  }[];
}

export interface GetCampaignsOptions {
  limit?: number;
  offset?: number;
  status?: CampaignStatus;
  objective?: CampaignObjective;
  sort_by?: "created_at" | "updated_at" | "name" | "spend";
  sort_order?: "asc" | "desc";
}

export interface GetStatsOptions {
  metrics?: MetricType[];
  breakdown?: "date" | "campaign" | "creative";
  time_increment?: "day" | "week" | "month";
}

// Enums
export type CampaignStatus = "ACTIVE" | "PAUSED" | "ARCHIVED" | "DRAFT";

export type BudgetType = "DAILY" | "LIFETIME";

export type CampaignObjective = 
  | "BRAND_AWARENESS"
  | "REACH"
  | "TRAFFIC"
  | "ENGAGEMENT"
  | "APP_INSTALLS"
  | "VIDEO_VIEWS"
  | "LEAD_GENERATION"
  | "CONVERSIONS";

export type MetricType = 
  | "impressions"
  | "clicks"
  | "spend"
  | "conversions"
  | "ctr"
  | "cpm"
  | "cpc"
  | "conversion_rate"
  | "frequency"
  | "reach";

// API Response Types
export interface UberAdsApiResponse<T> {
  data: T;
  paging?: {
    total_count: number;
    offset: number;
    limit: number;
    has_more: boolean;
  };
  meta?: {
    request_id: string;
    api_version: string;
  };
}

export interface UberAdsApiError {
  error: {
    code: number;
    message: string;
    type: string;
    details?: any;
  };
}

// OAuth Types
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface OAuthError {
  error: string;
  error_description: string;
}

// MCP Tool Argument Types
export interface GetCampaignsArgs {
  ad_account_id: string;
  limit?: number;
  offset?: number;
  status?: CampaignStatus;
}

export interface GetCampaignDetailsArgs {
  ad_account_id: string;
  campaign_id: string;
}

export interface GetCampaignStatsArgs {
  ad_account_id: string;
  campaign_ids: string[];
  start_date: string;
  end_date: string;
  metrics?: MetricType[];
}
