// Минимальный i18n-каркас. Языки добавляются как новые объекты в I18N.
// Не склеивай строки в коде: используй {параметры}, порядок слов в языках разный.
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
    "game.hint": "Click any country to jump there. A country with a treaty to {country} ends the game.",
    "game.hintTouch": "Tap a country, then tap it again to confirm the jump.",
    "result.close": "Close results",
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

// Названия стран: сейчас английские из data/countries.js.
// Позже здесь подключается Intl.DisplayNames по ISO alpha-2 (см. iso2()).
function countryName(id) {
  return countries[id] || String(id);
}

// Применяет переводы к разметке:
//   data-i18n="key"                         -> textContent
//   data-i18n-attr="placeholder:key;aria-label:key2" -> атрибуты
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
