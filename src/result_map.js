// Map on the result screen: its own full-screen SVG under the result UI, with its own zoom.
// #result-map-slot only marks where the whole world sits when the screen opens.
// Only the countries the player visited (plus the one that caught them) react to hover and tap.
let resultMap = null; // { svg, zoom }

function destroyResultMap() {
  document.getElementById("result-map")?.remove();
  resultMap = null;
  mapTip.hide();
}

function buildResultMap() {
  const slot = document.getElementById("result-map-slot").getBoundingClientRect();
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!slot.width || !slot.height) return;
  document.getElementById("result-map")?.remove();

  const visited = new Set(game.visited);
  if (game.caughtId) visited.add(game.caughtId);

  const feats = worldCountries.features;
  const proj = d3
    .geoNaturalEarth1()
    .fitExtent(
      [
        [slot.left + 8, slot.top + 8],
        [slot.right - 8, slot.bottom - 8],
      ],
      { type: "FeatureCollection", features: feats },
    );
  const geo = d3.geoPath(proj).digits(1);
  const wb = geo.bounds({ type: "FeatureCollection", features: feats });
  const anchor = (id) => {
    const g = geoAnchor(id);
    return g ? proj(g) : null;
  };

  const svg = d3
    .select("#result")
    .insert("svg", ":first-child")
    .attr("id", "result-map")
    .attr("viewBox", `0 0 ${w} ${h}`);
  const root = svg.append("g");

  drawGraticule(svg, root.append("g").attr("class", "graticule"), geo, "rgrat");

  // Everything else is plain land; visited countries are drawn on top, the caught one last
  root
    .selectAll(".land")
    .data(feats.filter((f) => !visited.has(f.id)))
    .join("path")
    .attr("class", "land")
    .attr("d", geo);

  const mine = feats
    .filter((f) => visited.has(f.id))
    .sort((a, b) => (a.id === game.finalId) - (b.id === game.finalId));
  root
    .selectAll(".country")
    .data(mine)
    .join("path")
    .attr("class", (d) => "country is-visited" + (d.id === game.finalId ? " is-caught" : ""))
    .attr("d", geo)
    .on("mouseenter", (event, d) => {
      if (!isTouch()) mapTip.show(d.id, event);
    })
    .on("mousemove", (event) => {
      if (!isTouch()) mapTip.move(event);
    })
    .on("mouseleave", () => {
      if (!isTouch()) mapTip.hide();
    })
    .on("click", (event, d) => isTouch() && mapTip.show(d.id, event)); // on touch screens a tap shows the name

  // Route: dotted line through the visited countries, amber arc into the country that caught the player
  const overlay = root.append("g").attr("class", "overlay");
  const pts = game.visited.map(anchor);
  const fatal = game.caughtId ? anchor(game.caughtId) : null;
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i] && pts[i + 1]) segs.push(arcD(pts[i], pts[i + 1], 0.2));
  }
  const line = (cls, d) => overlay.append("path").attr("class", cls).attr("d", d);
  if (segs.length) {
    line("trail-glow", segs.join(" "));
    line("trail", segs.join(" "));
  }
  const last = pts[pts.length - 1];
  if (fatal && last) {
    line("arc-glow", arcD(last, fatal, 0.2));
    line("trail-fatal", arcD(last, fatal, 0.2));
  }
  // The radius is kept in data-r and divided by the zoom factor, so markers keep a constant screen size
  const dot = (cls, p, r) =>
    overlay.append("circle").attr("class", cls).attr("cx", p[0]).attr("cy", p[1]).attr("data-r", r).attr("r", r);
  pts.forEach((p, i) => {
    if (!p) return;
    const isLast = i === pts.length - 1;
    if (i === 0 && pts.length > 1) dot("marker-start", p, 5.5);
    else if (isLast && !fatal) {
      dot("marker-origin-ring", p, 12);
      dot("marker-origin", p, 4.5);
    } else dot("marker-trail", p, 2.6);
  });
  if (fatal) {
    dot("marker-origin-ring", fatal, 12);
    dot("marker-fatal", fatal, 4.5);
  }

  const zoomBehavior = d3
    .zoom()
    .scaleExtent([1, 16])
    .extent([
      [0, 0],
      [w, h],
    ])
    // The world may be dragged about half a screen past its own edges
    .translateExtent([
      [wb[0][0] - w / 2, wb[0][1] - h / 2],
      [wb[1][0] + w / 2, wb[1][1] + h / 2],
    ])
    .on("zoom", (event) => {
      root.attr("transform", event.transform);
      // A touch drag moves the map away from under a tapped country's name. With a mouse the tooltip
      // keeps following whatever is under the cursor (mouseenter and mouseleave still fire while dragging).
      if (event.sourceEvent?.type?.startsWith("touch")) mapTip.hide();
      const k = event.transform.k;
      overlay.selectAll("circle").attr("r", function () {
        return this.getAttribute("data-r") / k;
      });
    });
  svg.call(zoomBehavior);
  // A tap on empty map hides the name (the name of a tapped country stays until then)
  svg.on("click", (event) => {
    if (!event.target.closest(".country")) mapTip.hide();
  });

  resultMap = { svg, zoom: zoomBehavior };
}

document.getElementById("result-zoom-in").addEventListener("click", () => {
  if (resultMap) resultMap.svg.transition().duration(250).call(resultMap.zoom.scaleBy, 1.6);
});
document.getElementById("result-zoom-out").addEventListener("click", () => {
  if (resultMap) resultMap.svg.transition().duration(250).call(resultMap.zoom.scaleBy, 1 / 1.6);
});
