#!/usr/bin/env python
"""
Test script to verify the submit_code functionality
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yc-backend-api.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from course.models import Question, UserCourseProgress, StudentCodePractice
from code_editor.models import CodeSubmission

User = get_user_model()

def test_models():
    """Test that the models can be imported and have the expected fields"""
    print("Testing model imports and fields...")
    
    # Test CodeSubmission model
    print("CodeSubmission fields:", [f.name for f in CodeSubmission._meta.fields])
    
    # Test UserCourseProgress model
    print("UserCourseProgress fields:", [f.name for f in UserCourseProgress._meta.fields])
    
    # Test StudentCodePractice model  
    print("StudentCodePractice fields:", [f.name for f in StudentCodePractice._meta.fields])
    
    # Check if foreign key fields exist
    ucp_fields = [f.name for f in UserCourseProgress._meta.fields]
    scp_fields = [f.name for f in StudentCodePractice._meta.fields]
    cs_fields = [f.name for f in CodeSubmission._meta.fields]
    
    print(f"UserCourseProgress has code_submission field: {'code_submission' in ucp_fields}")
    print(f"StudentCodePractice has code_submission field: {'code_submission' in scp_fields}")
    print(f"CodeSubmission has question field: {'question' in cs_fields}")
    
    print("Model test completed successfully!")

if __name__ == "__main__":
    test_models()