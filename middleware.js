// Lærersidene (/laerer-k7q4mz/) krever lærerpassordet. Nettleseren spør etter brukernavn og passord;
// brukernavnet kan være hva som helst. Elevsidene påvirkes ikke.
// Passordet legges inn i Vercel (Settings → Environment Variables) som LAERER_PASSORD.
// Uten LAERER_PASSORD er lærersidene åpne som før, så ingen blir låst ute før det er lagt inn.
export const config = { matcher: ["/laerer-k7q4mz", "/laerer-k7q4mz/:path*"] };

function likt(a, b) {
  if (a.length !== b.length) return false;
  let ulikt = 0;
  for (let i = 0; i < a.length; i++) ulikt |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return !ulikt;
}

export default function middleware(request) {
  const passord = process.env.LAERER_PASSORD;
  if (!passord) return;
  const [type, verdi] = (request.headers.get("authorization") || "").split(" ");
  if (type === "Basic" && verdi) {
    try {
      const tekst = new TextDecoder().decode(Uint8Array.from(atob(verdi), c => c.charCodeAt(0)));
      if (likt(tekst.slice(tekst.indexOf(":") + 1), passord)) return;
    } catch (e) {}
  }
  return new Response("Lærersiden krever passord.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Laerersiden", charset="UTF-8"', "Content-Type": "text/plain; charset=utf-8" },
  });
}
