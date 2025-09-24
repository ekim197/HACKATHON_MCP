"""Type definitions for Uber Ads API."""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel
from datetime import datetime


class UberAdsConfig(BaseModel):
    """Configuration for Uber Ads client."""
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    base_url: str = "https://api.uber.com"


class AdAccount(BaseModel):
    """Ad account model."""
    id: str
    name: str
    currency: str
    timezone: str
    status: str
    created_at: str
    updated_at: str


class LocationTargeting(BaseModel):
    """Location targeting model."""
    type: Literal["city", "region", "country", "postal_code"]
    value: str
    radius: Optional[int] = None


class DemographicTargeting(BaseModel):
    """Demographic targeting model."""
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    genders: Optional[List[Literal["male", "female", "all"]]] = None


class CampaignTargeting(BaseModel):
    """Campaign targeting model."""
    locations: Optional[List[LocationTargeting]] = None
    demographics: Optional[DemographicTargeting] = None
    interests: Optional[List[str]] = None
    behaviors: Optional[List[str]] = None


class CreativeAsset(BaseModel):
    """Creative asset model."""
    id: str
    type: Literal["image", "video", "text"]
    url: Optional[str] = None
    text: Optional[str] = None
    dimensions: Optional[Dict[str, int]] = None


class CreativeSpec(BaseModel):
    """Creative specification model."""
    id: str
    name: str
    type: Literal["image", "video", "carousel"]
    assets: List[CreativeAsset]


class Campaign(BaseModel):
    """Campaign model."""
    id: str
    name: str
    status: Literal["ACTIVE", "PAUSED", "ARCHIVED", "DRAFT"]
    objective: str
    budget_type: Literal["DAILY", "LIFETIME"]
    daily_budget: Optional[float] = None
    lifetime_budget: Optional[float] = None
    start_time: str
    end_time: Optional[str] = None
    created_at: str
    updated_at: str
    targeting: Optional[CampaignTargeting] = None
    creative_specs: Optional[List[CreativeSpec]] = None


class CampaignStatsBreakdown(BaseModel):
    """Campaign stats breakdown by date."""
    date: str
    impressions: int
    clicks: int
    spend: float
    conversions: int


class CampaignStats(BaseModel):
    """Campaign statistics model."""
    campaign_id: str
    impressions: int
    clicks: int
    spend: float
    conversions: int
    ctr: float
    cpm: float
    cpc: float
    conversion_rate: float
    date_range: Dict[str, str]
    breakdown: Optional[List[CampaignStatsBreakdown]] = None


class GetCampaignsOptions(BaseModel):
    """Options for getting campaigns."""
    limit: Optional[int] = 50
    offset: Optional[int] = 0
    status: Optional[Literal["ACTIVE", "PAUSED", "ARCHIVED"]] = None
    objective: Optional[str] = None
    sort_by: Optional[Literal["created_at", "updated_at", "name", "spend"]] = None
    sort_order: Optional[Literal["asc", "desc"]] = None


class GetStatsOptions(BaseModel):
    """Options for getting statistics."""
    metrics: Optional[List[str]] = None
    breakdown: Optional[Literal["date", "campaign", "creative"]] = None
    time_increment: Optional[Literal["day", "week", "month"]] = None


# API Response Types
class UberAdsApiResponse(BaseModel):
    """Generic API response wrapper."""
    data: Any
    paging: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, str]] = None


class UberAdsApiError(BaseModel):
    """API error response."""
    error: Dict[str, Any]


class OAuthTokenResponse(BaseModel):
    """OAuth token response."""
    access_token: str
    token_type: str
    expires_in: int
    scope: str


# MCP Tool Argument Types
class GetCampaignsArgs(BaseModel):
    """Arguments for get_campaigns tool."""
    ad_account_id: str
    limit: Optional[int] = 50
    offset: Optional[int] = 0
    status: Optional[Literal["ACTIVE", "PAUSED", "ARCHIVED"]] = None


class GetCampaignDetailsArgs(BaseModel):
    """Arguments for get_campaign_details tool."""
    ad_account_id: str
    campaign_id: str


class GetCampaignStatsArgs(BaseModel):
    """Arguments for get_campaign_stats tool."""
    ad_account_id: str
    campaign_ids: List[str]
    start_date: str
    end_date: str
    metrics: Optional[List[str]] = None
