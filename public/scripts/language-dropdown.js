(function () {
  const STORAGE_KEY = "preferredLocale";

  function setPreferredLocale(locale) {
    if (locale !== "en" && locale !== "zh") {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore storage errors */
    }
  }

  function closeDropdown(dropdown) {
    const trigger = dropdown.querySelector(".language-dropdown__trigger");
    const menu = dropdown.querySelector(".language-dropdown__menu");

    trigger?.setAttribute("aria-expanded", "false");
    menu?.setAttribute("hidden", "");
    dropdown.classList.remove("is-open");
  }

  function closeAllDropdowns() {
    document.querySelectorAll("[data-language-dropdown]").forEach(closeDropdown);
  }

  function openDropdown(dropdown) {
    const trigger = dropdown.querySelector(".language-dropdown__trigger");
    const menu = dropdown.querySelector(".language-dropdown__menu");

    trigger?.setAttribute("aria-expanded", "true");
    menu?.removeAttribute("hidden");
    dropdown.classList.add("is-open");
  }

  function initLanguageDropdowns() {
    document.querySelectorAll("[data-language-dropdown]").forEach((dropdown) => {
      if (dropdown.dataset.languageDropdownReady === "true") {
        return;
      }

      dropdown.dataset.languageDropdownReady = "true";

      const trigger = dropdown.querySelector(".language-dropdown__trigger");
      const links = dropdown.querySelectorAll("[data-locale]");

      trigger?.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = trigger.getAttribute("aria-expanded") === "true";

        closeAllDropdowns();

        if (!isOpen) {
          openDropdown(dropdown);
        }
      });

      links.forEach((link) => {
        link.addEventListener("click", () => {
          setPreferredLocale(link.getAttribute("data-locale"));
        });
      });
    });

    document.addEventListener("click", closeAllDropdowns);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAllDropdowns();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLanguageDropdowns);
  } else {
    initLanguageDropdowns();
  }
})();
