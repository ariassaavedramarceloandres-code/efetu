const fs = require("fs");
const src = "C:/Users/Camil/Downloads/efect/index.html";
const dest = "C:/Users/Camil/Pictures/efeti/public/index.html";
let html = fs.readFileSync(src, "utf8");

html = html.replace(
  /href="https:\/\/efectivadigital\.efectiva\.com\.pe\/Efectiva\/login\?[^"]+"/g,
  'href="https://efectivadigital.efectiva.com.pe/Efectiva/login"'
);

const viewport =
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">';
const inject =
  viewport +
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;700&display=swap" rel="stylesheet">' +
  '<script src="./js/static-buttons.js"></script>';

if (!html.includes(viewport)) {
  throw new Error("viewport not found");
}
html = html.replace(viewport, inject);

fs.writeFileSync(dest, html);
const banca = (html.match(/efectivadigital\.efectiva\.com\.pe\/Efectiva\/login/g) || []).length;
console.log({
  banca,
  hasScript: html.includes("./js/static-buttons.js"),
  hasPrestamo: html.includes("préstamo"),
  hasMojibake: html.includes("prÃ©stamo"),
});
