from django.contrib import admin
from .models import Contest

@admin.register(Contest)
class ContestAdmin(admin.ModelAdmin):
    list_display = ('title', 'organizer', 'type', 'status', 'start_date', 'end_date', 'difficulty', 'participants_count')
    list_filter = ('type', 'status', 'difficulty', 'organizer')
    search_fields = ('title', 'organizer', 'description')
    ordering = ('-start_date',)