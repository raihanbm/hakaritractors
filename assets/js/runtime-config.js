(() => {
  const local = ["127.0.0.1", "localhost"].includes(location.hostname);
  window.HIKARI_CONFIG = Object.freeze({
    catalogApiBase: local ? "" : "https://internalhikaritractors.vercel.app",
    geoLookupUrl: "https://ipapi.co/json/",
    storefront: Object.freeze({
      phone: "+62 852-8755-1869",
      whatsapp: "6285287551869",
      email: "info@hikaritractors.com",
      genuineLabel: "Genuine Parts for Kubota Tractors",
      currencies: Object.freeze({
        IDR: Object.freeze({ code: "IDR", symbol: "Rp", usdRate: 16300 }),
        USD: Object.freeze({ code: "USD", symbol: "$", usdRate: 1 })
      })
    })
  });
})();
