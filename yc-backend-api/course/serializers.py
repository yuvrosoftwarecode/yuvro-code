from rest_framework import serializers

from .models import Course, Topic, Subtopic, Video, Quiz, CodingProblem, Note
from authentication.serializers import UserSerializer
from django.contrib.auth import get_user_model
User = get_user_model()


class SubtopicSerializer(serializers.ModelSerializer):
    """
    Serializer for Subtopic model.
    """
    class Meta:
        model = Subtopic
        fields = ['id', 'topic', 'name', 'content', 'order_index', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_video_url(self, value):
        """
        Validate video URL format if provided.
        """
        if value and not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("Video URL must start with http:// or https://")
        return value


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
    topics = TopicSerializer(many=True, read_only=True)
    # Full details for GET (retrieve)
    assigned_admin_id = UserSerializer(read_only=True)

    assigned_admin_id = serializers.PrimaryKeyRelatedField(
    queryset=User.objects.all(),
    source='assigned_admin',
    write_only=True,
    required=False,
    allow_null=True,
)



    class Meta:
        model = Course
        fields = [
            "id",
            "short_code",
            "name",
            "category",
            "created_at",
            "updated_at",
            "topics",
            "assigned_admin",
            "assigned_admin_id",
        ]
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
    assigned_admin = UserSerializer(read_only=True)

    assigned_admin_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="assigned_admin",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Course
        fields = [
            "id",
            "short_code",
            "name",
            "category",
            "created_at",
            "updated_at",
            "assigned_admin",
            "assigned_admin_id",
        ]



class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ["id", "sub_topic", "title", "video_link", "ai_context", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            "id",
            "sub_topic",
            "question",
            "options",
            "correct_answer_index",
            "created_at",
            "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        options = data.get("options")
        index = data.get("correct_answer_index")

        if not isinstance(options, list) or len(options) < 2:
            raise serializers.ValidationError("Quiz must have at least 2 options.")

        if index >= len(options) or index < 0:
            raise serializers.ValidationError("Correct answer index is out of range.")

        return data
    
class CodingProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingProblem
        fields = [
            "id",
            "sub_topic",
            "title",
            "description",
            "test_cases",
            "created_at",
            "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
    def validate(self, data):
        test_cases = data.get("test_cases")

        if not isinstance(test_cases, list) or len(test_cases) == 0:
            raise serializers.ValidationError("There must be at least one test case.")

        for case in test_cases:
            if "input" not in case or "expected_output" not in case:
                raise serializers.ValidationError("Each test case must have 'input' and 'expected_output' fields.")

        return data

class NoteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Note
        fields = ['id', 'sub_topic', 'user', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty.")
        return value
