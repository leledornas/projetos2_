document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".mcard");
  const $ = (id) => document.getElementById(id);

  const pct = (v, max) => Math.max(0, Math.min(100, (v / max) * 100));

  // Atualiza o painel de detalhes com os dados da máquina clicada
  function inspecionar(card) {
    cards.forEach((c) => {
      const ativo = c === card;
      c.classList.toggle("is-selected", ativo);
      c.setAttribute("aria-selected", ativo ? "true" : "false");
    });

    const d = card.dataset;
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
  }

  cards.forEach((card) => card.addEventListener("click", () => inspecionar(card)));

  const inicial = document.querySelector(".mcard.is-selected") || cards[0];
  if (inicial) inspecionar(inicial);

  // Botão "Iniciar falha": ponto de partida para a animação do efeito dominó
  const btnFalha = $("btn-falha");
  if (btnFalha) {
    btnFalha.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("simulador:iniciar-falha"));
      // TODO: implementar a sequência da falha (efeito dominó entre as máquinas)
    });
  }
});
