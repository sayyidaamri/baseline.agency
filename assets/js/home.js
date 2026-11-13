/* Datum Studio — home page choreography (vanilla, scroll-driven). */
(() => {
  "use strict";
  const D = window.Datum, { $, $$, clamp, lerp, reduced } = D;
  const desk = matchMedia("(min-width: 768px)");
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const table = (x, pts) => { // piecewise-linear lookup
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * ((x - x0) / (x1 - x0)); }
    return pts[pts.length - 1][1];
  };
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);

  /* ================================================================= showreel canvas */
  function reel(cv) {
    const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
    const S = Math.min(W, H);
    const scenes = [
      (t) => { // grid + square
        ctx.fillStyle = "#fdfdfd"; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 2;
        const g = S * 0.22, cx = W / 2, cy = H / 2, o = (t * 60) % g;
        for (let x = cx % g - g + o; x < W; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = cy % g; y < H; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        const s = g * (0.9 + 0.12 * Math.sin(t * 5));
        ctx.fillStyle = "#000"; ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
      },
      (t) => { // starburst
        ctx.fillStyle = "#fdfdfd"; ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;
        ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + t * 0.4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * S * .2, cy + Math.sin(a) * S * .2); ctx.lineTo(cx + Math.cos(a) * W, cy + Math.sin(a) * W); ctx.stroke(); }
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 1.4); ctx.fillStyle = "#000"; ctx.beginPath();
        const n = 9, r1 = S * 0.17, r2 = S * 0.13 * (1 + 0.08 * Math.sin(t * 7));
        for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = i * Math.PI / n; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill(); ctx.restore();
      },
      (t) => { // showreel card
        ctx.fillStyle = "#fdfdfd"; ctx.fillRect(0, 0, W, H);
        const w = S * 0.66, h = S * 0.66, x = (W - w) / 2, y = (H - h) / 2;
        ctx.fillStyle = "#050505"; ctx.fillRect(x, y, w, h);
        const g = ctx.createRadialGradient(x + w * .45, y + h * .5, 4, x + w * .45, y + h * .5, w * .35);
        g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.5, "rgba(170,170,170,.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save(); ctx.translate(x + w * .48, y + h * .52); ctx.rotate(Math.sin(t * 2) * .4); ctx.scale(1, 1.25); ctx.translate(-(x + w * .48), -(y + h * .52));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + w * .48, y + h * .52, w * .3, 0, 7); ctx.fill(); ctx.restore();
        ctx.fillStyle = "#fff"; ctx.font = `700 ${h * .14}px Inter, Arial`; ctx.textBaseline = "top";
        ctx.fillText("SHOW", x + w * .04, y + h * .03); ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText("REEL", x + w * .96, y + h * .97); ctx.textAlign = "left";
        ctx.fillStyle = "#111"; ctx.font = `600 ${S * .035}px Inter, Arial`; ctx.textBaseline = "middle";
        ctx.fillText("Datum", x - S * .2, H / 2); ctx.fillText("Studio", x + w + S * .08, H / 2);
        ctx.strokeStyle = "#111"; ctx.lineWidth = 2; for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { ctx.strokeRect(px - 4, py - 4, 8, 8); }
      },
      (t) => { // dot helix
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        const n = 11, cx = W / 2;
        for (let i = 0; i < n; i++) {
          const y = H * (0.07 + i * 0.086), a = t * 2.2 + i * 0.55;
          const x1 = cx + Math.sin(a) * S * .2, x2 = cx - Math.sin(a) * S * .2;
          ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(x1, y, 4 + 7 * (1 + Math.cos(a)) / 2, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(x2, y, 4 + 7 * (1 - Math.cos(a)) / 2, 0, 7); ctx.fill();
        }
        ctx.font = `500 ${S * .035}px Inter, Arial`; ctx.textBaseline = "middle"; ctx.fillText("Made_by", W * .09, H / 2); ctx.textAlign = "right"; ctx.fillText("Humans", W * .91, H / 2); ctx.textAlign = "left";
      },
      (t) => { // chromatic orbs
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2, sp = S * .14 * (1 + .25 * Math.sin(t * 3));
        ctx.globalCompositeOperation = "lighter";
        for (const [c, dx] of [["#ff2a2a", -3], ["#2aff7a", 0], ["#2a6bff", 3]]) {
          ctx.strokeStyle = c; ctx.lineWidth = S * .02;
          for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.arc(cx + k * sp + dx, cy, S * (k ? .11 : .07), 0, 7); ctx.stroke(); }
        }
        ctx.globalCompositeOperation = "source-over";
      },
      (t) => { // half moons
        ctx.fillStyle = "#fdfdfd"; ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2, r = S * .2;
        ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1.5; ctx.strokeRect(cx - r * 1.1, cy - r * 1.4, r * 2.2, r * 2.8); ctx.strokeRect(cx - r * 1.5, cy - r * .9, r * 3, r * 1.8);
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(cx, cy, r * (0.75 + .05 * Math.sin(t * 4)), 0, 7); ctx.fill();
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.arc(cx + s * r * 1.15, cy, r * .55, Math.PI / 2, Math.PI * 1.5, s > 0); ctx.fill();
          ctx.beginPath(); ctx.arc(cx, cy + s * r * 1.1, r * .55, 0, Math.PI, s < 0); ctx.fill();
        }
      },
    ];
    let start = performance.now(), vis = true;
    new IntersectionObserver(([e]) => (vis = e.isIntersecting)).observe(cv);
    const loop = (now) => {
      if (vis) { const t = Math.max(0, now - start) / 1000, i = Math.floor(t / 1.7) % scenes.length; scenes[i](t % 1.7); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  $$("canvas.reel").forEach(reel);

  /* ================================================================= desktop scene */
  const scene = $("#scene"), hx = $("#hx"), col = $("#col"), stage = scene && $(".scene__stage", scene);
  const card = $("#card"), cardIn = card && $(".card__in", card);
  const paras = hx && $(".hx__paras", hx), schedule = hx && $(".hx__btns .scr__live", hx);
  const leftA = $(".li__a"), leftB = $(".li__b");
  const wordsA = $$(".li__a .sw"), wordsB = $$(".li__b .sw");
  const stc = $(".stc"), cases = $$(".sc-case"), rArts = $$(".rc");
  const anchors = {};
  let M = null; // metrics

  function measure() {
    if (!scene || !desk.matches) { M = null; return; }
    const W = innerWidth, H = innerHeight, r = rem(), s = r / 16, k = H / 900;
    const vx0 = W * 0.555, vx1 = W * (419 / 1440);
    const shotH0 = (0.445 * W - 46 * s) * 672 / 1242;
    const hy0 = H - clamp(shotH0 + 40 * s + 1, 0.28 * H, 0.55 * H);
    const hy1 = 9.555 * r;
    const pad = 23 * s;
    const cw = W - vx1 - 2 * pad;
    col.style.setProperty("--cw", cw + "px");
    scene.style.setProperty("--cw", cw + "px");
    // natural offsets inside the column (unscaled)
    const off = (el) => { let y = 0; while (el && el !== col) { y += el.offsetTop; el = el.offsetParent; } return y; };
    anchors.stmt = off($(".stmt", col)); anchors.clients = off($(".clients", col)); anchors.reset = off($(".reset", col));
    anchors.lead = off($(".proof-lead", col)); anchors.arts = rArts.map((a) => [off(a), a.offsetHeight]);
    const colH = col.offsetHeight;
    const P1 = 465 * k;                       // column starts to travel
    const rate = 1.25;
    // zoom starts when the column's bottom is ~0.75H below the fold
    const zs = P1 + (colH + hy1 + 19 * s - H - 0.75 * H) / rate;
    const zl = 1000 * k, ze = zs + zl;
    const sceneH = ze + 2 * H;
    scene.style.setProperty("--scene-h", sceneH + "px");
    // paragraph block height for collapsing
    paras.style.removeProperty("--ph"); const ph = paras.scrollHeight;
    M = { W, H, s, k, vx0, vx1, hy0, hy1, pad, cw, P1, rate, zs, zl, ze, ph, sceneTop: scene.offsetTop };
  }

  function sceneTick() {
    if (!M) return;
    const { W, H, s, k, vx0, vx1, hy0, hy1, pad, cw, P1, rate, zs, zl, ze, ph } = M;
    const y = scrollY - M.sceneTop;
    // phase 1: grid moves to the compact layout
    let vx = lerp(vx0, vx1, clamp(y / (430 * k)));
    let hy = lerp(hy0, hy1, table(y / k, [[0, 0], [400, .49], [500, .66], [600, .85], [700, 1]]));
    const bg = table(y / k, [[0, 205], [100, 204], [200, 196], [300, 160], [350, 122], [400, 64], [450, 30], [500, 19]]);
    // phase 3: zoom-out of the grid
    const p3 = ease(clamp((y - zs) / zl));
    let colX = vx + pad, colS = (W - vx - 2 * pad) / cw;
    if (p3 > 0) { vx = lerp(vx1, 0, p3); hy = lerp(hy1, 0, p3); colX = lerp(vx1 + pad, 24 * s, p3); colS = lerp(1, 1.42, p3); }
    const travel = Math.max(0, y - P1) * rate;
    const colY = hy + 19 * s - travel * (p3 > 0 ? lerp(1, 1.05, p3) : 1);
    col.style.transform = `translate3d(${colX}px,${colY}px,0) scale(${colS})`;
    for (const el of [hx, scene]) { el.style.setProperty("--vx", vx + "px"); el.style.setProperty("--hy", hy + "px"); }
    stage.style.setProperty("--bg", `${bg},${bg},${bg}`);
    document.body.style.backgroundColor = y < 520 * k ? "" : "#131313";
    hx.style.setProperty("--h1o", clamp(1 - y / (250 * k)));
    hx.style.setProperty("--sto", clamp(1 - y / (330 * k)));
    const pc = ease(clamp(y / (350 * k)));
    paras.style.setProperty("--ph", (1 - pc) * ph + "px"); paras.style.opacity = clamp(1 - pc * 1.6);
    const short = y > 260 * k;
    if (schedule && schedule.dataset.state !== String(short)) { schedule.dataset.state = String(short); D.scramble(schedule, short ? schedule.dataset.short : schedule.dataset.long, { duration: 500 }); schedule.previousElementSibling.textContent = short ? schedule.dataset.short : schedule.dataset.long; }
    hx.classList.toggle("is-gone", y > ze + 40);

    // column-relative positions → viewport y
    const vy = (o) => colY + o * colS;
    $(".stmt", col).style.setProperty("--rv", clamp((H - vy(anchors.stmt)) / (0.8 * H)).toFixed(3));
    // left intro words / familiar words
    const pa = clamp((H - vy(anchors.clients)) / H);
    const pb = clamp((0.75 * H - vy(anchors.lead)) / (0.75 * H));
    reveal(wordsA, pa * 1.15);
    reveal(wordsB, pb * 1.1);
    leftA.style.opacity = pb > 0.02 ? 0 : 1;
    leftB.style.opacity = pb > 0.02 ? 1 : 0;
    // cases on the left + progress
    let active = -1;
    anchors.arts.forEach(([o], i) => { if (vy(o) < 0.95 * H) active = i; });
    cases.forEach((c, i) => {
      c.classList.toggle("is-on", i === active && p3 < 0.6);
      if (i === active) { const [o, h] = anchors.arts[i]; const pr = clamp((0.95 * H - vy(o)) / (h * colS + 0.2 * H)); $(".sc-case__bar i", c).style.transform = `scaleX(${pr})`; }
    });
    stc.classList.toggle("is-on", y > 450 * k && active < 0);

    // card zoom in
    if (cardIn) {
      const pcard = clamp((y - ze) / (900 * k));
      cardIn.style.transform = pcard < 1 ? `scale(${lerp(0.5, 1, easeOut(pcard))})` : "none";
      aboutWords(pcard);
    }
  }
  function reveal(list, p) { const n = Math.round(clamp(p) * list.length); for (let i = 0; i < list.length; i++) { const on = i < n; if (list[i]._on !== on) { list[i]._on = on; list[i].classList.toggle("is-on", on); } } }

  /* about words fly in */
  const aws = $$(".aw");
  const seeds = aws.map((_, i) => ({ dx: (0.15 + Math.random() * 0.85) * 520, dy: (Math.random() - 0.5) * 40, d: (i / aws.length) * 0.55 }));
  function aboutWords(p) {
    if (!aws.length) return;
    aws.forEach((w, i) => {
      const e = easeOut(clamp((p * 1.55 - seeds[i].d) / 0.6));
      if (w._e === e) return; w._e = e;
      w.style.transform = e >= 1 ? "" : `translate3d(${seeds[i].dx * (1 - e)}px,${seeds[i].dy * (1 - e)}px,0)`;
      w.style.opacity = e >= 1 ? "" : 0.15 + 0.85 * e;
    });
  }

  /* clients hover */
  $$(".cl").forEach((li) => li.addEventListener("mouseenter", () => { $$(".cl").forEach((x) => x.classList.toggle("is-on", x === li)); }));

  /* parallax for image frames + step cards */
  const pars = $$(".ph .par"), s2 = $$(".s2c[data-speed]");
  function parallax() {
    const H = innerHeight;
    for (const p of pars) {
      const r = p.parentElement.getBoundingClientRect();
      if (r.bottom < -50 || r.top > H + 50) continue;
      const t = (r.top + r.height / 2 - H / 2) / H;
      p.style.transform = `translate3d(0,${(-t * 9).toFixed(2)}%,0)`;
    }
    if (desk.matches) for (const c of s2) {
      const r = c.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > H + 200) continue;
      const t = (r.top + r.height / 2 - H * 0.8);
      c.style.transform = `translate3d(0,${(t * +c.dataset.speed).toFixed(1)}px,0)`;
    }
  }

  /* jump targets (nav: Services / Case Studies) */
  D.jumpY = (id) => {
    if (id === "cases" && M) { // scroll until the proof lead sits under the line
      const target = M.hy1 + 40 - M.hy1 - 19 * M.s; // colY such that lead is near the top
      return M.sceneTop + M.P1 + (anchors.lead - 60 * M.s) / M.rate;
    }
    const el = document.getElementById(id); if (!el) return null;
    if (id === "services" && M) { // card is scaled while entering; land after it is full size
      return Math.max(card.offsetTop + M.H, el.getBoundingClientRect().top + scrollY);
    }
    return el.getBoundingClientRect().top + scrollY;
  };

  /* FAQ tabs */
  $$(".ftab").forEach((b) => b.addEventListener("click", () => {
    $$(".ftab").forEach((x) => x.classList.toggle("is-on", x === b));
    $$(".fpane").forEach((p) => {
      const on = p.dataset.pane === b.dataset.tab; p.classList.toggle("is-on", on);
      if (on) $$(".acc__it", p).forEach((it, i) => D.setOpen(it, i === 0, true));
    });
  }));

  /* ================================================================= standout: text → ASCII → video */
  const so = $("#standout");
  const SO = so && (() => {
    const cv = $(".so__cv", so), ctx = cv.getContext("2d"), vid = $(".so__vid", so);
    const paras = $$(".sr-only p", so).map((p) => p.textContent);
    const head = $(".sr-only h2", so).textContent;
    const NOISE = "!#$%&*+-=:;.,<>?@/\\|~^";
    const RAMP = " .,:;-=+*#%@";
    let W = 0, H = 0, dpr = 1, layout = null, inView = false, seed = [];
    const rand = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; layout = null;
    }
    function build(fs) {
      ctx.font = `500 ${fs}px Inter, Arial`;
      const colW = W * 0.355, lh = fs * 1.21;
      const wrap = (t) => { const ws = t.split(" "), lines = []; let l = ""; for (const w of ws) { const n = l ? l + " " + w : w; if (ctx.measureText(n).width > colW && l) { lines.push(l); l = w; } else l = n; } lines.push(l); return lines; };
      const blocks = [paras[0], paras[1], null, paras[3], paras[4]];
      const rows = []; // {text, head}
      blocks.forEach((b, i) => { if (b === null) { rows.push({ t: head, h: true }); rows.push({ t: "" }); return; } wrap(b).forEach((l) => rows.push({ t: l })); rows.push({ t: "" }); });
      const chars = []; let y = 0;
      const headRow = rows.findIndex((r) => r.h);
      rows.forEach((r, ri) => {
        let x = 0;
        for (const ch of r.t) { const w = ctx.measureText(ch).width; chars.push({ ch, x, y: (ri - headRow) * lh, w, h: !!r.h, id: chars.length }); x += w; }
      });
      const headW = ctx.measureText(head).width;
      return { fs, colW, lh, chars, rows: rows.length, headRow, headW };
    }
    function draw(p, now, pre) {
      if (!layout) layout = build(Math.max(15, W / 57));
      const L = layout;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
      const pIn = clamp((p - 0.04) / 0.16);      // surrounding text appears
      const pZoom = ease(clamp((p - 0.2) / 0.22)); // zoom out to columns
      const pNoise = clamp((p - 0.4) / 0.18);    // letters dissolve into glyphs
      const pAscii = clamp((p - 0.55) / 0.2);    // ascii picture takes over
      const pVid = clamp((p - 0.82) / 0.16);     // real footage
      const z = lerp(1, 0.42, pZoom);
      const cx = W / 2, cy = H / 2;
      const colStep = (L.colW + 40);
      const ncol = pZoom > 0 ? Math.ceil((W / z) / colStep / 2) + 1 : 0;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z);
      ctx.font = `500 ${L.fs}px Inter, Arial`; ctx.textBaseline = "middle";
      const x0 = -L.headW / 2;
      const tick = Math.floor(now / 70);
      const textAlpha = 1 - pAscii;
      if (textAlpha > 0.01) for (let c = -ncol; c <= ncol; c++) {
        const ox = x0 + c * colStep, oy = c === 0 ? 0 : (c % 2 ? -L.lh * 9 : L.lh * 5);
        const colVis = c === 0 ? 1 : clamp(pZoom * 3 - Math.abs(c) * 0.25);
        if (colVis <= 0) continue;
        for (const o of L.chars) {
          if (o.h && c === 0) continue;
          const r = rand(o.id + c * 977);
          const vis = c === 0 ? clamp(pIn * 2.2 - r * 1.2) : colVis;
          if (vis <= 0.02) continue;
          let ch = o.ch;
          if (vis < 0.999 && r > vis) ch = NOISE[(o.id + tick) % NOISE.length];
          if (pNoise > 0 && rand(o.id * 3 + c + tick * 0.01) < pNoise) ch = NOISE[(o.id * 7 + tick + c) % NOISE.length];
          ctx.globalAlpha = textAlpha * (c === 0 ? 0.55 + 0.45 * vis : 0.55) * (o.h ? 1 : 0.62);
          ctx.fillStyle = o.h ? "#2b5ce6" : "#1a1a1a";
          ctx.fillText(ch, ox + o.x, oy + o.y);
        }
      }
      // headline: blue sweep, then dissolves with the rest
      ctx.globalAlpha = 1 - pAscii;
      const sweep = clamp(p / 0.06);
      let hx_ = x0;
      for (const o of L.chars) {
        if (!o.h) continue;
        const k_ = (o.x) / L.headW;
        if (k_ > pre * 1.05) continue;
        let ch = o.ch;
        if (k_ > pre - 0.12 && pre < 1) ch = NOISE[(o.id + tick) % NOISE.length];
        if (pNoise > 0 && rand(o.id + tick * 0.02) < pNoise * 0.8) ch = NOISE[(o.id + tick) % NOISE.length];
        ctx.fillStyle = k_ < sweep * 0.66 + 0.02 ? "#2b5ce6" : "#0d0d0d";
        ctx.fillText(ch, x0 + o.x, o.y);
      }
      ctx.restore(); ctx.globalAlpha = 1;
      // ascii picture from pre-extracted luminance frames (no canvas pixel reads → works on file://)
      const A = window.DATUM_ASCII;
      if (pAscii > 0 && A) {
        if (!A.bytes) { const bin = atob(A.data); A.bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) A.bytes[i] = bin.charCodeAt(i); }
        const fr = Math.floor(now / 125) % A.n, base = fr * A.w * A.h;
        const cell = Math.max(8, Math.round(W / 150)), ch_ = cell * 1.25, cols = Math.ceil(W / cell), rows = Math.ceil(H / ch_);
        const vr = A.w / A.h, cr = W / H; let sw = A.w, sh = A.h, sx = 0, sy = 0;
        if (vr > cr) { sw = A.h * cr; sx = (A.w - sw) / 2; } else { sh = A.w / cr; sy = (A.h - sh) / 2; }
        ctx.font = `500 ${cell * 1.05}px "DM Mono", monospace`; ctx.textBaseline = "top";
        for (let j = 0; j < rows; j++) {
          const yy = Math.min(A.h - 1, Math.floor(sy + (j + 0.5) / rows * sh));
          for (let i = 0; i < cols; i++) {
            if (rand(j * cols + i + 1) > pAscii * 1.3) continue;
            const xx = Math.min(A.w - 1, Math.floor(sx + (i + 0.5) / cols * sw));
            const d = 1 - A.bytes[base + yy * A.w + xx] / 255;
            const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(d * RAMP.length))];
            if (ch === " ") continue;
            const g = Math.round(lerp(150, 10, d));
            ctx.fillStyle = `rgb(${g},${g},${g})`;
            ctx.fillText(ch, i * cell, j * ch_);
          }
        }
      }
      vid.style.opacity = pVid;
      if (pVid > 0 && vid.paused) vid.play().catch(() => {});
    }
    let loaded = false;
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView && !loaded) { loaded = true; const sc = document.createElement("script"); sc.src = (document.documentElement.dataset.root || "") + "assets/js/ascii-frames.js"; document.body.appendChild(sc); }
      if (!inView) vid.pause();
    }, { rootMargin: "1200px 0px" }).observe(so);
    addEventListener("resize", size); size();
    return { tick(now) { if (!inView) return; const r = so.getBoundingClientRect(); const p = clamp(-r.top / (r.height - innerHeight)); draw(p, now, clamp((innerHeight - r.top) / (innerHeight * 0.85))); } };
  })();

  /* ================================================================= mobile: simple reveals */
  function mobileTick() {
    const H = innerHeight;
    if (aws.length && !desk.matches) {
      const ab = $("#about"); const r = ab.getBoundingClientRect();
      aboutWords(clamp((H - r.top) / (H * 0.9)));
    }
  }

  /* ================================================================= loop */
  let lastY = -1;
  function frame(now) {
    if (scrollY !== lastY || frame.force) { lastY = scrollY; frame.force = false; sceneTick(); parallax(); mobileTick(); D.zoneTick && D.zoneTick(); }
    SO && SO.tick(now);
    requestAnimationFrame(frame);
  }
  const relayout = () => { measure(); frame.force = true; };
  addEventListener("resize", relayout);
  desk.addEventListener("change", relayout);
  document.fonts && document.fonts.ready.then(relayout);
  addEventListener("load", relayout);
  measure(); frame.force = true; requestAnimationFrame(frame);

  /* ================================================================= intro sequence */
  if (hx && scene && !reduced && scrollY < 10 && !location.hash) {
    const go = () => setTimeout(() => {
      scene.classList.add("is-playing");
      hx.classList.remove("is-intro"); scene.classList.remove("is-intro");
      setTimeout(() => { hx.classList.add("is-ready"); scene.classList.remove("is-playing"); }, 2500);
    }, 350);
    if (document.readyState === "complete") go(); else addEventListener("load", go);
  } else if (hx) { hx.classList.remove("is-intro"); scene && scene.classList.remove("is-intro"); hx.classList.add("is-ready"); }
})();
