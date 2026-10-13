// Bygger nettstedet til mappen public/ (kjøres av Vercel, se vercel.json).
//   public/                 Elevversjon: fasit og lærernotater er fjernet fra filene.
//   public/<LAERER_STI>/    Lærerversjon: leksjonene slik de er, med fasit.
// Kjør lokalt med: node bygg.js
const fs = require("fs");
const path = require("path");

const LAERER_STI = "laerer-k7q4mz";
const UT = path.join(__dirname, "public");

const leksjoner = [];
function finn(dir) {
  for (const e of fs.readdirSync(path.join(__dirname, dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) finn(rel);
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
const LENKE = 'style="color:#fff;font-weight:700;text-decoration:underline"';
function laererversjon(s, fil) {
  s = s.replace(/<head>/i, '<head>\n<meta name="robots" content="noindex, nofollow">');
  const felt = fil === "index.html"
    ? `<b>Lærerversjon med fasit.</b> Ikke del denne adressen med elever.<br>` +
      `<a href="/" ${LENKE}>Gå til elevsiden</a>: samme leksjoner uten fasit og lærernotater. ` +
      `Når du har gått gjennom en leksjon, åpner du den på elevsiden og deler lenken med klassen i Teams eller OneNote.`
    : `<b>Lærerversjon med fasit.</b> ` +
      `<a href="/${fil.replace(/\\/g, "/").replace(/\.html$/, "")}" ${LENKE}>Elevversjon av denne leksjonen</a> (uten fasit, del denne med klassen).`;
  return s.replace(/<body([^>]*)>/i, `<body$1>\n<style>@media print{.laererfelt{display:none}}</style><div class="laererfelt" ${FELT}>${felt}</div>`);
}

fs.rmSync(UT, { recursive: true, force: true });
for (const fil of filer) {
  const s = fs.readFileSync(path.join(__dirname, fil), "utf8");
  for (const [mappe, innhold] of [[UT, elevversjon(s)], [path.join(UT, LAERER_STI), laererversjon(s, fil)]]) {
    const mål = path.join(mappe, fil);
    fs.mkdirSync(path.dirname(mål), { recursive: true });
    fs.writeFileSync(mål, innhold);
  }
}
console.log(`Bygget ${filer.length} sider: elevversjon i public/, lærerversjon i public/${LAERER_STI}/`);
