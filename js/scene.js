// Rain gauge that slowly fills, shows a reading, then empties. Also honors reduced motion.
(function () {
  var waters = document.querySelectorAll('.gwater');
  var txts = document.querySelectorAll('.gtext');
  if (!waters.length) return;

  var MAXH = 44, MAXMM = 25;
  function set(p) {
    var h = MAXH * p;
    var label = (MAXMM * p).toFixed(1) + ' mm';
    waters.forEach(function (w) { w.setAttribute('height', h.toFixed(2)); w.setAttribute('y', (-1 - h).toFixed(2)); });
    txts.forEach(function (t) { t.textContent = label; });
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    set(0.45);
    document.querySelectorAll('animateMotion, animate').forEach(function (n) { n.remove(); });
    var sat = document.getElementById('sat');
    if (sat) sat.setAttribute('transform', 'translate(200 20)');
    return;
  }

  function ease(x) { return 1 - Math.pow(1 - x, 2); }
  var T = 22000, t0 = performance.now(), raf;

  function frame(t) {
    var k = ((t - t0) % T) / T, p;
    if (k < 0.76) {
      var u = k / 0.76;                                   // steady rise with small rain bursts
      p = 0.9 * (u - 0.35 * Math.sin(u * 6 * Math.PI) / (6 * Math.PI));
    } else if (k < 0.92) {
      p = 0.9;                                            // hold the reading
    } else {
      p = 0.9 * (1 - ease((k - 0.92) / 0.08));            // empty and start again
    }
    set(Math.max(0, p));
    raf = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(raf);
    else { t0 = performance.now(); raf = requestAnimationFrame(frame); }
  });
  raf = requestAnimationFrame(frame);
})();
