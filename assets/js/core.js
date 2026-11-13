/* Datum Studio — shared behaviour. Vanilla JS, no dependencies. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const D = (window.Datum = window.Datum || {});
  Object.assign(D, { $, $$, clamp, lerp, reduced });
  const ROOT = document.documentElement.dataset.root || "";

  /* ------------------------------------------------------------------ sound */
  const Sound = (() => {
    const KEY = "datum:sound-muted";
    let muted = false;
    try { muted = localStorage.getItem(KEY) === "1"; } catch (e) {}
    // <audio> elements (not fetch + WebAudio) so it also works when the HTML is opened from disk (file://)
    const SEL = ROOT + "assets/sfx/select.mp3";
    const TAPS = [1, 2, 3, 4, 5].map((n) => ROOT + `assets/sfx/tap_0${n}.mp3`);
    const pool = new Map();
    for (const u of [SEL, ...TAPS]) { const a = new Audio(u); a.preload = "auto"; pool.set(u, [a]); }
    let unlocked = false;
    const play = (u, vol, force) => {
      if (muted) return;
      if (!unlocked && !force) return; // browsers block audio until the first click / key press
      const list = pool.get(u); if (!list) return;
      let a = list.find((x) => x.paused || x.ended);
      if (!a) { a = list[0].cloneNode(); list.push(a); }
      a.volume = vol; try { a.currentTime = 0; } catch (e) {}
      const pr = a.play(); if (pr) pr.then(() => (unlocked = true)).catch(() => {});
    };
    const SELECTOR = 'a[href], button, [role="button"], [role="link"], select, label[for], [data-cursor], [data-sound="on"]';
    const target = (el) => {
      if (!(el instanceof Element)) return null;
      const t = el.closest(SELECTOR);
      if (!t || t.closest('[data-sound="off"]') || t.matches(':disabled,[aria-disabled="true"]')) return null;
      return t;
    };
    let last = null, lastT = 0, lastI = -1;
    addEventListener("pointerover", (e) => {
      if (!fine.matches) return;
      const t = target(e.target); if (t === last) return; last = t; if (!t) return;
      const now = performance.now(); if (now - lastT < 70) return; lastT = now;
      let i = Math.floor(Math.random() * TAPS.length); if (i === lastI) i = (i + 1) % TAPS.length; lastI = i;
      play(TAPS[i], 0.12);
    }, { capture: true, passive: true });
    addEventListener("pointerdown", (e) => { if (e.button === 0 && target(e.target)) play(SEL, 0.2, true); else unlocked = true; }, { capture: true, passive: true });
    addEventListener("keydown", (e) => { if (!e.repeat && (e.key === "Enter" || e.key === " ") && target(document.activeElement)) play(SEL, 0.2, true); }, { capture: true, passive: true });
    const sync = () => $$(".sound").forEach((b) => { b.classList.toggle("is-muted", muted); b.setAttribute("aria-pressed", String(!muted)); b.setAttribute("aria-label", muted ? "Turn sound effects on" : "Turn sound effects off"); });
    const toggle = () => { muted = !muted; try { localStorage.setItem(KEY, muted ? "1" : "0"); } catch (e) {} sync(); if (!muted) play(SEL, 0.2, true); };
    document.addEventListener("click", (e) => { const b = e.target.closest(".sound"); if (b) toggle(); });
    sync();
    return { play, toggle, get muted() { return muted; } };
  })();
  D.Sound = Sound;

  /* ------------------------------------------------------------------ grain */
  (() => {
    const host = document.createElement("div"); host.className = "grain"; host.setAttribute("aria-hidden", "true");
    const t = document.createElement("div"); t.className = "grain__t"; host.appendChild(t); document.body.appendChild(host);
    const draw = () => {
      const c = document.createElement("canvas"); c.width = c.height = 180;
      const x = c.getContext("2d"), d = x.createImageData(180, 180);
      for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0);
      t.style.backgroundImage = `url(${c.toDataURL()})`;
    };
    (window.requestIdleCallback || setTimeout)(draw);
  })();

  /* ------------------------------------------------------------------ cursor */
  const Cursor = (() => {
    if (!fine.matches || reduced) return { media() {} };
    document.documentElement.classList.add("has-cursor");
    const el = document.createElement("div"); el.className = "cursor"; el.innerHTML = '<div class="cursor__dot"></div>';
    const md = document.createElement("div"); md.className = "cursor-media";
    md.innerHTML = '<div class="cursor-media__ball"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M8 7h9v9"/></svg></div>';
    document.body.append(el, md);
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, seen = false;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; if (!seen) { x = tx; y = ty; seen = true; } }, { passive: true });
    const loop = () => { x += (tx - x) * 0.35; y += (ty - y) * 0.35; el.style.transform = md.style.transform = `translate3d(${x}px,${y}px,0)`; requestAnimationFrame(loop); };
    loop();
    const GROW = 'a[href], button, [role="button"], select, label[for], input, textarea, [data-cursor="grow"]';
    addEventListener("pointerover", (e) => {
      const t = e.target instanceof Element ? e.target : null;
      const media = t && t.closest('[data-cursor="media"]');
      md.classList.toggle("is-on", !!media);
      el.classList.toggle("is-hidden", !!media);
      el.classList.toggle("is-grow", !media && !!(t && t.closest(GROW)));
    }, { passive: true });
    addEventListener("pointerdown", () => el.classList.add("is-down"));
    addEventListener("pointerup", () => el.classList.remove("is-down"));
    document.addEventListener("mouseleave", () => el.classList.add("is-hidden"));
    document.addEventListener("mouseenter", () => el.classList.remove("is-hidden"));
    return {};
  })();

  /* ------------------------------------------------------------------ scramble text */
  const GLYPHS = "!<>-_\\/[]{}—=+*^?#%@&$abcdefghijklmnopqrstuvwxyz";
  const rnd = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  /** Animate el's text to `to`: characters resolve left→right from random glyphs. */
  function scramble(el, to, { duration = 700, delay = 0, caret = false } = {}) {
    to = to == null ? el.textContent : to;
    if (reduced) { el.textContent = to; return Promise.resolve(); }
    const from = el.textContent;
    const len = Math.max(from.length, to.length);
    const q = [];
    for (let i = 0; i < len; i++) { const s = Math.random() * 0.4 + (i / len) * 0.6; q.push({ a: from[i] || "", b: to[i] || "", s, e: s + 0.15 + Math.random() * 0.2 }); }
    return new Promise((res) => {
      let t0 = null;
      const step = (now) => {
        if (t0 === null) t0 = now + delay;
        const p = (now - t0) / duration;
        if (p < 0) { requestAnimationFrame(step); return; }
        let out = "", done = 0;
        for (const c of q) {
          if (p >= c.e) { out += c.b; done++; }
          else if (p >= c.s) out += c.b === " " ? " " : rnd();
          else out += c.a;
        }
        el.textContent = out + (caret && done < q.length ? "▌" : "");
        if (done < q.length) requestAnimationFrame(step); else { el.textContent = to; res(); }
      };
      requestAnimationFrame(step);
    });
  }
  /** Type text in from nothing, char by char, with a ">" lead that disappears. */
  function typeIn(el, text, { delay = 0, speed = 28, lead = "> " } = {}) {
    text = text == null ? el.dataset.text || el.textContent : text;
    if (reduced) { el.textContent = text; return Promise.resolve(); }
    el.textContent = "";
    return new Promise((res) => setTimeout(() => {
      let i = 0;
      const tick = () => {
        i++;
        const shown = text.slice(0, i);
        const noise = i < text.length ? rnd() : "";
        el.textContent = (i < text.length ? lead : "") + shown + noise;
        if (i < text.length) setTimeout(tick, speed); else { el.textContent = text; res(); }
      };
      tick();
    }, delay));
  }
  Object.assign(D, { scramble, typeIn });

  /* ------------------------------------------------------------------ veil + intro typing of chrome */
  const veil = $(".veil");
  addEventListener("load", () => { if (veil) setTimeout(() => veil.classList.add("is-out"), 120); });
  setTimeout(() => veil && veil.classList.add("is-out"), 2500);
  D.introDelay = 300;
  const startChrome = () => {
    $$(".nav__item .nav__txt, .talk .talk__txt").forEach((el, i) => typeIn(el, el.dataset.text, { delay: 650 + i * 120, speed: 34 }));
    $$(".logo__word").forEach((el, i) => scramble(el, el.dataset.text || el.textContent, { delay: 500 + i * 80, duration: 900 }));
    $$("[data-type-in]").forEach((el, i) => typeIn(el, el.dataset.text || el.textContent, { delay: 900 + (+el.dataset.typeIn || i * 100), speed: 22, lead: "" }));
  };
  if (document.readyState === "complete") startChrome(); else addEventListener("load", startChrome);

  /* ------------------------------------------------------------------ logo click: shuffle bars + back to top */
  document.addEventListener("click", (e) => {
    const l = e.target.closest(".logo"); if (!l) return;
    l.classList.add("is-shuffle"); setTimeout(() => l.classList.remove("is-shuffle"), 650);
    $$(".logo__word", l).forEach((w) => scramble(w, w.dataset.text, { duration: 600 }));
    if (l.dataset.home === "here") { e.preventDefault(); scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); }
  });

  /* ------------------------------------------------------------------ nav: current page + hover scramble */
  $$(".nav__item").forEach((a) => {
    a.addEventListener("mouseenter", () => { const t = $(".nav__txt", a); if (t && !t.dataset.busy) { t.dataset.busy = 1; scramble(t, t.dataset.text, { duration: 420 }).then(() => delete t.dataset.busy); } });
  });
  $$(".talk").forEach((a) => a.addEventListener("mouseenter", () => { const t = $(".talk__txt", a); if (t) scramble(t, t.dataset.text, { duration: 420 }); }));

  /* ------------------------------------------------------------------ header state from sections */
  const hdr = $(".hdr"), booking = $(".booking");
  const zones = $$("[data-zone]");
  const zoneTick = () => {
    const mid = innerHeight * 0.12;
    let z = null;
    for (const s of zones) { const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) z = s; }
    const name = z ? z.dataset.zone : "";
    if (hdr) hdr.classList.toggle("is-foot", name === "foot" || name === "cta");
    if (booking) {
      const left = z && z.dataset.bk;
      booking.classList.toggle("is-on", !!left);
      if (left) booking.style.setProperty("--bk-left", left);
    }
  };
  addEventListener("scroll", zoneTick, { passive: true }); addEventListener("resize", zoneTick); zoneTick();
  D.zoneTick = zoneTick;

  /* ------------------------------------------------------------------ clock (Porto) */
  (() => {
    const ps = $$(".hdr__clock p"); if (!ps.length) return;
    const tz = "Europe/Lisbon";
    const fmtT = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", second: "2-digit" });
    const fmtD = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "short", day: "numeric", year: "numeric" });
    const off = () => { const s = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName"); let v = (s && s.value.replace("GMT", "")) || "+0"; if (!v) v = "+0"; const m = v.match(/([+-])(\d+)/); return m ? `GMT ${m[1]}${m[2].padStart(2, "0")}` : "GMT +00"; };
    let shown = false;
    const render = () => {
      const now = new Date();
      const a = `Porto, Portugal, ${fmtT.format(now)}`, b = `${fmtD.format(now)} (${off()})`;
      const on = hdr && hdr.classList.contains("is-foot");
      if (on && !shown) { shown = true; scramble(ps[0], a, { duration: 800 }); scramble(ps[1], b, { duration: 900 }); }
      else if (on) { ps[0].textContent = a; ps[1].textContent = b; }
      else shown = false;
    };
    setInterval(render, 1000); render();
    addEventListener("scroll", () => { if (!shown && hdr && hdr.classList.contains("is-foot")) render(); }, { passive: true });
  })();

  /* ------------------------------------------------------------------ drawers (book a call / message) */
  const scrim = $(".scrim");
  let openDrawer = null, lastFocus = null;
  const lockScroll = (on) => { document.documentElement.style.overflow = on ? "hidden" : ""; };
  function open(id) {
    const d = document.getElementById(id); if (!d) return;
    close(true);
    lastFocus = document.activeElement;
    d.classList.add("is-open"); d.setAttribute("aria-hidden", "false"); scrim && scrim.classList.add("is-open");
    openDrawer = d; lockScroll(true);
    setTimeout(() => { const f = d.querySelector("input, button, [tabindex]"); f && f.focus({ preventScroll: true }); }, 400);
  }
  function close(silent) {
    if (!openDrawer) return;
    openDrawer.classList.remove("is-open"); openDrawer.setAttribute("aria-hidden", "true");
    scrim && scrim.classList.remove("is-open"); openDrawer = null; lockScroll(false);
    if (!silent && lastFocus) lastFocus.focus({ preventScroll: true });
  }
  D.openDrawer = open; D.closeDrawer = close;
  document.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]");
    if (o) { e.preventDefault(); open(o.dataset.open === "message" ? "drawer-message" : "drawer-book"); return; }
    if (e.target.closest("[data-close]") || e.target === scrim) close();
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") { close(); closeVideo(); closeMenu(); } });

  /* booking calendar — a self-contained mock scheduler (nothing is sent anywhere) */
  function buildCal(root) {
    const now = new Date();
    let y = now.getFullYear(), m = now.getMonth(), sel = null, time = null;
    const grid = $(".cal__grid", root), title = $(".cal__month b", root), yr = $(".cal__month i", root);
    const slots = $(".cal__slots", root), times = $(".cal__times", root), form = $(".cal__form", root), dayLbl = $(".cal__slots h4", root);
    const fmtM = new Intl.DateTimeFormat("en-US", { month: "long" });
    const fmtD = new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", month: "short" });
    const isAvail = (d) => { const wd = d.getDay(); const t = new Date(now.getFullYear(), now.getMonth(), now.getDate()); return d > t && wd > 0 && wd < 6 && (d - t) / 864e5 <= 21; };
    const render = () => {
      title.textContent = fmtM.format(new Date(y, m, 1)); yr.textContent = " " + y;
      const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
      let h = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => `<div class="cal__dow">${d}</div>`).join("");
      for (let i = 0; i < first; i++) h += "<div></div>";
      for (let d = 1; d <= days; d++) {
        const dt = new Date(y, m, d), av = isAvail(dt);
        const today = dt.toDateString() === now.toDateString();
        const s = sel && dt.toDateString() === sel.toDateString();
        h += av ? `<button type="button" class="cal__day is-av${s ? " is-sel" : ""}${today ? " is-today" : ""}" data-d="${d}">${d}</button>` : `<div class="cal__day${today ? " is-today" : ""}">${d}</div>`;
      }
      grid.innerHTML = h;
    };
    const showSlots = () => {
      slots.classList.add("is-on"); form.classList.remove("is-on"); time = null;
      dayLbl.innerHTML = `${fmtD.format(sel)} <i>· Europe/Lisbon</i>`;
      const list = ["9:00am", "9:30am", "10:00am", "11:30am", "1:00pm", "2:00pm", "2:30pm", "3:00pm", "4:30pm"].filter((_, i) => (sel.getDate() + i) % 4 !== 0);
      times.innerHTML = list.map((t) => `<button type="button" class="cal__time">${t}</button>`).join("");
    };
    root.addEventListener("click", (e) => {
      const d = e.target.closest(".cal__day.is-av");
      if (d) { sel = new Date(y, m, +d.dataset.d); render(); showSlots(); return; }
      const t = e.target.closest(".cal__time");
      if (t) { $$(".cal__time", root).forEach((b) => b.classList.toggle("is-sel", b === t)); time = t.textContent; form.classList.add("is-on"); const f = $("input", form); f && f.focus(); return; }
      const nav = e.target.closest("[data-cal]");
      if (nav) { m += nav.dataset.cal === "next" ? 1 : -1; if (m > 11) { m = 0; y++; } if (m < 0) { m = 11; y--; } render(); }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(form)) return;
      $(".cal__done p:last-child", root).textContent = `${fmtD.format(sel)} at ${time}. A calendar invite is on its way.`;
      root.classList.add("is-done");
    });
    render();
    if (root.classList.contains("cal--inline")) { // inline scheduler opens on the first free day, like a booking page
      const d = new Date(now); do { d.setDate(d.getDate() + 1); } while (!isAvail(d));
      y = d.getFullYear(); m = d.getMonth(); sel = d; render(); showSlots();
    }
  }
  function validate(form) {
    let ok = true;
    $$(".fld", form).forEach((f) => {
      const i = $("input, textarea", f); if (!i || !i.required) return;
      const bad = !i.value.trim() || (i.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value));
      f.classList.toggle("is-bad", bad); if (bad) ok = false;
    });
    return ok;
  }
  $$(".cal").forEach(buildCal);
  $$(".msg form").forEach((f) => {
    f.addEventListener("input", (e) => { const fl = e.target.closest(".fld"); fl && fl.classList.remove("is-bad"); });
    f.addEventListener("submit", (e) => { e.preventDefault(); if (validate(f)) f.closest(".msg").classList.add("is-sent"); });
  });

  /* ------------------------------------------------------------------ video modal */
  const vm = $(".vmodal");
  function openVideo(src) {
    if (!vm) return;
    const v = $("video", vm), p = $(".vmodal__player", vm);
    v.src = src; v.currentTime = 0; v.muted = Sound.muted; syncSnd();
    vm.classList.add("is-open"); lockScroll(true);
    v.play().then(() => p.classList.remove("is-paused")).catch(() => p.classList.add("is-paused"));
  }
  function closeVideo() { if (!vm || !vm.classList.contains("is-open")) return; const v = $("video", vm); v.pause(); vm.classList.remove("is-open"); lockScroll(false); }
  function syncSnd() { if (!vm) return; const v = $("video", vm); $(".vmodal__snd span", vm).textContent = v.muted ? "Sound off" : "Sound on"; }
  if (vm) {
    const v = $("video", vm), p = $(".vmodal__player", vm);
    $(".vmodal__toggle", vm).addEventListener("click", () => { if (v.paused) { v.play(); p.classList.remove("is-paused"); } else { v.pause(); p.classList.add("is-paused"); } setIcon(); });
    v.addEventListener("click", () => $(".vmodal__toggle", vm).click());
    const setIcon = () => { $(".vmodal__toggle", vm).innerHTML = v.paused ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>'; };
    v.addEventListener("play", setIcon); v.addEventListener("pause", setIcon);
    $(".vmodal__snd", vm).addEventListener("click", () => { v.muted = !v.muted; syncSnd(); });
    $(".vmodal__close", vm).addEventListener("click", closeVideo);
    $(".vmodal__bg", vm).addEventListener("click", closeVideo);
  }
  document.addEventListener("click", (e) => { const t = e.target.closest("[data-video]"); if (t) { e.preventDefault(); openVideo(t.dataset.video); } });
  D.openVideo = openVideo;

  /* ------------------------------------------------------------------ mobile menu */
  const mm = $(".mmenu");
  function closeMenu() { if (mm && mm.classList.contains("is-open")) { mm.classList.remove("is-open"); lockScroll(false); } }
  document.addEventListener("click", (e) => {
    if (e.target.closest(".dots")) { mm && mm.classList.add("is-open"); lockScroll(true); }
    else if (e.target.closest(".mmenu__x") || (mm && e.target.closest(".mmenu nav a"))) closeMenu();
  });

  /* ------------------------------------------------------------------ in-page section links (Home/Services/Case Studies) */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-jump]"); if (!a) return;
    const id = a.dataset.jump, el = id === "top" ? document.body : document.getElementById(id);
    if (!el) return; // different page: let the href navigate
    e.preventDefault();
    const y = id === "top" ? 0 : (D.jumpY ? D.jumpY(id) : el.getBoundingClientRect().top + scrollY);
    scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
  });
  addEventListener("load", () => {
    const h = location.hash.slice(1); if (!h) return;
    setTimeout(() => { const y = D.jumpY ? D.jumpY(h) : null; if (y != null) scrollTo(0, y); }, 60);
  });

  /* ------------------------------------------------------------------ accordions */
  $$("[data-acc]").forEach((acc) => {
    acc.addEventListener("click", (e) => {
      const h = e.target.closest(".acc__q"); if (!h || !acc.contains(h)) return;
      const item = h.closest(".acc__it"), was = item.classList.contains("is-open");
      if (acc.dataset.acc === "single") $$(".acc__it", acc).forEach((i) => setOpen(i, false));
      setOpen(item, !was);
    });
    $$(".acc__it", acc).forEach((i) => setOpen(i, i.classList.contains("is-open"), true));
  });
  function setOpen(item, on, instant) {
    const a = $(".acc__a", item); item.classList.toggle("is-open", on);
    $(".acc__q", item).setAttribute("aria-expanded", String(on));
    if (instant) { a.style.height = on ? "auto" : "0px"; return; }
    const h = a.scrollHeight; a.style.height = (on ? 0 : h) + "px"; a.offsetHeight; a.style.height = (on ? h : 0) + "px";
    const end = () => { if (item.classList.contains("is-open")) a.style.height = "auto"; a.removeEventListener("transitionend", end); };
    a.addEventListener("transitionend", end);
  }
  D.setOpen = setOpen;

  /* ------------------------------------------------------------------ footer reveal + CTA parallax */
  const foot = $(".foot");
  if (foot) new IntersectionObserver(([e]) => e.isIntersecting && foot.classList.add("is-in"), { threshold: 0.25 }).observe(foot);
  const cta = $(".cta");
  if (cta && !reduced) {
    const media = $(".cta__media", cta), inner = $(".cta__in", cta);
    const tick = () => {
      const r = cta.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height));
      if (media) media.style.transform = `translate3d(0,${(p - 0.5) * -10}%,0)`;
      if (inner && innerWidth >= 768) inner.style.transform = `translate3d(0,${Math.max(0, -r.top) * 0.45}px,0)`;
    };
    addEventListener("scroll", tick, { passive: true }); tick();
  }

  /* ------------------------------------------------------------------ marquees: duplicate content for a seamless loop */
  $$(".marq__track").forEach((t) => { if (!t.dataset.dup) { t.innerHTML += t.innerHTML; t.dataset.dup = 1; } });

  /* ------------------------------------------------------------------ lazy video play when visible */
  const vio = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target; if (e.isIntersecting) { v.play && v.play().catch(() => {}); } else v.pause && v.pause(); }), { rootMargin: "200px" });
  $$("video[data-autoplay]").forEach((v) => { v.muted = true; v.playsInline = true; vio.observe(v); });

  /* ------------------------------------------------------------------ simple carousels ([data-car]) */
  $$("[data-car]").forEach((car) => {
    const groups = new Map();
    $$("[data-slide]", car).forEach((s) => { const g = groups.get(s.parentElement) || []; g.push(s); groups.set(s.parentElement, g); });
    const n_ = Math.max(...[...groups.values()].map((g) => g.length)), cnt = $("[data-count]", car), bar = $("[data-bar]", car);
    let i = 0, timer = null; const dur = +car.dataset.car || 6000;
    const show = (n) => {
      i = (n + n_) % n_;
      groups.forEach((g) => g.forEach((s, k) => { s.classList.toggle("is-on", k === i); if (k === i) $$("[data-scr]", s).forEach((el) => scramble(el, el.dataset.scr, { duration: 600 })); }));
      if (cnt) cnt.textContent = `${i + 1}/${n_}`;
      if (bar) { bar.style.transition = "none"; bar.style.transform = "scaleX(0)"; bar.offsetWidth; bar.style.transition = `transform ${dur}ms linear`; bar.style.transform = "scaleX(1)"; }
      clearTimeout(timer); timer = setTimeout(() => show(i + 1), dur);
    };
    car.addEventListener("click", (e) => { const b = e.target.closest("[data-dir]"); if (b) show(i + +b.dataset.dir); });
    show(0);
  });
})();
