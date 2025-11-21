from rest_framework import serializers

from .models import Course, Topic, Subtopic, Video, Quiz, CodingProblem, Note, CourseInstructor
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
        mappings = CourseInstructor.objects.filter(course=obj).select_related("instructor")
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


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            "id",
            "category",
            "topic",
            "sub_topic",
            "question",
            "options",
            "correct_answer_index",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        category = data.get("category")
        topic = data.get("topic")
        sub_topic = data.get("sub_topic")
        options = data.get("options")
        index = data.get("correct_answer_index")

        # ---- OPTION VALIDATIONS ----
        if not isinstance(options, list) or len(options) < 2:
            raise serializers.ValidationError("Quiz must have at least 2 options.")

        if index >= len(options) or index < 0:
            raise serializers.ValidationError("Correct answer index is out of range.")

        # ---- CATEGORY MAPPING VALIDATION ----
        if category == "learn_certify":
            if not sub_topic:
                raise serializers.ValidationError(
                    "Learn & Certify quizzes must be linked to a Subtopic."
                )
            if topic:
                raise serializers.ValidationError(
                    "Learn & Certify quizzes cannot be linked to a Topic."
                )

        if category in ["practice", "skill_test"]:
            if not topic:
                raise serializers.ValidationError(
                    "Practice/Skill Test quizzes must be linked to a Topic."
                )
            if sub_topic:
                raise serializers.ValidationError(
                    "Practice/Skill Test quizzes cannot be linked to a Subtopic."
                )

        return data



class CodingProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingProblem
        fields = [
            "id",
            "category",
            "topic",
            "sub_topic",
            "title",
            "description",
            "test_cases_basic",
            "test_cases_advanced",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        category = data.get("category")
        topic = data.get("topic")
        sub_topic = data.get("sub_topic")

        test_cases_basic = data.get("test_cases_basic")
        test_cases_advanced = data.get("test_cases_advanced", [])

        # ---- TEST CASE VALIDATION ----
        if not isinstance(test_cases_basic, list) or len(test_cases_basic) == 0:
            raise serializers.ValidationError(
                "There must be at least one basic test case."
            )

        # Validate basic test cases
        for case in test_cases_basic:
            if "input_data" not in case or "expected_output" not in case:
                raise serializers.ValidationError(
                    "Each basic test case must have 'input_data' and 'expected_output' fields."
                )

        # Validate advanced test cases if provided
        if test_cases_advanced:
            for case in test_cases_advanced:
                if "input_data" not in case or "expected_output" not in case:
                    raise serializers.ValidationError(
                        "Each advanced test case must have 'input_data' and 'expected_output' fields."
                    )

        # ---- CATEGORY MAPPING VALIDATION ----
        if category == "learn_certify":
            if not sub_topic:
                raise serializers.ValidationError(
                    "Learn & Certify coding problems must be linked to a Subtopic."
                )
            if topic:
                raise serializers.ValidationError(
                    "Learn & Certify coding problems cannot be linked to a Topic."
                )

        if category in ["practice", "skill_test"]:
            if not topic:
                raise serializers.ValidationError(
                    "Practice/Skill Test coding problems must be linked to a Topic."
                )
            if sub_topic:
                raise serializers.ValidationError(
                    "Practice/Skill Test coding problems cannot be linked to a Subtopic."
                )

        return data



class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "sub_topic", "user", "content", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "user"]

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Content cannot be empty.")
        return value