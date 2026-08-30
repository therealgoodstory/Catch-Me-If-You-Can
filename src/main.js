let extradition = {};
let worldCountries;
let group;
let path;
let svg;
let zoom;

async function init() {
  extradition = await loadExtraditionData();

  const width = window.innerWidth;
  const height = window.innerHeight;

  svg = d3
    .select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  group = svg.append("g");

  const leftOffset = 40

  // mobile
  let isMobile = width <= 768;

  zoom = d3
    .zoom()
    .scaleExtent([1, isMobile ? 16 : 4])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", (event) => {
      group.attr("transform", event.transform);
    });
  svg.call(zoom).on("click.zoom", null);

  const projection = d3
    .geoNaturalEarth1()
    .scale(Math.min(width / 6.3, height / 3.2))
    .translate([width / 2 - leftOffset, height / 2 + 40]);

  path = d3.geoPath().projection(projection);

  let continentsImage;
  const CONTINENTS_ASPECT = 3344 / 1806;

  fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then((r) => r.json())
    .then((world) => {
      worldCountries = topojson.feature(world, world.objects.countries);

      worldCountries.features.forEach(f => {
        f.id = String(parseInt(f.id, 10));
      });

      const land = topojson.mesh(
        world,
        world.objects.countries,
        (a, b) => a === b,
      );

      group
        .append("path")
        .datum(land)
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke-width", 0.4);

      group
        .selectAll("path")
        .data(worldCountries.features)
        .enter()
        .append("path")
        .attr("data-id", (d) => d.id)
        .attr("d", path)
        .attr("fill", COLORS.default)
        .attr("stroke", COLORS.border)
        .style("vector-effect", "non-scaling-stroke")
        .attr("class", "country")
        .style("pointer-events", "all")
        .on("mouseover", function (event, d) {
          const countryId = String(d.id);
          state.hover(countryId);

          const related = extradition[state.selectedId]?.treaties || [];

          group.selectAll(".country").attr("fill", function (p) {
            const pid = String(p.id);
            if (pid === state.selectedId) return COLORS.selected;
            if (pid === countryId) return COLORS.hover;
            if (related.includes(pid)) return COLORS.related;
            return COLORS.default;
          });
        })

        .on("mouseout", function () {
          const related = extradition[state.selectedId]?.treaties || [];
          group.selectAll(".country").attr("fill", function (p) {
            const pid = String(p.id);
            if (pid === state.selectedId) return COLORS.selected;
            if (related.includes(pid)) return COLORS.related;
            return COLORS.default;
          });
          state._update();

          document.getElementById("country-hover-name").textContent = "Hover a country";
          document.getElementById("country-hover-name").classList.add("placeholder");
        })

        .on("click", function (event, d) {
          const countryId = String(d.id);
          state.select(countryId);

          const related = extradition[countryId]?.treaties || [];
          drawArcs(countryId, related);

          state.renderExtradition(countryId);

          group.selectAll(".country").attr("fill", function (p) {
            const pid = String(p.id);
            const related = extradition[countryId]?.treaties || [];
            if (pid === countryId) return COLORS.selected;
            if (related.includes(pid)) return COLORS.related;
            return COLORS.default;
          });
        })

      const initScale = Math.min(width / 6.3, height / 3.2);
      const initW = initScale * 5.19;
      const initH = initW / CONTINENTS_ASPECT;


      continentsImage = group
        .append("image")
        .attr("href", "./assets/map_continents.webp")
        .attr("x", width / 2 - initScale * 2.29 - leftOffset)
        .attr("y", height / 2 - initH / 2 + 40)
        .attr("width", initW)
        .attr("height", initH)
        .attr("preserveAspectRatio", "none")
        .attr("pointer-events", "none")
        .style("mix-blend-mode", "multiply")
        .style("pointer-events", "none");
    });

  // adadptive
  window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    svg.call(zoom.transform, d3.zoomIdentity);

    zoom.translateExtent([
      [0, 0],
      [newWidth, newHeight],
    ]);

    svg.attr("width", newWidth).attr("height", newHeight);

    projection
      .scale(Math.min(newWidth / 6.3, newHeight / 3.2))
      .translate([newWidth / 2 - 40, newHeight / 2]);

    group.selectAll("path").attr("d", path);


    if (continentsImage) {
      const mapScale = Math.min(newWidth / 6.3, newHeight / 3.2);
      const imgW = mapScale * 5.19;
      const imgH = imgW / CONTINENTS_ASPECT;
      continentsImage
        .attr("x", newWidth / 2 - leftOffset - mapScale * 2.29)
        .attr("y", newHeight / 2 - imgH / 2)
        .attr("width", imgW)
        .attr("height", imgH);
    }

    // mobile
    isMobile = window.innerWidth <= 768;
    zoom.scaleExtent([1, isMobile ? 16 : 2]);
  });


  // mobile
  const panelToggle = document.getElementById("panel-toggle");
  if (panelToggle) {
    panelToggle.addEventListener("click", () => {
      document.getElementById("panel-right").classList.toggle("expanded");
    });
  }
}

init();
