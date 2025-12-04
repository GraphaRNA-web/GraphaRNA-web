from locust import HttpUser, task, between, SequentialTaskSet
from locust.clients import HttpSession
import json
import random
import time
import os

# Config
POLL_TIMEOUT = 240 
POLL_INTERVAL = 2
FRONTEND_HOST = os.environ.get("FRONTEND_HOST", "http://frontend:3000")

VALID_RNA_SAMPLES = [
    {
        "raw": "GCGGAUUUAGCUCAGUUGGGAGAGCGCCAGACUGAAGAUCUGGAGGUCCUGUGUUCGAUCCACAGAAUUCGCACCA\n(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))....",
        "name": "Sample_tRNA"
    },
    {
        "raw": "GGGCUCGUAGGUCAGGGCC\n((.((.........)).))",
        "name": "Sample_Hairpin"
    },
    {
        "raw": "CCCGGGUUUAAA\n((()))......",
        "name": "Sample_Simple"
    }
]

class UserFlow(SequentialTaskSet):
    """
    Simulates full user workflow 
    Home -> Validate -> Submit -> Wait -> View -> Cleanup
    """

    def on_start(self):
        self.current_sample = random.choice(VALID_RNA_SAMPLES)
        self.job_hashed_uid = None
        self.job_uuid = None
        
        self.frontend_client = HttpSession(
            base_url=FRONTEND_HOST, 
            request_event=self.client.request_event, 
            user=self.user
        )
    
    @task
    def load_pages(self):
        self.frontend_client.get("/", name="1. Frontend: Home")
        self.frontend_client.get("/about", name="1. Frontend: About")
        self.frontend_client.get("/cite", name="1. Frontend: Cite")
        self.frontend_client.get("/guide", name="1. Frontend: Guide")
        self.frontend_client.get("/submit", name="1. Frontend: Submit")

    @task
    def validate_rna(self):
        payload = {
            "fasta_raw": self.current_sample["raw"]
        }
        
        with self.client.post("/api/validateRNA/", json=payload, catch_response=True, name="2. API: Validate RNA") as response:
            if response.status_code == 200:
                if not response.json().get("Validation Result"):
                    response.failure("Validator returned False for valid RNA")
                    self.interrupt()
            else:
                response.failure(f"Validation HTTP Error: {response.status_code}")
                self.interrupt()

    @task
    def submit_job(self):
        self.job_hashed_uid = None
        job_name = f"LOCUST_{self.current_sample['name']}_{random.randint(1000, 9999)}"
        
        payload = {
            "fasta_raw": self.current_sample["raw"],
            "seed": 12345,
            "job_name": job_name,
            "alternative_conformations": 1
        }

        with self.client.post("/api/postRequestData/", json=payload, catch_response=True, name="3. API: Submit Job") as response:
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.job_hashed_uid = data.get("uidh")
                else:
                    response.failure(f"API success=False: {data.get('error')}")
                    self.interrupt()
            else:
                response.failure(f"Submit HTTP Error: {response.status_code}")
                self.interrupt()

    @task
    def wait_for_results(self):
        if not self.job_hashed_uid:
            self.interrupt()
            return

        start_time = time.time()

        while True:
            url = f"/api/getResults/?uidh={self.job_hashed_uid}"
            
            with self.client.get(url, catch_response=True, name="4. API: Poll Status") as response:
                if response.status_code == 200:
                    data = response.json()
                    status_code = data.get("status")
                    
                    if status_code == "C":
                        break
                    elif status_code == "E":
                        response.failure(f"Job failed on server (Status E)")
                        self.do_cleanup()
                        self.interrupt()
                        return
            
            if time.time() - start_time > POLL_TIMEOUT:
                self.client.post("/api/log_timeout", name="Error: Polling Timeout", catch_response=True).failure(f"Timeout for {self.job_hashed_uid}")
                self.do_cleanup()
                self.interrupt()
                return
            
            time.sleep(POLL_INTERVAL)

    @task
    def view_results(self):
        url = f"/api/getResults/?uidh={self.job_hashed_uid}"
        self.client.get(url, name="5. API: View Final Results")

        self.client.get(f"/api/downloadZip/?uidh={self.job_hashed_uid}", name="5. API: Download Zip")

    @task
    def cleanup(self):
        self.do_cleanup()
        self.interrupt()

    def do_cleanup(self):
        if self.job_hashed_uid:
            self.client.delete("/api/test/cleanupTestData/", 
                             json={"hashed_uids": [self.job_hashed_uid]}, 
                             name="6. API: Cleanup")
            self.job_hashed_uid = None

class WebsiteUser(HttpUser):
    tasks = [UserFlow]
    wait_time = between(1, 3)