// Opplasting fra lærersiden (bygg.js legger dette inn på lærerversjonen av leksjonene).
// Knappen «Last opp» i de stiplede boksene åpner et vindu der admin velger en fil fra PC-en
// eller limer inn en nettadresse. Filen sendes til api/last-opp.js, som bare godtar innloggede lærere (lærerpassordet).
(function () {
  const d = document.createElement("dialog");
  d.style.cssText = "max-width:440px;width:92vw;border:0;border-radius:14px;padding:18px 20px;font:500 15px/1.45 system-ui,sans-serif;color:#14181d";
  d.innerHTML = `<form method="dialog" style="display:grid;gap:10px">
    <b style="font-size:17px">📎 Last opp bilde eller fil</b>
    <label>Fra PC-en<br><input name="fil" type="file"></label>
    <label>…eller nettadresse<br><input name="adresse" type="url" placeholder="https://…" style="width:100%"></label>
    <label>Tekst under (valgfritt)<br><input name="tekst" placeholder="for eksempel herdekar" style="width:100%"></label>
    <label><input name="bareLaerer" type="checkbox"> Bare på lærersiden</label>
    <div class="melding" style="min-height:1.4em;color:#56606c"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button value="avbryt" formnovalidate>Lukk</button>
      <button value="ok" class="send" style="font-weight:700">Last opp</button>
    </div></form>`;
  document.body.appendChild(d);
  const f = d.querySelector("form"), melding = d.querySelector(".melding");
  let boks;

  // Store bilder gjøres mindre i nettleseren, så de kommer under grensen på 3 MB.
  const lesFil = fil => new Promise((ok, feil) => {
    const r = new FileReader();
    r.onerror = feil;
    r.onload = () => {
      if (!/^image\/(jpeg|png|webp)$/.test(fil.type) || fil.size < 2.5e6) return ok({ innhold: r.result.split(",")[1], filnavn: fil.name });
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 2000 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = img.width * s; c.height = img.height * s;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        ok({ innhold: c.toDataURL("image/jpeg", 0.85).split(",")[1], filnavn: fil.name.replace(/\.[^.]+$/, "") + ".jpg" });
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
        body: JSON.stringify(Object.assign({
          mappe: boks.dataset.mappe, prefiks: boks.dataset.prefiks,
          tekst: f.tekst.value, bareLaerer: f.bareLaerer.checked,
        }, fil ? await lesFil(fil) : { adresse })),
      });
      const data = await svar.json().catch(() => ({ feil: `Noe gikk galt (${svar.status})` }));
      if (!svar.ok) throw new Error(data.feil);
      melding.innerHTML = `✅ Lastet opp som <b>${data.navn}</b>. Siden publiseres på nytt nå. Last inn siden på nytt om et par minutter for å se den.`;
      f.fil.value = f.adresse.value = f.tekst.value = "";
    } catch (err) {
      melding.textContent = "❌ " + err.message;
    }
    f.querySelector(".send").disabled = false;
  });

  document.querySelectorAll(".filplass[data-prefiks]").forEach(b => {
    const knapp = document.createElement("button");
    knapp.textContent = "⬆ Last opp";
    knapp.style.cssText = "margin-left:8px;font:700 14px system-ui,sans-serif;padding:3px 12px;border-radius:99px;border:1px solid #c92a2a;background:#fff;color:#c92a2a;cursor:pointer";
    knapp.onclick = () => { boks = b; melding.textContent = ""; d.showModal(); };
    b.appendChild(knapp);
  });
})();
