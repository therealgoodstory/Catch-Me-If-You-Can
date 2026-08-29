const state = {
    selectedId: null,

    select(id) {
        this.selectedId = id;
        this._update();
        this.renderExtradition(id);
    },

    clear() {
        this.selectedId = null;
        this._update();
        document.getElementById("country-extradition").innerHTML = "";
    },

    _update() {
      const nameEl = document.getElementById("country-name");
      const sourceEl = document.getElementById("country-source");

      if (this.selectedId) {
        nameEl.textContent = countries[this.selectedId] || "Unknown";
        nameEl.classList.remove("placeholder");
        const source = extradition[this.selectedId]?.source;
        if (source) {
          sourceEl.href = source;
          sourceEl.textContent = "Source";
          sourceEl.style.display = "block";
        }
      } else {
        nameEl.textContent = "Select a country";
        nameEl.classList.add("placeholder");
        sourceEl.style.display = "none";
      }
    },

    hover(id) {
      const nameEl = document.getElementById("country-hover-name");
      nameEl.textContent = countries[id] || "Unknown";
      nameEl.classList.remove("placeholder");
    },

    renderExtradition(id) {
        const el = document.getElementById("country-extradition");
        const related = extradition[id]?.treaties || [];

        if (related.length === 0) {
            el.innerHTML = "<p>No treaties found</p>";
            return;
        }

        const names = related.map((rid) => countries[rid] || rid);
        el.innerHTML = names
            .map((name) => `<div class="extradition-item">${name}</div>`)
            .join("");
    },
};
