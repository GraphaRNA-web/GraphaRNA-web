from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
import random
from datetime import date
from webapp.models import Job



def ValidateEmailAddress(email):
    validator = EmailValidator()
    try:
        validator(email)
        return True
    except ValidationError:
        return False

def RnaValidation(rna):
    znaki = set('AUGC')
    if rna is None or any(char not in znaki for char in rna.upper()) :
        return False
    else:
        return True


@api_view(['POST'])
def PostRnaValidation(request):
    rna = request.data.get('RNA')

    if not rna:
        return Response(
            {"success": False, "error": "Brak danych RNA."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not RnaValidation(rna):
        return Response(
        {"success": False, "error": "Niepoprawna sekwencja RNA."},
        status=status.HTTP_400_BAD_REQUEST
        )

    return Response(
        {"success": True, "message": "Sekwencja RNA jest poprawna."},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
def PostRnaData(request):
    rna = request.data.get('RNA')
    seed = request.data.get('seed')
    jobName = request.data.get('job_name')
    email = request.data.get('email')
    today_str = date.today().strftime("%Y%m%d")
    count = Job.objects.filter(job_name__startswith=f"job-{today_str}").count()

    #random.seed(XXX)
    try:
        seed = int(seed)
    except(TypeError, ValueError):
        seed = random.randint(1, 1000000000)

    if not RnaValidation(rna):
        return Response(
        {"success": False, "error": "Niepoprawna sekwencja RNA."},
        status=status.HTTP_400_BAD_REQUEST
        )
    
    if not ValidateEmailAddress(email):
            return Response(
            {"success": False, "error": "Niepoprawna forma emaila."},
            status=status.HTTP_400_BAD_REQUEST
            )
    if not jobName:
        jobName=f'job-{today_str}-{count}'

    job = Job.objects.create(
    input_structure=rna,
    seed = seed,
    job_name = jobName,
    email = email
    )
    return Response({"success":True,"Job":job.job_name})
    








@api_view(['GET'])
def hello_view(request):
    name = request.GET.get('name', 'Guest')
    return Response({"message": f"Cześć, {name}!"})
