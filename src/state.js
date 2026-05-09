const state = {
    selectedId: null,

    select(id) {
        this.selectedId = id;
        this._update();
    },

    clear() {
        this.selectedId = null;
        this._update();
    },

    _update() {
        const nameEl = document.getElementById("country-name");
        if (this.selectedId) {
            nameEl.textContent = countries[this.selectedId] || "Unknown";
            nameEl.classList.remove("placeholder");
        } else {
            nameEl.textContent = "Select a country";
            nameEl.classList.add("placeholder");
        }
    },

    hover(id) {
        const nameEl = document.getElementById("country-name");
        nameEl.textContent = countries[id] || "Unknown";
        nameEl.classList.remove("placeholder");
    },
};
