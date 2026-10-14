# Leksjoner

Interaktive HTML-leksjoner for Teknologi- og industrifag: Vg1 TIF og Vg2 Industriteknologi. Hver leksjon er én frittstående HTML-fil for to skoletimer.

## Struktur

```
index.html                     Oversiktsside med alle leksjonene
vg1/<emne>/leksjon-N-<navn>.html
vg2/<emne>/leksjon-N-<navn>.html
```

| Trinn | Emne | Leksjoner |
|---|---|---|
| Vg1 | Elektro | 1 Spenning, strøm og motstand · 2 Repetisjon og effekt |
| Vg1 | YFF | 1 Hva er YFF? |
| Vg1 | Konstruksjon og styringsteknikk | 1 Tekniske tegninger · 2 Fra skisse til 3D-modell |
| Vg2 | Elektro | 1 Strøm, spenning og Ohms lov · 2 Effekt og energi · 3 Måling med multimeter · 4 Motorstyring |
| Vg2 | HMS | 1 Grunnleggende HMS · 2 Risikovurdering og SJA |
| Vg2 | Materiallære | 1 Grunnleggende · 2 Stål og jern · 3 Mekanisk prøving · 4 Varmebehandling |
| Vg2 | Maskinering | 1 Skjærehastighet, turtall og mating |
| Vg2 | Måleteknikk og kvalitet | 1 Måleverktøy |
| Vg2 | Pneumatikk | 1 Grunnleggende pneumatikk · 2 Styring og fart |
| Vg2 | Vedlikehold | 1 Vedlikeholdssystemer · 2 Sikker jobb – lås og merk · 3 Smøring |
| Vg2 | YFF | 1 Veien til læreplass |

## Ny leksjon

1. Legg filen i riktig mappe, med navnet `leksjon-N-<kort-navn>.html` (små bokstaver, æ/ø/å skrives ae/o/a).
2. Legg til en linje for leksjonen i `index.html`.

## Lenker

- Leksjonene lenker til Verkstedhåndboka (`https://verkstedhandboka.vercel.app/#<emne>`). Håndboka lenker **ikke** tilbake til leksjonene.
- Oversiktssiden lenker til simulatorene. Adressen står i konstanten `SIMULATORER` nederst i `index.html`.

## Elevversjon og lærerversjon

Lærerne vedlikeholder bare filene i `vg1/` og `vg2/`. Ved hver publisering lager `bygg.js` to versjoner i mappen `public/`:

- **Elevversjon** på hovedadressen (`https://leksjoner.vercel.app/`). Fasit, «Vis fasit»-knappen og lærernotater (`<details class="laerer">`) er fjernet fra filene, ikke bare skjult. Lenker til enkeltleksjoner herfra kan deles med elevene.
- **Lærerversjon** med fasit under en skjult adresse: `https://leksjoner.vercel.app/laerer-k7q4mz/`. Ikke del den med elever. Et rødt felt øverst på hver lærerside lenker til elevversjonen av samme side.

Ny fasit må stå i `<span class="fasit" hidden>…</span>` (eller `class="fasit-svg"` i SVG-figurer), og lærernotater i `<details class="laerer">`, ellers kommer de med i elevversjonen. Bygget stopper med feil hvis noe fasit-merket blir igjen.

## Deploy

Vercel publiserer fra grenen `main`. Byggkommando og mappe står i `vercel.json`, så ingenting må stilles inn i Vercel. Prøv bygget lokalt med `node bygg.js`.
