const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // No convertir estos archivos en páginas web (antes estaba en .eleventyignore)
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("HORAS.md");
  eleventyConfig.ignores.add("node_modules/**");

  // Copiar tal cual estos archivos/carpetas al sitio final
  eleventyConfig.addPassthroughCopy("index.html");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("admin-presupuestos.html");
  eleventyConfig.addPassthroughCopy("horas.html");
  eleventyConfig.addPassthroughCopy("admin-logo.js");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("datos");

  // Fecha en formato legible (ej: 23 de mayo de 2026)
  eleventyConfig.addFilter("fechaLegible", (dateObj) => {
    return DateTime.fromJSDate(new Date(dateObj), { zone: "Europe/Madrid" })
      .setLocale("es")
      .toFormat("d 'de' LLLL 'de' yyyy");
  });

  // Fecha para el atributo datetime (ISO)
  eleventyConfig.addFilter("fechaISO", (dateObj) => {
    return DateTime.fromJSDate(new Date(dateObj)).toISODate();
  });

  // Coleccion de articulos del blog, ordenados del mas nuevo al mas antiguo
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
