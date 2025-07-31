from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from .models import Job, JobResults
from tools import rchie_double_helix
from time import sleep
from uuid import UUID
import requests
from celery import shared_task
import os
import json


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
        job_data = Job.objects.get(uid=uuid_param)
    except Job.DoesNotExist:
        return "Job not found"

    seed = job_data.seed
    uuid_str = str(uuid_param)

    output_dir = "/shared/samples/engine_outputs"

    os.makedirs(output_dir, exist_ok=True)

    try:

        job_data.status = "P"
        job_data.save()

        for i in range(job_data.alternative_conformations):
            response = requests.post(
                "http://grapharna-engine:8080/test", data={"uuid": uuid_str, "seed": seed + i}
            )

            if response.status_code != 200:
                raise Exception(f"Grapharna API error: {response.text}")
            
            data = response.json()
            output_path_pdb = data.get("pdbFilePath")
            output_path_json = data.get("jsonFilePath")
            
            if not os.path.exists(output_path_pdb):
                raise Exception(f"Can't find {output_path_pdb}")
                
            if not os.path.exists(output_path_json):
                raise Exception(f"Can't find {output_path_json}")
                
            with open(output_path_json, "r") as f:
                json_data = json.load(f)

            dot_bracket = json_data.get("dotBracket", "")
            dotbracket_path = os.path.join(output_dir, f"{uuid_str}_{seed + i}.dotseq")
            if dot_bracket:
                with open(dotbracket_path, "w") as dbn_file:
                    dbn_file.write(dot_bracket + "\n")
            else:
                print("No dotBracket structure found in JSON.")

            # try:
            #     os.remove(output_path_json)
            # except Exception as e:
            #     print("JSON file delete error {e}")
            
            relative_path_pdb = os.path.relpath(output_path_pdb, settings.MEDIA_ROOT)
            relative_path_db = os.path.relpath(dotbracket_path, settings.MEDIA_ROOT)
            try:
                JobResults.objects.create(
                    job=job_data, result_secondary_structure=relative_path_db, result_tertiary_structure=relative_path_pdb, completed_at=timezone.now()
                )
            except Exception as e:
                print(f"Adding to DataBase didn't work {e}")


        job_data.expires_at = timezone.now() + timedelta(weeks=settings.JOB_EXPIRATION_WEEKS)
        job_data.status = "F"
        job_data.save()

        

    finally:
        return "OK"


def test_grapharna_run() -> str:

    input_path = "/shared/samples/engine_inputs/test.dotseq"
    output_dir = "/shared/samples/engine_outputs"

    os.makedirs(os.path.dirname(input_path), exist_ok=True)
    

    tekst = ">job-test\nCGCGGAACG CGGGACGCG\n((((...(( ))...))))"
    with open(input_path, "w") as f:
        f.write(tekst)

    response = requests.post(
        "http://grapharna-engine:8080/test",
    )

    assert response.status_code == 200, f"Error: {response.text}"

    sleep(1)

    data = response.json()
    output_path_pdb = data.get("pdbFilePath")
    output_path_json = data.get("jsonFilePath")

    assert (os.path.exists(output_path_pdb) and os.path.exists(output_path_json)), "Couldn't find file"

    with open(output_path_json, "r") as f:
            json_data = json.load(f)

    dot_bracket = json_data.get("dotBracket", "")
    if dot_bracket:
        dotbracket_path = os.path.join(output_dir, "test.dotseq")
        with open(dotbracket_path, "w") as dbn_file:
            dbn_file.write(dot_bracket + "\n")
    else:
        print("No dotBracket structure found in JSON.")

    print(f"Test zakończony sukcesem – plik wygenerowany: {output_path_pdb}")
    return "OK"

