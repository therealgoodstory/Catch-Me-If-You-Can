const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
let selectedId = null;

searchInput.addEventListener("keypress", (e) => {
    if (!/[a-zA-Z\s]/.test(e.key)) e.preventDefault();
});

function searchCountry() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    const match = Object.entries(countries).find(([id, name]) =>
        name.toLowerCase().includes(query),
    );

    if (!match) return;

    const [foundId] = match;
    selectedId = foundId;

    group.selectAll("path").attr("fill", function (p) {
        const pid = String(p.id);
        const related = extradition[foundId] || [];
        if (pid === foundId) return "#ff8800";
        if (related.includes(pid)) return "#44ff88";
        return "#1e3a5f";
    });

    zoomToCountry(foundId);
}

searchBtn.addEventListener("click", searchCountry);

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchCountry();
});

function zoomToCountry(foundId) {
    const countryPath = group
        .selectAll("path")
        .filter((p) => String(p.id) === foundId);
    const node = countryPath.node();
    if (!node) return;

    const bounds = node.getBBox();
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;

    const scale = 4;
    const tx = width / 2 - scale * cx;
    const ty = height / 2 - scale * cy;

    svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}

const clearBtn = document.getElementById("clear-btn");

clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    selectedId = null;
    group.selectAll("path").attr("fill", "#1e3a5f");
});
