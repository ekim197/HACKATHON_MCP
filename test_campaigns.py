#!/usr/bin/env python3
"""
Simple test script to get campaigns from Uber Ads API
"""

import urllib.request
import urllib.error
import json

def get_campaigns(ad_account_id):
    """Get campaigns for the specified ad account."""
    
    # Your hardcoded token from the curl example
    token = "IA.AQAAAATlHYAkrhJsBvg2h_K7dmXYDF_9LQAe8gEiCkd7Wyd79AB36AmskjmnMMPtDOwrWBgnGuHNb0Esrh2dScncw8weNgx5kjMNtxP88XJSdDzjfdOmcWe3Zvc0rHx-p5ldHqmXvDvUnjndiPqXigz_yg332ek6b_dmR-1KRus"
    
    # API endpoint
    url = f"https://api.uber.com/v1/ads/{ad_account_id}/campaigns"
    
    # Create request with headers
    request = urllib.request.Request(url)
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("Accept", "application/json")
    
    try:
        print(f"🚀 Making request to: {url}")
        print(f"🔑 Using token: {token[:50]}...")
        
        # Make the request
        with urllib.request.urlopen(request) as response:
            data = response.read().decode('utf-8')
            result = json.loads(data)
            
            print("✅ Success! Response received:")
            print(json.dumps(result, indent=2))
            
            # Parse campaigns if they exist
            campaigns = result.get('data', result)
            if isinstance(campaigns, list):
                print(f"\n📊 Found {len(campaigns)} campaigns:")
                for campaign in campaigns:
                    name = campaign.get('name', 'Unknown')
                    campaign_id = campaign.get('id', 'Unknown')
                    status = campaign.get('status', 'Unknown')
                    print(f"  - {name} (ID: {campaign_id}, Status: {status})")
            else:
                print("\n📊 Single campaign or different format:")
                print(f"  - {campaigns}")
                
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        error_body = e.read().decode('utf-8')
        print(f"Error details: {error_body}")
    except urllib.error.URLError as e:
        print(f"❌ URL Error: {e.reason}")
    except json.JSONDecodeError as e:
        print(f"❌ JSON Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    ad_account_id = "d924b89c-09f9-477b-a3ae-5526aa533835"
    print(f"🏢 Getting campaigns for ad account: {ad_account_id}")
    get_campaigns(ad_account_id)
