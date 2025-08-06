import os
from typing import Any, Dict, Tuple
import uuid
from datetime import timedelta, datetime
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

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
    alternative_conformations: models.IntegerField = models.IntegerField(
        validators=[MinValueValidator(1, message="Value alternative_conformations can't be lower than 1")\
                    , MaxValueValidator(5, message="Value alternative_conformations can't be higher than 5")])

    def __str__(self) -> str:
        return str(self.job_name)
    
    #Delete file associated with record 
    def delete(self, *args: Any, **kwargs: Any) -> Tuple[int, Dict[str, int]]:
        if self.input_structure and os.path.isfile(self.input_structure.path):
            self.input_structure.delete(save=False)
        return super().delete(*args, **kwargs)


class JobResults(models.Model):
    job: models.ForeignKey = models.ForeignKey(Job, on_delete=models.CASCADE)
    completed_at: models.DateTimeField = models.DateTimeField(
        default=timezone.now, null=True
    )
    result_secondary_structure: models.FileField = models.FileField(null=True)
    result_tertiary_structure: models.FileField = models.FileField()
    
    def __str__(self) -> str:
        return str(self.result_tertiary_structure)
    
    #Delete files associated with record 
    def delete(self, *args: Any, **kwargs: Any) -> Tuple[int, Dict[str, int]]:
        if self.result_tertiary_structure and os.path.isfile(self.result_tertiary_structure.path):
            self.result_tertiary_structure.delete(save=False)
        if self.result_secondary_structure and os.path.isfile(self.result_secondary_structure.path):
            self.result_secondary_structure.delete(save=False)
        return super().delete(*args, **kwargs)
