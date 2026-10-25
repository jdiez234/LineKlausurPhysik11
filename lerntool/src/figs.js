/* ============================================================
   Statische Abbildungen (SVG), Farben über CSS-Klassen
   ============================================================ */
function svgPlot(o) {
  const w = o.w || 560, h = o.h || 300, L = o.L || 56, R = 18, T = 18, B = 40;
  const [x0, x1] = o.x, [y0, y1] = o.y;
  const X = (x) => L + ((w - L - R) * (x - x0)) / (x1 - x0);
  const Y = (y) => h - B - ((h - B - T) * (y - y0)) / (y1 - y0);
  let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${o.aria || "Diagramm"}">`;
  if (o.mm) {
    const nx = o.mm[0], ny = o.mm[1];
    for (let i = 0; i <= nx; i++) { const x = L + ((w - L - R) * i) / nx; s += `<line class="${i % 5 ? "sv-grid" : "sv-grid2"}" x1="${x}" y1="${T}" x2="${x}" y2="${h - B}"/>`; }
    for (let j = 0; j <= ny; j++) { const y = h - B - ((h - B - T) * j) / ny; s += `<line class="${j % 5 ? "sv-grid" : "sv-grid2"}" x1="${L}" y1="${y}" x2="${w - R}" y2="${y}"/>`; }
  }
  const zeroY = y0 < 0 && y1 > 0 ? Y(0) : h - B;
  s += `<line class="sv-ax" x1="${L}" y1="${T - 6}" x2="${L}" y2="${h - B}"/><line class="sv-ax" x1="${L}" y1="${zeroY}" x2="${w - R + 4}" y2="${zeroY}"/>`;
  for (const [v, t] of o.xt || []) s += `<line class="sv-ax" x1="${X(v)}" y1="${zeroY}" x2="${X(v)}" y2="${zeroY + 4}"/><text class="sv-t" x="${X(v)}" y="${h - B + 18}" text-anchor="middle">${t}</text>`;
  for (const [v, t] of o.yt || []) s += `<line class="sv-ax" x1="${L - 4}" y1="${Y(v)}" x2="${L}" y2="${Y(v)}"/><text class="sv-t" x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${t}</text>`;
  if (o.xl) s += `<text class="sv-t sv-b" x="${w - R}" y="${h - 6}" text-anchor="end">${o.xl}</text>`;
  if (o.yl) s += `<text class="sv-t sv-b" x="${L + 6}" y="${T + 4}">${o.yl}</text>`;
  for (const c of o.curves || []) {
    const n = c.n || 240, pts = [];
    const a = c.from ?? x0, b = c.to ?? x1;
    for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; pts.push(`${X(x).toFixed(1)},${Y(c.f(x)).toFixed(1)}`); }
    s += `<polyline class="sv-line ${c.cls || "sv-c1"}" points="${pts.join(" ")}"/>`;
  }
  for (const l of o.segs || []) s += `<line class="sv-line ${l.cls || "sv-c1"}" x1="${X(l.a[0])}" y1="${Y(l.a[1])}" x2="${X(l.b[0])}" y2="${Y(l.b[1])}"/>`;
  for (const p of o.pts || []) s += `<circle class="sv-pt" cx="${X(p[0])}" cy="${Y(p[1])}" r="4"/>`;
  for (const t of o.labels || []) s += `<text class="sv-t ${t.cls || ""}" x="${X(t.x)}" y="${Y(t.y)}" text-anchor="${t.a || "start"}">${t.t}</text>`;
  return s + "</svg>";
}

const FIGS = {
  qu: () => svgPlot({
    aria: "Q-U-Diagramm mit zwei Ursprungsgeraden A und B", w: 420, h: 260, x: [0, 10], y: [0, 10],
    xl: "U", yl: "Q", segs: [{ a: [0, 0], b: [5.4, 9.6], cls: "sv-c1" }, { a: [0, 0], b: [10, 5.2], cls: "sv-c2" }],
    labels: [{ x: 5.5, y: 9.1, t: "A", cls: "sv-b" }, { x: 9.4, y: 5.6, t: "B", cls: "sv-b" }],
  }),
  messreihe: () => svgPlot({
    aria: "Feldstärke über Spannung mit Ursprungsgerade", w: 520, h: 300, x: [0, 26], y: [0, 340],
    xl: "U in kV", yl: "E in kN/C", xt: [[5, "5"], [10, "10"], [15, "15"], [20, "20"], [25, "25"]], yt: [[100, "100"], [200, "200"], [300, "300"]],
    segs: [{ a: [0, 0], b: [26, 325], cls: "sv-c3 sv-dash" }],
    pts: [[0, 0], [5, 62.5], [10, 133.3], [15, 183.3], [20, 250], [25, 316.7]],
    labels: [{ x: 15.5, y: 260, t: "E = U/d mit d = 0,08 m", cls: "sv-ok" }],
  }),
  zuordnung: () => svgPlot({
    aria: "Drei Ladekurven mit unterschiedlicher Kapazität", w: 560, h: 290, x: [0, 40], y: [0, 11],
    xl: "t in s", yl: "U_C in V", xt: [[10, "10"], [20, "20"], [30, "30"], [40, "40"]], yt: [[5, "5"], [10, "10"]],
    curves: [
      { f: (t) => 10 * (1 - Math.exp(-t / 1)), cls: "sv-c1", n: 400 },
      { f: (t) => 10 * (1 - Math.exp(-t / 0.1)), cls: "sv-c2", n: 800 },
      { f: (t) => 10 * (1 - Math.exp(-t / 10)), cls: "sv-c3" },
    ],
    labels: [{ x: 3.2, y: 8.2, t: "①", cls: "sv-b" }, { x: 0.6, y: 10.3, t: "②", cls: "sv-b" }, { x: 14, y: 6.3, t: "③", cls: "sv-b" }],
  }),
  kaestchen: () => svgPlot({
    aria: "Entladestrom auf Millimeterpapier", w: 560, h: 275, L: 50, x: [0, 2.5], y: [0, 1.1], mm: [25, 11],
    xl: "t in s", yl: "I in A", xt: [[0.5, "0,5"], [1, "1,0"], [1.5, "1,5"], [2, "2,0"], [2.5, "2,5"]], yt: [[0.5, "0,5"], [1, "1,0"]],
    curves: [{ f: (t) => Math.exp(-t / 0.45), cls: "sv-c2" }],
  }),
  fuellstand: () => svgPlot({
    aria: "Kapazität über Füllstand, linear von 48 pF bis 120 pF", w: 520, h: 300, x: [0, 90], y: [0, 130],
    xl: "x in cm", yl: "C in pF", xt: [[20, "20"], [40, "40"], [60, "60"], [85.3, "h"]], yt: [[48, "48"], [86, "86"], [120, "120"]],
    segs: [{ a: [0, 48], b: [85.3, 120], cls: "sv-c1" }, { a: [0, 86], b: [45, 86], cls: "sv-c3 sv-dash" }, { a: [45, 86], b: [45, 0], cls: "sv-c3 sv-dash" }],
    labels: [{ x: 46, y: 6, t: "x ≈ 45 cm", cls: "sv-ok" }],
  }),
  ladeMini: () => miniPair(true),
  entladeMini: () => miniPair(false),
  skizze: () => {
    const tau = 0.7, U = (t) => (t < 5 ? Math.exp(-t / tau) : 1 - Math.exp(-(t - 5) / tau)), I = (t) => (t < 5 ? -Math.exp(-t / tau) : Math.exp(-(t - 5) / tau));
    const a = svgPlot({ aria: "Spannung beim Entladen und Laden", w: 560, h: 200, x: [0, 10], y: [0, 1.2], xl: "t", yl: "U_C", yt: [[1, "U₀"]],
      curves: [{ f: U, from: 0, to: 4.99, cls: "sv-c1" }, { f: U, from: 5, to: 10, cls: "sv-c1" }],
      labels: [{ x: 1.2, y: 1.08, t: "Entladen" }, { x: 6.2, y: 1.08, t: "Laden" }] });
    const b = svgPlot({ aria: "Stromstärke beim Entladen und Laden", w: 560, h: 240, x: [0, 10], y: [-1.2, 1.2], xl: "t", yl: "I", yt: [[1, "I₀"], [-1, "−I₀"]],
      curves: [{ f: I, from: 0.001, to: 4.99, cls: "sv-c2" }, { f: I, from: 5.001, to: 10, cls: "sv-c2" }],
      segs: [{ a: [0, 0], b: [0.001, -1], cls: "sv-c2" }, { a: [5, 0], b: [5.001, 1], cls: "sv-c2" }] });
    return a + b;
  },
  schaltung: () => `<svg viewBox="0 0 520 220" width="520" role="img" aria-label="Schaltplan: Quelle, Umschalter, Ladewiderstand R1, Kondensator, Entladewiderstand R2, Voltmeter, Amperemeter">
<g class="sv-wire">
<path d="M40 40 V96 M40 116 V180 H430 V130 M40 40 H90 M150 40 H206 M294 40 H430 V80 M250 70 V104 M250 116 V140 M250 164 V180 M250 98 H330 V104 M330 128 V134 H250"/>
</g>
<line class="sv-wire" x1="22" y1="96" x2="58" y2="96" style="stroke-width:2.5"/>
<line class="sv-wire" x1="30" y1="106" x2="50" y2="106" style="stroke-width:6"/>
<rect class="sv-box" x="90" y="31" width="60" height="18" rx="2"/>
<rect class="sv-box" x="421" y="80" width="18" height="50" rx="2"/>
<line class="sv-wire" x1="228" y1="104" x2="272" y2="104" style="stroke-width:3"/>
<line class="sv-wire" x1="228" y1="116" x2="272" y2="116" style="stroke-width:3"/>
<circle class="sv-box" cx="250" cy="152" r="12"/><text class="sv-t sv-b" x="250" y="156" text-anchor="middle">A</text>
<circle class="sv-box" cx="330" cy="116" r="12"/><text class="sv-t sv-b" x="330" y="120" text-anchor="middle">V</text>
<circle class="sv-dot" cx="210" cy="40" r="3.5"/><circle class="sv-dot" cx="290" cy="40" r="3.5"/><circle class="sv-dot" cx="250" cy="70" r="3.5"/>
<line class="sv-wire" x1="250" y1="70" x2="213" y2="44" style="stroke-width:2.2"/>
<line class="sv-wire sv-dash" x1="250" y1="70" x2="287" y2="44"/>
<text class="sv-t sv-b" x="204" y="28" text-anchor="middle">1</text><text class="sv-t sv-b" x="296" y="28" text-anchor="middle">2</text>
<text class="sv-t" x="120" y="66" text-anchor="middle">R₁ (Laden)</text><text class="sv-t" x="448" y="110">R₂</text>
<text class="sv-t" x="210" y="114" text-anchor="end">C</text>
<text class="sv-t" x="64" y="104">U₀</text><text class="sv-t" x="14" y="92">+</text><text class="sv-t" x="14" y="118">−</text>
</svg>`,
};
function miniPair(laden) {
  const U = (t) => (laden ? 1 - Math.exp(-t) : Math.exp(-t)), I = (t) => (laden ? 1 : -1) * Math.exp(-t);
  const a = svgPlot({ aria: laden ? "Spannung steigt beim Laden" : "Spannung fällt beim Entladen", w: 270, h: 170, L: 36, x: [0, 5], y: [0, 1.2], xl: "t", yl: "U_C", yt: [[1, "U₀"]], curves: [{ f: U, cls: "sv-c1" }] });
  const b = svgPlot({
    aria: laden ? "Strom fällt beim Laden" : "Strom ist beim Entladen negativ", w: 270, h: 170, L: 36, x: [0, 5], y: laden ? [0, 1.2] : [-1.2, 0.3], xl: "t", yl: "I",
    yt: laden ? [[1, "I₀"]] : [[-1, "−I₀"]], curves: [{ f: I, from: 0.001, cls: "sv-c2" }], segs: [{ a: [0, 0], b: [0.001, laden ? 1 : -1], cls: "sv-c2" }],
  });
  return `<div class="pair">${a}${b}</div>`;
}
