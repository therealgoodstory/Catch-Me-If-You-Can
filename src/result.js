// Экран итогов: число пройденных стран, где поймали, ранг, статистика, шеринг

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
    /* приватный режим: рекорд просто не сохранится */
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

// Контур страны для карточки «Caught in»
function setSilhouette(id) {
  const f = largestPolygonFeature(id);
  const el = document.getElementById("caught-path");
  if (!f) {
    el.setAttribute("d", "");
    return;
  }
  const p = d3.geoPath(d3.geoNaturalEarth1().fitSize([50, 50], f)).digits(1);
  el.setAttribute("d", p(f));
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

// Вписывает всю карту в окно #result-map-slot (CSS-трансформом svg)
function layoutResultMap() {
  const slot = document.getElementById("result-map-slot").getBoundingClientRect();
  const b = path.bounds({ type: "FeatureCollection", features: worldCountries.features });
  const bw = b[1][0] - b[0][0];
  const bh = b[1][1] - b[0][1];
  const s = Math.min(slot.width / bw, slot.height / bh, 1.4);
  const tx = slot.left + slot.width / 2 - (s * (b[0][0] + b[1][0])) / 2;
  const ty = slot.top + slot.height / 2 - (s * (b[0][1] + b[1][1])) / 2;
  const el = document.querySelector("#map svg");
  el.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
}

function clearResultMapLayout() {
  const el = document.querySelector("#map svg");
  if (el) el.style.transform = "";
}

function showResult(g) {
  const n = g.visited.length;
  const root = document.getElementById("result");
  root.hidden = false;

  document.getElementById("result-count-label").textContent = t("result.crossed", { n });
  countUp(document.getElementById("result-count"), n);

  // где поймали
  const caught = document.getElementById("result-caught");
  caught.classList.toggle("is-win", g.won);
  document.getElementById("caught-eyebrow").textContent = g.won
    ? t("result.untouchable")
    : `${t("result.caughtIn")} · ${iso3(g.caughtId)}`;
  document.getElementById("caught-name").textContent = countryName(g.finalId);
  document.getElementById("caught-sub").textContent = g.won
    ? t("result.win")
    : t("result.extraditedTo", { country: countryName(g.currentTarget) });
  setSilhouette(g.finalId);

  // ранг
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

  // статистика
  document.getElementById("res-world").textContent = `${Math.round((n / mapIds.size) * 100)}%`;
  const route = g.caughtId ? [...g.visited, g.caughtId] : g.visited;
  document.getElementById("res-km").textContent = fmtKm(distanceKm(route));

  const prevBest = loadBest();
  const best = Math.max(prevBest, n);
  if (n > prevBest) saveBest(n);
  document.getElementById("res-best").textContent = String(best);
  document.getElementById("res-new").hidden = !(n > prevBest);

  // карта в окно между числом и карточкой
  requestAnimationFrame(() => {
    layoutResultMap();
    document.getElementById("result-restart").focus({ preventScroll: true });
  });
}

function hideResult() {
  document.getElementById("result").hidden = true;
  clearResultMapLayout();
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
    /* пользователь закрыл окно шеринга */
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
