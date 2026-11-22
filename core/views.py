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

# Sequência da falha (Tela 3): cada evento aparece na linha do tempo e muda o
# estado de uma máquina. "atraso" = ms de espera ANTES do evento (ritmo da demo).
SEQUENCIA_FALHA = [
    {"tempo": "00:00", "maquina": 2, "estado": "falha", "alerta": True, "atraso": 600,
     "texto": "Máquina 02 ultrapassa o limite de temperatura. Nenhum alerta é emitido.",
     "temp": 86.0, "vib": 2.40, "efic": 74},
    {"tempo": "00:12", "maquina": 2, "estado": "falha", "alerta": True, "atraso": 1800,
     "texto": "Máquina 02 para de operar.",
     "temp": 93.0, "vib": 3.10, "efic": 0},
    {"tempo": "00:20", "maquina": 3, "estado": "parada", "alerta": False, "atraso": 1800,
     "texto": "Máquina 03 fica sem peças para montar e para.",
     "efic": 0},
    {"tempo": "00:31", "maquina": 4, "estado": "parada", "alerta": False, "atraso": 1800,
     "texto": "Máquina 04 fica sem material e a finalização para.",
     "efic": 0},
    {"tempo": "00:45", "maquina": 1, "estado": "parada", "alerta": False, "atraso": 1800,
     "texto": "Máquina 01 não tem para onde enviar o material e para.",
     "efic": 0},
    {"tempo": "00:50", "maquina": None, "estado": None, "alerta": True, "atraso": 1500,
     "texto": "Linha de produção totalmente parada."},
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
        "sequencia": SEQUENCIA_FALHA,
        "passos": _passos(1),
    })

def site_oficial(request):
    # Frame "site-oficial" do Figma (node 1-266): 1167x976, fundo #08041A.
    # O GhostBtn leva para a Tela 2 (animação de altura 976 -> 775).
    return render(request, "core/site_oficial.html", {
        "passos": _passos(0),
        "proxima_url": "core:simulacao1",   # GhostBtn -> Tela 2
    })