from django.contrib import admin
from .models import Job, JobResults


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("job_name", "email", "created_at", "expires_at")
    search_fields = ("job_name", "email")


@admin.register(JobResults)
class JobResultsAdmin(admin.ModelAdmin):
    list_display = ("job", "completed_at", "result_structure")
    search_fields = ("result_structure",)
