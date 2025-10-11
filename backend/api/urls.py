from django.urls import path

import api.views

urlpatterns = [
    path("validateRNA/", api.views.PostRnaValidation, name="validateRNA"),
    path("postRequestData/", api.views.ProcessRequestData, name="postRequestData"),
    path("hello/", api.views.hello_view),
    path("healthcheck/", api.views.healthcheck, name="healthcheck"),
    path("getResults/", api.views.GetResults, name="getResults"),
    path("testRequest/", api.views.TestRequest, name="testRequest"),
    path("downloadZip/", api.views.DownloadZipFile, name="downloadZip"),
    path(
        "getSuggestedSeedAndJobName/",
        api.views.GetSuggestedSeedAndJobName,
        name="getSuggestedSeedAndJobName",
    ),
    path("testEngineRun/", api.views.testEngineRun, name="testEngineRun"),
]
