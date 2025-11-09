from datetime import timedelta, datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from django.utils import timezone
from django.conf import settings
from .models import Job, JobResults
from time import sleep
from uuid import UUID
import requests
from celery import shared_task
from requests.exceptions import RequestException, HTTPError
import os
import json
from webapp.visualization_tools import (
    drawVARNAgraph,
    generateRchieDiagram,
    getDotBracket,
)
from celery.utils.log import get_task_logger
from django.db.models.query import QuerySet
from django.template import Template, Context
from api.INF_F1 import CalculateF1Inf, dotbracketToPairs


def log_to_file(message: str) -> None:
    ts = datetime.now().isoformat()
    with open("/shared/celery_debug.log", "a") as f:
        f.write(f"[{ts}] {message}\n")


@shared_task
def delete_expired_jobs_scheduler() -> None:
    delete_expired_jobs.delay()
    near_expiration_email_task.delay()


@shared_task(queue="maintenance")
def delete_expired_jobs() -> str:
    logger = get_task_logger(__name__)

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

    logger.info(f"Deleted {count} expired jobs.")
    return f"Deleted {count} expired jobs."


@shared_task(queue="email")
def near_expiration_email_task() -> None:
    logger = get_task_logger(__name__)

    now = timezone.now()
    near_expired_jobs = Job.objects.filter(expires_at__lte=now + timedelta(days=1))
    count = near_expired_jobs.count()

    for job in near_expired_jobs:
        if job.email:
            url = f"{settings.RESULT_BASE_URL}?uidh={job.hashed_uid}"
            expiration_date = job.expires_at.strftime("%d-%m-%Y %H:%M")
            send_email_task.delay(
                receiver_email=job.email,
                template_path=settings.TEMPLATE_PATH_JOB_NEAR_EXPIRATION,
                title=settings.TITLE_JOB_NEAR_EXPIRATION,
                url=url,
                expiration_date=expiration_date,
            )

    logger.info(f"Sent {count} near expiration emails.")


@shared_task(queue="email")
def send_email_task(
    receiver_email: str,
    template_path: str,
    title: str,
    url: str,
    expiration_date: str | None = None,
) -> bool:
    logger = get_task_logger(__name__)
    sender_email = settings.EMAIL_HOST_USER
    password = settings.EMAIL_HOST_PASSWORD

    template_path = os.path.join(settings.BASE_DIR, template_path)
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            template_content = f.read()
    except Exception as e:
        logger.error(f"Error loading template: {e}")
        return False
    template = Template(template_content)
    if expiration_date:
        html_content = template.render(
            Context({"url": url, "expiration_date": expiration_date})
        )
    else:
        html_content = template.render(Context({"url": url}))

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = receiver_email
    msg["Subject"] = title
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
        logger.info(f"Email sent to {receiver_email}")
        return True
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False


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

    try:
        job_data.status = "R"
        job_data.save()
    except Exception as e:
        logger.exception(f"Failed to update job status: {str(e)}")
        raise

    engine_url = settings.ENGINE_URL
    max_retries = settings.ENGINE_REQUEST_MAX_RETRIES
    retry_timeout = settings.ENGINE_REQUEST_RETRY_DELAY

    for i in range(job_data.alternative_conformations):
        processing_start: datetime = timezone.now()

        response = None
        retries: int = 0

        while retries < max_retries:
            try:
                response = requests.post(
                    engine_url,
                    data={"uuid": uuid_str, "seed": seed + i},
                )
                response.raise_for_status()

                logger.info(
                    f"Grapharna response status: {response.status_code}, body: {response.text}"
                )
                break
            except (RequestException, HTTPError) as e:
                logger.warning(
                    f"Engine request failed (attempt {retries + 1}/{max_retries}). "
                    f"Retrying in {retry_timeout}s. Error: {e}"
                )
                retries += 1
                sleep(retry_timeout)

        if response is None:
            logger.error("Grapharna API error: No response received after all retries.")
            job_data.status = "E"
            job_data.save()
            raise

        if response.status_code != 200:
            logger.error(f"Grapharna API error: {response.text}")
            job_data.status = "E"
            job_data.save()
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
            """"Get dotBracket from annotator and adjust it to match input structure strand breaks"""
            dotbracket_from_annotator = json_data.get("dotBracket", "").split("\n")
            reference_line = (
                job_data.input_structure.read().decode("utf-8").split("\n")[1]
            )
            job_data.input_structure.seek(0)

            split_indices = [i for i, char in enumerate(reference_line) if char == " "]
            if split_indices:
                new_dotbracket_list = []
                for line in dotbracket_from_annotator[1:]:
                    for index in sorted(split_indices):
                        line = line[:index] + job_data.strand_separator + line[index:]
                    new_dotbracket_list.append(line)
                dotbracket_from_annotator = [
                    dotbracket_from_annotator[0],
                    new_dotbracket_list[0],
                    new_dotbracket_list[1],
                ]
            dotbracket_from_annotator = "\n".join(dotbracket_from_annotator)
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

        if dotbracket_from_annotator:
            secondary_structure_svg_path = os.path.join(
                output_dir, f"{uuid_str}_{seed + i}.svg"
            )
            try:
                drawVARNAgraph(dotbracket_path, secondary_structure_svg_path)
            except Exception as e:
                logger.error(f"Failed to generate secondary structure: {e}")
                raise

            arc_diagram_path = os.path.join(
                output_dir, f"{uuid_str}_{seed + i}_arc.svg"
            )
            logger.info(f"{job_data.input_structure}")
            try:
                input_dotbracket = getDotBracket(job_data.input_structure.path)
                output_dotbracket = getDotBracket(dotbracket_path)
                generateRchieDiagram(
                    input_dotbracket, output_dotbracket, arc_diagram_path
                )

            except Exception as e:
                logger.error(f"Error generating arc diagram{e}")
                raise
            try:
                target = job_data.input_structure.path
                model = dotbracket_path
                with open(target) as f:
                    target_dict = dotbracketToPairs(f.read())
                with open(model) as f:
                    model_dict = dotbracketToPairs(f.read())
                values = CalculateF1Inf(
                    target_dict["correctPairs"], model_dict["correctPairs"]
                )
            except Exception as e:
                logger.error(f"Error with generating F1 and INF value {e}")
                raise

            relative_path_pdb = os.path.relpath(output_path_pdb, settings.MEDIA_ROOT)
            relative_path_dotseq = os.path.relpath(dotbracket_path, settings.MEDIA_ROOT)
            relative_path_svg = os.path.relpath(
                secondary_structure_svg_path, settings.MEDIA_ROOT
            )
            relative_path_arc = os.path.relpath(arc_diagram_path, settings.MEDIA_ROOT)

            processing_end: datetime = timezone.now()
            try:
                job_result_qs: QuerySet = JobResults.objects.filter(job__exact=job_data)
                if (
                    job_result_qs.count() + 1 == job_data.alternative_conformations
                ):  # check if current job result is the last one
                    job_data.sum_processing_time = sum(
                        [i.processing_time for i in job_result_qs], timedelta()
                    ) + (processing_end - processing_start)
                    job_data.save()
                JobResults.objects.create(
                    job=job_data,
                    result_tertiary_structure=relative_path_pdb,
                    result_secondary_structure_dotseq=relative_path_dotseq,
                    result_secondary_structure_svg=relative_path_svg,
                    result_arc_diagram=relative_path_arc,
                    completed_at=processing_end,
                    inf=values["inf"],
                    f1=values["f1"],
                    processing_time=(processing_end - processing_start),
                )
            except Exception as e:
                logger.exception(f"Failed to create JobResults: {str(e)}")
                raise
        else:
            processing_end = timezone.now()
            relative_path_pdb = os.path.relpath(output_path_pdb, settings.MEDIA_ROOT)

            try:
                job_result_qs = JobResults.objects.filter(job__exact=job_data)
                if (
                    job_result_qs.count() + 1 == job_data.alternative_conformations
                ):  # check if current job result is the last one
                    job_data.sum_processing_time = sum(
                        [i.processing_time for i in job_result_qs], timedelta()
                    ) + (processing_end - processing_start)
                    job_data.save()
                JobResults.objects.create(
                    job=job_data,
                    result_tertiary_structure=relative_path_pdb,
                    completed_at=processing_end,
                    processing_time=(processing_end - processing_start),
                )
            except Exception as e:
                logger.exception(f"Failed to create JobResults: {str(e)}")
                raise
    """Post-processing: replace spaces with dashes in input structure file"""
    if job_data.strand_separator == "-":
        try:
            with job_data.input_structure.open("r") as f:
                input_data = f.read().decode("utf-8")
                input_data = input_data.replace(" ", job_data.strand_separator)

            with job_data.input_structure.open("w") as f:
                f.write(input_data)
        except Exception as e:
            logger.error(f"Error replacing spaces in input structure: {e}")
            raise

    job_data.expires_at = timezone.now() + timedelta(
        weeks=settings.JOB_EXPIRATION_WEEKS
    )
    job_data.status = "C"
    job_data.save()

    if job_data.email:
        url = f"{settings.RESULT_BASE_URL}?uidh={job_data.hashed_uid}"
        send_email_task.delay(
            receiver_email=job_data.email,
            template_path=settings.TEMPLATE_PATH_JOB_FINISHED,
            title=settings.TITLE_JOB_FINISHED,
            url=url,
        )

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
