// Цвета и размеры живут в styles/tokens.css. Здесь только настройки логики.
const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const MOBILE_BP = 768; // px: ниже этой ширины интерфейс телефонный

const GAME = {
  showDanger: false, // true: подсвечивать страны с договором (игра становится проще)
};

// Ранги по числу пройденных стран
const RANKS = [
  { key: "rookie", min: 0 },
  { key: "runner", min: 10 },
  { key: "phantom", min: 20 },
  { key: "legend", min: 30 },
];

const STORAGE_BEST = "cmic.best.v1";
