/* Datum Studio — inner pages (gallery, about, case studies, intro, legal). */
(() => {
  "use strict";
  const D = window.Datum, { $, $$, clamp, reduced } = D;

  /* about: cover portrait slideshow */
  $$("[data-slides]").forEach((box) => {
    const imgs = $$("img", box); let i = 0, t;
    const show = (n) => { i = (n + imgs.length) % imgs.length; imgs.forEach((im, k) => im.classList.toggle("is-on", k === i)); clearTimeout(t); t = setTimeout(() => show(i + 1), 3200); };
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-dir]"); if (b) show(i + +b.dataset.dir); });
    show(0);
  });

  /* about: index links scroll to the slide */
  $$(".idx a, .lg__toc a").forEach((a) => a.addEventListener("click", (e) => {
    const el = document.getElementById(a.getAttribute("href").slice(1)); if (!el) return;
    e.preventDefault();
    const pane = el.closest("[data-legal]");
    if (pane && getComputedStyle(pane).overflowY === "auto") pane.scrollTo({ top: el.offsetTop - 40, behavior: reduced ? "auto" : "smooth" });
    else scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: reduced ? "auto" : "smooth" });
    history.replaceState(null, "", "#" + el.id);
  }));
  $$(".call[role=button]").forEach((c) => c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); D.openDrawer("drawer-book"); } }));

  /* case study: image strips drift sideways with scroll */
  const strips = $("[data-strips]");
  if (strips && !reduced) {
    const rows = $$(".strips__row", strips);
    const tick = () => {
      const r = strips.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (innerHeight - r.top) / (innerHeight + r.height);
      rows.forEach((row, i) => { const sp = +row.dataset.speed; row.style.transform = `translate3d(${(p - 0.5) * sp * 900 + (i ? -230 : -200)}px,0,0)`; });
    };
    addEventListener("scroll", tick, { passive: true }); addEventListener("resize", tick); tick();
  }

  /* legal: inner scroll pane, active TOC entry, header state */
  const pane = $("[data-legal]");
  if (pane) {
    const links = $$("[data-toc]"), secs = links.map((a) => document.getElementById(a.getAttribute("href").slice(1)));
    const scroller = () => (getComputedStyle(pane).overflowY === "auto" ? pane : window);
    const tick = () => {
      let on = 0; const lim = innerHeight * 0.4;
      secs.forEach((s, i) => { if (s.getBoundingClientRect().top < lim) on = i; });
      links.forEach((a, i) => a.classList.toggle("is-on", i === on));
      D.zoneTick && D.zoneTick();
    };
    pane.addEventListener("scroll", tick, { passive: true }); addEventListener("scroll", tick, { passive: true }); tick();
    // wheel over the left column scrolls the pane too
    $(".lg") && $(".lg").addEventListener("wheel", (e) => { if (scroller() === pane && !pane.contains(e.target)) pane.scrollBy({ top: e.deltaY }); }, { passive: true });
  }

  /* gallery: hovering a still turns it into an animated halftone (pure CSS mask, safe on file://) */
  $$(".gi--px").forEach((g) => {
    const img = $("img", g); const dup = img.cloneNode(); dup.className = "gi__dots"; dup.alt = ""; g.appendChild(dup);
  });
})();
