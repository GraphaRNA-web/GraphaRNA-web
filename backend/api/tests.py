from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from webapp.models import Job


class PostRnaDataTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/SendRNA/'
        self.valid_data = {
            "RNA": "AUGCUU",
            "email": "test@example.com",
            "seed": 12345,
            "job_name": "job-test-1"
        }

    def test_valid_post(self):
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)
        self.assertTrue(Job.objects.filter(job_name="job-test-1").exists())

    def test_missing_rna(self):
        data = self.valid_data.copy()
        del data["RNA"]
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_missing_email(self):
        data = self.valid_data.copy()
        del data["email"]
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_invalid_email(self):
        data = self.valid_data.copy()
        data["email"] = "XYZABC"
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_missing_optional_seed_and_job_name(self):
        data = {
            "RNA": "AUGCUU",
            "email": "test@example.com"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)

    def test_seed_as_string(self):
        data = self.valid_data.copy()
        data["seed"] = "XYZABC123"
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Job", response.data)

    def test_wrong_http_method_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
