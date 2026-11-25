// Minimal i18n. Languages are added as new objects in I18N.
// Strings use {params} and CLDR plural keys (one/other/...) instead of concatenation.
const I18N = {
  en: {
    "play": "Play",
    "map.label": "World map of extradition treaties",
    "search.label": "Search country",
    "search.placeholder": "Search country",
    "search.clear": "Clear",
    "search.noResults": "No matches",
    "search.treaties": "treaties",
    "hover.placeholder": "Hover a country",
    "legend.selected": "Selected",
    "legend.treaty": "Treaty",
    "legend.none": "No treaty",
    "legend.you": "You",
    "legend.visited": "Visited",
    "zoom.in": "Zoom in",
    "zoom.out": "Zoom out",
    "sheet.empty.title": "Select a country",
    "sheet.empty.hint": "Tap a country to see its extradition treaties.",
    "sheet.selected": "Selected",
    "sheet.partners": "Treaty partners",
    "sheet.seeAll": "See all {n}",
    "sheet.less": "Show less",
    "sheet.source": "Source",
    "sheet.noData": "No data for this country yet.",
    "sheet.noTreaties": "No treaties found.",
    "tile.treaty": "Treaty partners",
    "tile.none": "No treaty",
    "game.exit": "Exit game",
    "game.countries": "Countries",
    "game.safeLeft": "Safe left",
    "game.prompt": "Pick a country with no treaty to {country}",
    "game.tapAgain": "Tap again to jump",
    "game.youAreIn": "You are in",
    "game.route": "Your route",
    "game.hint": "Goal: make as many jumps as you can without being extradited. Every country you jump to becomes your new location, and any country with an extradition treaty to it can hand you over.\nYou can enter each country only once.",
    "game.hintTouch": "Goal: make as many jumps as you can without being extradited. Every country you jump to becomes your new location, and any country with an extradition treaty to it can hand you over.\nYou can enter each country only once.",
    "result.close": "Close results",
    "result.map": "Route map",
    "result.crossed": { one: "country crossed", other: "countries crossed" },
    "result.caughtIn": "Caught in",
    "result.extraditedTo": "Extradited to {country}",
    "result.untouchable": "Untouchable",
    "result.win": "No safe moves left. You escaped every trap.",
    "result.rank": "Rank",
    "result.toNext": "{n} more to {rank}",
    "result.maxRank": "Top rank reached",
    "result.world": "World covered",
    "result.km": "km fled",
    "result.best": "Personal best",
    "result.new": "NEW",
    "result.playAgain": "Play again",
    "result.share": "Share",
    "result.copied": "Copied",
    "result.back": "Back to map",
    "share.caught": "I crossed {n} countries before getting caught in {country}. Can you do better?",
    "share.win": "I escaped every extradition trap and crossed {n} countries. Can you do better?",
    "rank.rookie": "Rookie",
    "rank.runner": "Runner",
    "rank.phantom": "Phantom",
    "rank.legend": "Legend",

    "menu.open": "Menu",
    "menu.close": "Close menu",
    "menu.about": "About and data",
    "menu.language": "Language",
    "about.title": "About",
    "about.mapTitle": "The map",
    "about.mapText":
      "Shows which countries have an extradition treaty with each other. Pick a country and arcs connect it to every country it has a treaty with.",
    "about.gameTitle": "The game",
    "about.gameText":
      "You start in a random country. Jump to any country that has no treaty with the one you are in. Jump to one that does and you are caught. Each safe jump changes where you are, and you cannot return to a country you have visited. The longer your route, the better.",
    "about.dataTitle": "About the data",
    "about.data":
      "Made by one person. The treaty data was researched with the help of an LLM, so it may be incomplete or out of date: please verify anything important against official sources.",
    "about.legal": "For information and entertainment only, not legal advice.",
    "about.github": "GitHub",
    "about.coffee": "Buy me a coffee",
    "about.close": "Close",
  },
};

let currentLang = "en";

function t(key, params = {}) {
  let v = (I18N[currentLang] || I18N.en)[key] ?? I18N.en[key] ?? key;
  if (typeof v === "object") {
    const rule = new Intl.PluralRules(currentLang).select(params.n ?? 0);
    v = v[rule] ?? v.other;
  }
  return v.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? `{${k}}`));
}

// Country name by numeric id. English comes from data/countries.js; other languages from Intl.DisplayNames
// (CLDR), falling back to English when the browser has no name for the region.
let nameCache = new Map();
let regionNames = null;

function langLocale() {
  return (typeof LANGS !== "undefined" && LANGS.find((l) => l.code === currentLang)?.locale) || currentLang;
}

function countryName(id) {
  const en = countries[id] || String(id);
  if (currentLang === "en") return en;
  if (nameCache.has(id)) return nameCache.get(id);
  let name = en;
  try {
    regionNames ||= new Intl.DisplayNames([langLocale()], { type: "region" });
    const code = iso2(id);
    const local = code && regionNames.of(code);
    if (local && local !== code) name = local;
  } catch {
    /* Intl.DisplayNames unavailable: keep English */
  }
  nameCache.set(id, name);
  return name;
}

// Switches the UI language and refreshes everything that is visible in explore mode.
// (The menu is not reachable during a game or on the result screen, so those are not re-rendered.)
function setLang(code) {
  if (!I18N[code] || code === currentLang) return;
  currentLang = code;
  nameCache = new Map();
  regionNames = null;
  try {
    localStorage.setItem(STORAGE_LANG, code);
  } catch {
    /* storage unavailable: the choice just is not remembered */
  }
  applyI18n();
  document.querySelector("#map")?.setAttribute("aria-label", t("map.label"));
  document.querySelector("#map svg")?.setAttribute("aria-label", t("map.label"));
  buildSearchIndex();
  renderCapsule();
  renderSheet();
  setHoverName(null);
  renderLangMenu();
}

// Applies translations to the markup:
//   data-i18n="key"                                  -> textContent
//   data-i18n-attr="placeholder:key;aria-label:key2" -> attributes
function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(";").forEach((pair) => {
      const [attr, key] = pair.split(":");
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
  document.documentElement.lang = currentLang;
}
