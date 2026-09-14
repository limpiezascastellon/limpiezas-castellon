const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // Archivos que no deben convertirse en páginas web
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("HORAS.md");
  eleventyConfig.ignores.add("WHATSAPP.md");
  eleventyConfig.ignores.add("SEO.md");
  eleventyConfig.ignores.add("lib/**");
  eleventyConfig.ignores.add("api/**");
  eleventyConfig.ignores.add("node_modules/**");
  // Paneles internos: se copian tal cual, no deben pasar por la plantilla
  eleventyConfig.ignores.add("admin/**");
  eleventyConfig.ignores.add("admin-presupuestos.html");
  eleventyConfig.ignores.add("horas.html");

  // Archivos y carpetas que se copian tal cual al sitio final
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("admin-presupuestos.html");
  eleventyConfig.addPassthroughCopy("horas.html");
  eleventyConfig.addPassthroughCopy("admin-logo.js");
  eleventyConfig.addPassthroughCopy("datos");
  eleventyConfig.addPassthroughCopy("robots.txt");

  // Fecha en formato legible (ej: 23 de mayo de 2026)
  eleventyConfig.addFilter("fechaLegible", (dateObj) => {
    return DateTime.fromJSDate(new Date(dateObj), { zone: "Europe/Madrid" })
      .setLocale("es")
      .toFormat("d 'de' LLLL 'de' yyyy");
  });

  // Fecha para el atributo datetime y para el sitemap (ISO)
  eleventyConfig.addFilter("fechaISO", (dateObj) => {
    return DateTime.fromJSDate(new Date(dateObj)).toISODate();
  });

  // Año actual, para el pie de página
  eleventyConfig.addFilter("anio", () => String(new Date().getFullYear()));

  // URL sin barra final (Vercel sirve las páginas sin barra: /servicios, no /servicios/)
  // La portada se queda como "/" para que la canónica sea https://dominio.es/
  eleventyConfig.addFilter("urlLimpia", (url) => {
    if (!url || url === "/") return "/";
    return url.replace(/\/$/, "");
  });

  // Colección de artículos del blog, del más nuevo al más antiguo
  eleventyConfig.addCollection("blog", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
