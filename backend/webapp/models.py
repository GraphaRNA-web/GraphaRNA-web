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


class Status(models.TextChoices):
    Submitted = "S", "Submitted"
    Queued = "Q", "Queued"
    Running = "R", "Running"
    Finished = "C", "Completed"
    Error = "E", "Error"


class SeparatorChoices(models.TextChoices):
    SPACE = " ", "Space"
    HYPHEN = "-", "Hyphen"
    NONE = "N", "None"


class Job(models.Model):
    uid: models.UUIDField = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    hashed_uid: models.CharField = models.CharField(
        max_length=settings.UUID_HASH_LENGTH, unique=True, editable=False, null=True
    )
    input_structure: models.FileField = models.FileField()
    strand_separator: models.CharField = models.CharField(
        max_length=1, choices=SeparatorChoices
    )
    seed: models.IntegerField = models.IntegerField()
    job_name: models.CharField = models.CharField(max_length=255)
    email: models.CharField = models.CharField(max_length=255, null=True, blank=True)
    created_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    expires_at: models.DateTimeField = models.DateTimeField(null=True)
    sum_processing_time: models.DurationField = models.DurationField(null=True)
    status: models.TextField = models.TextField(choices=Status)
    alternative_conformations: models.IntegerField = models.IntegerField(
        validators=[
            MinValueValidator(
                1, message="Value alternative_conformations can't be lower than 1"
            ),
            MaxValueValidator(
                5, message="Value alternative_conformations can't be higher than 5"
            ),
        ]
    )

    def __str__(self) -> str:
        return str(self.job_name)

    # Delete file associated with record
    def delete(self, *args: Any, **kwargs: Any) -> Tuple[int, Dict[str, int]]:
        if self.input_structure and os.path.isfile(self.input_structure.path):
            self.input_structure.delete(save=False)
        return super().delete(*args, **kwargs)


class ExampleStructures(models.Model):
    id: models.IntegerField = models.IntegerField(primary_key=True)
    job: models.ForeignKey = models.ForeignKey(Job, on_delete=models.CASCADE)


class JobResults(models.Model):
    job: models.ForeignKey = models.ForeignKey(Job, on_delete=models.CASCADE)
    completed_at: models.DateTimeField = models.DateTimeField(
        default=timezone.now, null=True
    )
    result_secondary_structure_dotseq: models.FileField = models.FileField(null=True)
    result_secondary_structure_svg: models.FileField = models.FileField(null=True)
    result_tertiary_structure: models.FileField = models.FileField(null=True)
    result_arc_diagram: models.FileField = models.FileField(null=True)
    f1: models.FloatField = models.FloatField(
        null=True,
        validators=[
            MinValueValidator(0, message="Value f1 can't be lower than 0"),
            MaxValueValidator(1, message="Value f1 can't be higher than 1"),
        ],
    )
    inf: models.FloatField = models.FloatField(
        null=True,
        validators=[
            MinValueValidator(0, message="Value f1 can't be lower than 0"),
            MaxValueValidator(1, message="Value f1 can't be higher than 1"),
        ],
    )
    processing_time: models.DurationField = models.DurationField(null=True)

    def __str__(self) -> str:
        return str(self.result_tertiary_structure)

    # Delete files associated with record
    def delete(self, *args: Any, **kwargs: Any) -> Tuple[int, Dict[str, int]]:
        if self.result_tertiary_structure and os.path.isfile(
            self.result_tertiary_structure.path
        ):
            self.result_tertiary_structure.delete(save=False)
        if self.result_secondary_structure_dotseq and os.path.isfile(
            self.result_secondary_structure_dotseq.path
        ):
            self.result_secondary_structure_dotseq.delete(save=False)
        if self.result_secondary_structure_svg and os.path.isfile(
            self.result_secondary_structure_svg.path
        ):
            self.result_secondary_structure_svg.delete(save=False)
        if self.result_arc_diagram and os.path.isfile(self.result_arc_diagram.path):
            self.result_arc_diagram.delete(save=False)
        return super().delete(*args, **kwargs)
