(() => {
  const local = ["127.0.0.1", "localhost"].includes(location.hostname);
  window.HIKARI_CONFIG = Object.freeze({
    catalogApiBase: local ? "http://127.0.0.1:3011" : "https://internalhikaritractors.vercel.app",
    storefront: Object.freeze({
      phone: "+66 2 123 4567",
      email: "support@hikaritractors.com",
      genuineLabel: "Genuine Parts for Kubota Tractors",
      currency: Object.freeze({ code: "THB", symbol: "฿", usdRate: 35.8 })
    })
  });
})();
