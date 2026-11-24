const game = {
  active: false,
  resultShown: false,
  won: false,
  visited: [],
  currentTarget: null,
  caughtId: null, // country the player jumped into and was caught in
  finalId: null, // country highlighted on the result screen (caught country, or the last safe one on a win)
  pending: null, // touch: country picked by the first of the two taps

  start() {
    const ids = Object.keys(extradition).filter((id) => mapIds.has(id));
    const startId = ids[Math.floor(Math.random() * ids.length)];

    this.active = true;
    this.resultShown = false;
    this.won = false;
    this.caughtId = null;
    this.finalId = null;
    this.pending = null;
    this.visited = [startId];
    this.currentTarget = startId;

    document.body.classList.add("in-game");
    document.body.classList.remove("show-result");
    clearSelection({ resetZoom: false });
    setHoverName(null);
    resetView(true, 1.3);
    this.render();
    observeSheetHeight();
  },

  // Number of safe moves left: not visited and no treaty with the current country
  safeMoves() {
    const related = new Set(extradition[this.currentTarget]?.treaties || []);
    const seen = new Set(this.visited);
    let n = 0;
    for (const id of mapIds) if (!seen.has(id) && !related.has(id)) n++;
    return n;
  },

  isDeadEnd() {
    return this.safeMoves() === 0;
  },

  handleClick(id) {
    if (!this.active) return;
    if (!mapIds.has(id)) return;

    // On touch screens the first tap shows the name, the second tap makes the jump
    if (isTouch()) {
      if (this.visited.includes(id)) {
        this.pending = null;
        showGameHover(id);
        paintMap();
        return;
      }
      if (this.pending !== id) {
        this.pending = id;
        this.render();
        return;
      }
    } else if (this.visited.includes(id)) return;
    this.pending = null;

    const related = extradition[this.currentTarget]?.treaties || [];
    if (related.includes(id)) {
      this.end(false, id);
      return;
    }

    this.visited.push(id);
    this.currentTarget = id;
    this.render();
    if (this.isDeadEnd()) this.end(true, null);
  },

  hoverPreview(id) {
    if (!mapIds.has(id)) return;
    showGameHover(id);
    paintMap(this.visited.includes(id) ? null : id);
  },

  render() {
    paintMap(this.pending);
    drawTrail(this.visited);
    this.updateHud();
    if (this.pending) showGameHover(this.pending, true);
    else if (isTouch()) showGameHover(null);
    this.updatePrompt();
    this.updateSheet();
  },

  updateHud() {
    document.getElementById("hud-count").textContent = String(this.visited.length).padStart(2, "0");
    document.getElementById("hud-safe").textContent = this.safeMoves();
  },

  updatePrompt() {
    document.getElementById("game-prompt-text").textContent = t("game.prompt", {
      country: countryName(this.currentTarget),
    });
  },

  updateSheet() {
    const cur = this.currentTarget;
    document.getElementById("game-eyebrow").textContent = `${t("game.youAreIn")} · ${iso3(cur)}`;
    document.getElementById("game-country").textContent = countryName(cur);
    document.getElementById("game-hint").textContent = isTouch()
      ? t("game.hintTouch")
      : t("game.hint", { country: countryName(cur) });

    const route = document.getElementById("game-route");
    route.replaceChildren();
    const tail = this.visited.slice(-5);
    tail.forEach((id, i) => {
      if (i > 0) route.append(chevron());
      const chip = document.createElement("span");
      chip.className = "route-chip" + (id === cur ? " is-current" : "");
      chip.textContent = iso3(id);
      route.append(chip);
    });
    route.scrollLeft = route.scrollWidth;
    observeSheetHeight();
  },

  end(won, caughtId) {
    this.active = false;
    this.resultShown = true;
    this.won = won;
    this.caughtId = caughtId;
    this.finalId = won ? this.currentTarget : caughtId;
    this.pending = null;

    document.body.classList.remove("in-game");
    document.body.classList.add("show-result");
    setHoverName(null);
    showGameHover(null);

    // The result screen draws its own map (result_map.js); the main one is hidden under it
    paintMap();
    showResult(this);
  },

  exit() {
    this.active = false;
    this.resultShown = false;
    this.won = false;
    this.visited = [];
    this.currentTarget = null;
    this.caughtId = null;
    this.finalId = null;
    this.pending = null;

    document.body.classList.remove("in-game", "show-result");
    hideResult();
    showGameHover(null);
    clearArcs();
    paintMap();
    setHoverName(null);
    resetView();
    observeSheetHeight();
  },
};

// Name pill shown during the game. withTap adds the "tap again" hint (touch)
function showGameHover(id, withTap = false) {
  const el = document.getElementById("game-hover");
  if (!id) {
    el.hidden = true;
    return;
  }
  document.getElementById("game-hover-iso").textContent = iso3(id);
  document.getElementById("game-hover-name").textContent = countryName(id);
  document.getElementById("game-hover-tap").hidden = !withTap;
  el.hidden = false;
}

function chevron() {
  const ns = "http://www.w3.org/2000/svg";
  const svgEl = document.createElementNS(ns, "svg");
  svgEl.setAttribute("class", "icon");
  svgEl.setAttribute("viewBox", "0 0 24 24");
  svgEl.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("d", "M9 6l6 6-6 6");
  svgEl.append(p);
  return svgEl;
}

document.getElementById("game-toggle").addEventListener("click", () => game.start());
document.getElementById("game-exit").addEventListener("click", () => game.exit());
