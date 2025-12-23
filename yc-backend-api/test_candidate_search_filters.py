#!/usr/bin/env python
"""
Test script for candidate search filters
Tests all filter combinations to ensure they work correctly
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/api/auth/login/"
SEARCH_URL = f"{BASE_URL}/api/jobs/candidates/job-profiles/search/"

# Login credentials
CREDENTIALS = {
    "email": "admin@yuvro.com",
    "password": "admin123"
}

def get_auth_token():
    """Get authentication token"""
    response = requests.post(LOGIN_URL, json=CREDENTIALS)
    if response.status_code == 200:
        return response.json()['access']
    else:
        raise Exception(f"Login failed: {response.text}")

def test_search(token, filters, test_name):
    """Test search with given filters"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(SEARCH_URL, json=filters, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ {test_name}")
        print(f"   Total candidates: {data['total_count']}")
        print(f"   Applied filters: {json.dumps(data.get('applied_filters', {}), indent=6)}")
        if data['candidates']:
            print(f"   Sample candidate: {data['candidates'][0]['full_name']}")
        return data
    else:
        print(f"\n❌ {test_name}")
        print(f"   Error: {response.text}")
        return None

def main():
    print("=" * 80)
    print("CANDIDATE SEARCH FILTER TESTS")
    print("=" * 80)
    
