from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from .models import (
    Course,
    Topic,
    Subtopic,
    Video,
    Quiz,
    CodingProblem,
    Note,
    CourseInstructor,
    CourseContinue,
    LearnProgress
)
from .serializers import (
    CourseSerializer,
    CourseBasicSerializer,
    TopicSerializer,
    TopicBasicSerializer,
    SubtopicSerializer,
    VideoSerializer,
    QuizSerializer,
    CodingProblemSerializer,
    NoteSerializer,
    LearnProgressSerializer,
    CourseContinueSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()


def instructor_assigned(user, course):
    return CourseInstructor.objects.filter(instructor=user, course=course).exists()

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.is_staff


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self): # type: ignore
        return CourseSerializer if self.action == "retrieve" else CourseBasicSerializer

    def get_queryset(self): # type: ignore
        queryset = Course.objects.all()
        category = self.request.query_params.get("category") # type: ignore
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
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self): # type: ignore
        return TopicSerializer if self.action == "retrieve" else TopicBasicSerializer

    def get_queryset(self): # type: ignore
        qs = Topic.objects.select_related("course")
        user = self.request.user

        if user.role == "instructor": # type: ignore
            assigned_ids = CourseInstructor.objects.filter(instructor=user).values_list(
                "course_id", flat=True
            )
            qs = qs.filter(course_id__in=assigned_ids)

        course_id = self.request.query_params.get("course") # type: ignore
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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self): # type: ignore
        qs = Subtopic.objects.select_related("topic__course")
        topic_id = self.request.query_params.get("topic") # type: ignore

        if topic_id:
            qs = qs.filter(topic_id=topic_id)

        user = self.request.user
        if user.role == "instructor":  # type: ignore
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


# =====================================================
#   VIDEOS
# =====================================================
class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.select_related("sub_topic__topic__course")
    serializer_class = VideoSerializer
    permission_classes = [permissions.IsAuthenticated]

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


# =====================================================
#   QUIZZES
# =====================================================
class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.select_related("topic", "sub_topic")
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Quiz.objects.select_related("topic", "sub_topic")

        user = self.request.user
        if user.role == "instructor":
            qs = qs.filter(
                topic__course_id__in=CourseInstructor.objects.filter(
                    instructor=user
                ).values_list("course_id", flat=True)
            ) | qs.filter(
                sub_topic__topic__course_id__in=CourseInstructor.objects.filter(
                    instructor=user
                ).values_list("course_id", flat=True)
            )

        if cid := self.request.query_params.get("category"):
            qs = qs.filter(category=cid)
        if tid := self.request.query_params.get("topic"):
            qs = qs.filter(topic_id=tid)
        if sid := self.request.query_params.get("sub_topic"):
            qs = qs.filter(sub_topic_id=sid)

        return qs

    def create(self, request, *a, **kw):
        user = request.user

        # quiz linked to topic?
        topic_id = request.data.get("topic")
        subtopic_id = request.data.get("sub_topic")

        course = None
        if topic_id:
            course = get_object_or_404(Topic, id=topic_id).course
        if subtopic_id:
            course = get_object_or_404(Subtopic, id=subtopic_id).topic.course

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().create(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)

    def update(self, request, *a, **kw):
        quiz = self.get_object()
        course = quiz.topic.course if quiz.topic else quiz.sub_topic.topic.course
        user = request.user

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().update(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)

    def destroy(self, request, *a, **kw):
        quiz = self.get_object()
        course = quiz.topic.course if quiz.topic else quiz.sub_topic.topic.course
        user = request.user

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().destroy(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)


# =====================================================
#   CODING PROBLEMS
# =====================================================
class CodingProblemViewSet(viewsets.ModelViewSet):
    queryset = CodingProblem.objects.select_related("topic", "sub_topic")
    serializer_class = CodingProblemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CodingProblem.objects.select_related("topic", "sub_topic")
        user = self.request.user

        if user.role == "instructor":
            qs = qs.filter(
                topic__course_id__in=CourseInstructor.objects.filter(
                    instructor=user
                ).values_list("course_id", flat=True)
            ) | qs.filter(
                sub_topic__topic__course_id__in=CourseInstructor.objects.filter(
                    instructor=user
                ).values_list("course_id", flat=True)
            )

        if cid := self.request.query_params.get("category"):
            qs = qs.filter(category=cid)
        if tid := self.request.query_params.get("topic"):
            qs = qs.filter(topic_id=tid)
        if sid := self.request.query_params.get("sub_topic"):
            qs = qs.filter(sub_topic_id=sid)

        return qs

    def create(self, request, *a, **kw):
        user = request.user

        topic_id = request.data.get("topic")
        sub_id = request.data.get("sub_topic")

        course = None
        if topic_id:
            course = get_object_or_404(Topic, id=topic_id).course
        if sub_id:
            course = get_object_or_404(Subtopic, id=sub_id).topic.course

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().create(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)

    def update(self, request, *a, **kw):
        problem = self.get_object()
        course = (
            problem.topic.course if problem.topic else problem.sub_topic.topic.course
        )
        user = request.user

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().update(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)

    def destroy(self, request, *a, **kw):
        problem = self.get_object()
        course = (
            problem.topic.course if problem.topic else problem.sub_topic.topic.course
        )
        user = request.user

        if user.role == "admin" or (
            user.role == "instructor" and instructor_assigned(user, course)
        ):
            return super().destroy(request, *a, **kw)

        return Response({"error": "Not allowed"}, status=403)


# =====================================================
#   NOTES
# =====================================================
class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.select_related("sub_topic", "user")
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

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
    
class ProgressViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=["get"])
    def stats(self, request):
        user = request.user
        
        # Get all courses for this user
        user_courses = Course.objects.all()
        
        # Count total completed subtopics
        completed = LearnProgress.objects.filter(
            user=user, 
            completed=True
        ).count()
        
        # Calculate average progress across all courses
        course_progresses = []
        for course in user_courses:
            total_subtopics = Subtopic.objects.filter(topic__course=course).count()
            course_completed = LearnProgress.objects.filter(
                user=user,
                subtopic__topic__course=course,
                completed=True
            ).count()
            
            if total_subtopics > 0:
                course_progress = (course_completed / total_subtopics) * 100
                course_progresses.append(course_progress)
        
        avg_progress = round(sum(course_progresses) / len(course_progresses), 2) if course_progresses else 0
        
        return Response(
            {
                "lessons_completed": completed,
                "time_spent": "0h",
                "avg_progress": avg_progress,
            }
        )
        
    @action(detail=False, methods=["get"])
    def progress(self, request):
        user = request.user
        
        courses = Course.objects.all()
        
        response = []
        
        for course in courses:
            total_subtopics = Subtopic.objects.filter(topic__course=course).count()
            
            completed = LearnProgress.objects.filter(
                user=user,
                subtopic__topic__course=course,
                completed=True
            ).count()
            
            percent = (completed / total_subtopics * 100) if total_subtopics > 0 else 0

            response.append({
                "course_id": str(course.id),
                "percent": round(percent, 2),
            })
        
        return Response(response)
    
    @action(detail=False, methods=["get"])
    def continue_learning(self, request):
        user = request.user
        record = CourseContinue.objects.filter(user=user).order_by("-updated_at").first()
        
        if not record:
            return Response({
                "course_id": None,
                "course_name": "None",
                "lesson": 0,
                "total_lessons": 0,
                "percent": 0,
            })
            
        course = record.course
        last_subtopic = record.last_subtopic
        total_subtopics = Subtopic.objects.filter(topic__course=course).order_by("order_index")
        total_lessons = total_subtopics.count()
        
        lesson_number = 1
        for idx, sub in enumerate(total_subtopics):
            if sub.id == last_subtopic.id: # type: ignore
                lesson_number = idx + 1
                break
        
        completed = LearnProgress.objects.filter(
            user=user,
            subtopic__topic__course=course,
            completed=True
        ).count()
        
        percent = (completed / total_lessons * 100) if total_lessons else 0
        
        return Response({
            "course_id": course.id,
            "course_name": course.name,
            "lesson": lesson_number,
            "total_lessons": total_lessons,
            "percent": round(percent, 2),
        })
    
    @action(detail=False, methods=["POST"])
    def mark_complete(self, request):
        user = request.user
        subtopic_id = request.data.get("subtopic_id")
        
        if not subtopic_id:
            return Response({"error": "subtopic_id is required"}, status=400)
        
        try:
            subtopic = Subtopic.objects.get(id=subtopic_id)
        except Subtopic.DoesNotExist:
            return Response({"error": "Invalid subtopic_id"}, status=404)
        
        progress, _ = LearnProgress.objects.update_or_create(
            user=user,
            subtopic = subtopic,
            defaults={"completed": True},
        )
        
        CourseContinue.objects.update_or_create(
            user=user,
            course=subtopic.topic.course,
            defaults={"last_subtopic": subtopic},
        )
        
        return Response({"message": "Subtopic marked complete"})

    @action(detail=False, methods=["GET"])
    def completed_subtopics(self, request):
        """Fetch all completed subtopics for a given course"""
        user = request.user
        course_id = request.query_params.get("course_id")
        
        if not course_id:
            return Response({"error": "course_id parameter required"}, status=400)
        
        try:
            completed_subtopics = LearnProgress.objects.filter(
                user=user,
                subtopic__topic__course_id=course_id,
                completed=True
            ).values_list("subtopic_id", flat=True)
            
            return Response({"completed_subtopic_ids": list(completed_subtopics)})
        except Exception as e:
            return Response({"error": str(e)}, status=500)