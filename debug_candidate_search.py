import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/api/auth/login/"
SEARCH_URL = f"{BASE_URL}/api/jobs/candidates/job-profiles/search/"

def get_auth_token():
    """Get authentication token"""
    login_data = {
        "email": "admin@yuvro.com",
        "password": "admin123"
    }
    
    response = requests.post(LOGIN_URL, json=login_data)
    if response.status_code == 200:
        return response.json()['access']
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return None

def test_search_filter(token, filter_data, test_name):
    """Test a specific search filter"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"\n🔍 Testing: {test_name}")
    print(f"   Filter: {json.dumps(filter_data, indent=2)}")
    
    response = requests.post(SEARCH_URL, json=filter_data, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ Result: {result['total_count']} candidates")
        
        for candidate in result['candidates']:
            name = candidate.get('full_name', 'Unknown')
            location = candidate.get('location', 'Unknown')
            experience = candidate.get('total_experience_years', 0)
            skills = ', '.join(candidate.get('skills_list', [])[:3])
            print(f"      - {name}: {location}, {experience}y, Skills: {skills}")
        
        return result
    else:
        print(f"   Error: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def main():
    print(" Starting Candidate Search Filter Debug")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        sys.exit(1)
    
    print("✅ Authentication successful")
    
    # Test cases
    test_cases = [
        {
            "name": "Basic Search (No Filters)",
            "data": {"page": 1, "page_size": 10}
        },
        {
            "name": "Skills Filter - Python",
            "data": {"skills": "Python", "page": 1, "page_size": 10}
        },
        {
            "name": "Skills Filter - JavaScript",
            "data": {"skills": "JavaScript", "page": 1, "page_size": 10}
        },
        {
            "name": "Location Filter - Delhi",
            "data": {"location": "Delhi", "page": 1, "page_size": 10}
        },
        {
            "name": "Location Filter - Hyderabad",
            "data": {"location": "Hyderabad", "page": 1, "page_size": 10}
        },
        {
            "name": "Experience Filter - 5+ years",
            "data": {"experience_from": 5, "page": 1, "page_size": 10}
        },
        {
            "name": "Experience Filter - 0-3 years",
            "data": {"experience_from": 0, "experience_to": 3, "page": 1, "page_size": 10}
        },
        {
            "name": "Combined Filter - Python + 0-5 years",
            "data": {"skills": "Python", "experience_from": 0, "experience_to": 5, "page": 1, "page_size": 10}
        },
        {
            "name": "Combined Filter - Location + Skills",
            "data": {"location": "Hyderabad", "skills": "Python", "page": 1, "page_size": 10}
        },
        {
            "name": "Empty String Filters (Frontend Issue Test)",
            "data": {
                "skills": "",
                "location": "",
                "education": "",
                "domain": "",
                "company_type": "any",
                "active_in_days": "",
                "experience_from": 0,
                "experience_to": 20,
                "ctc_from": 0,
                "ctc_to": 100,
                "notice_period": [],
                "employment_type": [],
                "page": 1,
                "page_size": 10
            }
        }
    ]
    
    # Run all test cases
    results = {}
    for test_case in test_cases:
        result = test_search_filter(token, test_case["data"], test_case["name"])
        results[test_case["name"]] = result
    
    # Summary
    print("\n" + "="*60)
    print("📊 SUMMARY")
    print("="*60)
    
    for test_name, result in results.items():
        if result:
            count = result['total_count']
            status = "✅" if count >= 0 else "❌"
            print(f"{status} {test_name}: {count} candidates")
        else:
            print(f"❌ {test_name}: FAILED")
    
    print("\n🎯 DEBUGGING RECOMMENDATIONS:")
    
    # Check if basic search works
    basic_result = results.get("Basic Search (No Filters)")
    if basic_result and basic_result['total_count'] > 0:
        print("✅ Basic search works - database has candidates")
    else:
        print("❌ Basic search failed - check database population")
    
    # Check if filters are working
    python_result = results.get("Skills Filter - Python")
    if python_result and python_result['total_count'] > 0:
        print("✅ Skills filter works")
    else:
        print("❌ Skills filter not working - check backend logic")
    
    # Check empty filter handling
    empty_result = results.get("Empty String Filters (Frontend Issue Test)")
    if empty_result and basic_result:
        if empty_result['total_count'] == basic_result['total_count']:
            print("✅ Empty filters handled correctly (returns all candidates)")
        else:
            print("❌ Empty filters not handled correctly")

if __name__ == "__main__":
    main()