from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    company_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = "__all__"
    
    def get_company_info(self, obj):
        """Return properly formatted company info with all required fields."""
        return obj.get_company_info()
