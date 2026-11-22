// Точка входа: карта, проекция, зум, обработчики наведения и кликов.
// Грузится последним в index.html.

let extradition = {};
let worldCountries;
let mapIds = new Set(); // id стран, которые есть и на карте, и в data/countries.js
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

// Единственное место, где считается проекция
function applyProjection() {
  const { w, h } = layoutSize();
  const mobile = isMobile();
  const scale = mobile ? Math.min(w / 5.6, h / 3.6) : Math.min(w / 6.3, h / 3.2);
  // на телефоне низ закрыт шторкой, карта смещена вверх
  const cy = mobile ? h * 0.4 : h / 2 + 20;
  projection = d3.geoNaturalEarth1().scale(scale).translate([w / 2, cy]);
  path = d3.geoPath(projection).digits(1); // 1 знак после запятой: путь короче в ~2 раза, парсить и рисовать легче
}

// Стартовый вид. На телефоне карта приближена и центрирована на Европу/Африку
// (там большинство договоров), в полосе между капсулой и шторкой.
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
  if (game.resultShown) layoutResultMap();
}

// Сетка растворяется к верху и низу карты: градиент по Y в координатах группы
function updateGraticule() {
  const g = d3.geoGraticule10();
  group.select(".graticule").attr("d", path(g));
  const [[, y0], [, y1]] = path.bounds(g);
  svg.select("#grat-grad").attr("y1", y0).attr("y2", y1);
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
      // на тач-экране первое касание только выбирает страну, повторное тоже
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
    // у части фич (Косово, Сев. Кипр) нет id; такие рисуем как неинтерактивную сушу
    f.id = f.id == null ? null : String(parseInt(f.id, 10));
  });
  // Антарктида ломает проекцию и игру (нет договоров), убираем
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

  const grad = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "grat-grad")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("x2", 0);
  [
    [0, 0],
    [0.28, 1],
    [0.72, 1],
    [1, 0],
  ].forEach(([o, a]) =>
    grad
      .append("stop")
      .attr("offset", o)
      .style("stop-color", "var(--c-grid-line)")
      .style("stop-opacity", `calc(${a} * var(--c-grid-op))`),
  );

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

  group.append("path").attr("class", "graticule");
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

  // клик по пустому месту карты снимает выбор
  svg.on("click", (event) => {
    if (event.target.closest(".country") || game.resultShown) return;
    // в игре касание пустого места отменяет выбранную (первое касание)
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
