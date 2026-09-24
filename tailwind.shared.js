// Same brand tokens the Play-CDN <script> blocks used to define inline.
// gray-500/600 are nudged lighter: the stock values fall below WCAG AA (4.5:1)
// for small text on the near-black backgrounds this site uses.
module.exports = {
  theme: {
    extend: {
      colors: {
        charcoal: "#121212",
        charcoal2: "#1a1a1a",
        flame: { DEFAULT: "#FF6B00", light: "#FF8A3D", dark: "#CC5500" },
        ember: "#E63946",
        amber: { DEFAULT: "#FFB800" },
        gray: { 500: "#8a919e", 600: "#808897" },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        sans: ["'Poppins'", "sans-serif"],
      },
    },
  },
};
