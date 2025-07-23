from django.urls import path
#from .views import PostRnaValidation, PostRnaData
import api.views

urlpatterns = [
    path('ValidateRNA/', api.views.PostRnaValidation),
    path('postRequestData/', api.views.ProcessRequestData),
    path('hello/',api.views.hello_view),
    path('healthcheck/', api.views.healthcheck)
]
