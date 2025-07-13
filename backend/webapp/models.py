import uuid
from datetime import timedelta, datetime
from django.db import models
from django.utils import timezone
from django.conf import settings


def default_expiration() -> datetime:
    return timezone.now() + timedelta(weeks=settings.JOB_EXPIRATION_WEEKS)


class Job(models.Model):
    uid: models.UUIDField = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    input_structure: models.CharField = models.CharField(max_length=255)
    seed: models.IntegerField = models.IntegerField()
    job_name: models.CharField = models.CharField(max_length=255)
    email: models.CharField = models.CharField(max_length=255, null=True, blank=True)
    created_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    expires_at: models.DateTimeField = models.DateTimeField(default=default_expiration)

    def __str__(self) -> str:
        return str(self.job_name)


class JobResults(models.Model):
    job: models.OneToOneField = models.OneToOneField(Job, on_delete=models.CASCADE)
    completed_at: models.DateTimeField = models.DateTimeField(
        default=timezone.now, null=True
    )
    result_structure: models.CharField = models.CharField(max_length=255)

    def __str__(self) -> str:
        return str(self.result_structure)