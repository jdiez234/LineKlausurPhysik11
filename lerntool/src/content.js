/* ============================================================
   Formel-Satz: fx("C = ε_0*ε_r*{A|d}")
   {a|b} Bruch · _x / _{..} tief · ^x / ^{..} hoch · * → Malpunkt
   `..` aufrecht (Einheiten) · sqrt{..} Wurzel · einzelne Buchstaben kursiv
   ============================================================ */
function fxInner(s) {
  let out = "", i = 0;
  const esc = (c) => c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const group = () => {
    let depth = 0, j = i;
    for (; j < s.length; j++) {
      if (s[j] === "{") depth++;
      else if (s[j] === "}") { depth--; if (depth === 0) break; }
    }
    const g = s.slice(i + 1, j); i = j + 1; return g;
  };
  const splitTop = (g) => {
    let d = 0;
    for (let k = 0; k < g.length; k++) {
      if (g[k] === "{") d++; else if (g[k] === "}") d--; else if (g[k] === "|" && d === 0) return k;
    }
    return -1;
  };
  const token = () => {
    if (s[i] === "{") return fxInner(group());
    const m = s.slice(i).match(/^[−\-+]?[0-9A-Za-zäöüα-ωΑ-Ω½¼]+/);
    if (!m) return "";
    i += m[0].length;
    return esc(m[0].replace("-", "−"));
  };
  while (i < s.length) {
    const c = s[i];
    if (c === "`") { const j = s.indexOf("`", i + 1); out += '<span class="u">' + esc(s.slice(i + 1, j)) + "</span>"; i = j + 1; continue; }
    if (s.startsWith("sqrt{", i)) { i += 4; out += '<span class="sq"><b>√</b><span>' + fxInner(group()) + "</span></span>"; continue; }
    if (c === "{") {
      const g = group(), k = splitTop(g);
      out += k >= 0 ? '<span class="fr"><span>' + fxInner(g.slice(0, k)) + "</span><span>" + fxInner(g.slice(k + 1)) + "</span></span>" : fxInner(g);
      continue;
    }
    if (c === "_") { i++; out += "<sub>" + token() + "</sub>"; continue; }
    if (c === "^") { i++; out += "<sup>" + token() + "</sup>"; continue; }
    if (c === "*") { out += "·"; i++; continue; }
    if (c === "Δ") { out += "Δ"; i++; continue; }
    if (c === "-") { out += "−"; i++; continue; }
    const m = s.slice(i).match(/^[A-Za-zäöüÄÖÜα-ωΑ-Ω]+/);
    if (m) { const w = m[0]; i += w.length; out += w.length === 1 ? "<i>" + w + "</i>" : esc(w); continue; }
    out += esc(c); i++;
  }
  return out;
}
const fx = (s) => '<span class="fx">' + fxInner(s) + "</span>";
const fbox = (...items) =>
  '<div class="fbox">' + items.map((it) => (it.startsWith("<") ? it : fx(it))).join("") + "</div>";
const note = (t) => '<span class="note">' + t + "</span>";

/* ============================================================
   Stationen
   ============================================================ */
const STATIONS = [
  /* ---------------------------------------------------------- 1 */
  {
    id: "feld",
    nr: 1,
    title: "Ladung, Strom und elektrisches Feld",
    short: "Feld",
    focus: false,
    lead: "Alles beginnt mit Ladung. Wenn du verstanden hast, was ein Feld ist, ergeben Spannung und Kondensator fast von selbst Sinn.",
    steps: [
      {
        id: "f1",
        title: "Ladung gibt es nur in ganzen Paketen",
        body: `
<p>Es gibt zwei Sorten Ladung: positive und negative. Gleichnamige Ladungen stoßen sich ab, ungleichnamige ziehen sich an.</p>
<p>Im Atom sitzen die positiven Protonen fest im Kern. Die negativen Elektronen in der Hülle lassen sich leicht verschieben. Beim Aufladen bewegen sich deshalb immer Elektronen, nie Protonen:</p>
<ul><li><strong>positiv geladen</strong> heißt Elektronenmangel,</li><li><strong>negativ geladen</strong> heißt Elektronenüberschuss.</li></ul>
${fbox("Q = N*e", "e = 1,602*10^-19 `C`", note("Q: Ladung in Coulomb, N: Anzahl der Elektronen, e: Elementarladung"))}
<div class="callout top">Jede Ladung ist ein ganzzahliges Vielfaches von ${fx("e")}. Genau das hat Millikan mit seinen schwebenden Öltröpfchen gezeigt (Station 2).</div>`,
        check: {
          q: "Eine Metallkugel wird positiv aufgeladen. Was passiert mit ihrer Masse?",
          options: [
            { t: "Sie nimmt minimal zu, weil Protonen dazukommen.", why: "Protonen sitzen fest im Kern und bewegen sich beim Aufladen nicht." },
            { t: "Sie nimmt minimal ab, weil Elektronen entfernt werden.", ok: true, why: "Positiv heißt Elektronenmangel. Die Kugel verliert N·mₑ an Masse, also unmessbar wenig." },
            { t: "Sie bleibt exakt gleich.", why: "Elektronen haben eine Masse (9,109·10⁻³¹ kg). Der Unterschied ist winzig, aber nicht null." },
          ],
        },
      },
      {
        id: "f2",
        title: "Strom ist bewegte Ladung",
        body: `
<p>Fließen Elektronen durch einen Draht, ist die Stromstärke die Ladung, die pro Zeit durch den Querschnitt kommt.</p>
${fbox("I = {ΔQ|Δt}", "1 `C` = 1 `A·s`", note("I in Ampere, Q in Coulomb, t in Sekunden"))}
<p>Deshalb ist eine Akku-Angabe wie ${fx("1,65 `A·h`")} eine Ladung: ${fx("1,65 `A` * 3600 `s` = 5940 `C`")}.</p>
<p>Ist der Strom nicht konstant, ist die Ladung die <strong>Fläche unter der I-t-Kurve</strong>. In der Praxis zählst du Kästchen. Ein Kästchen ist (Stromstärke pro Kästchen) mal (Zeit pro Kästchen) wert.</p>
<div class="callout">Das brauchst du in Station 4 wieder: Aus der Fläche unter einer Entladekurve bestimmst du die Ladung und damit die Kapazität.</div>`,
        check: {
          q: "Ein Kästchen im I-t-Diagramm ist 0,1 A hoch und 0,5 s breit. Unter der Kurve liegen etwa 12 Kästchen. Wie groß ist die Ladung?",
          options: [
            { t: "0,6 C", ok: true, why: "Ein Kästchen ist 0,1 A · 0,5 s = 0,05 A·s wert. 12 · 0,05 C = 0,6 C." },
            { t: "6 C", why: "Ein Kästchen ist 0,1 A · 0,5 s = 0,05 A·s wert, nicht 0,5 A·s." },
            { t: "1,2 C", why: "Du hast nur die Stromstärke gezählt. Die Zeit gehört in den Kästchenwert mit hinein." },
          ],
        },
      },
      {
        id: "f3",
        title: "Das elektrische Feld und seine Stärke",
        body: `
<p>Ein geladener Körper verändert den Raum um sich herum: Auf jede andere Ladung dort wirkt eine Kraft. Diesen Zustand des Raums nennt man <strong>elektrisches Feld</strong>.</p>
<p>Wie stark das Feld an einem Punkt ist, misst man mit einer <strong>Probeladung</strong> ${fx("q")}: klein, positiv und so schwach, dass sie das Feld nicht verändert.</p>
${fbox("E = {F_el|q}", "[E] = `N/C`", note("Umgestellt: F_el = q·E"))}
<p>Die Kraft auf eine positive Ladung zeigt in Feldrichtung, auf eine negative Ladung genau entgegen.</p>`,
        check: {
          q: "Die Feldlinien zeigen nach rechts. In welche Richtung wirkt die Kraft auf ein Elektron?",
          options: [
            { t: "Nach rechts, entlang der Feldlinien", why: "Das gilt für positive Ladungen. Ein Elektron ist negativ." },
            { t: "Nach links, entgegen den Feldlinien", ok: true, why: "Feldlinien zeigen die Kraft auf positive Ladungen. Für negative Ladungen dreht sich die Richtung um." },
            { t: "Senkrecht zu den Feldlinien", why: "Die Kraft wirkt immer tangential, also entlang der Feldlinie." },
          ],
        },
      },
      {
        id: "f4",
        title: "Feldlinienbilder lesen und zeichnen",
        body: `
<p>Feldlinien sind ein Modell. Sie zeigen, in welche Richtung eine positive Probeladung gezogen würde. Die Regeln:</p>
<ol>
<li>Feldlinien beginnen bei positiven und enden bei negativen Ladungen.</li>
<li>Die Kraft wirkt tangential zur Feldlinie.</li>
<li>Je dichter die Linien, desto stärker das Feld.</li>
<li>Feldlinien schneiden sich nie.</li>
<li>Feldlinien treffen senkrecht auf Leiteroberflächen.</li>
</ol>
<p><strong>Homogen</strong> heißt: parallele Linien mit gleichem Abstand, die Feldstärke ist überall gleich (Inneres eines Plattenkondensators). Alles andere ist <strong>inhomogen</strong> (Punktladung, zwei Ladungen, Spitzen, der Rand des Kondensators).</p>
<div class="callout">Probier es in der Simulation unten aus: Zieh die Ladungen herum und tipp irgendwo hin, um den Kraftpfeil auf eine Probeladung zu sehen.</div>`,
        check: {
          q: "Warum können sich zwei Feldlinien nicht schneiden?",
          options: [
            { t: "Am Schnittpunkt hätte die Kraft auf eine Probeladung zwei Richtungen gleichzeitig.", ok: true, why: "Genau. An jedem Punkt gibt es nur eine Kraftrichtung, also nur eine Feldlinie." },
            { t: "Weil sich die Feldlinien gegenseitig abstoßen.", why: "Feldlinien sind keine Gegenstände, die Kräfte aufeinander ausüben. Sie sind nur ein Bild für die Kraftrichtung." },
            { t: "Weil Feldlinien immer parallel verlaufen.", why: "Nur im homogenen Feld. Bei zwei Punktladungen sind sie gekrümmt." },
          ],
        },
      },
      {
        id: "f5",
        title: "Faraday-Käfig: warum es im Leiter feldfrei ist",
        body: `
<p>Bringst du einen Leiter in ein Feld, verschieben sich seine freien Elektronen gegen die Feldrichtung. Das heißt <strong>Influenz</strong>. Eine Seite wird negativ, die gegenüberliegende Seite positiv.</p>
<p>Diese getrennten Ladungen erzeugen im Inneren ein Gegenfeld. Die Elektronen wandern genau so lange, bis Gegenfeld und äußeres Feld sich im Inneren aufheben. Dann ist das Innere feldfrei.</p>
<p>Anwendungen: Auto und Flugzeug bei Blitzeinschlag, die Metallgittertür der Mikrowelle, die Abschirmung von Antennenkabeln, Schutzanzüge für Arbeiten an Hochspannungsleitungen.</p>`,
        check: {
          q: "Ein Blitz schlägt in ein Auto ein. Warum ist man innen sicher?",
          options: [
            { t: "Die Gummireifen isolieren das Auto von der Erde.", why: "Ein klassischer Irrtum. Bei Millionen Volt überbrückt der Blitz die paar Zentimeter Gummi mühelos." },
            { t: "Die Ladungen verteilen sich auf der Metallhülle, im Inneren hebt sich das Feld auf.", ok: true, why: "Richtig: Die Karosserie wirkt als Faraday-Käfig." },
            { t: "Glas leitet keinen Strom.", why: "Das spielt keine Rolle. Entscheidend ist die geschlossene Metallhülle." },
          ],
        },
      },
    ],
    traps: [
      { t: "Kraft auf Elektronen", d: "Feldlinien zeigen die Kraft auf positive Ladungen. Bei Elektronen dreht sich die Richtung um." },
      { t: "Präfixe", d: "µC = 10⁻⁶ C, nC = 10⁻⁹ C, kN/C = 10³ N/C. Ein vergessenes Präfix ist der häufigste Punktverlust." },
      { t: "Gramm in Kilogramm", d: "Für F = m·g brauchst du kg: 0,32 g = 3,2·10⁻⁴ kg." },
      { t: "Probeladung in der Definition", d: "Sie ist positiv und so klein, dass sie das Feld nicht verändert. Das gehört in jede Definition von E." },
    ],
    tasks: [
      {
        id: "t1-1", afb: 1, title: "Feldstärke aus der Kraft",
        text: `<p>Auf eine Ladung von ${fx("3 `µC`")} wirkt an einem Punkt eine Kraft von ${fx("0,06 `N`")}. Wie groß ist dort die elektrische Feldstärke?</p>`,
        answers: [{ label: "E", value: 2e4, unit: "N/C" }],
        hints: ["Welche Definition verbindet F, q und E?", `${fx("E = {F|q}")}. Denk daran: ${fx("1 `µC` = 10^-6 `C`")}.`],
        solution: [
          `Gegeben: ${fx("q = 3*10^-6 `C`")}, ${fx("F = 0,06 `N`")}`,
          `${fx("E = {F|q} = {0,06 `N`|3*10^-6 `C`} = 2,0*10^4 `N/C`")}`,
        ],
      },
      {
        id: "t1-2", afb: 1, title: "Elektronen in der Taschenlampe",
        text: `<p>In einer Taschenlampe fließt ein Strom von ${fx("0,38 `A`")}. Wie viele Elektronen passieren in ${fx("30 `s`")} den Querschnitt der Zuleitung?</p>`,
        answers: [{ label: "N", value: 7.116e19, unit: "Elektronen" }],
        hints: ["Erst die Ladung, dann die Anzahl.", `${fx("Q = I*t")} und ${fx("N = {Q|e}")}`],
        solution: [
          `${fx("Q = I*t = 0,38 `A` * 30 `s` = 11,4 `C`")}`,
          `${fx("N = {Q|e} = {11,4 `C`|1,602*10^-19 `C`} ≈ 7,1*10^19")} Elektronen`,
        ],
      },
      {
        id: "t1-3", afb: 2, title: "Die Knopfzelle in der Armbanduhr",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Eine Knopfzelle treibt ein Jahr lang einen Strom von ${fx("10 `µA`")} durch eine Armbanduhr. Dann ist sie leer.</p>
<ol type="a"><li>Welche Ladung hat sie in dieser Zeit durch den Stromkreis getrieben?</li><li>Wie viele Elektronen fließen pro Sekunde durch den Draht?</li></ol>`,
        answers: [
          { label: "a) Q", value: 315.36, unit: "C" },
          { label: "b) N pro Sekunde", value: 6.242e13, unit: "1/s" },
        ],
        hints: ["Ein Jahr in Sekunden: 365 · 24 · 3600 s.", `Für b) brauchst du kein Jahr: In einer Sekunde fließt ${fx("Q = I * 1 `s`")}.`],
        solution: [
          `${fx("Δt = 365*24*3600 `s` ≈ 3,15*10^7 `s`")}`,
          `a) ${fx("Q = I*Δt = 10^-5 `A` * 3,15*10^7 `s` ≈ 315 `C`")}`,
          `b) ${fx("{N|Δt} = {I|e} = {10^-5 `A`|1,602*10^-19 `C`} ≈ 6,2*10^13")} Elektronen pro Sekunde`,
        ],
      },
      {
        id: "t1-4", afb: 2, title: "Ein Elektron im Feld",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Ein Elektron (${fx("m_e = 9,1*10^-31 `kg`")}) befindet sich in einem Feld der Stärke ${fx("20 `kN/C`")}. Berechne seine Beschleunigung und vergleiche sie mit der Fallbeschleunigung.</p>`,
        answers: [{ label: "a", value: 3.52e15, unit: "m/s²" }],
        hints: ["Zwei Formeln für die Kraft: F = q·E und F = m·a.", `${fx("a = {e*E|m_e}")}`],
        solution: [
          `${fx("F = e*E = 1,602*10^-19 `C` * 2*10^4 `N/C` = 3,2*10^-15 `N`")}`,
          `${fx("a = {F|m_e} = {3,2*10^-15 `N`|9,1*10^-31 `kg`} ≈ 3,5*10^15 `m/s²`")}`,
          `Vergleich: ${fx("{a|g} ≈ {3,5*10^15|9,81} ≈ 3,6*10^14")}. Die Gewichtskraft auf Elektronen kannst du in Feldern also immer vernachlässigen.`,
        ],
      },
      {
        id: "t1-5", afb: 2, title: "Die Waage im Feld",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Auf einer Waage liegt ein dünner Stab mit einer kleinen Kugel, Ladung ${fx("q = 12 `nC`")}. Die Waage wird auf null gestellt. Dann wird die Kugel in ein elektrisches Feld gebracht, und die Waage zeigt ${fx("0,32 `g`")} an. Berechne die Feldstärke.</p>`,
        answers: [{ label: "E", value: 2.616e5, unit: "N/C" }],
        hints: ["Die Waage misst eine Kraft und rechnet sie in Gramm um. Welche Kraft entspricht 0,32 g?", `${fx("F_el = m*g")} mit ${fx("m = 3,2*10^-4 `kg`")}, dann ${fx("E = {F_el|q}")}`],
        solution: [
          `Die elektrische Kraft drückt die Kugel nach unten, so stark wie eine Masse von 0,32 g: ${fx("F_el = m*g = 3,2*10^-4 `kg` * 9,81 `m/s²` ≈ 3,14*10^-3 `N`")}`,
          `${fx("E = {F_el|q} = {3,14*10^-3 `N`|12*10^-9 `C`} ≈ 2,6*10^5 `N/C`")}`,
        ],
      },
      {
        id: "t1-6", afb: 3, title: "Werden geladene Körper schwerer?",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Eine Aluminiumkugel der Masse ${fx("101,4 `g`")} wird mit ${fx("1,2 `µC`")} positiv aufgeladen.</p>
<ol type="a"><li>Wie viele Elektronen wurden entfernt?</li><li>Um wie viel ändert sich die Masse?</li><li>Beurteile die Aussage: „Voll aufgeladene Akkus sind schwerer als leere.“</li></ol>`,
        answers: [
          { label: "a) N", value: 7.49e12, unit: "Elektronen" },
          { label: "b) Δm", value: 6.82e-18, unit: "kg" },
        ],
        hints: ["Positiv geladen heißt: Elektronen fehlen.", `${fx("Δm = N*m_e")} mit ${fx("m_e = 9,109*10^-31 `kg`")}`, "Für c): Kommen beim Laden eines Akkus wirklich Elektronen dazu?"],
        solution: [
          `a) ${fx("N = {Q|e} = {1,2*10^-6 `C`|1,602*10^-19 `C`} ≈ 7,5*10^12")}`,
          `b) ${fx("Δm = N*m_e ≈ 7,5*10^12 * 9,109*10^-31 `kg` ≈ 6,8*10^-18 `kg`")}. Die Kugel wird leichter, aber das kann keine Waage messen.`,
          `c) Ein Akku wird beim Laden nicht mit Ladung „gefüllt“. Er bleibt insgesamt elektrisch neutral. Es werden nur Elektronen im Inneren zwischen den Polen verschoben, und es wird chemische Energie gespeichert. Die Aussage ist also falsch, weil keine zusätzlichen Elektronen hinzukommen.`,
          `<span class="chip top">Top-Note</span> Nach Einstein hat auch gespeicherte Energie Masse (${fx("Δm = {E|c^2}")}). Bei einem Handyakku sind das etwa 10⁻¹³ kg, also ebenfalls unmessbar.`,
        ],
        reason: {
          prompt: "Deine Begründung zu c)",
          crit: [
            { t: "Der Akku bleibt insgesamt elektrisch neutral.", p: 1 },
            { t: "Beim Laden werden Ladungen nur verschoben bzw. Energie chemisch gespeichert, nicht hinzugefügt.", p: 1 },
            { t: "Fazit: Die Aussage ist falsch, ein Massenunterschied ist nicht messbar.", p: 1 },
          ],
        },
      },
      {
        id: "t1-7", afb: 2, title: "Feldlinienbild zweier Ladungen",
        type: "sketch",
        text: `<p>Skizziere auf Papier das Feld einer positiven und einer negativen Punktladung, die nebeneinander liegen.</p>
<ol type="a"><li>Zeichne die Richtung der Feldlinien ein.</li><li>Markiere, wo das Feld am stärksten ist, und begründe.</li><li>Trage den Kraftpfeil für eine negative Probeladung an einem Punkt deiner Wahl ein.</li></ol>`,
        field: "dipol",
        crit: [
          { t: "Linien beginnen an + und enden an −, mit Pfeilen in diese Richtung.", p: 1 },
          { t: "Linien starten radial (sternförmig) an den Ladungen und schneiden sich nicht.", p: 1 },
          { t: "Stärkstes Feld zwischen und nahe den Ladungen, weil die Linien dort am dichtesten sind.", p: 1 },
          { t: "Kraft auf die negative Probeladung tangential zur Feldlinie, aber entgegen der Pfeilrichtung.", p: 1 },
        ],
      },
      {
        id: "t1-8", afb: 2, title: "Homogen oder inhomogen?",
        type: "sketch",
        text: `<p>Skizziere das Feldlinienbild eines geladenen Plattenkondensators, auch am Rand. Kennzeichne, wo das Feld homogen und wo es inhomogen ist.</p>`,
        field: "platten",
        crit: [
          { t: "Innen parallele Linien mit gleichem Abstand, von + nach −: homogen.", p: 1 },
          { t: "Linien treffen senkrecht auf die Platten.", p: 1 },
          { t: "Am Rand sind die Linien nach außen gewölbt: inhomogenes Randfeld.", p: 1 },
        ],
      },
      {
        id: "t1-9", afb: 3, title: "Faraday-Käfig erklären",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Ein Metallkörper wird in ein elektrisches Feld gebracht. Begründe, warum sein Inneres nahezu feldfrei ist, und nenne zwei Anwendungen.</p>`,
        solution: [
          "Die freien Elektronen im Metall werden durch das Feld entgegen der Feldrichtung verschoben (Influenz).",
          "Dadurch wird eine Seite negativ und die andere positiv geladen.",
          "Diese getrennten Ladungen erzeugen im Inneren ein Feld, das dem äußeren Feld entgegengerichtet ist.",
          "Die Verschiebung hört erst auf, wenn sich beide Felder im Inneren aufheben. Das Innere ist dann feldfrei.",
          "Anwendungen: Auto oder Flugzeug bei Blitzeinschlag, Mikrowellentür, abgeschirmte Kabel.",
        ],
        reason: {
          prompt: "Deine Begründung",
          crit: [
            { t: "Freie Elektronen verschieben sich entgegen der Feldrichtung (Influenz).", p: 1 },
            { t: "Ladungstrennung: eine Seite negativ, die andere positiv.", p: 1 },
            { t: "Die getrennten Ladungen erzeugen ein Gegenfeld im Inneren.", p: 1 },
            { t: "Die Verschiebung endet, wenn sich die Felder aufheben: innen feldfrei.", p: 1 },
            { t: "Zwei passende Anwendungen genannt.", p: 1 },
          ],
        },
      },
    ],
  },

  /* ---------------------------------------------------------- 2 */
  {
    id: "spannung",
    nr: 2,
    title: "Spannung und Energie",
    short: "Spannung",
    focus: true,
    lead: "Hier verbindest du Feld und Energie. Die wichtigste Idee dieser Station: Spannung ist Energie pro Ladung.",
    steps: [
      {
        id: "s1",
        title: "Arbeit gegen das Feld",
        body: `
<p>Willst du eine positive Ladung im homogenen Feld gegen die Feldrichtung verschieben, musst du gegen die Kraft ${fx("F_el = q*E")} arbeiten. Arbeit ist Kraft mal Weg:</p>
${fbox("W = F*s = q*E*s", note("s: Weg entlang der Feldlinien"))}
<p>Verschiebst du die Ladung quer zu den Feldlinien, brauchst du keine Arbeit, denn die Kraft steht senkrecht zum Weg.</p>
<p>Die Arbeit ist proportional zu ${fx("q")}. Teilt man durch ${fx("q")}, bleibt eine Größe übrig, die nur noch vom Feld und den beiden Punkten abhängt. Das ist die Spannung.</p>`,
        check: {
          q: "Eine Ladung wird im homogenen Feld senkrecht zu den Feldlinien verschoben. Wie viel Arbeit ist dafür nötig?",
          options: [
            { t: "W = q·E·s", why: "Das gilt nur für einen Weg entlang der Feldlinien." },
            { t: "Keine", ok: true, why: "Kraft und Weg stehen senkrecht aufeinander, also wird keine Arbeit verrichtet." },
            { t: "Das hängt von der Ladung ab.", why: "Egal wie groß q ist: Senkrecht zur Kraft wird keine Arbeit verrichtet." },
          ],
        },
      },
      {
        id: "s2",
        title: "Spannung ist Energie pro Ladung",
        body: `
${fbox("U = {W|q}", "E_el = q*U", "[U] = `V` = `J/C`")}
<p>Die Spannung sagt, wie viel Energie pro Coulomb umgesetzt wird, wenn eine Ladung von einem Punkt zum anderen gelangt. 12 V heißt: 12 Joule pro Coulomb.</p>
<p>Die Analogie zur Schwerkraft hilft beim Verstehen:</p>
<div class="table-wrap"><table class="t">
<thead><tr><th>Schwerkraft</th><th>Elektrisches Feld</th></tr></thead>
<tbody>
<tr><td>Masse ${fx("m")}</td><td>Ladung ${fx("q")}</td></tr>
<tr><td>Fallbeschleunigung ${fx("g")}</td><td>Feldstärke ${fx("E")}</td></tr>
<tr><td>Gewichtskraft ${fx("F = m*g")}</td><td>elektrische Kraft ${fx("F = q*E")}</td></tr>
<tr><td>Lageenergie ${fx("m*g*h")}</td><td>elektrische Energie ${fx("q*E*d = q*U")}</td></tr>
<tr><td>Höhe ${fx("h")}</td><td>Spannung ${fx("U")} (wie eine „Höhe“ für Ladungen)</td></tr>
</tbody></table></div>
<p>Ein positives Teilchen „fällt“ von + nach −, so wie ein Ball nach unten fällt. Dabei wird elektrische Energie in Bewegungsenergie umgewandelt.</p>`,
        check: {
          q: "Ein Elektron durchläuft eine Spannung von 100 V. Wie viel Energie gewinnt es?",
          options: [
            { t: "100 J", why: "100 J wären es bei einer Ladung von 1 C. Ein Elektron hat nur e = 1,602·10⁻¹⁹ C." },
            { t: "1,602·10⁻¹⁷ J", ok: true, why: "E = e·U = 1,602·10⁻¹⁹ C · 100 V = 1,602·10⁻¹⁷ J." },
            { t: "1,602·10⁻²¹ J", why: "Rechne die Zehnerpotenz nach: 10⁻¹⁹ · 10² = 10⁻¹⁷." },
          ],
        },
      },
      {
        id: "s3",
        title: "Im homogenen Feld: U = E · d",
        body: `
${fbox("U = E*d", "E = {U|d}", note("nur im homogenen Feld, d: Plattenabstand"))}
<p>Herleitung: Über den ganzen Plattenabstand ist die Arbeit ${fx("W = q*E*d")}. Also ist ${fx("U = {W|q} = E*d")}.</p>
<p>Daraus folgt eine zweite Einheit für die Feldstärke: ${fx("{`V`|`m`} = {`J`|`C·m`} = {`N·m`|`C·m`} = {`N`|`C`}")}.</p>
<p>Bei fester Spannung gilt: Je kleiner der Abstand, desto stärker das Feld. Deshalb springen Funken dort über, wo sich Leiter am nächsten kommen.</p>`,
        check: {
          q: "Die Spannung bleibt bei 12 kV, der Plattenabstand wird halbiert. Was passiert mit der Feldstärke?",
          options: [
            { t: "Sie halbiert sich.", why: "E = U/d: Ein kleineres d im Nenner macht E größer." },
            { t: "Sie bleibt gleich.", why: "Bei gleicher Spannung hängt E vom Abstand ab." },
            { t: "Sie verdoppelt sich.", ok: true, why: "E = U/d. Halbes d bedeutet doppeltes E." },
          ],
        },
      },
      {
        id: "s4",
        title: "Energieerhaltung: das Teilchen im Kondensator",
        body: `
<p>Ein geladenes Teilchen startet in Ruhe an einer Platte und fliegt zur anderen. Dabei wird seine elektrische Energie vollständig zu Bewegungsenergie:</p>
${fbox("q*U = {1|2}*m*v^2", "v = sqrt{{2*q*U|m}}")}
<p>Bemerkenswert: Der Plattenabstand ${fx("d")} kommt in dieser Formel gar nicht vor. Bei größerem Abstand ist die Kraft kleiner (${fx("E = {U|d}")}), aber der Beschleunigungsweg ist länger. Beides gleicht sich genau aus.</p>
<div class="callout top"><b>Top-Note-Satz:</b> Die Endgeschwindigkeit hängt nur von U ab, nicht von d, weil ${fx("W = F*d = q*{U|d}*d = q*U")}.</div>`,
        check: {
          q: "Der Plattenabstand wird verdoppelt, die Spannung bleibt gleich. Wie ändert sich die Aufprallgeschwindigkeit?",
          options: [
            { t: "Sie halbiert sich, weil die Kraft halb so groß ist.", why: "Die Kraft ist halb so groß, aber der Weg doppelt so lang. Die Energie q·U bleibt gleich." },
            { t: "Sie bleibt gleich.", ok: true, why: "Die gewonnene Energie ist q·U, und die hängt nicht von d ab." },
            { t: "Sie wird größer, weil der Weg länger ist.", why: "Der längere Weg wird genau durch die kleinere Kraft ausgeglichen." },
          ],
        },
      },
      {
        id: "s5",
        title: "Schweben: der Millikan-Versuch",
        body: `
<p>Ein geladenes Öltröpfchen zwischen waagerechten Platten schwebt, wenn die elektrische Kraft nach oben die Gewichtskraft genau ausgleicht:</p>
${fbox("F_el = F_G", "q*{U|d} = m*g", "q = {m*g*d|U}")}
<p>Millikan hat so viele Tröpfchen gemessen und festgestellt: Jede Ladung ist ein Vielfaches von ${fx("e")}.</p>
<p>Was passiert, wenn man die Spannung halbiert? Dann halbiert sich ${fx("E")} und damit ${fx("F_el")}. Die Gewichtskraft überwiegt, und das Tröpfchen bewegt sich nach unten.</p>`,
        check: {
          q: "Ein Tröpfchen schwebt. Jetzt wird der Plattenabstand bei gleicher Spannung vergrößert. Was passiert?",
          options: [
            { t: "Nichts, weil die Spannung gleich bleibt.", why: "Die Kraft hängt von E = U/d ab, nicht von U allein." },
            { t: "Es sinkt, weil E = U/d kleiner wird.", ok: true, why: "Die elektrische Kraft nach oben wird kleiner als die Gewichtskraft." },
            { t: "Es steigt nach oben.", why: "Das würde passieren, wenn E größer würde, also bei kleinerem Abstand." },
          ],
        },
      },
      {
        id: "s6",
        title: "Leistung und Energie im Stromkreis",
        body: `
${fbox("P = U*I", "E = U*I*t = U*Q")}
<p>Eine Lampe an 6 V, durch die 0,5 A fließen, hat die Leistung ${fx("P = 3 `W`")}. In 3 Minuten fließen ${fx("Q = I*t = 90 `C`")}, und es werden ${fx("E = U*Q = 540 `J`")} umgesetzt.</p>`,
      },
    ],
    traps: [
      { t: "U = E·d nur im homogenen Feld", d: "Bei einer Punktladung oder am Rand des Kondensators gilt die Formel nicht." },
      { t: "Erst umrechnen", d: "12 kV = 12 000 V, 8 cm = 0,08 m, 0,4 g = 4·10⁻⁴ kg. Danach erst einsetzen." },
      { t: "Geschwindigkeit und Abstand", d: "Bei gleicher Spannung ist die Endgeschwindigkeit unabhängig vom Plattenabstand." },
      { t: "Kugelvolumen", d: "V = 4/3·π·r³ mit dem Radius, nicht dem Durchmesser. Masse m = ρ·V." },
    ],
    tasks: [
      {
        id: "t2-1", afb: 1, title: "Feldstärke im Plattenkondensator",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>An einem Plattenkondensator mit ${fx("d = 0,1 `m`")} liegen ${fx("12 `kV`")} an. Berechne die Feldstärke.</p>`,
        answers: [{ label: "E", value: 1.2e5, unit: "V/m" }],
        hints: [`${fx("E = {U|d}")}, erst kV in V umrechnen.`],
        solution: [`${fx("E = {U|d} = {12000 `V`|0,1 `m`} = 1,2*10^5 `V/m`")}`],
      },
      {
        id: "t2-2", afb: 2, title: "Die Kugel fliegt von Platte zu Platte",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Eine Kugel (${fx("q = 2,5 `nC`")}, ${fx("m = 0,4 `g`")}) wird im Kondensator aus Aufgabe 1 (${fx("U = 12 `kV`")}) aus der Ruhe von einer Platte zur anderen beschleunigt. Mit welcher Energie und welcher Geschwindigkeit prallt sie auf?</p>`,
        answers: [
          { label: "Energie", value: 30, unit: "µJ" },
          { label: "v", value: 0.387, unit: "m/s" },
        ],
        hints: ["Energieerhaltung: Die elektrische Energie wird zu Bewegungsenergie.", `${fx("E_el = q*U")}, dann ${fx("q*U = {1|2}*m*v^2")} nach v umstellen.`],
        solution: [
          `${fx("E_el = q*U = 2,5*10^-9 `C` * 12000 `V` = 3,0*10^-5 `J` = 30 `µJ`")}`,
          `${fx("v = sqrt{{2*E_el|m}} = sqrt{{2*3,0*10^-5 `J`|4*10^-4 `kg`}} ≈ 0,39 `m/s`")}`,
          "Der Plattenabstand wird gar nicht gebraucht.",
        ],
      },
      {
        id: "t2-3", afb: 1, title: "Lampe am Akku",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Eine Lampe wird 3 Minuten an einen 6-V-Akku angeschlossen. Die Stromstärke beträgt 0,5 A. Berechne Leistung, geflossene Ladung und übertragene Energie.</p>`,
        answers: [
          { label: "P", value: 3, unit: "W" },
          { label: "Q", value: 90, unit: "C" },
          { label: "E", value: 540, unit: "J" },
        ],
        hints: [`${fx("P = U*I")}, ${fx("Q = I*t")}, ${fx("E = U*Q")}. Zeit in Sekunden: 3 min = 180 s.`],
        solution: [
          `${fx("P = U*I = 6 `V` * 0,5 `A` = 3 `W`")}`,
          `${fx("Q = I*t = 0,5 `A` * 180 `s` = 90 `C`")}`,
          `${fx("E = U*Q = 6 `V` * 90 `C` = 540 `J`")} (oder ${fx("P*t")})`,
        ],
      },
      {
        id: "t2-4", afb: 2, title: "Messreihe: Feldstärke und Spannung",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Eine Kugel mit ${fx("q = 12 `nC`")} hängt zwischen Platten im Abstand ${fx("d = 0,08 `m`")}. Gemessen wird die Kraft in Abhängigkeit von der Spannung:</p>
<div class="table-wrap"><table class="t"><tbody>
<tr><th>U in kV</th><td class="num">0</td><td class="num">5</td><td class="num">10</td><td class="num">15</td><td class="num">20</td><td class="num">25</td></tr>
<tr><th>F in mN</th><td class="num">0</td><td class="num">0,75</td><td class="num">1,60</td><td class="num">2,20</td><td class="num">3,00</td><td class="num">3,80</td></tr>
</tbody></table></div>
<ol type="a"><li>Berechne für jede Messung die Feldstärke.</li><li>Berechne den Quotienten U/E.</li><li>Begründe, dass E und U proportional sind.</li></ol>`,
        hints: [`${fx("E = {F|q}")}. Achtung: mN und nC umrechnen.`, "Wenn der Quotient U/E immer ungefähr gleich ist, sind die Größen proportional. Mit welcher Länge stimmt er überein?"],
        solution: [
          `<div class="table-wrap"><table class="t"><tbody>
<tr><th>U in kV</th><td class="num">5</td><td class="num">10</td><td class="num">15</td><td class="num">20</td><td class="num">25</td></tr>
<tr><th>E in kN/C</th><td class="num">62,5</td><td class="num">133</td><td class="num">183</td><td class="num">250</td><td class="num">317</td></tr>
<tr><th>U/E in m</th><td class="num">0,080</td><td class="num">0,075</td><td class="num">0,082</td><td class="num">0,080</td><td class="num">0,079</td></tr>
</tbody></table></div>`,
          "Der Quotient U/E ist im Rahmen der Messgenauigkeit konstant (≈ 0,08 m). Er entspricht dem Plattenabstand d.",
          "Im Diagramm liegen die Punkte auf einer Ursprungsgeraden. Also gilt E ~ U, genauer E = U/d.",
        ],
        solFig: "messreihe",
        reason: {
          prompt: "Deine Begründung zu c)",
          crit: [
            { t: "Quotient U/E ist (nahezu) konstant.", p: 1 },
            { t: "Der Wert entspricht dem Plattenabstand d = 0,08 m.", p: 1 },
            { t: "Ursprungsgerade im U-E-Diagramm bzw. Folgerung E = U/d.", p: 1 },
          ],
        },
      },
      {
        id: "t2-5", afb: 2, title: "Elektronenkanone",
        text: `<p>Ein Elektron wird aus der Ruhe durch eine Spannung von ${fx("1000 `V`")} beschleunigt. Wie schnell ist es danach?</p>`,
        answers: [{ label: "v", value: 1.875e7, unit: "m/s" }],
        hints: [`${fx("e*U = {1|2}*m_e*v^2")}`],
        solution: [
          `${fx("v = sqrt{{2*e*U|m_e}} = sqrt{{2*1,602*10^-19 `C` * 1000 `V`|9,109*10^-31 `kg`}} ≈ 1,9*10^7 `m/s`")}`,
          "Das sind etwa 6 % der Lichtgeschwindigkeit, nach nur 1000 V.",
        ],
      },
      {
        id: "t2-6", afb: 2, title: "Ein Öltröpfchen wie bei Millikan",
        text: `<p>Zwischen waagerechten Platten im Abstand ${fx("5,0 `mm`")} schwebt ein Öltröpfchen der Masse ${fx("4,0*10^-15 `kg`")} bei ${fx("U = 245 `V`")}. Die obere Platte ist positiv.</p>
<ol type="a"><li>Berechne die Ladung des Tröpfchens.</li><li>Wie viele Elementarladungen trägt es?</li><li>Welches Vorzeichen hat die Ladung?</li></ol>`,
        answers: [
          { label: "a) q", value: 8.01e-19, unit: "C" },
          { label: "b) Anzahl", value: 5, unit: "e" },
        ],
        hints: [`Gleichgewicht: ${fx("q*{U|d} = m*g")}`, "Das Feld zeigt von der oberen (+) zur unteren (−) Platte, also nach unten. Die Kraft muss aber nach oben zeigen."],
        solution: [
          `a) ${fx("q = {m*g*d|U} = {4,0*10^-15 `kg` * 9,81 `m/s²` * 5,0*10^-3 `m`|245 `V`} ≈ 8,0*10^-19 `C`")}`,
          `b) ${fx("N = {q|e} = {8,0*10^-19|1,602*10^-19} ≈ 5")}`,
          "c) Das Feld zeigt nach unten. Die Kraft zeigt nach oben, also entgegen dem Feld: Das Tröpfchen ist negativ geladen.",
        ],
      },
      {
        id: "t2-7", afb: 3, title: "Die Spannung wird halbiert",
        src: "Klausuraufgabe aus deinen Unterrichtsunterlagen",
        text: `<p>Ein geladenes Teilchen schwebt in einem Plattenkondensator bei ${fx("U = 1000 `V`")}. Nun wird die Spannung auf 500 V halbiert.</p>
<ol type="a"><li>Beschreibe und begründe, was mit dem Teilchen passiert.</li><li>Wie müsste man den Plattenabstand ändern, damit es wieder schwebt?</li></ol>`,
        solution: [
          "Beim Schweben gilt das Kräftegleichgewicht F_el = F_G.",
          "Halbe Spannung bei gleichem Abstand: E = U/d halbiert sich, damit auch F_el = q·E.",
          "Die Gewichtskraft ist jetzt größer als die elektrische Kraft. Das Teilchen bewegt sich beschleunigt nach unten.",
          "b) Den Abstand halbieren: Dann ist E = U/d wieder genauso groß wie vorher, und das Teilchen schwebt.",
        ],
        reason: {
          prompt: "Deine Antwort",
          crit: [
            { t: "Beim Schweben gilt F_el = F_G.", p: 1 },
            { t: "E = U/d halbiert sich, also halbiert sich F_el.", p: 1 },
            { t: "F_G überwiegt, das Teilchen bewegt sich (beschleunigt) nach unten.", p: 1 },
            { t: "b) Plattenabstand halbieren.", p: 1 },
          ],
        },
      },
      {
        id: "t2-8", afb: 3, title: "Warum der Abstand egal ist",
        text: `<p>Begründe ohne Rechnung, warum ein Teilchen bei doppeltem Plattenabstand, aber gleicher Spannung, mit derselben Geschwindigkeit aufprallt.</p>`,
        solution: [
          "Bei doppeltem Abstand halbiert sich die Feldstärke E = U/d und damit die Kraft.",
          "Dafür ist der Beschleunigungsweg doppelt so lang.",
          "Die Arbeit W = F·s bleibt also gleich, nämlich q·U.",
          "Gleiche Energie bedeutet gleiche Bewegungsenergie ½mv², also gleiche Geschwindigkeit.",
        ],
        reason: {
          prompt: "Deine Begründung",
          crit: [
            { t: "Kraft halbiert sich (E = U/d).", p: 1 },
            { t: "Weg verdoppelt sich.", p: 1 },
            { t: "Arbeit W = F·s = q·U bleibt gleich.", p: 1 },
            { t: "Gleiche Energie, also gleiche Geschwindigkeit.", p: 1 },
          ],
        },
      },
    ],
  },

  /* ---------------------------------------------------------- 3 */
  {
    id: "kondensator",
    nr: 3,
    title: "Kondensator und Kapazität",
    short: "Kondensator",
    focus: true,
    lead: "Der Kondensator ist das Herz der Klausur. Wer die Frage „Was bleibt konstant?“ sicher beantwortet, holt hier die meisten Punkte.",
    steps: [
      {
        id: "k1",
        title: "Was ist ein Kondensator?",
        body: `
<p>Zwei Leiter, getrennt durch einen Isolator. Den Isolator nennt man <strong>Dielektrikum</strong> (Luft, Kunststoff, Papier, Öl …).</p>
<p>Legt man eine Spannung ${fx("U")} an, fließen kurz Elektronen: Die eine Platte bekommt die Ladung ${fx("+Q")}, die andere genauso viel ${fx("-Q")}. Zwischen den Platten entsteht ein homogenes Feld.</p>
<p>Ein Kondensator speichert Ladung und Energie für kurze Zeit. Im Vergleich zu einer Batterie lädt und entlädt er sich sehr schnell, speichert aber viel weniger Energie. Anwendungen: Kamerablitz, Glätten von Spannungen, Signalfilter, Touchscreens, Füllstandsmesser.</p>`,
        check: {
          q: "Ein Plattenkondensator ist an 100 V angeschlossen. Was gilt für die Ladungen auf den Platten?",
          options: [
            { t: "Nur die Plusplatte ist geladen.", why: "Die Elektronen, die eine Platte verlassen, landen auf der anderen. Beide sind geladen." },
            { t: "+Q und −Q, genau gleich groß.", ok: true, why: "Die Quelle verschiebt Elektronen von einer Platte zur anderen. Was der einen fehlt, hat die andere zu viel." },
            { t: "Beide Platten sind positiv geladen.", why: "Dann gäbe es zwischen den Platten kein Feld von + nach −." },
          ],
        },
      },
      {
        id: "k2",
        title: "Kapazität: wie viel Ladung pro Volt",
        body: `
${fbox("C = {Q|U}", "[C] = {`C`|`V`} = `F` (Farad)")}
<p>Messungen zeigen: ${fx("Q ~ U")}. Im Q-U-Diagramm ergibt sich eine Ursprungsgerade. Ihre Steigung ist für jeden Kondensator fest. Das ist die Kapazität ${fx("C")}.</p>
<p>1 F ist riesig. Übliche Werte: pF (10⁻¹²), nF (10⁻⁹), µF (10⁻⁶).</p>
<p>Drei Wege, C aus Messwerten zu bestimmen: Steigungsdreieck im Q-U-Diagramm, einzelne Wertepaare einsetzen und mitteln, oder lineare Regression mit dem CAS (am genauesten).</p>`,
        check: {
          q: "Im Q-U-Diagramm hat Kondensator A die steilere Gerade als Kondensator B. Was folgt daraus?",
          options: [
            { t: "C_A > C_B", ok: true, why: "Die Steigung Q/U ist die Kapazität. Steiler heißt: mehr Ladung pro Volt." },
            { t: "C_A < C_B", why: "Umgekehrt: Die Steigung ist C = Q/U, steiler bedeutet größer." },
            { t: "A hat die höhere Spannung.", why: "Die Spannung ist auf der x-Achse frei wählbar. Die Steigung sagt etwas über C aus." },
          ],
        },
      },
      {
        id: "k3",
        title: "Kapazität aus der Bauform",
        body: `
${fbox("C = ε_0*ε_r*{A|d}", "ε_0 = 8,854*10^{-12} {`A·s`|`V·m`}")}
<p>Die Kapazität hängt nur von der Bauform ab, ähnlich wie der Widerstand ${fx("R = ρ*{l|A}")}:</p>
<ul>
<li>größere Plattenfläche ${fx("A")}: mehr Platz für Ladung, ${fx("C ~ A")}</li>
<li>kleinerer Abstand ${fx("d")}: ${fx("C ~ {1|d}")}</li>
<li>Dielektrikum mit größerem ${fx("ε_r")}: ${fx("C ~ ε_r")}</li>
</ul>
<p>${fx("ε_0")} ist die elektrische Feldkonstante, eine Naturkonstante. ${fx("ε_r")} ist die Dielektrizitätszahl des Materials, ohne Einheit:</p>
<div class="table-wrap"><table class="t"><tbody>
<tr><th>Material</th><td>Vakuum</td><td>Luft</td><td>Styropor</td><td>Öl</td><td>Papier</td><td>Glas</td><td>Wasser</td></tr>
<tr><th>ε<sub>r</sub></th><td class="num">1</td><td class="num">1,0006</td><td class="num">≈ 1,03</td><td class="num">≈ 2,5</td><td class="num">2 bis 4</td><td class="num">5 bis 10</td><td class="num">≈ 81</td></tr>
</tbody></table></div>
<div class="callout">Umrechnen: ${fx("1 `cm²` = 10^-4 `m²`")}, ${fx("1 `mm` = 10^-3 `m`")}. Also sind 500 cm² = 0,05 m².</div>`,
        check: {
          q: "Die Plattenfläche wird verdoppelt und der Abstand ebenfalls. Was passiert mit C?",
          options: [
            { t: "C verdoppelt sich.", why: "Das gilt nur für die Fläche. Der doppelte Abstand halbiert C wieder." },
            { t: "C bleibt gleich.", ok: true, why: "C ~ A/d: Zähler und Nenner verdoppeln sich, der Bruch bleibt gleich." },
            { t: "C vervierfacht sich.", why: "Der Abstand steht im Nenner. Ein größeres d macht C kleiner." },
          ],
        },
      },
      {
        id: "k4",
        title: "Warum ein Dielektrikum die Kapazität erhöht",
        body: `
<p>Im Dielektrikum gibt es keine freien Elektronen. Aber die Moleküle werden im Feld verformt oder richten sich aus. Das nennt man <strong>Polarisation</strong>. An den Oberflächen des Dielektrikums sitzen dann Ladungen, die den Plattenladungen gegenüberliegen und das Feld im Inneren schwächen.</p>
<p>Die Folge: Bei gleicher Ladung ist die Spannung kleiner. Oder: Bei gleicher Spannung passt mehr Ladung auf die Platten. Beides bedeutet, dass ${fx("C")} um den Faktor ${fx("ε_r")} größer wird.</p>`,
        check: {
          q: "Ein geladener Kondensator ist von der Quelle getrennt. Du schiebst eine Glasplatte hinein. Was zeigt das Voltmeter?",
          options: [
            { t: "Eine kleinere Spannung", ok: true, why: "Q bleibt gleich, C wird größer, also sinkt U = Q/C." },
            { t: "Eine größere Spannung", why: "Das passiert beim Auseinanderziehen der Platten. Ein Dielektrikum erhöht C und senkt damit U." },
            { t: "Die gleiche Spannung", why: "Ohne Quelle hält niemand die Spannung fest. Konstant ist nur die Ladung." },
          ],
        },
      },
      {
        id: "k5",
        title: "Die wichtigste Frage: Was bleibt konstant?",
        body: `
<p>Lies bei jeder Aufgabe zur Veränderung zuerst, ob der Kondensator noch an der Quelle hängt:</p>
<div class="table-wrap"><table class="t">
<thead><tr><th></th><th>an der Quelle</th><th>von der Quelle getrennt</th></tr></thead>
<tbody>
<tr><td>konstant bleibt</td><td><strong>U</strong> (die Quelle hält U fest)</td><td><strong>Q</strong> (die Ladung kann nicht weg)</td></tr>
<tr><td>dann rechnen mit</td><td>${fx("Q = C*U")}, ${fx("E = {U|d}")}</td><td>${fx("U = {Q|C}")}, ${fx("E = {U|d}")}</td></tr>
</tbody></table></div>
<p>Die Ergebnisse auf einen Blick:</p>
<div class="table-wrap"><table class="t">
<thead><tr><th>Änderung</th><th>an der Quelle (U konstant)</th><th>getrennt (Q konstant)</th></tr></thead>
<tbody>
<tr><td>Abstand d × 2</td><td>C ½ · Q ½ · E ½</td><td>C ½ · U × 2 · E gleich</td></tr>
<tr><td>Fläche A × 2</td><td>C × 2 · Q × 2 · E gleich</td><td>C × 2 · U ½ · E ½</td></tr>
<tr><td>Dielektrikum ε<sub>r</sub></td><td>C × ε<sub>r</sub> · Q × ε<sub>r</sub> · E gleich</td><td>C × ε<sub>r</sub> · U ÷ ε<sub>r</sub> · E ÷ ε<sub>r</sub></td></tr>
</tbody></table></div>
<p>Das Rezept, mit dem du jede dieser Aufgaben löst:</p>
<ol><li>Was bleibt konstant, U oder Q?</li><li>Wie ändert sich C? (aus ${fx("C = ε_0*ε_r*{A|d}")})</li><li>Die fehlende Größe über ${fx("C = {Q|U}")}.</li><li>Die Feldstärke über ${fx("E = {U|d}")}.</li></ol>
<div class="callout top"><b>Top-Note:</b> Beim getrennten Kondensator bleibt E gleich, wenn du den Abstand änderst. Warum? ${fx("E = {U|d} = {Q|C*d} = {Q|ε_0*ε_r*A}")}. Da steht kein d mehr. Die Feldstärke hängt nur davon ab, wie dicht die Ladung auf der Platte sitzt.</div>
<p>Übe das unten im Trainer „Was passiert, wenn …?“, bis du alle Fälle sicher kannst.</p>`,
        check: {
          q: "Ein getrennter Kondensator: Die Platten werden auseinandergezogen. Was zeigt das Voltmeter?",
          options: [
            { t: "Eine höhere Spannung", ok: true, why: "Q bleibt, C sinkt, also steigt U = Q/C. Die Arbeit beim Auseinanderziehen steckt jetzt als Energie im Feld." },
            { t: "Eine kleinere Spannung", why: "Das wäre richtig, wenn C größer würde. Größerer Abstand macht C kleiner." },
            { t: "Die gleiche Spannung", why: "Gleich bliebe U nur, solange die Quelle angeschlossen ist." },
          ],
        },
      },
    ],
    traps: [
      { t: "Verbunden oder getrennt?", d: "Wer diesen Satz in der Aufgabe überliest, hat die ganze Teilaufgabe falsch." },
      { t: "Durchmesser statt Radius", d: "A = π·r² mit r = Durchmesser/2. 24 cm Durchmesser bedeuten r = 0,12 m." },
      { t: "Flächeneinheiten", d: "1 cm² = 10⁻⁴ m², nicht 10⁻² m²." },
      { t: "Schaltungen nicht lernen", d: "Reihen- und Parallelschaltung kommen laut Lehrkraft nicht dran. Steck deine Zeit lieber in den Trainer." },
    ],
    tasks: [
      {
        id: "t3-1", afb: 1, title: "Ladung auf dem Kondensator",
        text: `<p>Ein Kondensator mit ${fx("C = 4,7 `µF`")} wird an ${fx("12 `V`")} angeschlossen. Welche Ladung speichert er?</p>`,
        answers: [{ label: "Q", value: 56.4, unit: "µC" }],
        hints: [`${fx("Q = C*U")}`],
        solution: [`${fx("Q = C*U = 4,7*10^-6 `F` * 12 `V` = 5,64*10^-5 `C` = 56,4 `µC`")}`],
      },
      {
        id: "t3-2", afb: 1, title: "Zwei kreisrunde Platten",
        src: "LK Baden-Württemberg 2008, aus deinen Unterlagen",
        text: `<p>Zwei kreisförmige Metallplatten mit ${fx("24 `cm`")} Durchmesser stehen sich im Abstand ${fx("2,0 `cm`")} gegenüber. Dazwischen ist Luft (${fx("ε_r = 1,0")}). Berechne die Kapazität.</p>`,
        answers: [{ label: "C", value: 20.03, unit: "pF" }],
        hints: ["Radius, nicht Durchmesser: r = 0,12 m.", `${fx("A = π*r^2")}, dann ${fx("C = ε_0*ε_r*{A|d}")}`],
        solution: [
          `${fx("A = π*(0,12 `m`)^2 ≈ 4,52*10^-2 `m²`")}`,
          `${fx("C = 8,854*10^-12 {`A·s`|`V·m`} * {4,52*10^-2 `m²`|0,02 `m`} ≈ 2,0*10^-11 `F` = 20 `pF`")}`,
        ],
      },
      {
        id: "t3-3", afb: 2, title: "Welche Kurve gehört zu welchem Abstand?",
        src: "LK Baden-Württemberg 2008, aus deinen Unterlagen",
        text: `<p>An einem Plattenkondensator wird der Zusammenhang zwischen Ladung Q und Spannung U bei zwei Plattenabständen ${fx("d_1 < d_2")} gemessen. Ordne die Messkurven A und B den Abständen zu und begründe.</p>`,
        fig: "qu",
        parts: [
          { q: "Kurve A gehört zu …", options: ["d₁ (kleinerer Abstand)", "d₂ (größerer Abstand)"], ok: 0 },
        ],
        solution: [
          "Die Steigung im Q-U-Diagramm ist C = Q/U.",
          "Nach C = ε₀·εr·A/d ist die Kapazität beim kleineren Abstand größer.",
          "Die steilere Kurve A hat die größere Kapazität und gehört deshalb zu d₁, Kurve B zu d₂.",
        ],
        reason: {
          prompt: "Deine Begründung",
          crit: [
            { t: "Steigung im Q-U-Diagramm = Kapazität C.", p: 1 },
            { t: "C ~ 1/d: kleinerer Abstand, größere Kapazität.", p: 1 },
            { t: "Zuordnung: A (steiler) zu d₁, B zu d₂.", p: 1 },
          ],
        },
      },
      {
        id: "t3-4", afb: 2, title: "Abstand verdoppeln, mit und ohne Quelle",
        src: "Aufgabe 57 aus deinen Unterlagen",
        text: `<p>Ein Plattenkondensator (${fx("A = 500 `cm²`")}, ${fx("d = 4 `mm`")}, Vakuum) liegt an ${fx("U = 400 `V`")}.</p>
<ol type="a"><li>Welche Ladung nimmt er auf?</li><li>Wie groß ist die Feldstärke?</li><li>Wie ändern sich Ladung und Feldstärke, wenn der Abstand bei angeschlossener Quelle verdoppelt wird?</li><li>Wie ändern sich Ladung, Feldstärke und Spannung, wenn der Abstand erst nach dem Abklemmen der Quelle verdoppelt wird?</li></ol>`,
        answers: [
          { label: "a) Q", value: 44.27, unit: "nC" },
          { label: "b) E", value: 1e5, unit: "V/m" },
        ],
        parts: [
          { q: "c) Ladung", options: ["halbiert sich", "bleibt gleich", "verdoppelt sich"], ok: 0 },
          { q: "c) Feldstärke", options: ["halbiert sich", "bleibt gleich", "verdoppelt sich"], ok: 0 },
          { q: "d) Ladung", options: ["halbiert sich", "bleibt gleich", "verdoppelt sich"], ok: 1 },
          { q: "d) Feldstärke", options: ["halbiert sich", "bleibt gleich", "verdoppelt sich"], ok: 1 },
          { q: "d) Spannung", options: ["halbiert sich", "bleibt gleich", "verdoppelt sich"], ok: 2 },
        ],
        hints: ["Erst C ausrechnen: A = 0,05 m², d = 0,004 m.", "Für c) ist U konstant, für d) ist Q konstant."],
        solution: [
          `a) ${fx("C = ε_0*{A|d} = 8,854*10^-12 * {0,05|0,004} `F` ≈ 1,11*10^-10 `F`")}, ${fx("Q = C*U ≈ 4,4*10^-8 `C` = 44 `nC`")}`,
          `b) ${fx("E = {U|d} = {400 `V`|0,004 `m`} = 1,0*10^5 `V/m`")}`,
          "c) U bleibt 400 V. C halbiert sich, also halbiert sich Q auf 22 nC. E = U/d halbiert sich auf 5·10⁴ V/m.",
          "d) Q bleibt 44 nC. C halbiert sich, also verdoppelt sich U = Q/C auf 800 V. E = 800 V / 0,008 m = 10⁵ V/m bleibt gleich.",
        ],
      },
      {
        id: "t3-5", afb: 2, title: "Plattenabstand und Dielektrikum",
        text: `<p>Ein Luftkondensator hat Platten mit ${fx("A = 400 `cm²`")}.</p>
<ol type="a"><li>Welchen Abstand müssen die Platten haben, damit ${fx("C = 50 `pF`")} beträgt?</li><li>Nun wird der Zwischenraum mit einem Kunststoff gefüllt. Man misst ${fx("C = 115 `pF`")}. Bestimme ${fx("ε_r")}.</li></ol>`,
        answers: [
          { label: "a) d", value: 7.08, unit: "mm" },
          { label: "b) εr", value: 2.3, unit: "" },
        ],
        hints: [`${fx("d = {ε_0*A|C}")} mit A = 0,04 m².`, `${fx("ε_r = {C_mit|C_ohne}")}`],
        solution: [
          `a) ${fx("d = {ε_0*A|C} = {8,854*10^-12 * 0,04|50*10^-12} `m` ≈ 7,1*10^-3 `m` = 7,1 `mm`")}`,
          `b) ${fx("ε_r = {115 `pF`|50 `pF`} = 2,3")}`,
        ],
      },
      {
        id: "t3-6", afb: 2, title: "Das Voltmeter am geladenen Kondensator",
        src: "Warm-up aus deinen Unterlagen",
        text: `<p>Ein Kondensator wird aufgeladen, von der Quelle getrennt und an ein Voltmeter angeschlossen. Was zeigt das Voltmeter, wenn …</p>`,
        parts: [
          { q: "A) die Platten näher zusammengeschoben werden?", options: ["mehr", "gleich viel", "weniger"], ok: 2 },
          { q: "B) die Plattenfläche verdoppelt wird?", options: ["doppelt so viel", "gleich viel", "halb so viel"], ok: 2 },
          { q: "C) ein Styroporblock zwischen die Platten kommt?", options: ["etwas mehr", "gleich viel", "etwas weniger"], ok: 2 },
        ],
        solution: [
          "Getrennt heißt: Q bleibt konstant, also U = Q/C.",
          "A) Kleineres d → C größer → U kleiner.",
          "B) Doppelte Fläche → C doppelt → U halbiert.",
          "C) Styropor hat εr ≈ 1,03 → C etwas größer → U etwas kleiner (kaum messbar).",
        ],
      },
      {
        id: "t3-7", afb: 3, title: "Ein Buch zwischen den Platten",
        src: "Aufgabe 49 aus deinen Unterlagen",
        text: `<p>Ein Kondensator hängt an einer konstanten Hochspannungsquelle. Zwischen den Platten hängt eine kleine geladene Kugel an einem isolierenden Faden und wird zu einer Platte hin ausgelenkt. Jetzt wird ein dickes Buch zwischen die Platten geschoben, ohne Platten oder Kugel zu berühren. Was beobachtet man an der Kugel?</p>`,
        parts: [
          { q: "Die Auslenkung der Kugel …", options: ["a) wird stärker", "b) ändert sich nicht", "c) wird schwächer"], ok: 0 },
        ],
        solution: [
          "Die Quelle bleibt angeschlossen, also bleibt die Spannung U über den ganzen Plattenabstand konstant.",
          "Im Buch (Dielektrikum) ist die Feldstärke kleiner als in Luft.",
          "Die Spannung setzt sich aus den Anteilen im Buch und im Luftspalt zusammen. Ist der Anteil im Buch kleiner, muss die Feldstärke im Luftspalt größer werden, damit die Summe wieder U ergibt. Anders gesagt: C steigt, die Quelle schiebt zusätzliche Ladung auf die Platten.",
          "Die Kugel hängt im Luftspalt. Dort ist E jetzt größer, also wirkt eine größere Kraft: Die Auslenkung wird stärker.",
          `<span class="chip top">Top-Note</span> Viele antworten b), weil „E = U/d bleibt gleich“. Das gilt aber nur, wenn der Raum zwischen den Platten gleichmäßig gefüllt ist.`,
        ],
        reason: {
          prompt: "Deine Begründung",
          crit: [
            { t: "Quelle angeschlossen, also U konstant.", p: 1 },
            { t: "Im Dielektrikum ist das Feld schwächer (bzw. C und Q steigen).", p: 1 },
            { t: "Deshalb ist das Feld im Luftspalt stärker.", p: 1 },
            { t: "Größere Kraft auf die Kugel, also stärkere Auslenkung.", p: 1 },
          ],
        },
      },
      {
        id: "t3-8", afb: 3, title: "Die Gewitterwolke",
        src: "GK Bayern 1998, aus deinen Unterlagen",
        text: `<p>Eine positiv geladene Wolke in ${fx("400 `m`")} Höhe bildet mit dem Erdboden einen Plattenkondensator (Fläche einer „Platte“: ${fx("8,0 `km²`")}). Zwischen Wolke und Erde herrscht ${fx("E = 1,2*10^5 `V/m`")}, so viel, dass ein Blitz unmittelbar bevorsteht.</p>
<ol type="a">
<li>Wie groß ist die Spannung zwischen Wolke und Boden?</li>
<li>Zeige, dass die Wolke eine Ladung von etwa 8,5 C trägt.</li>
<li>Wie lange dauert die Entladung bei einer mittleren Stromstärke von 4,0 kA? Wie viel Energie wird umgewandelt?</li>
<li>Ein Fallwind drückt die Wolke tiefer, ihre Ladung bleibt gleich. Wie ändert sich die Feldstärke? Wird ein Blitz wahrscheinlicher?</li>
<li>Welche Ladung müsste ein kugelförmiges Wassertröpfchen mit 2,0 mm Durchmesser haben, damit es zwischen Wolke und Erde schwebt?</li>
</ol>`,
        answers: [
          { label: "a) U", value: 48, unit: "MV" },
          { label: "c) Dauer", value: 2.13, unit: "ms" },
          { label: "c) Energie (Schulansatz Q·U)", value: 4.08e8, unit: "J" },
          { label: "e) Betrag von q", value: 3.42e-10, unit: "C" },
        ],
        parts: [
          { q: "d) Die Feldstärke …", options: ["nimmt zu", "bleibt gleich", "nimmt ab"], ok: 1 },
        ],
        hints: [
          "a) Homogenes Feld: U = E·d.",
          "b) C = ε₀·A/d mit A = 8,0·10⁶ m², dann Q = C·U.",
          "d) Was bleibt konstant? Schreib E als Funktion von Q.",
          "e) Masse: m = ρ·V mit ρ = 1000 kg/m³ und r = 1,0 mm. Dann q·E = m·g.",
        ],
        solution: [
          `a) ${fx("U = E*d = 1,2*10^5 `V/m` * 400 `m` = 4,8*10^7 `V` = 48 `MV`")}`,
          `b) ${fx("C = ε_0*{A|d} = 8,854*10^-12 * {8,0*10^6|400} `F` ≈ 1,77*10^-7 `F`")}, ${fx("Q = C*U ≈ 1,77*10^-7 `F` * 4,8*10^7 `V` ≈ 8,5 `C`")}`,
          `c) ${fx("t = {Q|I} = {8,5 `C`|4000 `A`} ≈ 2,1 `ms`")}. Energie nach dem Ansatz aus dem Unterricht: ${fx("E = Q*U ≈ 4,1*10^8 `J`")}. <span class="chip top">Top-Note</span> Da die Spannung beim Entladen absinkt, wird genau genommen nur ${fx("{1|2}*Q*U ≈ 2,0*10^8 `J`")} frei.`,
          `d) Q bleibt konstant. ${fx("E = {U|d} = {Q|C*d} = {Q|ε_0*A}")} hängt nicht von d ab: Die Feldstärke bleibt gleich. Die Spannung sinkt sogar (${fx("U = E*d")}). Im Kondensatormodell wird ein Blitz deshalb <strong>nicht</strong> wahrscheinlicher.`,
          `<div class="callout">In den Unterrichtsnotizen steht bei d) „Feldstärke nimmt zu“. Das gilt aber nur bei konstanter Spannung. Hier bleibt die Ladung konstant, deshalb bleibt E gleich. Frag im Zweifel deine Lehrkraft, welche Antwort sie erwartet.</div>`,
          `e) ${fx("V = {4|3}*π*r^3 = {4|3}*π*(10^-3 `m`)^3 ≈ 4,19*10^-9 `m³`")}, ${fx("m = ρ*V ≈ 4,19*10^-6 `kg`")}`,
          `${fx("q = {m*g|E} = {4,19*10^-6 `kg` * 9,81 `m/s²`|1,2*10^5 `V/m`} ≈ 3,4*10^-10 `C`")}. Das Feld zeigt von der Wolke (+) nach unten. Damit die Kraft nach oben zeigt, muss das Tröpfchen <strong>negativ</strong> sein: ${fx("q ≈ -3,4*10^-10 `C`")}.`,
        ],
        reason: {
          prompt: "Deine Begründung zu d)",
          crit: [
            { t: "Ladung Q bleibt konstant.", p: 1 },
            { t: "E = Q/(ε₀·A) bzw. C steigt und U sinkt so, dass E gleich bleibt.", p: 1 },
            { t: "Folgerung: Blitz nicht wahrscheinlicher (im Modell).", p: 1 },
          ],
        },
      },
      {
        id: "t3-9", afb: 3, title: "Ein Zylinderkondensator als Füllstandsmesser",
        src: "Abitur Bayern 2024, aus deinen Unterlagen",
        text: `<p>Zwei ineinanderstehende Metallzylinder (Höhe ${fx("h = 85,3 `cm`")}, Radien ${fx("r_1 = 1,6 `cm`")} und ${fx("r_2 = 4,3 `cm`")}) bilden einen Kondensator. Er misst den Füllstand ${fx("x")} von Öl (${fx("ε_r = 2,5")}). Gegeben:</p>
${fbox("C_0 = 2*π*ε_0*{h|ln({r_2|r_1})}", "C = C_0 + C_0*(ε_r - 1)*{x|h}")}
<ol type="a">
<li>Skizziere das Feldlinienbild zwischen den Zylindern (Draufsicht, acht Feldlinien).</li>
<li>Skizziere zum Vergleich das Feld eines Plattenkondensators.</li>
<li>Zeichne das x-C-Diagramm für ${fx("0 ≤ x ≤ h")} und erkläre den Verlauf. (Kontrolle: ${fx("C_0 = 48 `pF`")})</li>
<li>Eine Warnlampe geht an, sobald C unter 86 pF fällt. Bestimme den zugehörigen Füllstand.</li>
</ol>`,
        answers: [
          { label: "c) C bei vollem Tank", value: 120, unit: "pF" },
          { label: "d) Grenz-Füllstand x", value: 45, unit: "cm" },
        ],
        field: ["zylinder", "platten"],
        solFig: "fuellstand",
        hints: [
          "a) Innerer Zylinder +, äußerer −: Die Linien laufen radial, wie Speichen eines Rades.",
          "c) C hängt linear von x ab. Berechne C bei x = 0 und bei x = h.",
          "d) C = 86 pF in die zweite Formel einsetzen und nach x auflösen.",
        ],
        solution: [
          "a) Radiale Linien vom inneren zum äußeren Zylinder, senkrecht auf beiden Oberflächen, innen dichter (stärkeres Feld). Das Feld ist inhomogen. b) Beim Plattenkondensator: parallele Linien mit gleichem Abstand, homogen. (Beide Bilder siehst du unten nach dem Aufdecken.)",
          `c) ${fx("C_0 = 2*π*8,854*10^-12 * {0,853|ln(2,69)} `F` ≈ 48 `pF`")}. Bei vollem Tank: ${fx("C = C_0*ε_r = 120 `pF`")}. Dazwischen steigt C linear mit x (Gerade), weil der ölgefüllte Teil wie ein zweiter Kondensator mit größerem ${fx("ε_r")} wirkt.`,
          `d) ${fx("x = {(C - C_0)*h|C_0*(ε_r - 1)} = {(86 - 48)*85,3 `cm`|48*1,5} ≈ 45 `cm`")}. Unterhalb von etwa 45 cm geht die Warnlampe an.`,
        ],
      },
    ],
  },

  /* ---------------------------------------------------------- 4 */
  {
    id: "kurven",
    nr: 4,
    title: "Lade- und Entladekurven",
    short: "Kurven",
    focus: true,
    lead: "Ein Kondensator lädt sich nicht auf einen Schlag auf. Die Kurven dazu musst du skizzieren und den Einfluss von R und C begründen können.",
    steps: [
      {
        id: "r1",
        title: "Die Schaltung",
        body: `
<div class="fig" data-fig="schaltung"></div>
<p>Schalterstellung <strong>1</strong>: Der Kondensator wird über den Widerstand ${fx("R_1")} geladen. Schalterstellung <strong>2</strong>: Die Quelle ist abgetrennt, der Kondensator entlädt sich über ${fx("R_2")}. Ein Voltmeter misst ${fx("U_C")} am Kondensator, ein Amperemeter den Strom.</p>
<p>Die Widerstände begrenzen den Strom. Ohne sie gäbe es beim Laden und Entladen einen Kurzschluss mit sehr hohem Strom, der den Kondensator zerstören kann.</p>`,
        check: {
          q: "Wozu dient der Widerstand im Entladestromkreis?",
          options: [
            { t: "Er begrenzt den Strom, sonst entsteht ein Kurzschluss.", ok: true, why: "Genau. Ein Kondensator mit großer Kapazität kann durch den kurzzeitig riesigen Strom zerstört werden." },
            { t: "Er speichert die Ladung.", why: "Ladung speichert der Kondensator. Der Widerstand wandelt Energie in Wärme um und begrenzt den Strom." },
            { t: "Er erhöht die Spannung.", why: "An einem Widerstand fällt Spannung ab. Er erhöht sie nicht." },
          ],
        },
      },
      {
        id: "r2",
        title: "Laden: Strom fällt, Spannung steigt",
        body: `
<div class="fig" data-fig="ladeMini"></div>
<p>Im Einschaltmoment ist der Kondensator leer (${fx("U_C = 0")}). Die ganze Spannung liegt am Widerstand, und der Strom springt sofort auf seinen Höchstwert:</p>
${fbox("I_0 = {U_0|R}")}
<p>Je mehr Ladung auf den Platten sitzt, desto größer wird ${fx("U_C")}. Diese Spannung wirkt der Quelle entgegen. Am Widerstand bleibt nur noch ${fx("U_0 - U_C")} übrig, also fließt weniger Strom. Deshalb wird das Laden immer langsamer: Der Strom fällt exponentiell gegen null, ${fx("U_C")} nähert sich ${fx("U_0")}.</p>
<p>Ist ${fx("U_C = U_0")}, fließt kein Strom mehr. Ein geladener Kondensator sperrt Gleichstrom, er wirkt wie ein unendlich großer Widerstand.</p>`,
        check: {
          q: "Warum wird das Aufladen mit der Zeit immer langsamer?",
          options: [
            { t: "Der Widerstand erwärmt sich und wird größer.", why: "Das spielt hier keine Rolle. Der Grund liegt im Kondensator selbst." },
            { t: "U_C wirkt der Quelle entgegen, am Widerstand bleibt weniger Spannung, also fließt weniger Strom.", ok: true, why: "Genau das ist der Mechanismus hinter der e-Funktion." },
            { t: "Die Quelle wird schwächer.", why: "Die Quelle liefert die ganze Zeit dieselbe Spannung U₀." },
          ],
        },
      },
      {
        id: "r3",
        title: "Entladen: Der Strom kehrt sich um",
        body: `
<div class="fig" data-fig="entladeMini"></div>
<p>Jetzt ist der Kondensator selbst die Quelle. Im ersten Moment fließt der größte Strom ${fx("I_0 = {U_0|R}")}, aber <strong>in entgegengesetzter Richtung</strong> zum Ladestrom. Im I-t-Diagramm liegt die Entladekurve deshalb unter der t-Achse.</p>
<p>Spannung und Strom fallen exponentiell auf null. Die Polung der Kondensatorspannung bleibt dabei gleich.</p>
<div class="callout"><b>Klausur-Klassiker:</b> Beim Skizzieren der Entladung den Strom negativ einzeichnen. Die Spannung bleibt positiv.</div>`,
        check: {
          q: "Wie sieht die I-t-Kurve beim Entladen aus?",
          options: [
            { t: "Sie springt auf +I₀ und fällt auf null, wie beim Laden.", why: "Der Betrag stimmt, aber die Richtung des Stroms kehrt sich um." },
            { t: "Sie springt auf −I₀ und nähert sich von unten der Null.", ok: true, why: "Der Entladestrom fließt entgegengesetzt zum Ladestrom." },
            { t: "Sie steigt von null auf I₀.", why: "Das ist der Verlauf der Spannung beim Laden, nicht des Stroms." },
          ],
        },
      },
      {
        id: "r4",
        title: "Einfluss von R und C",
        body: `
<p>Wie schnell geladen und entladen wird, bestimmt das Produkt ${fx("R*C")}. Es heißt Zeitkonstante und hat die Einheit ${fx("`Ω·F` = {`V`|`A`}*{`A·s`|`V`} = `s`")}.</p>
<ul>
<li><strong>Größeres C:</strong> Es muss mehr Ladung fließen. Der Anfangsstrom bleibt gleich (${fx("I_0 = {U_0|R}")}), aber das Laden dauert länger. Die Fläche unter der I-t-Kurve (${fx("Q = C*U_0")}) wird größer.</li>
<li><strong>Größeres R:</strong> Der Anfangsstrom ist kleiner, dieselbe Ladung braucht also länger. Die Fläche unter der I-t-Kurve bleibt gleich, die Kurve wird flacher und breiter.</li>
</ul>
<p>Merksatz: <em>Je größer R · C, desto langsamer wird geladen und entladen.</em></p>`,
        check: {
          q: "C wird verdoppelt, R bleibt gleich. Was passiert mit dem Anfangsstrom beim Laden?",
          options: [
            { t: "Er verdoppelt sich.", why: "Im ersten Moment ist der Kondensator leer, der Strom hängt nur von U₀ und R ab." },
            { t: "Er bleibt gleich.", ok: true, why: "I₀ = U₀/R. Nur die Dauer ändert sich, weil mehr Ladung fließen muss." },
            { t: "Er halbiert sich.", why: "Das passiert, wenn R verdoppelt wird." },
          ],
        },
      },
      {
        id: "r5",
        title: "Kapazität aus der Kurve bestimmen",
        body: `
<p>Zwei Wege, mit denen du aus einer gemessenen Entladekurve die Kapazität bekommst:</p>
<ol>
<li><strong>Über die Fläche:</strong> Kästchen unter der I-t-Kurve zählen und mit dem Wert eines Kästchens multiplizieren. Das ergibt Q. Dann ${fx("C = {Q|U_0}")}.</li>
<li><strong>Über die Halbwertszeit:</strong> Ablesen, wann U oder I auf die Hälfte gefallen ist.</li>
</ol>
${fbox("t_½ = R*C*ln 2 ≈ 0,69*R*C", "t_¼ = 2*t_½", "C = {t_½|R*ln 2}")}
<p>Nach einer Halbwertszeit ist noch die Hälfte übrig, nach zwei ein Viertel, nach drei ein Achtel. Die Halbwertszeit ist immer gleich lang, egal wo auf der Kurve du startest. Daran erkennst du eine Exponentialfunktion.</p>`,
        check: {
          q: "Die Halbwertszeit beträgt 2 s. Wann ist der Kondensator auf ein Achtel entladen?",
          options: [
            { t: "Nach 4 s", why: "Nach 4 s (zwei Halbwertszeiten) ist noch ein Viertel übrig." },
            { t: "Nach 6 s", ok: true, why: "½ · ½ · ½ = ⅛, also drei Halbwertszeiten: 3 · 2 s = 6 s." },
            { t: "Nach 16 s", why: "Die Halbwertszeiten werden addiert, nicht mit 8 multipliziert." },
          ],
        },
      },
      {
        id: "r6",
        top: true,
        title: "Die Formel hinter der Kurve",
        body: `
${fbox("I(t) = I_0*e^{-t/(R*C)}", "U_C(t) = U_0*e^{-t/(R*C)}", note("beim Entladen"))}
<p>Herleitung der Halbwertszeit: Nach ${fx("t_½")} gilt ${fx("I = {I_0|2}")}, also</p>
${fbox("e^{-t_½/(R*C)} = {1|2}", "-{t_½|R*C} = ln {1|2} = -ln 2", "t_½ = R*C*ln 2")}
<p>Beim Laden gilt für die Spannung ${fx("U_C(t) = U_0*(1 - e^{-t/(R*C)})")}.</p>`,
      },
    ],
    traps: [
      { t: "Entladestrom negativ", d: "Der Strom wechselt die Richtung, die Kondensatorspannung nicht." },
      { t: "Laden nicht verwechseln", d: "Der Strom springt sofort hoch und fällt. Die Spannung startet bei null und steigt." },
      { t: "Kästchenwert", d: "Ein Kästchen ist ΔI · Δt wert, nicht nur ΔI." },
      { t: "Null wird nie erreicht", d: "Die Kurve nähert sich null nur an. Nach etwa 5 · R · C gilt der Vorgang als abgeschlossen." },
    ],
    tasks: [
      {
        id: "t4-1", afb: 1, title: "Entladen und Laden skizzieren",
        src: "aus deinen Unterrichtsunterlagen",
        type: "sketch",
        text: `<p>Ein voll geladener Kondensator wird erst über einen Widerstand entladen und danach wieder aufgeladen. Skizziere dazu auf Papier das U-t-Diagramm und das I-t-Diagramm untereinander.</p>`,
        solFig: "skizze",
        crit: [
          { t: "Entladen: U fällt exponentiell von U₀ auf null.", p: 1 },
          { t: "Entladen: I springt auf −I₀ und nähert sich von unten der Null.", p: 1 },
          { t: "Laden: U steigt von null und nähert sich U₀ an (abflachend).", p: 1 },
          { t: "Laden: I springt auf +I₀ und fällt exponentiell auf null.", p: 1 },
          { t: "Achsen beschriftet (t, U bzw. I) und Kurven ohne Knicke.", p: 1 },
        ],
      },
      {
        id: "t4-2", afb: 1, title: "Lückentext: Was beim Laden passiert",
        src: "aus deinen Unterrichtsunterlagen",
        type: "cloze",
        cloze: [
          "Im Einschaltaugenblick springt der ", ["Strom", "Spannung", "Widerstand"], " von null auf seinen Maximalwert. Danach wird er nach einer ",
          ["e-Funktion", "Geraden", "Parabel"], " immer kleiner. Je länger der Ladevorgang dauert, desto ", ["weniger", "mehr", "gleich viel"],
          " Strom fließt. Während der Strom gegen null sinkt, steigt die ", ["Spannung", "Stromstärke", "Kapazität"],
          " am Kondensator auf ihren Maximalwert. Hat die Kondensatorspannung die Ladespannung erreicht, fließt kein Strom mehr: Der Kondensator wirkt wie ein ",
          ["unendlich großer Widerstand", "Kurzschluss", "Draht"], ". Beim Entladen wirkt der Kondensator wie eine ", ["Spannungsquelle", "Lampe", "Spule"],
          ". Der Entladestrom fließt in ", ["entgegengesetzter", "gleicher", "senkrechter"], " Richtung zum Ladestrom. Man sollte einen Kondensator nie durch einen ",
          ["Kurzschluss", "Widerstand", "Schalter"], " entladen.",
        ],
      },
      {
        id: "t4-3", afb: 2, title: "Welche Kurve gehört zu welchem Kondensator?",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Drei Kondensatoren mit ${fx("100 `µF`")}, ${fx("1000 `µF`")} und ${fx("10000 `µF`")} werden jeweils über denselben Widerstand ${fx("R = 1 `kΩ`")} an 10 V geladen. Ordne die Kurven zu.</p>`,
        fig: "zuordnung",
        parts: [
          { q: "Kurve ①", options: ["100 µF", "1000 µF", "10000 µF"], ok: 1 },
          { q: "Kurve ②", options: ["100 µF", "1000 µF", "10000 µF"], ok: 0 },
          { q: "Kurve ③", options: ["100 µF", "1000 µF", "10000 µF"], ok: 2 },
        ],
        solution: [
          "Je größer C, desto größer R·C, desto langsamer steigt die Spannung.",
          "② ist am schnellsten (100 µF, R·C = 0,1 s), ① mittel (1000 µF, R·C = 1 s), ③ am langsamsten (10000 µF, R·C = 10 s).",
        ],
      },
      {
        id: "t4-4", afb: 2, title: "Kästchen zählen: die Kapazität aus der Entladekurve",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Ein Kondensator wird mit ${fx("10 `V`")} voll geladen und über einen ${fx("10 `Ω`")}-Widerstand vollständig entladen. Dabei wird die gezeigte Kurve aufgenommen (Betrag des Entladestroms).</p>
<ol type="a"><li>Bestimme die gespeicherte Ladung.</li><li>Bestimme die Kapazität.</li><li>Lies die Halbwertszeit und die Viertelwertszeit ab.</li><li>Prüfe, dass ${fx("t_½ = R*C*ln 2")} gilt.</li></ol>`,
        fig: "kaestchen",
        answers: [
          { label: "a) Q", value: 0.45, unit: "C", tol: 0.12 },
          { label: "b) C", value: 45, unit: "mF", tol: 0.12 },
          { label: "c) t½", value: 0.31, unit: "s", tol: 0.12 },
        ],
        hints: [
          "Ein kleines Kästchen ist 0,1 A hoch und 0,1 s breit, also 0,01 C wert.",
          "Zähle die vollen Kästchen und schätze Teilstücke zusammen. Es sind etwa 45.",
          `${fx("C = {Q|U_0}")}. Für die Halbwertszeit: Wann ist der Strom von 1 A auf 0,5 A gefallen?`,
        ],
        solution: [
          "a) Ungefähr 45 Kästchen à 0,01 C: Q ≈ 0,45 C.",
          `b) ${fx("C = {Q|U_0} = {0,45 `C`|10 `V`} = 0,045 `F` = 45 `mF`")}`,
          "c) Der Strom ist bei t ≈ 0,31 s auf 0,5 A gefallen (t½) und bei t ≈ 0,62 s auf 0,25 A (t¼ = 2·t½).",
          `d) ${fx("R*C*ln 2 = 10 `Ω` * 0,045 `F` * 0,693 ≈ 0,31 `s`")}. Passt. Einheit: ${fx("`Ω·F` = `s`")}.`,
        ],
      },
      {
        id: "t4-5", afb: 2, title: "Halbwertszeit berechnen",
        text: `<p>Ein Kondensator mit ${fx("220 `µF`")} wird über ${fx("47 `kΩ`")} entladen.</p>
<ol type="a"><li>Berechne die Halbwertszeit.</li><li>Nach welcher Zeit ist nur noch ein Achtel der Anfangsspannung übrig?</li></ol>`,
        answers: [
          { label: "a) t½", value: 7.167, unit: "s" },
          { label: "b) t", value: 21.5, unit: "s" },
        ],
        hints: [`${fx("t_½ = R*C*ln 2")}`, "Ein Achtel = drei Halbwertszeiten."],
        solution: [
          `a) ${fx("t_½ = 47000 `Ω` * 220*10^-6 `F` * 0,693 ≈ 7,2 `s`")}`,
          `b) ${fx("t = 3*t_½ ≈ 21,5 `s`")}`,
        ],
      },
      {
        id: "t4-6", afb: 3, title: "Einfluss von R und C begründen",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Beschreibe und begründe, wie sich die Lade- und Entladekurven ändern, wenn</p><ol type="a"><li>die Kapazität verdoppelt wird,</li><li>der Widerstand verdoppelt wird.</li></ol>`,
        solution: [
          "a) Der Anfangsstrom I₀ = U₀/R bleibt gleich. Weil doppelt so viel Ladung (Q = C·U₀) fließen muss, dauert das Laden und Entladen länger: Die Halbwertszeit t½ = R·C·ln2 verdoppelt sich. Die Fläche unter der I-t-Kurve verdoppelt sich.",
          "b) Der Anfangsstrom halbiert sich. Dieselbe Ladung fließt also langsamer: Die Halbwertszeit verdoppelt sich ebenfalls. Die Fläche unter der I-t-Kurve bleibt gleich, die Kurve wird flacher und breiter.",
          "Die Endwerte (U₀ beim Laden, 0 beim Entladen) bleiben in beiden Fällen gleich.",
        ],
        reason: {
          prompt: "Deine Antwort",
          crit: [
            { t: "a) Anfangsstrom bleibt gleich (I₀ = U₀/R).", p: 1 },
            { t: "a) Vorgang dauert länger, t½ verdoppelt sich.", p: 1 },
            { t: "a) Fläche unter der I-t-Kurve (Ladung) verdoppelt sich.", p: 1 },
            { t: "b) Anfangsstrom halbiert sich.", p: 1 },
            { t: "b) Vorgang dauert länger, Fläche (Ladung) bleibt gleich.", p: 1 },
            { t: "Begründung über R·C bzw. t½ = R·C·ln 2.", p: 1 },
          ],
        },
      },
      {
        id: "t4-7", afb: 3, title: "Ein Experiment zur Kapazität planen",
        src: "aus deinen Unterrichtsunterlagen",
        text: `<p>Beschreibe ein Experiment, mit dem man die Kapazität eines unbekannten Kondensators bestimmen kann. Erkläre, wie du die Messwerte auswertest.</p>`,
        solution: [
          "Aufbau: Kondensator mit Umschalter an eine Quelle mit bekannter Spannung U₀ anschließen, Entladestromkreis mit bekanntem Widerstand R und Amperemeter (bzw. Messwerterfassung).",
          "Kondensator voll aufladen (bis U_C = U₀), dann umschalten und den Entladestrom über die Zeit aufzeichnen.",
          "Auswertung 1: Fläche unter der I-t-Kurve (Kästchen zählen) ergibt Q, dann C = Q/U₀.",
          "Auswertung 2: Halbwertszeit ablesen, dann C = t½/(R·ln 2).",
          "Messung mehrfach wiederholen und Ergebnisse mitteln.",
        ],
        reason: {
          prompt: "Deine Beschreibung",
          crit: [
            { t: "Aufbau mit Quelle (U₀ bekannt), Umschalter, bekanntem Widerstand und Strom-/Spannungsmessung.", p: 1 },
            { t: "Erst vollständig laden, dann entladen und I(t) aufzeichnen.", p: 1 },
            { t: "Auswertung über Fläche: Q aus I-t-Kurve, C = Q/U₀.", p: 1 },
            { t: "Oder Auswertung über t½: C = t½/(R·ln 2).", p: 1 },
          ],
        },
      },
    ],
  },
];

/* ============================================================
   Karteikarten: Definitionen (AFB 1)
   ============================================================ */
const CARDS = [
  { id: "c1", term: "Elementarladung", def: `Kleinste frei vorkommende Ladung, die Ladung eines Elektrons (ohne Vorzeichen). ${fx("e = 1,602*10^-19 `C`")}. Jede Ladung ist ein Vielfaches: ${fx("Q = N*e")}.` },
  { id: "c2", term: "Elektrische Stromstärke", def: `Ladung, die pro Zeit durch einen Leiterquerschnitt fließt: ${fx("I = {ΔQ|Δt}")}, Einheit Ampere.` },
  { id: "c3", term: "Elektrisches Feld", def: "Raum um einen geladenen Körper, in dem auf andere Ladungen eine Kraft wirkt." },
  { id: "c4", term: "Elektrische Feldstärke", def: `Kraft auf eine positive Probeladung geteilt durch deren Ladung: ${fx("E = {F_el|q}")}. Einheit N/C = V/m. Sie zeigt in Richtung der Kraft auf eine positive Ladung.` },
  { id: "c5", term: "Probeladung", def: "Kleine positive Ladung, die das Feld selbst nicht verändert. Mit ihr misst man Richtung und Stärke des Feldes." },
  { id: "c6", term: "Feldlinien", def: "Modell für die Richtung der Kraft auf eine positive Probeladung. Sie laufen von + nach −, schneiden sich nie, treffen senkrecht auf Leiteroberflächen. Je dichter, desto stärker das Feld." },
  { id: "c7", term: "Homogenes Feld", def: "Feld, dessen Stärke und Richtung überall gleich ist. Parallele Feldlinien mit gleichem Abstand, z. B. im Plattenkondensator." },
  { id: "c8", term: "Influenz", def: "Verschiebung der freien Ladungen in einem Leiter durch ein äußeres elektrisches Feld." },
  { id: "c9", term: "Faradayscher Käfig", def: "Leitende Hülle, deren Inneres feldfrei ist, weil die Influenzladungen ein Gegenfeld erzeugen, das das äußere Feld innen aufhebt." },
  { id: "c10", term: "Elektrische Spannung", def: `Energie, die pro Ladung beim Verschieben zwischen zwei Punkten umgesetzt wird: ${fx("U = {W|q}")}. Einheit V = J/C.` },
  { id: "c11", term: "Kondensator", def: "Zwei Leiter, die durch einen Isolator (Dielektrikum) getrennt sind. Er speichert Ladung und elektrische Energie." },
  { id: "c12", term: "Dielektrikum", def: "Isolierendes Material zwischen den Kondensatorplatten. Es wird polarisiert, schwächt das Feld und erhöht die Kapazität um den Faktor εr." },
  { id: "c13", term: "Kapazität", def: `Gibt an, wie viel Ladung ein Kondensator pro Volt speichert: ${fx("C = {Q|U}")}. Einheit Farad (F = C/V). Für Plattenkondensatoren: ${fx("C = ε_0*ε_r*{A|d}")}.` },
  { id: "c14", term: "Dielektrizitätszahl εr", def: "Materialkonstante ohne Einheit. Gibt an, um welchen Faktor ein Material die Kapazität gegenüber Vakuum vergrößert." },
  { id: "c15", term: "Elektrische Feldkonstante ε₀", def: `Naturkonstante: ${fx("ε_0 = 8,854*10^-12 {`A·s`|`V·m`}")}.` },
  { id: "c16", term: "Halbwertszeit (Kondensator)", def: `Zeit, nach der Spannung bzw. Strom auf die Hälfte gefallen sind: ${fx("t_½ = R*C*ln 2")}.` },
  { id: "c17", term: "Zeitkonstante R · C", def: "Produkt aus Widerstand und Kapazität, Einheit Sekunde. Je größer R·C, desto langsamer wird geladen und entladen." },
  { id: "c18", term: "Farad", def: "Einheit der Kapazität: 1 F = 1 C/V. Ein Kondensator mit 1 F speichert bei 1 V die Ladung 1 C." },
];

/* ============================================================
   Formelkarte
   ============================================================ */
const FORMULAS = [
  {
    group: "Ladung und Strom", st: "feld",
    rows: [
      ["Q = N*e", "Ladung aus Anzahl der Elektronen", "C"],
      ["I = {ΔQ|Δt}", "Stromstärke", "A = C/s"],
      ["Q = Fläche unter I(t)", "Ladung bei veränderlichem Strom (Kästchen zählen)", "A·s = C"],
    ],
  },
  {
    group: "Elektrisches Feld", st: "feld",
    rows: [
      ["E = {F_el|q}", "Feldstärke (Definition)", "N/C = V/m"],
      ["F_el = q*E", "Kraft auf eine Ladung im Feld", "N"],
    ],
  },
  {
    group: "Spannung und Energie", st: "spannung",
    rows: [
      ["W = q*E*s", "Arbeit im homogenen Feld (entlang der Feldlinien)", "J"],
      ["U = {W|q}", "Spannung = Energie pro Ladung", "V = J/C"],
      ["E_el = q*U", "Energie, die eine Ladung beim Durchlaufen von U gewinnt", "J"],
      ["U = E*d", "nur im homogenen Feld", "V"],
      ["q*U = {1|2}*m*v^2", "Energieerhaltung, Start aus der Ruhe", ""],
      ["q*{U|d} = m*g", "Schweben (Millikan)", ""],
      ["P = U*I", "Leistung", "W"],
      ["E = U*I*t", "Energie im Stromkreis", "J"],
    ],
  },
  {
    group: "Kondensator", st: "kondensator",
    rows: [
      ["C = {Q|U}", "Kapazität (Definition)", "F = C/V"],
      ["C = ε_0*ε_r*{A|d}", "Plattenkondensator", "F"],
      ["E = {Q|ε_0*ε_r*A}", "Top-Note: zeigt, dass E bei konstantem Q nicht von d abhängt", "V/m"],
    ],
  },
  {
    group: "Laden und Entladen", st: "kurven",
    rows: [
      ["I_0 = {U_0|R}", "Anfangsstrom", "A"],
      ["t_½ = R*C*ln 2", "Halbwertszeit", "s"],
      ["t_¼ = 2*t_½", "Viertelwertszeit", "s"],
      ["I(t) = I_0*e^{-t/(R*C)}", "Top-Note: Strom beim Laden und Entladen (Betrag)", "A"],
    ],
  },
];
const CONSTANTS = [
  ["e = 1,602*10^-19 `C`", "Elementarladung"],
  ["m_e = 9,109*10^-31 `kg`", "Elektronenmasse"],
  ["ε_0 = 8,854*10^-12 {`A·s`|`V·m`}", "elektrische Feldkonstante"],
  ["g = 9,81 `m/s²`", "Fallbeschleunigung"],
];
const PREFIXES = "k = 10³ · m = 10⁻³ · µ = 10⁻⁶ · n = 10⁻⁹ · p = 10⁻¹² · 1 cm² = 10⁻⁴ m² · 1 mm = 10⁻³ m";

/* ============================================================
   Klausurliste (aus den Notizen, S. 54) und Lernplan
   ============================================================ */
const EXAM_LIST = [
  { id: "e1", t: "Definitionen sicher wiedergeben", go: "karten", goT: "Karteikarten" },
  { id: "e2", t: "Formeln anwenden und einsetzen (AFB 1)", go: "formeln", goT: "Formelkarte" },
  { id: "e3", t: "Formeln kombinieren, z. B. q·U = ½mv² oder q·U/d = m·g (AFB 2)", go: "spannung", goT: "Station 2" },
  { id: "e4", t: "Unbekannte Situationen mit bisherigem Wissen lösen (AFB 3)", go: "kondensator", goT: "Station 3, Aufgaben" },
  { id: "e5", t: "Feldlinienbilder zeichnen, Rechnungen zur Feldstärke", go: "feld", goT: "Station 1" },
  { id: "e6", t: "Kondensator: Definition, Q, U, C und geometrische Kapazität", go: "kondensator", goT: "Station 3" },
  { id: "e7", t: "Änderungen von Abstand, Fläche, Dielektrikum begründen", go: "trainer", goT: "Trainer" },
  { id: "e8", t: "Lade- und Entladekurven skizzieren, Einfluss der Kapazität beschreiben", go: "kurven", goT: "Station 4" },
];

const PLANS = {
  1: [
    { day: "Heute", items: [
      ["karten", "Definitionen mit den Karteikarten (20 min)"],
      ["trainer", "Trainer „Was passiert, wenn …?“, bis 8 richtig in Folge (30 min)"],
      ["kurven", "Station 4: Schritte 2 bis 5 und Aufgabe „Entladen und Laden skizzieren“ (40 min)"],
      ["spannung", "Station 2: Schritte 3 bis 5 und Aufgabe „Die Spannung wird halbiert“ (30 min)"],
      ["kondensator", "Klausuraufgabe „Die Gewitterwolke“ komplett (30 min)"],
      ["formeln", "Formelkarte zum Schluss einmal durchgehen (10 min)"],
    ] },
  ],
  2: [
    { day: "Tag 1", items: [
      ["feld", "Station 1: alle Schritte, Aufgaben AFB 1 und 2"],
      ["spannung", "Station 2: alle Schritte und Simulation, Aufgaben AFB 1 und 2"],
      ["karten", "Karteikarten einmal komplett"],
    ] },
    { day: "Tag 2", items: [
      ["kondensator", "Station 3: alle Schritte, Labor und Trainer"],
      ["kurven", "Station 4: alle Schritte, Simulation und Aufgaben"],
      ["kondensator", "AFB-3-Aufgaben: Buch, Gewitterwolke, Füllstandsmesser"],
      ["karten", "Karteikarten: nur noch die offenen"],
    ] },
  ],
  3: [
    { day: "Tag 1", items: [
      ["feld", "Station 1 komplett, inkl. Feldlinien-Simulation"],
      ["spannung", "Station 2 komplett, inkl. Simulation"],
      ["karten", "Karteikarten einmal komplett"],
    ] },
    { day: "Tag 2", items: [
      ["kondensator", "Station 3: Schritte, Labor, Trainer"],
      ["kurven", "Station 4: Schritte, Simulation"],
      ["formeln", "Formelkarte: jede Formel einmal laut erklären"],
    ] },
    { day: "Tag 3", items: [
      ["kondensator", "Alle AFB-3-Aufgaben in Station 3 und 4"],
      ["trainer", "Trainer, bis 10 richtig in Folge"],
      ["karten", "Karteikarten: nur noch die offenen"],
    ] },
  ],
};
