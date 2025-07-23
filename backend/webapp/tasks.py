
from django.utils import timezone
from .models import Job, JobResults
import requests
from celery import shared_task
import os
import time

@shared_task
def delete_expired_jobs():
    now = timezone.now()
    expired_jobs = Job.objects.filter(expires_at__lt=now) #Expires at less then now
    count, _ = expired_jobs.delete()
    return f"Deleted {count} expired jobs."



@shared_task
def run_grapharna_task(uuid):
    db_data = Job.objects.get(uid=uuid)
    dotseq_data = db_data.input_structure
    seed = db_data.seed

    input_dir = "/shared/user_inputs"
    output_dir = f"/shared/samples/grapharna-seed={seed}/800"
    input_filename = f"{uuid}.dotseq"
    output_filename = f"{uuid}.pdb"
    input_path = os.path.join(input_dir, input_filename)
    output_path = os.path.join(output_dir, output_filename)

    os.makedirs(input_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    # Save input file
    with open(input_path, 'w') as f:
        f.write(dotseq_data)

    try:
        response = requests.post(
            "http://grapharna-engine:8080/run",
            data={"uuid": uuid, "seed": seed}
        )

        if response.status_code != 200:
            raise Exception(f"Grapharna API error: {response.text}")

        with open(output_path, "r") as f:
            result = f.read()

        JobResults.objects.create(
            job=db_data,
            result_structure=result,
            completed_at=timezone.now()
        )

    finally:
        os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)

    
def test_grapharna_run():
    seed = 42

    input_path = "/shared/user_inputs/test.dotseq"
    output_path = f"/shared/samples/grapharna-seed={seed}/800/test.pdb"

    os.makedirs(os.path.dirname(input_path), exist_ok=True)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    tekst = ">test_seq"
    with open(input_path, "w") as f:
        f.write(tekst)

    response = requests.post(
        "http://grapharna-engine:8080/test",
    )

    assert response.status_code == 200, f"Błąd: {response.text}"

    time.sleep(1)

    assert os.path.exists(output_path), f"Nie znaleziono pliku {output_path}"

    with open(output_path, "r") as f:
        content = f.read()
        assert content == tekst

    print(f"Test zakończony sukcesem – plik wygenerowany: {output_path}")

    os.remove(input_path)
    if os.path.exists(output_path):
        os.remove(output_path)
