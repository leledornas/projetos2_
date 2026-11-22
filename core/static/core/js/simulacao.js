document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".mcard");
  const $ = (id) => document.getElementById(id);
  const ROTULOS = { aguardando: "Aguardando", falha: "Falha", parada: "Parada" };
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  const pct = (v, max) => Math.max(0, Math.min(100, (v / max) * 100));

  // Atualiza o painel de detalhes com os dados da máquina clicada
  function inspecionar(card) {
    cards.forEach((c) => {
      const ativo = c === card;
      c.classList.toggle("is-selected", ativo);
      c.setAttribute("aria-selected", ativo ? "true" : "false");
    });

    const d = card.dataset;
    const estado = d.estado || "aguardando";
    $("d-status").dataset.estado = estado;
    $("d-status-txt").textContent = ROTULOS[estado];
    $("d-titulo").textContent = `${d.nome} — ${d.etapa}`;
    $("d-temp").textContent = `${d.temp}°C`;
    $("d-temp-lim").textContent = `Limite: ${d.tempLim}°C`;
    $("d-vib").textContent = `${d.vib} mm/s`;
    $("d-vib-lim").textContent = `Limite: ${d.vibLim} mm/s`;
    $("d-efic").textContent = `${d.efic}%`;
    $("d-uptime").textContent = d.uptime;

    // Escalas ilustrativas: temperatura 0–100 °C, vibração 0–4 mm/s
    $("d-temp-bar").style.width = pct(parseFloat(d.temp), 100) + "%";
    $("d-vib-bar").style.width = pct(parseFloat(d.vib), 4) + "%";
        // Acima do limite → vermelho
    const tempAlta = parseFloat(d.temp) > parseFloat(d.tempLim);
    const vibAlta = parseFloat(d.vib) > parseFloat(d.vibLim);
    $("d-temp-bar").classList.toggle("is-over", tempAlta);
    $("d-temp").classList.toggle("is-over", tempAlta);
    $("d-vib-bar").classList.toggle("is-over", vibAlta);
    $("d-vib").classList.toggle("is-over", vibAlta);
  }

  cards.forEach((card) => card.addEventListener("click", () => inspecionar(card)));

  const inicial = document.querySelector(".mcard.is-selected") || cards[0];
  if (inicial) inspecionar(inicial);

  // ---------- Tela 3: sequência da falha (efeito dominó) ----------
  const dadosSeq = document.getElementById("sequencia-falha");
  const sequencia = dadosSeq ? JSON.parse(dadosSeq.textContent) : [];

  function aplicarEstado(card, estado) {
    card.dataset.estado = estado;
    card.classList.toggle("is-failing", estado === "falha");
    card.classList.toggle("is-stopped", estado === "parada");
    card.querySelector(".mcard__status-txt").textContent = ROTULOS[estado];
  }

  function adicionarNaLinhaDoTempo(ev) {
    const lista = $("timeline");
    const vazio = lista.querySelector(".timeline__empty");
    if (vazio) vazio.remove();

    const li = document.createElement("li");
    li.className = "timeline__item" + (ev.alerta ? " is-alert" : "");
    const tempo = document.createElement("span");
    tempo.className = "timeline__time";
    tempo.textContent = ev.tempo;
    const texto = document.createElement("span");
    texto.className = "timeline__text";
    texto.textContent = ev.texto;
    li.append(tempo, texto);
    lista.appendChild(li);
  }

  function executarEvento(ev) {
    adicionarNaLinhaDoTempo(ev);
    if (!ev.maquina) return;

    const card = document.querySelector(`.mcard[data-id="${ev.maquina}"]`);
    if (!card) return;
    if (ev.temp !== undefined) card.dataset.temp = ev.temp.toFixed(1);
    if (ev.vib !== undefined) card.dataset.vib = ev.vib.toFixed(2);
    if (ev.efic !== undefined) card.dataset.efic = String(ev.efic);
    aplicarEstado(card, ev.estado);

    // Se a máquina aberta no painel mudou, atualiza o painel
    if (card.classList.contains("is-selected")) inspecionar(card);
  }

  const btnFalha = $("btn-falha");
  let emAndamento = false;

  if (btnFalha) {
    btnFalha.addEventListener("click", async () => {
      if (emAndamento) return;
      emAndamento = true;
      btnFalha.disabled = true;
      $("btn-falha-txt").textContent = "Falha em andamento…";
      document.dispatchEvent(new CustomEvent("simulador:iniciar-falha"));

      for (const ev of sequencia) {
        await esperar(ev.atraso);
        executarEvento(ev);
      }

      $("btn-falha-txt").textContent = "Falha concluída";
      document.dispatchEvent(new CustomEvent("simulador:falha-concluida"));
      // Próxima etapa (Intervalo / Simulação 2) ainda não existe.
    });
  }
});