from datetime import date, timedelta
from unittest.mock import MagicMock, mock_open, patch
from django.test import TestCase
from django.conf import settings
from rest_framework.test import APIClient
from rest_framework.response import Response
from rest_framework import status
from typing import Dict, Any
from webapp.models import Job
import uuid
from django.utils import timezone
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from webapp.hashing_tools import hash_uuid
import os
import zipfile
import io
import math
from api.INF_F1 import CalculateF1Inf, dotbracketToPairs


class ProcessExampleRequestDataMockTests(TestCase):
    def setUp(self) -> None:
        self.client: APIClient = APIClient()
        self.url: str = reverse("processExampleRequestData")

        self.valid_payload: Dict[str, Any] = {
            "fasta_raw": ">example_req\nAGC UUU\n(.. ..)",
            "email": "test@example.com",
            "example_number": 1,
        }

        self.patcher_example_structs = patch("api.views.ExampleStructures.objects")
        self.patcher_job = patch("api.views.Job.objects")

        self.patcher_open = patch("builtins.open", mock_open())
        self.patcher_makedirs = patch("os.makedirs")
        self.patcher_relpath = patch(
            "os.path.relpath", return_value="mocked/path/file.dotseq"
        )

        self.patcher_task_engine = patch("webapp.tasks.run_grapharna_task.delay")
        self.patcher_task_email = patch("webapp.tasks.send_email_task.delay")
        self.patcher_validator = patch(
            "api.validation_tools.RnaValidator", autospec=True
        )

        self.mock_example_objects = self.patcher_example_structs.start()
        self.mock_job_objects = self.patcher_job.start()
        self.mock_open = self.patcher_open.start()
        self.mock_makedirs = self.patcher_makedirs.start()
        self.mock_relpath = self.patcher_relpath.start()
        self.mock_task_engine = self.patcher_task_engine.start()
        self.mock_task_email = self.patcher_task_email.start()

        self.mock_validator_class = self.patcher_validator.start()
        self.mock_validator_instance = self.mock_validator_class.return_value

    def tearDown(self) -> None:
        self.patcher_example_structs.stop()
        self.patcher_job.stop()
        self.patcher_open.stop()
        self.patcher_makedirs.stop()
        self.patcher_relpath.stop()
        self.patcher_task_engine.stop()
        self.patcher_task_email.stop()
        self.patcher_validator.stop()

    def test_existing_example_returns_uid(self) -> None:
        mock_job_instance = MagicMock()
        mock_job_instance.hashed_uid = "mock_hash_123"

        mock_example_instance = MagicMock()
        mock_example_instance.job = mock_job_instance

        mock_qs = MagicMock()
        mock_qs.first.return_value = mock_example_instance
        self.mock_example_objects.filter.return_value = mock_qs

        response: Response = self.client.post(
            self.url, self.valid_payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["uidh"], "mock_hash_123")
        self.assertTrue(response.data["success"])

        self.mock_example_objects.filter.assert_called_with(id=1)
        self.mock_job_objects.create.assert_not_called()

        self.mock_task_engine.assert_not_called()
        self.mock_task_email.assert_called_once()

    def test_create_new_example_success(self) -> None:
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        self.mock_example_objects.filter.return_value = mock_qs

        self.mock_validator_instance.ValidateRna.return_value = {
            "Validation Result": True,
            "Validated RNA": "AGCUUU\n(.. ..)",
            "strandSeparator": None,
        }

        mock_new_job = MagicMock()
        mock_new_job.uid = uuid.uuid4()
        mock_new_job.hashed_uid = "new_job_hash"
        mock_new_job.job_name = "example_job_1"
        self.mock_job_objects.create.return_value = mock_new_job

        response: Response = self.client.post(
            self.url, self.valid_payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.mock_job_objects.create.assert_called_once()
        self.mock_example_objects.create.assert_called_with(id=1, job=mock_new_job)

        self.mock_task_engine.assert_called_once()
        call_kwargs = self.mock_task_engine.call_args[1]
        self.assertTrue(call_kwargs.get("is_example"))
        self.assertEqual(call_kwargs.get("example_number"), 1)

    def test_invalid_rna_prevents_db_creation(self) -> None:
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        self.mock_example_objects.filter.return_value = mock_qs

        self.mock_validator_instance.ValidateRna.return_value = {
            "Validation Result": False,
            "error": "Mocked validation error",
        }

        payload = self.valid_payload.copy()
        payload["fasta_raw"] = ">bad\nZZZ\n..."

        response: Response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)

        self.mock_job_objects.create.assert_not_called()
        self.mock_example_objects.create.assert_not_called()

        self.mock_task_engine.assert_not_called()

    def test_file_upload_handling(self) -> None:
        mock_qs = MagicMock()
        mock_qs.first.return_value = None
        self.mock_example_objects.filter.return_value = mock_qs

        self.mock_validator_instance.ValidateRna.return_value = {
            "Validation Result": True,
            "Validated RNA": "AGC\n...",
            "strandSeparator": None,
        }

        mock_new_job = MagicMock()
        mock_new_job.hashed_uid = "mock-hash-for-file-upload"

        self.mock_job_objects.create.return_value = mock_new_job

        fasta_file = SimpleUploadedFile("test.fasta", b">file\nAGC\n...")
        payload = {
            "fasta_file": fasta_file,
            "email": "test@example.com",
            "example_number": 2,
        }

        response: Response = self.client.post(self.url, payload, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["uidh"], "mock-hash-for-file-upload")
        self.mock_job_objects.create.assert_called_once()
        self.mock_task_engine.assert_called_once()


class PostRnaDataTests(TestCase):
    def setUp(self) -> None:
        self.client: APIClient = APIClient()
        self.url: str = reverse("postRequestData")
        self.valid_data: Dict[str, Any] = {
            "fasta_raw": ">example1\nAGC UUU\n(.. ..)",
            "email": "test@example.com",
            "seed": 12345,
            "job_name": "job-test-1",
            "alternative_conformations": 1,
        }
        # Avoid file creation during api call
        self.patcher_open = patch("builtins.open", mock_open())
        self.patcher_makedirs = patch("os.makedirs")
        self.patcher_relpath = patch(
            "os.path.relpath", return_value="mocked/path/file.dotseq"
        )
        self.patcher_task_engine = patch("webapp.tasks.run_grapharna_task.delay")
        self.patcher_task_email = patch("webapp.tasks.send_email_task.delay")

        self.mock_open = self.patcher_open.start()
        self.mock_makedirs = self.patcher_makedirs.start()
        self.mock_relpath = self.patcher_relpath.start()
        self.mock_task_engine = self.patcher_task_engine.start()
        self.mock_task_email = self.patcher_task_email.start()

        self.mock_fasta_file = SimpleUploadedFile(
            "rna.fasta", b">example1\nAGC UUU\n(.. ..)"
        )

    def tearDown(self) -> None:
        self.patcher_open.stop()
        self.patcher_makedirs.stop()
        self.patcher_relpath.stop()
        self.patcher_task_engine.stop()
        self.patcher_task_email.stop()

    def test_valid_post(self) -> None:
        response: Response = self.client.post(self.url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)
        self.assertTrue(Job.objects.filter(job_name="job-test-1").exists())
        self.assertTrue(response.data["success"])

    def test_valid_post_with_file(self) -> None:
        data = self.valid_data.copy()
        del data["fasta_raw"]
        data["fasta_file"] = self.mock_fasta_file

        response: Response = self.client.post(self.url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)
        self.assertTrue(response.data["success"])
        self.assertTrue(Job.objects.filter(job_name="job-test-1").exists())

    def test_invalid_post_with_file_and_text(self) -> None:
        data = self.valid_data.copy()
        data["fasta_file"] = self.mock_fasta_file

        response: Response = self.client.post(self.url, data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["error"], "RNA can be send via text or file not both."
        )
        self.assertFalse(response.data["success"])

    def test_missing_rna(self) -> None:
        data = self.valid_data.copy()
        del data["fasta_raw"]
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertFalse(response.data["success"])

    def test_missing_email(self) -> None:
        data = self.valid_data.copy()
        del data["email"]
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

    def test_invalid_email(self) -> None:
        data = self.valid_data.copy()
        data["email"] = "XYZABC"
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertFalse(response.data["success"])

    def test_valid_email(self) -> None:
        data = self.valid_data.copy()
        data["email"] = "fajnymail@domena.pl"
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("error", response.data)
        self.assertTrue(response.data["success"])

    def test_missing_optional_seed_and_job_name(self) -> None:
        data: Dict[str, Any] = {
            "fasta_raw": ">example1\nAGC UUU\n(.. ..)",
            "email": "test@example.com",
            "alternative_conformations": 1,
        }
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)
        self.assertTrue(response.data["success"])

    def test_seed_as_string(self) -> None:
        data = self.valid_data.copy()
        data["seed"] = "XYZABC123"
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)
        self.assertTrue(response.data["success"])

    def test_wrong_http_method_get(self) -> None:
        response: Response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class GetResultsTests(TestCase):
    def setUp(self) -> None:
        self.client: APIClient = APIClient()
        self.url: str = reverse("getResults")

        self.job: MagicMock = MagicMock()
        self.job.uid = uuid.uuid4()
        self.job.hashed_uid = hash_uuid(str(self.job.uid))
        self.job.input_structure.read.return_value = b">Job\nACBC"
        self.job.status = "C"
        self.job.job_name = "Job"
        self.job.seed = 42
        self.job.created_at = timezone.now()
        self.job.sum_processing_time = timedelta(minutes=5)

        self.job_results: list[MagicMock] = []
        for _ in range(3):
            jr = MagicMock()
            jr.job = self.job
            jr.completed_at = timezone.now()
            jr.result_tertiary_structure.read.return_value = b"HEADER RNA PDB"
            jr.result_secondary_structure_dotseq.read.return_value = b"..((..)).."
            jr.result_secondary_structure_svg.read.return_value = b"<svg></svg>"
            jr.result_arc_diagram.read.return_value = b"<arc></arc>"
            jr.f1 = 0.95
            jr.inf = 0.85
            jr.processing_time = timedelta(minutes=1)
            self.job_results.append(jr)

    def test_valid_get_no_results(self) -> None:
        mock_empty_qs = MagicMock()
        mock_empty_qs.__iter__.return_value = iter([])
        with (
            patch("api.views.Job.objects.get", return_value=self.job),
            patch("api.views.JobResults.objects.filter", return_value=mock_empty_qs),
        ):
            response: Response = self.client.get(
                self.url, {"uidh": str(self.job.hashed_uid)}
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data

        self.assertTrue(data["success"])
        self.assertEqual(data["status"], self.job.status)
        self.assertEqual(data["job_name"], self.job.job_name)
        self.assertEqual(
            data["input_structure"], self.job.input_structure.read().decode("UTF-8")
        )
        self.assertEqual(data["created_at"], self.job.created_at)
        self.assertEqual(data["sum_processing_time"], self.job.sum_processing_time)
        self.assertEqual(data["result_list"], [])

    def test_valid_get_with_results(self) -> None:
        mock_full_qs = MagicMock()
        mock_full_qs.__iter__.return_value = iter(self.job_results)
        mock_full_qs.count.return_value = len(self.job_results)
        with (
            patch("api.views.Job.objects.get", return_value=self.job),
            patch("api.views.JobResults.objects.filter", return_value=mock_full_qs),
        ):

            response: Response = self.client.get(
                self.url, {"uidh": str(self.job.hashed_uid)}
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data

        self.assertTrue(data["success"])
        self.assertEqual(data["status"], self.job.status)
        self.assertEqual(data["job_name"], self.job.job_name)
        self.assertEqual(data["sum_processing_time"], self.job.sum_processing_time)
        self.assertEqual(
            data["input_structure"], self.job.input_structure.read().decode("UTF-8")
        )

        self.assertEqual(len(data["result_list"]), len(self.job_results))
        for i, jr in enumerate(self.job_results):
            result_item = data["result_list"][i]
            self.assertEqual(
                result_item["result_tetriary_structure"],
                jr.result_tertiary_structure.read().decode("utf-8"),
            )
            self.assertEqual(
                result_item["result_secondary_structure_dotseq"],
                jr.result_secondary_structure_dotseq.read().decode("utf-8"),
            )
            self.assertEqual(
                result_item["result_secondary_structure_svg"],
                jr.result_secondary_structure_svg.read().decode("utf-8"),
            )
            self.assertEqual(
                result_item["result_arc_diagram"],
                jr.result_arc_diagram.read().decode("utf-8"),
            )
            self.assertEqual(result_item["f1"], jr.f1)
            self.assertEqual(result_item["inf"], jr.inf)

    def test_unfinished_job(self) -> None:
        self.job.status = "Q"

        mock_qs = MagicMock()
        mock_qs.__iter__.return_value = iter(self.job_results)

        with (
            patch("api.views.Job.objects.get", return_value=self.job),
            patch("api.views.JobResults.objects.filter", return_value=mock_qs),
        ):
            response: Response = self.client.get(
                self.url, {"uidh": str(self.job.hashed_uid)}
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data

        self.assertTrue(data["success"])
        self.assertEqual(data["status"], self.job.status)
        self.assertEqual(data["job_name"], self.job.job_name)
        self.assertEqual(
            data["input_structure"], self.job.input_structure.read().decode("utf-8")
        )
        self.assertEqual(data["created_at"], self.job.created_at)
        self.assertEqual(data["sum_processing_time"], self.job.sum_processing_time)
        self.assertEqual(data["result_list"], [])

    def test_missing_uid(self) -> None:
        response: Response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_non_existent_job(self) -> None:
        response: Response = self.client.get(self.url, {"uidh": "nonexistent"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_wrong_http_method_post(self) -> None:
        response: Response = self.client.post(
            self.url, {"uidh": str(self.job.hashed_uid)}
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class SuggestSeedAndJobNameTests(TestCase):
    def setUp(self) -> None:
        self.client: APIClient = APIClient()
        self.url: str = reverse("getSuggestedSeedAndJobName")

    def test_valid_request(self) -> None:
        response: Response = self.client.get(self.url)
        data = response.data

        today_str = date.today().strftime("%Y%m%d")
        self.assertEqual(data["job_name"], f"job-{today_str}-0")
        self.assertGreaterEqual(int(data["seed"]), 1)
        self.assertLessEqual(int(data["seed"]), 100_000_000_0)

    def test_incrementing_job_name_suffix(self):
        today_str = date.today().strftime("%Y%m%d")

        mock_qs = MagicMock()
        mock_qs.count.return_value = 1
        # Patch and mock query set to simulate existance of a job with todays prefix
        with patch("api.views.Job.objects.filter", return_value=mock_qs):
            response = self.client.get(self.url)

        data = response.data

        self.assertEqual(data["job_name"], f"job-{today_str}-1")

    def test_wrong_http_method_post(self) -> None:
        response: Response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class PostRnaValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("validateRNA")

    def test_missing_rna_field(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["error"], "Missing RNA data.")

    def test_valid_rna_and_dotbracket(self):
        rna_input = ">example1\nAGC UUU\n(.. ..)"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "AGC UUU\n(.. ..)")

    def test_valid_rna_and_dotbracket_with_t(self):
        rna_input = ">example1\nAGC UUT\n(.. ..)"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "AGC UUU\n(.. ..)")

    def test_valid_rna_and_dotbracket_multiple_strands(self):
        rna_input = ">example1\nAGC UUU\n(.. ..)\n>example1\nAGC UUU\n(.. ..)"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(
            response.data["Validated RNA"], "AGC UUU AGC UUU\n(.. ..) (.. ..)"
        )

    def test_empty_rna_data(self):
        rna_input = ""
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "")
        self.assertIn("Invalid data", response.data["Error List"])

    def test_invalid_nucleotide(self):
        rna_input = ">example1\nAGC TXG\n(.. ..)"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "")
        self.assertIn("RNA contains invalid characters: X", response.data["Error List"])

    def test_invalid_dotbracket(self):
        rna_input = ">example1\nAGC UUG\n(.. .X)"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "")
        self.assertIn(
            "DotBracket contains invalid brackets: X", response.data["Error List"]
        )

    def test_mismatched_brackets(self):
        rna_input = ">example1\nAGC UUG\n(.. .))"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertTrue(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [6])

    def test_incorrect_rna_pairs(self):
        rna_input = ">example1\nUGC UUU\n(.. ..)"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertTrue(response.data["Fix Suggested"])
        self.assertEqual(response.data["Incorrect Pairs"], [(0, 6)])

    def test_inconsistant_strand_naming(self):
        rna_input = ">example1\nAGC\n(..\nUUG\n.X)"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "")
        self.assertIn(
            "Parsing error: Inconsistent strand naming", response.data["Error List"]
        )

    def test_whitespace_only_rna(self):
        rna_input = "   \n   "
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertIn("Invalid data", response.data["Error List"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "")

    def test_unequal_rna_and_dotbracket_lengths(self):
        rna_input = ">example\nAUGC\n(...)"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "")
        self.assertIn(
            "Parsing error: Mismatching strand lengths", response.data["Error List"]
        )

    def test_diffrent_strand_separators(self):
        rna_input = ">example1\nAGC-UUU\n(.. ..)"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertIn(
            "Parsing error: Mismatching strand separators", response.data["Error List"]
        )

    def test_diffrent_strand_separators_same_line(self):
        rna_input = ">example1\nAGC-U UU\n(..-. .)"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertIn(
            "Parsing error: Mismatching strand separators", response.data["Error List"]
        )

    def test_rna_with_extra_spaces(self):
        rna_input = ">example\nA U G C\n( . . )"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [(0, 6)])
        self.assertEqual(response.data["Validated RNA"], "A U G C\n. . . .")
        self.assertTrue(response.data["Validation Result"])

    def test_unclosed_opening_bracket(self):
        rna_input = ">example\nAUGC\n((.."
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Fix Suggested"])
        self.assertEqual(response.data["Validated RNA"], "AUGC\n....")
        self.assertIn(0, response.data["Mismatching Brackets"])
        self.assertIn(1, response.data["Mismatching Brackets"])

    def test_missing_dotbracket_line(self):
        rna_input = ">example\nAUGC"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertIn("Parsing error: Missing Lines", response.data["Error List"])

    def test_very_long_rna_sequence(self):
        rna_seq = "A" * 10000
        dotbracket = "." * 10000
        rna_input = f">long\n{rna_seq}\n{dotbracket}"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertIn(
            f"RNA length exceeds maximum allowed length of {settings.MAX_RNA_LENGTH} nucleotides",
            response.data["Error List"],
        )

    def test_long_valid_structure(self):
        rna_input = "gCGGAUUUAgCUCAGuuGGGAGAGCgCCAGAcUgAAgAucUGGAGgUCcUGUGuuCGaUCCACAGAAUUCGCACCA\n(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))...."
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])

    def test_long_invalid_structure(self):
        rna_input = "aCGGAUUUAgCUCAGuuGGGAGAGCgCCAGAcUgAAgAucUGGAGgUCcUGUGuuCGaUCCACAGAAUUCGCACCA\n(((((((..((((.....[..)))).((((.........)))).....(((((.......))))))))))))...."
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertTrue(response.data["Fix Suggested"])
        self.assertIn(18, response.data["Mismatching Brackets"])
        self.assertIn((0, 71), response.data["Incorrect Pairs"])

    def test_incorrect_order(self):
        rna_input = ">example1\nAGC\n(..\n>idk\n.X)\nUUG"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertIn("Parsing error: Wrong line order", response.data["Error List"])

    def test_invalid_bracket_edge_case(self):
        rna_input = ">example1\nAG\nqq"
        response = self.client.post(self.url, {"fasta_raw": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertIn(
            "DotBracket contains invalid brackets: q", response.data["Error List"]
        )

    def test_wrong_http_method_get(self) -> None:
        response: Response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class DownloadZipFileTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Mock jobs
        self.job_queued = MagicMock(uid=uuid.uuid4(), status="Q", job_name="queued")
        self.job_queued.hashed_uid = hash_uuid(str(self.job_queued.uuid))

        self.job_finished = MagicMock(uid=uuid.uuid4(), status="C", job_name="finished")
        self.job_finished.hashed_uid = hash_uuid(str(self.job_finished.uuid))

        self.result = MagicMock(job=self.job_finished)
        self.result.result_secondary_structure_dotseq.name = "dotseq.txt"
        self.result.result_secondary_structure_dotseq.path = "/fake/path/dotseq.txt"
        self.result.result_secondary_structure_svg.name = "structure.svg"
        self.result.result_secondary_structure_svg.path = "/fake/path/structure.svg"
        self.result.result_tertiary_structure.name = "tertiary.txt"
        self.result.result_tertiary_structure.path = "/fake/path/tertiary.txt"

        self.result2 = MagicMock(job=self.job_finished)
        self.result2.result_secondary_structure_dotseq.name = "dotseq2.txt"
        self.result2.result_secondary_structure_dotseq.path = "/fake/path/dotseq2.txt"
        self.result2.result_secondary_structure_svg.name = "structure2.svg"
        self.result2.result_secondary_structure_svg.path = "/fake/path/structure2.svg"
        self.result2.result_tertiary_structure.name = "tertiary2.txt"
        self.result2.result_tertiary_structure.path = "/fake/path/tertiary2.txt"

        # Patch Job.objects.get
        patcher_job_get = patch(
            "webapp.models.Job.objects.get",
            side_effect=lambda hashed_uid=None: (
                self.job_finished
                if str(hashed_uid) == str(self.job_finished.hashed_uid)
                else self.job_queued
            ),
        )
        self.mock_job_get = patcher_job_get.start()
        self.addCleanup(patcher_job_get.stop)

        # Patch JobResults.objects.get
        patcher_results_filter = patch(
            "webapp.models.JobResults.objects.filter",
            return_value=[self.result, self.result2],
        )
        self.mock_results_get = patcher_results_filter.start()
        self.addCleanup(patcher_results_filter.stop)

        # Patch filesystem
        patcher_exists = patch("os.path.exists", return_value=True)
        self.mock_exists = patcher_exists.start()
        self.addCleanup(patcher_exists.stop)

        patcher_open = patch("builtins.open", mock_open(read_data=b"xyz"))
        self.mock_open = patcher_open.start()
        self.addCleanup(patcher_open.stop)

    def test_download_zip_no_uuid(self):
        url = reverse("downloadZip")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)

    def test_download_zip_job_not_finished(self):
        url = reverse("downloadZip") + f"?uidh={self.job_queued.hashed_uid}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)
        self.assertIn(b"Job is not finished", response.content)

    def test_download_zip_success(self):
        url = reverse("downloadZip") + f"?uidh={self.job_finished.hashed_uid}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/zip")

        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer) as zf:
            filenames = [os.path.basename(f) for f in zf.namelist()]
            self.assertTrue(any("tertiary" in f for f in filenames))
            self.assertTrue(any("dotseq" in f for f in filenames))
            self.assertTrue(any("structure" in f for f in filenames))


# class JobActiveAndFinishedTests(TestCase):
#     activeSize = 21
#     finishedSize = 14

#     def setUp(self):
#         for i in range(self.activeSize):
#             Job.objects.create(
#                 uid=uuid.uuid4(),
#                 seed=i,
#                 job_name=f"Active Job {i}",
#                 status="Q" if i % 2 == 0 else "P",
#                 alternative_conformations=3,
#                 created_at=timezone.now(),
#             )

#         for i in range(self.finishedSize):
#             Job.objects.create(
#                 uid=uuid.uuid4(),
#                 seed=i,
#                 job_name=f"Finished Job {i}",
#                 status="C",
#                 alternative_conformations=2,
#                 created_at=timezone.now(),
#             )

#     def test_size_active_jobs_first_page(self):
#         url = reverse("getActiveJobs")
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertIn("results", response.data)
#         self.assertLessEqual(
#             len(response.data["results"]), int(settings.REST_FRAMEWORK["PAGE_SIZE"])
#         )
#         if len(response.data["results"]) < int(settings.REST_FRAMEWORK["PAGE_SIZE"]):
#             self.assertIsNone(response.data["next"])

#     def test_size_finished_jobs_first_page(self):
#         url = reverse("getFinishedJobs")
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertIn("results", response.data)
#         self.assertLessEqual(
#             len(response.data["results"]), int(settings.REST_FRAMEWORK["PAGE_SIZE"])
#         )
#         if len(response.data["results"]) < int(settings.REST_FRAMEWORK["PAGE_SIZE"]):
#             self.assertIsNone(response.data["next"])

#     def test_next_exists_active_jobs_page(self):
#         url = reverse("getActiveJobs")
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         next_url = response.data["next"]
#         if next_url is not None:
#             response_next = self.client.get(next_url)
#             self.assertEqual(response_next.status_code, status.HTTP_200_OK)
#             self.assertIsNotNone(response_next.data["results"])

#     def test_next_exists_finished_jobs_page(self):
#         url = reverse("getFinishedJobs")
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         next_url = response.data["next"]
#         if next_url is not None:
#             response_next = self.client.get(next_url)
#             self.assertEqual(response_next.status_code, status.HTTP_200_OK)
#             self.assertIsNotNone(response_next.data["results"])

#     def test_previous_active_jobs_page(self):
#         url = reverse("getActiveJobs")
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         first_page_data = response.data["results"]
#         next_url = response.data["next"]
#         if next_url is not None:
#             response_next = self.client.get(next_url)
#             self.assertIsNotNone(response_next.data["results"])
#             self.assertIsNotNone(response_next.data["previous"])
#             previous_url = response_next.data["previous"]
#             response_previous = self.client.get(previous_url)
#             previous_data = response_previous.data["results"]
#             self.assertEqual(previous_data, first_page_data)

#     def test_previous_finished_jobs_page(self):
#         url = reverse("getFinishedJobs")
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         first_page_data = response.data["results"]
#         next_url = response.data["next"]
#         if next_url is not None:
#             response_next = self.client.get(next_url)
#             self.assertIsNotNone(response_next.data["results"])
#             self.assertIsNotNone(response_next.data["previous"])
#             previous_url = response_next.data["previous"]
#             response_previous = self.client.get(previous_url)
#             previous_data = response_previous.data["results"]
#             self.assertEqual(previous_data, first_page_data)

#     def test_all_data_in_active_jobs_page(self):
#         ileDanych = 0
#         url = reverse("getActiveJobs")
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         first_page_data = response.data["results"]
#         ileDanych += len(first_page_data)
#         next_url = response.data["next"]
#         while next_url is not None:
#             response_next = self.client.get(next_url)
#             self.assertIsNotNone(response_next.data["results"])
#             self.assertIsNotNone(response_next.data["previous"])
#             ileDanych += len(response_next.data["results"])
#             next_url = response_next.data["next"]

#         self.assertEqual(ileDanych, self.activeSize)

#     def test_all_data_in_finished_jobs_page(self):
#         ileDanych = 0
#         url = reverse("getFinishedJobs")
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         first_page_data = response.data["results"]
#         ileDanych += len(first_page_data)
#         next_url = response.data["next"]
#         while next_url is not None:
#             response_next = self.client.get(next_url)
#             self.assertIsNotNone(response_next.data["results"])
#             self.assertIsNotNone(response_next.data["previous"])
#             ileDanych += len(response_next.data["results"])
#             next_url = response_next.data["next"]

#         self.assertEqual(ileDanych, self.finishedSize)

#     def test_specific_active_jobs_page(self):
#         url = reverse("getActiveJobs") + "?page=2"
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertIn("results", response.data)

#     def test_specific_finished_jobs_page(self):
#         url = reverse("getFinishedJobs") + "?page=2"
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertIn("results", response.data)

#     def test_specific_impossible_finished_jobs_page(self):
#         url = reverse("getFinishedJobs") + "?page=999"
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

#     def test_specific_finished_jobs_page_size(self):
#         url = reverse("getFinishedJobs") + "?page_size=5"
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertIn("results", response.data)

#     def test_specific_getActiveJobs_page_size(self):
#         url = reverse("getActiveJobs") + "?page_size=5"
#         response = self.client.get(url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertIn("results", response.data)


class INF(TestCase):
    def test_perfect_match_CalculateF1Inf(self):

        values = CalculateF1Inf({(0, 1), (2, 3)}, {(0, 1), (2, 3)})
        assert (values["tp"], values["fp"], values["fn"]) == (2, 0, 0)
        assert math.isclose(values["inf"], 1.0)
        assert math.isclose(values["f1"], 1.0)

    def test_empty_model_CalculateF1Inf(self):
        values = CalculateF1Inf({(0, 1), (2, 3)}, set())
        assert (values["tp"], values["fp"], values["fn"]) == (0, 0, 2)
        assert math.isclose(values["inf"], 0.0)
        assert math.isclose(values["f1"], 0.0)

    def test_partial_match_CalculateF1Inf(self):
        values = CalculateF1Inf({(0, 1), (2, 3)}, {(0, 1), (4, 5)})

        assert (values["tp"], values["fp"], values["fn"]) == (1, 1, 1)
        assert math.isclose(values["inf"], 0.5)
        assert math.isclose(values["f1"], 0.5)

    def test_CalculateF1Inf_perfect_match(self):
        target = {(0, 3), (1, 2)}
        model = {(0, 3), (1, 2)}
        values = CalculateF1Inf(target, model)
        assert (values["tp"], values["fp"], values["fn"]) == (2, 0, 0)
        assert math.isclose(values["inf"], 1.0)
        assert math.isclose(values["f1"], 1.0)

    def test_CalculateF1Inf_partial_match(self):
        target = {(0, 3), (1, 2)}
        model = {(0, 3), (4, 5)}
        values = CalculateF1Inf(target, model)
        assert (values["tp"], values["fp"], values["fn"]) == (1, 1, 1)
        assert round(values["f1"], 2) == 0.5
        assert round(values["inf"], 2) == 0.5

    def test_CalculateF1Inf_empty_model(self):
        target = {(0, 3), (1, 2)}
        model = set()
        values = CalculateF1Inf(target, model)
        assert (values["tp"], values["fp"], values["fn"]) == (0, 0, 2)
        assert values["f1"] == 0.0
        assert values["inf"] == 0.0

    def test_dotbracketToPairs_simple(self):
        input_str = ">Job\nACGU\n(())"
        Pairs = dotbracketToPairs(input_str)
        assert (0, 3) in Pairs["correctPairs"]
        assert (1, 2) in Pairs["correctPairs"]
        assert Pairs["incorrectPairs"] == set()

    def test_perfect_match(self):
        target_input = "ACGU\n()()"
        model_input = "ACGU\n()()"

        target_dict = dotbracketToPairs(target_input)
        model_dict = dotbracketToPairs(model_input)

        values = CalculateF1Inf(target_dict["correctPairs"], model_dict["correctPairs"])

        self.assertEqual(values["tp"], 1)
        self.assertEqual(values["fp"], 0)
        self.assertEqual(values["fn"], 0)
        self.assertTrue(0 <= values["f1"] <= 1)
        self.assertTrue(0 <= values["inf"] <= 1)

    def test_partial_match(self):
        target_input = "GCGC\n()()"
        model_input = "GCGC\n..()"

        target_dict = dotbracketToPairs(target_input)
        model_dict = dotbracketToPairs(model_input)

        values = CalculateF1Inf(target_dict["correctPairs"], model_dict["correctPairs"])

        self.assertEqual(values["tp"], 1)
        self.assertEqual(values["fp"], 0)
        self.assertEqual(values["fn"], 1)
        self.assertTrue(0 < values["f1"] < 1)
        self.assertTrue(0 < values["inf"] < 1)

    def test_empty_model(self):
        target_input = "GC\n()"
        model_input = "..."
        target_dict = dotbracketToPairs(target_input)
        model_dict = dotbracketToPairs(model_input)

        values = CalculateF1Inf(target_dict["correctPairs"], model_dict["correctPairs"])

        self.assertEqual(values["tp"], 0)
        self.assertEqual(values["fp"], 0)
        self.assertEqual(values["fn"], 1)
        self.assertTrue(0 <= values["f1"] <= 1)
        self.assertTrue(0 <= values["inf"] <= 1)
