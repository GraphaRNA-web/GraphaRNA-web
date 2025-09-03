from django.urls import path

import api.views

urlpatterns = [
    path("validateRNA/", api.views.PostRnaValidation, name="validateRNA"),
    path("postRequestData/", api.views.ProcessRequestData, name="postRequestData"),
    path("hello/", api.views.hello_view),
    path("healthcheck/", api.views.healthcheck),
    path("getResults/", api.views.GetResults),
    path("testRequest/", api.views.TestRequest),
    path("getSuggestedSeedAndJobName/", api.views.GetSuggestedSeedAndJobName),
    path("testEngineRun/", api.views.testEngineRun),
    path("ActiveJobs/", api.views.getActiveJobs, name="getActiveJobs"),
]
