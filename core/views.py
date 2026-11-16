from django.shortcuts import render

ETAPAS = [
    {"codigo": "M01", "nome": "Preparação"},
    {"codigo": "M02", "nome": "Processamento"},
    {"codigo": "M03", "nome": "Montagem"},
    {"codigo": "M04", "nome": "Finalização"},
]

PASSOS = [
    {"label": "Intro", "ativo": True},
    {"label": "Simulação 1", "ativo": False},
    {"label": "Intervalo", "ativo": False},
    {"label": "Simulação 2", "ativo": False},
    {"label": "Comparativo", "ativo": False},
]


def intro(request):
    return render(request, "core/intro.html", {"etapas": ETAPAS, "passos": PASSOS})
