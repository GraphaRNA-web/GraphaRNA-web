from django.urls import path

# from .views import PostRnaValidation, PostRnaData
import api.views

urlpatterns = [
    path("validateRNA/", api.views.PostRnaValidation),
    path("postRequestData/", api.views.ProcessRequestData),
    path("hello/", api.views.hello_view),
    path("healthcheck/", api.views.healthcheck),
    path("getResults/", api.views.GetResults),
    path("testRequest/", api.views.TestRequest),
    path("getSuggestedSeedAndJobName/", api.views.GetSuggestedSeedAndJobName),
    path("testEngineRun/", api.views.testEngineRun),
]
