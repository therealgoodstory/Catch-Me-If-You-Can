// Graticule drawn as separate lines that fade toward the map edges, without an SVG mask:
// a mask is repainted on every zoom frame and used to cost 30-45% of the frame time on phones.
//   meridians: stroke gradient fades them at the top and bottom, per-line opacity at the left and right
//   parallels: stroke gradient fades them at the left and right, per-line opacity at the top and bottom
const GRAT_LINES = d3.geoGraticule10().coordinates;

// 0 at the edge, 1 from `edge` (a fraction of the span) inward, with a smooth ease
function edgeFade(t, edge) {
  const v = Math.max(0, Math.min(1, Math.min(t, 1 - t) / edge));
  return v * v * (3 - 2 * v);
}

// svg: d3 selection; g: d3 selection of the <g> that receives the lines; geo: d3.geoPath; id: gradient id prefix
function drawGraticule(svg, g, geo, id) {
  const [[x0, y0], [x1, y1]] = geo.bounds({ type: "MultiLineString", coordinates: GRAT_LINES });

  let defs = svg.select("defs");
  if (defs.empty()) defs = svg.insert("defs", ":first-child");
  defs.selectAll(`#${id}-v, #${id}-h`).remove();
  const gradient = (suffix, attrs, stops) => {
    const gr = defs.append("linearGradient").attr("id", `${id}-${suffix}`).attr("gradientUnits", "userSpaceOnUse");
    Object.entries(attrs).forEach(([k, v]) => gr.attr(k, v));
    stops.forEach(([o, a]) =>
      gr
        .append("stop")
        .attr("offset", o)
        .style("stop-color", "var(--c-grid-line)")
        .style("stop-opacity", `calc(${a} * var(--c-grid-op))`),
    );
  };
  gradient("v", { x1: 0, x2: 0, y1: y0, y2: y1 }, [[0, 0], [0.28, 1], [0.72, 1], [1, 0]]);
  gradient("h", { y1: 0, y2: 0, x1: x0, x2: x1 }, [[0, 0], [0.2, 1], [0.8, 1], [1, 0]]);

  g.selectAll("path").remove();
  GRAT_LINES.forEach((line) => {
    const feature = { type: "LineString", coordinates: line };
    const parallel = line.every((p) => p[1] === line[0][1]);
    const [[a0, b0], [a1, b1]] = geo.bounds(feature);
    const o = parallel
      ? edgeFade((((b0 + b1) / 2) - y0) / (y1 - y0), 0.28)
      : edgeFade((((a0 + a1) / 2) - x0) / (x1 - x0), 0.2);
    if (o < 0.02) return;
    g.append("path")
      .attr("d", geo(feature))
      .attr("stroke", `url(#${id}-${parallel ? "h" : "v"})`)
      .attr("stroke-opacity", o);
  });
}
