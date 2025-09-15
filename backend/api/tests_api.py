from datetime import date, timedelta
from unittest.mock import MagicMock, mock_open, patch
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.response import Response
from rest_framework import status
from typing import Dict, Any
from webapp.models import Job
import uuid
from django.utils import timezone
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile


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
        self.patcher_task = patch("webapp.tasks.run_grapharna_task.delay")

        self.mock_open = self.patcher_open.start()
        self.mock_makedirs = self.patcher_makedirs.start()
        self.mock_relpath = self.patcher_relpath.start()
        self.mock_task = self.patcher_task.start()

        self.mock_fasta_file = SimpleUploadedFile(
            "rna.fasta", b">example1\nAGC UUU\n(.. ..)"
        )

    def tearDown(self) -> None:
        self.patcher_open.stop()
        self.patcher_makedirs.stop()
        self.patcher_relpath.stop()
        self.patcher_task.stop()

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
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertFalse(response.data["success"])

    def test_invalid_email(self) -> None:
        data = self.valid_data.copy()
        data["email"] = "XYZABC"
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertFalse(response.data["success"])

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
    # def test_empty_bracket(self) -> None:
    #     data = self.valid_data.copy()
    #     data["bracket"] = ""
    #     response: Response = self.client.post(self.url, data, format="json")
    #     self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    #     self.assertIn("error", response.data)

    # def test_missing_bracket(self) -> None:
    #     data = self.valid_data.copy()
    #     del data["bracket"]
    #     response: Response = self.client.post(self.url, data, format="json")
    #     self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    #     self.assertIn("error", response.data)

    # def test_invalid_bracket(self) -> None:
    #     data = self.valid_data.copy()
    #     data["bracket"] = "jfeoew"
    #     response: Response = self.client.post(self.url, data, format="json")
    #     self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    #     self.assertIn("error", response.data)

    # def test_valid_bracket(self) -> None:
    #     data = self.valid_data.copy()
    #     data["RNA"] = "AUGCUU"
    #     data["bracket"] = "((..))"
    #     response: Response = self.client.post(self.url, data, format="json")
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     self.assertIn("Job", response.data)
    #PRZEDAWNIONE TESTY


class GetResultsTests(TestCase):
    def setUp(self) -> None:
        self.client: APIClient = APIClient()
        self.url: str = reverse("getResults")

        self.job: MagicMock = MagicMock()
        self.job.uid = uuid.uuid4()
        self.job.input_structure.read.return_value = b">Job\nACBC"
        self.job.status = "F"
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
        with patch("api.views.Job.objects.get", return_value=self.job), patch(
            "api.views.JobResults.objects.filter", return_value=mock_empty_qs
        ):

            response: Response = self.client.get(self.url, {"uid": str(self.job.uid)})
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
        with patch("api.views.Job.objects.get", return_value=self.job), patch(
            "api.views.JobResults.objects.filter", return_value=mock_full_qs
        ):

            response: Response = self.client.get(self.url, {"uid": str(self.job.uid)})

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

        with patch("api.views.Job.objects.get", return_value=self.job), patch(
            "api.views.JobResults.objects.filter", return_value=mock_qs
        ):
            response: Response = self.client.get(self.url, {"uid": str(self.job.uid)})

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

    def test_invalid_uid(self) -> None:
        response: Response = self.client.get(self.url, {"uid": "1234"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_missing_uid(self) -> None:
        response: Response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_non_existent_job(self) -> None:
        response: Response = self.client.get(self.url, {"uid": str(uuid.uuid4())})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_wrong_http_method_post(self) -> None:
        response: Response = self.client.post(self.url, {"uid": str(self.job.uid)})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
class SuggestSeedAndJobNameTests(TestCase):
    def setUp(self) -> None:
        self.client: APIClient = APIClient()
        self.url: str = "/api/getSuggestedSeedAndJobName/"

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
        self.assertEqual(response.data["error"], "No data.")

    def test_valid_rna_and_dotbracket(self):
        rna_input = ">example1\nAGC UUU\n(.. ..)"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "AGC UUU\n(.. ..)")

    def test_valid_rna_and_dotbracket_with_t(self):
        rna_input = ">example1\nAGC UUT\n(.. ..)"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "AGC UUU\n(.. ..)")

    def test_valid_rna_and_dotbracket_multiple_strands(self):
        rna_input = ">example1\nAGC UUU\n(.. ..)\n>example1\nAGC UUU\n(.. ..)"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
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
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "")
        self.assertIn("Invalid data", response.data["Error List"])

    def test_invalid_nucleotide(self):
        rna_input = ">example1\nAGC TXG\n(.. ..)"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "")
        self.assertIn("RNA contains invalid characters: X", response.data["Error List"])

    def test_invalid_dotbracket(self):
        rna_input = ">example1\nAGC UUG\n(.. .X)"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
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
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertTrue(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [6])

    def test_incorrect_rna_pairs(self):
        rna_input = ">example1\nUGC UUU\n(.. ..)"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertTrue(response.data["Fix Suggested"])
        self.assertEqual(response.data["Incorrect Pairs"], [(0, 6)])

    def test_inconsistant_strand_naming(self):
        rna_input = ">example1\nAGC\n(..\nUUG\n.X)"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
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
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertIn("Invalid data", response.data["Error List"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "")

    def test_unequal_rna_and_dotbracket_lengths(self):
        rna_input = ">example\nAUGC\n(...)"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [])
        self.assertEqual(response.data["Validated RNA"], "")
        self.assertIn(
            "RNA and DotBracket not of equal lengths", response.data["Error List"]
        )

    def test_rna_with_extra_spaces(self):
        rna_input = ">example\nA U G C\n( . . )"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Fix Suggested"])
        self.assertEqual(response.data["Mismatching Brackets"], [])
        self.assertEqual(response.data["Incorrect Pairs"], [(0, 6)])
        self.assertEqual(response.data["Validated RNA"], "A U G C\n. . . .")
        self.assertTrue(response.data["Validation Result"])

    def test_unclosed_opening_bracket(self):
        rna_input = ">example\nAUGC\n((.."
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Fix Suggested"])
        self.assertEqual(response.data["Validated RNA"], "AUGC\n....")
        self.assertIn(0, response.data["Mismatching Brackets"])
        self.assertIn(1, response.data["Mismatching Brackets"])

    def test_missing_dotbracket_line(self):
        rna_input = ">example\nAUGC"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertIn("Parsing error: Missing Lines", response.data["Error List"])

    def test_very_long_rna_sequence(self):
        rna_seq = "A" * 10000
        dotbracket = "." * 10000
        rna_input = f">long\n{rna_seq}\n{dotbracket}"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])

    def test_long_valid_structure(self):
        rna_input = "gCGGAUUUAgCUCAGuuGGGAGAGCgCCAGAcUgAAgAucUGGAGgUCcUGUGuuCGaUCCACAGAAUUCGCACCA\n(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))...."
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertFalse(response.data["Fix Suggested"])

    def test_long_invalid_structure(self):
        rna_input = "aCGGAUUUAgCUCAGuuGGGAGAGCgCCAGAcUgAAgAucUGGAGgUCcUGUGuuCGaUCCACAGAAUUCGCACCA\n(((((((..((((.....[..)))).((((.........)))).....(((((.......))))))))))))...."
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["Validation Result"])
        self.assertTrue(response.data["Fix Suggested"])
        self.assertIn(18, response.data["Mismatching Brackets"])
        self.assertIn((0, 71), response.data["Incorrect Pairs"])

    def test_incorrect_order(self):
        rna_input = ">example1\nAGC\n(..\n>idk\n.X)\nUUG"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertIn("Parsing error: Wrong line order", response.data["Error List"])

    def test_invalid_bracket_edge_case(self):
        rna_input = ">example1\nAG\nqq"
        response = self.client.post(self.url, {"RNA": rna_input}, format="json")
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertFalse(response.data["Validation Result"])
        self.assertIn(
            "DotBracket contains invalid brackets: q", response.data["Error List"]
        )

    def test_wrong_http_method_get(self) -> None:
        response: Response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
