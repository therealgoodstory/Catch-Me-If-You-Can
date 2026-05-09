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
        if (pid === foundId) return COLORS.selected;
        if (related.includes(pid)) return COLORS.related;
        return COLORS.default;
    });

    zoomToCountry(foundId);
}

searchBtn.addEventListener("click", searchCountry);

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchCountry();
});

const clearBtn = document.getElementById("clear-btn");

clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    selectedId = null;
    group.selectAll("path").attr("fill", COLORS.default);
});
