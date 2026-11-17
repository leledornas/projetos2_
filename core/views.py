from django.shortcuts import render

ETAPAS = [
    {"codigo": "M01", "nome": "Preparação"},
    {"codigo": "M02", "nome": "Processamento"},
    {"codigo": "M03", "nome": "Montagem"},
    {"codigo": "M04", "nome": "Finalização"},
]

PASSOS_LABELS = ["Início", "Simulação 1", "Intervalo", "Simulação 2", "Comparativo"]

# Dados ilustrativos de cada máquina (prova de conceito)
MAQUINAS_SIM1 = [
    {"id": 1, "nome": "Máquina 01", "etapa": "Preparação",
     "temperatura": 64.0, "temp_limite": 80, "vibracao": 0.90, "vib_limite": 2.0,
     "eficiencia": 97, "uptime": "4h 22m"},
    {"id": 2, "nome": "Máquina 02", "etapa": "Processamento",
     "temperatura": 71.0, "temp_limite": 80, "vibracao": 1.10, "vib_limite": 2.0,
     "eficiencia": 98, "uptime": "4h 22m"},
    {"id": 3, "nome": "Máquina 03", "etapa": "Montagem",
     "temperatura": 58.5, "temp_limite": 75, "vibracao": 0.70, "vib_limite": 2.0,
     "eficiencia": 96, "uptime": "4h 22m"},
    {"id": 4, "nome": "Máquina 04", "etapa": "Finalização",
     "temperatura": 49.0, "temp_limite": 70, "vibracao": 0.50, "vib_limite": 1.5,
     "eficiencia": 99, "uptime": "4h 22m"},
]


def _passos(ativo):
    return [{"label": l, "ativo": i == ativo} for i, l in enumerate(PASSOS_LABELS)]


def intro(request):
    return render(request, "core/intro.html", {"etapas": ETAPAS, "passos": _passos(0)})


def simulacao1(request):
    # Máquina 02 vem selecionada por padrão
    return render(request, "core/simulacao1.html", {
        "maquinas": MAQUINAS_SIM1,
        "selecionada": 2,
        "passos": _passos(1),
    })
