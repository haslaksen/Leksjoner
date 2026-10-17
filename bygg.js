// Bygger nettstedet til mappen public/ (kjøres av Vercel, se vercel.json).
//   public/                 Elevversjon: fasit og lærernotater er fjernet fra filene.
//   public/<LAERER_STI>/    Lærerversjon: leksjonene slik de er, med fasit.
// Kjør lokalt med: node bygg.js
const fs = require("fs");
const path = require("path");

const LAERER_STI = "laerer-k7q4mz";
const UT = path.join(__dirname, "public");

const FILER = "filer"; // Bilder og vedlegg lastet opp av lærerne, én mappe per emne.
const leksjoner = [];
function finn(dir) {
  for (const e of fs.readdirSync(path.join(__dirname, dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== FILER) finn(rel); }
    else if (e.name.endsWith(".html")) leksjoner.push(rel);
  }
}
for (const trinn of ["vg1", "vg2"]) finn(trinn);
const filer = ["index.html", ...leksjoner];

// Fjerner <tag class="klasse ...">...</tag> med alt innhold (også nestede tag).
function fjernElement(s, navn, klasse) {
  const start = new RegExp(`<${navn}\\b[^>]*class="${klasse}[" ][^>]*>`, "g");
  let m, ut = "", pos = 0;
  while ((m = start.exec(s))) {
    let dybde = 1, i = m.index + m[0].length;
    const tag = new RegExp(`<(\\/?)${navn}\\b[^>]*>`, "g");
    tag.lastIndex = i;
    let t;
    while (dybde && (t = tag.exec(s))) dybde += t[1] ? -1 : 1;
    if (dybde) throw new Error(`Fant ikke slutten på ${navn}.${klasse}`);
    ut += s.slice(pos, m.index);
    pos = tag.lastIndex;
    start.lastIndex = pos;
  }
  return ut + s.slice(pos);
}

// Fjerner «ans: <verdi>» fra objekter i skriptene (fasit som tegnes inn i figurer).
function fjernAns(s) {
  const re = /,\s*ans:\s*/g;
  let m;
  while ((m = re.exec(s))) {
    let i = m.index + m[0].length, dybde = 0;
    for (; i < s.length; i++) {
      const c = s[i];
      if (c === "[" || c === "{" || c === "(") dybde++;
      else if (c === "]" || c === "}" || c === ")") { if (!dybde) break; dybde--; }
      else if (c === "," && !dybde) break;
    }
    s = s.slice(0, m.index) + s.slice(i);
    re.lastIndex = m.index;
  }
  return s;
}

function elevversjon(s) {
  s = fjernElement(s, "span", "fasit");
  s = fjernElement(s, "details", "laerer"); // Lærernotater
  // Linjer i skriptene som tegner fasit i SVG-figurer.
  s = s.split("\n").filter(l => !l.includes('class="fasit-svg"')).join("\n");
  s = fjernAns(s);
  // Fasitknappen skjules (den finnes fortsatt så skriptene virker).
  s = s.replace(/<button\b([^>]*id="(?:fasitBtn|btnFasit)"[^>]*)>/g, '<button$1 hidden style="display:none">');
  if (/class="(fasit|fasit-svg|laerer)[" ]|ans:\s*[\[t]/.test(s)) throw new Error("Fasit ble ikke fjernet helt");
  return s;
}

// Lærersidene får et rødt felt øverst med lenke til elevversjonen.
const FELT = 'style="background:#c92a2a;color:#fff;padding:10px 16px;text-align:center;font:500 15px/1.45 system-ui,sans-serif"';
// Hjem-knapp til lærerforsiden (bare på lærersidene, elevene skal ikke få den).
const HJEM = 'style="display:inline-block;margin-right:12px;padding:3px 12px;border-radius:99px;background:#fff;color:#c92a2a;font-weight:700;text-decoration:none"';
const LENKE = 'style="color:#fff;font-weight:700;text-decoration:underline"';
// Tilpassede oppgaver for elever som trenger mer støtte ligger ved siden av leksjonen: leksjon-N-<navn>-steg-for-steg.html
const STEG = "-steg-for-steg.html";
function laererversjon(s, fil) {
  const steg = fil.endsWith(STEG), stegFil = fil.replace(/\.html$/, STEG);
  s = s.replace(/<head>/i, '<head>\n<meta name="robots" content="noindex, nofollow">');
  const felt = fil === "index.html"
    ? `<b>Lærerversjon med fasit.</b> Ikke del denne adressen med elever.<br>` +
      `<a href="/" ${LENKE}>Gå til elevsiden</a>: samme leksjoner uten fasit og lærernotater. ` +
      `Når du har gått gjennom en leksjon, åpner du den på elevsiden og deler lenken med klassen i Teams eller OneNote.`
    : `<a href="/${LAERER_STI}/" ${HJEM}>⌂ Hjem</a> <b>Lærerversjon med fasit.</b> ` +
      `<a href="/${fil.replace(/\\/g, "/").replace(/\.html$/, "")}" ${LENKE}>Elevversjon av denne ${steg ? "siden" : "leksjonen"}</a> (uten fasit, del denne med ${steg ? "eleven" : "klassen"}).` +
      (filer.includes(stegFil) ? ` · <a href="/${LAERER_STI}/${stegFil.replace(/\\/g, "/").replace(/\.html$/, "")}" ${LENKE}>Steg for steg</a> (tilpassede oppgaver)` : "");
  return s.replace(/<body([^>]*)>/i, `<body$1>\n<style>@media print{.laererfelt{display:none}}</style><div class="laererfelt" ${FELT}>${felt}</div>`);
}

// Bilder og vedlegg: <emne>/filer/leksjon-N-<del>-<tekst>.<type> vises nederst i delen
// <section id="<del>"> i leksjon N. Filer som starter med «laerer-» vises bare på lærersiden.
// Lærersiden viser en stiplet boks i hver del med navnet filene skal ha.
const BILDE = /\.(jpe?g|png|gif|webp|svg)$/i, VIDEO = /\.(mp4|webm)$/i;
const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const TEKST = "color:var(--muted,#56606c);font:500 14px/1.45 system-ui,sans-serif";
function vedlegg(s, fil, laerer) {
  const nr = path.basename(fil).match(/^(leksjon-\d+)-/);
  if (!nr || fil.endsWith(STEG)) return s;
  const mappe = path.join(__dirname, path.dirname(fil), FILER);
  const alle = fs.existsSync(mappe) ? fs.readdirSync(mappe).filter(f => !f.startsWith(".") && f !== "README.md")
    .sort((a, b) => a.replace(/^laerer-/, "").localeCompare(b.replace(/^laerer-/, ""))) : [];
  const innsett = [];
  for (const { 0: åpning, 1: id, index: pos } of s.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const prefiks = `${nr[1]}-${id}-`;
    const her = alle.filter(f => (f.startsWith(prefiks) || (laerer && f.startsWith("laerer-" + prefiks))));
    if (!her.length && !laerer) continue;
    const deler = her.map(f => {
      const url = `${FILER}/${encodeURIComponent(f)}`;
      const navn = esc(f.replace(/^laerer-/, "").slice(prefiks.length).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim());
      const merke = f.startsWith("laerer-") ? " <b>(bare lærer)</b>" : "";
      if (BILDE.test(f)) return `<figure style="margin:0;flex:1 1 260px;max-width:520px"><img src="${url}" alt="${navn}" loading="lazy" style="width:100%;height:auto;border-radius:10px;border:1px solid var(--line,#d9dfe6)">${navn || merke ? `<figcaption style="${TEKST};margin-top:4px">${navn}${merke}</figcaption>` : ""}</figure>`;
      if (VIDEO.test(f)) return `<figure style="margin:0;flex:1 1 260px;max-width:520px"><video src="${url}" controls preload="metadata" style="width:100%;border-radius:10px"></video>${navn || merke ? `<figcaption style="${TEKST};margin-top:4px">${navn}${merke}</figcaption>` : ""}</figure>`;
      return `<a href="${url}" download style="flex:0 0 auto;display:inline-flex;gap:8px;align-items:center;padding:10px 14px;border:1px solid var(--line,#d9dfe6);border-radius:10px;background:var(--panel,#fff);color:var(--ink,#14181d);font:600 15px/1.3 system-ui,sans-serif;text-decoration:none">📎 ${navn || esc(f)}${merke}</a>`;
    });
    if (laerer) deler.push(`<div class="no-print" style="flex:1 1 100%;${TEKST};border:2px dashed var(--line,#d9dfe6);border-radius:10px;padding:8px 12px">📎 Plass for bilder og filer. Last opp til mappen <b>${esc(path.dirname(fil).replace(/\\/g, "/"))}/${FILER}</b> med navn som starter med <b>${prefiks}</b>, for eksempel <b>${prefiks}bilde.jpg</b>. Start med <b>laerer-</b> for å vise filen bare her.</div>`);
    // Boksen legges nederst i delen, under figurene.
    const boks = `<div class="vedlegg" style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:12px;width:100%;max-width:1250px;margin:1.2rem auto 0;box-sizing:border-box">${deler.join("")}</div>`;
    innsett.push([s.indexOf("</section>", pos), boks]);
  }
  for (const [i, t] of innsett.reverse()) s = s.slice(0, i) + t + "\n" + s.slice(i);
  return s;
}

function kopierFiler(dir, laerer) {
  for (const e of fs.readdirSync(path.join(__dirname, dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (!e.isDirectory()) continue;
    if (e.name !== FILER) { kopierFiler(rel, laerer); continue; }
    for (const f of fs.readdirSync(path.join(__dirname, rel))) {
      if (f.startsWith(".") || f === "README.md" || (!laerer && f.startsWith("laerer-"))) continue;
      const mål = path.join(laerer ? path.join(UT, LAERER_STI) : UT, rel, f);
      fs.mkdirSync(path.dirname(mål), { recursive: true });
      fs.copyFileSync(path.join(__dirname, rel, f), mål);
    }
  }
}

fs.rmSync(UT, { recursive: true, force: true });
for (const trinn of ["vg1", "vg2"]) { kopierFiler(trinn, false); kopierFiler(trinn, true); }
for (const fil of filer) {
  const s = fs.readFileSync(path.join(__dirname, fil), "utf8");
  for (const [mappe, innhold] of [[UT, vedlegg(elevversjon(s), fil, false)], [path.join(UT, LAERER_STI), vedlegg(laererversjon(s, fil), fil, true)]]) {
    const mål = path.join(mappe, fil);
    fs.mkdirSync(path.dirname(mål), { recursive: true });
    fs.writeFileSync(mål, innhold);
  }
}
console.log(`Bygget ${filer.length} sider: elevversjon i public/, lærerversjon i public/${LAERER_STI}/`);
