// Matches Latin input only, against English country names and ISO alpha-3 codes (diacritics stripped).

const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-btn");
const resultsEl = document.getElementById("search-results");

let searchIndex = [];
let currentResults = [];
let activeIdx = -1;

const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function buildSearchIndex() {
  searchIndex = [...mapIds]
    .map((id) => ({
      id,
      name: countryName(id),
      // matches the localized name and the English one, so Latin input works in every UI language
      norm: norm(countryName(id)),
      normEn: norm(countries[id] || ""),
      iso: iso3(id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, langLocale()));
}

function queryCountries(q) {
  const n = norm(q.trim());
  if (!n) return [];
  const starts = [];
  const includes = [];
  for (const c of searchIndex) {
    if (c.norm.startsWith(n) || c.normEn.startsWith(n) || c.iso.toLowerCase() === n) starts.push(c);
    else if (c.norm.includes(n) || c.normEn.includes(n)) includes.push(c);
  }
  return starts.concat(includes).slice(0, 6);
}

function highlight(name, q) {
  const n = norm(q.trim());
  const frag = document.createDocumentFragment();
  const normName = norm(name);
  const i = normName.length === name.length ? normName.indexOf(n) : -1;
  if (i < 0 || !n) {
    frag.append(name);
    return frag;
  }
  const mark = document.createElement("mark");
  mark.textContent = name.slice(i, i + n.length);
  frag.append(name.slice(0, i), mark, name.slice(i + n.length));
  return frag;
}

function showResults(list, q) {
  currentResults = list;
  activeIdx = list.length ? 0 : -1;
  resultsEl.replaceChildren();

  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "search-empty";
    li.textContent = t("search.noResults");
    resultsEl.append(li);
  }

  list.forEach((c, i) => {
    const li = document.createElement("li");
    li.className = "search-item";
    li.id = `search-opt-${i}`;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", i === activeIdx ? "true" : "false");

    const iso = document.createElement("span");
    iso.className = "iso";
    iso.textContent = c.iso;

    const name = document.createElement("span");
    name.className = "search-item-name";
    name.append(highlight(c.name, q));

    const count = document.createElement("span");
    count.className = "search-item-count";
    const n = document.createElement("b");
    n.textContent = extradition[c.id]?.treaties?.length ?? "–";
    const lbl = document.createElement("span");
    lbl.textContent = t("search.treaties");
    count.append(n, lbl);

    li.append(iso, name, count);
    // mousedown instead of click, so the input keeps focus until a choice is made
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      chooseCountry(c.id);
    });
    resultsEl.append(li);
  });

  resultsEl.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
  setActive(activeIdx);
}

function hideResults() {
  resultsEl.hidden = true;
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
  currentResults = [];
  activeIdx = -1;
}

function setActive(i) {
  activeIdx = i;
  [...resultsEl.querySelectorAll(".search-item")].forEach((li, k) =>
    li.setAttribute("aria-selected", k === i ? "true" : "false"),
  );
  if (i >= 0) searchInput.setAttribute("aria-activedescendant", `search-opt-${i}`);
}

function chooseCountry(id) {
  hideResults();
  searchInput.blur();
  selectCountry(id, { zoom: true });
}

searchInput.addEventListener("input", () => {
  // Strip everything except Latin letters, whitespace, apostrophe, dot and hyphen
  const clean = searchInput.value.replace(/[^a-zA-Z\s'.\-]/g, "");
  if (clean !== searchInput.value) searchInput.value = clean;
  clearBtn.hidden = clean === "" && !state.selectedId;
  if (clean.trim() === "") return hideResults();
  showResults(queryCountries(clean), clean);
});

searchInput.addEventListener("focus", () => {
  // The selected country's name gives way to an empty field; blur brings it back if nothing was chosen
  if (state.selectedId) searchInput.value = "";
});

searchInput.addEventListener("blur", () => {
  hideResults();
  // Restore the selected country's name if a half-typed query was left in the input
  if (state.selectedId) renderCapsule();
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    if (!currentResults.length) return;
    e.preventDefault();
    const d = e.key === "ArrowDown" ? 1 : -1;
    setActive((activeIdx + d + currentResults.length) % currentResults.length);
  } else if (e.key === "Enter") {
    e.preventDefault();
    const pick = currentResults[activeIdx] || currentResults[0];
    if (pick) chooseCountry(pick.id);
  } else if (e.key === "Escape") {
    hideResults();
    searchInput.blur();
  }
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  hideResults();
  clearSelection();
  renderCapsule();
});
