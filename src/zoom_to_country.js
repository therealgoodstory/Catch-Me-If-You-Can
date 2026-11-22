// Камера: приблизить страну и вернуться к стартовому виду

function zoomToCountry(id) {
  const f = largestPolygonFeature(id);
  if (!f || !svg) return;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const mobile = isMobile();

  const [[x0, y0], [x1, y1]] = path.bounds(f);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;

  // на телефоне низ экрана закрывает шторка, поэтому центр выше
  const targetY = mobile ? h * 0.36 : h / 2;
  const maxK = mobile ? 3 : 2.5;
  const fit = 0.5 / Math.max((x1 - x0) / w, (y1 - y0) / (mobile ? h * 0.4 : h));
  const k = Math.max(1.4, Math.min(maxK, fit));

  svg
    .transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity.translate(w / 2 - k * cx, targetY - k * cy).scale(k));
}

function resetView(animated = true, k) {
  if (!svg) return;
  const target = initialTransform(k);
  if (animated) svg.transition().duration(600).call(zoom.transform, target);
  else svg.call(zoom.transform, target);
}
