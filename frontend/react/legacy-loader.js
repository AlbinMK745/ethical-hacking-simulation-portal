// Shared loader for legacy scripts in React-mounted pages
window.LegacyLoader = window.LegacyLoader || {
  loadSequential: async function (sources) {
    for (const src of sources) {
      await new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-legacy-src="${src}"]`);
        if (existing) {
          if (existing.dataset.loaded === "true") {
            resolve();
            return;
          }
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.dataset.legacySrc = src;
        script.onload = () => {
          script.dataset.loaded = "true";
          resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
    }
  }
};
