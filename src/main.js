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
            // .attr("fill-opacity", 0.5)
            .attr("data-id", (d) => d.id)
            .attr("d", path)
            .attr("fill", COLORS.default)
            .attr("stroke", COLORS.related_stroke)
            .attr("stroke-width", 0.1)
            .attr("class", "country")
            .style("pointer-events", "all")
            .on("mouseover", function (event, d) {
                const countryId = String(d.id);
                const related = extradition[countryId] || [];

                state.hover(countryId);

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
                group
                    .selectAll(".country")
                    .attr("fill", function (p) {
                        const pid = String(p.id);
                        if (pid === state.selectedId) return COLORS.selected;
                        return COLORS.default;
                    })
                    .attr("stroke", COLORS.related_stroke);

                state._update();
            });

        // const bgImage = group
        //     .append("image")
        //     .attr("href", "./assets/map_bg.webp")
        //     .attr("x", 0)
        //     .attr("y", -24)
        //     .attr("width", width)
        //     .attr("height", height)
        //     .attr("preserveAspectRatio", "none")
        //     .attr("opacity", 0.5)
        //     .style("pointer-events", "none")
        //     .style("mix-blend-mode", "multiply");

        // const continentsImage = group
        //     .append("image")
        //     .attr("href", "./assets/map_continents_1.webp")
        //     .attr("x", width * 0.14)
        //     .attr("y", height * 0.14)
        //     .attr("width", width * 0.83)
        //     .attr("height", height * 0.87)
        //     .attr("preserveAspectRatio", "none")
        //     .attr("opacity", 0.5)
        //     .style("pointer-events", "none")
        //     .style("mix-blend-mode", "multiply");
        //
        //
        const bgImage = group
            .append("image")
            .attr("href", "./assets/map_bg.webp")
            .attr("x", 0)
            .attr("y", -24)
            .attr("width", 1830)
            .attr("height", 950)
            .attr("preserveAspectRatio", "none")
            .attr("opacity", 0.5)
            .attr("pointer-events", "none")
            .style("mix-blend-mode", "multiply")
            .style("pointer-events", "none");

        const continentsImage = group
            .append("image")
            .attr("href", "./assets/map_continents_1.webp")
            .attr("x", 252)
            .attr("y", 110)
            .attr("width", 1525)
            .attr("height", 825)
            .attr("preserveAspectRatio", "none")
            .attr("opacity", 0.5)
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
        .scale(newWidth / 6.3)
        .translate([newWidth / 2, newHeight / 2 + 40]);

    group.selectAll("path").attr("d", path);

    // bgImage.attr("width", newWidth).attr("height", newHeight);

    continentsImage
        .attr("x", newWidth * 0.14)
        .attr("y", newHeight * 0.14)
        .attr("width", newWidth * 0.83)
        .attr("height", newHeight * 0.87);
});
