/* ============================================================
   Speicher (pro Gerät, optional)
   ============================================================ */
const store = (() => {
  const KEY = "feld-kondensator-v1";
  let data = {};
  try { data = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { data = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ohne Speicher weiter */ } };
  const api = {
    get: (k, d) => (k in data ? data[k] : d),
    set: (k, v) => { data[k] = v; save(); },
    map: (k) => data[k] || (data[k] = {}),
    mark: (k, id, v) => { const m = api.map(k); if (v === undefined || v === null) delete m[id]; else m[id] = v; save(); },
    ns: (p) => ({ get: (k, d) => api.get(p + "." + k, d), set: (k, v) => api.set(p + "." + k, v) }),
  };
  return api;
})();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plain = (html) => { const d = document.createElement("div"); d.innerHTML = html; return d.textContent.replace(/\s+/g, " ").trim(); };

/* ============================================================
   Fortschritt
   ============================================================ */
function stationProgress(s) {
  const steps = store.map("steps"), tasks = store.map("tasks");
  const total = s.steps.length + s.tasks.length;
  const done = s.steps.filter((x) => steps[x.id]).length + s.tasks.filter((t) => tasks[t.id] === "sicher").length;
  return { done, total, f: total ? done / total : 0 };
}
function refreshProgress() {
  for (const s of STATIONS) {
    const p = stationProgress(s);
    $$(`[data-prog="${s.id}"]`).forEach((b) => (b.style.width = Math.round(p.f * 100) + "%"));
    $$(`[data-progt="${s.id}"]`).forEach((t) => (t.textContent = `${p.done} von ${p.total} erledigt`));
    $$(`[data-dot="${s.id}"]`).forEach((d) => { d.className = "dot" + (p.f >= 1 ? " done" : p.f > 0 ? " part" : ""); });
  }
}

/* ============================================================
   Navigation
   ============================================================ */
const VIEWS = ["start", ...STATIONS.map((s) => s.id), "formeln", "karten"];
const VIEW_TITLES = { start: "Start", formeln: "Formelkarte", karten: "Karteikarten" };
function show(id, anchor) {
  if (id === "trainer") { id = "kondensator"; anchor = "trainer"; }
  if (!VIEWS.includes(id)) id = "start";
  $$(".view").forEach((v) => (v.hidden = v.id !== "v-" + id));
  $$(".tab").forEach((t) => t.setAttribute("aria-current", String(t.dataset.go === id)));
  store.set("view", id);
  currentView = id;
  const tab = $(`.tab[data-go="${id}"]`);
  if (tab && tab.scrollIntoView) tab.scrollIntoView({ block: "nearest", inline: "nearest" });
  if (anchor) {
    requestAnimationFrame(() => { const a = document.getElementById(anchor); if (a) a.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); });
  } else window.scrollTo(0, 0);
  updateSuggestions();
}
let currentView = "start";
document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-go]");
  if (g) { e.preventDefault(); show(g.dataset.go, g.dataset.anchor); }
});

/* ============================================================
   Bausteine
   ============================================================ */
function afbChip(n) {
  const t = { 1: "AFB 1 · wiedergeben", 2: "AFB 2 · anwenden", 3: "AFB 3 · begründen" }[n];
  return `<span class="chip afb${n}" title="Anforderungsbereich ${n}">${t}</span>`;
}

function renderCheck(step, onRight) {
  const c = step.check;
  const box = el("div", { class: "mc" });
  box.innerHTML = `<div class="mc-q"><span class="eyebrow">Mini-Check</span>${esc(c.q)}</div>`;
  const opts = el("div", { class: "mc-opts" });
  c.options.forEach((o) => {
    const b = el("button", { class: "mc-opt", type: "button" }, `<span>${esc(o.t)}</span><span class="why"></span>`);
    b.addEventListener("click", () => {
      b.classList.add(o.ok ? "right" : "wrong");
      b.querySelector(".why").textContent = o.why || "";
      if (o.ok) {
        onRight();
        $$(".mc-opt", opts).forEach((x) => (x.disabled = true));
      }
    });
    opts.append(b);
  });
  box.append(opts);
  return box;
}

function renderStep(step, i, station) {
  const done = !!store.map("steps")[step.id];
  const wrap = el("article", { class: "step" + (done ? " done" : ""), id: "step-" + step.id });
  wrap.innerHTML = `<div class="step-n" aria-hidden="true">${i + 1}</div>`;
  const body = el("div", { class: "step-body" });
  body.innerHTML = `<h3>${esc(step.title)} ${step.top ? '<span class="chip top">Top-Note</span>' : ""}</h3><div class="prose">${step.body}</div>`;
  const markDone = () => { store.mark("steps", step.id, true); wrap.classList.add("done"); refreshProgress(); };
  if (step.check) body.append(renderCheck(step, markDone));
  else {
    const b = el("button", { class: "btn small", type: "button" }, done ? "Verstanden ✓" : "Als verstanden markieren");
    b.addEventListener("click", () => { markDone(); b.textContent = "Verstanden ✓"; });
    body.append(b);
  }
  // KI: anders erklären
  const aiRow = el("div", { class: "row ai-only", hidden: "" });
  const aiB = el("button", { class: "btn small ghost", type: "button" }, "Erklär mir das anders");
  const aiOut = el("div", { class: "ai-out" });
  aiRow.append(aiB);
  body.append(aiRow, aiOut);
  aiB.addEventListener("click", () =>
    askOnce(aiB, aiOut,
      `${TUTOR_RULES}\n\nAufgabe: Erkläre den folgenden Lernschritt aus der Station „${station.title}“ noch einmal anders als im Text, mit einem anschaulichen Vergleich aus dem Alltag. Höchstens 120 Wörter. Ende mit einer kurzen Kontrollfrage.\n\nLernschritt „${step.title}“:\n${plain(step.body).slice(0, 2500)}`));
  wrap.append(body);
  $$(".fig[data-fig]", body).forEach((f) => (f.innerHTML = FIGS[f.dataset.fig]()));
  return wrap;
}

function parseNum(s) {
  const sup = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  s = String(s).trim().replace(/\s+/g, "").replace(/−/g, "-").replace(/,/g, ".").replace(/[·×xX*]/g, "*");
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => "^" + m.split("").map((c) => (c === "⁻" ? "-" : sup.indexOf(c))).join(""));
  let m = s.match(/^([+-]?\d*\.?\d+)(?:\*?10\^\(?([+-]?\d+)\)?)?$/);
  if (m) return parseFloat(m[1]) * Math.pow(10, m[2] ? +m[2] : 0);
  m = s.match(/^[+-]?\d*\.?\d+e[+-]?\d+$/i);
  if (m) return parseFloat(s);
  return NaN;
}

function renderAnswers(task, onAllRight) {
  const box = el("div", { class: "answers" });
  box.style.display = "grid"; box.style.gap = "8px";
  let right = 0;
  task.answers.forEach((a, i) => {
    const id = `${task.id}-a${i}`;
    const row = el("div", { class: "answer" });
    row.innerHTML = `<label for="${id}" class="small" style="min-width:9ch">${esc(a.label)}</label>
<input type="text" id="${id}" inputmode="decimal" autocomplete="off" placeholder="z. B. 2,5·10^-3">
<span class="unit">${esc(a.unit)}</span><button class="btn small" type="button">Prüfen</button><span class="fb" aria-live="polite"></span>`;
    const inp = $("input", row), fb = $(".fb", row), b = $("button", row);
    let solved = false;
    const check = () => {
      const v = parseNum(inp.value);
      if (!isFinite(v)) { fb.className = "fb no"; fb.textContent = "Schreib eine Zahl, z. B. 3,2·10^-4 oder 3,2e-4."; return; }
      const tol = a.tol || 0.03;
      const rel = Math.abs(v - a.value) / Math.abs(a.value);
      if (rel <= tol) {
        fb.className = "fb ok"; fb.textContent = "Richtig ✓";
        if (!solved) { solved = true; right++; if (right === task.answers.length) onAllRight(); }
        return;
      }
      const k = Math.round(Math.log10(Math.abs(v / a.value)));
      const relK = Math.abs(v / Math.pow(10, k) - a.value) / Math.abs(a.value);
      fb.className = "fb no";
      if (k !== 0 && relK <= tol) fb.textContent = `Fast: Du liegst genau um den Faktor 10${String(k).split("").map((c) => SUPS[c]).join("")} daneben. Prüf Präfixe und Einheiten.`;
      else if (Math.abs(Math.abs(v) - Math.abs(a.value)) / Math.abs(a.value) <= tol) fb.textContent = "Der Betrag stimmt, das Vorzeichen nicht.";
      else fb.textContent = "Noch nicht. Schau dir den nächsten Tipp an.";
    };
    b.addEventListener("click", check);
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
    box.append(row);
  });
  return box;
}

function renderParts(task) {
  const box = el("div", { class: "answers" });
  box.style.display = "grid"; box.style.gap = "10px";
  const sels = task.parts.map((p, i) => {
    const id = `${task.id}-p${i}`;
    const row = el("div", { class: "answer cloze" });
    row.innerHTML = `<label for="${id}">${esc(p.q)}</label><select id="${id}"><option value="">bitte wählen</option>${p.options.map((o, j) => `<option value="${j}">${esc(o)}</option>`).join("")}</select><span class="fb" aria-live="polite"></span>`;
    box.append(row);
    return { s: $("select", row), fb: $(".fb", row), p };
  });
  const b = el("button", { class: "btn small", type: "button" }, "Auswahl prüfen");
  b.addEventListener("click", () => {
    for (const { s, fb, p } of sels) {
      if (s.value === "") { s.className = ""; fb.textContent = ""; continue; }
      const ok = +s.value === p.ok;
      s.className = ok ? "ok" : "no";
      fb.className = "fb " + (ok ? "ok" : "no");
      fb.textContent = ok ? "✓" : "✗";
    }
  });
  box.append(el("div", { class: "row" }));
  box.lastChild.append(b);
  return box;
}

function renderCloze(task) {
  const box = el("div", { class: "cloze" });
  const p = el("p");
  const sels = [];
  task.cloze.forEach((part) => {
    if (typeof part === "string") p.append(document.createTextNode(part));
    else {
      const order = part.map((t, j) => j).sort(() => Math.random() - 0.5);
      const s = el("select", { "aria-label": "Lücke " + (sels.length + 1), id: `${task.id}-c${sels.length}` }, `<option value="">…</option>${order.map((j) => `<option value="${j}">${esc(part[j])}</option>`).join("")}`);
      sels.push(s);
      p.append(s);
    }
  });
  const b = el("button", { class: "btn small", type: "button" }, "Lückentext prüfen");
  const fb = el("span", { class: "small muted", "aria-live": "polite" });
  b.addEventListener("click", () => {
    let ok = 0;
    sels.forEach((s) => { const r = s.value === "0"; s.className = s.value === "" ? "" : r ? "ok" : "no"; if (r) ok++; });
    fb.textContent = `${ok} von ${sels.length} richtig.`;
  });
  const row = el("div", { class: "row" });
  row.append(b, fb);
  box.append(p, row);
  return box;
}

function renderCrit(crit, idp) {
  const ul = el("ul", { class: "crit" });
  crit.forEach((c, i) => {
    const li = el("li");
    li.innerHTML = `<input type="checkbox" id="${idp}-k${i}"><label for="${idp}-k${i}">${esc(c.t)}</label><span class="pt">${c.p} P.</span>`;
    ul.append(li);
  });
  const sum = el("p", { class: "small muted" });
  const upd = () => {
    const got = crit.reduce((a, c, i) => a + ($(`#${CSS.escape(idp)}-k${i}`, ul).checked ? c.p : 0), 0);
    const max = crit.reduce((a, c) => a + c.p, 0);
    sum.textContent = `Selbstcheck: ${got} von ${max} Punkten`;
  };
  ul.addEventListener("change", upd);
  upd();
  return { ul, sum };
}

function fieldFigures(list) {
  const names = { dipol: "Zwei ungleichnamige Ladungen", platten: "Plattenkondensator", zylinder: "Zylinderkondensator (Draufsicht)", punkt: "Punktladung" };
  const box = el("div", { class: "field-reveal" });
  [].concat(list).forEach((n) => {
    const f = el("figure");
    box.append(f);
    FieldSim(f, { preset: n, controls: false, height: 260, caption: names[n] });
  });
  return box;
}

function renderTask(task, station) {
  const art = el("article", { class: "task", id: "task-" + task.id, "data-afb": task.afb });
  art.innerHTML = `<div class="task-top"><h4>${esc(task.title)}</h4>${afbChip(task.afb)}</div>${task.src ? `<p class="src">${esc(task.src)}</p>` : ""}`;
  const body = el("div", { class: "body" }, task.text || "");
  if (task.fig) body.append(el("div", { class: "fig" }, FIGS[task.fig]()));
  art.append(body);
  const rate = (v) => { store.mark("tasks", task.id, v); refreshProgress(); };
  if (task.answers) art.append(renderAnswers(task, () => { if (!store.map("tasks")[task.id]) { rate("sicher"); syncRate(); } }));
  if (task.parts) art.append(renderParts(task));
  if (task.type === "cloze") art.append(renderCloze(task));

  if (task.reason) {
    const id = task.id + "-txt";
    const r = el("div", { class: "body" });
    r.innerHTML = `<label for="${id}" class="small muted">${esc(task.reason.prompt)} (schriftlich, wie in der Klausur)</label>`;
    const ta = el("textarea", { id, placeholder: "Schreib deine Begründung in ganzen Sätzen …" });
    ta.value = store.map("drafts")[task.id] || "";
    ta.addEventListener("input", () => store.mark("drafts", task.id, ta.value || null));
    r.append(ta);
    const { ul, sum } = renderCrit(task.reason.crit, task.id);
    const det = el("details");
    det.innerHTML = `<summary>Erwartungshorizont: selbst bewerten</summary>`;
    const inner = el("div");
    inner.append(el("p", { class: "small muted" }, "Hak ab, was in deiner Antwort wirklich steht."), ul, sum);
    det.append(inner);
    const aiRow = el("div", { class: "row ai-only", hidden: "" });
    const aiB = el("button", { class: "btn small", type: "button" }, "Von Claude bewerten lassen");
    const aiOut = el("div", { class: "ai-out" });
    aiRow.append(aiB);
    aiB.addEventListener("click", () => gradeAnswer(task, ta, ul, aiB, aiOut, det));
    r.append(aiRow, aiOut);
    art.append(r, det);
  }

  if (task.hints && task.hints.length) {
    const det = el("details");
    det.innerHTML = `<summary>Tipps (${task.hints.length})</summary>`;
    const inner = el("div");
    let shown = 0;
    const more = el("button", { class: "btn small ghost", type: "button" }, "Nächster Tipp");
    const showNext = () => {
      if (shown < task.hints.length) inner.insertBefore(el("p", {}, `<b>Tipp ${shown + 1}:</b> ${task.hints[shown]}`), more);
      shown++;
      if (shown >= task.hints.length) more.hidden = true;
    };
    inner.append(more);
    more.addEventListener("click", showNext);
    det.addEventListener("toggle", () => { if (det.open && shown === 0) showNext(); });
    det.append(inner);
    art.append(det);
  }

  if (task.type === "sketch") {
    const det = el("details");
    det.innerHTML = `<summary>Lösung aufdecken und vergleichen</summary>`;
    const inner = el("div");
    det.addEventListener("toggle", () => {
      if (!det.open || inner.childElementCount) return;
      if (task.field) inner.append(fieldFigures(task.field));
      if (task.solFig) inner.append(el("div", { class: "fig" }, FIGS[task.solFig]()));
      const { ul, sum } = renderCrit(task.crit, task.id);
      inner.append(el("p", { class: "small muted" }, "Hat deine Skizze das alles?"), ul, sum);
    });
    det.append(inner);
    art.append(det);
  } else if (task.solution) {
    const det = el("details");
    det.innerHTML = `<summary>Lösungsweg anzeigen</summary>`;
    const inner = el("div");
    det.addEventListener("toggle", () => {
      if (!det.open || inner.childElementCount) return;
      inner.append(el("ol", { class: "sol-steps" }, task.solution.map((s) => `<li>${s}</li>`).join("")));
      if (task.solFig) inner.append(el("div", { class: "fig" }, FIGS[task.solFig]()));
      if (task.field) inner.append(fieldFigures(task.field));
    });
    det.append(inner);
    art.append(det);
  }

  const sr = el("div", { class: "selfrate" });
  sr.append(el("span", {}, "Wie lief's?"));
  let segEl;
  const syncRate = () => {
    const v = store.map("tasks")[task.id] || null;
    $$("button", segEl).forEach((b, i) => b.setAttribute("aria-pressed", String((i === 0 && v === "sicher") || (i === 1 && v === "nochmal"))));
  };
  segEl = seg([["sicher", "Sitzt"], ["nochmal", "Nochmal üben"]], store.map("tasks")[task.id] || null, (v) => rate(v), "Selbsteinschätzung");
  sr.append(segEl);
  const tutorB = el("button", { class: "btn small ghost ai-only", type: "button", hidden: "" }, "Tutor zu dieser Aufgabe fragen");
  tutorB.addEventListener("click", () => openTutor(`Ich hänge bei der Aufgabe „${task.title}“ (${station.title}, AFB ${task.afb}). Aufgabentext: ${plain(task.text || "").slice(0, 1200)}\n\nGib mir bitte einen Denkanstoß, nicht gleich die Lösung.`));
  sr.append(tutorB);
  art.append(sr);
  return art;
}

/* ============================================================
   Ansichten
   ============================================================ */
function renderStart() {
  const v = el("section", { class: "view", id: "v-start" });
  const next = STATIONS.find((s) => stationProgress(s).f < 1) || STATIONS[0];
  v.innerHTML = `
<div class="hero">
  <div class="hero-grid">
    <div style="display:grid;gap:20px;align-content:start;min-width:0">
      <p class="eyebrow">Physik Q1 · Klausurvorbereitung</p>
      <h1>Feld &amp; <em>Kondensator</em></h1>
      <p class="lead">Vier Stationen vom elektrischen Feld bis zur Entladekurve. Mit Simulationen, Aufgaben in allen drei Anforderungsbereichen und einem Trainer für die Frage, die in jeder Klausur kommt: Was bleibt konstant?</p>
      <div class="row">
        <button class="btn primary" type="button" data-go="${next.id}">${stationProgress(STATIONS[0]).done ? "Weitermachen: Station " + next.nr : "Mit Station 1 starten"}</button>
        <button class="btn" type="button" data-go="trainer">Zum Trainer</button>
        <button class="btn ghost" type="button" data-go="karten">Karteikarten</button>
      </div>
    </div>
    <figure class="hero-fig" id="hero-fig"></figure>
  </div>
</div>
<div class="sec">
  <div class="sec-head"><p class="eyebrow">Dein Lernpfad</p><h2>Vier Stationen, eine nach der anderen</h2></div>
  <div class="path">${STATIONS.map((s) => `
    <button class="stop" type="button" data-go="${s.id}">
      ${s.focus ? '<span class="chip warn focus-tag">Schwerpunkt</span>' : ""}
      <span class="num">${s.nr}</span>
      <h3>${esc(s.title)}</h3>
      <span class="meta">${s.steps.length} Schritte · ${s.tasks.length} Aufgaben</span>
      <span class="bar"><i data-prog="${s.id}"></i></span>
      <span class="meta" data-progt="${s.id}"></span>
    </button>`).join("")}</div>
  <p class="small muted">Die Aufgaben sind nach Anforderungsbereichen markiert: ${afbChip(1)} ${afbChip(2)} ${afbChip(3)}</p>
</div>
<div class="cols">
  <div class="sec">
    <div class="sec-head"><p class="eyebrow">Lernplan</p><h2>Bis zur Klausur</h2></div>
    <div class="row"><span class="small muted">Noch</span><span id="plan-seg"></span><span class="small muted">bis zur Klausur</span></div>
    <div id="plan" style="display:grid;gap:20px"></div>
  </div>
  <div class="sec">
    <div class="sec-head"><p class="eyebrow">Aus deinen Notizen</p><h2>Das kommt dran</h2></div>
    <ul class="checklist">${EXAM_LIST.map((x) => `
      <li><input type="checkbox" id="ex-${x.id}" ${store.map("exam")[x.id] ? "checked" : ""}><span><label for="ex-${x.id}">${esc(x.t)}</label><br><button class="go" type="button" data-go="${x.go}">${esc(x.goT)} öffnen</button></span></li>`).join("")}
      <li><span class="x" aria-hidden="true">✗</span><span class="muted">Reihen- und Parallelschaltung von Kondensatoren: kommt <strong>nicht</strong> dran.</span></li>
    </ul>
  </div>
</div>`;
  $$(".checklist input", v).forEach((c) => c.addEventListener("change", () => store.mark("exam", c.id.slice(3), c.checked || null)));
  FieldSim($("#hero-fig", v), { preset: "dipol", controls: false, height: 300, caption: "Zieh an den Ladungen. Die Feldlinien folgen." });
  const days = store.get("days", 3);
  $("#plan-seg", v).append(seg([[1, "1 Tag"], [2, "2 Tage"], [3, "3 Tage"]], days, (d) => { store.set("days", d); renderPlan(v, d); }, "Tage bis zur Klausur"));
  renderPlan(v, days);
  return v;
}
function renderPlan(v, d) {
  const done = store.map("plan");
  $("#plan", v).innerHTML = PLANS[d].map((day, i) => `
<div class="plan-day"><h4>${esc(day.day)}</h4><ul class="checklist">${day.items.map(([go, t], j) => {
    const id = `${d}-${i}-${j}`;
    return `<li><input type="checkbox" id="pl-${id}" ${done[id] ? "checked" : ""}><span><label for="pl-${id}">${esc(t)}</label> <button class="go" type="button" data-go="${go}">öffnen</button></span></li>`;
  }).join("")}</ul></div>`).join("");
  $$("#plan input", v).forEach((c) => c.addEventListener("change", () => store.mark("plan", c.id.slice(3), c.checked || null)));
}

function lab(title, desc, mount) {
  const box = el("div", { class: "lab" });
  box.innerHTML = `<div class="lab-head"><div><h3>${title}</h3><p class="small muted">${desc}</p></div></div>`;
  const body = el("div", { class: "lab-body" });
  box.append(body);
  mount(body);
  return box;
}

function renderStation(s, idx) {
  const v = el("section", { class: "view", id: "v-" + s.id, hidden: "" });
  const head = el("div", { class: "st-head" });
  head.innerHTML = `
<div class="row"><span class="eyebrow">Station ${s.nr} von ${STATIONS.length}</span>${s.focus ? '<span class="chip warn">Schwerpunkt</span>' : ""}</div>
<h2 style="font-size:clamp(34px,5vw,52px)">${esc(s.title)}</h2>
<p class="lead">${esc(s.lead)}</p>
<div class="row"><span class="bar" style="width:160px"><i data-prog="${s.id}"></i></span><span class="small muted" data-progt="${s.id}"></span></div>
<nav class="subnav" aria-label="Abschnitte">
  <a href="#" data-go="${s.id}" data-anchor="${s.id}-verstehen">Verstehen</a>
  <a href="#" data-go="${s.id}" data-anchor="${s.id}-sim">Simulation</a>
  ${s.id === "kondensator" ? `<a href="#" data-go="trainer">Trainer</a>` : ""}
  <a href="#" data-go="${s.id}" data-anchor="${s.id}-fehler">Typische Fehler</a>
  <a href="#" data-go="${s.id}" data-anchor="${s.id}-aufgaben">Aufgaben</a>
</nav>`;
  v.append(head);

  const understand = el("div", { class: "sec", id: s.id + "-verstehen" });
  understand.innerHTML = `<div class="sec-head"><p class="eyebrow">Verstehen</p><h2>Schritt für Schritt</h2></div>`;
  const steps = el("div", { class: "steps" });
  s.steps.forEach((st, i) => steps.append(renderStep(st, i, s)));
  understand.append(steps);
  v.append(understand);

  const sim = el("div", { class: "sec", id: s.id + "-sim" });
  sim.innerHTML = `<div class="sec-head"><p class="eyebrow">Simulation</p><h2>Selbst ausprobieren</h2></div>`;
  if (s.id === "feld") sim.append(lab("Feldlinien-Labor", "Wähle eine Anordnung, zieh die Ladungen, tipp für eine Probeladung.", (b) => FieldSim(b, { preset: "dipol" })));
  if (s.id === "spannung") {
    sim.append(lab("Teilchen im Kondensator", "Die Kugel startet an der Plusplatte. Ändere den Abstand und schau auf die Endgeschwindigkeit.", AccelSim));
    sim.append(lab("Schweben wie bei Millikan", "Ein negativ geladenes Öltröpfchen zwischen waagerechten Platten.", MillikanSim));
  }
  if (s.id === "kondensator") {
    sim.append(lab("Kondensator-Labor", "Trenn die Quelle, zieh die Platten auseinander, schieb ein Dielektrikum hinein.", CapLab));
  }
  if (s.id === "kurven") sim.append(lab("Lade- und Entladekurven", "Wähle Laden oder Entladen, merk dir eine Kurve und verändere R oder C.", RCSim));
  v.append(sim);

  if (s.id === "kondensator") {
    const tr = el("div", { class: "sec", id: "trainer" });
    tr.innerHTML = `<div class="sec-head"><p class="eyebrow">Trainer</p><h2>Was passiert, wenn …?</h2><p class="lead">Entscheide für C, Q, U und E: steigt, bleibt gleich oder sinkt? Ziel: acht richtige Situationen in Folge.</p></div>`;
    const box = el("div", { class: "task trainer" });
    tr.append(box);
    Trainer(box, store.ns("trainer"));
    v.append(tr);
  }

  const traps = el("div", { class: "sec", id: s.id + "-fehler" });
  traps.innerHTML = `<div class="sec-head"><p class="eyebrow">Typische Fehler</p><h2>Hier gehen Punkte verloren</h2></div>
<div class="traps">${s.traps.map((t) => `<div class="trap"><b>${esc(t.t)}</b><p>${esc(t.d)}</p></div>`).join("")}</div>`;
  v.append(traps);

  const tasks = el("div", { class: "sec", id: s.id + "-aufgaben" });
  tasks.innerHTML = `<div class="sec-head"><p class="eyebrow">Aufgaben</p><h2>Üben wie in der Klausur</h2></div>`;
  const filt = el("div", { class: "task-filter" });
  const list = el("div", { class: "tasks" });
  const filter = (a) => $$(".task", list).forEach((t) => (t.hidden = a !== 0 && +t.dataset.afb !== a));
  filt.append(seg([[0, "Alle"], [1, "AFB 1"], [2, "AFB 2"], [3, "AFB 3"]], 0, filter, "Nach Anforderungsbereich filtern"));
  filt.append(el("span", { class: "small muted" }, "Zahlen gehen auch so: 2,5e-3 oder 2,5·10^-3"));
  s.tasks.forEach((t) => list.append(renderTask(t, s)));
  tasks.append(filt, list);
  v.append(tasks);

  const nx = STATIONS[idx + 1];
  const foot = el("div", { class: "row" });
  foot.style.justifyContent = "space-between";
  foot.innerHTML = `${idx > 0 ? `<button class="btn ghost" type="button" data-go="${STATIONS[idx - 1].id}">← Station ${idx}</button>` : '<span></span>'}
${nx ? `<button class="btn primary" type="button" data-go="${nx.id}">Weiter zu Station ${nx.nr}: ${esc(nx.short)} →</button>` : `<button class="btn primary" type="button" data-go="karten">Zum Abschluss: Karteikarten →</button>`}`;
  v.append(foot);
  return v;
}

function renderFormulas() {
  const v = el("section", { class: "view", id: "v-formeln", hidden: "" });
  v.innerHTML = `<div class="st-head"><p class="eyebrow">Nachschlagen</p><h2 style="font-size:clamp(34px,5vw,52px)">Formelkarte</h2>
<p class="lead">Alle Formeln der Klausur mit Bedeutung und Einheit. Du darfst eine Formelsammlung benutzen. Wichtiger ist, dass du weißt, wann welche Formel gilt.</p></div>
${FORMULAS.map((g) => `<div class="fgroup sec"><div class="row" style="justify-content:space-between"><h3>${esc(g.group)}</h3><button class="go btn small ghost" type="button" data-go="${g.st}">zur Station</button></div>
<div class="table-wrap"><table class="t ftable"><thead><tr><th>Formel</th><th>Bedeutung</th><th>Einheit</th></tr></thead><tbody>
${g.rows.map(([f, m, u]) => `<tr><td>${fx(f)}</td><td>${esc(m)}</td><td class="num">${esc(u)}</td></tr>`).join("")}
</tbody></table></div></div>`).join("")}
<div class="fgroup sec"><h3>Konstanten</h3><div class="table-wrap"><table class="t ftable"><tbody>${CONSTANTS.map(([f, m]) => `<tr><td>${fx(f)}</td><td>${esc(m)}</td></tr>`).join("")}</tbody></table></div>
<p class="small muted">${esc(PREFIXES)}</p></div>`;
  return v;
}

function renderCards() {
  const v = el("section", { class: "view", id: "v-karten", hidden: "" });
  v.innerHTML = `<div class="st-head"><p class="eyebrow">AFB 1 · Definitionen</p><h2 style="font-size:clamp(34px,5vw,52px)">Karteikarten</h2>
<p class="lead">Sag die Definition laut auf, bevor du umdrehst. Was sitzt, verschwindet aus dem Stapel.</p></div>`;
  const deck = el("div", { class: "deck" });
  const status = el("p", { class: "score" });
  const card = el("button", { class: "flash", type: "button", "aria-label": "Karte umdrehen" });
  card.innerHTML = `<div class="flash-in"><div class="face front"></div><div class="face back"></div></div>`;
  const row = el("div", { class: "row" });
  const again = el("button", { class: "btn", type: "button" }, "Nochmal");
  const ok = el("button", { class: "btn primary", type: "button" }, "Wusste ich");
  const reset = el("button", { class: "btn ghost small", type: "button" }, "Stapel neu mischen");
  row.append(again, ok);
  deck.append(status, card, row, reset);
  v.append(deck);
  let queue = [], cur = null;
  const build = () => {
    const known = store.map("cards");
    queue = CARDS.filter((c) => known[c.id] !== "ok").sort(() => Math.random() - 0.5);
    nextCard();
  };
  const nextCard = () => {
    card.classList.remove("flipped");
    const known = store.map("cards");
    const n = CARDS.filter((c) => known[c.id] === "ok").length;
    status.textContent = `${n} von ${CARDS.length} sitzen`;
    cur = queue.shift();
    if (!cur) {
      $(".front", card).innerHTML = `<p class="eyebrow">Fertig</p><p class="term">Alle Definitionen sitzen.</p><p class="muted">Misch den Stapel neu, um alles nochmal zu wiederholen.</p>`;
      $(".back", card).innerHTML = "";
      again.disabled = ok.disabled = true;
      return;
    }
    again.disabled = ok.disabled = false;
    $(".front", card).innerHTML = `<p class="eyebrow">Definiere</p><p class="term">${esc(cur.term)}</p><p class="small muted">Tippen zum Umdrehen</p>`;
    $(".back", card).innerHTML = `<p class="eyebrow">${esc(cur.term)}</p><p class="def">${cur.def}</p>`;
  };
  card.addEventListener("click", () => card.classList.toggle("flipped"));
  ok.addEventListener("click", () => { if (cur) store.mark("cards", cur.id, "ok"); nextCard(); });
  again.addEventListener("click", () => { if (cur) { store.mark("cards", cur.id, "again"); queue.splice(Math.min(3, queue.length), 0, cur); } nextCard(); });
  reset.addEventListener("click", () => { CARDS.forEach((c) => store.mark("cards", c.id, null)); build(); });
  build();
  return v;
}

/* ============================================================
   KI-Tutor (nur wenn die Ansicht Claude anbietet)
   ============================================================ */
const TUTOR_RULES = `Du bist ein geduldiger, fachlich genauer Physik-Tutor für eine Schülerin oder einen Schüler der 11. Klasse (Q1) in Deutschland, kurz vor der Klausur. Sprich die Person mit „du“ an und antworte auf Deutsch.
Klausurstoff: elektrische Ladung (Q = N·e), Strom (I = ΔQ/Δt, Ladung als Fläche unter der I-t-Kurve), elektrisches Feld und Feldstärke (E = F/q), Feldlinienbilder, Faraday-Käfig, Verschiebungsarbeit und Spannung (U = W/q, E_el = q·U, U = E·d im homogenen Feld), Energieerhaltung q·U = ½mv², Schweben/Millikan, Kondensator und Kapazität (C = Q/U, C = ε0·εr·A/d), Veränderung von d, A, εr mit und ohne angeschlossene Quelle, Lade- und Entladekurven, Einfluss von R und C, Halbwertszeit t½ = R·C·ln 2. Reihen- und Parallelschaltung von Kondensatoren sind NICHT Klausurstoff.
Regeln: kurz und klar (höchstens etwa 150 Wörter), Schritt für Schritt, Formeln als Klartext wie C = ε0·εr·A/d (kein LaTeX, kein Markdown außer einfachen Aufzählungen mit „-“). Wenn nach einer Aufgabe gefragt wird, gib zuerst einen Denkanstoß und frag, ob die Person die vollständige Lösung möchte. Korrigiere Fehler freundlich, aber deutlich. Bleib beim Physik-Stoff.`;

let sampleFn = null;
const AI_STOP = new Set(["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"]);
function aiError(e) {
  const c = e && e.code;
  if (AI_STOP.has(c)) { setAI(false); return "Der Tutor ist in dieser Ansicht nicht verfügbar. Alles andere funktioniert wie gewohnt."; }
  if (c === "rate_limited") return "Gerade zu viele Anfragen. Versuch es in ein paar Minuten nochmal.";
  if (c === "session_expired") return "Bitte melde dich bei Claude neu an und versuch es dann nochmal.";
  if (c === "refused") return "Darauf kann der Tutor nicht antworten. Formulier die Frage anders.";
  if (c === "invalid_json") return "Die Bewertung kam unvollständig zurück. Versuch es nochmal.";
  if (c === "cancelled") return "";
  return "Die Verbindung ist abgebrochen. Versuch es nochmal.";
}
function setAI(on) { $$(".ai-only").forEach((x) => (x.hidden = !on)); if (!on) closeTutor(); }
async function initAI() {
  try {
    if (!window.claude || typeof window.claude.use !== "function") return;
    const s = await window.claude.use("sample");
    if (s) { sampleFn = s; setAI(true); }
  } catch (e) { /* ohne Tutor */ }
}
async function askOnce(btn, out, prompt) {
  if (!sampleFn) return;
  btn.disabled = true;
  out.textContent = "Denkt nach …";
  try {
    await sampleFn(prompt, { onText: ({ text }) => (out.textContent = text) });
  } catch (e) {
    out.textContent = (e && e.text ? e.text + "\n\n" : "") + aiError(e);
  } finally { btn.disabled = false; }
}
async function gradeAnswer(task, ta, ul, btn, out, det) {
  if (!sampleFn) return;
  const ans = ta.value.trim();
  if (ans.length < 15) { out.textContent = "Schreib erst eine Antwort in ganzen Sätzen, dann bewertet Claude sie."; return; }
  const crit = task.reason.crit;
  const prompt = `${TUTOR_RULES}

Bewerte die Schülerantwort wie eine Lehrkraft nach dem Erwartungshorizont. Sei fair: Ein Kriterium gilt als erfüllt, wenn der Inhalt sinngemäß und fachlich richtig dasteht, auch mit anderen Worten.

Aufgabe: ${plain(task.text || "").slice(0, 1500)}
Musterlösung: ${plain((task.solution || []).join(" ")).slice(0, 2000)}
Kriterien (Index: Text, Punkte):
${crit.map((c, i) => `${i}: ${c.t} (${c.p} P.)`).join("\n")}

Schülerantwort:
"""${ans.slice(0, 3000)}"""

Antworte nur mit JSON in genau dieser Form:
{"erfuellt":[Indizes der erfüllten Kriterien],"feedback":"2 bis 4 Sätze auf Deutsch, an die Person mit du gerichtet: was gut ist, was fehlt oder falsch ist, und ein konkreter Verbesserungsvorschlag"}`;
  btn.disabled = true;
  out.textContent = "Claude liest deine Antwort …";
  try {
    const r = await sampleFn.json(prompt, { cache: false });
    const hit = new Set((Array.isArray(r && r.erfuellt) ? r.erfuellt : []).map(Number));
    let got = 0;
    const max = crit.reduce((a, c) => a + c.p, 0);
    $$("li", ul).forEach((li, i) => {
      const on = hit.has(i);
      li.classList.toggle("hit", on); li.classList.toggle("miss", !on);
      $("input", li).checked = on;
      if (on) got += crit[i].p;
    });
    ul.dispatchEvent(new Event("change"));
    det.open = true;
    out.textContent = `${got} von ${max} Punkten.\n${String((r && r.feedback) || "")}`;
  } catch (e) {
    out.textContent = aiError(e);
  } finally { btn.disabled = false; }
}

let chat = [], chatCtl = null;
const SUGG = {
  start: ["Was ist der Unterschied zwischen E = F/q und E = U/d?", "Erklär mir in drei Sätzen, was Kapazität ist."],
  feld: ["Warum treffen Feldlinien senkrecht auf Leiter?", "Wie zeichne ich das Feld zweier gleichnamiger Ladungen?"],
  spannung: ["Warum hängt die Endgeschwindigkeit nicht vom Plattenabstand ab?", "Was bedeutet 1 Volt anschaulich?"],
  kondensator: ["Warum bleibt E gleich, wenn ich die Platten eines getrennten Kondensators auseinanderziehe?", "Stell mir eine Was-passiert-wenn-Frage und prüf meine Antwort."],
  kurven: ["Warum ist der Entladestrom negativ?", "Wie bestimme ich C aus einer Entladekurve?"],
  formeln: ["Wann darf ich U = E·d benutzen und wann nicht?"],
  karten: ["Frag mich drei Definitionen ab."],
};
function updateSuggestions() {
  const box = $("#tutor-sugg");
  if (!box) return;
  box.innerHTML = "";
  (SUGG[currentView] || SUGG.start).forEach((q) => {
    const b = el("button", { type: "button" }, esc(q));
    b.addEventListener("click", () => sendChat(q));
    box.append(b);
  });
}
function openTutor(prefill) {
  const d = $("#tutor");
  d.hidden = false;
  if (prefill) { $("#tutor-in").value = prefill; }
  $("#tutor-in").focus();
}
function closeTutor() { const d = $("#tutor"); if (d) d.hidden = true; if (chatCtl) chatCtl.abort(); }
function addMsg(cls, text) {
  const m = el("div", { class: "msg " + cls });
  m.textContent = text;
  $("#tutor-log").append(m);
  $("#tutor-log").scrollTop = 1e9;
  return m;
}
async function sendChat(text) {
  text = (text || "").trim();
  if (!text || !sampleFn) return;
  $("#tutor-in").value = "";
  addMsg("me", text);
  chat.push({ role: "user", content: text });
  chat = chat.slice(-12);
  if (chat[0].role !== "user") chat.shift();
  const bubble = addMsg("ai", "Denkt nach …");
  const sendB = $("#tutor-send");
  sendB.disabled = true;
  chatCtl = new AbortController();
  const ctx = currentView in VIEW_TITLES ? VIEW_TITLES[currentView] : (STATIONS.find((s) => s.id === currentView) || {}).title;
  try {
    const { text: ans } = await sampleFn([{ role: "user", content: TUTOR_RULES + `\n\nDie Person ist gerade im Bereich „${ctx}“.` }, ...chat], {
      cache: false, signal: chatCtl.signal, onText: ({ text: t }) => { bubble.textContent = t; $("#tutor-log").scrollTop = 1e9; },
    });
    chat.push({ role: "assistant", content: ans });
  } catch (e) {
    const msg = aiError(e);
    bubble.textContent = (e && e.text ? e.text + "\n\n" : "") + msg;
    if (!msg && !(e && e.text)) bubble.remove();
  } finally { sendB.disabled = false; chatCtl = null; }
}

/* ============================================================
   Start
   ============================================================ */
function applyTheme(t) {
  if (t) document.documentElement.setAttribute("data-theme", t);
  else document.documentElement.removeAttribute("data-theme");
  window.dispatchEvent(new Event("themechange"));
}
function boot() {
  const tabs = $("#tabs");
  tabs.innerHTML = `<button class="tab" type="button" data-go="start">Start</button>` +
    STATIONS.map((s) => `<button class="tab" type="button" data-go="${s.id}"><span class="n">${s.nr}</span>${esc(s.short)}<span class="dot" data-dot="${s.id}"></span></button>`).join("") +
    `<button class="tab" type="button" data-go="formeln">Formeln</button><button class="tab" type="button" data-go="karten">Karten</button>`;
  const main = $("#main");
  main.append(renderStart());
  STATIONS.forEach((s, i) => main.append(renderStation(s, i)));
  main.append(renderFormulas(), renderCards());
  refreshProgress();

  const tb = $("#theme-btn");
  const isDark = () => document.documentElement.getAttribute("data-theme") === "dark" || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
  tb.addEventListener("click", () => applyTheme(isDark() ? "light" : "dark"));
  if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => window.dispatchEvent(new Event("themechange")));
  new MutationObserver(() => window.dispatchEvent(new Event("themechange"))).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  $("#tutor-fab").addEventListener("click", () => openTutor());
  $("#tutor-close").addEventListener("click", closeTutor);
  $("#tutor-form").addEventListener("submit", (e) => { e.preventDefault(); sendChat($("#tutor-in").value); });
  $("#tutor-in").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat($("#tutor-in").value); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeTutor(); });

  const h = (location.hash || "").slice(1);
  show(VIEWS.includes(h) || h === "trainer" ? h : store.get("view", "start"));
  initAI();
}
boot();
