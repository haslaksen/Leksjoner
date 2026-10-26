// Utfylling: eleven skriver svarene rett i oppgavene, og kan skrive ut eller lagre som PDF.
// bygg.js legger skriptet nederst på alle leksjoner og Steg for steg-sider (ikke prøver).
// Svarplassene finnes av seg selv, så leksjonene trenger ingen endring:
//   .svar, .luke og tomme tabellceller blir skrivefelt, ______ i teksten blir en skrivelinje,
//   trykk på et alternativ i .valg setter ring rundt, trykk i en kryssrute (td[data-kryss]) setter kryss,
//   trykk på et ord i .ordbank skriver det i luka, og en oppgave (li) uten svarplass får en svarlinje.
// Svarene lagres i nettleseren (localStorage), så de er der når eleven åpner siden igjen.
(function () {
  var OPPG = "#oppgaver, #oppgavetekst, .sheet, .oppg, .oppgave";
  var NOKKEL = "utfylling2:" + location.pathname;

  function start() {
    var omr = [].filter.call(document.querySelectorAll(OPPG), function (e) {
      return !(e.parentElement && e.parentElement.closest(OPPG));
    });
    if (!omr.length) return;

    var st = document.createElement("style");
    st.textContent =
      ".skriv{outline:none;border-radius:4px;background:rgba(255,212,59,.18);min-width:4em;white-space:pre-wrap;overflow-wrap:anywhere;cursor:text}" +
      ".skriv:focus{background:rgba(255,212,59,.35);box-shadow:0 0 0 2px #1c7ed6}" +
      ".skriv.inne{display:inline-block;min-height:1.3em;vertical-align:bottom}" +
      ".skriv.blokk{display:block;min-height:1.6em}" +
      ".luke>.skriv{min-width:100%;text-align:center}" +
      ".valg>span{cursor:pointer;user-select:none}" +
      ".valg>span[data-ring]{outline:3px solid #1c7ed6;outline-offset:3px}" +
      "td[data-kryss]{cursor:pointer;user-select:none;text-align:center;vertical-align:middle}" +
      "td[data-kryss]:hover{background:rgba(28,126,214,.08)}" +
      ".kryssmerke{font-weight:800;font-size:1.3em}" +
      "@media print{.skriv,.skriv:focus{background:none!important;box-shadow:none!important}.utfylling-knapp{display:none!important}}";
    document.head.appendChild(st);

    var felt = [], valg = [], sist = null;
    var lagret = {};
    try { lagret = JSON.parse(localStorage.getItem(NOKKEL)) || {}; } catch (e) {}
    function lagre() {
      try {
        localStorage.setItem(NOKKEL, JSON.stringify({
          t: felt.map(function (f) { return f.textContent; }),
          v: valg.map(function (v) { return v.hasAttribute("data-ring") ? 1 : 0; })
        }));
      } catch (e) {}
    }

    function nyttFelt(blokk, bredde, flere) {
      var s = document.createElement("span");
      s.className = "skriv " + (blokk ? "blokk" : "inne");
      s.setAttribute("contenteditable", "plaintext-only");
      if (s.contentEditable !== "plaintext-only") s.setAttribute("contenteditable", "true");
      s.setAttribute("role", "textbox");
      s.setAttribute("aria-label", "Svar");
      s.spellcheck = false;
      if (bredde) s.style.minWidth = bredde;
      // Enter lager ny linje bare i svarlinjer, ellers går den til neste felt.
      s.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !flere) {
          e.preventDefault();
          var neste = felt[felt.indexOf(s) + 1];
          if (neste) neste.focus();
        }
      });
      s.addEventListener("input", lagre);
      s.addEventListener("focus", function () { sist = s; });
      felt.push(s);
      return s;
    }

    // Legger feltet foran fasiten, så fasiten (på lærersiden) vises etter elevens svar.
    function settInn(boks, blokk) {
      if (boks.querySelector(".skriv")) return;
      var f = nyttFelt(blokk, null, boks.classList.contains("svar"));
      var fasit = [].filter.call(boks.children, function (c) { return c.classList.contains("fasit"); })[0];
      boks.insertBefore(f, fasit || null);
    }

    // Krysset er ekte tekst (ikke bare utseende), så det blir med når oppgavene kopieres til OneNote.
    function farge(e) {
      var på = e.hasAttribute("data-ring");
      e.setAttribute("aria-pressed", på);
      if (e.tagName !== "TD") return;
      var m = e.querySelector(".kryssmerke");
      if (på && !m) {
        m = document.createElement("span");
        m.className = "kryssmerke";
        m.textContent = "✗";
        e.insertBefore(m, e.firstChild);
      } else if (!på && m) m.remove();
    }

    // Tom celle: ingen tekst, og ingen andre element enn fasit og linjeskift.
    function tom(td) {
      return [].every.call(td.childNodes, function (n) {
        if (n.nodeType === 3) return !n.textContent.trim();
        return n.nodeType === 8 || n.tagName === "BR" || (n.classList && n.classList.contains("fasit"));
      });
    }

    omr.forEach(function (o) {
      // ______ i teksten (Navn, Dato, regnestykker) blir skrivelinjer.
      var gå = document.createTreeWalker(o, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          return /_{3,}/.test(n.textContent) && !n.parentElement.closest("script,style,svg,button,.fasit,.skriv,textarea")
            ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      var tekster = [];
      while (gå.nextNode()) tekster.push(gå.currentNode);
      tekster.forEach(function (n) {
        var deler = n.textContent.split(/(_{3,})/), frag = document.createDocumentFragment();
        deler.forEach(function (d) {
          if (!d) return;
          if (/^_{3,}$/.test(d)) {
            var f = nyttFelt(false, Math.min(d.length * 0.55, 20) + "em");
            f.style.borderBottom = "1px solid currentColor";
            frag.appendChild(f);
          } else frag.appendChild(document.createTextNode(d));
        });
        n.parentNode.replaceChild(frag, n);
      });

      o.querySelectorAll(".svar, .luke, td").forEach(function (e) {
        if (e.tagName === "TD" && (e.hasAttribute("data-kryss") || !tom(e))) return;
        settInn(e, !e.classList.contains("luke"));
      });

      // Oppgaver uten svarplass får en svarlinje.
      o.querySelectorAll("li").forEach(function (li) {
        if (li.querySelector(".skriv, .valg, table, ol, ul, input, textarea, select, svg, img, canvas")) return;
        var d = document.createElement("div");
        d.className = "svar";
        d.style.cssText = "border-bottom:1px solid var(--line,#999);min-height:2em;padding-top:6px";
        li.appendChild(d);
        settInn(d, true);
      });

      // Sett ring rundt eller kryss: trykk på et alternativ (trykk igjen for å ta det bort).
      // I en kryssrad med data-en (ett riktig svar) kan bare én rute ha kryss.
      o.querySelectorAll(".valg > span, td[data-kryss]").forEach(function (s) {
        valg.push(s);
        s.setAttribute("role", "button");
        s.setAttribute("aria-label", s.tagName === "TD" ? "Kryss" : s.textContent.trim());
        s.tabIndex = 0;
        var bytt = function () {
          var på = !s.hasAttribute("data-ring");
          if (på && s.parentElement.hasAttribute("data-en")) {
            s.parentElement.querySelectorAll("td[data-kryss]").forEach(function (c) { c.removeAttribute("data-ring"); farge(c); });
          }
          if (på) s.setAttribute("data-ring", ""); else s.removeAttribute("data-ring");
          farge(s);
          lagre();
        };
        s.addEventListener("click", bytt);
        s.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bytt(); } });
      });

      // Ordbank: trykk på et ord, så skrives det i luka du sist trykket i (eller første tomme luke i oppgaven).
      o.querySelectorAll(".ordbank > span").forEach(function (ord) {
        ord.style.cursor = "pointer";
        ord.addEventListener("click", function () {
          var oppg = ord.closest(".oppg, .oppgave, li") || o;
          var mål = sist && oppg.contains(sist) ? sist
            : [].filter.call(oppg.querySelectorAll(".skriv"), function (f) { return !f.textContent.trim(); })[0];
          if (!mål) return;
          mål.textContent = ord.textContent.trim();
          lagre();
          var neste = [].filter.call(oppg.querySelectorAll(".skriv"), function (f) { return !f.textContent.trim(); })[0];
          sist = neste || null;
        });
      });
    });

    // Henter svarene fra forrige gang.
    (lagret.t || []).forEach(function (t, i) { if (felt[i] && t) felt[i].textContent = t; });
    (lagret.v || []).forEach(function (v, i) { if (valg[i] && v) { valg[i].setAttribute("data-ring", ""); farge(valg[i]); } });

    // Knappene legges ved siden av «Vis fasit» (den finnes, men er skjult, også på elevsiden).
    var fasitKnapp = document.querySelector("#fasitBtn, #btnFasit");
    var skrivUt = document.querySelector("#btnPrint, button[onclick='print()']");
    var linje = (skrivUt || fasitKnapp || {}).parentElement;
    if (!linje) {
      linje = document.createElement("div");
      linje.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;margin:0 0 12px";
      omr[0].insertBefore(linje, omr[0].firstChild);
    }
    var mal = fasitKnapp || skrivUt;
    function knapp(tekst, gjør) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = ((mal && mal.className) || "") + " no-print utfylling-knapp";
      b.textContent = tekst;
      b.addEventListener("click", gjør);
      linje.appendChild(b);
      return b;
    }
    if (skrivUt) {
      skrivUt.textContent = "🖨 Skriv ut / lagre som PDF";
    } else {
      knapp("🖨 Skriv ut / lagre som PDF", function () { window.print(); });
    }
    knapp("🗑 Tøm svarene", function () {
      if (!confirm("Vil du slette alle svarene dine på denne siden?")) return;
      felt.forEach(function (f) { f.textContent = ""; });
      valg.forEach(function (v) { v.removeAttribute("data-ring"); farge(v); });
      lagre();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
