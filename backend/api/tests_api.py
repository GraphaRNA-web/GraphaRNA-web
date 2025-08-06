from datetime import date
from unittest.mock import MagicMock, mock_open, patch
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.response import Response
from rest_framework import status
from typing import Dict, Any
from webapp.models import Job
import uuid
from django.utils import timezone


class PostRnaDataTests(TestCase):
    def setUp(self) -> None:
        self.client: APIClient = APIClient()
        self.url: str = "/api/postRequestData/"
        self.valid_data: Dict[str, Any] = {
            "bracket": "",
            "RNA": "AUGCUU",
            "email": "test@example.com",
            "seed": 12345,
            "job_name": "job-test-1",
            "alternative_conformations": 1
        }
        #Avoid file creation during api call
        self.patcher_open = patch("builtins.open", mock_open())
        self.patcher_makedirs = patch("os.makedirs")
        self.patcher_relpath = patch("os.path.relpath", return_value="mocked/path/file.dotseq")
        self.patcher_task = patch("webapp.tasks.run_grapharna_task.delay")

        self.mock_open = self.patcher_open.start()
        self.mock_makedirs = self.patcher_makedirs.start()
        self.mock_relpath = self.patcher_relpath.start()
        self.mock_task = self.patcher_task.start()

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

    def test_missing_rna(self) -> None:
        data = self.valid_data.copy()
        del data["RNA"]
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_missing_email(self) -> None:
        data = self.valid_data.copy()
        del data["email"]
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_invalid_email(self) -> None:
        data = self.valid_data.copy()
        data["email"] = "XYZABC"
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_missing_optional_seed_and_job_name(self) -> None:
        data: Dict[str, Any] = {
            "RNA": "AUGCUU",
            "email": "test@example.com",
            "bracket": "",
            "alternative_conformations": 1
        }
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)

    def test_seed_as_string(self) -> None:
        data = self.valid_data.copy()
        data["seed"] = "XYZABC123"
        response: Response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)

    def test_wrong_http_method_get(self) -> None:
        response: Response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

class GetResultsTests(TestCase):
    def setUp(self) -> None:
        self.client: APIClient = APIClient()
        self.url: str = "/api/getResults/"

        
        self.job: MagicMock = MagicMock()
        self.job.uid = uuid.uuid4()
        self.job.input_structure.read.return_value = b">Job\nACBC"
        self.job.status = "Q"
        self.job.job_name = "Job"
        self.job.seed = 42
        self.job.created_at = timezone.now()

        self.job_results: list[MagicMock] = []
        for i in range(5):
            self.job_results.append(MagicMock())
            self.job_results[i].job = self.job
            self.job_results[i].completed_at = timezone.now()
            self.job_results[i].result_tetriary_structure.read.return_value = b"HEADER RNA PDB"


    def test_valid_get_no_results(self) -> None:
        
        mock_empty_qs = MagicMock()
        mock_empty_qs.__iter__.return_value = iter([])
        with patch("api.views.Job.objects.get", return_value=self.job), \
            patch("api.views.JobResults.objects.filter", return_value=mock_empty_qs):

            response: Response = self.client.get(self.url, {"uid": str(self.job.uid)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data

        self.assertTrue(data["success"])
        self.assertEqual(data["status"], self.job.status)
        self.assertEqual(data["job_name"], self.job.job_name)
        self.assertEqual(
            data["input_structure"], self.job.input_structure.read().decode("UTF-8")
        )
        self.assertEqual(data["seed"], self.job.seed)
        self.assertEqual(data["created_at"], self.job.created_at)
        self.assertEqual(data["result_list"], [])


    def test_valid_get_with_results(self) -> None:
        mock_full_qs = MagicMock()
        mock_full_qs.__iter__.return_value = iter(self.job_results)
        mock_full_qs.count.return_value = len(self.job_results)
        with patch("api.views.Job.objects.get", return_value=self.job), \
         patch("api.views.JobResults.objects.filter", return_value=mock_full_qs):

            response: Response = self.client.get(self.url, {"uid": str(self.job.uid)})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data

        self.assertTrue(data["success"])
        self.assertEqual(data["status"], self.job.status)
        self.assertEqual(data["job_name"], self.job.job_name)
        self.assertEqual(
            data["input_structure"], self.job.input_structure.read().decode("UTF-8")
        )
        self.assertEqual(data["seed"], self.job.seed)
        self.assertEqual(data["created_at"], self.job.created_at)

        expected_results = []
        for jr in self.job_results:
            processing_time = jr.completed_at - self.job.created_at
            expected_results.append({
                "completed_at": jr.completed_at,
                "result_tetriary_structure": jr.result_tetriary_structure.read().decode("UTF-8"),
                "processing_time": processing_time,
            })
        self.assertEqual(data["result_list"], expected_results)
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
        #Patch and mock query set to simulate existance of a job with todays prefix
        with patch("api.views.Job.objects.filter", return_value=mock_qs):
            response = self.client.get(self.url)

        data = response.data

        self.assertEqual(data["job_name"], f"job-{today_str}-1")

    def test_wrong_http_method_post(self) -> None:
        response: Response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
    
