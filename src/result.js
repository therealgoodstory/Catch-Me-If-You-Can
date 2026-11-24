function rankInfo(n) {
  let i = 0;
  RANKS.forEach((r, k) => {
    if (n >= r.min) i = k;
  });
  const cur = RANKS[i];
  const next = RANKS[i + 1] || null;
  return {
    cur,
    next,
    remaining: next ? next.min - n : 0,
    progress: next ? (n - cur.min) / (next.min - cur.min) : 1,
  };
}

function loadBest() {
  try {
    return parseInt(localStorage.getItem(STORAGE_BEST) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(n) {
  try {
    localStorage.setItem(STORAGE_BEST, String(n));
  } catch {
    /* storage unavailable (private mode): the best score is just not persisted */
  }
}

function distanceKm(ids) {
  let km = 0;
  for (let i = 0; i < ids.length - 1; i++) {
    const a = geoAnchor(ids[i]);
    const b = geoAnchor(ids[i + 1]);
    if (a && b) km += d3.geoDistance(a, b) * 6371;
  }
  return km;
}

function fmtKm(km) {
  return km >= 1000 ? `${(km / 1000).toFixed(1)}k` : String(Math.round(km));
}

// Square flag of the final country (flag-icons, 1x1 variant)
function setFlag(id) {
  const code = iso2(id);
  document.getElementById("caught-flag").className = code ? `fi fi-${code.toLowerCase()}` : "fi";
}

// "Extradited to [flag] Country": the country is a small plaque with its flag
function setSub(g) {
  const sub = document.getElementById("caught-sub");
  sub.replaceChildren();
  if (g.won) {
    sub.textContent = t("result.win");
    return;
  }
  const [before, after = ""] = t("result.extraditedTo", { country: "\u0000" }).split("\u0000");
  const pill = document.createElement("span");
  pill.className = "caught-pill";
  const flag = document.createElement("span");
  const code = iso2(g.currentTarget);
  flag.className = code ? `fi fi-${code.toLowerCase()}` : "fi";
  pill.append(flag, countryName(g.currentTarget));
  sub.append(before, pill, after);
}

function countUp(el, to, ms = 700) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || to === 0) {
    el.textContent = String(to);
    return;
  }
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / ms);
    el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function showResult(g) {
  const n = g.visited.length;
  const root = document.getElementById("result");
  root.hidden = false;

  document.getElementById("result-count-label").textContent = t("result.crossed", { n });
  countUp(document.getElementById("result-count"), n);

  const caught = document.getElementById("result-caught");
  caught.classList.toggle("is-win", g.won);
  document.getElementById("caught-eyebrow").textContent = g.won
    ? t("result.untouchable")
    : `${t("result.caughtIn")} · ${iso3(g.caughtId)}`;
  document.getElementById("caught-name").textContent = countryName(g.finalId);
  setSub(g);
  setFlag(g.finalId);

  const r = rankInfo(n);
  document.getElementById("rank-name").textContent = t(`rank.${r.cur.key}`);
  document.getElementById("rank-next").textContent = r.next
    ? t("result.toNext", { n: r.remaining, rank: t(`rank.${r.next.key}`) })
    : t("result.maxRank");
  const pct = Math.round(r.progress * 100);
  document.getElementById("rank-bar").setAttribute("aria-valuenow", String(pct));
  const fill = document.getElementById("rank-fill");
  fill.style.width = "0";
  requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = `${pct}%`)));

  document.getElementById("res-world").textContent = `${Math.round((n / mapIds.size) * 100)}%`;
  const route = g.caughtId ? [...g.visited, g.caughtId] : g.visited;
  document.getElementById("res-km").textContent = fmtKm(distanceKm(route));

  const prevBest = loadBest();
  const best = Math.max(prevBest, n);
  if (n > prevBest) saveBest(n);
  document.getElementById("res-best").textContent = String(best);
  document.getElementById("res-new").hidden = !(n > prevBest);

  // Wait a frame so the slot has its final size before fitting the map
  requestAnimationFrame(() => {
    buildResultMap();
    document.getElementById("result-restart").focus({ preventScroll: true });
  });
}

function hideResult() {
  document.getElementById("result").hidden = true;
  destroyResultMap();
}

async function shareResult() {
  const n = game.visited.length;
  const text = game.won
    ? t("share.win", { n })
    : t("share.caught", { n, country: countryName(game.caughtId) });
  const url = location.href.split("#")[0];
  const label = document.getElementById("result-share-label");
  try {
    if (navigator.share) {
      await navigator.share({ title: document.title, text, url });
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      label.textContent = t("result.copied");
      setTimeout(() => (label.textContent = t("result.share")), 1600);
    }
  } catch {
    /* share sheet dismissed by the user */
  }
}

document.getElementById("result-restart").addEventListener("click", () => {
  game.exit();
  game.start();
});
document.getElementById("result-back").addEventListener("click", () => game.exit());
document.getElementById("result-close").addEventListener("click", () => game.exit());
document.getElementById("result-share").addEventListener("click", shareResult);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && game.resultShown) game.exit();
});
