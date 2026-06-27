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
    .scaleExtent([1, 2])
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
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

let bgImage, continentsImage;
const CONTINENTS_ASPECT = 3344 / 1806;

bgImage = group
    .append("image")
    .attr("href", "./assets/bg_map.webp")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("preserveAspectRatio", "xMidYMid slice")
    // .attr("opacity", 0.5)
    .attr("pointer-events", "none")
    .style("mix-blend-mode", "multiply")
    .style("pointer-events", "none");

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
            // .attr("fill-opacity", 0.5)
            .attr("data-id", (d) => d.id)
            .attr("d", path)
            .attr("fill", COLORS.default)
            .attr("stroke", COLORS.border)
            .attr("stroke-width", 0.5)
            .attr("class", "country")
            .style("pointer-events", "all")
            .on("mouseover", function (event, d) {
                const countryId = String(d.id);
                const related = extradition[countryId] || [];

                state.hover(countryId);

                group.selectAll(".country").attr("fill", function (p) {
                    const pid = String(p.id);
                    if (pid === countryId) return COLORS.hover;
                    if (related.includes(pid)) return COLORS.related;
                    return COLORS.default;
                });
                // .attr("stroke", function (p) {
                //     const pid = String(p.id);
                //     if (related.includes(pid)) return COLORS.selected;
                //     return COLORS.selected;
                // });
            })

            .on("mouseout", function () {
                group
                    .selectAll(".country")
                    .attr("fill", function (p) {
                        const pid = String(p.id);
                        if (pid === state.selectedId) return COLORS.related;
                        return COLORS.default;
                    })
                    .attr("stroke", "#1a1a1a");

                state._update();
            });

        const initScale = Math.min(width / 6.3, height / 3.2);
        const initW = initScale * 5.19;
        const initH = initW / CONTINENTS_ASPECT;

        continentsImage = group
            .append("image")
            .attr("href", "./assets/map_continents_3.webp")
            .attr("x", width / 2 - initScale * 2.29)
            .attr("y", height / 2 - initH / 2)
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
        .translate([newWidth / 2, newHeight / 2]);

    group.selectAll("path").attr("d", path);

    if (bgImage) {
        bgImage.attr("width", newWidth).attr("height", newHeight);
    }

    if (continentsImage) {
        const mapScale = Math.min(newWidth / 6.3, newHeight / 3.2);
        const imgW = mapScale * 5.19;
        const imgH = imgW / CONTINENTS_ASPECT;
        continentsImage
            .attr("x", newWidth / 2 - mapScale * 2.29)
            .attr("y", newHeight / 2 - imgH / 2)
            .attr("width", imgW)
            .attr("height", imgH);
    }
});
