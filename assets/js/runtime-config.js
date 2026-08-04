(() => {
  const local = ["127.0.0.1", "localhost"].includes(location.hostname);
  window.HIKARI_CONFIG = Object.freeze({
    catalogApiBase: local ? "http://127.0.0.1:3011" : "https://internalhikaritractors.vercel.app",
  });
})();
