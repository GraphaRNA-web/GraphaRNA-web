import os
import uuid
from datetime import timedelta, datetime
from django.db import models
from django.utils import timezone
from django.conf import settings


def default_expiration() -> datetime:
    return timezone.now() + timedelta(weeks=settings.JOB_EXPIRATION_WEEKS)


class Job(models.Model):
    STATUS = {"Q": "Queued", "P": "Processing", "F": "Finished"}
    uid: models.UUIDField = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    input_structure: models.FileField = models.FileField()
    seed: models.IntegerField = models.IntegerField()
    job_name: models.CharField = models.CharField(max_length=255)
    email: models.CharField = models.CharField(max_length=255, null=True, blank=True)
    created_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    expires_at: models.DateTimeField = models.DateTimeField(null=True)
    status: models.TextField = models.TextField(choices=STATUS)

    def __str__(self) -> str:
        return str(self.job_name)
    
    #Delete file associated with record 
    def delete(self, *args, **kwargs):
        if self.input_structure and os.path.isfile(self.input_structure.path):
            self.input_structure.delete(save=False)
        super().delete(*args, **kwargs)


class JobResults(models.Model):
    job: models.OneToOneField = models.OneToOneField(Job, on_delete=models.CASCADE)
    completed_at: models.DateTimeField = models.DateTimeField(
        default=timezone.now, null=True
    )
    result_structure: models.FileField = models.FileField()

    def __str__(self) -> str:
        return str(self.result_structure)
    
    #Delete files associated with record 
    def delete(self, *args, **kwargs):
        if self.result_structure and os.path.isfile(self.result_structure.path):
            self.result_structure.delete(save=False)
        super().delete(*args, **kwargs)
