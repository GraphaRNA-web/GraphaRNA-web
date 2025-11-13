from django.urls import path

import api.views
from GraphaRNA import settings

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
    path(
        "processExampleRequestData/",
        api.views.ProcessExampleRequestData,
        name="processExampleRequestData",
    ),
]

if settings.DEBUG:
    urlpatterns += [
        path("test/setupTestJob/", api.views.SetupTestJob, name="setupTestJob")
    ]
    urlpatterns += [
        path(
            "test/setupTestJobResults/",
            api.views.SetupTestJobResults,
            name="setupTestJobResults",
        )
    ]
    urlpatterns += [
        path("test/cleanupTestData/", api.views.CleanupTestData, name="cleanupTestData")
    ]
