// Burger menu: a drawer from the left. Closes on its cross, Escape, or when the map is used.
const menuBtn = document.getElementById("menu-btn");
const drawerEl = document.getElementById("drawer");
const drawerClose = document.getElementById("drawer-close");

function isDrawerOpen() {
  return drawerEl.classList.contains("is-open");
}

function setDrawer(open, { refocus = false } = {}) {
  drawerEl.classList.toggle("is-open", open);
  drawerEl.inert = !open;
  drawerEl.setAttribute("aria-hidden", String(!open));
  if (!open) {
    // the second plates never outlive the drawer
    setAbout(false);
    setLangPlate(false);
  }
  menuBtn.setAttribute("aria-expanded", String(open));
  if (open) drawerClose.focus();
  else if (refocus) menuBtn.focus();
}

menuBtn.addEventListener("click", () => setDrawer(!isDrawerOpen()));
drawerClose.addEventListener("click", () => setDrawer(false, { refocus: true }));

// Focus moves to the map (or anywhere outside the drawer): close it
document.addEventListener("pointerdown", (e) => {
  const outside = !drawerEl.contains(e.target) && !aboutEl.contains(e.target) && !langEl.contains(e.target) && !menuBtn.contains(e.target);
  if (isDrawerOpen() && outside) setDrawer(false);
});
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (isAboutOpen()) setAbout(false, { refocus: true }); // top layer first
  else if (isLangOpen()) setLangPlate(false, { refocus: true });
  else if (isDrawerOpen()) setDrawer(false, { refocus: true });
});

// First item: the info and data notice (the old "i" button) opens the second plate
document.getElementById("menu-about").addEventListener("click", () => setAbout(!isAboutOpen()));
