let extradition = {};
let worldCountries;
let mapIds = new Set(); // ids present both on the map and in data/countries.js
let svg;
let group;
let overlay;
let zoom;
let projection;
let path;

const isMobile = () => window.innerWidth <= MOBILE_BP;
const isTouch = () => window.matchMedia("(hover: none)").matches;

function layoutSize() {
  return { w: window.innerWidth, h: window.innerHeight };
}

function applyProjection() {
  const { w, h } = layoutSize();
  const mobile = isMobile();
  const scale = mobile ? Math.min(w / 5.6, h / 3.6) : Math.min(w / 6.3, h / 3.2);
  // On phones the bottom sheet covers the lower part, so the map is shifted up
  const cy = mobile ? h * 0.4 : h / 2 + 20;
  projection = d3.geoNaturalEarth1().scale(scale).translate([w / 2, cy]);
  path = d3.geoPath(projection).digits(1); // digits(1) roughly halves the amount of path data
}

// Start view. On phones the map is zoomed in and centered on Europe/Africa (where most treaties are),
// within the band between the search capsule and the bottom sheet.
function initialTransform(k = 2) {
  if (!isMobile()) return d3.zoomIdentity;
  const { w, h } = layoutSize();
  const [px, py] = projection([15, 5]);
  return d3.zoomIdentity.translate(w / 2 - k * px, h * 0.42 - k * py).scale(k);
}

function redrawGeometry() {
  applyProjection();
  svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
  zoom.translateExtent([
    [0, 0],
    [window.innerWidth, window.innerHeight],
  ]);
  updateGraticule();
  group.selectAll(".country, .land").attr("d", path);
  polyCache.clear();
  if (game.active || game.resultShown) drawTrail(game.visited, game.caughtId);
  else if (state.selectedId) drawArcs(state.selectedId, extradition[state.selectedId]?.treaties || []);
  if (game.resultShown) buildResultMap();
}

function updateGraticule() {
  drawGraticule(svg, group.select(".graticule"), path, "grat");
}

// The tooltip follows the pointer from one document-level listener instead of per-country
// enter/leave events: those fire again when a country is re-raised in the DOM (paintMap) or while
// d3-zoom handles a pressed button, and used to hide the tip when the mouse was held down.
let tipCountryId = null;
function bindMapTip() {
  const mapEl = document.getElementById("map");
  document.addEventListener("mousemove", (event) => {
    if (isTouch() || game.resultShown) return;
    const el = event.target.closest?.(".country");
    const d = el && mapEl.contains(el) ? el.__data__ : null;
    if (!d || event.buttons) {
      tipCountryId = null;
      mapTip.hide();
    } else if (d.id !== tipCountryId || !mapTip.visible()) {
      tipCountryId = d.id;
      mapTip.show(d.id, event);
    } else {
      mapTip.move(event);
    }
  });
  document.documentElement.addEventListener("mouseleave", () => {
    tipCountryId = null;
    mapTip.hide();
  });
}

function bindCountryEvents(sel) {
  sel
    .on("mouseenter", (event, d) => {
      if (isTouch()) return;
      if (game.resultShown) return;
      if (game.active) return game.hoverPreview(d.id);
      setHoverName(d.id);
      paintMap(d.id);
    })
    .on("mouseleave", () => {
      if (isTouch() || game.resultShown) return;
      if (game.active) showGameHover(null);
      else setHoverName(null);
      paintMap();
    })
    .on("click", (event, d) => {
      if (game.resultShown) return;
      if (game.active) return game.handleClick(d.id);
      selectCountry(d.id, { zoom: true });
    });
}

async function init() {
  applyI18n();

  const [data, world] = await Promise.all([
    loadExtraditionData(),
    fetch(WORLD_URL).then((r) => r.json()),
  ]);
  extradition = data;

  worldCountries = topojson.feature(world, world.objects.countries);
  worldCountries.features.forEach((f) => {
    // Some features (Kosovo, Northern Cyprus) have no id; they are drawn as non-interactive land
    f.id = f.id == null ? null : String(parseInt(f.id, 10));
  });
  // Antarctica is dropped: it has no treaty data and would count as a playable country in the game
  worldCountries.features = worldCountries.features.filter((f) => f.id !== "10");

  const interactive = worldCountries.features.filter((f) => f.id && countries[f.id]);
  const rest = worldCountries.features.filter((f) => !(f.id && countries[f.id]));
  mapIds = new Set(interactive.map((f) => f.id));
  featureMap = new Map(worldCountries.features.filter((f) => f.id).map((f) => [f.id, f]));

  const { w, h } = layoutSize();
  applyProjection();

  svg = d3
    .select("#map")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("role", "img")
    .attr("aria-label", t("map.label"));

  svg.append("defs");

  group = svg.append("g");

  zoom = d3
    .zoom()
    .scaleExtent([1, isMobile() ? 16 : 6])
    .translateExtent([
      [0, 0],
      [w, h],
    ])
    .on("zoom", (event) => {
      group.attr("transform", event.transform);
      updateMarkerScale(event.transform.k);
    });
  svg.call(zoom).on("dblclick.zoom", null);

  group.append("g").attr("class", "graticule");
  group.selectAll(".land").data(rest).join("path").attr("class", "land").attr("d", path);
  bindCountryEvents(
    group
      .selectAll(".country")
      .data(interactive, (d) => d.id)
      .join("path")
      .attr("class", "country")
      .attr("d", path),
  );
  overlay = group.append("g").attr("class", "overlay");
  updateGraticule();

  buildSearchIndex();
  renderSheet();
  renderCapsule();
  setHoverName(null);
  observeSheetHeight();
  svg.call(zoom.transform, initialTransform());

  // A click on empty map clears the selection
  svg.on("click", (event) => {
    if (event.target.closest(".country") || game.resultShown) return;
    // During the game an empty tap cancels the pending first tap
    if (game.active) {
      if (game.pending) {
        game.pending = null;
        game.render();
      }
      return;
    }
    if (state.selectedId) clearSelection({ resetZoom: false });
  });

  zoomButtons();
  bindMapTip();

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      redrawGeometry();
      syncSheetHeight();
    }, 120);
  });
}

function zoomButtons() {
  document.getElementById("zoom-in").addEventListener("click", () =>
    svg.transition().duration(250).call(zoom.scaleBy, 1.6),
  );
  document.getElementById("zoom-out").addEventListener("click", () =>
    svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.6),
  );
}

init().catch((err) => {
  console.error(err);
  const el = document.getElementById("country-hover-name");
  if (el) el.textContent = "Failed to load map data";
});
