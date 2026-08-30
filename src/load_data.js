async function loadExtraditionData() {
  const res = await fetch("./data/extradition.json");
  return res.json();
}
