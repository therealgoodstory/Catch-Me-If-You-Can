const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3
    .select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const group = svg.append("g");

const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
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
    .scale(width / 6.3)
    .translate([width / 2, height / 2 + 40]);

const path = d3.geoPath().projection(projection);

fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then((r) => r.json())
    .then((world) => {
        const worldCountries = topojson.feature(world, world.objects.countries);

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
            .attr("stroke", COLORS.related_stroke)
            .attr("stroke-width", 0.4);

        group
            .selectAll("path")
            .data(worldCountries.features)
            .enter()
            .append("path")
            .attr("data-id", (d) => d.id)
            .attr("d", path)
            .attr("fill", COLORS.default)
            .attr("stroke", COLORS.related_stroke)
            .attr("stroke-width", 0.1)
            .attr("class", "country")
            .style("pointer-events", "all")
            .on("mouseover", function (event, d) {
                const countryId = String(d.id);

                const name = countries[countryId] || "Unknown";
                document.getElementById("country-name").textContent = name;
                document
                    .getElementById("country-name")
                    .classList.remove("placeholder");

                const related = extradition[countryId] || [];

                group.selectAll("path").attr("fill", function (p) {
                    const pid = String(p.id);
                    if (pid === countryId) return COLORS.hover;
                    if (related.includes(pid)) return COLORS.related;
                    return COLORS.default;
                });

                group
                    .selectAll(".country")
                    .attr("fill", function (p) {
                        const pid = String(p.id);
                        if (pid === countryId) return COLORS.hover;
                        if (related.includes(pid)) return COLORS.related;
                        return COLORS.default;
                    })
                    .attr("stroke", function (p) {
                        const pid = String(p.id);
                        if (related.includes(pid)) return COLORS.hover;
                        return COLORS.related_stroke;
                    });
            })

            .on("mouseout", function () {
                group.selectAll("path").attr("fill", function (p) {
                    const pid = String(p.id);
                    if (pid === state.selectedId) return COLORS.selected;
                    return COLORS.default;
                });

                if (state.selectedId) {
                    document.getElementById("country-name").textContent =
                        countries[state.selectedId] || "Unknown";
                    document
                        .getElementById("country-name")
                        .classList.remove("placeholder");
                } else {
                    document.getElementById("country-name").textContent =
                        "Select a country";
                    document
                        .getElementById("country-name")
                        .classList.add("placeholder");
                }

                group.selectAll(".country").attr("stroke", "#000000");
            });
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
        .scale(newWidth / 6.3)
        .translate([newWidth / 2, newHeight / 2 + 40]);

    group.selectAll("path").attr("d", path);
});
