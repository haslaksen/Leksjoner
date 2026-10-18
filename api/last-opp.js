// Laster opp et bilde eller en fil fra lærersiden til mappen <trinn>/<emne>/filer/ i GitHub-repoet.
// Vercel publiserer siden på nytt når filen er lagt inn, og bygg.js viser den i riktig del.
// Hemmeligheter som legges inn i Vercel (Settings → Environment Variables):
//   LAERER_PASSORD Lærerpassordet (samme som i middleware.js). Nettleseren sender det med når læreren er logget inn.
//   GITHUB_TOKEN   GitHub-nøkkel med skrivetilgang (Contents) til bare dette repoet.
const crypto = require("crypto");

const REPO = "haslaksen/leksjoner", GREN = "main";
const MAKS = 3 * 1024 * 1024; // Vercel tar imot opptil 4,5 MB per forespørsel (base64 gjør filen 1/3 større).
const TYPER = /\.(jpe?g|png|gif|webp|svg|mp4|webm|pdf|docx?|xlsx?|pptx?|txt|zip|stl|step|stp|dxf|dwg)$/i;
const MIME = { "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp", "image/svg+xml": ".svg", "application/pdf": ".pdf", "video/mp4": ".mp4" };

// Nettleseren sender lærerinnloggingen med, fordi adressen ligger under /laerer-k7q4mz/ (se vercel.json).
function innlogget(req) {
  const passord = (process.env.LAERER_PASSORD || "").trim();
  const [type, verdi] = String(req.headers.authorization || "").split(" ");
  if (!passord || type !== "Basic" || !verdi) return false;
  const tekst = Buffer.from(verdi, "base64").toString("utf8");
  const a = Buffer.from(tekst.slice(tekst.indexOf(":") + 1).trim()), b = Buffer.from(passord);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function hentFraNett(adresse) {
  const u = new URL(adresse);
  if (!/^https?:$/.test(u.protocol)) throw new Error("Adressen må starte med https://");
  const svar = await fetch(u, { redirect: "follow" });
  if (!svar.ok) throw new Error(`Fikk ikke hentet filen (${svar.status})`);
  const data = Buffer.from(await svar.arrayBuffer());
  const type = (svar.headers.get("content-type") || "").split(";")[0].trim();
  let navn = decodeURIComponent(u.pathname.split("/").pop() || "fil");
  if (!TYPER.test(navn)) navn = navn.replace(/\.[^.]*$/, "") + (MIME[type] || "");
  return { data, navn };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ feil: "Bruk POST" });
  const { mappe, prefiks, tekst, bareLaerer, filnavn, innhold, adresse } = req.body || {};
  if (!innlogget(req)) return res.status(401).json({ feil: "Du må være logget inn på lærersiden. Last inn siden på nytt og logg inn." });
  if (!(process.env.GITHUB_TOKEN || "").trim()) return res.status(500).json({ feil: "GITHUB_TOKEN mangler i Vercel" });
  if (!/^vg[12]\/[a-z0-9-]+$/.test(mappe || "") || !/^leksjon-\d+-[A-Za-z0-9_-]+-$/.test(prefiks || ""))
    return res.status(400).json({ feil: "Ugyldig mappe eller del" });

  try {
    const fil = adresse ? await hentFraNett(adresse) : { data: Buffer.from(innhold || "", "base64"), navn: filnavn || "" };
    if (!fil.data.length) throw new Error("Filen er tom");
    if (fil.data.length > MAKS) throw new Error("Filen er for stor (over 3 MB). Last den opp på GitHub i stedet.");
    const type = (fil.navn.match(TYPER) || [""])[0].toLowerCase();
    if (!type) throw new Error("Denne filtypen er ikke tillatt");
    // Navnet blir leksjon-N-<del>-<tekst>.<type>, med bare små bokstaver, tall og bindestrek.
    const rent = String(tekst || fil.navn.replace(TYPER, "")).toLowerCase()
      .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "fil";
    const navn = (bareLaerer ? "laerer-" : "") + prefiks + rent + type;
    const sti = `${mappe}/filer/${navn}`;

    const gh = (metode, body) => fetch(`https://api.github.com/repos/${REPO}/contents/${sti}`, {
      method: metode,
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN.trim()}`, Accept: "application/vnd.github+json", "User-Agent": "leksjoner-admin" },
      body: body && JSON.stringify(body),
    });
    if ((await gh("GET")).ok) throw new Error(`Det finnes allerede en fil med navnet ${navn}. Velg en annen tekst.`);
    const svar = await gh("PUT", { message: `Last opp ${sti} fra lærersiden`, content: fil.data.toString("base64"), branch: GREN });
    if (!svar.ok) throw new Error(`GitHub sa nei (${svar.status}). ${svar.status === 401 ? "GITHUB_TOKEN er feil eller utløpt. Lag en ny nøkkel og lim den inn i Vercel." : "Sjekk at GITHUB_TOKEN har Contents: Read and write for Leksjoner."}`);
    res.json({ ok: true, navn });
  } catch (e) {
    res.status(400).json({ feil: e.message });
  }
};
