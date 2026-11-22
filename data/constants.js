const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const MOBILE_BP = 768;

const GAME = {
  showDanger: false, // true highlights treaty partners of the current country (makes the game easier)
};

const RANKS = [
  { key: "rookie", min: 0 },
  { key: "runner", min: 10 },
  { key: "phantom", min: 20 },
  { key: "legend", min: 30 },
];

const STORAGE_BEST = "cmic.best.v1";

// A link button in the About dialog is shown only when its URL is non-empty.
const LINKS = {
  github: "https://github.com/therealgoodstory/Catch-Me-If-You-Can",
  coffee: "", // paste your Buy Me a Coffee URL here
};
