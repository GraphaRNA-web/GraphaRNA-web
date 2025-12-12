from rest_framework import serializers
from webapp.models import Job


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        # fields = "__all__"
        fields=["job_name","created_at","expires_at","sum_processing_time","status",]
