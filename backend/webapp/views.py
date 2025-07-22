# from django.shortcuts import render
# from django.shortcuts import get_object_or_404, render, redirect
from rest_framework.decorators import api_view
from rest_framework.response import Response 
from rest_framework import status




@api_view(['GET'])
def hello(request):
    name = request.GET.get('name', 'guest')
    data = {
        'name': name,
        'message': f"Hello {name}"
    }
    return Response(data, status=status.HTTP_200_OK)





# Create your views here.
