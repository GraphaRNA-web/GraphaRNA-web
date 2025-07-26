from unittest.mock import MagicMock, mock_open, patch
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.response import Response
from rest_framework import status
from typing import Dict, Any
from webapp.models import Job, JobResults
import uuid
from django.utils import timezone


class PostRnaDataTests(TestCase):
    def setUp(self) -> None:
        self.client: APIClient = APIClient()
        self.url: str = "/api/testRequest/"
        self.valid_data: Dict[str, Any] = {
            "bracket": "",
            "RNA": "AUGCUU",
            "email": "test@example.com",
            "seed": 12345,
            "job_name": "job-test-1",
        }
        #Avoid file creation during api call
        self.patcher_open = patch("builtins.open", mock_open())
        self.patcher_makedirs = patch("os.makedirs")
        self.patcher_relpath = patch("os.path.relpath", return_value="mocked/path/file.dotseq")

        self.mock_open = self.patcher_open.start()
        self.mock_makedirs = self.patcher_makedirs.start()
        self.mock_relpath = self.patcher_relpath.start()

    def tearDown(self) -> None:
        self.patcher_open.stop()
        self.patcher_makedirs.stop()
        self.patcher_relpath.stop()

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

        
        self.job = MagicMock()
        self.job.uid = uuid.uuid4()
        self.job.input_structure.read.return_value = b">Job\nACBC"
        self.job.status = "Q"
        self.job.job_name = "Job"
        self.job.seed = 42
        self.job.created_at = timezone.now()

        self.job_results = MagicMock()
        self.job_results.job = self.job
        self.job_results.completed_at = timezone.now()
        self.job_results.result_structure.read.return_value = b"HEADER RNA PDB"


    def test_valid_get_no_results(self) -> None:
        

        with patch("api.views.Job.objects.get", return_value=self.job), \
         patch("api.views.JobResults.objects.get", side_effect=JobResults.DoesNotExist):

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

        self.assertNotIn("result_structure", data)
        self.assertNotIn("completed_at", data)
        self.assertNotIn("processing_time", data)

    def test_valid_get_with_results(self) -> None:
        with patch("api.views.Job.objects.get", return_value=self.job), \
         patch("api.views.JobResults.objects.get", return_value = self.job_results):

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

        self.assertEqual(
            data["result_structure"],
            self.job_results.result_structure.read().decode("UTF-8"),
        )
        self.assertEqual(data["completed_at"], self.job_results.completed_at)
        self.assertEqual(
            data["processing_time"], self.job_results.completed_at - self.job.created_at
        )

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

