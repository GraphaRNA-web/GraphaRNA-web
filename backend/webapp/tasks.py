from datetime import timedelta, datetime
from django.utils import timezone
from django.conf import settings
from .models import Job, JobResults
from .visualization_tools import drawVARNAgraph, getDotbracketFromDotseq, generateRchieDiagram
from time import sleep
from uuid import UUID
import requests
from celery import shared_task
import os
import json

def log_to_file(message: str):
    ts = datetime.now().isoformat()
    with open("/shared/celery_debug.log", "a") as f:
        f.write(f"[{ts}] {message}\n")

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
        log_to_file(f"Job {str(uuid_param)} not found")
        return "Job not found"

    seed = job_data.seed
    uuid_str = str(uuid_param)
    input_path = f"/shared/samples/engine_inputs/{uuid_str}.dotseq"

    output_dir = "/shared/samples/engine_outputs"
    os.makedirs(output_dir, exist_ok=True)

    try:
        job_data.status = "P"
        job_data.save()

        for i in range(job_data.alternative_conformations):
            try:
                response = requests.post(
                    "http://grapharna-engine:8080/test", data={"uuid": uuid_str, "seed": seed + i}
                )
            except requests.RequestException as e:
                log_to_file(f"Grapharna request failed (uuid={uuid_str}): {e}")                
                raise Exception(f"Grapharna request failed (uuid={uuid_str}): {e}")

            if response.status_code != 200:
                log_to_file(f"Grapharna API error uuid={uuid_str}: {response.text}, {response.status_code}")                
                raise Exception(f"Grapharna API error uuid={uuid_str}: {response.text}, {response.status_code}")
            
            try:
                data = response.json()
            except json.JSONDecodeError:
                raise ValueError(f"Invalid JSON from Grapharna. uuid: {uuid_str}")
            
            output_path_pdb = data.get("pdbFilePath")
            output_path_json = data.get("jsonFilePath")
            
            if not os.path.exists(output_path_pdb):
                log_to_file(f"Can't find {output_path_pdb} uuid:{uuid_str}")                
                raise FileNotFoundError(f"Can't find {output_path_pdb}")
                
            if not os.path.exists(output_path_json):
                log_to_file(f"Can't find {output_path_json} uuid:{uuid_str}")                
                raise FileNotFoundError(f"Can't find {output_path_json} uuid:{uuid_str}")
                
            with open(output_path_json, "r") as f:
                json_data = json.load(f)
            

            dotSeq_output = json_data.get("dotBracket", "")
            dotbracket_path_output = os.path.join(output_dir, f"{uuid_str}_{seed + i}.dotseq")
            if dotSeq_output:
                with open(dotbracket_path_output, "w") as dbn_file:
                    dbn_file.write(dotSeq_output + "\n")
            else:
                log_to_file(f"No dotBracket structure found in JSON. uuid: {uuid_str}")                
                raise Exception(f"Can't find dotBracket from result structure. uuid: {uuid_str}")

            try:
                os.remove(output_path_json)
            except Exception as e:
                log_to_file(f"JSON file delete error {e} uuid: {uuid_str}")
                raise Exception(f"JSON file delete error {e} uuid: {uuid_str}")

            output_path_varna = dotbracket_path_output.replace(".dotseq", "")
            output_path_varna += "_VARNA.svg"
            try:
                drawVARNAgraph(dotbracket_path_output)
            except Exception as e:                
                log_to_file(f"VARNA visualisation error {e} uuid: {uuid_str}")
                raise Exception(f"VARNA visualisation error {e} uuid: {uuid_str}")
        
            dotbracket_input = getDotbracketFromDotseq(input_path)
            if dotbracket_input.startswith("ERROR"):
                log_to_file(f"getDotbracketFromDotseq input ERROR: {dotbracket_input} uuid: {uuid_str}")               
                raise Exception(f"{dotbracket_input} : input uuid: {uuid_str}")

            dotbracket_output = getDotbracketFromDotseq(dotbracket_path_output)
            if dotbracket_output.startswith("ERROR"):
                log_to_file(f"getDotbracketFromDotseq output ERROR: {dotbracket_output} uuid: {uuid_str}")
                raise Exception(f"{dotbracket_output} : output uuid: {uuid_str}")
            
            output_path_Rchie = output_path_varna.replace("VARNA", "RChie")

            result_path = generateRchieDiagram(dotbracket_input, dotbracket_output, output_path_Rchie)
            if result_path != output_path_Rchie:
                log_to_file(f"Rchie visualisation error {result_path} uuid: {uuid_str}")
                raise Exception(f"Rchie visualisation produced unexpected path: {result_path} uuid: {uuid_str}")
            
            relative_path_pdb = os.path.relpath(output_path_pdb, settings.MEDIA_ROOT)
            relative_path_db = os.path.relpath(dotbracket_path_output, settings.MEDIA_ROOT)
            relative_path_VARNA = os.path.relpath(output_path_varna, settings.MEDIA_ROOT)
            relative_path_Rchie = os.path.relpath(output_path_Rchie, settings.MEDIA_ROOT)
            
            try:
                JobResults.objects.create(
                    job=job_data, 
                    result_secondary_structure=relative_path_db, 
                    result_tertiary_structure=relative_path_pdb,
                    result_VARNA_graph=relative_path_VARNA,
                    result_Rchie_graph=relative_path_Rchie,
                    completed_at=timezone.now()
                )
            except Exception as e:
                log_to_file(f"Adding to DataBase didn't work {e} uuid: {uuid_str}")
                raise Exception(f"Adding to DataBase didn't work {e} uuid: {uuid_str}")


        job_data.expires_at = timezone.now() + timedelta(weeks=settings.JOB_EXPIRATION_WEEKS)
        job_data.status = "F"
        job_data.save()

        return "OK"
    
    except Exception as e:
        job_data.status = "E"
        job_data.save()
        log_to_file(f"Unhandled error: {e} uuid: {uuid_str}")
        return "ERROR"


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

