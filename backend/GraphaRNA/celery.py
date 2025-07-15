
from celery import Celery
from celery.schedules import crontab
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GraphaRNA.settings')


app = Celery('GraphaRNA')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()



app.conf.beat_schedule = {
    'delete-expired-jobs-every-day': {
        'task': 'webapp.tasks.delete_expired_jobs',
        'schedule': crontab(hour='*/1', minute=0), #Run the task every hour eg. 0.00, 1.00, ...
    },
}




