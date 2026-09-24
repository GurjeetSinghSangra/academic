(function () {
  "use strict";

  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function isDark() {
    return root.dataset.theme ? root.dataset.theme === "dark" : media.matches;
  }

  // Theme toggle ------------------------------------------------------------
  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  });

  // Mobile nav --------------------------------------------------------------
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      links.classList.toggle("open", open);
    }
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // Copy BibTeX -------------------------------------------------------------
  document.querySelectorAll(".bibtex .copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.parentElement.querySelector("code").textContent;
      var done = function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1500);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(done, function () { btn.textContent = "Select & copy"; });
      }
    });
  });

  // Hero flow field: particles advected by the time-periodic double gyre ----
  //   psi(x, y, t) = A sin(pi f(x, t)) sin(pi y),  f = eps sin(wt) x^2 + (1 - 2 eps sin(wt)) x
  var canvas = document.querySelector(".flow");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var A = 0.1, EPS = 0.25, OMEGA = (2 * Math.PI) / 10;
  var W = 0, H = 0, dpr = 1, particles = [], t = 0, running = false, visible = true, raf = 0;

  function velocity(x, y, time) {
    var s = EPS * Math.sin(OMEGA * time);
    var f = s * x * x + (1 - 2 * s) * x;
    var dfdx = 2 * s * x + 1 - 2 * s;
    var PI = Math.PI;
    return [
      -PI * A * Math.sin(PI * f) * Math.cos(PI * y),
      PI * A * Math.cos(PI * f) * Math.sin(PI * y) * dfdx
    ];
  }

  function spawn(p) {
    p.x = Math.random() * 2;
    p.y = Math.random();
    p.life = 80 + Math.random() * 220;
    return p;
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.min(900, Math.round((W * H) / 900));
    particles = [];
    for (var i = 0; i < n; i++) particles.push(spawn({}));
  }

  function color() {
    var rgb = getComputedStyle(root).getPropertyValue("--flow").trim() || "15, 118, 110";
    return "rgba(" + rgb + ", " + (isDark() ? 0.55 : 0.45) + ")";
  }

  function step(fade) {
    if (fade) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.strokeStyle = color();
    ctx.lineWidth = 1;
    ctx.beginPath();
    var dt = 0.02, h = 0.012, sx = W / 2, sy = H;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var v = velocity(p.x, p.y, t);
      var nx = p.x + v[0] * h, ny = p.y + v[1] * h;
      ctx.moveTo(p.x * sx, p.y * sy);
      ctx.lineTo(nx * sx, ny * sy);
      p.x = nx; p.y = ny;
      if (--p.life < 0 || nx < 0 || nx > 2 || ny < 0 || ny > 1) spawn(p);
    }
    ctx.stroke();
    t += dt;
  }

  function loop() {
    if (!running) return;
    step(true);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduced || !visible || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < 60; i++) step(false);
  }

  resize();
  if (reduced) drawStatic();

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var w = canvas.getBoundingClientRect().width;
      if (Math.abs(w - W) < 1) return; // ignore mobile URL-bar height changes
      resize();
      if (reduced) drawStatic();
    }, 150);
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : start();
  });
  start();
})();
