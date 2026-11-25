from django.urls import path
from . import views

app_name = "core"

urlpatterns = [
    path("", views.intro, name="intro"),
    path("simulacao-1/", views.simulacao1, name="simulacao1"),
    path("site-oficial/", views.site_oficial, name="site_oficial"),
    path("intervalo/", views.intervalo, name="intervalo"),
    path("simulacao-2/decisao/", views.decisao, name="decisao"),
    path('tela5/', views.tela5, name='tela5'),
]
