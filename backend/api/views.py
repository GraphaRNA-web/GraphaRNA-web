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
from django.core.files import File
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
    filePathSecondary = instance.result_secondary_structure.path
    filePathTertiary = instance.result_tertiary_structure.path
    if not os.path.exists(filePathSecondary):
        return HttpResponse("File does not exist", status=404)
    if not os.path.exists(filePathTertiary):
        return HttpResponse("File does not exist", status=404)


    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        with open(filePathSecondary, "rb") as f:
            zip_file.writestr(instance.result_secondary_structure.name, f.read())
        with open(filePathTertiary, "rb") as f:
            zip_file.writestr(instance.result_tertiary_structure.name, f.read())
    # with open(filePath, "rb") as f: wystaczy ze zdublujesz i podasz odpowiedni plik zeby dodac do zipa
    #             zip_file.writestr(f"{job.job_name}-results_file.pdb", f.read())

    #     result_secondary_structure: models.FileField = models.FileField(null=True)
    # result_tertiary_structure: models.FileField = models.FileField()
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


def RnaValidation(rna: Optional[str], brackets: Optional[str]) -> bool:
    valid_chars = set("AUGC ")
    if rna is None or any(char not in valid_chars for char in rna.upper()):
        return False
    valid_brackets = set("(). ")
    if brackets is None or any(char not in valid_brackets for char in brackets) or brackets.strip() == "":
        return False
    return True


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






@api_view(["POST"])
def PostRnaValidation(request: Request) -> Response:
    rna: Optional[str] = request.data.get("RNA")
    brackets: Optional[str] = request.data.get("brackets")

    if not rna:
        return Response(
            {"success": False, "error": "No data."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not RnaValidation(rna,brackets):
        return Response(
            {"success": False, "error": "Invalid RNA sequence."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"success": True, "message": "RNA sequence is valid."},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def ProcessRequestData(request: Request) -> Response:
    bracket: Optional[str] = request.data.get("bracket")
    rna: Optional[str] = request.data.get("RNA")
    seed_raw = request.data.get("seed")
    jobName: Optional[str] = request.data.get("job_name")
    email: Optional[str] = request.data.get("email")
    job_alternative_conformations = request.data.get("alternative_conformations")
    today_str = date.today().strftime("%Y%m%d")
    count: int = Job.objects.filter(job_name__startswith=f"job-{today_str}").count()
    rnaFile: Optional[File] = request.FILES.get('file')

    if not rnaFile and not rna:
        return Response({'error': 'Invalid request. Please send text or file.'}, status=status.HTTP_400_BAD_REQUEST)
    if rnaFile and (rna or bracket):
        return Response({'error': 'Invalid request. Please dont send file and text'}, status=status.HTTP_400_BAD_REQUEST)

    if rnaFile is not None:
        if not rnaFile.name or not rnaFile.name.endswith('.fasta'):
            raise ValidationError("File have to be .fasta")
        content = rnaFile.read().decode()
        lines = content.strip().splitlines()
        rna = lines[0].strip()
        bracket = lines[1].strip()
    


    try:
        seed: int = int(seed_raw)
    except (TypeError, ValueError):
        seed = random.randint(1, 1000000000)

    if not RnaValidation(rna,bracket):
        return Response(
            {"success": False, "error": "Invalid RNA sequence or brackets."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not ValidateEmailAddress(email):
        return Response(
            {"success": False, "error": "Invalid email."},
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

    if not RnaValidation(rna,bracket):
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
