(function () {
  var TEL = "5493425944553";
  var wa = function (texto) {
    return "https://wa.me/" + TEL + "?text=" + encodeURIComponent(texto);
  };
  document.getElementById("y").textContent = new Date().getFullYear();

  /* ================= Visor de fotos ================= */
  var visor = document.getElementById("visor");
  var vImg = document.getElementById("visor-img");
  var vTit = document.getElementById("visor-titulo");
  var vWa = document.getElementById("visor-wa");
  document.getElementById("visor-cerrar").onclick = function () { visor.close(); };
  visor.addEventListener("click", function (e) { if (e.target === visor) visor.close(); });

  function abrir(p) {
    vImg.src = p.foto; vImg.alt = p.titulo; vTit.textContent = p.titulo;
    vWa.href = wa("Hola, quisiera consultar por: " + p.titulo);
    visor.showModal();
  }

  /* ================= Galerías ================= */
  function tarjeta(p) {
    var art = document.createElement("article");
    art.className = "item";

    var thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "thumb";
    thumb.setAttribute("aria-label", "Ver " + p.titulo + " en grande");
    var img = document.createElement("img");
    img.src = p.foto; img.alt = p.titulo; img.loading = "lazy";
    img.onerror = function () {
      thumb.className = "thumb empty";
      thumb.disabled = true;
      thumb.textContent = "Foto próximamente";
    };
    thumb.appendChild(img);
    thumb.onclick = function () { abrir(p); };

    var info = document.createElement("div");
    info.className = "info";
    var h = document.createElement("h3"); h.textContent = p.titulo;
    var d = document.createElement("p"); d.textContent = p.descripcion || "";
    var a = document.createElement("a");
    a.className = "btn btn-wa btn-sm";
    a.textContent = "Consultar por WhatsApp";
    a.href = wa("Hola, quisiera consultar por: " + p.titulo);
    a.target = "_blank"; a.rel = "noopener";
    info.appendChild(h); info.appendChild(d); info.appendChild(a);

    art.appendChild(thumb); art.appendChild(info);
    return art;
  }

  fetch("data/productos.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      document.querySelectorAll("[data-categoria]").forEach(function (cont) {
        (data[cont.dataset.categoria] || []).forEach(function (p) { cont.appendChild(tarjeta(p)); });
      });
    })
    .catch(function () {
      document.querySelectorAll("[data-categoria]").forEach(function (cont) {
        cont.innerHTML = '<p class="lead">Escribinos por WhatsApp y te mostramos los modelos disponibles.</p>';
      });
    });

  /* ================= Banner dinámico ================= */
  var hero = document.getElementById("inicio");
  var banner = document.getElementById("banner");
  var cont = banner.querySelector(".slides");
  var dotsBox = banner.querySelector(".dots");
  var caption = banner.querySelector(".banner-caption");
  var btnPrev = banner.querySelector(".prev");
  var btnNext = banner.querySelector(".next");

  var slides = [], dots = [], fotos = [], actual = 0, timer = null, ms = 5000;
  var sinMovimiento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ir(n) {
    if (!slides.length) return;
    actual = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      var on = i === actual;
      s.classList.toggle("activa", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
      dots[i].classList.toggle("activa", on);
      dots[i].setAttribute("aria-current", on ? "true" : "false");
    });
    caption.textContent = fotos[actual].titulo || "";
  }

  function parar() { if (timer) { clearInterval(timer); timer = null; } }
  function arrancar() {
    parar();
    if (slides.length < 2 || sinMovimiento) return;
    timer = setInterval(function () { ir(actual + 1); }, ms);
  }

  function construir(lista) {
    fotos = lista;
    lista.forEach(function (f, i) {
      var s = document.createElement("div");
      s.className = "slide";
      var im = document.createElement("img");
      im.src = f.foto;
      im.alt = f.titulo ? "Trabajo realizado: " + f.titulo : "Trabajo realizado";
      if (i > 0) im.loading = "lazy";
      s.appendChild(im);
      cont.appendChild(s);
      slides.push(s);

      var d = document.createElement("button");
      d.type = "button"; d.className = "dot";
      d.setAttribute("aria-label", "Ir a la imagen " + (i + 1));
      d.onclick = function () { ir(i); arrancar(); };
      dotsBox.appendChild(d);
      dots.push(d);
    });

    var varias = lista.length > 1;
    btnPrev.hidden = btnNext.hidden = dotsBox.hidden = !varias;
    btnPrev.onclick = function () { ir(actual - 1); arrancar(); };
    btnNext.onclick = function () { ir(actual + 1); arrancar(); };

    hero.classList.add("con-banner");
    ir(0);
    arrancar();

    banner.addEventListener("mouseenter", parar);
    banner.addEventListener("mouseleave", arrancar);
    banner.addEventListener("focusin", parar);
    banner.addEventListener("focusout", arrancar);
    document.addEventListener("visibilitychange", function () { document.hidden ? parar() : arrancar(); });

    var x0 = null;
    banner.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    banner.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) { ir(actual + (dx < 0 ? 1 : -1)); arrancar(); }
    }, { passive: true });
  }

  // Solo se usan las imágenes que existen; si no hay ninguna, queda la portada simple.
  fetch("data/banner.json")
    .then(function (r) { return r.json(); })
    .then(function (cfg) {
      if (cfg.segundos) ms = Math.max(2, cfg.segundos) * 1000;
      var lista = cfg.imagenes || [];
      var cargadas = new Array(lista.length), pendientes = lista.length;
      if (!pendientes) return;
      lista.forEach(function (f, i) {
        var t = new Image();
        t.onload = function () { cargadas[i] = f; fin(); };
        t.onerror = function () { fin(); };
        t.src = f.foto;
      });
      function fin() {
        if (--pendientes) return;
        var ok = cargadas.filter(Boolean);
        if (ok.length) construir(ok);
      }
    })
    .catch(function () { /* sin banner: se mantiene la portada simple */ });
})();
