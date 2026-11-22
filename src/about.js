// Info dialog with the data disclaimer. Closes on the button, the backdrop or Escape.
const aboutEl = document.getElementById("about");
const aboutBtn = document.getElementById("about-btn");

["github", "coffee"].forEach((key) => {
  const a = document.getElementById(`link-${key}`);
  if (LINKS[key]) {
    a.href = LINKS[key];
    a.hidden = false;
  }
});

function openAbout() {
  aboutEl.hidden = false;
  document.getElementById("about-close").focus();
}

function closeAbout() {
  aboutEl.hidden = true;
  aboutBtn.focus();
}

aboutBtn.addEventListener("click", openAbout);
document.getElementById("about-close").addEventListener("click", closeAbout);
document.getElementById("about-scrim").addEventListener("click", closeAbout);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !aboutEl.hidden) closeAbout();
});
