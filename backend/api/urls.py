from django.urls import path
#from .views import PostRnaValidation, PostRnaData
import api.views

urlpatterns = [
    path('ValidateRNA/', api.views.PostRnaValidation),
    path('SendRNA/', api.views.PostRnaData),
    path('hello/',api.views.hello_view)
]
