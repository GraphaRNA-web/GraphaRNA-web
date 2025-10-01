# Docker setup

First pull the repository. Make sure that both the ./GraphaRNA and ./GraphaRNA/RiNALMo are present. 
On the ./GraphaRNA branch use ```git checkout main``` and make sure that you've got the most current version.  
In .GraphaRNA download the pre-trained model: 

``` wget https://zenodo.org/records/13750967/files/model_epoch_800.tar.gz?download=1 -O model_epoch_800.tar.gz ```

``` tar -xvzf model_epoch_800.tar.gz && mv model_800.h5 save/grapharna/ ```

There is a necessery .env file in the root folder of the project, the structure should be as follows: 

```
DATABASE_NAME=dockerdjango 
DATABASE_USERNAME=dbuser
DATABASE_PASSWORD=dbpassword
```


!!! Remember about the .env file in the backend section !!!

Then turn on Docker Desktop run the ```docker compose build``` and ```docker compose up``` commands.
After that all the container should be visible and on in the Docker Desktop app.


# GraphaRNA-web ~ backend

## Environment setup

#### First run

To start using this project correctly you need to open this directory in CommandLine, then create a virtual environment by running: 
```python -m venv venv```

To run the virtual environment:  
MAC/Linux: run: ```source venv/bin/activate```  
Windows: run: ```venv\Scripts\activate```

After activating (venv) install the dependencies by running:
```pip install -r requirements.txt```

You should make migrations before starting the application:
```python manage.py migrate```

#### DotEnv Configuration

To store some configuration variables use```.env``` file. It should be located in /.env
The format of the .env file in the .backend folder should match the following example:
```
DJANGO_SECRET_KEY=django-insecure-l_nyz6vaakzlajt&vp+6vh727b2baq=o(!z34rbzmx!r%i9b3_
DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1, localhost

DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=dockerdjango
DATABASE_USERNAME=dbuser
DATABASE_PASSWORD=dbpassword
DATABASE_HOST=db
DATABASE_PORT=5432

CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672//

VALID_BRACKETS=()<>[]{}AaBbCcDd.
VALID_NUCLEOTIDES=AUGCT
VALID_PAIRS = "GCCGAUUAGUUG"

ENGINE_TEST_URL = http://grapharna-engine:8080/test
ENGINE_URL = http://grapharna-engine:8080/test

JOB_EXPIRATION_WEEKS=2

UUID_HASH_LENGTH=5

MODEL_NAME=model_800.h5
MODEL_EPOCHS=800

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_HOST_USER=grapharnaput@gmail.com
EMAIL_HOST_PASSWORD=luqmkuabzqhfpyib

RESULT_BASE_URL=http://localhost:8000/api/getResults/

TEMPLATE_PATH_JOB_CREATED=email_templates/template_job_created.html
TEMPLATE_PATH_JOB_FINISHED=email_templates/template_job_finished.html
TEMPLATE_PATH_JOB_NEAR_EXPIRATION=email_templates/template_job_near_expiration.html
EMAIL_TITLE_JOB_CREATED=Your job has been created!
EMAIL_TITLE_JOB_FINISHED=Your job is finished!
EMAIL_TITLE_JOB_NEAR_EXPIRATION=Your job is about to expire!
 ```


## Running the application

To run the Django Project run command:

```python manage.py runserver```

## Documentations

Swagger documentation visible at ```/swagger/```, ```/swagger.json/``` and ```/swagger.yaml/``` 
Redoc documentation at ```/redoc/``` 

## Code Audit

In order to format the code properly run:
```
make format
```

To check the quality of the code run:
```
make lint
```
