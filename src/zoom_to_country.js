function zoomToCountry(foundId) {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    const countryPath = group
        .selectAll("path")
        .filter((p) => String(p.id) === foundId);
    const node = countryPath.node();
    if (!node) return;

    const bounds = node.getBBox();
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;

    const scale = 4;
    const tx = currentWidth / 2 - scale * cx;
    const ty = currentHeight / 2 - scale * cy;

    svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}
