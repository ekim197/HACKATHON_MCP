#!/usr/bin/env python3
"""
Clean campaign summary script
"""

import urllib.request
import json
from datetime import datetime

def format_budget(budget_info):
    """Format budget information."""
    if not budget_info:
        return "N/A"
    
    total = budget_info.get('total', {})
    amount = int(total.get('amount_e5', 0)) / 100000  # Convert from e5 format
    currency = total.get('currency_code', 'USD')
    unit = budget_info.get('unit', '').replace('BUDGET_UNIT_', '').title()
    
    return f"${amount:,.2f} {currency} ({unit})"

def format_date(date_str):
    """Format ISO date string to readable format."""
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d %H:%M:%S UTC')
    except:
        return date_str

def get_campaigns_summary(ad_account_id):
    """Get and format campaigns summary."""
    token = "IA.AQAAAATlHYAkrhJsBvg2h_K7dmXYDF_9LQAe8gEiCkd7Wyd79AB36AmskjmnMMPtDOwrWBgnGuHNb0Esrh2dScncw8weNgx5kjMNtxP88XJSdDzjfdOmcWe3Zvc0rHx-p5ldHqmXvDvUnjndiPqXigz_yg332ek6b_dmR-1KRus"
    url = f"https://api.uber.com/v1/ads/{ad_account_id}/campaigns"
    
    request = urllib.request.Request(url)
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("Accept", "application/json")
    
    with urllib.request.urlopen(request) as response:
        data = json.loads(response.read().decode('utf-8'))
        
    campaigns = data.get('campaigns', [])
    
    print("=" * 80)
    print(f"🏢 AD ACCOUNT: {ad_account_id}")
    print(f"📊 CAMPAIGNS FOUND: {len(campaigns)}")
    print("=" * 80)
    
    for i, campaign in enumerate(campaigns, 1):
        print(f"\n📋 CAMPAIGN {i}:")
        print(f"   Name: {campaign.get('name', 'Unknown')}")
        print(f"   ID: {campaign.get('campaign_id', 'Unknown')}")
        print(f"   Status: {campaign.get('configured_status', 'Unknown').replace('CAMPAIGN_CONFIGURED_STATUS_', '')}")
        print(f"   Effective Status: {campaign.get('effective_status', 'Unknown').replace('CAMPAIGN_EFFECTIVE_STATUS_', '')}")
        print(f"   Budget: {format_budget(campaign.get('budget'))}")
        print(f"   Created: {format_date(campaign.get('created_at', ''))}")
        print(f"   Updated: {format_date(campaign.get('updated_at', ''))}")
        print(f"   Created by: {campaign.get('created_by_email', 'Unknown')}")
        
        ad_groups = campaign.get('ad_groups', [])
        print(f"   Ad Groups: {len(ad_groups)}")
        for j, ad_group in enumerate(ad_groups, 1):
            status = ad_group.get('configured_status', '').replace('AD_GROUP_CONFIGURED_STATUS_', '')
            print(f"     {j}. {ad_group.get('name', 'Unknown')} ({status})")
        
        print("-" * 60)
    
    print(f"\n✅ Successfully retrieved {len(campaigns)} campaigns!")
    return campaigns

if __name__ == "__main__":
    ad_account_id = "d924b89c-09f9-477b-a3ae-5526aa533835"
    get_campaigns_summary(ad_account_id)
