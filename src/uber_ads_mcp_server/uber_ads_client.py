"""Uber Ads API client."""

import requests
from typing import List, Optional, Dict, Any
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import logging

from .types import (
    UberAdsConfig,
    AdAccount,
    Campaign,
    CampaignStats,
    GetCampaignsOptions,
    UberAdsApiResponse,
)

logger = logging.getLogger(__name__)


class UberAdsAPIError(Exception):
    """Custom exception for Uber Ads API errors."""
    
    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class UberAdsClient:
    """Client for interacting with Uber Ads API."""
    
    def __init__(self, config: UberAdsConfig):
        """Initialize the Uber Ads client.
        
        Args:
            config: Configuration object with API credentials
        """
        self.config = config
        # Hardcoded token from the user's curl example
        self.access_token = "IA.AQAAAATlHYAkrhJsBvg2h_K7dmXYDF_9LQAe8gEiCkd7Wyd79AB36AmskjmnMMPtDOwrWBgnGuHNb0Esrh2dScncw8weNgx5kjMNtxP88XJSdDzjfdOmcWe3Zvc0rHx-p5ldHqmXvDvUnjndiPqXigz_yg332ek6b_dmR-1KRus"
        
        # Set up requests session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Set default headers
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {self.access_token}",
        })
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request to Uber Ads API.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            **kwargs: Additional arguments for requests
            
        Returns:
            JSON response data
            
        Raises:
            UberAdsAPIError: If API request fails
        """
        url = f"{self.config.base_url}{endpoint}"
        
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            response.raise_for_status()
            
            # Handle empty responses
            if not response.content:
                return {}
                
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response else None
            try:
                error_data = e.response.json() if e.response else {}
                error_message = error_data.get("error", {}).get("message", str(e))
            except:
                error_message = str(e)
            
            raise UberAdsAPIError(
                f"Uber Ads API error: {error_message}",
                status_code=status_code
            )
        except requests.exceptions.RequestException as e:
            raise UberAdsAPIError(f"Request error: {str(e)}")
    
    def get_ad_accounts(self) -> List[AdAccount]:
        """Retrieve all ad accounts for the authenticated user.
        
        Returns:
            List of ad accounts
            
        Raises:
            UberAdsAPIError: If API request fails
        """
        try:
            response_data = self._make_request("GET", "/v1/ads")
            
            # Handle different response formats
            data = response_data.get("data", response_data)
            if isinstance(data, list):
                return [AdAccount(**account) for account in data]
            else:
                # If single account, wrap in list
                return [AdAccount(**data)]
                
        except Exception as e:
            logger.error(f"Failed to retrieve ad accounts: {e}")
            raise UberAdsAPIError(f"Failed to retrieve ad accounts: {str(e)}")
    
    def get_campaigns(
        self, 
        ad_account_id: str, 
        options: Optional[GetCampaignsOptions] = None
    ) -> List[Campaign]:
        """Retrieve campaigns for a specific ad account.
        
        Args:
            ad_account_id: ID of the ad account
            options: Optional filtering and pagination options
            
        Returns:
            List of campaigns
            
        Raises:
            UberAdsAPIError: If API request fails
        """
        if options is None:
            options = GetCampaignsOptions()
        
        # Build query parameters
        params = {}
        if options.limit:
            params["limit"] = options.limit
        if options.offset:
            params["offset"] = options.offset
        if options.status:
            params["status"] = options.status
        if options.sort_by:
            params["sort_by"] = options.sort_by
        if options.sort_order:
            params["sort_order"] = options.sort_order
        
        try:
            response_data = self._make_request(
                "GET", 
                f"/v1/ads/{ad_account_id}/campaigns",
                params=params
            )
            
            # Handle different response formats
            data = response_data.get("data", response_data)
            if isinstance(data, list):
                return [Campaign(**campaign) for campaign in data]
            else:
                # If single campaign, wrap in list
                return [Campaign(**data)]
                
        except Exception as e:
            logger.error(f"Failed to retrieve campaigns: {e}")
            raise UberAdsAPIError(f"Failed to retrieve campaigns: {str(e)}")
    
    def get_campaign_details(self, ad_account_id: str, campaign_id: str) -> Campaign:
        """Get detailed information about a specific campaign.
        
        Args:
            ad_account_id: ID of the ad account
            campaign_id: ID of the campaign
            
        Returns:
            Campaign details
            
        Raises:
            UberAdsAPIError: If API request fails
        """
        try:
            response_data = self._make_request(
                "GET",
                f"/v1/ads/{ad_account_id}/campaigns/{campaign_id}"
            )
            
            # Handle different response formats
            data = response_data.get("data", response_data)
            return Campaign(**data)
            
        except Exception as e:
            logger.error(f"Failed to retrieve campaign details: {e}")
            raise UberAdsAPIError(f"Failed to retrieve campaign details: {str(e)}")
    
    def get_campaign_stats(
        self,
        ad_account_id: str,
        campaign_ids: List[str],
        start_date: str,
        end_date: str,
        metrics: Optional[List[str]] = None
    ) -> List[CampaignStats]:
        """Retrieve performance statistics for campaigns.
        
        Args:
            ad_account_id: ID of the ad account
            campaign_ids: List of campaign IDs
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            metrics: Optional list of metrics to retrieve
            
        Returns:
            List of campaign statistics
            
        Raises:
            UberAdsAPIError: If API request fails
        """
        # Build query parameters
        params = {
            "start_date": start_date,
            "end_date": end_date,
        }
        
        # Add campaign IDs
        for campaign_id in campaign_ids:
            params.setdefault("campaign_ids", []).append(campaign_id)
        
        # Add metrics if specified
        if metrics:
            for metric in metrics:
                params.setdefault("metrics", []).append(metric)
        
        try:
            response_data = self._make_request(
                "GET",
                f"/v1/ads/{ad_account_id}/reports/campaigns",
                params=params
            )
            
            # Handle different response formats
            data = response_data.get("data", response_data)
            if isinstance(data, list):
                return [CampaignStats(**stats) for stats in data]
            else:
                # If single stats object, wrap in list
                return [CampaignStats(**data)]
                
        except Exception as e:
            logger.error(f"Failed to retrieve campaign stats: {e}")
            raise UberAdsAPIError(f"Failed to retrieve campaign stats: {str(e)}")
    
    # Utility methods
    def get_campaigns_by_status(
        self, 
        ad_account_id: str, 
        status: str
    ) -> List[Campaign]:
        """Get campaigns filtered by status.
        
        Args:
            ad_account_id: ID of the ad account
            status: Campaign status to filter by
            
        Returns:
            List of campaigns with the specified status
        """
        options = GetCampaignsOptions(status=status)
        return self.get_campaigns(ad_account_id, options)
    
    def get_active_campaigns(self, ad_account_id: str) -> List[Campaign]:
        """Get all active campaigns for an ad account."""
        return self.get_campaigns_by_status(ad_account_id, "ACTIVE")
    
    def get_paused_campaigns(self, ad_account_id: str) -> List[Campaign]:
        """Get all paused campaigns for an ad account."""
        return self.get_campaigns_by_status(ad_account_id, "PAUSED")
    
    def get_archived_campaigns(self, ad_account_id: str) -> List[Campaign]:
        """Get all archived campaigns for an ad account."""
        return self.get_campaigns_by_status(ad_account_id, "ARCHIVED")
