const game = {
  active: false,
  visited: [],
  currentTarget: null,

  start() {
    const ids = Object.keys(extradition).filter(id => worldCountries.features.some(f => f.id === id));
    const randomId = ids[Math.floor(Math.random() * ids.length)];

    this.active = true;
    this.visited = [randomId];
    this.currentTarget = randomId;

    this.updatePanel(randomId);
    this.paint();
    this.drawPath();
  },

  updatePanel(countryId) {
    const nameEl = document.getElementById("country-name");
    nameEl.textContent = countries[countryId] || "Unknown";
    nameEl.classList.remove("placeholder");

    document.getElementById("country-extradition").innerHTML = "";
    document.getElementById("country-source").style.display = "none";
  },

  handleClick(countryId) {
    if (!this.active) return;
    if (this.visited.includes(countryId)) return;
    const related = extradition[this.currentTarget]?.treaties || [];
    if (related.includes(countryId)) {
      this.end(false, countryId);
      return;
    }
    this.visited.push(countryId);
    this.currentTarget = countryId;
    this.updatePanel(countryId);
    this.paint();
    this.drawPath();
    if (this.isDeadEnd()) {
      this.end(true, null);
    }
  },

  isDeadEnd() {
    const related = extradition[this.currentTarget]?.treaties || [];
    return worldCountries.features.every(f => {
      const id = f.id;
      if (this.visited.includes(id)) return true;
      return related.includes(id);
    });
  },

  paint() {
    group.selectAll(".country").attr("fill", (p) => {
      const pid = String(p.id);
      if (this.visited.includes(pid)) return COLORS.visited;
      return COLORS.default;
    });
  },

  hoverPreview(countryId) {
    if (this.visited.includes(countryId)) return;

    const nameEl = document.getElementById("country-hover-name");
    nameEl.textContent = countries[countryId] || "Unknown";
    nameEl.classList.remove("placeholder");

    group.selectAll(".country").attr("fill", (p) => {
      const pid = String(p.id);
      if (this.visited.includes(pid)) return COLORS.visited;
      if (pid === countryId) return COLORS.hover;
      return COLORS.default;
    });
  },

  // lines
  drawPath() {
    clearArcs();

    for (let i = 0; i < this.visited.length - 1; i++) {
      const fromId = this.visited[i];
      const toId = this.visited[i + 1];

      const fromFeature = worldCountries.features.find(f => f.id === fromId);
      const toFeature = worldCountries.features.find(f => f.id === toId);
      if (!fromFeature || !toFeature) continue;

      const fromCentroid = path.centroid(fromFeature);
      const toCentroid = path.centroid(toFeature);

      const mx = (fromCentroid[0] + toCentroid[0]) / 2;
      const my = (fromCentroid[1] + toCentroid[1]) / 2 - 30;

      const arcPath = `M${fromCentroid[0]},${fromCentroid[1]} Q${mx},${my} ${toCentroid[0]},${toCentroid[1]}`;

      group.append("path")
        .attr("class", "arc game-arc")
        .attr("d", arcPath)
        .attr("fill", "none")
        .attr("stroke", COLORS.selected)
        .attr("stroke-width", 2)
        .attr("opacity", 0.9)
        .style("pointer-events", "none")
        .style("vector-effect", "non-scaling-stroke");
    }
  },

  end(won, loserCountry) {
    this.active = false;
    // modal TODO
    console.log(won ? "WIN" : "LOSE", this.visited, loserCountry);
     clearArcs();
  },

  reset() {
    this.active = false;
    this.visited = [];
    this.currentTarget = null;
    clearArcs();
  }

};
