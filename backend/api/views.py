from django.conf import settings
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
from webapp.tasks import run_grapharna_task, test_grapharna_run
from uuid import UUID, uuid4
import os
from django.db.models.query import QuerySet
from api.validation_tools import RnaValidation, FastaFileParse


def ValidateEmailAddress(email: Optional[str]) -> bool:
    if email is None:
        return False
    validator = EmailValidator()
    try:
        validator(email)
        return True
    except ValidationError:
        return False


"""
example post
{
"RNA": ">example1\n(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))....\ngCGGAUUUAgCUCAGuuGGGAGAGCgCCAGAcUgAAgAucUGGAGgUCcUGUGuuCGaUCCACAGAAUUCGCACCA",
}"""
@api_view(["POST"])
def PostRnaValidation(request: Request) -> Response:
    rna: Optional[str] = request.data.get("RNA")
    if not rna:
        return Response(
            {"success": False, "error": "Brak danych RNA."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    validationResults = RnaValidation(FastaFileParse(rna))

    return Response(
        {
            "success": validationResults[0],
            "error": validationResults[1],
            "suggested_fix": validationResults[2],
            "invalid_characters": validationResults[3],
            "invalid_brackets": validationResults[4],
            "mismatching_brackets": validationResults[5],
            "incorrect_pairs": validationResults[6],
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


"""
example post
{
  "bracket": "((((...(( ))...))))",
  "RNA": "CGCGGAACG CGGGACGCG",
  "seed": 123456,
  "job_name": "my_rna_job",
  "email": "user@example.com",
  "alternative_conformations": "2"
}"""
"""
example post
{
  "bracket": "(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))....",
  "RNA": "gCGGAUUUAgCUCAGuuGGGAGAGCgCCAGAcUgAAgAucUGGAGgUCcUGUGuuCGaUCCACAGAAUUCGCACCA",
  "seed": 123456,
  "job_name": "my_rna_job",
  "email": "user@example.com",
  "alternative_conformations": "1"
}"""
@api_view(["POST"])
def ProcessRequestData(request: Request) -> Response:
    fasta_raw: Optional[str] = request.data.get("fasta_raw")
    seed_raw = request.data.get("seed")
    jobName: Optional[str] = request.data.get("job_name")
    email: Optional[str] = request.data.get("email")
    job_alternative_conformations = request.data.get("alternative_conformations")
    today_str = date.today().strftime("%Y%m%d")
    count: int = Job.objects.filter(job_name__startswith=f"job-{today_str}").count()

    try:
        seed: int = int(seed_raw)
    except (TypeError, ValueError):
        seed = random.randint(1, 1000000000)
    if fasta_raw:
        fasta_parsed: str = FastaFileParse(fasta_raw)
    else:
        return Response(
            {"success": False, "error": "Missing Fasta Data"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    #Pytanie czy powinnismy walidowac, mimo ze mamy osobny endpoint do walidacni
    """if not RnaValidation(fasta_parsed):
        return Response(
            {"success": False, "error": "Niepoprawna sekwencja RNA."},
            status=status.HTTP_400_BAD_REQUEST,
        )"""

    if not ValidateEmailAddress(email):
        return Response(
            {"success": False, "error": "Niepoprawna forma emaila."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not jobName:
        jobName = f"job-{today_str}-{count}"

    # Manually create uuid (needed for file name before record creation)
    job_uuid: UUID = uuid4()

    # Save rna to .dotseq file
    input_dir: str = "/shared/samples/engine_inputs"
    os.makedirs(input_dir, exist_ok=True)
    input_filename: str = f"{str(job_uuid)}.dotseq"
    input_filepath: str = os.path.join(input_dir, input_filename)

    dotseq_data = f">{jobName}\n{fasta_parsed}"

    with open(input_filepath, "w") as f:
        f.write(dotseq_data)

    relative_path = os.path.relpath(input_filepath, settings.MEDIA_ROOT)

    job = Job.objects.create(
        uid=job_uuid,
        input_structure=relative_path,
        seed=seed,
        job_name=jobName,
        email=email,
        status="Q",
        alternative_conformations = job_alternative_conformations
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

    
    job_results_qs: QuerySet = JobResults.objects.filter(job__exact=job)

    results_list = []
    for result in job_results_qs:
        try:
            result_text = result.result_tetriary_structure.read().decode("utf-8")
            processing_time = result.completed_at - job.created_at
            results_list.append({
                "completed_at": result.completed_at,
                "result_tetriary_structure": result_text,
                "processing_time": processing_time,
            })
        except Exception as e:
            results_list.append({
                "completed_at": None,
                "result_tetriary_structure": f"[Error reading file: {str(e)}]",
                "processing_time": None,
            })

    return Response(
        {
            "success": True,
            "status": job.status,
            "job_name": job.job_name,
            "input_structure": job.input_structure.read().decode("utf-8"),
            "seed": job.seed,
            "created_at": job.created_at,
            "result_list": results_list
        }
    )



@api_view(["GET"])
def GetSuggestedSeedAndJobName(request: Request) -> Response:

    seed = random.randint(1, 100_000_000_0)
    today_str = date.today().strftime("%Y%m%d")
    count: int = Job.objects.filter(job_name__startswith=f"job-{today_str}").count()
    jobName = f"job-{today_str}-{count}"


    return Response(
        {"success": True, "seed": seed, "job_name": jobName},
        status=status.HTTP_200_OK,
    )

@api_view(["GET"])
def hello_view(request: Request) -> Response:
    name: str = request.GET.get("name", "Guest")
    return Response({"message": f"Cześć, {name}!"})


@api_view(["POST"])
def TestRequest(request: Request) -> Response:
    bracket: Optional[str] = request.data.get("bracket")
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

    # Manually create uuid (needed for file name before record creation)
    job_uuid: UUID = uuid4()

    # Save rna to .dotseq file
    input_dir: str = "/shared/samples/engine_inputs"
    os.makedirs(input_dir, exist_ok=True)
    input_filename: str = f"{str(job_uuid)}.dotseq"
    input_filepath: str = os.path.join(input_dir, input_filename)

    dotseq_data = f">{jobName}\n{rna}\n{bracket}"

    with open(input_filepath, "w") as f:
        f.write(dotseq_data)

    relative_path = os.path.relpath(input_filepath, settings.MEDIA_ROOT)

    job = Job.objects.create(
        uid=job_uuid,
        input_structure=relative_path,
        seed=seed,
        job_name=jobName,
        email=email,
        status="Q",
    )

    return Response({"success": True, "Job": job.job_name})


@api_view(["GET"])
def healthcheck(request: Request) -> Response:
    return Response(status=status.HTTP_200_OK)


@api_view(["POST"])
def testEngineRun(request : Request) -> Response:
    response = test_grapharna_run()
    assert response == "OK"
    return Response({"success": True})
