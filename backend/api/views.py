from pathlib import Path
from django.conf import settings
from webapp.hashing_tools import hash_uuid
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from typing import Optional, Any
import random
from datetime import date, timedelta
from webapp.models import Job, JobResults, ExampleStructures
from webapp.tasks import run_grapharna_task, send_email_task
from uuid import UUID, uuid4
import os
from django.db.models.query import QuerySet
from api.validation_tools import RnaValidator
from rest_framework.pagination import PageNumberPagination
from .serializers import JobSerializer
from django.core.files.uploadedfile import UploadedFile
from .api_docs import (
    process_request_data_schema,
    validate_rna_schema,
    get_results_schema,
    get_suggested_seed_and_job_name_schema,
    download_zip_file_schema,
    job_pagination_schema,
    setup_test_job_schema,
    setup_test_job_results_schema,
    cleanup_test_jobs_schema,
    process_example_request_data_schema,
)

import zipfile
import io
from django.http import HttpResponse
from api.INF_F1 import CalculateF1Inf, dotbracketToPairs
from django.core.files import File
from django.utils import timezone


@setup_test_job_schema
@api_view(["POST"])
def SetupTestJob(request: Request) -> Response:
    fasta_file_name: Optional[str] = request.data.get("fasta_file_name")
    seed = request.data.get("seed")
    email: Optional[str] = request.data.get("email")
    job_alternative_conformations = request.data.get("alternative_conformations")
    job_name = request.data.get("job_name")
    job_status = request.data.get("job_status")
    file_path = Path(f"/app/test_files/{fasta_file_name}")
    sum_processing_time = request.data.get("sum_processing_time")
    try:
        with open(file_path, "rb") as f:
            job = Job.objects.create(
                uid=uuid4(),
                hashed_uid=hash_uuid(str(uuid4())),
                input_structure=File(f, name=fasta_file_name),
                seed=seed,
                job_name=job_name,
                email=email,
                status=job_status,
                alternative_conformations=job_alternative_conformations,
                sum_processing_time=timedelta(seconds=int(sum_processing_time)),
            )
        return Response(
            {
                "success": True,
                "message": "Test data setup completed.",
                "job_uuid": job.uid,
                "job_hashed_uid": job.hashed_uid,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@setup_test_job_results_schema
@api_view(["POST"])
def SetupTestJobResults(request: Request) -> Response:
    job_uid = request.data.get("job_uid")
    result_files = {
        "result_secondary_structure_dotseq": request.data.get(
            "result_secondary_structure_dotseq"
        ),
        "result_secondary_structure_svg": request.data.get(
            "result_secondary_structure_svg"
        ),
        "result_tertiary_structure": request.data.get("result_tertiary_structure"),
        "result_arc_diagram": request.data.get("result_arc_diagram"),
    }
    f1 = request.data.get("f1")
    inf = request.data.get("inf")
    processing_time = request.data.get("processing_time")

    if not job_uid:
        return Response(
            {"success": False, "error": "Missing required field: job_uid."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        job = Job.objects.get(uid=job_uid)
    except Job.DoesNotExist:
        return Response(
            {"success": False, "error": "Job not found with provided UID."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        job_results = JobResults.objects.create(
            job=job,
            f1=f1,
            inf=inf,
            processing_time=timedelta(seconds=int(processing_time)),
        )

        for field, filename in result_files.items():
            if filename:
                file_path = Path(f"/app/test_files/{filename}")
                with open(file_path, "rb") as f:
                    django_file = File(f, name=filename)
                    getattr(job_results, field).save(filename, django_file, save=False)

        job_results.save()

        return Response(
            {"success": True, "message": "JobResults test data setup completed."},
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@cleanup_test_jobs_schema
@api_view(["DELETE"])
def CleanupTestData(request: Request) -> Response:
    huids = request.data.get("hashed_uids")

    if not huids or not isinstance(huids, list):
        return Response(
            {"success": False, "error": "Missing or invalid 'hashed_uids' list."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        jobs_to_delete = Job.objects.filter(hashed_uid__in=huids)
        count = jobs_to_delete.count()

        if count == 0:
            return Response(
                {
                    "success": False,
                    "error": "No jobs found matching provided hashed_uids.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        for job in jobs_to_delete:
            results = JobResults.objects.filter(job=job)
            for result in results:
                result.delete()

            if job.input_structure:
                job.input_structure.delete(save=False)
            job.delete()

        return Response(
            {
                "success": True,
                "message": f"Deleted {count} record(s) for provided hashed_uids.",
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@download_zip_file_schema
@api_view(["GET"])
def DownloadZipFile(request: Request) -> HttpResponse:
    uidh = request.query_params.get("uidh")
    if not uidh:
        return HttpResponse("Missing uidh", status=400)
    try:
        job = Job.objects.get(hashed_uid=uidh)
    except Job.DoesNotExist:
        return HttpResponse("Job not found", status=404)

    if job.status != "C":
        return HttpResponse("Job is not finished", status=400)
    instances = JobResults.objects.filter(job=job)
    zip_buffer = io.BytesIO()
    job_name_path = job.job_name.replace(" ", "_")
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for idx, instance in enumerate(instances, start=1):
            filePathSecondaryDotseq = instance.result_secondary_structure_dotseq.path
            filePathSecondarySvg = instance.result_secondary_structure_svg.path
            filePathTertiary = instance.result_tertiary_structure.path
            filePathArc = instance.result_arc_diagram.path

            if not os.path.exists(filePathArc):
                return HttpResponse("File does not exist", status=404)
            if not os.path.exists(filePathSecondaryDotseq):
                return HttpResponse("File does not exist", status=404)
            if not os.path.exists(filePathSecondarySvg):
                return HttpResponse("File does not exist", status=404)
            if not os.path.exists(filePathTertiary):
                return HttpResponse("File does not exist", status=404)

            folder_name = f"{job_name_path}/instance_{idx}"
            name_dotseq = os.path.basename(
                instance.result_secondary_structure_dotseq.name
            )
            name_svg = os.path.basename(instance.result_secondary_structure_svg.name)
            name_ter = os.path.basename(instance.result_tertiary_structure.name)
            name_arc = os.path.basename(instance.result_arc_diagram.name)

            with open(filePathSecondaryDotseq, "rb") as f:
                zip_file.writestr(f"{folder_name}/{name_dotseq}", f.read())
            with open(filePathSecondarySvg, "rb") as f:
                zip_file.writestr(f"{folder_name}/{name_svg}", f.read())
            with open(filePathTertiary, "rb") as f:
                zip_file.writestr(f"{folder_name}/{name_ter}", f.read())
            with open(filePathArc, "rb") as f:
                zip_file.writestr(f"{folder_name}/{name_arc}", f.read())

    zip_buffer.seek(0)
    response = HttpResponse(zip_buffer.read(), content_type="application/zip")
    response["Content-Disposition"] = (
        f'attachment; filename="{job_name_path}-result.zip"'
    )
    return response


def ValidateEmailAddress(email: Optional[str]) -> bool:
    if email is None:
        return True
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


@validate_rna_schema
@api_view(["POST"])
def PostRnaValidation(request: Request) -> Response:
    """Validates RNA sequence and dot-bracket notation, returns validation results and suggested fix if applicable."""
    fasta_raw: Optional[str] = request.data.get("fasta_raw")
    fasta_file: Optional[UploadedFile] = request.data.get("fasta_file")
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

    validator: RnaValidator = RnaValidator(sequence_raw)
    results: dict = validator.ValidateRna()

    if results["Validation Result"]:
        results["Validated RNA"] = results["Validated RNA"].replace(
            " ", results["strandSeparator"]
        )
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

post
seed: 123456
job_name:my_rna_job
email:user@example.com
alternative_conformations: 4
fasta_raw:CGCGGAACG CGGGACGCX↵((((...(( ))...))))
response
{
    "Validation Result": false,
    "Error List": [
        "RNA contains invalid characters: X"
    ],
    "Validated RNA": "",
    "Mismatching Brackets": [],
    "Incorrect Pairs": [],
    "Fix Suggested": false
}
"""


@process_request_data_schema
@api_view(["POST"])
def ProcessRequestData(request: Request) -> Response:
    """Allows for uploading RNA data via raw text or file, validates it, creates a Job and triggers the processing task.
    If RNA validation fails but a fix is possible, job will be created with that fix. If email address is provided, a notification email will be sent (on job creation and on job compleation).
    """
    fasta_raw: Optional[str] = request.data.get("fasta_raw")
    fasta_file: Optional[UploadedFile] = request.FILES.get("fasta_file")
    seed_raw = request.data.get("seed")
    jobName: Optional[str] = request.data.get("job_name")
    email: Optional[str] = request.data.get("email")
    job_alternative_conformations = request.data.get("alternative_conformations")
    today_str = date.today().strftime("%Y%m%d")
    count: int = Job.objects.filter(job_name__startswith=f"job-{today_str}").count()

    if fasta_file is not None:
        if not fasta_file.name or not fasta_file.name.endswith(".fasta"):
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

    if job_alternative_conformations is None:
        job_alternative_conformations = 1

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
    hashed_uid: str = hash_uuid(str(job_uuid))

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
        hashed_uid=hashed_uid,
        input_structure=relative_path,
        seed=seed,
        job_name=jobName,
        email=email,
        status="Q",
        alternative_conformations=job_alternative_conformations,
        strand_separator=validationResult["strandSeparator"],
    )

    run_grapharna_task.delay(job.uid)

    if email:
        url = f"{settings.RESULT_BASE_URL}?uidh={job.hashed_uid}"
        send_email_task.delay(
            receiver_email=email,
            template_path=settings.TEMPLATE_PATH_JOB_CREATED,
            title=settings.TITLE_JOB_CREATED,
            url=url,
        )
        return Response(
            {
                "success": True,
                "Job": job.job_name,
                "email_sent": True,
                "job_hash": job.hashed_uid,
            },
            status=status.HTTP_200_OK,
        )
    else:
        return Response(
            {
                "success": True,
                "Job": job.job_name,
                "email_sent": False,
                "job_hash": job.hashed_uid,
            },
            status=status.HTTP_200_OK,
        )


@process_example_request_data_schema
@api_view(["POST"])
def ProcessExampleRequestData(request: Request) -> Response:
    """Returns the results of a given example RNA input. If no results exist, creates the example job and its results."""
    fasta_raw: Optional[str] = request.data.get("fasta_raw")
    fasta_file: Optional[UploadedFile] = request.FILES.get("fasta_file")
    email: Optional[str] = request.data.get("email")
    example_number: int = request.data.get("example_number")

    if not ValidateEmailAddress(email):
        return Response(
            {"success": False, "error": "Incorrect email format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    example: ExampleStructures | None = ExampleStructures.objects.filter(id=example_number).first()
    if example is not None and isinstance(example.job, Job):
        example_uidh = example.job.hashed_uid
    else:
        example_uidh = None

    if example_uidh:
        send_email_task.delay(  # if email is provided, send notification
            receiver_email=email,
            template_path=settings.TEMPLATE_PATH_JOB_FINISHED,
            title=settings.TITLE_JOB_FINISHED,
            url=f"{settings.RESULT_BASE_URL}?uidh={example_uidh}",
        )
        return Response(
            {"success": True, "uidh": example_uidh},
            status=status.HTTP_200_OK,
        )
    else:
        if fasta_raw is None and fasta_file is None:
            return Response(
                {"success": False, "error": "Missing RNA data."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif fasta_raw is not None and fasta_file is not None:
            return Response(
                {
                    "success": False,
                    "error": "RNA can be send via text or file not both.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif fasta_raw is None and fasta_file is not None:
            sequence_raw = fasta_file.read().decode("utf-8")
        else:
            assert fasta_raw is not None
            sequence_raw = fasta_raw

        validator: RnaValidator = RnaValidator(sequence_raw)
        validationResult = validator.ValidateRna()

        if not validationResult["Validation Result"]:
            return Response(
                validationResult,
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        job_uuid: UUID = uuid4()
        hashed_uid: str = hash_uuid(str(job_uuid))

        input_dir: str = "/shared/samples/engine_inputs"
        os.makedirs(input_dir, exist_ok=True)
        input_filename: str = f"{str(job_uuid)}.dotseq"
        input_filepath: str = os.path.join(input_dir, input_filename)
        jobName = f"example_job_{example_number}"
        seed = 1
        dotseq_data = f">{jobName}\n{validationResult['Validated RNA']}"

        with open(input_filepath, "w") as f:
            f.write(dotseq_data)

        relative_path = os.path.relpath(input_filepath, settings.MEDIA_ROOT)
        job = Job.objects.create(
            uid=job_uuid,
            hashed_uid=hashed_uid,
            input_structure=relative_path,
            seed=seed,
            job_name=jobName,
            status="Q",
            alternative_conformations=1,
            strand_separator=validationResult["strandSeparator"],
        )

        run_grapharna_task.delay(
            job.uid, is_example=True, example_number=example_number
        )
        send_email_task.delay(  # if email is provided, send notification (no email for finished job, its not stored in the model)
            receiver_email=email,
            template_path=settings.TEMPLATE_PATH_JOB_CREATED,
            title=settings.TITLE_JOB_CREATED,
            url=f"{settings.RESULT_BASE_URL}?uidh={job.hashed_uid}",
        )
        ExampleStructures.objects.create(id=example_number, job=job)
        return Response(
            {
                "success": True,
                "uidh": job.hashed_uid,
            },
            status=status.HTTP_200_OK,
        )


@get_results_schema
@api_view(["GET"])
def GetResults(request: Request) -> Response:
    """Returns details and list of results of a job with a given hashed uid"""
    uid_param: str = request.GET.get("uidh")

    if not uid_param:
        return Response(
            {"success": False, "error": "Missing uidh parameter."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        job: Job = Job.objects.get(hashed_uid__exact=uid_param)
    except Job.DoesNotExist:
        return Response(
            {"success": False, "error": "Job doesn't exist"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    results_list: list = []

    if job.status == "C":
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
            "job_seed": job.seed,
        }
    )


@get_suggested_seed_and_job_name_schema
@api_view(["GET"])
def GetSuggestedSeedAndJobName(request: Request) -> Response:
    """Generates and returns a random seed and a suggested job name based on current date and existing jobs."""
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


class JobPageNumberPagination(PageNumberPagination):
    page_size = settings.REST_FRAMEWORK.get("PAGE_SIZE", 10)
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data: Any) -> Response:
        return Response(
            {
                "count": self.page.paginator.count,
                "page_size": self.get_page_size(self.request),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )


@job_pagination_schema
@api_view(["GET"])
def getActiveJobs(request: Request) -> Response:
    data = Job.objects.filter(status__in=["S", "Q", "R"]).order_by("created_at", "uid")
    paginator = JobPageNumberPagination()
    page = paginator.paginate_queryset(data, request)
    if page is not None:
        serializer = JobSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    return paginator.get_paginated_response([])


@job_pagination_schema
@api_view(["GET"])
def getFinishedJobs(request: Request) -> Response:
    now = timezone.now()
    one_day_ago = now - timedelta(hours=24)

    data = Job.objects.filter(
        status__in=["C", "E"], created_at__gte=one_day_ago
    ).order_by("created_at")
    if not data.exists():
        five_days_ago = now - timedelta(days=5)
        data = Job.objects.filter(
            status__in=["C", "E"], created_at__gte=five_days_ago
        ).order_by("created_at")
    paginator = JobPageNumberPagination()
    page = paginator.paginate_queryset(data, request)
    if page is not None:
        serializer = JobSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    return paginator.get_paginated_response([])


def getInf_F1(request: Request) -> Response:

    uid = request.query_params.get("uid")
    if not uid:
        return Response({"success": False, "error": "uid missing"}, status=400)
    job = Job.objects.get(uid=uid)

    jobResult = JobResults.objects.get(job=job)

    try:
        target = job.input_structure.path
        model = jobResult.result_secondary_structure_dotseq.path
    except FileNotFoundError:
        return Response({"success": False, "error": "File not found"}, status=404)
    with open(target) as f:
        target_dict = dotbracketToPairs(f.read())
    with open(model) as f:
        model_dict = dotbracketToPairs(f.read())
    values = CalculateF1Inf(target_dict["correctPairs"], model_dict["correctPairs"])
    return Response({"success": True, "Dane:": {values}})


@api_view(["GET"])
def healthcheck(request: Request) -> Response:
    return Response(status=status.HTTP_200_OK)
