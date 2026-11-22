document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".mcard");
  const app = document.querySelector(".app");
  const $ = (id) => document.getElementById(id);

  const ROTULOS_CARD = { aguardando: "Aguardando", erro: "Erro", afetada: "Afetada" };
  const ROTULOS_PAINEL = { aguardando: "Aguardando", erro: "Offline", afetada: "Afetada" };
  const AVISOS = {
    erro: "Máquina interrompida — sem leitura",
    afetada: "Máquina parada — aguardando material",
  };

  const btnFalha = $("btn-falha");
  let emAndamento = false;

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const pct = (v, max) => Math.max(0, Math.min(100, (v / max) * 100));
  const reduzMovimento = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Helpers tolerantes: se um elemento não existir, não quebram o resto
  const setText = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
  const toggle = (id, cls, on) => { const el = $(id); if (el) el.classList.toggle(cls, on); };
  const mostrar = (id) => {
    const el = $(id);
    if (!el) return;
    el.hidden = false;
    el.classList.add("aparece");
  };

  // ---------- Painel de detalhes ----------
  // Painel vazio: nenhuma máquina selecionada
  function limparPainel() {
    const st = $("d-status");
    if (st) st.dataset.estado = "aguardando";
    setText("d-status-txt", "Aguardando seleção");
    setText("d-titulo", "Selecione uma máquina");
    setText("d-temp", "—");
    setText("d-temp-lim", "Limite: —");
    setText("d-vib", "—");
    setText("d-vib-lim", "Limite: —");
    setText("d-efic", "—");
    setText("d-uptime", "—");
    ["d-temp-bar", "d-vib-bar"].forEach((id) => {
      const b = $(id);
      if (b) { b.style.width = "0%"; b.classList.remove("is-over"); }
    });
    ["d-temp", "d-vib"].forEach((id) => toggle(id, "is-over", false));
    toggle("d-efic", "is-zero", false);
    const aviso = $("d-aviso");
    if (aviso) aviso.hidden = true;
  }

  // "Iniciar falha" só vale com uma máquina escolhida
  function atualizarBotao() {
    const temSelecao = !!document.querySelector(".mcard.is-selected");
    if (btnFalha && !emAndamento) btnFalha.disabled = !temSelecao;
    const dica = $("dica-selecao");
    if (dica) dica.hidden = temSelecao;
  }

  function inspecionar(card) {
    cards.forEach((c) => {
      const ativo = c === card;
      c.classList.toggle("is-selected", ativo);
      c.setAttribute("aria-selected", ativo ? "true" : "false");
    });

    if (!card) {
      limparPainel();
      atualizarBotao();
      return;
    }

    const d = card.dataset;
    const estado = d.estado || "aguardando";
    const offline = estado === "erro";        // Máquina em erro: sem leitura

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
    if (tempBar) tempBar.style.width = offline ? "0%" : pct(parseFloat(d.temp), 100) + "%";
    if (vibBar) vibBar.style.width = offline ? "0%" : pct(parseFloat(d.vib), 4) + "%";

    const tempAlta = !offline && parseFloat(d.temp) > parseFloat(d.tempLim);
    const vibAlta = !offline && parseFloat(d.vib) > parseFloat(d.vibLim);
    if (tempBar) tempBar.classList.toggle("is-over", tempAlta);
    if (vibBar) vibBar.classList.toggle("is-over", vibAlta);
    toggle("d-temp", "is-over", tempAlta);
    toggle("d-vib", "is-over", vibAlta);
    toggle("d-temp", "is-dim", offline);
    toggle("d-vib", "is-dim", offline);
    toggle("d-uptime", "is-dim", offline);
    toggle("d-efic", "is-zero", estado !== "aguardando");

    const aviso = $("d-aviso");
    if (aviso) {
      aviso.hidden = !AVISOS[estado];
      setText("d-aviso-txt", AVISOS[estado] || "");
    }
    toggle("d-efic", "is-dim", false);
    atualizarBotao();
  }

  cards.forEach((card) => card.addEventListener("click", () => inspecionar(card)));

  // Nenhuma máquina vem selecionada, a não ser que o HTML marque uma
  const inicial = document.querySelector(".mcard.is-selected");
  try {
    inspecionar(inicial);          // null → painel vazio e botão desabilitado
  } catch (e) {
    console.error("[simulacao] erro ao montar o painel de detalhes:", e);
  }

  // ---------- Tela 3: resultado da falha ----------
  const dadosSeq = $("sequencia-falha");
  const sequencia = dadosSeq ? JSON.parse(dadosSeq.textContent) : [];

  function aplicarEstado(card, estado) {
    card.dataset.estado = estado;
    card.classList.toggle("is-failing", estado === "erro");
    card.classList.toggle("is-afetada", estado === "afetada");
    const txt = card.querySelector(".mcard__status-txt");
    if (txt) txt.textContent = ROTULOS_CARD[estado];
  }

  function adicionarNaLinhaDoTempo(ev) {
    const lista = $("timeline");
    if (!lista) return;
    const vazio = lista.querySelector(".timeline__empty");
    if (vazio) vazio.remove();

    const li = document.createElement("li");
    li.className = `timeline__item tom-${ev.tom || "ok"}`;
    const hora = document.createElement("span");
    hora.className = "timeline__time";
    hora.textContent = ev.hora;
    const texto = document.createElement("span");
    texto.className = "timeline__text";
    texto.textContent = ev.texto;
    li.append(hora, texto);
    lista.appendChild(li);
  }

  // Ordem em que a falha se propaga a partir da máquina de origem:
  // primeiro as seguintes na linha, depois as anteriores (da mais próxima à mais distante).
  function ordemDePropagacao(origem) {
    const lista = Array.from(cards);
    const i = lista.indexOf(origem);
    return [...lista.slice(i + 1), ...lista.slice(0, i).reverse()];
  }

  function executarEvento(ev, origem, fila) {
    adicionarNaLinhaDoTempo({
      ...ev,
      texto: ev.texto.replace("{maquina}", origem.dataset.nome),
    });

    let card = null;
    if (ev.alvo === "origem") card = origem;
    else if (ev.alvo === "propagacao") card = fila.shift();
    if (!card) return;
    if (ev.efic !== undefined) card.dataset.efic = String(ev.efic);
    aplicarEstado(card, ev.estado);

    // Se a máquina aberta no painel mudou, atualiza o painel
    if (card.classList.contains("is-selected")) {
      try { inspecionar(card); } catch (e) { console.error("[simulacao] painel:", e); }
    }
  }

  // Contagem animada dos cards de impacto
  function animarImpactos() {
    document.querySelectorAll(".impacto").forEach((box) => {
      const alvo = parseFloat(box.dataset.valor) || 0;
      const prefixo = box.dataset.prefixo || "";
      const sufixo = box.dataset.sufixo || "";
      const el = box.querySelector(".impacto__valor");
      if (!el) return;
      const formatar = (v) => `${prefixo}${Math.round(v)}${sufixo}`;

      if (reduzMovimento) { el.textContent = formatar(alvo); return; }

      const duracao = 1000;
      const inicio = performance.now();
      const passo = (agora) => {
        const t = Math.min(1, (agora - inicio) / duracao);
        const suave = 1 - Math.pow(1 - t, 3);          // ease-out
        el.textContent = formatar(alvo * suave);
        if (t < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }

  async function iniciarFalha() {
    if (emAndamento) return;
    if (!Array.isArray(sequencia) || sequencia.length === 0) {
      console.error('[simulacao] sequência vazia: confira "sequencia" no views.py e o json_script no template.');
      return;
    }
    // A falha começa na máquina que está selecionada agora
    const origem = document.querySelector(".mcard.is-selected");
    if (!origem) return;                       // nenhuma máquina escolhida
    emAndamento = true;
    const fila = ordemDePropagacao(origem);
    document.dispatchEvent(new CustomEvent("simulador:iniciar-falha", {
      detail: { maquina: origem.dataset.id },
    }));

    // A Tela 3 surge assim que o botão é apertado
    if (btnFalha) btnFalha.disabled = true;
    if (app) app.classList.add("is-falha");
    setText("linha-titulo", "Simulação de falha direcionada");
    mostrar("painel-impacto");

    for (const ev of sequencia) {
      await esperar(reduzMovimento ? 0 : ev.atraso);
      executarEvento(ev, origem, fila);
    }

    setText("sim-lead", "Simulação concluída. Uma falha isolada gerou impacto em toda a cadeia.");
    animarImpactos();
    await esperar(reduzMovimento ? 0 : 600);
    mostrar("insight");
    mostrar("btn-proxima");
    document.dispatchEvent(new CustomEvent("simulador:falha-concluida"));
  }

  if (btnFalha) btnFalha.addEventListener("click", iniciarFalha);

  // "Continuar para a próxima simulação": rota ainda não existe
  const btnProxima = $("btn-proxima");
  if (btnProxima) {
    btnProxima.addEventListener("click", (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("simulador:proxima"));
      // TODO: apontar para a Simulação 2 quando existir
    });
  }
});
