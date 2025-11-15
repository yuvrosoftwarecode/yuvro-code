from rest_framework import serializers
from .models import Course, Topic, Subtopic, CodingProblem


class SubtopicSerializer(serializers.ModelSerializer):
    """
    Serializer for Subtopic model.
    """
    class Meta:
        model = Subtopic
        fields = ['id', 'topic', 'name', 'content', 'order_index', 'created_at']
        read_only_fields = ['id', 'created_at']


class TopicSerializer(serializers.ModelSerializer):
    """
    Serializer for Topic model with optional nested subtopics.
    """
    subtopics = SubtopicSerializer(many=True, read_only=True)

    class Meta:
        model = Topic
        fields = ['id', 'course', 'name', 'order_index', 'created_at', 'subtopics']
        read_only_fields = ['id', 'created_at']


class TopicBasicSerializer(serializers.ModelSerializer):
    """
    Basic serializer for Topic model without nested subtopics.
    """
    class Meta:
        model = Topic
        fields = ['id', 'course', 'name', 'order_index', 'created_at']
        read_only_fields = ['id', 'created_at']


class CourseSerializer(serializers.ModelSerializer):
    """
    Serializer for Course model with optional nested topics.
    """
    topics = TopicBasicSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'short_code', 'name', 'category', 'created_at', 'updated_at', 'topics']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_short_code(self, value):
        """
        Validate short_code uniqueness if provided.
        """
        if value:
            # Check if another course with this short_code exists (excluding current instance)
            queryset = Course.objects.filter(short_code=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError("A course with this short code already exists.")
        return value

    def validate_category(self, value):
        """
        Validate category is one of the allowed choices.
        """
        valid_categories = [choice[0] for choice in Course.CATEGORY_CHOICES]
        if value not in valid_categories:
            raise serializers.ValidationError(f"Category must be one of: {', '.join(valid_categories)}")
        return value


class CourseBasicSerializer(serializers.ModelSerializer):
    """
    Basic serializer for Course model without nested topics.
    """
    class Meta:
        model = Course
        fields = ['id', 'short_code', 'name', 'category', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        
class CodingProblemSerializer(serializers.ModelSerializer):
    """
    Serializer for CodingProblem model.
    """
    class Meta:
        model = CodingProblem
        fields = [
            'id',
            'sub_topic',
            'title',
            'description',
            'input',
            'test_cases',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
