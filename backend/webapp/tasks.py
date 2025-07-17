
from django.utils import timezone
from .models import Job
from celery import shared_task

@shared_task
def delete_expired_jobs():
    now = timezone.now()
    expired_jobs = Job.objects.filter(expires_at__lt=now) #Expires at less then now
    count, _ = expired_jobs.delete()
    return f"Deleted {count} expired jobs."
