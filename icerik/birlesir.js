/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Sınav Koçu (KPSS-B paketi) · TÜM HAKLARI SAKLIDIR.
   5846 sayılı FSEK kapsamında korunur.
   Bu dosya, genişletme paketlerini (banka-*.js, konular-*.js) ANA bankalara bağlar:
   uygulamanın bütün bölümleri yalnızca window.USTAD_SORULAR ve window.USTAD_NOTLAR okur.
   Yükleme sırası: icerik/sorular.js + icerik/notlar.js → genişletme dosyaları → BU DOSYA → assets/*.js

   KURAL: ana banka ASLA küçültülmez. Tekrar ayıklama yalnızca EKLER arasında yapılır
   (aynı soru iki ayrı genişletme dosyasında yazılmışsa ikincisi atılır). */
(function () {
  "use strict";
  function anahtar(o) {
    var s = (o && (o.soru || o.baslik)) || "";
    return String(s).trim().toLowerCase().replace(/\s+/g, " ");
  }
  function birlestir(ad, ekAd) {
    var ana = Array.isArray(window[ad]) ? window[ad] : [];
    var ek = Array.isArray(window[ekAd]) ? window[ekAd] : [];
    var gorulen = {}, sonuc = ana.slice(), atilan = 0;
    ana.forEach(function (o) { var k = anahtar(o); if (k) gorulen[k] = true; });
    ek.forEach(function (o) {
      if (!o || typeof o !== "object") { atilan++; return; }
      var k = anahtar(o);
      if (k && gorulen[k]) { atilan++; return; }   /* aynı soru/konu iki kez eklenmez */
      if (k) gorulen[k] = true;
      sonuc.push(o);
    });
    window[ad] = sonuc;
    return { toplam: sonuc.length, ana: ana.length, ek: ek.length, atilan: atilan };
  }
  var s = birlestir("USTAD_SORULAR", "USTAD_SORULAR_EK");
  var n = birlestir("USTAD_NOTLAR", "USTAD_NOTLAR_EK");
  window.USTAD_BIRLESME = {
    soruSayisi: s.toplam, anaSoru: s.ana, ekSoru: s.ek, atilanSoru: s.atilan,
    notSayisi: n.toplam, anaNot: n.ana, ekNot: n.ek, atilanNot: n.atilan
  };
})();
