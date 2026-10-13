# Leksjoner

Interaktive HTML-leksjoner for Industriteknologi (Vg1 og Vg2). Hver leksjon er én frittstående HTML-fil for to skoletimer.

## Struktur

```
index.html                     Oversiktsside med alle leksjonene
vg1/<emne>/leksjon-N-<navn>.html
vg2/<emne>/leksjon-N-<navn>.html
```

| Trinn | Emne | Leksjoner |
|---|---|---|
| Vg1 | Elektro | 1 Spenning, strøm og motstand · 2 Repetisjon og effekt |
| Vg2 | Elektro | 1 Strøm, spenning og resistans · 2 Måling med multimeter · 3 Motorstyring |
| Vg2 | HMS | 1 Grunnleggende HMS · 2 Risikovurdering og SJA |
| Vg2 | Materiallære | 1 Grunnleggende · 2 Stål og jern · 3 Mekanisk prøving · 4 Varmebehandling |
| Vg2 | Pneumatikk | 1 Grunnleggende pneumatikk · 2 Styring og fart |
| Vg2 | Vedlikehold | 1 Vedlikeholdssystemer · 2 Sikker jobb – lås og merk · 3 Smøring |

## Ny leksjon

1. Legg filen i riktig mappe, med navnet `leksjon-N-<kort-navn>.html` (små bokstaver, æ/ø/å skrives ae/o/a).
2. Legg til en linje for leksjonen i `index.html`.

## Lenker

- Leksjonene lenker til Verkstedhåndboka (`https://verkstedhandboka.vercel.app/#<emne>`). Håndboka lenker **ikke** tilbake til leksjonene.
- Oversiktssiden lenker til simulatorene. Adressen står i konstanten `SIMULATORER` nederst i `index.html`.

## Deploy

Vercel publiserer fra grenen `main`. Oppsett: importer repoet, velg Framework Preset **Other**, la Build Command og Output Directory stå tomme.
