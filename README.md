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
| Vg1 | Elektro | 1 Spenning, strøm og motstand · 2 Repetisjon og effekt · 3 Enkle styringer |
| Vg1 | YFF | 1 Hva er YFF? |
| Vg1 | Konstruksjon og styringsteknikk | 1 Tekniske tegninger · 2 Fra skisse til 3D-modell |
| Vg1 | DAP og CNC | 1 Koordinatsystemet · 2 CNC og G-kode · 3 Fusion: DAP for dreiing · 4 Fusion: DAP for fresing |
| Vg1 | Pneumatikk og hydraulikk | 1 Luft og olje gir kraft |
| Vg1 | Styring og automasjon | 1 Simuler før du bygger · 2 Robot og automasjon |
| Vg1 | HMS og kjemikalier | 1 Trygt på verkstedet · 2 Kjemikalier og sikkerhetsdatablad |
| Vg1 | Verktøy og måling | 1 Håndverktøy og maskiner · 2 Mål og les av tegningen |
| Vg1 | Sammenføying | 1 Skru, lim og sveis |
| Vg2 | Elektro | 1 Strøm, spenning og Ohms lov · 2 Effekt og energi · 3 Måling med multimeter · 4 Motorstyring |
| Vg2 | HMS | 1 Grunnleggende HMS · 2 Risikovurdering og SJA |
| Vg2 | Materiallære | 1 Grunnleggende · 2 Stål og jern · 3 Mekanisk prøving · 4 Varmebehandling |
| Vg2 | Overflatebehandling | 1 Rust og overflatebehandling |
| Vg2 | Maskinering | 1 Skjærehastighet, turtall og mating |
| Vg2 | Måleteknikk og kvalitet | 1 Måleverktøy |
| Vg2 | Tegning og DAK | 1 Arbeidstegninger · 2 Fra 3D-modell til arbeidstegning · 3 Sveisesymboler · 4 Geometriske toleranser |
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
- **Lærerversjon** med fasit under en skjult adresse: `https://leksjoner.vercel.app/laerer-k7q4mz/`. Ikke del den med elever. Lærersidene krever lærerpassordet (`LAERER_PASSORD` i Vercel, se `middleware.js`). Man logger inn på en egen side og forblir innlogget i 7 dager, eller til man trykker **Logg ut** i det røde feltet. Uten `LAERER_PASSORD` er lærersidene åpne. Et rødt felt øverst på hver lærerside lenker til elevversjonen av samme side.

Ny fasit må stå i `<span class="fasit" hidden>…</span>` (eller `class="fasit-svg"` i SVG-figurer), og lærernotater i `<details class="laerer">`, ellers kommer de med i elevversjonen. Bygget stopper med feil hvis noe fasit-merket blir igjen.

## Steg for steg (tilpassede oppgaver)

Enklere oppgaver for elever som trenger mer støtte legges ved siden av leksjonen, med samme navn og `-steg-for-steg` til slutt, for eksempel `vg1/elektro/leksjon-1-spenning-strom-og-motstand-steg-for-steg.html`. Siden står ikke på forsiden. Læreren finner den via lenken «Steg for steg» i det røde feltet på lærerversjonen av leksjonen, og deler elevversjonen av siden direkte med eleven. Fasit merkes som i leksjonene.

## Bilder og filer under figurene

Hvert emne har en mappe `filer/` (for eksempel `vg2/materiallaere/filer/`). Last opp med **Add file → Upload files** på GitHub. Filnavnet bestemmer hvor filen vises: `leksjon-4-herding-herdekar.jpg` havner nederst i delen `<section id="herding">` i leksjon 4, med teksten «herdekar». Knappen «Vis/skjul plass for filer» i det røde feltet på lærersiden viser en stiplet boks i hver del med navnet filene skal starte med. Boksene er skjult ellers, så de ikke vises på fremviseren.

- Bilder og video vises på siden. Andre filer (PDF, Word …) blir en nedlastingslenke.
- Filer som starter med `laerer-` vises og publiseres bare på lærersiden.
- Steg for steg-sidene får ikke vedlegg.

### Last opp fra lærersiden

Knappen **⬆ Last opp** i hver stiplet boks åpner et vindu der læreren velger en fil fra PC-en eller limer inn en nettadresse. Bare den som er logget inn med lærerpassordet kan laste opp. Når plassboksene vises, har hver fil også en knapp **🗑 Slett**. Filen lagres i riktig `filer/`-mappe med riktig navn (`api/last-opp.js`), og siden publiseres på nytt av seg selv. Store bilder gjøres mindre i nettleseren; andre filer kan være opptil 3 MB (større filer lastes opp på GitHub som før).

Dette krever to hemmeligheter i Vercel (for Production) (**Settings → Environment Variables**), som aldri skal stå i repoet:

- `LAERER_PASSORD`: lærerpassordet (se under Elevversjon og lærerversjon).
- `GITHUB_TOKEN`: en GitHub-nøkkel (fine-grained token) med tilgang til bare `haslaksen/leksjoner` og **Contents: Read and write**.

## Deploy

Vercel publiserer fra grenen `main`. Byggkommando og mappe står i `vercel.json`, så ingenting må stilles inn i Vercel. Prøv bygget lokalt med `node bygg.js`.
