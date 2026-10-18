// Lærersidene (/laerer-k7q4mz/) krever lærerpassordet. Elevsidene påvirkes ikke.
// Passordet legges inn i Vercel (Settings → Environment Variables) som LAERER_PASSORD.
// Uten LAERER_PASSORD er lærersidene åpne, så ingen blir låst ute før det er lagt inn.
//   /laerer-k7q4mz/logg-inn   Innloggingsside. Riktig passord gir en informasjonskapsel i 7 dager.
//   /laerer-k7q4mz/logg-ut    Sletter informasjonskapselen og går til elevsiden.
// api/last-opp.js sjekker den samme informasjonskapselen (se nokkel der).
export const config = { matcher: ["/laerer-k7q4mz", "/laerer-k7q4mz/:path*"] };

const STI = "/laerer-k7q4mz", KAKE = "laerer";

async function nokkel(passord) {
  const data = new TextEncoder().encode("leksjoner:" + passord.trim());
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))].map(b => b.toString(16).padStart(2, "0")).join("");
}

const kake = (request) => (request.headers.get("cookie") || "").split(/;\s*/).find(c => c.startsWith(KAKE + "="))?.slice(KAKE.length + 1) || "";

const side = (feil, neste) => new Response(`<!doctype html><html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Logg inn · Lærersiden</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f7fa;font:500 16px/1.45 system-ui,sans-serif;color:#14181d">
<form method="post" action="${STI}/logg-inn" style="background:#fff;border:1px solid #d9dfe6;border-radius:14px;padding:22px 24px;width:min(340px,90vw);display:grid;gap:12px">
<b style="font-size:19px">🔒 Lærersiden</b>
<label>Lærerpassord<br><input name="passord" type="password" required autofocus style="width:100%;box-sizing:border-box;font:inherit;padding:8px 10px;border:1px solid #d9dfe6;border-radius:8px"></label>
<input type="hidden" name="neste" value="${neste.replace(/[^A-Za-z0-9/_.-]/g, "")}">
${feil ? '<div style="color:#c92a2a">Feil passord. Prøv igjen.</div>' : ""}
<button style="font:700 16px system-ui,sans-serif;padding:9px;border:0;border-radius:99px;background:#c92a2a;color:#fff;cursor:pointer">Logg inn</button>
<a href="/" style="color:#56606c;font-size:14px">Til elevsiden</a>
</form></body></html>`, { status: feil ? 401 : 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });

const videre = (til, cookie) => new Response(null, { status: 303, headers: { Location: til, "Cache-Control": "no-store", ...(cookie && { "Set-Cookie": cookie }) } });

export default async function middleware(request) {
  const passord = (process.env.LAERER_PASSORD || "").trim();
  if (!passord) return;
  const url = new URL(request.url), riktig = await nokkel(passord);
  const neste = url.searchParams.get("neste") || STI + "/";

  if (url.pathname === STI + "/logg-ut")
    return videre("/", `${KAKE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  if (url.pathname === STI + "/logg-inn") {
    if (request.method !== "POST") return side(false, neste);
    const skjema = await request.formData();
    const til = String(skjema.get("neste") || "");
    if (await nokkel(String(skjema.get("passord") || "")) !== riktig) return side(true, til);
    return videre(til.startsWith(STI) ? til : STI + "/", `${KAKE}=${riktig}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`);
  }
  if (kake(request) === riktig) return;
  if (url.pathname.startsWith(STI + "/api/"))
    return new Response(JSON.stringify({ feil: "Du er logget ut. Last inn siden på nytt og logg inn." }), { status: 401, headers: { "Content-Type": "application/json" } });
  return videre(`${STI}/logg-inn?neste=${encodeURIComponent(url.pathname)}`);
}
