/* ============================================================
   Hilfsfunktionen: Zahlen, Farben, Canvas
   ============================================================ */
const SUPS = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const de = (x, sig = 3) => Number(Number(x).toPrecision(sig)).toLocaleString("de-DE", { maximumFractionDigits: 12 });
function sci(x, sig = 3) {
  if (x === 0 || !isFinite(x)) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)) + 1e-9);
  if (e >= -2 && e <= 4) return de(x, sig);
  return de(x / Math.pow(10, e), sig) + "·10" + String(e).split("").map((c) => SUPS[c]).join("");
}
function pre(x, unit, sig = 3) {
  const P = [[1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];
  const a = Math.abs(x);
  if (a < 1e-15) return "0 " + unit;
  for (const [f, s] of P) if (a >= f * 0.9995) return de(x / f, sig) + " " + s + unit;
  return de(x / 1e-12, sig) + " p" + unit;
}
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const palette = () => ({
  ink: cssVar("--ink"), ink2: cssVar("--ink-2"), ink3: cssVar("--ink-3"), rule: cssVar("--rule"),
  paper: cssVar("--paper"), surface: cssVar("--surface"), accent: cssVar("--accent"), plus: cssVar("--plus"),
  minus: cssVar("--minus"), ok: cssVar("--ok"), warn: cssVar("--warn"), grid: cssVar("--grid"), grid2: cssVar("--grid-strong"),
  diel: cssVar("--diel"), accentSoft: cssVar("--accent-soft"), plusSoft: cssVar("--plus-soft"),
});
function fitCanvas(cv, h) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, cv.clientWidth);
  cv.style.height = h + "px";
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}
function el(tag, attrs = {}, html = "") {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  if (html) e.innerHTML = html;
  return e;
}
const REDRAW = new Set();
function watchRedraw(node, fn) {
  REDRAW.add(fn);
  if ("ResizeObserver" in window) new ResizeObserver(() => fn()).observe(node);
}
window.addEventListener("themechange", () => REDRAW.forEach((f) => f()));
const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function arrow(ctx, x1, y1, x2, y2, head = 7) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45));
  ctx.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45));
  ctx.closePath(); ctx.fill();
}
function slider(id, label, min, max, step, value, fmt) {
  const wrap = el("div", { class: "ctl" });
  wrap.innerHTML = `<label for="${id}"><span>${label}</span><output id="${id}-o"></output></label>`;
  const inp = el("input", { type: "range", id, min, max, step, value });
  wrap.append(inp);
  const out = wrap.querySelector("output");
  const upd = () => (out.textContent = fmt(+inp.value));
  inp.addEventListener("input", upd);
  upd();
  return { wrap, inp, set: (v) => { inp.value = v; upd(); } };
}
function seg(options, value, onChange, label) {
  const s = el("div", { class: "seg", role: "group", "aria-label": label || "" });
  const btns = options.map(([v, t]) => {
    const b = el("button", { type: "button", "aria-pressed": String(v === value) }, t);
    b.addEventListener("click", () => {
      btns.forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      onChange(v);
    });
    s.append(b);
    return b;
  });
  return s;
}

/* ============================================================
   1) Feldlinien-Simulation
   ============================================================ */
function fieldPreset(name, w, h) {
  const cx = w / 2, cy = h / 2;
  const ch = [], seeds = [], shapes = [];
  if (name === "punkt") ch.push({ x: cx, y: cy, q: 1, drag: true });
  if (name === "dipol") { const s = Math.min(w * 0.18, 140); ch.push({ x: cx - s, y: cy, q: 1, drag: true }, { x: cx + s, y: cy, q: -1, drag: true }); }
  if (name === "gleich") { const s = Math.min(w * 0.16, 120); ch.push({ x: cx - s, y: cy, q: 1, drag: true }, { x: cx + s, y: cy, q: 1, drag: true }); }
  if (name === "platten") {
    const L = Math.min(h * 0.8, 300), gap = Math.min(w * 0.22, 150), n = 31;
    const xl = cx - gap / 2, xr = cx + gap / 2;
    for (let i = 0; i < n; i++) {
      const y = cy - L / 2 + (L * i) / (n - 1);
      ch.push({ x: xl, y, q: 1 }, { x: xr, y, q: -1 });
    }
    for (let i = 1; i < n - 1; i += 2) seeds.push({ x: xl + 4, y: cy - L / 2 + (L * i) / (n - 1) });
    for (const s of [-1, 1]) for (const a of [0.5, 1.0, 1.5, 2.1]) seeds.push({ x: xl + 4 * Math.cos(s * a), y: cy + s * L / 2 + 4 * Math.sin(s * a) });
    shapes.push({ kind: "plate", x: xl, y1: cy - L / 2, y2: cy + L / 2, q: 1 }, { kind: "plate", x: xr, y1: cy - L / 2, y2: cy + L / 2, q: -1 });
  }
  if (name === "zylinder") {
    const R2 = Math.min(h * 0.42, w * 0.42), R1 = R2 * 0.37;
    const n1 = 36, n2 = 72;
    for (let i = 0; i < n1; i++) { const a = (2 * Math.PI * i) / n1; ch.push({ x: cx + R1 * Math.cos(a), y: cy + R1 * Math.sin(a), q: 1 }); }
    for (let i = 0; i < n2; i++) { const a = (2 * Math.PI * i) / n2; ch.push({ x: cx + R2 * Math.cos(a), y: cy + R2 * Math.sin(a), q: -n1 / n2 }); }
    for (let i = 0; i < 8; i++) { const a = (2 * Math.PI * i) / 8 + 1e-3; seeds.push({ x: cx + (R1 + 4) * Math.cos(a), y: cy + (R1 + 4) * Math.sin(a) }); }
    shapes.push({ kind: "ring", x: cx, y: cy, r: R1, q: 1 }, { kind: "ring", x: cx, y: cy, r: R2, q: -1 });
  }
  return { ch, seeds, shapes };
}

function FieldSim(root, { preset = "dipol", controls = true, height = 380, caption = "" } = {}) {
  const st = { preset, ch: [], seeds: [], shapes: [], probe: null, probeSign: 1, w: 0, h: 0, drag: null, dirty: true };
  const stage = el("div", { class: "stage" });
  const cv = el("canvas", { role: "img", "aria-label": "Feldlinienbild" });
  stage.append(cv);
  if (controls) stage.append(el("div", { class: "hint" }, "Ladungen ziehen · irgendwo tippen = Probeladung"));
  root.append(stage);
  let info;

  function load(name) {
    st.preset = name;
    const p = fieldPreset(name, st.w || cv.clientWidth || 600, height);
    Object.assign(st, { ch: p.ch, seeds: p.seeds, shapes: p.shapes, probe: null });
    draw();
    if (info) info.innerHTML = INFO[name] || "";
  }
  const INFO = {
    punkt: "Radiales Feld: Die Linien laufen sternförmig nach außen. Je weiter weg, desto weiter liegen sie auseinander, das Feld wird schwächer. Inhomogen.",
    dipol: "Die Linien laufen von + nach −. Zwischen den Ladungen liegen sie am dichtesten: Dort ist das Feld am stärksten.",
    gleich: "Zwei gleichnamige Ladungen: Die Linien weichen einander aus. Genau in der Mitte heben sich die Kräfte auf, dort ist das Feld null.",
    platten: "Plattenkondensator: Innen parallele Linien mit gleichem Abstand, also ein homogenes Feld. Am Rand wölben sich die Linien nach außen.",
    eigene: "Eigene Anordnung. Zieh die Ladungen herum und beobachte, wie sich die Linien neu ordnen.",
    zylinder: "Zylinderkondensator von oben: Die Linien laufen radial vom inneren (+) zum äußeren Zylinder (−). Innen sind sie dichter, das Feld ist inhomogen.",
  };

  function E(x, y) {
    let ex = 0, ey = 0;
    for (const c of st.ch) {
      const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy + 1e-6, r3 = r2 * Math.sqrt(r2);
      ex += (c.q * dx) / r3; ey += (c.q * dy) / r3;
    }
    return [ex, ey];
  }
  function trace(x, y, dir) {
    const pts = [[x, y]];
    const step = 2.2, M = 40;
    let end = null;
    for (let n = 0; n < 2600; n++) {
      let [ex, ey] = E(x, y);
      let m = Math.hypot(ex, ey);
      if (m < 1e-14) break;
      const mx = x + (dir * ex * step) / (2 * m), my = y + (dir * ey * step) / (2 * m);
      [ex, ey] = E(mx, my); m = Math.hypot(ex, ey);
      if (m < 1e-14) break;
      x += (dir * ex * step) / m; y += (dir * ey * step) / m;
      pts.push([x, y]);
      if (x < -M || y < -M || x > st.w + M || y > st.h + M) break;
      let hit = false;
      for (const c of st.ch) {
        if (dir * c.q < 0 && (x - c.x) ** 2 + (y - c.y) ** 2 < 36) { pts.push([c.x, c.y]); end = c; hit = true; break; }
      }
      if (hit) break;
    }
    return { pts, end };
  }
  function lines() {
    const out = [];
    const pos = st.ch.filter((c) => c.q > 0), neg = st.ch.filter((c) => c.q < 0);
    if (st.seeds.length) {
      for (const s of st.seeds) out.push(trace(s.x, s.y, 1).pts);
      return out;
    }
    const per = 14;
    for (const c of pos) {
      const n = Math.round(per * c.q);
      for (let i = 0; i < n; i++) { const a = (2 * Math.PI * (i + 0.5)) / n; out.push(trace(c.x + 7 * Math.cos(a), c.y + 7 * Math.sin(a), 1).pts); }
    }
    for (const c of neg) {
      const n = Math.round(per * -c.q);
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * (i + 0.5)) / n;
        const t = trace(c.x + 7 * Math.cos(a), c.y + 7 * Math.sin(a), -1);
        if (!t.end) out.push(t.pts.reverse());
      }
    }
    return out;
  }

  function draw() {
    const prevW = st.w;
    const { ctx, w, h } = fitCanvas(cv, height);
    if (prevW && Math.abs(prevW - w) > 1 && st.ch.length) {
      const f = w / prevW;
      st.ch.forEach((c) => (c.x *= f));
      st.seeds.forEach((s) => (s.x *= f));
      st.shapes.forEach((s) => (s.x *= f));
      if (st.probe) st.probe.x *= f;
      if (st.preset === "platten" || st.preset === "zylinder") { st.w = w; st.h = h; return load(st.preset); }
    }
    st.w = w; st.h = h;
    if (!st.ch.length && st.preset !== "eigene") return load(st.preset);
    const P = palette();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = P.ink2; ctx.fillStyle = P.ink2;
    for (const pts of lines()) {
      if (pts.length < 3) continue;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      const mids = pts.length > 220 ? [0.3, 0.7] : [0.5];
      for (const f of mids) {
        const i = Math.floor(pts.length * f);
        const [x1, y1] = pts[i], [x2, y2] = pts[Math.min(pts.length - 1, i + 3)];
        if (x1 < 0 || y1 < 0 || x1 > w || y1 > h) continue;
        const a = Math.atan2(y2 - y1, x2 - x1), s = 6;
        ctx.beginPath();
        ctx.moveTo(x1 + s * Math.cos(a), y1 + s * Math.sin(a));
        ctx.lineTo(x1 - s * Math.cos(a - 0.5), y1 - s * Math.sin(a - 0.5));
        ctx.lineTo(x1 - s * Math.cos(a + 0.5), y1 - s * Math.sin(a + 0.5));
        ctx.closePath(); ctx.fill();
      }
    }
    for (const s of st.shapes) {
      const col = s.q > 0 ? P.plus : P.minus;
      ctx.strokeStyle = col; ctx.fillStyle = col;
      if (s.kind === "plate") {
        ctx.fillRect(s.x - 4, s.y1 - 6, 8, s.y2 - s.y1 + 12);
        ctx.font = "600 16px " + cssVar("--f-mono");
        ctx.textAlign = "center";
        for (let y = s.y1 + 14; y < s.y2; y += 34) ctx.fillText(s.q > 0 ? "+" : "−", s.x + (s.q > 0 ? -16 : 16), y + 5);
      } else {
        ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI); ctx.stroke(); ctx.lineWidth = 1.3;
      }
    }
    if (!st.shapes.length) {
      for (const c of st.ch) {
        ctx.fillStyle = c.q > 0 ? P.plus : P.minus;
        ctx.beginPath(); ctx.arc(c.x, c.y, 13, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = P.surface;
        ctx.font = "600 18px " + cssVar("--f-mono");
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(c.q > 0 ? "+" : "−", c.x, c.y + 1);
        ctx.textBaseline = "alphabetic";
      }
    }
    if (st.probe) {
      const [ex, ey] = E(st.probe.x, st.probe.y), m = Math.hypot(ex, ey);
      const col = st.probeSign > 0 ? P.plus : P.minus;
      const L = Math.max(18, Math.min(90, 26 + 22 * Math.log10(1 + m * 4e4)));
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.6;
      if (m > 1e-12) arrow(ctx, st.probe.x, st.probe.y, st.probe.x + (st.probeSign * ex * L) / m, st.probe.y + (st.probeSign * ey * L) / m, 10);
      ctx.beginPath(); ctx.arc(st.probe.x, st.probe.y, 6, 0, 2 * Math.PI); ctx.fillStyle = P.surface; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      if (info) {
        const rel = m * 4e4;
        info.innerHTML = `<b>Probeladung ${st.probeSign > 0 ? "positiv" : "negativ"}:</b> Die Kraft wirkt ${st.probeSign > 0 ? "entlang" : "entgegen"} der Feldlinie. Feldstärke hier (relativ): <b>${de(rel, 2)}</b>. Tipp woanders hin und vergleiche dichte und weite Bereiche.`;
      }
    }
  }

  let raf = 0;
  const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  if (controls || caption) {
    cv.addEventListener("pointerdown", (e) => {
      const p = pos(e);
      const hit = st.ch.find((c) => c.drag && (c.x - p.x) ** 2 + (c.y - p.y) ** 2 < 22 * 22);
      if (hit) { st.drag = hit; cv.setPointerCapture(e.pointerId); }
      else if (controls) { st.probe = p; redraw(); }
    });
    cv.addEventListener("pointermove", (e) => {
      if (!st.drag) return;
      const p = pos(e);
      st.drag.x = Math.max(14, Math.min(st.w - 14, p.x));
      st.drag.y = Math.max(14, Math.min(st.h - 14, p.y));
      redraw();
    });
    const up = () => (st.drag = null);
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
  }

  if (controls) {
    const ctl = el("div", { class: "controls" });
    const presetSeg = seg([["punkt", "Punktladung"], ["dipol", "+ und −"], ["gleich", "+ und +"], ["platten", "Platten"]], preset, load, "Anordnung");
    const add = el("div", { class: "row" });
    const addCharge = (q) => {
      if (st.preset === "platten" || st.preset === "zylinder") st.ch = [];
      st.preset = "eigene";
      presetSeg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false"));
      st.seeds = []; st.shapes = [];
      st.ch.push({ x: st.w * (0.25 + Math.random() * 0.5), y: st.h * (0.25 + Math.random() * 0.5), q, drag: true });
      if (info) info.innerHTML = INFO.eigene;
      redraw();
    };
    add.append(
      el("button", { class: "btn small", type: "button", onclick: () => addCharge(1) }, "+ Ladung"),
      el("button", { class: "btn small", type: "button", onclick: () => addCharge(-1) }, "− Ladung"),
      el("button", { class: "btn small ghost", type: "button", onclick: () => load(st.preset === "eigene" ? "dipol" : st.preset) }, "Zurücksetzen"),
    );
    const probe = el("div", { class: "ctl" }, `<label><span>Probeladung</span></label>`);
    probe.append(seg([[1, "positiv"], [-1, "negativ (Elektron)"]], 1, (v) => { st.probeSign = v; redraw(); }, "Vorzeichen der Probeladung"));
    info = el("div", { class: "insight" });
    ctl.append(el("div", { class: "ctl" }, "<label><span>Anordnung</span></label>"), presetSeg, add, probe, info);
    root.append(ctl);
  }
  if (caption) root.append(el("figcaption", {}, caption));
  watchRedraw(cv, redraw);
  return { load };
}

/* ============================================================
   2a) Teilchen im Plattenkondensator (Energieerhaltung)
   ============================================================ */
function AccelSim(root) {
  const stage = el("div", { class: "stage" });
  const cv = el("canvas", { role: "img", "aria-label": "Geladene Kugel wird zwischen zwei Platten beschleunigt" });
  stage.append(cv);
  const ctl = el("div", { class: "controls" });
  const sU = slider("acc-u", "Spannung U", 1, 20, 0.5, 12, (v) => de(v, 3) + " kV");
  const sD = slider("acc-d", "Plattenabstand d", 2, 20, 1, 10, (v) => v + " cm");
  const sQ = slider("acc-q", "Ladung q", 0.5, 5, 0.5, 2.5, (v) => de(v, 2) + " nC");
  const sM = slider("acc-m", "Masse m", 0.1, 1, 0.1, 0.4, (v) => de(v, 2) + " g");
  const ro = el("div", { class: "readout" });
  const calc = el("div", { class: "calc" });
  const ins = el("div", { class: "insight" });
  const restart = el("button", { class: "btn small", type: "button" }, "Nochmal fliegen lassen");
  ctl.append(sU.wrap, sD.wrap, sQ.wrap, sM.wrap, ro, calc, ins, restart);
  root.append(stage, ctl);

  let t0 = performance.now(), lastD = 10, raf = 0;
  const phys = () => {
    const U = +sU.inp.value * 1e3, d = +sD.inp.value / 100, q = +sQ.inp.value * 1e-9, m = +sM.inp.value * 1e-3;
    const E = U / d, F = q * E, a = F / m, W = q * U, v = Math.sqrt((2 * W) / m), T = Math.sqrt((2 * d) / a);
    return { U, d, q, m, E, F, a, W, v, T };
  };
  function readouts() {
    const p = phys();
    ro.innerHTML = [
      ["E = U/d", pre(p.E, "V/m")], ["F = q·E", pre(p.F, "N")], ["a = F/m", de(p.a, 3) + " m/s²"],
      ["Flugzeit", de(p.T, 3) + " s"], ["E_kin am Ende", pre(p.W, "J")], ["v am Ende", de(p.v, 3) + " m/s"],
    ].map(([k, v]) => `<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join("");
    calc.innerHTML = fx(`v = sqrt{{2*q*U|m}} = sqrt{{2*${sci(p.q)} `+"`C`"+` * ${sci(p.U)} `+"`V`"+`|${sci(p.m)} `+"`kg`"+`}} = ${de(p.v)} `+"`m/s`");
  }
  function onChange(e) {
    readouts();
    if (e && e.target === sD.inp) {
      const d = +sD.inp.value, f = d / lastD;
      if (f !== 1) ins.innerHTML = `Abstand ${f > 1 ? "vergrößert" : "verkleinert"} (× ${de(f, 2)}): Die Kraft ist jetzt ${f > 1 ? de(f, 2) + "-mal kleiner" : de(1 / f, 2) + "-mal größer"}, der Weg ${f > 1 ? de(f, 2) + "-mal länger" : de(1 / f, 2) + "-mal kürzer"}. <b>Die Endgeschwindigkeit bleibt gleich.</b> Nur die Flugzeit ändert sich.`;
      lastD = d;
    } else if (e) {
      ins.innerHTML = "";
    }
    t0 = performance.now();
    loop();
  }
  [sU, sD, sQ, sM].forEach((s) => s.inp.addEventListener("input", onChange));
  restart.addEventListener("click", () => { t0 = performance.now(); loop(); });

  function draw(now) {
    const p = phys();
    const { ctx, w, h } = fitCanvas(cv, 300);
    const P = palette();
    const gapMax = Math.min(w - 120, 520);
    const gap = Math.max(40, (p.d / 0.2) * gapMax);
    const xl = (w - gap) / 2, xr = xl + gap, top = 40, bot = h - 80;
    // Platten
    ctx.fillStyle = P.plus; ctx.fillRect(xl - 8, top, 8, bot - top);
    ctx.fillStyle = P.minus; ctx.fillRect(xr, top, 8, bot - top);
    ctx.font = "600 15px " + cssVar("--f-mono"); ctx.textAlign = "center";
    ctx.fillStyle = P.plus; ctx.fillText("+", xl - 4, top - 10);
    ctx.fillStyle = P.minus; ctx.fillText("−", xr + 4, top - 10);
    // Feldlinien
    ctx.strokeStyle = P.ink3; ctx.fillStyle = P.ink3; ctx.lineWidth = 1; ctx.globalAlpha = 0.45;
    const nL = Math.max(3, Math.min(11, Math.round(3 + p.E / 3e4)));
    for (let i = 0; i < nL; i++) {
      const y = top + ((bot - top) * (i + 0.5)) / nL;
      arrow(ctx, xl + 4, y, xr - 4, y, 5);
    }
    ctx.globalAlpha = 1;
    // Bewegung
    let t = reduceMotion() ? p.T : (now - t0) / 1000;
    const done = t >= p.T;
    if (done) t = p.T;
    const s = 0.5 * p.a * t * t, frac = done ? 1 : Math.min(1, s / p.d);
    const x = xl + 12 + frac * (gap - 24), y = (top + bot) / 2;
    ctx.fillStyle = P.plus;
    ctx.beginPath(); ctx.arc(x, y, 11, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = P.surface; ctx.font = "600 14px " + cssVar("--f-mono"); ctx.textBaseline = "middle"; ctx.fillText("+", x, y + 1); ctx.textBaseline = "alphabetic";
    const v = p.a * t;
    ctx.strokeStyle = P.accent; ctx.fillStyle = P.accent; ctx.lineWidth = 2;
    if (v > 0) arrow(ctx, x + 14, y, x + 14 + 20 + 60 * (v / p.v), y, 7);
    // Energiebalken
    const bx = 16, bw = w - 32, by = h - 50;
    ctx.fillStyle = P.ink3; ctx.font = "12px " + cssVar("--f-mono"); ctx.textAlign = "left";
    ctx.fillText("Energie:  elektrisch → Bewegung", bx, by - 8);
    ctx.fillStyle = P.rule; ctx.fillRect(bx, by, bw, 12);
    ctx.fillStyle = P.accent; ctx.fillRect(bx, by, bw * frac, 12);
    ctx.fillStyle = P.plus; ctx.globalAlpha = 0.55; ctx.fillRect(bx + bw * frac, by, bw * (1 - frac), 12); ctx.globalAlpha = 1;
    ctx.fillStyle = P.ink2;
    ctx.fillText(`E_kin = ${pre(p.W * frac, "J")}`, bx, by + 30);
    ctx.textAlign = "right";
    ctx.fillText(`E_el übrig = ${pre(p.W * (1 - frac), "J")}`, bx + bw, by + 30);
    // Abstand
    ctx.textAlign = "center"; ctx.fillStyle = P.ink3;
    ctx.fillText(`d = ${de(p.d * 100)} cm`, (xl + xr) / 2, top - 10);
    return done;
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = (now) => { if (!draw(now)) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }
  readouts();
  watchRedraw(cv, () => draw(performance.now()));
  loop();
}

/* ============================================================
   2b) Millikan: Schweben
   ============================================================ */
function MillikanSim(root) {
  const stage = el("div", { class: "stage" });
  const cv = el("canvas", { role: "img", "aria-label": "Öltröpfchen zwischen waagerechten Platten" });
  stage.append(cv);
  const ctl = el("div", { class: "controls" });
  const sU = slider("mil-u", "Spannung U", 0, 1000, 1, 150, (v) => v + " V");
  const sD = slider("mil-d", "Plattenabstand d", 2, 10, 0.5, 5, (v) => de(v, 2) + " mm");
  const ro = el("div", { class: "readout" });
  const ins = el("div", { class: "insight" });
  const reveal = el("label", { class: "switch" }, `<input type="checkbox" id="mil-rev"> Wahre Ladung anzeigen`);
  const nextB = el("button", { class: "btn small", type: "button" }, "Neues Tröpfchen");
  ctl.append(
    el("p", { class: "small muted" }, "Stell die Spannung so ein, dass das Tröpfchen schwebt. Dann gilt q = m·g·d/U."),
    sU.wrap, sD.wrap, ro, ins, el("div", { class: "row" }), reveal,
  );
  ctl.lastElementChild.previousElementSibling.append(nextB);
  root.append(stage, ctl);

  const e0 = 1.602e-19, g = 9.81;
  const st = { m: 4e-15, n: 5, y: 0.5, last: performance.now() };
  function newDrop() {
    const d = +sD.inp.value * 1e-3;
    for (let k = 0; k < 50; k++) {
      const m = (2 + Math.random() * 5) * 1e-15, n = 1 + Math.floor(Math.random() * 7);
      const Uh = (m * g * d) / (n * e0);
      if (Uh > 60 && Uh < 900) { st.m = m; st.n = n; break; }
    }
    st.y = 0.5;
    reveal.querySelector("input").checked = false;
    update();
  }
  nextB.addEventListener("click", newDrop);
  reveal.querySelector("input").addEventListener("change", update);
  function phys() {
    const U = +sU.inp.value, d = +sD.inp.value * 1e-3;
    const Fg = st.m * g, Fel = (st.n * e0 * U) / d;
    return { U, d, Fg, Fel, qCalc: U > 0 ? (st.m * g * d) / U : Infinity };
  }
  function update() {
    const p = phys();
    const ratio = (p.Fel - p.Fg) / p.Fg;
    const hover = Math.abs(ratio) < 0.015;
    ro.innerHTML = [
      ["Masse m", sci(st.m) + " kg"], ["F_G = m·g", sci(p.Fg) + " N"], ["F_el = q·U/d", sci(p.Fel) + " N"],
      ["Zustand", hover ? "schwebt" : ratio > 0 ? "steigt" : "sinkt"],
    ].map(([k, v]) => `<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join("");
    const rev = reveal.querySelector("input").checked;
    if (hover) {
      const n = p.qCalc / e0;
      ins.innerHTML = `<b>Es schwebt.</b> ${fx("q = {m*g*d|U}")} = ${sci(p.qCalc)} C. Das sind ${de(n, 3)} · e, also <b>${Math.round(n)} Elementarladungen</b>.`;
    } else {
      ins.innerHTML = rev ? `Wahre Ladung: ${st.n} · e = ${sci(st.n * e0)} C (negativ). Schwebespannung: ${de((st.m * g * p.d) / (st.n * e0), 3)} V.` : "";
    }
    if (rev && hover) ins.innerHTML += ` Wahre Ladung: ${st.n} · e.`;
  }
  [sU, sD].forEach((s) => s.inp.addEventListener("input", update));

  function draw(now) {
    const dt = Math.min(0.05, (now - st.last) / 1000);
    st.last = now;
    const p = phys();
    const ratio = Math.max(-1.5, Math.min(1.5, (p.Fel - p.Fg) / p.Fg));
    if (Math.abs(ratio) >= 0.015) st.y = Math.max(0.06, Math.min(0.94, st.y - ratio * 0.18 * dt * (reduceMotion() ? 0 : 1)));
    const { ctx, w, h } = fitCanvas(cv, 300);
    const P = palette();
    const top = 40, bot = h - 40, L = Math.min(w - 60, 520), xl = (w - L) / 2;
    ctx.fillStyle = P.plus; ctx.fillRect(xl, top - 8, L, 8);
    ctx.fillStyle = P.minus; ctx.fillRect(xl, bot, L, 8);
    ctx.font = "600 14px " + cssVar("--f-mono"); ctx.textAlign = "left";
    ctx.fillStyle = P.plus; ctx.fillText("+ " + p.U + " V", xl, top - 16);
    ctx.fillStyle = P.minus; ctx.fillText("−", xl, bot + 26);
    ctx.strokeStyle = P.ink3; ctx.fillStyle = P.ink3; ctx.lineWidth = 1; ctx.globalAlpha = 0.45;
    for (let i = 0; i < 9; i++) { const x = xl + (L * (i + 0.5)) / 9; arrow(ctx, x, top + 4, x, bot - 4, 5); }
    ctx.globalAlpha = 1;
    const x = w / 2, y = top + st.y * (bot - top);
    const sc = 46;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = P.warn; ctx.fillStyle = P.warn;
    arrow(ctx, x, y + 10, x, y + 10 + sc, 8);
    ctx.strokeStyle = P.accent; ctx.fillStyle = P.accent;
    if (p.Fel > 0) arrow(ctx, x, y - 10, x, y - 10 - sc * Math.min(2.2, p.Fel / p.Fg), 8);
    ctx.fillStyle = P.minus;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = P.surface; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("−", x, y + 1); ctx.textBaseline = "alphabetic";
    ctx.font = "12px " + cssVar("--f-mono"); ctx.textAlign = "left";
    ctx.fillStyle = P.warn; ctx.fillText("F_G", x + 14, y + 10 + sc);
    ctx.fillStyle = P.accent; if (p.Fel > 0) ctx.fillText("F_el", x + 14, Math.max(top + 14, y - 10 - sc * Math.min(2.2, p.Fel / p.Fg)));
  }
  let raf = 0;
  const loop = (now) => { draw(now); raf = requestAnimationFrame(loop); };
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { cancelAnimationFrame(raf); if (e.isIntersecting) raf = requestAnimationFrame(loop); });
  }) : null;
  if (io) io.observe(cv); else raf = requestAnimationFrame(loop);
  watchRedraw(cv, () => draw(performance.now()));
  newDrop();
}

/* ============================================================
   3) Kondensator-Labor
   ============================================================ */
const EPS0 = 8.854e-12;
const MATERIALS = [["Luft", 1.0], ["Styropor", 1.03], ["Öl", 2.5], ["Papier", 3], ["Glas", 6], ["Wasser", 81]];
function CapLab(root) {
  const stage = el("div", { class: "stage" });
  const cv = el("canvas", { role: "img", "aria-label": "Plattenkondensator mit Quelle, Feldlinien und Ladungen" });
  stage.append(cv);
  const ctl = el("div", { class: "controls" });
  const conn = el("label", { class: "switch" }, `<input type="checkbox" id="cap-conn" checked> <span>An der Quelle angeschlossen</span>`);
  const sU = slider("cap-u", "Quellspannung U₀", 0, 500, 10, 400, (v) => v + " V");
  const sD = slider("cap-d", "Plattenabstand d", 1, 10, 0.5, 4, (v) => de(v, 2) + " mm");
  const sA = slider("cap-a", "Plattenfläche A", 100, 1000, 50, 500, (v) => v + " cm²");
  const mat = el("div", { class: "ctl" }, `<label for="cap-m"><span>Dielektrikum</span></label>`);
  const sel = el("select", { id: "cap-m" }, MATERIALS.map(([n, e], i) => `<option value="${i}">${n} (εr ≈ ${de(e, 3)})</option>`).join(""));
  mat.append(sel);
  const ro = el("div", { class: "readout" });
  const calc = el("div", { class: "calc" });
  const ins = el("div", { class: "insight" });
  const refB = el("button", { class: "btn small", type: "button" }, "Als Vergleich festhalten");
  const qu = el("canvas", { role: "img", "aria-label": "Q-U-Diagramm" });
  ctl.append(conn, sU.wrap, sD.wrap, sA.wrap, mat, ro, el("div", { class: "row" }), calc, ins);
  ctl.querySelector(".row").append(refB, el("span", { class: "small muted" }, "Pfeile zeigen die Änderung gegenüber dem Vergleich."));
  root.append(stage, ctl);
  const quWrap = el("div", { class: "fig" });
  quWrap.append(qu);
  ctl.insertBefore(quWrap, calc);

  const st = { connected: true, Q: 0, ref: null };
  const cap = () => (EPS0 * MATERIALS[+sel.value][1] * (+sA.inp.value * 1e-4)) / (+sD.inp.value * 1e-3);
  function state() {
    const C = cap(), er = MATERIALS[+sel.value][1], d = +sD.inp.value * 1e-3, A = +sA.inp.value * 1e-4;
    let U, Q;
    if (st.connected) { U = +sU.inp.value; Q = C * U; st.Q = Q; }
    else { Q = st.Q; U = Q / C; }
    return { C, Q, U, E: U / d, er, d, A };
  }
  const snap = () => { st.ref = state(); };
  function delta(v, r) {
    if (!r) return "";
    const f = v / r;
    if (Math.abs(f - 1) < 0.005) return `<span class="d same">gleich</span>`;
    const txt = f > 1 ? "× " + de(f, 3) : "÷ " + de(1 / f, 3);
    return `<span class="d ${f > 1 ? "up" : "down"}">${f > 1 ? "↑" : "↓"} ${txt}</span>`;
  }
  function update(e) {
    const s = state(), r = st.ref;
    sU.inp.disabled = !st.connected;
    if (!st.connected) sU.wrap.querySelector("output").textContent = "getrennt";
    else sU.wrap.querySelector("output").textContent = sU.inp.value + " V";
    ro.innerHTML = [
      ["Kapazität C", pre(s.C, "F"), delta(s.C, r && r.C)],
      ["Ladung Q", pre(s.Q, "C"), delta(s.Q, r && r.Q)],
      ["Spannung U", de(s.U, 3) + " V", delta(s.U, r && r.U)],
      ["Feldstärke E", pre(s.E, "V/m"), delta(s.E, r && r.E)],
    ].map(([k, v, d]) => `<div><span class="k">${k}</span><span class="v">${v} ${d}</span></div>`).join("");
    calc.innerHTML =
      fx(`C = ε_0*ε_r*{A|d} = 8,854*10^{-12} * ${de(s.er, 3)} * {${de(s.A, 3)} `+"`m²`"+`|${sci(s.d)} `+"`m`"+`} = ${pre(s.C, "F").replace(" ", " `") + "`"}`) +
      "<br>" +
      (st.connected
        ? fx(`Q = C*U = ${pre(s.C, "F").replace(" ", " `") + "`"} * ${de(s.U)} `+"`V`"+` = ${pre(s.Q, "C").replace(" ", " `") + "`"}`)
        : fx(`U = {Q|C} = {${pre(s.Q, "C").replace(" ", " `") + "`"}|${pre(s.C, "F").replace(" ", " `") + "`"}} = ${de(s.U)} `+"`V`")) +
      "<br>" + fx(`E = {U|d} = ${pre(s.E, "V/m").replace(" ", " `") + "`"}`);
    ins.innerHTML = st.connected
      ? "<b>Angeschlossen:</b> Die Quelle hält U fest. Ändert sich C, fließt Ladung zu oder ab."
      : "<b>Getrennt:</b> Die Ladung kann nicht weg, Q bleibt fest. Ändert sich C, ändert sich die Spannung. Zieh die Platten auseinander und schau auf E.";
    draw(); drawQU();
  }
  conn.querySelector("input").addEventListener("change", (e) => {
    st.connected = e.target.checked;
    if (!st.connected) st.Q = cap() * +sU.inp.value;
    snap(); update();
  });
  [sU, sD, sA].forEach((s) => s.inp.addEventListener("input", update));
  sel.addEventListener("change", update);
  refB.addEventListener("click", () => { snap(); update(); });

  function draw() {
    const s = state();
    const { ctx, w, h } = fitCanvas(cv, 360);
    const P = palette();
    const pw = Math.min(w - 150, 460) * (0.3 + 0.7 * ((+sA.inp.value - 100) / 900));
    const gap = 30 + ((+sD.inp.value - 1) / 9) * 170;
    const cx = w / 2 + 30, cy = h / 2;
    const xl = cx - pw / 2, xr = cx + pw / 2, yt = cy - gap / 2, yb = cy + gap / 2;
    // Dielektrikum
    if (s.er > 1.001) {
      ctx.fillStyle = P.diel; ctx.fillRect(xl, yt + 2, pw, gap - 4);
      ctx.fillStyle = P.warn; ctx.font = "12px " + cssVar("--f-mono"); ctx.textAlign = "right";
      ctx.fillText(MATERIALS[+sel.value][0] + ", εr ≈ " + de(s.er, 3), xr - 6, yb - 8);
      const nb = Math.min(28, Math.round(28 * (1 - 1 / s.er) * Math.min(1, s.Q / 6e-8)));
      ctx.font = "600 11px " + cssVar("--f-mono"); ctx.textAlign = "center";
      for (let i = 0; i < nb; i++) {
        const x = xl + (pw * (i + 0.5)) / nb;
        ctx.fillStyle = P.minus; ctx.fillText("−", x, yt + 14);
        ctx.fillStyle = P.plus; ctx.fillText("+", x, yb - 5);
      }
    }
    // Feldlinien: Dichte ~ E
    const nL = Math.max(0, Math.min(34, Math.round((s.E / 1e5) * 10 * (pw / 300))));
    ctx.strokeStyle = P.ink3; ctx.fillStyle = P.ink3; ctx.lineWidth = 1.1;
    for (let i = 0; i < nL; i++) {
      const x = xl + (pw * (i + 0.5)) / nL;
      arrow(ctx, x, yt + 5, x, yb - 5, 5);
    }
    if (nL > 0) {
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? xl : xr;
        ctx.beginPath(); ctx.moveTo(x0, yt + 2);
        ctx.quadraticCurveTo(x0 + side * Math.min(40, gap * 0.5), cy, x0, yb - 2); ctx.stroke();
      }
    }
    // Platten
    ctx.fillStyle = P.plus; ctx.fillRect(xl, yt - 7, pw, 7);
    ctx.fillStyle = P.minus; ctx.fillRect(xl, yb, pw, 7);
    const nq = Math.max(0, Math.min(40, Math.round((s.Q / 4.4e-8) * 12)));
    ctx.font = "600 12px " + cssVar("--f-mono"); ctx.textAlign = "center";
    for (let i = 0; i < nq; i++) {
      const x = xl + (pw * (i + 0.5)) / nq;
      ctx.fillStyle = P.plus; ctx.fillText("+", x, yt - 12);
      ctx.fillStyle = P.minus; ctx.fillText("−", x, yb + 21);
    }
    // Stromkreis mit Quelle und Schalter
    const bx = 34;
    ctx.strokeStyle = P.ink2; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xl, yt - 4); ctx.lineTo(bx, yt - 4); ctx.lineTo(bx, cy - 30);
    ctx.moveTo(xl, yb + 4); ctx.lineTo(bx, yb + 4); ctx.lineTo(bx, cy + 6);
    ctx.stroke();
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(bx - 14, cy - 6); ctx.lineTo(bx + 14, cy - 6); ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(bx - 7, cy + 4); ctx.lineTo(bx + 7, cy + 4); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx, cy - 6);
    if (st.connected) ctx.lineTo(bx, cy - 30);
    else ctx.lineTo(bx + 14, cy - 28);
    ctx.stroke();
    ctx.fillStyle = P.ink2; ctx.font = "12px " + cssVar("--f-mono"); ctx.textAlign = "left";
    ctx.fillText(st.connected ? "U₀ = " + sU.inp.value + " V" : "Schalter offen", 12, cy + 32);
    // Voltmeter
    const vx = Math.min(w - 30, xr + 46);
    ctx.strokeStyle = P.ink3; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xr, yt - 4); ctx.lineTo(vx, yt - 4); ctx.lineTo(vx, cy - 16); ctx.moveTo(xr, yb + 4); ctx.lineTo(vx, yb + 4); ctx.lineTo(vx, cy + 16); ctx.stroke();
    ctx.fillStyle = P.surface; ctx.beginPath(); ctx.arc(vx, cy, 16, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.fillStyle = P.ink; ctx.textAlign = "center"; ctx.font = "600 13px " + cssVar("--f-mono"); ctx.textBaseline = "middle"; ctx.fillText("V", vx, cy + 1); ctx.textBaseline = "alphabetic";
    ctx.font = "12px " + cssVar("--f-mono"); ctx.fillStyle = P.ink2;
    ctx.fillText(de(s.U, 3) + " V", vx, cy + 34);
  }
  function drawQU() {
    const s = state(), r = st.ref;
    const { ctx, w, h } = fitCanvas(qu, 150);
    const P = palette();
    const L = 34, B = h - 24, T = 10, R = w - 10;
    const Umax = Math.max(500, s.U * 1.1, r ? r.U * 1.1 : 0), Qmax = Math.max(s.Q, r ? r.Q : 0, Math.max(s.C, r ? r.C : 0) * 500) * 1.1;
    ctx.strokeStyle = P.ink3; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
    ctx.fillStyle = P.ink3; ctx.font = "11px " + cssVar("--f-mono"); ctx.textAlign = "left";
    ctx.fillText("Q", L - 18, T + 8); ctx.textAlign = "right"; ctx.fillText("U", R, B + 16);
    const X = (u) => L + ((R - L) * u) / Umax, Y = (q) => B - ((B - T) * q) / Qmax;
    const line = (C, col, dash) => {
      ctx.strokeStyle = col; ctx.setLineDash(dash); ctx.lineWidth = 2;
      const uEnd = Math.min(Umax, Qmax / C);
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(uEnd), Y(C * uEnd)); ctx.stroke(); ctx.setLineDash([]);
    };
    if (r) line(r.C, P.ink3, [4, 4]);
    line(s.C, P.accent, []);
    ctx.fillStyle = P.accent;
    ctx.beginPath(); ctx.arc(X(Math.min(s.U, Umax)), Y(Math.min(s.Q, Qmax)), 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = P.ink2; ctx.textAlign = "left"; ctx.font = "11px " + cssVar("--f-mono");
    ctx.fillText("Steigung = C", L + 8, T + 10);
  }
  snap();
  watchRedraw(cv, update);
  update();
}

/* ============================================================
   3b) Trainer: Was passiert, wenn …?
   ============================================================ */
function Trainer(root, store) {
  const CHANGES = [
    { k: "d", f: 2, t: "verdoppelst den Plattenabstand" },
    { k: "d", f: 0.5, t: "halbierst den Plattenabstand" },
    { k: "A", f: 2, t: "verdoppelst die Plattenfläche" },
    { k: "A", f: 0.5, t: "halbierst die Plattenfläche" },
    { k: "e", f: 3, t: "schiebst ein Dielektrikum mit εr = 3 zwischen die Platten" },
    { k: "e", f: 1 / 3, t: "ziehst das Dielektrikum (εr = 3) wieder heraus" },
  ];
  const Q4 = [["C", "Kapazität"], ["Q", "Ladung"], ["U", "Spannung"], ["E", "Feldstärke"]];
  let sc, picks, checked, streak = store.get("streak", 0), best = store.get("best", 0), last = -1;
  const scen = el("p", { class: "scenario" });
  const grid = el("div", { class: "pred" });
  const btnRow = el("div", { class: "row" });
  const checkB = el("button", { class: "btn primary", type: "button" }, "Prüfen");
  const nextB = el("button", { class: "btn", type: "button" }, "Nächste Situation");
  const score = el("span", { class: "score" });
  const expl = el("div", { class: "insight" });
  btnRow.append(checkB, nextB, score);
  root.append(scen, grid, btnRow, expl);

  const fmtF = (f) => (Math.abs(f - 1) < 1e-9 ? "gleich" : f > 1 ? "× " + de(f, 3) : "÷ " + de(1 / f, 3));
  const dir = (f) => (Math.abs(f - 1) < 1e-9 ? 0 : f > 1 ? 1 : -1);
  function compute(s) {
    const fC = s.ch.k === "d" ? 1 / s.ch.f : s.ch.f;
    const fd = s.ch.k === "d" ? s.ch.f : 1;
    if (s.U) return { C: fC, Q: fC, U: 1, E: 1 / fd };
    return { C: fC, Q: 1, U: 1 / fC, E: 1 / fC / fd };
  }
  function explain(s, r) {
    const ln = [];
    const what = s.ch.k === "d" ? "d steht im Nenner" : s.ch.k === "A" ? "A steht im Zähler" : "εr steht im Zähler";
    ln.push(`1. ${s.U ? "Angeschlossen: <b>U bleibt</b>, die Quelle hält sie fest." : "Getrennt: <b>Q bleibt</b>, die Ladung kann nicht weg."}`);
    ln.push(`2. ${fx("C = ε_0*ε_r*{A|d}")}: ${what}, also C ${fmtF(r.C)}.`);
    if (s.U) ln.push(`3. ${fx("Q = C*U")} mit festem U: Q ${fmtF(r.Q)}.`);
    else ln.push(`3. ${fx("U = {Q|C}")} mit festem Q: U ${fmtF(r.U)}.`);
    ln.push(`4. ${fx("E = {U|d}")}: E ${fmtF(r.E)}.` + (!s.U && s.ch.k === "d" ? " U und d ändern sich im gleichen Verhältnis, deshalb bleibt E gleich." : "") + (s.U && s.ch.k !== "d" ? " U und d bleiben gleich, also auch E." : ""));
    return ln.join("<br>");
  }
  function next() {
    let i;
    do i = Math.floor(Math.random() * CHANGES.length * 2); while (i === last);
    last = i;
    sc = { U: i % 2 === 0, ch: CHANGES[Math.floor(i / 2)] };
    picks = {}; checked = false;
    scen.innerHTML = `Der Kondensator ist <b>${sc.U ? "an der Quelle angeschlossen" : "geladen und von der Quelle getrennt"}</b>. Du ${sc.ch.t}.`;
    grid.innerHTML = "";
    for (const [k, name] of Q4) {
      const card = el("div", { class: "pred-q" });
      card.innerHTML = `<div class="name">${fx(k)}<small>${name}</small></div>`;
      card.append(seg([[1, "↑"], [0, "="], [-1, "↓"]], null, (v) => (picks[k] = v), name + ": steigt, gleich oder sinkt"));
      card.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-label", ["steigt", "bleibt gleich", "sinkt"][j]));
      card.append(el("div", { class: "sol" }));
      grid.append(card);
    }
    expl.innerHTML = "";
    checkB.disabled = false;
    score.textContent = `Serie: ${streak} · Rekord: ${best}`;
  }
  function check() {
    if (checked) return;
    if (Object.keys(picks).length < 4) { expl.innerHTML = "Wähle für alle vier Größen ↑, = oder ↓."; return; }
    checked = true;
    const r = compute(sc);
    let all = true;
    [...grid.children].forEach((card, i) => {
      const k = Q4[i][0], ok = picks[k] === dir(r[k]);
      all = all && ok;
      card.classList.add(ok ? "right" : "wrong");
      card.querySelector(".sol").textContent = fmtF(r[k]);
    });
    streak = all ? streak + 1 : 0;
    best = Math.max(best, streak);
    store.set("streak", streak); store.set("best", best);
    score.textContent = `Serie: ${streak} · Rekord: ${best}`;
    expl.innerHTML = (all ? "<b>Alles richtig.</b><br>" : "<b>Noch nicht ganz.</b> So geht's:<br>") + explain(sc, r);
    checkB.disabled = true;
    root.dispatchEvent(new CustomEvent("trained", { bubbles: true, detail: { all } }));
  }
  checkB.addEventListener("click", check);
  nextB.addEventListener("click", next);
  next();
}

/* ============================================================
   4) Lade- und Entladekurven
   ============================================================ */
function RCSim(root) {
  const stage = el("div", { class: "stage" });
  const cv = el("canvas", { role: "img", "aria-label": "U-t- und I-t-Diagramm beim Laden oder Entladen eines Kondensators" });
  stage.append(cv);
  const ctl = el("div", { class: "controls" });
  let mode = "laden", tmax = 10, ghost = null, showHalf = true, showArea = false;
  const logR = (v) => Math.round(100 * Math.pow(100, v / 100));
  const logC = (v) => 100e-6 * Math.pow(100, v / 100);
  const modeSeg = seg([["laden", "Laden (Stellung 1)"], ["entladen", "Entladen (Stellung 2)"]], mode, (v) => { mode = v; play(); }, "Vorgang");
  const sU = slider("rc-u", "Spannung U₀", 1, 12, 1, 10, (v) => v + " V");
  const sR = slider("rc-r", "Widerstand R", 0, 100, 1, 50, (v) => pre(logR(v), "Ω"));
  const sC = slider("rc-c", "Kapazität C", 0, 100, 1, 50, (v) => pre(logC(v), "F"));
  const axis = el("div", { class: "ctl" }, "<label><span>Zeitachse</span></label>");
  axis.append(seg([[1, "0–1 s"], [10, "0–10 s"], [100, "0–100 s"]], tmax, (v) => { tmax = v; play(); }, "Zeitachse"));
  const tg = el("div", { class: "row" });
  const half = el("label", { class: "switch" }, `<input type="checkbox" id="rc-half" checked> Halbwertszeit`);
  const area = el("label", { class: "switch" }, `<input type="checkbox" id="rc-area"> Fläche = Ladung`);
  tg.append(half, area);
  const ro = el("div", { class: "readout" });
  const ins = el("div", { class: "insight" });
  const gRow = el("div", { class: "row" });
  const gB = el("button", { class: "btn small", type: "button" }, "Als Vergleichskurve merken");
  const gX = el("button", { class: "btn small ghost", type: "button" }, "Vergleich löschen");
  gRow.append(gB, gX);
  ctl.append(modeSeg, sU.wrap, sR.wrap, sC.wrap, axis, tg, ro, gRow, ins);
  root.append(stage, ctl);

  const params = () => { const U0 = +sU.inp.value, R = logR(+sR.inp.value), C = logC(+sC.inp.value); return { U0, R, C, tau: R * C, I0: U0 / R }; };
  function readouts() {
    const p = params();
    ro.innerHTML = [
      ["I₀ = U₀/R", pre(p.I0, "A")], ["R·C", de(p.tau, 3) + " s"],
      ["t½ = R·C·ln 2", de(p.tau * Math.LN2, 3) + " s"], ["Q = C·U₀", pre(p.C * p.U0, "C")],
    ].map(([k, v]) => `<div><span class="k">${k}</span><span class="v">${v}</span></div>`).join("");
    if (ghost) {
      const fT = p.tau / ghost.tau, fI = p.I0 / ghost.I0, fQ = (p.C * p.U0) / (ghost.C * ghost.U0);
      const w = (f) => (Math.abs(f - 1) < 0.01 ? "gleich" : f > 1 ? de(f, 2) + "-mal so groß" : de(1 / f, 2) + "-mal so klein");
      ins.innerHTML = `Gegenüber der gestrichelten Vergleichskurve: R·C ist ${w(fT)}${Math.abs(fT - 1) >= 0.01 ? (fT > 1 ? ", der Vorgang läuft langsamer" : ", der Vorgang läuft schneller") : ""}. Anfangsstrom ${w(fI)}, Ladung (Fläche) ${w(fQ)}.`;
    } else {
      ins.innerHTML = p.tau * 5 > tmax ? "Die Kurve ist am Ende der Zeitachse noch nicht fertig. Wähl eine längere Zeitachse oder kleinere Werte." : p.tau * 40 < tmax ? "Sehr schneller Vorgang. Wähl eine kürzere Zeitachse, um die Kurve zu sehen." : "Merk dir eine Kurve als Vergleich und verändere dann R oder C.";
    }
  }
  let t0 = 0, raf = 0;
  function play() {
    readouts();
    cancelAnimationFrame(raf);
    t0 = performance.now();
    const tick = (now) => { const f = reduceMotion() ? 1 : Math.min(1, (now - t0) / 1400); draw(f); if (f < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }
  [sU, sR, sC].forEach((s) => s.inp.addEventListener("input", () => { readouts(); draw(1); }));
  half.querySelector("input").addEventListener("change", (e) => { showHalf = e.target.checked; draw(1); });
  area.querySelector("input").addEventListener("change", (e) => { showArea = e.target.checked; draw(1); });
  gB.addEventListener("click", () => { ghost = params(); readouts(); draw(1); });
  gX.addEventListener("click", () => { ghost = null; readouts(); draw(1); });

  function draw(frac) {
    const p = params();
    const { ctx, w, h } = fitCanvas(cv, 420);
    const P = palette();
    const L = 52, R = w - 14, T1 = 22, B1 = h * 0.44, T2 = h * 0.54, B2 = h - 30;
    const X = (t) => L + ((R - L) * t) / tmax;
    const Imax = Math.max(p.I0, ghost ? ghost.I0 : 0) * 1.15;
    const Y1 = (u) => B1 - ((B1 - T1) * u) / 12;
    const mid2 = (T2 + B2) / 2;
    const Y2 = (i) => mid2 - ((B2 - T2) / 2) * (i / Imax);
    // Millimeterpapier
    const grid = (top, bot) => {
      for (let k = 0; k <= 50; k++) {
        const x = L + ((R - L) * k) / 50;
        ctx.strokeStyle = k % 5 === 0 ? P.grid2 : P.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke();
      }
      const n = Math.round((bot - top) / ((R - L) / 50));
      for (let k = 0; k <= n; k++) {
        const y = bot - ((bot - top) * k) / n;
        ctx.strokeStyle = k % 5 === 0 ? P.grid2 : P.grid;
        ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();
      }
    };
    grid(T1, B1); grid(T2, B2);
    ctx.strokeStyle = P.ink2; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(L, T1); ctx.lineTo(L, B1); ctx.lineTo(R, B1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(L, T2); ctx.lineTo(L, B2); ctx.moveTo(L, mid2); ctx.lineTo(R, mid2); ctx.stroke();
    ctx.fillStyle = P.ink2; ctx.font = "12px " + cssVar("--f-mono");
    ctx.textAlign = "right";
    for (const u of [0, 4, 8, 12]) ctx.fillText(u + " V", L - 6, Y1(u) + 4);
    ctx.fillText(pre(Imax / 1.15, "A", 2), L - 6, Y2(Imax / 1.15) + 4);
    ctx.fillText("0", L - 6, mid2 + 4);
    ctx.fillText("−" + pre(Imax / 1.15, "A", 2), L - 6, Y2(-Imax / 1.15) + 4);
    ctx.textAlign = "center";
    for (let k = 0; k <= 5; k++) ctx.fillText(de((tmax * k) / 5, 3) + (k === 5 ? " s" : ""), X((tmax * k) / 5), B2 + 18);
    ctx.textAlign = "left"; ctx.fillStyle = P.ink;
    ctx.font = "600 13px " + cssVar("--f-mono");
    ctx.fillText("U_C(t)", L + 8, T1 + 14);
    ctx.fillText("I(t)", L + 8, T2 + 14);
    const fU = (q, t) => (mode === "laden" ? q.U0 * (1 - Math.exp(-t / q.tau)) : q.U0 * Math.exp(-t / q.tau));
    const fI = (q, t) => (mode === "laden" ? 1 : -1) * q.I0 * Math.exp(-t / q.tau);
    const N = 400;
    const curve = (fn, Y, col, dash, f) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.setLineDash(dash);
      ctx.beginPath();
      const tEnd = tmax * f;
      ctx.moveTo(X(0), Y(fn(0)));
      for (let k = 1; k <= N; k++) { const t = (tEnd * k) / N; ctx.lineTo(X(t), Y(fn(t))); }
      ctx.stroke(); ctx.setLineDash([]);
    };
    if (showArea) {
      ctx.fillStyle = P.accentSoft;
      ctx.beginPath(); ctx.moveTo(X(0), mid2);
      for (let k = 0; k <= N; k++) { const t = (tmax * frac * k) / N; ctx.lineTo(X(t), Y2(fI(p, t))); }
      ctx.lineTo(X(tmax * frac), mid2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.accent; ctx.font = "12px " + cssVar("--f-mono"); ctx.textAlign = "left";
      ctx.fillText("Fläche = Q = " + pre(p.C * p.U0, "C"), X(tmax * 0.55), mode === "laden" ? mid2 - 8 : mid2 + 18);
    }
    if (ghost) {
      curve((t) => fU(ghost, t), Y1, P.ink3, [5, 5], 1);
      curve((t) => fI(ghost, t), Y2, P.ink3, [5, 5], 1);
    }
    curve((t) => fU(p, t), Y1, P.accent, [], frac);
    curve((t) => fI(p, t), Y2, P.plus, [], frac);
    // Sprung des Stroms bei t = 0 sichtbar machen
    ctx.strokeStyle = P.plus; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(X(0), mid2); ctx.lineTo(X(0), Y2(fI(p, 0))); ctx.stroke();
    if (showHalf && frac === 1) {
      const th = p.tau * Math.LN2;
      if (th < tmax) {
        ctx.setLineDash([3, 4]); ctx.strokeStyle = P.ok; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X(th), T1); ctx.lineTo(X(th), B2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(L, Y1(p.U0 / 2)); ctx.lineTo(X(th), Y1(p.U0 / 2)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(L, Y2(fI(p, 0) / 2)); ctx.lineTo(X(th), Y2(fI(p, 0) / 2)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = P.ok; ctx.font = "12px " + cssVar("--f-mono"); ctx.textAlign = "left";
        ctx.fillText("t½ = " + de(th, 3) + " s", X(th) + 5, B1 - 6);
      }
    }
  }
  watchRedraw(cv, () => draw(1));
  play();
}
