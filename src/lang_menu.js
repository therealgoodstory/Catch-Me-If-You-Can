// Language item of the burger menu: opens the second plate with the list of languages
// (same pattern as "About and data"). Flags come from flag-icons, like the result screen.
const langEl = document.getElementById("lang-plate");
const langBtn = document.getElementById("menu-lang");
const langList = document.getElementById("lang-list");

function isLangOpen() {
  return langEl.classList.contains("is-open");
}

function setLangPlate(open, { refocus = false } = {}) {
  if (open) setAbout(false); // one second plate at a time
  langEl.classList.toggle("is-open", open);
  langEl.inert = !open;
  langEl.setAttribute("aria-hidden", String(!open));
  langBtn.setAttribute("aria-expanded", String(open));
  if (open) document.getElementById("lang-close").focus();
  else if (refocus) langBtn.focus();
}

function renderLangMenu() {
  const cur = LANGS.find((l) => l.code === currentLang) || LANGS[0];
  document.getElementById("lang-current-flag").className = `fi fi-${cur.flag}`;
  document.getElementById("lang-current-name").textContent = cur.label;

  langList.replaceChildren();
  LANGS.forEach((l) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "menu-item";
    b.lang = l.locale;
    b.setAttribute("role", "option");
    b.setAttribute("aria-selected", String(l.code === currentLang));
    const flag = document.createElement("span");
    flag.className = `fi fi-${l.flag}`;
    flag.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.textContent = l.label;
    b.append(flag, name);
    b.addEventListener("click", () => {
      setLang(l.code);
      setLangPlate(false, { refocus: true });
    });
    li.append(b);
    langList.append(li);
  });
}

langBtn.addEventListener("click", () => setLangPlate(!isLangOpen()));
document.getElementById("lang-close").addEventListener("click", () => setLangPlate(false, { refocus: true }));

renderLangMenu();
