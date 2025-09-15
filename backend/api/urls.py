from django.urls import path

import api.views

urlpatterns = [
    path("validateRNA/", api.views.PostRnaValidation, name="validateRNA"),
    path("postRequestData/", api.views.ProcessRequestData, name="postRequestData"),
    path("healthcheck/", api.views.healthcheck),
    path("getResults/", api.views.GetResults, name="getResults"),
    path("getSuggestedSeedAndJobName/", api.views.GetSuggestedSeedAndJobName),
]
