const state = {
  selectedId: null,

  select(id) {
    this.selectedId = id;
    renderSheet();
    renderCapsule();
  },

  clear() {
    this.selectedId = null;
    renderSheet();
    renderCapsule();
  },
};

// Selects a country: updates the card, arcs and colors, and optionally zooms the camera
function selectCountry(id, { zoom: doZoom = false } = {}) {
  if (!countries[id] || !mapIds.has(id)) return;
  state.select(id);
  drawArcs(id, extradition[id]?.treaties || []);
  paintMap();
  if (doZoom) zoomToCountry(id);
}

function clearSelection({ resetZoom = true } = {}) {
  state.clear();
  clearArcs();
  paintMap();
  if (resetZoom) resetView();
}

function setHoverName(id) {
  const el = document.getElementById("country-hover-name");
  el.textContent = id ? countryName(id) : t("hover.placeholder");
  el.classList.toggle("placeholder", !id);
}

function renderSheet() {
  const sheet = document.getElementById("sheet");
  const id = state.selectedId;
  sheet.classList.toggle("is-empty", !id);
  if (!id) {
    sheet.classList.remove("expanded");
    observeSheetHeight();
    return;
  }

  const data = extradition[id];
  const related = data?.treaties || [];

  document.getElementById("country-eyebrow").textContent =
    `${t("sheet.selected")} · ${iso3(id)}`;
  document.getElementById("country-name").textContent = countryName(id);

  const total = Object.keys(countries).length;
  document.getElementById("tile-treaty").textContent = data ? related.length : "–";
  document.getElementById("tile-none").textContent = data
    ? Math.max(0, total - 1 - related.length)
    : "–";

  const box = document.getElementById("country-extradition");
  box.replaceChildren();
  if (!data || related.length === 0) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = t(data ? "sheet.noTreaties" : "sheet.noData");
    box.append(p);
  } else {
    [...related]
      .sort((a, b) => countryName(a).localeCompare(countryName(b)))
      .forEach((rid) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        const code = document.createElement("span");
        code.className = "chip-iso";
        code.textContent = iso3(rid);
        b.append(code, countryName(rid));
        if (mapIds.has(rid)) {
          b.addEventListener("click", () => selectCountry(rid, { zoom: true }));
          // Hovering or focusing a chip highlights that country on the map
          const on = () => paintMap(rid);
          const off = () => paintMap();
          b.addEventListener("mouseenter", on);
          b.addEventListener("mouseleave", off);
          b.addEventListener("focus", on);
          b.addEventListener("blur", off);
        } else b.disabled = true;
        box.append(b);
      });
  }

  const src = document.getElementById("country-source");
  if (data?.source) {
    src.href = data.source;
    src.textContent = t("sheet.source");
    src.hidden = false;
  } else {
    src.hidden = true;
  }

  updateToggleLabel();
  observeSheetHeight();
}

function updateToggleLabel() {
  const sheet = document.getElementById("sheet");
  const n = extradition[state.selectedId]?.treaties?.length || 0;
  const toggle = document.getElementById("panel-toggle");
  toggle.hidden = n === 0;
  document.getElementById("panel-toggle-label").textContent = sheet.classList.contains("expanded")
    ? t("sheet.less")
    : t("sheet.seeAll", { n });
}

document.getElementById("panel-toggle").addEventListener("click", () => {
  document.getElementById("sheet").classList.toggle("expanded");
  updateToggleLabel();
  observeSheetHeight();
});

function renderCapsule() {
  const id = state.selectedId;
  const input = document.getElementById("search-input");
  const badge = document.getElementById("selected-iso");
  const clear = document.getElementById("clear-btn");
  if (id) {
    input.value = countryName(id);
    badge.textContent = iso3(id);
    badge.hidden = false;
    clear.hidden = false;
  } else {
    badge.hidden = true;
    clear.hidden = input.value === "";
  }
}

// --sheet-h lifts the legend and zoom controls above the visible bottom sheet (phones only)
let sheetObserver = null;

function syncSheetHeight() {
  const visible = [document.getElementById("sheet"), document.getElementById("game-sheet")].find(
    (n) => n && n.getClientRects().length > 0,
  );
  const phone = window.innerWidth <= MOBILE_BP;
  const h = visible && phone ? visible.getBoundingClientRect().height : 0;
  document.documentElement.style.setProperty("--sheet-h", `${h}px`);
}

function observeSheetHeight() {
  if (!sheetObserver) {
    sheetObserver = new ResizeObserver(syncSheetHeight);
    sheetObserver.observe(document.getElementById("sheet"));
    sheetObserver.observe(document.getElementById("game-sheet"));
    window.addEventListener("resize", syncSheetHeight);
  }
  // Recompute on mode switches, when the sheet's size may not have changed
  requestAnimationFrame(syncSheetHeight);
}
