function drawArcs(fromId, toIds) {
  group.selectAll(".arc").remove();

  const fromFeature = worldCountries.features.find(f => f.id === fromId);
  if (!fromFeature) return;
  const fromCentroid = path.centroid(fromFeature);

  toIds.forEach(toId => {
    const toFeature = worldCountries.features.find(f => f.id === toId);
    if (!toFeature) return;
    const toCentroid = path.centroid(toFeature);

    const mx = (fromCentroid[0] + toCentroid[0]) / 2;
    const my = (fromCentroid[1] + toCentroid[1]) / 2 - 40;

    const arcPath = `M${fromCentroid[0]},${fromCentroid[1]} Q${mx},${my} ${toCentroid[0]},${toCentroid[1]}`;

    group.append("path")
      .attr("class", "arc")
      .attr("d", arcPath)
      .attr("fill", "none")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.2)
      .style("pointer-events", "none")
      .style("vector-effect", "non-scaling-stroke");
  });
}

function clearArcs() {
  group.selectAll(".arc").remove();
}
