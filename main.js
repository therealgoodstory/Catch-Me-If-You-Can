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
        const countries = topojson.feature(world, world.objects.countries);

        group
            .selectAll("path")
            .data(countries.features)
            .enter()
            .append("path")
            .attr("data-id", (d) => d.id)
            .attr("d", path)
            .attr("fill", "#1e3a5f")
            .attr("stroke", "#4a9eff")
            .attr("stroke-width", 0.5)
            .style("pointer-events", "all")
            .on("mouseover", function (event, d) {
                const countryId = String(d.id);
                const related = extradition[countryId] || [];

                // console.log("id:", countryId, "related:", related);

                group.selectAll("path").attr("fill", function (p) {
                    const pid = String(p.id);
                    if (pid === countryId) return "#ff4444";
                    if (related.includes(pid)) return "#44ff88";
                    return "#1e3a5f";
                });
            })
            .on("mouseout", function () {
                group.selectAll("path").attr("fill", "#1e3a5f");
            });
    });

// adadptive
window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    svg.call(zoom.transform, d3.zoomIdentity);

    svg.attr("width", newWidth).attr("height", newHeight);

    projection
        .scale(newWidth / 6.3)
        .translate([newWidth / 2, newHeight / 2 + 40]);

    group.selectAll("path").attr("d", path);
});
