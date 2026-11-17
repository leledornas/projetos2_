document.addEventListener("DOMContentLoaded", () => {
  // Entrada em cascata dos elementos do hero
  const alvos = document.querySelectorAll(
    ".badge, .title__line, .lead, .machine, .cta, .hint"
  );
  alvos.forEach((el, i) => {
    el.classList.add("reveal");
    setTimeout(() => el.classList.add("is-in"), 80 + i * 70);
  });

  // Botão "Começar experiência": ponto de partida para a Simulação 1
  const btn = document.getElementById("btn-comecar");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("simulador:iniciar"));
      document.querySelector(".app").classList.add("is-leaving");
      setTimeout(() => { window.location.href = btn.href; }, 220);
    });
  }
});
