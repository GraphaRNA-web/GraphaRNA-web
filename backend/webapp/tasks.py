from datetime import timedelta, datetime
from django.utils import timezone
from django.conf import settings
from .models import Job, JobResults
from time import sleep
from uuid import UUID
import requests
from celery import shared_task
import os
import json
from webapp.visualization_tools import (
    drawVARNAgraph,
    generateRchieDiagram,
    getDotBracket,
)
from celery.utils.log import get_task_logger
from django.db.models.query import QuerySet



def log_to_file(message: str) -> None:
    ts = datetime.now().isoformat()
    with open("/shared/celery_debug.log", "a") as f:
        f.write(f"[{ts}] {message}\n")


@shared_task
def delete_expired_jobs() -> str:
    now = timezone.now()
    expired_jobs = Job.objects.filter(expires_at__lt=now)
    count = expired_jobs.count()

    for job in expired_jobs:
        results = JobResults.objects.filter(job=job)
        for result in results:
            result.delete()

        if job.input_structure:
            job.input_structure.delete(save=False)

        job.delete()

    return f"Deleted {count} expired jobs."


@shared_task(queue="grapharna")
def run_grapharna_task(uuid_param: UUID) -> str:

    logger = get_task_logger(__name__)

    try:
        job_data = Job.objects.get(uid=uuid_param)
    except Job.DoesNotExist:
        logger.error(f"Job not found for UUID: {uuid_param}")
        return "Job not found"
    except Exception as e:
        logger.exception(f"Unexpected error fetching job: {str(e)}")
        raise

    seed = job_data.seed
    uuid_str = str(uuid_param)

    output_dir = "/shared/samples/engine_outputs"

    os.makedirs(output_dir, exist_ok=True)

    logger.info("Dsadsad")

    try:
        job_data.status = "P"
        job_data.save()
    except Exception as e:
        logger.exception(f"Failed to update job status: {str(e)}")
        raise

    engine_url = settings.ENGINE_URL

    for i in range(job_data.alternative_conformations):
        processing_start: datetime = timezone.now()
        response = requests.post(
            engine_url,
            data={"uuid": uuid_str, "seed": seed + i},
        )
        logger.info(
            f"Grapharna response status: {response.status_code}, body: {response.text}"
        )

        if response.status_code != 200:
            logger.error(f"Grapharna API error: {response.text}")
            raise

        data = response.json()
        output_path_pdb = data.get("pdbFilePath")
        output_path_json = data.get("jsonFilePath")

        if not os.path.exists(output_path_pdb):
            logger.error(f"Can't find {output_path_pdb}")
            raise

        if not os.path.exists(output_path_json):
            logger.error(f"Can't find {output_path_json}")
            raise

        try:
            with open(output_path_json, "r") as f:
                json_data = json.load(f)

            dotbracket_from_annotator = json_data.get("dotBracket", "")
            dotbracket_path = os.path.join(output_dir, f"{uuid_str}_{seed}.dotseq")

            if dotbracket_from_annotator:
                with open(dotbracket_path, "w") as dbn_file:
                    dbn_file.write(dotbracket_from_annotator + "\n")
            else:
                logger.error("No dotBracket structure found in JSON")
        except Exception as e:
            logger.exception(f"Error processing JSON data: {e}")
            raise
        os.remove(output_path_json)

        secondary_structure_svg_path = os.path.join(
            output_dir, f"{uuid_str}_{seed + i}.svg"
        )
        try:
            drawVARNAgraph(dotbracket_path, secondary_structure_svg_path)
        except Exception as e:
            logger.error(f"Failed to generate secondary structure: {e}")
            raise

        arc_diagram_path = os.path.join(output_dir, f"{uuid_str}_{seed + i}_arc.svg")
        logger.info(f"{job_data.input_structure}")
        try:
            input_dotbracket = getDotBracket(job_data.input_structure.path)
            output_dotbracket = getDotBracket(dotbracket_path)
            generateRchieDiagram(input_dotbracket, output_dotbracket, arc_diagram_path)
        except Exception as e:
            logger.error(f"Error generating arc diagram{e}")
            raise

        relative_path_pdb = os.path.relpath(output_path_pdb, settings.MEDIA_ROOT)
        relative_path_dotseq = os.path.relpath(dotbracket_path, settings.MEDIA_ROOT)
        relative_path_svg = os.path.relpath(
            secondary_structure_svg_path, settings.MEDIA_ROOT
        )
        relative_path_arc = os.path.relpath(arc_diagram_path, settings.MEDIA_ROOT)

        processing_end: datetime = timezone.now()
        try:
            job_result_qs: QuerySet = JobResults.objects.filter(job__exact = job_data)
            if job_result_qs.count() + 1 == job_data.alternative_conformations: # check if current job result is the last one
                job_data.sum_processing_time = sum([i.processing_time for i in job_result_qs], timedelta()) + (processing_end - processing_start)
                job_data.save()
            JobResults.objects.create(
                job=job_data,
                result_tertiary_structure=relative_path_pdb,
                result_secondary_structure_dotseq=relative_path_dotseq,
                result_secondary_structure_svg=relative_path_svg,
                result_arc_diagram=relative_path_arc,
                completed_at=processing_end,
                processing_time=(processing_end - processing_start)
            )
        except Exception as e:
            logger.exception(f"Failed to create JobResults: {str(e)}")
            raise

    job_data.expires_at = timezone.now() + timedelta(
        weeks=settings.JOB_EXPIRATION_WEEKS
    )
    job_data.status = "F"
    job_data.save()

    return "OK"


def test_grapharna_run() -> str:

    input_path = "/shared/samples/engine_inputs/test.dotseq"
    output_dir = "/shared/samples/engine_outputs"

    os.makedirs(os.path.dirname(input_path), exist_ok=True)

    tekst = ">job-test\nCGCGGAACG CGGGACGCG\n((((...(( ))...))))"
    with open(input_path, "w") as f:
        f.write(tekst)

    engine_test_url = settings.ENGINE_TEST_URL

    response = requests.post(
        engine_test_url,
    )

    assert response.status_code == 200, f"Error: {response.text}"

    sleep(1)

    data = response.json()
    output_path_pdb = data.get("pdbFilePath")
    output_path_json = data.get("jsonFilePath")

    assert os.path.exists(output_path_pdb) and os.path.exists(
        output_path_json
    ), "Couldn't find file"

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
