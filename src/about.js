// "About and data": a second plate that slides out from under the menu drawer.
// Its own cross closes only this plate; the drawer stays open.
const aboutEl = document.getElementById("about");

["github", "coffee"].forEach((key) => {
  const a = document.getElementById(`link-${key}`);
  if (LINKS[key]) {
    a.href = LINKS[key];
    a.hidden = false;
  }
});

function isAboutOpen() {
  return aboutEl.classList.contains("is-open");
}

function setAbout(open, { refocus = false } = {}) {
  aboutEl.classList.toggle("is-open", open);
  aboutEl.inert = !open;
  aboutEl.setAttribute("aria-hidden", String(!open));
  document.getElementById("menu-about").setAttribute("aria-expanded", String(open));
  if (open) document.getElementById("about-close").focus();
  else if (refocus) document.getElementById("menu-about").focus();
}

document.getElementById("about-close").addEventListener("click", () => setAbout(false, { refocus: true }));
