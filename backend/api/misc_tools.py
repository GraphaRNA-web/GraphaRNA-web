from django.conf import settings
from webapp.hashing_tools import hash_uuid
from rest_framework.response import Response
from rest_framework import status
from typing import Optional
from webapp.models import Job, ExampleStructures
from webapp.tasks import run_grapharna_task, send_email_task
from uuid import UUID, uuid4
import os
from api.validation_tools import RnaValidator


def CreateNewJob(
    sequence_raw: str,
    job_name: str,
    seed: int,
    alternative_conformations: int,
    email: Optional[str],
    example_number: Optional[int],
) -> Response:
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
    dotseq_data = f">{job_name}\n{validationResult['Validated RNA']}"

    with open(input_filepath, "w") as f:
        f.write(dotseq_data)

    relative_path = os.path.relpath(input_filepath, settings.MEDIA_ROOT)
    if example_number is not None:  # example job, do not store email
        job = Job.objects.create(
            uid=job_uuid,
            hashed_uid=hashed_uid,
            input_structure=relative_path,
            seed=seed,
            job_name=job_name,
            status="Q",
            alternative_conformations=alternative_conformations,
            strand_separator=validationResult["strandSeparator"],
        )
        ExampleStructures.objects.create(id=example_number, job=job)
    else:  # normal job, store email
        job = Job.objects.create(
            uid=job_uuid,
            hashed_uid=hashed_uid,
            input_structure=relative_path,
            seed=seed,
            job_name=job_name,
            email=email,
            status="Q",
            alternative_conformations=alternative_conformations,
            strand_separator=validationResult["strandSeparator"],
        )

    run_grapharna_task.delay(job.uid, example_number=example_number)
    if (
        email
    ):  # if email is provided, send notification (on job creation) for both example and normal jobs
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
                "uidh": job.hashed_uid,
            },
            status=status.HTTP_200_OK,
        )
    else:
        return Response(
            {
                "success": True,
                "Job": job.job_name,
                "email_sent": False,
                "uidh": job.hashed_uid,
            },
            status=status.HTTP_200_OK,
        )
