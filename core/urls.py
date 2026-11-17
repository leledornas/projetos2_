from django.urls import path
from . import views

app_name = "core"

urlpatterns = [
    path("", views.intro, name="intro"),
    path("simulacao-1/", views.simulacao1, name="simulacao1"),
]
