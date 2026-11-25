// Country name tooltip above the cursor. Used on hover (desktop) and on tap (result map).
const mapTip = (() => {
  const el = document.getElementById("map-tip");
  const isoEl = document.getElementById("map-tip-iso");
  const nameEl = document.getElementById("map-tip-name");
  const GAP = 16; // between the cursor and the tooltip
  let w = 0;
  let h = 0;

  function place(event) {
    // Centered above the cursor; below it when there is no room at the top of the screen
    let y = event.clientY - GAP - h;
    if (y < 8) y = event.clientY + GAP + 8;
    const x = Math.max(8, Math.min(event.clientX - w / 2, window.innerWidth - w - 8));
    el.style.transform = `translate(${x}px, ${Math.min(y, window.innerHeight - h - 8)}px)`;
  }

  // Pressing the mouse (start of a map drag) removes the tip; it comes back on the next hover
  document.addEventListener("mousedown", () => (el.hidden = true), true);

  return {
    show(id, event) {
      if (event.buttons) return; // hover only: nothing while a mouse button is held
      isoEl.textContent = iso3(id);
      nameEl.textContent = countryName(id);
      el.hidden = false;
      // Size is measured once per country, not on every mouse move
      w = el.offsetWidth;
      h = el.offsetHeight;
      place(event);
    },
    move(event) {
      if (event.buttons) return el.hidden || (el.hidden = true);
      if (!el.hidden) place(event);
    },
    visible() {
      return !el.hidden;
    },
    hide() {
      el.hidden = true;
    },
  };
})();
