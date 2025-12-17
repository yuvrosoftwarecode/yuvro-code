from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from authentication.permissions import CanManageCourses, IsAuthenticatedUser
from .models import (
    Course,
    Topic,
    Subtopic,
    Video,
    Note,
    CourseInstructor,
    Question,
    UserCourseProgress,
)
from .serializers import (
    CourseSerializer,
    CourseBasicSerializer,
    TopicSerializer,
    TopicBasicSerializer,
    SubtopicSerializer,
    VideoSerializer,
    NoteSerializer,
    QuestionSerializer,
)
from django.contrib.auth import get_user_model

User = get_user_model()


def instructor_assigned(user, course):
    return CourseInstructor.objects.filter(instructor=user, course=course).exists()


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    permission_classes = [CanManageCourses]

    def get_serializer_class(self):
        return CourseSerializer if self.action == "retrieve" else CourseBasicSerializer

    def get_queryset(self):
        queryset = Course.objects.all()
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    @action(detail=True, methods=["get"])
    def instructors(self, request, pk=None):
        course = self.get_object()
        instructors = course.instructors.all()
        return Response(
            [
                {"id": str(u.id), "name": u.username, "email": u.email}
                for u in instructors
            ]
        )

    @action(detail=True, methods=["post"])
    def add_instructor(self, request, pk=None):
        course = self.get_object()
        instructor_id = request.data.get("instructor_id")

        if not instructor_id:
            return Response({"error": "instructor_id is required"}, status=400)

        instructor = get_object_or_404(User, id=instructor_id)

        try:
            CourseInstructor.objects.create(course=course, instructor=instructor)
        except IntegrityError:
            return Response({"error": "Instructor already assigned"}, status=400)

        return Response({"message": "Instructor assigned successfully"})

    @action(detail=True, methods=["post"])
    def remove_instructor(self, request, pk=None):
        course = self.get_object()
        instructor_id = request.data.get("instructor_id")
        mapping = CourseInstructor.objects.filter(
            course=course, instructor_id=instructor_id
        ).first()

        if not mapping:
            return Response({"error": "Instructor not assigned"}, status=400)

        mapping.delete()
        return Response({"message": "Removed successfully"})

    def update(self, request, *a, **kw):
        kw["partial"] = True
        return super().update(request, *a, **kw)


class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.select_related("course")
    permission_classes = [IsAuthenticatedUser]

    def get_serializer_class(self):
        return TopicSerializer if self.action == "retrieve" else TopicBasicSerializer

    def get_queryset(self):
        qs = Topic.objects.select_related("course")
        user = self.request.user

        if user.role == "instructor":
            assigned_ids = CourseInstructor.objects.filter(instructor=user).values_list(
                "course_id", flat=True
            )
            qs = qs.filter(course_id__in=assigned_ids)

        course_id = self.request.query_params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)

        return qs

    def create(self, request, *a, **kw):
        user = request.user
        course_id = request.data.get("course")
        course = get_object_or_404(Course, id=course_id)

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().create(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)

    def update(self, request, *a, **kw):
        topic = self.get_object()
        course = topic.course
        user = request.user

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().update(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)

    def destroy(self, request, *a, **kw):
        topic = self.get_object()
        course = topic.course
        user = request.user

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().destroy(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)


class SubtopicViewSet(viewsets.ModelViewSet):
    queryset = Subtopic.objects.select_related("topic__course")
    serializer_class = SubtopicSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        qs = Subtopic.objects.select_related("topic__course")
        topic_id = self.request.query_params.get("topic")

        if topic_id:
            qs = qs.filter(topic_id=topic_id)

        user = self.request.user
        if user.role == "instructor":
            qs = qs.filter(
                topic__course_id__in=CourseInstructor.objects.filter(
                    instructor=user
                ).values_list("course_id", flat=True)
            )

        return qs

    def create(self, request, *a, **kw):
        user = request.user
        topic = get_object_or_404(Topic, id=request.data.get("topic"))
        course = topic.course

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().create(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)

    def update(self, request, *a, **kw):
        sub = self.get_object()
        course = sub.topic.course
        user = request.user

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().update(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)

    def destroy(self, request, *a, **kw):
        sub = self.get_object()
        course = sub.topic.course
        user = request.user

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().destroy(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)

class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.select_related("sub_topic__topic__course")
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        qs = Video.objects.select_related("sub_topic__topic__course")
        sub = self.request.query_params.get("sub_topic")

        if sub:
            qs = qs.filter(sub_topic_id=sub)

        user = self.request.user
        if user.role == "instructor":
            qs = qs.filter(
                sub_topic__topic__course_id__in=CourseInstructor.objects.filter(
                    instructor=user
                ).values_list("course_id", flat=True)
            )
        return qs

    def create(self, request, *a, **kw):
        subtopic = get_object_or_404(Subtopic, id=request.data.get("sub_topic"))
        course = subtopic.topic.course
        user = request.user

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().create(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)

    def update(self, request, *a, **kw):
        video = self.get_object()
        course = video.sub_topic.topic.course
        user = request.user

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().update(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)

    def destroy(self, request, *a, **kw):
        video = self.get_object()
        course = video.sub_topic.topic.course
        user = request.user

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().destroy(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.select_related("sub_topic", "user")
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        qs = Note.objects.select_related("sub_topic", "user")
        user = self.request.user

        if user.role == "instructor":
            qs = qs.filter(
                sub_topic__topic__course_id__in=CourseInstructor.objects.filter(
                    instructor=user
                ).values_list("course_id", flat=True)
            )

        if sid := self.request.query_params.get("sub_topic"):
            qs = qs.filter(sub_topic_id=sid)

        return qs

    def create(self, request, *a, **kw):
        user = request.user
        subtopic = get_object_or_404(Subtopic, id=request.data.get("sub_topic"))
        course = subtopic.topic.course

        if not (
            user.role == "admin"
            or (user.role == "instructor" and instructor_assigned(user, course))
        ):
            return Response({"error": "Not allowed"}, status=403)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # FIX: attach user correctly
        serializer.save(user=request.user)

        return Response(serializer.data, status=201)

    def update(self, request, *a, **kw):
        note = self.get_object()
        course = note.sub_topic.topic.course
        user = request.user

        if not (
            user.role == "admin"
            or (user.role == "instructor" and instructor_assigned(user, course))
        ):
            return Response({"error": "Not allowed"}, status=403)

        return super().update(request, *a, **kw)

    def destroy(self, request, *a, **kw):
        note = self.get_object()
        course = note.sub_topic.topic.course
        user = request.user

        if not (
            user.role == "admin"
            or (user.role == "instructor" and instructor_assigned(user, course))
        ):
            return Response({"error": "Not allowed"}, status=403)

        return super().destroy(request, *a, **kw)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.select_related("course", "topic", "subtopic", "created_by")
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        from django.db import models
        
        qs = Question.objects.select_related("course", "topic", "subtopic", "created_by")
        user = self.request.user

        # Filter by user role
        if user.role == "instructor":
            # Instructors can only see questions from courses they're assigned to
            assigned_course_ids = CourseInstructor.objects.filter(
                instructor=user
            ).values_list("course_id", flat=True)
            
            qs = qs.filter(
                models.Q(course_id__in=assigned_course_ids) |
                models.Q(topic__course_id__in=assigned_course_ids) |
                models.Q(subtopic__topic__course_id__in=assigned_course_ids)
            )

        # Filter by query parameters
        course_id = self.request.query_params.get("course")
        topic_id = self.request.query_params.get("topic")
        subtopic_id = self.request.query_params.get("subtopic")
        question_type = self.request.query_params.get("type")
        difficulty = self.request.query_params.get("difficulty")
        level = self.request.query_params.get("level")
        categories = self.request.query_params.get("categories")
        search = self.request.query_params.get("search")

        if course_id:
            qs = qs.filter(course_id=course_id)
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        if subtopic_id:
            qs = qs.filter(subtopic_id=subtopic_id)
        if question_type:
            qs = qs.filter(type=question_type)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        if level and level != 'all':
            qs = qs.filter(level=level)
        if categories:
            # Filter questions that contain the specified category
            qs = qs.filter(categories__contains=[categories])
        if search:
            # Search in title and content fields
            qs = qs.filter(
                models.Q(title__icontains=search) |
                models.Q(content__icontains=search)
            )

        return qs

    def create(self, request, *args, **kwargs):
        user = request.user
        
        # Get the course for permission checking
        course = None
        level = request.data.get("level")
        
        if level == "course":
            course_id = request.data.get("course")
            course = get_object_or_404(Course, id=course_id) if course_id else None
        elif level == "topic":
            topic_id = request.data.get("topic")
            topic = get_object_or_404(Topic, id=topic_id) if topic_id else None
            course = topic.course if topic else None
        elif level == "subtopic":
            subtopic_id = request.data.get("subtopic")
            subtopic = get_object_or_404(Subtopic, id=subtopic_id) if subtopic_id else None
            course = subtopic.topic.course if subtopic else None

        # Check permissions
        if not course:
            return Response({"error": "Invalid course/topic/subtopic"}, status=400)
            
        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().create(request, *args, **kwargs)

        return Response({"error": "Not allowed"}, status=403)

    def update(self, request, *args, **kwargs):
        question = self.get_object()
        user = request.user
        
        # Get the course for permission checking
        course = None
        if question.course:
            course = question.course
        elif question.topic:
            course = question.topic.course
        elif question.subtopic:
            course = question.subtopic.topic.course

        if not course:
            return Response({"error": "Invalid question association"}, status=400)

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().update(request, *args, **kwargs)

        return Response({"error": "Not allowed"}, status=403)

    def destroy(self, request, *args, **kwargs):
        question = self.get_object()
        user = request.user
        
        # Get the course for permission checking
        course = None
        if question.course:
            course = question.course
        elif question.topic:
            course = question.topic.course
        elif question.subtopic:
            course = question.subtopic.topic.course

        if not course:
            return Response({"error": "Invalid question association"}, status=400)

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().destroy(request, *args, **kwargs)

        return Response({"error": "Not allowed"}, status=403)


class StudentCourseProgressViewSet(viewsets.ViewSet):
    """
    ViewSet to handle student-specific actions like progress, continue learning, etc.
    Route: /api/course/student-course-progress/
    """
    permission_classes = [IsAuthenticatedUser]

    @action(detail=False, methods=["post"])
    def mark_complete(self, request):
        user = request.user
        subtopic_id = request.data.get("subtopic_id")
        
        if not subtopic_id:
            return Response({"error": "subtopic_id is required"}, status=400)
            
        subtopic = get_object_or_404(Subtopic, id=subtopic_id)
        
        # Get or create progress record
        progress, created = UserCourseProgress.objects.get_or_create(
            user=user,
            subtopic=subtopic,
            defaults={
                "course": subtopic.topic.course,
                "topic": subtopic.topic
            }
        )
        
        # Mark as fully complete
        progress.is_completed = True
        progress.progress_percent = 100.0
        progress.completed_at = timezone.now()
        progress.save()
        
        return Response({"message": "Marked as complete", "progress": progress.progress_percent})

    @action(detail=False, methods=["post"])
    def submit_quiz(self, request):
        user = request.user
        subtopic_id = request.data.get("subtopic_id")
        answers = request.data.get("answers")
        score_percent = request.data.get("score_percent", 0)
        is_passed = request.data.get("is_passed", False)

        if not subtopic_id:
            return Response({"error": "subtopic_id is required"}, status=400)
            
        subtopic = get_object_or_404(Subtopic, id=subtopic_id)
        
        progress, _ = UserCourseProgress.objects.get_or_create(
            user=user,
            subtopic=subtopic,
            defaults={
                "course": subtopic.topic.course,
                "topic": subtopic.topic
            }
        )
        
        progress.quiz_score = float(score_percent)
        progress.quiz_answers = answers or {} 
        progress.is_quiz_completed = is_passed
        
        new_percent = progress.calculate_progress()
        if new_percent >= 100:
             progress.completed_at = timezone.now()
             
        progress.save()
        
        return Response({
            "message": "Quiz submitted",
            "progress": new_percent,
            "is_completed": progress.is_completed
        })

    @action(detail=False, methods=["post"])
    def submit_coding(self, request):
        user = request.user
        subtopic_id = request.data.get("subtopic_id")
        coding_status = request.data.get("coding_status", {})
        
        if not subtopic_id:
            return Response({"error": "subtopic_id is required"}, status=400)

        subtopic = get_object_or_404(Subtopic, id=subtopic_id)
        
        progress, _ = UserCourseProgress.objects.get_or_create(
            user=user,
            subtopic=subtopic,
            defaults={
                "course": subtopic.topic.course,
                "topic": subtopic.topic
            }
        )
        
        total_questions = Question.objects.filter(
            subtopic=subtopic, 
            type="coding"
        ).count()
        
        solved_count = len([k for k, v in coding_status.items() if v])
        
        coding_score = 0.0
        if total_questions > 0:
            coding_score = (solved_count / total_questions) * 100.0
        else:
            coding_score = 100.0
            
        progress.coding_score = coding_score
        progress.coding_answers = coding_status
        progress.is_coding_completed = (coding_score >= 100.0)
        
        new_percent = progress.calculate_progress()
        if new_percent >= 100:
             progress.completed_at = timezone.now()
             
        progress.save()

        return Response({
            "message": "Coding progress updated",
            "progress": new_percent,
            "is_completed": progress.is_completed
        })

    @action(detail=False, methods=["post"])
    def mark_video_watched(self, request):
        """
        Mark videos as watched for a subtopic (20% progress).
        """
        user = request.user
        subtopic_id = request.data.get("subtopic_id")
        
        if not subtopic_id:
            return Response({"error": "subtopic_id is required"}, status=400)
            
        subtopic = get_object_or_404(Subtopic, id=subtopic_id)
        
        # Get or create progress record
        progress, created = UserCourseProgress.objects.get_or_create(
            user=user,
            subtopic=subtopic,
            defaults={
                "course": subtopic.topic.course,
                "topic": subtopic.topic
            }
        )
        
        # Update video status
        progress.is_videos_watched = True
        
        # Recalculate total progress
        new_percent = progress.calculate_progress()
        if new_percent >= 100:
             progress.completed_at = timezone.now()

        progress.save()
        
        return Response({
            "message": "Videos marked as watched", 
            "progress": new_percent,
            "is_completed": progress.is_completed
        })

    @action(detail=False, methods=["get"])
    def continue_learning(self, request):
        user = request.user
        # Sort by last_accessed to ensure the most recently viewed subtopic is returned
        last_progress = UserCourseProgress.objects.filter(user=user).order_by("-last_accessed", "-updated_at").first()
        
        if not last_progress:
             return Response({"message": "No progress found"}, status=200)
             
        course = last_progress.course
        
        # Calculate stats for banner
        total_lessons = Subtopic.objects.filter(topic__course=course).count()
        
        # Calculate percent
        user_progress_list = UserCourseProgress.objects.filter(user=user, course=course)
        total_percent_sum = sum(p.progress_percent for p in user_progress_list)
        
        avg_percent = 0
        if total_lessons > 0:
            avg_percent = round(total_percent_sum / total_lessons)
            
        # Return necessary details to navigate
        return Response({
            "course_id": course.id,
            "course_name": course.name,
            "topic_id": last_progress.topic.id if last_progress.topic else None,
            "subtopic_id": last_progress.subtopic.id,
            "subtopic_name": last_progress.subtopic.name,
            "total_lessons": total_lessons,
            "percent": avg_percent,
            "lesson": user_progress_list.count() # approximate 'current lesson' count
        })

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        Return user learning stats.
        """
        user = request.user
        
        # Calculate stats
        completed_count = UserCourseProgress.objects.filter(user=user, is_completed=True).count()
        
        # Calculate average progress
        avg_progress = 0
        total_minutes = 0
        
        progress_records = UserCourseProgress.objects.filter(user=user)
        
        if progress_records.exists():
            # --- Smart Time Estimate ---
            for p in progress_records:
                total_minutes += 5 # Base
                if p.is_videos_watched: total_minutes += 15
                if p.is_quiz_completed: total_minutes += 10
                if p.is_coding_completed: total_minutes += 25

            # --- Accurate Avg Progress ---
            # 1. Group progress by course
            course_map = {} # {course_id: sum_of_percentages}
            for p in progress_records:
                cid = p.course_id
                course_map[cid] = course_map.get(cid, 0) + p.progress_percent
            
            # 2. Calculate % for each course
            total_course_pct = 0
            for cid, current_sum in course_map.items():
                # Count total subtopics in this course
                total_subs = Subtopic.objects.filter(topic__course_id=cid).count()
                if total_subs > 0:
                    # Course % = (Sum of subtopic %) / Count of subtopics
                    # e.g., 500 / 10 = 50%
                    c_pct = current_sum / total_subs
                    # Cap at 100%
                    c_pct = min(c_pct, 100.0)
                    total_course_pct += c_pct
            
            # 3. Overall Average
            if len(course_map) > 0:
                avg_progress = round(total_course_pct / len(course_map))
        
        # Format time string "Xh Ym"
        hours = total_minutes // 60
        mins = total_minutes % 60
        
        time_spent_str = f"{hours}h {mins}m"
        if hours == 0:
            time_spent_str = f"{mins}m"
            
        return Response({
            "lessons_completed": completed_count,
            "time_spent": time_spent_str,
            "avg_progress": avg_progress
        })

    @action(detail=False, methods=["get"])
    def progress(self, request):
        """
        Get overall progress percentage for all courses the user has started.
        Returns: [{'course_id': 'uuid', 'percent': 45.5}, ...]
        """
        user = request.user
        
        # Get all progress records
        progress_records = UserCourseProgress.objects.filter(user=user).select_related('course')
        
        # Group by course
        course_stats = {}
        for p in progress_records:
            cid = str(p.course.id)
            if cid not in course_stats:
                course_stats[cid] = {'sum': 0.0}
            course_stats[cid]['sum'] += p.progress_percent
            
        results = []
        for cid, stats in course_stats.items():
            # Count total subtopics for this course
            total_subs = Subtopic.objects.filter(topic__course_id=cid).count()
            if total_subs > 0:
                percent = round(stats['sum'] / total_subs, 1)
                # Cap at 100% just in case
                percent = min(percent, 100.0)
                results.append({'course_id': cid, 'percent': percent})
                
        return Response(results)

    @action(detail=False, methods=["get"])
    def get_course_progress(self, request):
        user = request.user
        course_id = request.query_params.get("course_id")
        
        if not course_id:
             return Response({"error": "course_id is required"}, status=400)
             
        progress_qs = UserCourseProgress.objects.filter(user=user, course_id=course_id)
        
        data = {}
        for p in progress_qs:
            data[str(p.subtopic.id)] = {
                "progress_percent": p.progress_percent,
                "is_completed": p.is_completed
            }
            
        return Response(data)

    @action(detail=False, methods=["get"])
    def get_user_progress_details(self, request):
        """
        Get detailed progress for all subtopics in a course, including quiz/coding status.
        Recalculates progress on-the-fly to ensure consistency with course content changes (e.g. added/removed questions).
        """
        user = request.user
        course_id = request.query_params.get("course_id")
        
        if not course_id:
             return Response({"error": "course_id is required"}, status=400)
             
        progress_qs = UserCourseProgress.objects.filter(
            user=user, 
            course_id=course_id
        ).select_related('subtopic').prefetch_related('subtopic__questions')
        
        updated_records = []
        for p in progress_qs:
            p.calculate_progress()
            updated_records.append(p)
            
        if updated_records:
             UserCourseProgress.objects.bulk_update(
                 updated_records, 
                 ['progress_percent', 'is_completed']
             )
        
        from .serializers import UserCourseProgressSerializer
        serializer = UserCourseProgressSerializer(updated_records, many=True)
        
        data = {str(item['subtopic']): item for item in serializer.data}
            
        return Response(data)

    @action(detail=False, methods=["post"])
    def log_access(self, request):
        """
        Log access to a subtopic to update 'Continue Learning' banner.
        Does not change completion status, just updates timestamps.
        """
        user = request.user
        subtopic_id = request.data.get("subtopic_id")
        
        if not subtopic_id:
             return Response({"error": "subtopic_id is required"}, status=400)
             
        subtopic = get_object_or_404(Subtopic, id=subtopic_id)
        
        # Get or create progress record
        progress, created = UserCourseProgress.objects.get_or_create(
            user=user,
            subtopic=subtopic,
            defaults={
                "course": subtopic.topic.course,
                "topic": subtopic.topic
            }
        )
        
        # Explicitly update timestamps
        progress.last_accessed = timezone.now()
        progress.save(update_fields=['last_accessed', 'updated_at'])
        
        return Response({"message": "Access logged"})