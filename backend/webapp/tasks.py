from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from .models import Job, JobResults
from time import sleep
from uuid import UUID
import requests
from celery import shared_task
import os


@shared_task
def delete_expired_jobs() -> str:
    now = timezone.now()
    expired_jobs = Job.objects.filter(expires_at__lt=now)  # Expires at less then now
    count = expired_jobs.count()
    for job in expired_jobs:
        job.delete() 
    return f"Deleted {count} expired jobs."


@shared_task(queue="grapharna")
def run_grapharna_task(uuid_param: UUID) -> str:
    try:
        db_data = Job.objects.get(uid=uuid_param)
    except Job.DoesNotExist:
        return "Job not found"

    seed = db_data.seed
    uuid_str = str(uuid_param)

    output_dir = "/shared/samples/engine_outputs"
    output_filename = f"{uuid_str}.pdb"
    output_path = os.path.join(output_dir, output_filename)

    os.makedirs(output_dir, exist_ok=True)

    try:

        db_data.status = "P"
        db_data.save()
        response = requests.post(
            "http://grapharna-engine:8080/run", data={"uuid": uuid_str, "seed": seed}
        )

        if response.status_code != 200:
            raise Exception(f"Grapharna API error: {response.text}")

        db_data.expires_at = timezone.now() + timedelta(weeks=settings.JOB_EXPIRATION_WEEKS)
        db_data.status = "F"
        db_data.save()

        relative_path = os.path.relpath(output_path, settings.MEDIA_ROOT)
        JobResults.objects.create(
            job=db_data, result_structure=relative_path, completed_at=timezone.now()
        )

    finally:
        return "OK"


def test_grapharna_run() -> str:

    input_path = "/shared/samples/engine_inputs/test.dotseq"
    output_path = "/shared/samples/engine_outputs/test.pdb"

    os.makedirs(os.path.dirname(input_path), exist_ok=True)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    tekst = ">test_seq"
    with open(input_path, "w") as f:
        f.write(tekst)

    response = requests.post(
        "http://grapharna-engine:8080/test",
    )

    assert response.status_code == 200, f"Błąd: {response.text}"

    sleep(1)

    assert os.path.exists(output_path), f"Nie znaleziono pliku {output_path}"

    with open(output_path, "r") as f:
        content = f.read()
        assert content == tekst

    os.remove(input_path)
    if os.path.exists(output_path):
        os.remove(output_path)

    print(f"Test zakończony sukcesem – plik wygenerowany: {output_path}")
    return "OK"
