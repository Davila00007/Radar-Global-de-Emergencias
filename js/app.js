/* =========================================================
   Radar Global de Emergencias — lógica de la página
   Depende de: map-data.js (MAP_LAND, MAP_SHAPES)
               data.js (TYPES, LEVELS, NEEDS, EMERGENCIES, ORGANIZATIONS)
   ========================================================= */
(() => {
  "use strict";

  const MAP_W = 1800, MAP_H = 900;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* Evita inyectar HTML si en el futuro los datos vienen de una API */
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (name) => `<i class="fa-solid ${esc(name)}" aria-hidden="true"></i>`;

  const state = { type: "all", level: "all", query: "" };

  /* ---------------- Filtrado ---------------- */
  function visibleEmergencies() {
    const q = state.query.trim().toLowerCase();
    return EMERGENCIES.filter((d) => {
      if (state.type !== "all" && d.type !== state.type) return false;
      if (state.level !== "all" && d.level !== state.level) return false;
      if (!q) return true;
      const text = [d.country, d.region, TYPES[d.type].name, d.fact].join(" ").toLowerCase();
      return text.includes(q);
    });
  }

  /* ---------------- Contenido estático ---------------- */
  function renderStatic() {
    // Mapa base
    $("#land").setAttribute("d", MAP_LAND);

    // Estadísticas
    const high = EMERGENCIES.filter((d) => d.level === "alto").length;
    const countries = new Set(EMERGENCIES.map((d) => d.country)).size;
    const stats = [
      ["fa-triangle-exclamation", "Activas", EMERGENCIES.length, ""],
      ["fa-circle-exclamation", "Alerta alta", high, "stat--alert"],
      ["fa-location-dot", "Países / zonas", countries, ""],
      ["fa-layer-group", "Tipos", Object.keys(TYPES).length, ""]
    ];
    $("#stats").innerHTML = stats.map(([ic, label, value, cls]) =>
      `<div class="stat ${cls}"><dt>${icon(ic)}${label}</dt><dd>${value}</dd></div>`).join("");

    // Cinta en vivo (duplicada para que el desplazamiento sea continuo)
    const items = EMERGENCIES.map((d) =>
      `<span>${icon(TYPES[d.type].icon)}${esc(TYPES[d.type].name.toUpperCase())} · ${esc(d.country.toUpperCase())} · ${esc(d.fact)}</span>`).join("");
    $("#ticker").innerHTML = items + items;

    // Leyenda
    $("#legendTypes").innerHTML = Object.values(TYPES)
      .map((t) => `<li>${icon(t.icon)}${esc(t.name)}</li>`).join("");
    $("#legendLevels").innerHTML = Object.values(LEVELS)
      .map((l) => `<li><span class="swatch" style="--c:${l.color}"></span>${esc(l.name)}</li>`).join("");

    // Filtros
    $("#typeFilters").innerHTML =
      `<button class="chip is-on" data-filter="type" data-value="all" aria-pressed="true">${icon("fa-earth-americas")}Todas</button>` +
      Object.entries(TYPES).map(([k, t]) =>
        `<button class="chip" data-filter="type" data-value="${k}" aria-pressed="false">${icon(t.icon)}${esc(t.name)}</button>`).join("");
    $("#levelFilters").innerHTML =
      `<button class="chip is-on" data-filter="level" data-value="all" aria-pressed="true">Todos los niveles</button>` +
      Object.entries(LEVELS).map(([k, l]) =>
        `<button class="chip" data-filter="level" data-value="${k}" aria-pressed="false"><span class="swatch" style="--c:${l.color}"></span>${esc(l.name)}</button>`).join("");

    // Organizaciones
    $("#orgs").innerHTML = ORGANIZATIONS.map((o) => `
      <article class="org">
        <span class="org__icon">${icon(o.icon)}</span>
        <h3>${esc(o.name)}</h3>
        <p>${esc(o.text)}</p>
        <a class="link" href="${esc(o.url)}" target="_blank" rel="noopener">Visitar sitio ${icon("fa-arrow-up-right-from-square")}</a>
      </article>`).join("");
  }

  /* ---------------- Contenido dinámico ---------------- */
  function render() {
    const list = visibleEmergencies();

    // Zonas coloreadas
    $("#areas").innerHTML = list.filter((d) => MAP_SHAPES[d.id]).map((d) =>
      `<path class="map__area" data-open="${d.id}" style="--c:${LEVELS[d.level].color}" d="${MAP_SHAPES[d.id]}"><title>${esc(d.country)}</title></path>`).join("");

    // Marcadores (posición en % sobre el mapa)
    $("#markers").innerHTML = list.map((d) => `
      <button class="marker marker--${d.level}" data-open="${d.id}"
        style="--c:${LEVELS[d.level].color};left:${(d.x / MAP_W) * 100}%;top:${(d.y / MAP_H) * 100}%"
        aria-label="${esc(TYPES[d.type].name)} en ${esc(d.country)}, alerta ${esc(LEVELS[d.level].name.toLowerCase())}">
        ${icon(TYPES[d.type].icon)}
      </button>`).join("");

    // Tarjetas
    $("#count").textContent = `${list.length} de ${EMERGENCIES.length}`;
    $("#cards").innerHTML = list.length ? list.map((d) => `
      <button class="card card--${d.level}" data-open="${d.id}" style="--c:${LEVELS[d.level].color}">
        <span class="card__top"><span>Alerta ${esc(LEVELS[d.level].name)}</span><span>Demo</span></span>
        <span class="card__body">
          <span class="card__icon">${icon(TYPES[d.type].icon)}</span>
          <span>
            <span class="card__title">${esc(d.country)}</span>
            <span class="card__type">${esc(TYPES[d.type].name)} · ${esc(d.region)}</span>
            <span class="card__fact">${esc(d.fact)}</span>
            <span class="card__date">${icon("fa-calendar")}${esc(d.date)}</span>
          </span>
        </span>
      </button>`).join("")
      : `<div class="empty">${icon("fa-magnifying-glass")}No hay emergencias con esos filtros. Prueba con otro país o quita los filtros.</div>`;

    markSelected(openId);
  }

  /* ---------------- Mapa: zoom y desplazamiento ---------------- */
  const mapEl = $("#map"), canvas = $("#mapCanvas"), markersEl = $("#markers");
  const view = { s: 1, tx: 0, ty: 0 };
  const MIN = 1, MAX = 4;

  function clampView() {
    const w = mapEl.clientWidth, h = mapEl.clientHeight;
    view.s = Math.min(MAX, Math.max(MIN, view.s));
    view.tx = Math.min(0, Math.max(w - w * view.s, view.tx));
    view.ty = Math.min(0, Math.max(h - h * view.s, view.ty));
  }
  function applyView(animate) {
    clampView();
    canvas.classList.toggle("is-animated", !!animate);
    canvas.style.transform = `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`;
    markersEl.style.setProperty("--inv", 1 / view.s);   // los marcadores no crecen con el zoom
    mapEl.style.touchAction = view.s > 1 ? "none" : "pan-y";
  }
  function zoomAt(newScale, px, py, animate) {
    const k = Math.min(MAX, Math.max(MIN, newScale)) / view.s;
    view.tx = px - (px - view.tx) * k;
    view.ty = py - (py - view.ty) * k;
    view.s *= k;
    applyView(animate);
  }
  function zoomCenter(factor) {
    zoomAt(view.s * factor, mapEl.clientWidth / 2, mapEl.clientHeight / 2, true);
  }
  function focusOn(d) {
    const w = mapEl.clientWidth, h = mapEl.clientHeight;
    view.s = 2.5;
    view.tx = w / 2 - (d.x / MAP_W) * w * view.s;
    view.ty = h / 2 - (d.y / MAP_H) * h * view.s;
    applyView(true);
  }

  $("#zoomIn").addEventListener("click", () => zoomCenter(1.5));
  $("#zoomOut").addEventListener("click", () => zoomCenter(1 / 1.5));
  $("#zoomReset").addEventListener("click", () => { view.s = 1; view.tx = 0; view.ty = 0; applyView(true); });

  // Ctrl / Cmd + rueda = zoom hacia el cursor
  mapEl.addEventListener("wheel", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const r = mapEl.getBoundingClientRect();
    zoomAt(view.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX - r.left, e.clientY - r.top, false);
  }, { passive: false });

  // Arrastrar para moverse
  let drag = null, justDragged = false;
  mapEl.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".map__controls")) return;
    drag = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moving: false, id: e.pointerId };
  });
  mapEl.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moving && Math.hypot(dx, dy) > 5 && view.s > 1) {
      drag.moving = true;
      mapEl.classList.add("is-dragging");
      mapEl.setPointerCapture(e.pointerId);
    }
    if (drag.moving) {
      view.tx = drag.tx + dx;
      view.ty = drag.ty + dy;
      applyView(false);
    }
  });
  const endDrag = () => {
    if (drag && drag.moving) justDragged = true;
    drag = null;
    mapEl.classList.remove("is-dragging");
  };
  mapEl.addEventListener("pointerup", endDrag);
  mapEl.addEventListener("pointercancel", endDrag);
  // Si se arrastró, no abrir el marcador sobre el que se soltó
  mapEl.addEventListener("click", (e) => {
    if (justDragged) { e.stopPropagation(); e.preventDefault(); justDragged = false; }
  }, true);

  window.addEventListener("resize", () => applyView(false));

  /* ---------------- Panel de detalle ---------------- */
  const panel = $("#panel"), veil = $("#veil");
  let openId = null, lastFocus = null;

  function markSelected(id) {
    $$("[data-open]").forEach((el) => {
      if (el.closest(".cards")) return;
      el.classList.toggle("is-selected", id != null && el.dataset.open == id);
    });
  }

  function openPanel(id) {
    const d = EMERGENCIES.find((x) => x.id == id);
    if (!d) return;
    const lvl = LEVELS[d.level], typ = TYPES[d.type];
    lastFocus = document.activeElement;
    openId = d.id;

    $("#panelBody").innerHTML = `
      <div class="panel__head ${d.level === "bajo" ? "is-bajo" : ""}" style="--c:${lvl.color}">
        <span class="panel__badge">${icon("fa-circle-exclamation")} Alerta ${esc(lvl.name)} · Demo</span>
        <h3>${esc(d.country)}</h3>
        <div class="panel__type">${icon(typ.icon)}${esc(typ.name)}</div>
      </div>
      <div class="panel__content">
        <div class="meta">
          <div><span>Región</span>${esc(d.region)}</div>
          <div><span>Fecha</span>${esc(d.date)}</div>
          <div class="wide"><span>Dato principal</span>${esc(d.fact)}</div>
        </div>

        <h4>${icon("fa-satellite")} Estado actual</h4>
        <p>${esc(d.status)}</p>

        <h4>${icon("fa-box-open")} Necesidades prioritarias</h4>
        <div class="needs">${d.needs.map((n) => NEEDS[n] ?
          `<span class="need">${icon(NEEDS[n].icon)}${esc(NEEDS[n].name)}</span>` : "").join("")}</div>

        <h4>${icon("fa-map")} Contexto histórico y geográfico</h4>
        <p>${esc(d.context)}</p>
        <ul class="timeline">${d.history.map(([y, t]) => `<li><b>${esc(y)}</b>${esc(t)}</li>`).join("")}</ul>

        <h4>${icon("fa-crosshairs")} Ubicación</h4>
        <button class="link" id="seeOnMap" type="button">Ver en el mapa ${icon("fa-location-crosshairs")}</button>

        <a class="cta" href="${esc(d.help)}" target="_blank" rel="noopener">
          ${icon("fa-hand-holding-heart")} Ayuda oficial ${icon("fa-arrow-up-right-from-square")}
        </a>
      </div>`;

    $("#seeOnMap").addEventListener("click", () => {
      closePanel(false);
      $("#mapa").scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => focusOn(d), 350);
    });

    panel.removeAttribute("inert");
    panel.classList.add("is-open");
    veil.classList.add("is-on");
    document.body.style.overflow = "hidden";
    markSelected(d.id);
    $("#panelClose").focus();
  }

  function closePanel(restoreFocus = true) {
    if (openId == null) return;
    panel.classList.remove("is-open");
    panel.setAttribute("inert", "");
    veil.classList.remove("is-on");
    document.body.style.overflow = "";
    const id = openId;
    openId = null;
    if (restoreFocus && lastFocus && document.contains(lastFocus)) lastFocus.focus();
    markSelected(id); // mantiene resaltada la última zona vista
  }

  $("#panelClose").addEventListener("click", () => closePanel());
  veil.addEventListener("click", () => closePanel());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

  /* ---------------- Eventos generales ---------------- */
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (opener) { openPanel(opener.dataset.open); return; }

    const chip = e.target.closest(".chip");
    if (chip) {
      const key = chip.dataset.filter;
      state[key] = chip.dataset.value;
      $$(`.chip[data-filter="${key}"]`).forEach((b) => {
        const on = b === chip;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on);
      });
      render();
    }
  });

  $("#search").addEventListener("input", (e) => { state.query = e.target.value; render(); });

  // Menú móvil
  const nav = $("#nav"), burger = $("#burger");
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
    burger.innerHTML = icon(open ? "fa-xmark" : "fa-bars");
  });
  nav.addEventListener("click", (e) => {
    if (!e.target.closest("a")) return;
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.innerHTML = icon("fa-bars");
  });

  // Resaltar la sección visible en el menú
  const sections = ["mapa", "emergencias", "organizaciones"].map((id) => document.getElementById(id));
  function updateNav() {
    let current = "inicio";
    sections.forEach((s) => { if (s.getBoundingClientRect().top < 160) current = s.id; });
    $$(".nav a").forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + current));
  }
  window.addEventListener("scroll", updateNav, { passive: true });

  /* ---------------- Inicio ---------------- */
  renderStatic();
  render();
  applyView(false);
  updateNav();
})();
