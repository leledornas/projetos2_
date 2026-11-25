// Tela 6 — Simulação 2: o operador decide o que fazer com o alerta de anomalia.
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const cards = [...document.querySelectorAll(".mcard")];
  const botoes = [...document.querySelectorAll(".btn-decisao")];
  const timeline = $("timeline");
  const painelAlerta = $("painel-alerta");

  const cfgEl = $("config-decisao");
  if (!cfgEl) return;
  const cfg = JSON.parse(cfgEl.textContent);

  const reduzMovimento = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esperar = (ms) => new Promise((r) => setTimeout(r, reduzMovimento ? 0 : ms));
  const pct = (v, max) => Math.max(0, Math.min(100, (v / max) * 100));
  const setText = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
  const toggle = (id, cls, on) => { const el = $(id); if (el) el.classList.toggle(cls, on); };
  const mostrar = (id) => { const el = $(id); if (el) { el.hidden = false; el.classList.add("aparece"); } };
  const esconder = (id) => { const el = $(id); if (el) { el.hidden = true; el.classList.remove("aparece"); } };

  const ROTULOS_CARD = {
    operando: "Em operação", alerta: "Alerta preditivo", normal: "Normal",
    erro: "Falha", afetada: "Afetada",
  };
  const ROTULOS_PAINEL = {
    operando: "Em operação", alerta: "Alerta preditivo", normal: "Normal",
    erro: "Offline", afetada: "Afetada",
  };
  const AVISOS = {
    alerta: "Temperatura e vibração próximas do limite — risco de parada",
    erro: "Máquina interrompida — sem leitura",
    afetada: "Máquina parada — aguardando material",
  };
  const RESULTADOS = {
    manutencao: {
      tom: "ok",
      titulo: "Falha evitada: 0 de 4 etapas afetadas",
      texto: "A manutenção preventiva estabilizou a Máquina 02 antes da parada e a linha continuou produzindo.",
    },
    ignorar: {
      tom: "erro",
      titulo: "Falha propagada: 4 de 4 etapas afetadas",
      texto: "Ignorar o alerta deixou a falha chegar a toda a cadeia produtiva: parada total e prazo do pedido em risco.",
    },
  };

  // Estado inicial de cada máquina, para o "Tentar novamente"
  const inicial = cards.map((c) => ({ ...c.dataset }));
  let emAndamento = false;
  let verificado = false;

  // ---------- Painel de detalhes ----------
  function inspecionar(card) {
    cards.forEach((c) => {
      const ativo = c === card;
      c.classList.toggle("is-selected", ativo);
      c.setAttribute("aria-selected", ativo ? "true" : "false");
    });
    if (!card) return;

    const d = card.dataset;
    const estado = d.estado || "operando";
    const offline = estado === "erro";
    const temp = parseFloat(d.temp);
    const vib = parseFloat(d.vib);
    const tempLim = parseFloat(d.tempLim);
    const vibLim = parseFloat(d.vibLim);

    const st = $("d-status");
    if (st) st.dataset.estado = estado;
    setText("d-status-txt", ROTULOS_PAINEL[estado]);
    setText("d-titulo", `${d.nome} — ${d.etapa}`);

    setText("d-temp", offline ? "—" : `${d.temp}°C`);
    setText("d-temp-lim", `Limite: ${d.tempLim}°C`);
    setText("d-vib", offline ? "—" : `${d.vib} mm/s`);
    setText("d-vib-lim", `Limite: ${d.vibLim} mm/s`);
    setText("d-efic", `${d.efic}%`);
    setText("d-uptime", offline ? "—" : d.uptime);

    // Escalas ilustrativas: temperatura 0–100 °C, vibração 0–4 mm/s
    const tempBar = $("d-temp-bar");
    const vibBar = $("d-vib-bar");
    if (tempBar) tempBar.style.width = offline ? "0%" : pct(temp, 100) + "%";
    if (vibBar) vibBar.style.width = offline ? "0%" : pct(vib, 4) + "%";

    // "Perto do limite" (>= 90%) fica laranja; acima do limite, vermelho
    const tempAlta = !offline && temp > tempLim;
    const vibAlta = !offline && vib > vibLim;
    const tempPerto = !offline && !tempAlta && temp / tempLim >= 0.9;
    const vibPerto = !offline && !vibAlta && vib / vibLim >= 0.9;
    [["d-temp-bar", tempAlta, tempPerto], ["d-vib-bar", vibAlta, vibPerto]].forEach(([id, over, warn]) => {
      toggle(id, "is-over", over);
      toggle(id, "is-warn", warn);
    });
    [["d-temp", tempAlta, tempPerto], ["d-vib", vibAlta, vibPerto]].forEach(([id, over, warn]) => {
      toggle(id, "is-over", over);
      toggle(id, "is-warn", warn);
    });
    toggle("d-temp", "is-dim", offline);
    toggle("d-vib", "is-dim", offline);
    toggle("d-uptime", "is-dim", offline);
    toggle("d-efic", "is-zero", estado === "erro" || estado === "afetada");

    const aviso = $("d-aviso");
    if (aviso) {
      aviso.hidden = !AVISOS[estado];
      setText("d-aviso-txt", AVISOS[estado] || "");
    }
  }

  const selecionado = () => document.querySelector(".mcard.is-selected");
  cards.forEach((card) => card.addEventListener("click", () => inspecionar(card)));

  // ---------- Estado das máquinas ----------
  function definirEstado(card, estado) {
    card.dataset.estado = estado;
    card.classList.toggle("is-alerta", estado === "alerta");
    card.classList.toggle("is-normal", estado === "normal");
    card.classList.toggle("is-failing", estado === "erro");
    card.classList.toggle("is-afetada", estado === "afetada");
    const txt = card.querySelector(".mcard__status-txt");
    if (txt) txt.textContent = ROTULOS_CARD[estado];

    if (estado === "normal") {                      // manutenção: volta a valores normais
      card.dataset.temp = cfg.estabilizada.temperatura.toFixed(1);
      card.dataset.vib = cfg.estabilizada.vibracao.toFixed(2);
      card.dataset.efic = cfg.estabilizada.eficiencia;
    } else if (estado === "erro" || estado === "afetada") {
      card.dataset.efic = 0;
    }
    if (card === selecionado()) inspecionar(card);
  }

  // ---------- Linha do tempo ----------
  function registrar(ev) {
    const li = document.createElement("li");
    li.className = `timeline__item tom-${ev.tom || "ok"}`;
    const hora = document.createElement("span");
    hora.className = "timeline__time";
    hora.textContent = ev.hora;
    const texto = document.createElement("span");
    texto.className = "timeline__text";
    texto.textContent = ev.texto;
    li.append(hora, texto);
    timeline.appendChild(li);
  }

  // ---------- Fase do alerta ----------
  function definirFase(fase, texto) {
    const s = $("alerta-status");
    if (!s) return;
    s.dataset.fase = fase;
    s.textContent = texto;
    painelAlerta.classList.toggle("is-resolvida", fase === "resolvida");
    painelAlerta.classList.toggle("is-falha", fase === "falha");
  }

  const bloquearDecisao = (bloqueado) => botoes.forEach((b) => { b.disabled = bloqueado; });

  async function executar(acao) {
    emAndamento = true;
    bloquearDecisao(true);
    definirFase("resolvendo",
      acao === "manutencao" ? "Manutenção em andamento…" : "Alerta ignorado — falha em andamento…");

    for (const ev of cfg.eventos[acao]) {
      await esperar(ev.atraso || 0);
      registrar(ev);
      if (ev.maquina) {
        const card = cards.find((c) => Number(c.dataset.id) === ev.maquina);
        if (card) definirEstado(card, ev.estado);
      }
    }

    const r = RESULTADOS[acao];
    definirFase(acao === "manutencao" ? "resolvida" : "falha",
      acao === "manutencao" ? "Anomalia resolvida" : "Falha em toda a cadeia");
    const res = $("resultado");
    if (res) res.dataset.tom = r.tom;
    setText("resultado-titulo", r.titulo);
    setText("resultado-texto", r.texto);
    mostrar("resultado");
    // Comparativo só depois de resolver; se ignorou, o caminho é tentar de novo
    mostrar(acao === "manutencao" ? "btn-comparativo" : "btn-tentar");
    emAndamento = false;
  }

  function verificarDados() {
    const m2 = cards.find((c) => c.dataset.estado === "alerta") || cards[1];
    inspecionar(m2);
    const painel = $("detalhe");
    if (painel) {
      painel.classList.remove("is-destaque");
      void painel.offsetWidth;                      // reinicia a animação
      painel.classList.add("is-destaque");
    }
    if (!verificado) {
      verificado = true;
      cfg.eventos.verificar.forEach(registrar);
    }
  }

  botoes.forEach((b) => b.addEventListener("click", () => {
    if (emAndamento) return;
    const acao = b.dataset.acao;
    if (acao === "verificar") verificarDados();
    else executar(acao);
  }));

  // ---------- Tentar novamente ----------
  function reiniciar() {
    cards.forEach((c, i) => {
      Object.assign(c.dataset, inicial[i]);         // valores e estado originais
      definirEstado(c, inicial[i].estado);          // classes e rótulo
    });
    timeline.innerHTML = "";
    cfg.eventos.inicio.forEach(registrar);
    ["resultado", "btn-tentar", "btn-comparativo"].forEach(esconder);
    definirFase("alerta", "Aguardando decisão do operador");
    verificado = false;
    bloquearDecisao(false);
    inspecionar(cards.find((c) => c.dataset.estado === "alerta") || cards[1]);
  }

  const btnTentar = $("btn-tentar");
  if (btnTentar) btnTentar.addEventListener("click", reiniciar);

  // ---------- Início ----------
  cards.forEach((c) => definirEstado(c, c.dataset.estado));
  cfg.eventos.inicio.forEach(registrar);
  inspecionar(document.querySelector(".mcard.is-selected"));
});
