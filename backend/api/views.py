from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from typing import Optional
import random
from datetime import date
from webapp.models import Job, JobResults
from webapp.tasks import run_grapharna_task
from uuid import UUID


def ValidateEmailAddress(email: Optional[str]) -> bool:
    if email is None:
        return False
    validator = EmailValidator()
    try:
        validator(email)
        return True
    except ValidationError:
        return False


def RnaValidation(rna: Optional[str]) -> bool:
    valid_chars = set("AUGC")
    if rna is None or any(char not in valid_chars for char in rna.upper()):
        return False
    return True


@api_view(["POST"])
def PostRnaValidation(request: Request) -> Response:
    rna: Optional[str] = request.data.get("RNA")

    if not rna:
        return Response(
            {"success": False, "error": "Brak danych RNA."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not RnaValidation(rna):
        return Response(
            {"success": False, "error": "Niepoprawna sekwencja RNA."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"success": True, "message": "Sekwencja RNA jest poprawna."},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def ProcessRequestData(request: Request) -> Response:
    rna: Optional[str] = request.data.get("RNA")
    seed_raw = request.data.get("seed")
    jobName: Optional[str] = request.data.get("job_name")
    email: Optional[str] = request.data.get("email")
    today_str = date.today().strftime("%Y%m%d")
    count: int = Job.objects.filter(job_name__startswith=f"job-{today_str}").count()

    try:
        seed: int = int(seed_raw)
    except (TypeError, ValueError):
        seed = random.randint(1, 1000000000)

    if not RnaValidation(rna):
        return Response(
            {"success": False, "error": "Niepoprawna sekwencja RNA."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not ValidateEmailAddress(email):
        return Response(
            {"success": False, "error": "Niepoprawna forma emaila."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not jobName:
        jobName = f"job-{today_str}-{count}"

    job = Job.objects.create(

        input_structure=rna,
        seed=seed,
        job_name=jobName,
        email=email,
        status="Q"
    )

    run_grapharna_task.delay(job.uid)

    return Response({"success": True, "Job": job.job_name})


@api_view(["GET"])
def GetResults(request: Request) -> Response:
    uid_param: str = request.GET.get("uid")

    try:
        uid: UUID = UUID(uid_param)
    except (TypeError, ValueError):
        return Response(
            {"success": False, "error": "Invalid or missing UID"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        job: Job = Job.objects.get(uid__exact=uid)
    except Job.DoesNotExist:
        return Response(
            {"success": False, "error": "Job doesn't exist"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        job_results: JobResults = JobResults.objects.get(job__exact=job)
        return Response(
            {
                "success": True,
                "status": job.status,
                "job_name": job.job_name,
                "input_structure": job.input_structure,
                "seed": job.seed,
                "created_at": job.created_at,
                "completed_at": job_results.completed_at,
                "result_structure": job_results.result_structure,
                "processing_time": job_results.completed_at - job.created_at,
            }
        )
    except JobResults.DoesNotExist:
        return Response(
            {
                "success": True,
                "status": job.status,
                "job_name": job.job_name,
                "input_structure": job.input_structure,
                "seed": job.seed,
                "created_at": job.created_at,
            }
        )


@api_view(["GET"])
def hello_view(request: Request) -> Response:
    name: str = request.GET.get("name", "Guest")
    return Response({"message": f"Cześć, {name}!"})


@api_view(["GET"])
def healthcheck(request: Request) -> Response:
    return Response(status=status.HTTP_200_OK)
