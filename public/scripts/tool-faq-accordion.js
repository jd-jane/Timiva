(() => {
  document.querySelectorAll('[data-tool-faq-accordion="single"]').forEach((faqRoot) => {
    const triggers = faqRoot.querySelectorAll(".tool-faq-trigger");

    triggers.forEach((trigger) => {
      const panelId = trigger.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;

      if (!panel) {
        return;
      }

      trigger.addEventListener("click", () => {
        const isOpen = trigger.getAttribute("aria-expanded") === "true";

        triggers.forEach((otherTrigger) => {
          const otherPanelId = otherTrigger.getAttribute("aria-controls");
          const otherPanel = otherPanelId ? document.getElementById(otherPanelId) : null;

          otherTrigger.setAttribute("aria-expanded", "false");
          otherPanel?.setAttribute("hidden", "");
        });

        if (!isOpen) {
          trigger.setAttribute("aria-expanded", "true");
          panel.removeAttribute("hidden");
        }
      });
    });
  });
})();
