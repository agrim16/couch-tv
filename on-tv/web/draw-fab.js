(function () {
  'use strict';
  if (window.__ctvDraw) return; window.__ctvDraw = 1;
  function mount() {
    var css = document.createElement('style');
    css.textContent = '#ctvd-b{position:fixed;right:14px;bottom:96px;z-index:99990;padding:12px 18px;border:0;border-radius:24px;background:#ffb52e;color:#111;font:600 16px system-ui,sans-serif;box-shadow:0 2px 10px #0008}' +
      '#ctvd-p{position:fixed;inset:0;z-index:99991;background:#0b0b0d;color:#f2ead8;display:none;flex-direction:column;padding:12px;box-sizing:border-box;font:16px system-ui,sans-serif}' +
      '#ctvd-p canvas{width:100%;aspect-ratio:16/9;background:#14141a;border-radius:14px;touch-action:none;display:block}' +
      '#ctvd-p .r{display:flex;gap:10px;margin-top:12px}#ctvd-p button{flex:1;padding:14px;border:0;border-radius:12px;font-size:17px;font-weight:600;background:#222228;color:#f2ead8}' +
      '#ctvd-p button.g{background:#ffb52e;color:#111}#ctvd-m{min-height:22px;margin-top:10px;color:#bdb6a7}';
    document.head.appendChild(css);
    var b = document.createElement('button'); b.id = 'ctvd-b'; b.textContent = 'Draw';
    var p = document.createElement('div'); p.id = 'ctvd-p';
    p.innerHTML = '<canvas></canvas><div class="r"><button class="u">Undo</button><button class="c">Clear</button><button class="h g">Hide on TV</button></div><div class="r"><button class="x">Close</button></div><div id="ctvd-m"></div>';
    document.body.appendChild(b); document.body.appendChild(p);
    var cv = p.querySelector('canvas'), x = cv.getContext('2d'), msg = p.querySelector('#ctvd-m');
    var strokes = [], cur = null;
    function size() { var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); redraw(); }
    function redraw() {
      x.clearRect(0, 0, cv.width, cv.height); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#fff5e1'; x.lineWidth = cv.height * 0.012;
      strokes.forEach(function (s) {
        x.beginPath();
        s.forEach(function (q, i) { var px = q[0] * cv.width, py = q[1] * cv.height; if (i) x.lineTo(px, py); else x.moveTo(px, py); });
        if (s.length == 1) x.lineTo(s[0][0] * cv.width + 0.1, s[0][1] * cv.height);
        x.stroke();
      });
    }
    function pt(e) { var r = cv.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; }
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); cur = [pt(e)]; strokes.push(cur); redraw(); e.preventDefault(); });
    cv.addEventListener('pointermove', function (e) { if (!cur) return; var q = pt(e), l = cur[cur.length - 1]; if (Math.abs(q[0] - l[0]) + Math.abs(q[1] - l[1]) < 0.004) return; cur.push(q); redraw(); e.preventDefault(); });
    function end() { if (!cur) return; cur = null; send(); }
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    function call(path, body) {
      fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { msg.textContent = r.ok ? '' : (j.error || j.message || ('Error ' + r.status)); }); })
        .catch(function () { msg.textContent = 'Cannot reach the TV.'; });
    }
    function send() { call('/api/draw', { strokes: strokes }); }
    p.querySelector('.u').onclick = function () { strokes.pop(); redraw(); if (strokes.length) send(); else call('/api/draw/clear'); };
    p.querySelector('.c').onclick = function () { strokes = []; redraw(); call('/api/draw/clear'); };
    p.querySelector('.h').onclick = function () { call('/api/draw/clear'); };
    p.querySelector('.x').onclick = function () { p.style.display = 'none'; };
    b.onclick = function () { p.style.display = 'flex'; size(); };
    window.addEventListener('resize', size);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
