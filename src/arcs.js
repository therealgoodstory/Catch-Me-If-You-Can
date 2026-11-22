// Якоря стран, дуги и маркеры. Стили в styles/map.css (.arc, .trail, .marker-*).

let featureMap = new Map(); // id -> feature, заполняется в main.js
const polyCache = new Map();

// Самый большой полигон страны: Франция без Гвианы, США без Аляски и т.д.
function largestPolygonFeature(id) {
  if (polyCache.has(id)) return polyCache.get(id);
  const f = featureMap.get(id);
  if (!f) return null;
  let out = f;
  if (f.geometry.type === "MultiPolygon") {
    let best = null;
    let bestArea = -1;
    for (const coords of f.geometry.coordinates) {
      const a = d3.geoArea({ type: "Polygon", coordinates: coords });
      if (a > bestArea) {
        bestArea = a;
        best = coords;
      }
    }
    out = {
      type: "Feature",
      id,
      properties: f.properties,
      geometry: { type: "Polygon", coordinates: best },
    };
  }
  polyCache.set(id, out);
  return out;
}

function geoAnchor(id) {
  const f = largestPolygonFeature(id);
  return f ? d3.geoCentroid(f) : null;
}

function screenAnchor(id) {
  const g = geoAnchor(id);
  return g ? projection(g) : null;
}

function arcD(a, b, bulge = 0.22) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return `M${a[0]},${a[1]} Q${mx},${my - dist * bulge} ${b[0]},${b[1]}`;
}

function currentZoomK() {
  return svg ? d3.zoomTransform(svg.node()).k : 1;
}

// Радиус хранится в data-r и делится на масштаб карты, чтобы точки не росли при зуме
function addDot(cls, p, r) {
  return overlay
    .append("circle")
    .attr("class", cls)
    .attr("cx", p[0])
    .attr("cy", p[1])
    .attr("data-r", r)
    .attr("r", r / currentZoomK());
}

let lastMarkerK = 0;
function updateMarkerScale(k) {
  if (!overlay || k === lastMarkerK) return;
  lastMarkerK = k;
  overlay.selectAll("circle").attr("r", function () {
    return this.getAttribute("data-r") / k;
  });
}

function clearArcs() {
  if (overlay) overlay.selectAll("*").remove();
}

// Линия и её свечение: свечение это второй, широкий и полупрозрачный штрих.
// Один path на все дуги вместо path на дугу, и никаких filter: drop-shadow
// (фильтр на каждом элементе заставляет браузер перерисовывать растр на каждый кадр зума).
function addLine(cls, glowCls, d) {
  if (!d) return;
  if (glowCls) overlay.append("path").attr("class", glowCls).attr("d", d);
  overlay.append("path").attr("class", cls).attr("d", d);
}

// Режим исследования: дуги от выбранной страны к партнёрам
function drawArcs(fromId, toIds) {
  clearArcs();
  const a = screenAnchor(fromId);
  if (!a) return;
  const ends = [];
  toIds.forEach((toId) => {
    if (!mapIds.has(toId)) return;
    const b = screenAnchor(toId);
    if (b) ends.push(b);
  });
  addLine("arc", "arc-glow", ends.map((b) => arcD(a, b)).join(" "));
  ends.forEach((b) => {
    addDot("marker-ring", b, 6);
    addDot("marker-dot", b, 2.6);
  });
  addDot("marker-origin-ring", a, 12);
  addDot("marker-origin", a, 4.5);
}

// Игра: пунктирный маршрут по посещённым странам.
// fatalId: страна, где поймали (янтарная дуга к ней от последней безопасной)
function drawTrail(ids, fatalId = null) {
  clearArcs();
  const pts = ids.map(screenAnchor);
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i] && pts[i + 1]) segs.push(arcD(pts[i], pts[i + 1], 0.2));
  }
  addLine("trail", "trail-glow", segs.join(" "));

  const last = pts[pts.length - 1];
  const fatal = fatalId ? screenAnchor(fatalId) : null;
  if (fatal && last) addLine("trail-fatal", "arc-glow", arcD(last, fatal, 0.2));

  pts.forEach((p, i) => {
    if (!p) return;
    const isLast = i === pts.length - 1;
    if (i === 0 && pts.length > 1) addDot("marker-start", p, 4.5);
    else if (isLast && !fatal) {
      addDot("marker-origin-ring", p, 12);
      addDot("marker-origin", p, 4.5);
    } else addDot("marker-trail", p, 2.6);
  });
  if (fatal) {
    addDot("marker-origin-ring", fatal, 12);
    addDot("marker-fatal", fatal, 4.5);
  }
}
