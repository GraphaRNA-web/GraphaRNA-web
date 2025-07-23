from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.response import Response
from rest_framework import status
from typing import Dict, Any
from webapp.models import Job


class PostRnaDataTests(TestCase):
    def setUp(self) -> None:
        self.client: APIClient = APIClient()
        self.url: str = '/api/SendRNA/'
        self.valid_data: Dict[str, Any] = {
            "RNA": "AUGCUU",
            "email": "test@example.com",
            "seed": 12345,
            "job_name": "job-test-1"
        }

    def test_valid_post(self) -> None:
        response: Response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)
        self.assertTrue(Job.objects.filter(job_name="job-test-1").exists())

    def test_missing_rna(self) -> None:
        data = self.valid_data.copy()
        del data["RNA"]
        response: Response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_missing_email(self) -> None:
        data = self.valid_data.copy()
        del data["email"]
        response: Response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_invalid_email(self) -> None:
        data = self.valid_data.copy()
        data["email"] = "XYZABC"
        response: Response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_missing_optional_seed_and_job_name(self) -> None:
        data: Dict[str, Any] = {
            "RNA": "AUGCUU",
            "email": "test@example.com"
        }
        response: Response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)

    def test_seed_as_string(self) -> None:
        data = self.valid_data.copy()
        data["seed"] = "XYZABC123"
        response: Response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)

    def test_wrong_http_method_get(self) -> None:
        response: Response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
