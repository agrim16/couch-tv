(function () {
  var KEY = 'tvhome.who', last;
  function tick() {
    fetch('/api/who', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.who) return;
        if (last !== undefined && j.who === last) return;
        last = j.who;
        var cur = null;
        try { cur = localStorage.getItem(KEY); } catch (e) {}
        if (cur === j.who) return;
        try { localStorage.setItem(KEY, j.who); } catch (e) { return; }
        location.reload();
      })
      .catch(function () {});
  }
  setInterval(tick, 2500);
  tick();
})();
