from django.contrib import admin
from .models import Job, JobResults


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        "uid",
        "job_name",
        "email",
        "created_at",
        "expires_at",
        "sum_processing_time",
    )
    search_fields = ("job_name", "email")


@admin.register(JobResults)
class JobResultsAdmin(admin.ModelAdmin):
    list_display = (
        "job",
        "completed_at",
        "result_secondary_structure_dotseq",
        "result_secondary_structure_svg",
        "result_tertiary_structure",
        "result_arc_diagram",
        "processing_time",
    )
    search_fields = ("result_tertiary_structure",)
