(() => {
  const local = ["127.0.0.1", "localhost"].includes(location.hostname);
  window.HIKARI_CONFIG = Object.freeze({
    catalogApiBase: local ? "http://127.0.0.1:3011" : "https://internalhikaritractors.vercel.app",
    storefront: Object.freeze({
      phone: "+62 852-8755-1869",
      email: "info@hikaritractors.com",
      genuineLabel: "Model-first parts identification & RFQ support",
      currencies: Object.freeze({
        IDR: Object.freeze({ code: "IDR", symbol: "Rp", usdRate: 16300, locale: "id-ID", fractionDigits: 0 }),
        USD: Object.freeze({ code: "USD", symbol: "$", usdRate: 1, locale: "en-US", fractionDigits: 2 })
      })
    })
  });
})();
