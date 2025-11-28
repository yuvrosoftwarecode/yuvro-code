from rest_framework import serializers
from .models import Contest

class ContestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contest
        fields = [
            'id', 'title', 'organizer', 'type', 'status', 'start_date', 'end_date',
            'duration', 'prize', 'difficulty', 'description', 'participants_count',
            'created_by', 'created_at', 'updated_at',
        ]
        
        read_only = ['id', 'participants_count', 'created_by', 'created_at', 'updated_at']