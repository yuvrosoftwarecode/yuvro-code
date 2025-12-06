from rest_framework import serializers

from .models import (
    Course,
    Topic,
    Subtopic,
    Video,
    Note,
    CourseInstructor,
    Question,
)
from authentication.serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class SubtopicSerializer(serializers.ModelSerializer):
    """
    Serializer for Subtopic model.
    """

    class Meta:
        model = Subtopic
        fields = ["id", "topic", "name", "content", "order_index", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_video_url(self, value):
        """
        Validate video URL format if provided.
        """
        if value and not value.startswith(("http://", "https://")):
            raise serializers.ValidationError(
                "Video URL must start with http:// or https://"
            )
        return value


class TopicSerializer(serializers.ModelSerializer):
    """
    Serializer for Topic model with optional nested subtopics.
    """

    subtopics = SubtopicSerializer(many=True, read_only=True)

    class Meta:
        model = Topic
        fields = ["id", "course", "name", "order_index", "created_at", "subtopics"]
        read_only_fields = ["id", "created_at"]


class TopicBasicSerializer(serializers.ModelSerializer):
    """
    Basic serializer for Topic model without nested subtopics.
    """

    class Meta:
        model = Topic
        fields = ["id", "course", "name", "order_index", "created_at"]
        read_only_fields = ["id", "created_at"]


class CourseInstructorSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)

    class Meta:
        model = CourseInstructor
        fields = ["id", "instructor", "created_at"]


class CourseSerializer(serializers.ModelSerializer):
    """
    Serializer for Course model with optional nested topics.
    """

    topics = TopicSerializer(many=True, read_only=True)
    instructors = serializers.SerializerMethodField()

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
            "instructors",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_instructors(self, obj):
        mappings = CourseInstructor.objects.filter(course=obj).select_related(
            "instructor"
        )
        return CourseInstructorSerializer(mappings, many=True).data

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
                raise serializers.ValidationError(
                    "A course with this short code already exists."
                )
        return value

    def validate_category(self, value):
        """
        Validate category is one of the allowed choices.
        """
        valid_categories = [choice[0] for choice in Course.CATEGORY_CHOICES]
        if value not in valid_categories:
            raise serializers.ValidationError(
                f"Category must be one of: {', '.join(valid_categories)}"
            )
        return value


class CourseBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "id",
            "short_code",
            "name",
            "category",
            "created_at",
            "updated_at",
        ]


class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = [
            "id",
            "sub_topic",
            "title",
            "video_link",
            "ai_context",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]





class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "sub_topic", "user", "content", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "user"]

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty.")
        return value


class QuestionSerializer(serializers.ModelSerializer):
    """
    Serializer for Question model - supports MCQ, Coding, and Descriptive questions
    """
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Question
        fields = [
            "id",
            "type",
            "title", 
            "content",
            "level",
            "course",
            "topic", 
            "subtopic",
            "difficulty",
            "marks",
            "categories",
            "mcq_options",
            "mcq_correct_answer_index",
            "test_cases_basic",
            "test_cases_advanced",
            "created_at",
            "updated_at",
            "created_by",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by"]

    def validate(self, data):
        """
        Validate question data based on type and level
        """
        question_type = data.get("type")
        level = data.get("level")
        
        # Validate level associations
        if level == "course" and not data.get("course"):
            raise serializers.ValidationError("Course is required for course-level questions")
        if level == "topic" and not data.get("topic"):
            raise serializers.ValidationError("Topic is required for topic-level questions")
        if level == "subtopic" and not data.get("subtopic"):
            raise serializers.ValidationError("Subtopic is required for subtopic-level questions")
            
        # Validate categories
        categories = data.get("categories", [])
        if categories:
            valid_categories = [choice[0] for choice in Question.QUESTION_CATEGORIES]
            for category in categories:
                if category not in valid_categories:
                    raise serializers.ValidationError(f"Invalid category: {category}")
        
        # Validate MCQ specific fields
        if question_type == "mcq":
            mcq_options = data.get("mcq_options")
            mcq_correct_answer_index = data.get("mcq_correct_answer_index")
            
            if not mcq_options or not isinstance(mcq_options, list) or len(mcq_options) < 2:
                raise serializers.ValidationError("MCQ questions must have at least 2 options")
                
            # Filter out empty options
            valid_options = [opt for opt in mcq_options if opt and opt.strip()]
            if len(valid_options) < 2:
                raise serializers.ValidationError("MCQ questions must have at least 2 non-empty options")
                
            if mcq_correct_answer_index is None:
                raise serializers.ValidationError("MCQ questions must have a correct answer index")
                
            # Validate correct answer index
            if mcq_correct_answer_index < 0 or mcq_correct_answer_index >= len(valid_options):
                raise serializers.ValidationError("MCQ correct answer index is out of range")
                    
        # Validate coding specific fields
        if question_type == "coding":
            test_cases_basic = data.get("test_cases_basic")
            if not test_cases_basic or not isinstance(test_cases_basic, list) or len(test_cases_basic) == 0:
                raise serializers.ValidationError("Coding questions must have at least 1 basic test case")
                
            # Validate basic test case structure
            for i, test_case in enumerate(test_cases_basic):
                if not isinstance(test_case, dict):
                    raise serializers.ValidationError(f"Basic test case {i+1} must be an object")
                if "input" not in test_case or "expected_output" not in test_case:
                    raise serializers.ValidationError(f"Basic test case {i+1} must have 'input' and 'expected_output' fields")
                    
            # Validate advanced test cases if provided
            test_cases_advanced = data.get("test_cases_advanced", [])
            if test_cases_advanced:
                for i, test_case in enumerate(test_cases_advanced):
                    if not isinstance(test_case, dict):
                        raise serializers.ValidationError(f"Advanced test case {i+1} must be an object")
                    if "input" not in test_case or "expected_output" not in test_case:
                        raise serializers.ValidationError(f"Advanced test case {i+1} must have 'input' and 'expected_output' fields")
                    
        return data

    def create(self, validated_data):
        # Set the created_by field to the current user
        validated_data['created_by'] = self.context['request'].user
        
        # Auto-populate related fields based on question level
        level = validated_data.get('level')
        
        if level == 'subtopic' and 'subtopic' in validated_data:
            # If subtopic level, populate topic and course from subtopic
            subtopic = validated_data['subtopic']
            if subtopic:
                validated_data['topic'] = subtopic.topic
                validated_data['course'] = subtopic.topic.course
                
        elif level == 'topic' and 'topic' in validated_data:
            # If topic level, populate course from topic
            topic = validated_data['topic']
            if topic:
                validated_data['course'] = topic.course
                
        # For course level, course is already set
        
        return super().create(validated_data)
