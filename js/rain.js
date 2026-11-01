// Quiet black-and-white rain with an occasional lightning strike.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var cv = document.createElement('canvas');
  cv.id = 'rain';
  cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext('2d');

  var W, H, dpr, drops = [], bolt = null, flash = 0, nextStrike;
  var SLANT = 0.18; // wind: horizontal px per vertical px

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(160, Math.max(60, W * H / 7000)));
    drops = [];
    for (var i = 0; i < n; i++) drops.push(make(true));
  }

  function make(anywhere) {
    var z = Math.random();               // depth: 0 far, 1 near
    return {
      x: Math.random() * (W + 120) - 60,
      y: anywhere ? Math.random() * H : -40,
      len: 8 + z * 22,
      v: 380 + z * 620,                  // px per second
      a: 0.08 + z * 0.3,
      w: 0.5 + z * 0.9
    };
  }

  function strike() {
    // jagged bolt from the top toward the middle of the screen
    var x = W * (0.15 + Math.random() * 0.7), y = -10, pts = [[x, y]];
    var endY = H * (0.35 + Math.random() * 0.3);
    var branches = [];
    while (y < endY) {
      y += 18 + Math.random() * 34;
      x += (Math.random() - 0.5) * 60;
      pts.push([x, y]);
      if (Math.random() < 0.18) {
        var bx = x, by = y, b = [[bx, by]], n = 3 + Math.floor(Math.random() * 4);
        var dir = Math.random() < 0.5 ? -1 : 1;
        for (var i = 0; i < n; i++) { bx += dir * (8 + Math.random() * 22); by += 10 + Math.random() * 22; b.push([bx, by]); }
        branches.push(b);
      }
    }
    bolt = { pts: pts, branches: branches, life: 1 };
    flash = 1;
    setTimeout(function () { flash = Math.max(flash, 0.7); }, 110); // double flash
  }

  function path(p) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (var i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.stroke();
  }

  var last = performance.now();
  nextStrike = last + 5000 + Math.random() * 5000;

  function frame(t) {
    var dt = Math.min(0.05, (t - last) / 1000); last = t;
    ctx.clearRect(0, 0, W, H);

    // sky flash
    if (flash > 0.01) {
      ctx.fillStyle = 'rgba(255,255,255,' + (flash * 0.1).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
      flash *= Math.pow(0.0008, dt);
    }

    // bolt with soft glow
    if (bolt) {
      var al = bolt.life;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,' + (al * 0.25).toFixed(3) + ')';
      ctx.lineWidth = 7; path(bolt.pts);
      ctx.strokeStyle = 'rgba(255,255,255,' + (al * 0.95).toFixed(3) + ')';
      ctx.lineWidth = 1.8; path(bolt.pts);
      ctx.lineWidth = 1;
      bolt.branches.forEach(function (b) { ctx.strokeStyle = 'rgba(255,255,255,' + (al * 0.6).toFixed(3) + ')'; path(b); });
      bolt.life -= dt * 2.6;
      if (bolt.life <= 0) bolt = null;
    }

    // rain
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y += d.v * dt; d.x += d.v * SLANT * dt;
      if (d.y - d.len > H || d.x > W + 80) { drops[i] = make(false); continue; }
      ctx.strokeStyle = 'rgba(255,255,255,' + d.a.toFixed(3) + ')';
      ctx.lineWidth = d.w;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * SLANT, d.y - d.len);
      ctx.stroke();
    }

    if (t > nextStrike && !document.hidden) {
      strike();
      nextStrike = t + 7000 + Math.random() * 9000;
    }
    raf = requestAnimationFrame(frame);
  }

  var raf;
  function start() { last = performance.now(); raf = requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(raf); else start();
  });
  window.addEventListener('resize', resize);
  resize(); start();
})();
