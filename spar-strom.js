// Sparer strøm og gjør sidene raskere på mobil. bygg.js legger skriptet øverst i <head> på alle sider.
//   1) Figurer som tegnes med requestAnimationFrame oppdateres høyst ca. 30 ganger i sekundet (halverer jobben).
//   2) SVG-animasjoner som er utenfor skjermen settes på pause, og starter igjen når de vises.
(function(){
  var raf = window.requestAnimationFrame && window.requestAnimationFrame.bind(window);
  if (raf) {
    var ko = new Map(), nr = 0, sist = 0, venter = false;
    var kjør = function(t){
      if (t - sist < 30) { raf(kjør); return; }
      sist = t; venter = false; var liste = ko; ko = new Map();
      liste.forEach(function(f){ try { f(t); } catch(e){ setTimeout(function(){ throw e; }); } });
    };
    window.requestAnimationFrame = function(f){ ko.set(++nr, f); if (!venter){ venter = true; raf(kjør); } return nr; };
    window.cancelAnimationFrame = function(id){ ko.delete(id); };
  }
  document.addEventListener("DOMContentLoaded", function(){
    if (!("IntersectionObserver" in window)) return;
    var st = document.createElement("style");
    st.textContent = "svg.ute,svg.ute *{animation-play-state:paused!important}";
    document.head.appendChild(st);
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){
      var sv = e.target; sv.classList.toggle("ute", !e.isIntersecting);
      try { e.isIntersecting ? sv.unpauseAnimations() : sv.pauseAnimations(); } catch(x){}
    }); }, { rootMargin: "100px" });
    document.querySelectorAll("svg").forEach(function(sv){ if (!sv.ownerSVGElement) io.observe(sv); });
  });
})();
