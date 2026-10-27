// Opplasting fra lærersiden (bygg.js legger dette inn på lærerversjonen av leksjonene).
// Knappen «Last opp» i de stiplede boksene åpner et vindu der admin velger en fil fra PC-en
// eller limer inn en nettadresse. Man kan også dra en fil rett inn i boksen eller på tegningen. Filen sendes til api/last-opp.js, som bare godtar innloggede lærere (lærerpassordet).
(function () {
  const d = document.createElement("dialog");
  d.style.cssText = "max-width:440px;width:92vw;border:0;border-radius:14px;padding:18px 20px;font:500 15px/1.45 system-ui,sans-serif;color:#14181d";
  d.innerHTML = `<form method="dialog" style="display:grid;gap:10px">
    <b class="tittel" style="font-size:17px">📎 Last opp bilde eller fil</b>
    <label>Fra PC-en<br><input name="fil" type="file"></label>
    <label>…eller nettadresse<br><input name="adresse" type="url" placeholder="https://…" style="width:100%"></label>
    <label class="vedleggfelt">Tekst under (valgfritt)<br><input name="tekst" placeholder="for eksempel herdekar" style="width:100%"></label>
    <label class="vedleggfelt"><input name="bareLaerer" type="checkbox"> Bare på lærersiden</label>
    <div class="melding" style="min-height:1.4em;color:#56606c"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button value="avbryt" formnovalidate>Lukk</button>
      <button value="ok" class="send" style="font-weight:700">Last opp</button>
    </div></form>`;
  document.body.appendChild(d);
  const f = d.querySelector("form"), melding = d.querySelector(".melding");
  let boks, bytt; // bytt = navnet på tegningen som skal byttes med bilde, ellers null.
  const åpne = (b, navn) => {
    boks = b; bytt = navn; melding.textContent = "";
    d.querySelector(".tittel").textContent = navn ? "📷 Bytt tegningen med et bilde" : "📎 Last opp bilde eller fil";
    d.querySelectorAll(".vedleggfelt").forEach(l => { l.style.display = navn ? "none" : ""; });
    d.showModal();
  };

  // Bilder over 400 kB gjøres om til JPEG på høyst 1600 px, så sidene lastes raskt (mobilbilder er ofte 3–5 MB).
  const lesFil = fil => new Promise((ok, feil) => {
    const r = new FileReader();
    r.onerror = feil;
    r.onload = () => {
      if (!/^image\/(jpeg|png|webp|heic)$/.test(fil.type) || (fil.size < 4e5 && !bytt)) return ok({ innhold: r.result.split(",")[1], filnavn: fil.name });
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = img.width * s; c.height = img.height * s;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        ok({ innhold: c.toDataURL("image/jpeg", 0.82).split(",")[1], filnavn: fil.name.replace(/\.[^.]+$/, "") + ".jpg" });
      };
      img.onerror = feil;
      img.src = r.result;
    };
    r.readAsDataURL(fil);
  });

  f.addEventListener("submit", async e => {
    if (e.submitter && e.submitter.value !== "ok") return;
    e.preventDefault();
    const fil = f.fil.files[0], adresse = f.adresse.value.trim();
    if (!fil && !adresse) { melding.textContent = "Velg en fil eller lim inn en nettadresse."; return; }
    melding.textContent = "Laster opp …";
    f.querySelector(".send").disabled = true;
    try {
      const svar = await fetch("/laerer-k7q4mz/api/last-opp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign(bytt ? { mappe: boks.dataset.mappe, bilde: bytt } : {
          mappe: boks.dataset.mappe, prefiks: boks.dataset.prefiks,
          tekst: f.tekst.value, bareLaerer: f.bareLaerer.checked,
        }, fil ? await lesFil(fil) : { adresse })),
      });
      const data = await svar.json().catch(() => ({ feil: `Noe gikk galt (${svar.status})` }));
      if (!svar.ok) throw new Error(data.feil);
      melding.innerHTML = bytt ? "✅ Bildet er lagt inn. Siden publiseres på nytt nå. Last inn siden på nytt om et par minutter for å se det." : `✅ Lastet opp som <b>${data.navn}</b>. Siden publiseres på nytt nå. Last inn siden på nytt om et par minutter for å se den.`;
      f.fil.value = f.adresse.value = f.tekst.value = "";
    } catch (err) {
      melding.textContent = "❌ " + err.message;
    }
    f.querySelector(".send").disabled = false;
  });

  // Slett-knapp ved hver fil. Vises bare når «Vis/skjul plass for filer» er slått på.
  document.querySelectorAll("[data-sti]").forEach(el => {
    const knapp = document.createElement("button");
    knapp.className = "filplass no-print";
    knapp.textContent = "🗑 Slett";
    knapp.style.cssText = "display:block;margin-top:4px;font:700 13px system-ui,sans-serif;padding:2px 10px;border-radius:99px;border:1px solid #c92a2a;background:#fff;color:#c92a2a;cursor:pointer";
    knapp.onclick = async () => {
      if (!confirm("Slette denne filen fra leksjonen?")) return;
      knapp.disabled = true;
      try {
        const svar = await fetch("/laerer-k7q4mz/api/last-opp", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slett: el.dataset.sti }),
        });
        const data = await svar.json().catch(() => ({ feil: `Noe gikk galt (${svar.status})` }));
        if (!svar.ok) throw new Error(data.feil);
        el.style.opacity = ".3";
        knapp.textContent = "Slettet. Forsvinner om et par minutter.";
      } catch (err) {
        alert("❌ " + err.message);
        knapp.disabled = false;
      }
    };
    if (el.tagName === "A") el.after(knapp); else el.appendChild(knapp);
  });

  // Dra og slipp: en fil som slippes på boksen eller tegningen, velges i vinduet. Så trykker man «Last opp».
  const påSlipp = (mål, åpneHer) => {
    const av = () => { mål.style.outline = ""; };
    mål.addEventListener("dragover", e => {
      if (!document.body.classList.contains("vis-filplass") || ![...e.dataTransfer.types].includes("Files")) return;
      e.preventDefault(); e.stopPropagation();
      mål.style.outline = "3px solid #c92a2a"; mål.style.outlineOffset = "2px";
    });
    mål.addEventListener("dragleave", av);
    mål.addEventListener("drop", e => {
      av();
      if (!document.body.classList.contains("vis-filplass") || !e.dataTransfer.files.length) return;
      e.preventDefault(); e.stopPropagation();
      åpneHer();
      f.fil.files = e.dataTransfer.files;
      melding.textContent = `Valgt: ${e.dataTransfer.files[0].name}. Trykk «Last opp».`;
    });
  };
  // En fil som slippes utenfor boksene, skal ikke åpnes i nettleseren (da forsvinner lærersiden).
  ["dragover", "drop"].forEach(t => document.addEventListener(t, e => {
    if (document.body.classList.contains("vis-filplass") && [...e.dataTransfer.types].includes("Files")) e.preventDefault();
  }));

  document.querySelectorAll(".filplass[data-prefiks]").forEach(b => {
    påSlipp(b, () => åpne(b));
    const knapp = document.createElement("button");
    knapp.textContent = "⬆ Last opp";
    knapp.style.cssText = "margin-left:8px;font:700 14px system-ui,sans-serif;padding:3px 12px;border-radius:99px;border:1px solid #c92a2a;background:#fff;color:#c92a2a;cursor:pointer";
    knapp.onclick = () => åpne(b);
    b.appendChild(knapp);
  });

  // Tegninger som kan byttes med bilde (bygg.js lager knappene).
  document.querySelectorAll("button[data-bytt]").forEach(k => {
    k.onclick = () => åpne(k, k.dataset.bytt);
    påSlipp(k, () => åpne(k, k.dataset.bytt));
    if (k.previousElementSibling) påSlipp(k.previousElementSibling, () => åpne(k, k.dataset.bytt));
  });
  document.querySelectorAll("button[data-tegning]").forEach(k => {
    k.onclick = async () => {
      if (!confirm("Fjerne bildet og vise tegningen igjen?")) return;
      k.disabled = true;
      try {
        const svar = await fetch("/laerer-k7q4mz/api/last-opp", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slett: k.dataset.tegning }),
        });
        const data = await svar.json().catch(() => ({ feil: `Noe gikk galt (${svar.status})` }));
        if (!svar.ok) throw new Error(data.feil);
        k.textContent = "Tegningen kommer tilbake om et par minutter.";
      } catch (err) {
        alert("❌ " + err.message);
        k.disabled = false;
      }
    };
  });
})();
