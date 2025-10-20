from django.urls import path

import api.views

urlpatterns = [
    path("validateRNA/", api.views.PostRnaValidation, name="validateRNA"),
    path("postRequestData/", api.views.ProcessRequestData, name="postRequestData"),
    path("getResults/", api.views.GetResults, name="getResults"),
    path("healthcheck/", api.views.healthcheck, name="healthcheck"),
    path("getResults/", api.views.GetResults, name="getResults"),
    path("downloadZip/", api.views.DownloadZipFile, name="downloadZip"),
    path(
        "getSuggestedSeedAndJobName/",
        api.views.GetSuggestedSeedAndJobName,
        name="getSuggestedSeedAndJobName",
    ),
    path("activeJobs/", api.views.getActiveJobs, name="getActiveJobs"),
    path("finishedJobs/", api.views.getFinishedJobs, name="getFinishedJobs"),
]
