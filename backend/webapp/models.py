import uuid
from django.db import models
from datetime import timedelta
from django.utils import timezone

def default_expiration(): #For expiration date
    return timezone.now() + timedelta(weeks=2)


class Job(models.Model):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    input_structure = models.CharField(max_length=255)
    seed = models.IntegerField()
    job_name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    #Expiration date two weeks after creation
    expires_at = models.DateTimeField(default = default_expiration)
    def __str__(self):
        return self.job_name

class JobResults(models.Model):
    job = models.OneToOneField(Job, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(default = timezone.now , null=True)
    result_structure = models.CharField(max_length=255)
    def __str__(self):
        return self.result_structure