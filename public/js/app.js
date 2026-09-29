const slides = [
  {
    title: "Tu cuenta,\nsin filas",
    text: "Ábrela en minutos y maneja tu plata desde el celular.",
    cta: "Abrir cuenta",
    action: { nav: "cuenta" },
    theme: "cuenta",
  },
  {
    title: "Transfiere\nal instante",
    text: "Envía plata a cualquier banco, el día que quieras.",
    cta: "Conocer más",
    action: { nav: "banca" },
    theme: "envios",
  },
  {
    title: "¡Actualiza tus\ndatos!",
    text: "Y gana una refrigeradora BORD. Regístrate y participa.",
    cta: "Más info",
    action: { open: "info" },
    theme: "sorteo",
  },
  {
    title: "Ahorra\nsin enredos",
    text: "Separa un bolsillo y mira cómo crece tu plata.",
    cta: "Quiero ahorrar",
    action: { nav: "exclusivo" },
    theme: "ahorro",
  },
  {
    title: "Exclusivo\npara ti",
    text: "Beneficios, alertas y atención cuando los necesites.",
    cta: "Ver beneficios",
    action: { nav: "exclusivo" },
    theme: "exclusivo",
  },
];

const hero = document.querySelector(".hero");
const titleEl = document.getElementById("slide-title");
const textEl = document.getElementById("slide-text");
const ctaEl = document.getElementById("slide-cta");
const dotsEl = document.getElementById("dots");
const promo = document.getElementById("promo");
const menu = document.getElementById("mobile-menu");
const menuToggle = document.querySelector(".nav-toggle");

let index = 2;
let promoClosed = false;

function renderSlide(next) {
  index = next;
  const slide = slides[index];
  titleEl.replaceChildren();
  slide.title.split("\n").forEach((line) => {
    const span = document.createElement("span");
    span.textContent = line;
    titleEl.appendChild(span);
  });
  textEl.textContent = slide.text;
  ctaEl.textContent = slide.cta;
  hero.dataset.theme = slide.theme;
  promo.classList.toggle("is-closed", promoClosed || slide.theme !== "sorteo");
  [...dotsEl.children].forEach((dot, i) => {
    dot.setAttribute("aria-selected", String(i === index));
    dot.tabIndex = i === index ? 0 : -1;
  });
}

slides.forEach((slide, i) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.role = "tab";
  dot.setAttribute("aria-label", slide.title.replace("\n", " "));
  dot.addEventListener("click", () => renderSlide(i));
  dotsEl.appendChild(dot);
});
renderSlide(index);

ctaEl.addEventListener("click", () => {
  const action = slides[index].action;
  if (action.open) openModal(action.open);
  if (action.nav) showScreen(action.nav);
});

document.getElementById("promo-close").addEventListener("click", () => {
  promoClosed = true;
  promo.classList.add("is-closed");
});

function showScreen(name) {
  document.body.dataset.screen = name;
  document.querySelectorAll("[data-screen]").forEach((section) => {
    section.hidden = section.dataset.screen !== name;
  });
  menu.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  if (name === "home") renderSlide(index);
  window.scrollTo(0, 0);
}

document.querySelectorAll("[data-nav]").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.nav));
});

menuToggle.addEventListener("click", () => {
  const open = menu.hidden;
  menu.hidden = !open;
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
});

function openModal(name) {
  const modal = document.getElementById(`modal-${name}`);
  if (!modal) return;
  if (name === "signup") paintSignup();
  modal.hidden = false;
  const focusable = modal.querySelector("button, input, select, textarea");
  focusable?.focus();
}

function closeModal(name) {
  const modal = document.getElementById(`modal-${name}`);
  if (modal) modal.hidden = true;
}

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    const current = button.closest(".modal");
    if (current) current.hidden = true;
    openModal(button.dataset.open);
  });
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => closeModal(button.dataset.close));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.hidden = true;
    });
    menu.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
  }
  const typing = event.target.closest("input, textarea, select");
  const modalOpen = [...document.querySelectorAll(".modal")].some((modal) => !modal.hidden);
  if (typing || modalOpen || document.body.dataset.screen !== "home") return;
  if (event.key === "ArrowRight") renderSlide((index + 1) % slides.length);
  if (event.key === "ArrowLeft") renderSlide((index - 1 + slides.length) % slides.length);
});

const STORAGE_KEY = "efectibank-inscripcion";

function readSignup() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function paintSignup() {
  const saved = readSignup();
  const formWrap = document.getElementById("signup-form-wrap");
  const success = document.getElementById("signup-success");
  if (!saved) {
    formWrap.hidden = false;
    success.hidden = true;
    return;
  }
  formWrap.hidden = true;
  success.hidden = false;
  document.getElementById("signup-success-copy").textContent =
    `${saved.nombre}, tu inscripción al sorteo de refrigeradoras BORD quedó registrada.`;
  document.getElementById("signup-folio").textContent = saved.folio;
}

document.getElementById("signup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const error = document.getElementById("signup-error");
  error.textContent = "";
  if (!/^\d{6,12}$/.test(data.documento || "")) {
    error.textContent = "Escribe un documento de 6 a 12 números.";
    return;
  }
  if (!/^\d{10}$/.test(data.celular || "")) {
    error.textContent = "El celular debe tener 10 números.";
    return;
  }
  const folio = `EB-${Math.floor(10000 + Math.random() * 90000)}`;
  const saved = {
    nombre: data.nombre.trim(),
    tipo: data.tipo,
    documento: data.documento,
    celular: data.celular,
    correo: data.correo.trim(),
    folio,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  paintSignup();
});

document.getElementById("contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const note = document.getElementById("contact-note");
  note.textContent = "Recibimos tu mensaje. Te responderemos en este prototipo solo en pantalla.";
  form.reset();
});

const accountForm = document.getElementById("account-form");
const accountSteps = [...document.querySelectorAll("#account-steps li")];
let accountStep = 1;

function showAccountStep(step) {
  accountStep = step;
  accountForm.querySelectorAll("[data-step]").forEach((block) => {
    const hidden = Number(block.dataset.step) !== step;
    block.hidden = hidden;
    block.querySelectorAll("input, select, textarea").forEach((field) => {
      field.disabled = hidden;
    });
  });
  accountSteps.forEach((item, i) => {
    item.classList.toggle("is-on", i === step - 1);
    item.classList.toggle("is-done", i < step - 1);
  });
  document.getElementById("account-back").hidden = step === 1 || step === 3;
  const next = document.getElementById("account-next");
  next.hidden = step === 3;
  next.textContent = step === 2 ? "Abrir cuenta" : "Continuar";
}

accountForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!accountForm.reportValidity()) return;
  if (accountStep === 1) {
    showAccountStep(2);
    return;
  }
  const data = {
    nombre: accountForm.nombre.value.trim(),
    ciudad: accountForm.ciudad.value.trim(),
    celular: accountForm.celular.value.trim(),
    correo: accountForm.correo.value.trim(),
  };
  if (!/^\d{10}$/.test(data.celular)) {
    accountForm.celular.setCustomValidity("El celular debe tener 10 números.");
    accountForm.reportValidity();
    accountForm.celular.setCustomValidity("");
    return;
  }
  document.getElementById("account-success").textContent =
    `${data.nombre.trim()}, tu solicitud de cuenta quedó registrada en este navegador. Este prototipo no abre una cuenta real.`;
  showAccountStep(3);
});

document.getElementById("account-back").addEventListener("click", () => {
  if (accountStep > 1) showAccountStep(accountStep - 1);
});

showAccountStep(1);
showScreen("home");
