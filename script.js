// ===== SITE DE CASAMENTO — script.js =====
// Este arquivo depende de gifts-data.js (deve ser carregado antes dele no HTML).

(function () {
  "use strict";

  var chapelSvg =
    '<svg class="wc-chapel-svg" viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">' +
    '<line x1="50" y1="4" x2="50" y2="16"/><line x1="45" y1="8" x2="55" y2="8"/>' +
    '<path d="M38 30 L50 16 L62 30 Z"/>' +
    '<rect x="40" y="30" width="20" height="14"/>' +
    '<circle cx="50" cy="37" r="4"/>' +
    '<path d="M25 88 L25 50 Q50 30 75 50 L75 88 Z"/>' +
    '<path d="M42 88 L42 68 Q50 60 58 68 L58 88 Z"/>' +
    '<line x1="15" y1="88" x2="85" y2="88"/>' +
    "</svg>";

  function formatBRL(v) {
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // ---------- Renderiza os cards de presente a partir de WC_GIFTS ----------
  function renderGifts() {
    var grid = document.getElementById("gift-grid");
    if (!grid || typeof WC_GIFTS === "undefined") return;

    var html = "";
    WC_GIFTS.forEach(function (g) {
      html +=
        '<div class="wc-reveal wc-gift-card">' +
        '<div class="wc-gift-img">' +
        '<div class="wc-monogram">J &amp; J</div>' +
        chapelSvg +
        "</div>" +
        '<div class="wc-gift-body">' +
        '<span class="wc-gift-badge">Presente</span>' +
        "<h3>" + g.titulo + "</h3>" +
        "<p>" + g.desc + "</p>" +
        '<div class="wc-price">R$ ' + formatBRL(g.preco) + "</div>" +
        '<div class="wc-btn-row">' +
        '<a class="wc-btn wc-btn-pix" href="' + g.linkPix + '" target="_blank" rel="noopener">Pix</a>' +
        '<a class="wc-btn wc-btn-card" href="' + g.linkCartao + '" target="_blank" rel="noopener">Cartão</a>' +
        "</div>" +
        "</div>" +
        "</div>";
    });
    grid.innerHTML = html;
  }

  // ---------- Anima a entrada dos elementos .wc-reveal ao rolar a tela ----------
  function setupScrollReveal() {
    var items = document.querySelectorAll(".wc-reveal");
    if (!("IntersectionObserver" in window)) {
      // navegador muito antigo: mostra tudo direto, sem animação
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            setTimeout(function () {
              entry.target.classList.add("is-visible");
            }, i * 60);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (el) { observer.observe(el); });
  }

  // ---------- Gera o carrossel 3D de fotos a partir de WC_PHOTOS ----------
  function renderPhotos() {
    var carousel = document.getElementById("photo-carousel");
    if (!carousel || typeof WC_PHOTOS === "undefined" || WC_PHOTOS.length === 0) return;

    var n = WC_PHOTOS.length;
    carousel.style.setProperty("--n", n);

    var html = "";
    WC_PHOTOS.forEach(function (url, i) {
      html +=
        '<img class="card" src="' + url + '" style="--i:' + i +
        '" alt="Foto do casal" draggable="false">';
    });
    carousel.innerHTML = html;
  }

  // ---------- Gira o carrossel automaticamente, permite arrastar, e abre lightbox ao clicar ----------
  function setupCarousel() {
    var carousel = document.getElementById("photo-carousel");
    if (!carousel || typeof WC_PHOTOS === "undefined" || WC_PHOTOS.length === 0) return;

    var reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var angle = 0;
    var speed = 360 / 34; // graus por segundo (rotação automática)
    var isDragging = false;
    var startX = 0;
    var startAngle = 0;
    var moved = 0;
    var lastTime = null;
    var downImg = null; // guarda a foto clicada ANTES do pointer capture redirecionar o evento

    function frame(time) {
      if (!isDragging && !reduceMotion) {
        if (lastTime !== null) {
          var dt = (time - lastTime) / 1000;
          angle += speed * dt;
        }
      }
      lastTime = time;
      carousel.style.transform = "rotateY(" + angle + "deg)";
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function onPointerDown(e) {
      isDragging = true;
      moved = 0;
      startX = e.clientX;
      startAngle = angle;
      downImg = e.target.closest ? e.target.closest("img.card") : null;
      carousel.classList.add("dragging");
      carousel.setPointerCapture && carousel.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      var delta = e.clientX - startX;
      moved = Math.abs(delta);
      angle = startAngle - delta * 0.3;
    }

    function onPointerUp() {
      isDragging = false;
      lastTime = null;
      carousel.classList.remove("dragging");
      if (moved <= 6) {
        if (downImg) {
          // clicou certinho numa foto
          openLightbox(downImg.src);
        } else {
          // clicou num vão entre fotos: abre a que está de frente no momento
          var frontIndex = getFrontmostIndex();
          openLightbox(WC_PHOTOS[frontIndex]);
        }
      }
      downImg = null;
    }

    function getFrontmostIndex() {
      var n = WC_PHOTOS.length;
      var ba = 360 / n;
      var a = ((angle % 360) + 360) % 360;
      var best = 0;
      var bestDist = Infinity;
      for (var i = 0; i < n; i++) {
        var cardAngle = ((i * ba + a) % 360 + 360) % 360;
        var dist = Math.min(cardAngle, 360 - cardAngle);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      return best;
    }

    carousel.addEventListener("pointerdown", onPointerDown);
    carousel.addEventListener("pointermove", onPointerMove);
    carousel.addEventListener("pointerup", onPointerUp);
    carousel.addEventListener("pointercancel", onPointerUp);
  }

  // ---------- Lightbox ----------
  function openLightbox(src) {
    var lb = document.getElementById("lightbox");
    var img = document.getElementById("lightbox-img");
    if (!lb || !img) return;
    img.src = src;
    lb.classList.add("is-open");
  }

  function closeLightbox() {
    var lb = document.getElementById("lightbox");
    if (lb) lb.classList.remove("is-open");
  }

  function setupLightbox() {
    var lb = document.getElementById("lightbox");
    var closeBtn = document.getElementById("lightbox-close");
    if (!lb) return;
    closeBtn.addEventListener("click", closeLightbox);
    lb.addEventListener("click", function (e) {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderGifts();
    renderPhotos();
    setupCarousel();
    setupLightbox();
    setupScrollReveal();
  });
})();
