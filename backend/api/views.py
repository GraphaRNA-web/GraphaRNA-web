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
from api.validation_tools import RnaValidator
from django.core.files.uploadedfile import UploadedFile 
# from django.core.files import File
import zipfile
import io
from django.http import HttpResponse


@api_view(["GET"])
def DownloadZipFile(request:Request)->HttpResponse:
    uuid = request.query_params.get("uuid")
    if not uuid:
        return HttpResponse("UUID error", status=400)
    try:
        job = Job.objects.get(pk=uuid)
    except Job.DoesNotExist:
        return HttpResponse("Job not found", status=404)
    
    if job.status != "F":
        return HttpResponse("Job is not finished", status=400)
    instance = JobResults.objects.get(job=job)
    filePathSecondaryDotseq = instance.result_secondary_structure_dotseq.path
    filePathSecondarySvg = instance.result_secondary_structure_svg.path
    filePathTertiary = instance.result_tertiary_structure.path
    if not os.path.exists(filePathSecondaryDotseq):
        return HttpResponse("File does not exist", status=404)
    if not os.path.exists(filePathSecondarySvg):
        return HttpResponse("File does not exist", status=404)
    if not os.path.exists(filePathTertiary):
        return HttpResponse("File does not exist", status=404)


    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        with open(filePathSecondaryDotseq, "rb") as f:
            zip_file.writestr(instance.result_secondary_structure_dotseq.name, f.read())
        with open(filePathSecondarySvg, "rb") as f:
            zip_file.writestr(instance.result_secondary_structure_svg.name, f.read())
        with open(filePathTertiary, "rb") as f:
            zip_file.writestr(instance.result_tertiary_structure.name, f.read())
    zip_buffer.seek(0)

    response = HttpResponse(zip_buffer.read(), content_type="application/zip")
    response["Content-Disposition"] = f'attachment; filename="{job.job_name}-result.zip"'
    return response

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
"RNA": ">example1\ngCGGAUUUAgCUCAGuuGGGAGAGCgCCAGAcUgAAgAucUGGAGgUCcUGUGuuCGaUCCACAGAAUUCGCACCA\n(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))....",
}
response
{
    "Validation Result": true,
    "Error List": [],
    "Validated RNA": "GCGGAUUUAGCUCAGUUGGGAGAGCGCCAGACUGAAGAUCUGGAGGUCCUGUGUUCGAUCCACAGAAUUCGCACCA\n(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))....",
    "Mismatching Brackets": [], (list of indices of unclosed brackets)
    "Incorrect Pairs": [], (list of tuples containing indices of incorrect pairs)
    "Fix Suggested": false
}
"""


@api_view(["POST"])
def PostRnaValidation(request: Request) -> Response:
    rna = request.data.get("RNA")
    if rna is None:
        return Response(
            {"success": False, "error": "No data."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    rna_str: str = rna
    validator: RnaValidator = RnaValidator(rna_str)
    results: dict = validator.ValidateRna()

    if results["Validation Result"]:

        return Response(
            results,
            status=status.HTTP_200_OK,
        )
    else:
        return Response(
            results,
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )


"""
example post
{
  "fasta_raw": "CGCGGAACG CGGGACGCG\n((((...(( ))...))))",
  "seed": 123456,
  "job_name": "my_rna_job",
  "email": "user@example.com",
  "alternative_conformations": "2"
}
response
{
    "success": true,
    "Job": "my_rna_job"
}
"""
"""
example post
{
  "fasta_raw": "gCGGAUUUAgCUCAGuuGGGAGAGCgCCAGAcUgAAgAucUGGAGgUCcUGUGuuCGaUCCACAGAAUUCGCACCA\n(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))....",
  "seed": 123456,
  "job_name": "my_rna_job",
  "email": "user@example.com",
  "alternative_conformations": "1"
}
response
{
    "success": true,
    "Job": "my_rna_job"
}
"""


@api_view(["POST"])
def ProcessRequestData(request: Request) -> Response:
    """Allows for uploading .fasta files"""
    fasta_raw: Optional[str] = request.data.get("fasta_raw")
    fasta_file: Optional[UploadedFile] = request.FILES.get("fasta_file")
    # fasta_files = request.FILES.getlist("fasta_file")
    seed_raw = request.data.get("seed")
    jobName: Optional[str] = request.data.get("job_name")
    email: Optional[str] = request.data.get("email")
    job_alternative_conformations = request.data.get("alternative_conformations")
    today_str = date.today().strftime("%Y%m%d")
    count: int = Job.objects.filter(job_name__startswith=f"job-{today_str}").count()

    if fasta_file is not None:
        if not fasta_file.name or not fasta_file.name.endswith('.fasta'):
            raise ValidationError("File have to be .fasta")
        
    sequence_raw: str = ""

    if fasta_raw is None and fasta_file is None:
        return Response(
            {"success": False, "error": "Missing RNA data."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    elif fasta_raw is not None and fasta_file is not None:
        return Response(
            {"success": False, "error": "RNA can be send via text or file not both."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    elif fasta_raw is None and fasta_file is not None:
        sequence_raw = fasta_file.read().decode("utf-8")
    else:
        assert fasta_raw is not None
        sequence_raw = fasta_raw

    try:
        seed: int = int(seed_raw)
    except (TypeError, ValueError):
        seed = random.randint(1, 1000000000)

    validator: RnaValidator = RnaValidator(sequence_raw)
    validationResult = validator.ValidateRna()

    if not validationResult["Validation Result"]:
        return Response(
            validationResult,
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if not ValidateEmailAddress(email):
        return Response(
            {"success": False, "error": "Incorrect email format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not jobName:
        jobName = f"job-{today_str}-{count}"

    job_uuid: UUID = uuid4()

    input_dir: str = "/shared/samples/engine_inputs"
    os.makedirs(input_dir, exist_ok=True)
    input_filename: str = f"{str(job_uuid)}.dotseq"
    input_filepath: str = os.path.join(input_dir, input_filename)

    dotseq_data = f">{jobName}\n{validationResult['Validated RNA']}"

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
        alternative_conformations=job_alternative_conformations,
    )

    run_grapharna_task.delay(job.uid)

    return Response({"success": True, "Job": job.job_name})


@api_view(["GET"])
def GetResults(request: Request) -> Response:
    """Returns details and list of results of a job with a given uid"""
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

    results_list: list = []

    if job.status == "F":
        job_results_qs: QuerySet = JobResults.objects.filter(job__exact=job)

        seed_counter: int = job.seed

        for result in job_results_qs:
            try:
                result_tertiatiary_structure: str = (
                    result.result_tertiary_structure.read().decode("utf-8")
                )
            except Exception as e:
                result_tertiatiary_structure = f"[Error reading file: {str(e)}]"

            try:
                result_secondary_structure_dotseq: str = (
                    result.result_secondary_structure_dotseq.read().decode("utf-8")
                )
            except Exception as e:
                result_secondary_structure_dotseq = f"[Error reading file: {str(e)}]"

            try:
                result_secondary_structure_svg: str = (
                    result.result_secondary_structure_svg.read().decode("utf-8")
                )
            except Exception as e:
                result_secondary_structure_svg = f"[Error reading file: {str(e)}]"

            try:
                result_arc_diagram: str = result.result_arc_diagram.read().decode(
                    "utf-8"
                )
            except Exception as e:
                result_arc_diagram = f"[Error reading file: {str(e)}]"

            results_list.append(
                {
                    "completed_at": result.completed_at,
                    "result_tetriary_structure": result_tertiatiary_structure,
                    "result_secondary_structure_dotseq": result_secondary_structure_dotseq,
                    "result_secondary_structure_svg": result_secondary_structure_svg,
                    "result_arc_diagram": result_arc_diagram,
                    "f1": result.f1,
                    "inf": result.inf,
                    "seed": seed_counter,
                    "processing_time": result.processing_time,
                }
            )
            seed_counter += 1

    try:
        input_structure: str = job.input_structure.read().decode("utf-8")
    except Exception as e:
        input_structure = f"[Error reading file: {str(e)}]"

    return Response(
        {
            "success": True,
            "status": job.status,
            "job_name": job.job_name,
            "input_structure": input_structure,
            "created_at": job.created_at,
            "sum_processing_time": job.sum_processing_time,
            "result_list": results_list,
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

    """if not RnaValidation(rna):
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
def testEngineRun(request: Request) -> Response:
    response = test_grapharna_run()
    assert response == "OK"
    return Response({"success": True})
