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

# Sequência da falha (Tela 3). A falha começa na máquina SELECIONADA quando o
# botão é clicado e se propaga para as demais (primeiro as seguintes na linha,
# depois as anteriores). Por isso os eventos não citam uma máquina fixa:
#   "alvo": "origem"      -> a máquina que falhou   ({maquina} vira o nome dela)
#   "alvo": "propagacao"  -> a próxima máquina afetada, na ordem da propagação
# "tom" = cor do marcador (ok / erro / aviso); "atraso" = ms antes do evento.
SEQUENCIA_FALHA = [
    {"hora": "10:00", "texto": "Linha em operação normal",
     "tom": "ok", "atraso": 0},
    {"hora": "10:15", "texto": "{maquina} — falha completa",
     "tom": "erro", "atraso": 800, "alvo": "origem", "estado": "erro", "efic": 0},
    {"hora": "10:45", "texto": "Produção acumula atraso",
     "tom": "aviso", "atraso": 800, "alvo": "propagacao", "estado": "afetada", "efic": 0},
    {"hora": "11:30", "texto": "Pedido impactado — prazo em risco",
     "tom": "aviso", "atraso": 800, "alvo": "propagacao", "estado": "afetada", "efic": 0},
    {"hora": "12:00", "texto": "Custos estimados em crescimento",
     "tom": "aviso", "atraso": 800, "alvo": "propagacao", "estado": "afetada", "efic": 0},
]

# Cards "Impacto estimado (simulado)" — valores ilustrativos
IMPACTOS = [
    {"valor": 140, "prefixo": "",   "sufixo": "min", "rotulo": "Tempo perdido", "sub": "produção"},
    {"valor": 72,  "prefixo": "",   "sufixo": "h",   "rotulo": "Atraso",        "sub": "no pedido"},
    {"valor": 38,  "prefixo": "R$", "sufixo": "k",   "rotulo": "Custo est.",    "sub": "ilustrativo"},
    {"valor": 4,   "prefixo": "",   "sufixo": "/4",  "rotulo": "Etapas",        "sub": "afetadas"},
]


# ---------- Tela 6: Simulação 2 — decisão preventiva (com BZU) ----------
# Mesmas máquinas da Simulação 1, mas a Máquina 02 já apresenta a anomalia
# detectada pelo sensor (valores perto do limite). Valores ilustrativos.
MAQUINAS_SIM2 = [dict(m) for m in MAQUINAS_SIM1]
MAQUINAS_SIM2[1].update(temperatura=79.2, vibracao=1.85, eficiencia=91)

# Como a Máquina 02 fica depois de "Acionar manutenção"
MAQUINA2_ESTABILIZADA = {"temperatura": 72.0, "vibracao": 1.20, "eficiencia": 97}

# Linha do tempo de cada momento da tela. "tom" = cor do marcador
# (ok / erro / aviso); "atraso" = ms antes do evento aparecer.
EVENTOS_DECISAO = {
    "inicio": [
        {"hora": "00:00", "texto": "Linha em operação normal", "tom": "ok"},
        {"hora": "00:30", "texto": "Sensores detectam aumento de temperatura na Máquina 02",
         "tom": "aviso"},
        {"hora": "00:45", "texto": "Alerta preditivo: anomalia detectada antes da parada completa",
         "tom": "aviso"},
    ],
    "verificar": [
        {"hora": "00:50", "texto": "Operador verificou os dados da Máquina 02", "tom": "aviso"},
    ],
    "manutencao": [
        {"hora": "01:00", "texto": "Manutenção acionada na Máquina 02", "tom": "ok", "atraso": 0},
        {"hora": "01:15", "texto": "Máquina 02 estabilizada — temperatura e vibração normalizadas",
         "tom": "ok", "atraso": 900, "maquina": 2, "estado": "normal"},
        {"hora": "01:30", "texto": "Linha concluída sem parada", "tom": "ok", "atraso": 900},
    ],
    "ignorar": [
        {"hora": "01:00", "texto": "Alerta ignorado pelo operador", "tom": "aviso", "atraso": 0},
        {"hora": "01:15", "texto": "Máquina 02 — falha completa",
         "tom": "erro", "atraso": 900, "maquina": 2, "estado": "erro"},
        {"hora": "01:45", "texto": "Máquina 03 afetada — produção acumula atraso",
         "tom": "aviso", "atraso": 900, "maquina": 3, "estado": "afetada"},
        {"hora": "02:15", "texto": "Máquina 04 afetada — pedido impactado",
         "tom": "aviso", "atraso": 900, "maquina": 4, "estado": "afetada"},
        {"hora": "02:30", "texto": "Máquina 01 afetada — produção parada em toda a cadeia",
         "tom": "aviso", "atraso": 900, "maquina": 1, "estado": "afetada"},
    ],
}


def _passos(ativo):
    return [{"label": l, "ativo": i == ativo} for i, l in enumerate(PASSOS_LABELS)]


def intro(request):
    return render(request, "core/intro.html", {"etapas": ETAPAS, "passos": _passos(0)})


def simulacao1(request):
    # Nenhuma máquina vem selecionada: o usuário escolhe qual vai falhar
    return render(request, "core/simulacao1.html", {
        "maquinas": MAQUINAS_SIM1,
        "selecionada": None,
        "sequencia": SEQUENCIA_FALHA,
        "impactos": IMPACTOS,
        "passos": _passos(1),
    })


def site_oficial(request):
    # Frame "site-oficial" do Figma (node 1-266): 1167x976, fundo #08041A.
    # O GhostBtn leva para a Tela 2 (animação de altura 976 -> 775).
    return render(request, "core/site_oficial.html", {
        "passos": _passos(0),
        "proxima_url": "core:simulacao1",   # GhostBtn -> Tela 2
    })


def intervalo(request):
    return render(request, "core/intervalo.html", {
        "passos": _passos(2),
    })


def decisao(request):
    # Tela 6: alerta de anomalia na Máquina 02 + decisão do operador (US04/US06).
    return render(request, "core/decisao.html", {
        "maquinas": MAQUINAS_SIM2,
        "selecionada": 2,
        "config": {
            "eventos": EVENTOS_DECISAO,
            "estabilizada": MAQUINA2_ESTABILIZADA,
        },
        "passos": _passos(3),
    })
