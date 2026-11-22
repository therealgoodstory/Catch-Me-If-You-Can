// Единственное место, где решается, как раскрашена карта.
// Цвета задаются классами в styles/map.css, а не в JS.
function paintMap(hoverId = null) {
  if (!group) return;

  const sel = state.selectedId;
  const inGame = game.active || game.resultShown;

  const related = new Set(!inGame && sel ? extradition[sel]?.treaties || [] : []);
  const visited = new Set(inGame ? game.visited : []);
  const current = game.active ? game.currentTarget : null;
  const danger = new Set(
    game.active && GAME.showDanger ? extradition[game.currentTarget]?.treaties || [] : [],
  );

  group.selectAll(".country").each(function (d) {
    const id = d.id;
    const c = this.classList;
    c.toggle("is-selected", !inGame && id === sel);
    c.toggle("is-partner", !inGame && related.has(id));
    c.toggle("is-current", game.active && id === current);
    c.toggle("is-caught", game.resultShown && id === game.finalId);
    c.toggle("is-visited", inGame && visited.has(id) && id !== current);
    c.toggle("is-danger", danger.has(id));
    c.toggle("is-hover", hoverId !== null && id === hoverId);
  });

  // Подсвеченные страны поднимаем над соседями, иначе их обводку перекрывают чужие заливки.
  // Порядок меняем только когда набор подсвеченных изменился (не на каждый hover).
  const key = [sel, current, game.finalId, inGame, [...related, ...visited].join()].join("|");
  if (key !== paintMap.lastKey) {
    paintMap.lastKey = key;
    group.selectAll(".country.is-partner, .country.is-danger, .country.is-visited").raise();
    group.selectAll(".country.is-selected, .country.is-current, .country.is-caught").raise();
    overlay.raise();
  }
}
