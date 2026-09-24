/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Sınav Koçu (KPSS-B paketi) · TÜM HAKLARI SAKLIDIR.
   5846 sayılı FSEK kapsamında korunur. İzinsiz çoğaltma, kopyalama, satış ve dağıtım yasaktır. */

/* ═══════════════════════════════════════════════════════════════════════════
   ÜSTAD KOÇ PRO · SINAV & ANALİZ MODÜLÜ (koc2.js)
   1 uyarlamalı zorluk · 2 deneme simülasyonu + puan tahmini · 3 hata defteri ·
   4 soru kronometresi & hız analizi · 7 konu trendi · 8 şık dağılımı ·
   12 son 7 gün programı · 13 çalışma arkadaşı kodu · 15 hatırlatma saati ·
   19 soru paketi dışa/içe aktarma
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var K = window.KOC; if (!K) return;
  var D = K.Depo;
  var b = function (x) { return window.USTAD_SORULAR || []; };

  function bekle(ms) { return new Promise(function (x) { setTimeout(x, ms); }); }
  function n(s) { return String(s == null ? "" : s); }
  function panel(baslik, govde, genis) { return K.panel ? K.panel(baslik, govde, genis) : null; }

  /* ─────────── 1) UYARLAMALI ZORLUK ─────────── */
  /* Son başarıya göre hedef zorluk: yüksek başarı → Zor, orta → Orta, düşük → Kolay */
  function hedefZorluk() {
    var gecmis = D.al("koc2.basari", []);   /* son testlerin yüzdeleri */
    if (gecmis.length < 2) return "Kolay";
    var son = gecmis.slice(-3);
    var ort = son.reduce(function (a, x) { return a + x; }, 0) / son.length;
    if (ort >= 70) return "Zor";
    if (ort >= 45) return "Orta";
    return "Kolay";
  }
  function uyarlamaliTest(adet) {
    adet = adet || 20;
    var hedef = hedefZorluk();
    var havuz = b().filter(function (s) { return s.zorluk === hedef; });
    if (havuz.length < 5) havuz = havuz.concat(b().filter(function (s) { return s.zorluk !== hedef; }));
    var secili = [], i;
    /* kolay→zor sıralı ısınma: ilk 3 kolay, sonra hedef seviye */
    var kolaylar = b().filter(function (s) { return s.zorluk === "Kolay"; });
    for (i = 0; i < 3 && i < kolaylar.length; i++) secili.push(kolaylar[i]);
    var kalan = havuz.filter(function (s) { return secili.indexOf(s) < 0; });
    for (i = 0; i < kalan.length && secili.length < adet; i++) secili.push(kalan[i]);
    /* karıştır (ilk 3 hariç) */
    var ilk = secili.slice(0, 3), diger = secili.slice(3);
    for (i = diger.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = diger[i]; diger[i] = diger[j]; diger[j] = t; }
    K.testBasla(ilk.concat(diger), "Uyarlamalı Test · " + hedef + " seviye", "uyarlamali");
    D.al("koc2.sonZorluk", hedef);
  }
  function basariKaydet(yuzde) {
    var g = D.al("koc2.basari", []); g.push(yuzde);
    if (g.length > 40) g = g.slice(-40);
    D.koy("koc2.basari", g);
  }

  /* ─────────── 2) DENEME SİMÜLASYONU + PUAN TAHMİNİ ─────────── */
  var SM = { sorular: [], cevap: [], i: 0, kalan: 0, zaman: null };
  function denemeSimulasyon() {
    var t = b();
    if (t.length < 20) { alert("Soru bankası yetersiz."); return; }
    /* ders ağırlıklarına göre 120 soru seç */
    var dersler = (window.USTAD_PAKET && window.USTAD_PAKET.dersler) || [];
    var secili = [];
    dersler.forEach(function (d) {
      var h = t.filter(function (s) { return s.ders === d.ad; });
      for (var i = h.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = h[i]; h[i] = h[j]; h[j] = x; }
      secili = secili.concat(h.slice(0, d.soru || 20));
    });
    if (!secili.length) secili = t.slice(0, 120);
    SM.sorular = secili.slice(0, 120); SM.cevap = []; SM.i = 0; SM.kalan = 130 * 60;
    simulasyonCiz(true);
  }
  function zamanYaz() {
    var d = SM.kalan, s = Math.floor(d / 60), sn = d % 60;
    var el = $("#smZaman");
    if (el) el.textContent = (s < 10 ? "0" : "") + s + ":" + (sn < 10 ? "0" : "") + sn;
  }
  function simulasyonCiz(ilk) {
    if (ilk) {
      var eski = $(".koc-sim"); if (eski) eski.parentNode.removeChild(eski);
      if (SM.zaman) clearInterval(SM.zaman);
      SM.zaman = setInterval(function () {
        SM.kalan--; zamanYaz();
        if (SM.kalan <= 0) { clearInterval(SM.zaman); SM.zaman = null; simulasyonBitir(); }
      }, 1000);
    }
    var eski2 = $(".koc-sim"); if (eski2) eski2.parentNode.removeChild(eski2);
    var s = SM.sorular[SM.i];
    var secili = SM.cevap[SM.i];
    var dogruMu = secili !== undefined && secili !== null && secili === s.dogru;
    var kap = document.createElement("div");
    kap.className = "modul koc-sim";
    kap.innerHTML = "<div class='modul-ic'><div class='soru-kutu'>" +
      "<div class='koc-sim-ust'><span>🎯 Deneme Simülasyonu · " + SM.sorular.length + " soru</span>" +
      "<b id='smZaman'>130:00</b></div>" +
      (secili !== undefined && secili !== null
        ? "<div class='cevap-bant " + (dogruMu ? "iyi" : "kotu") + "'><div class='bant-simge'>" + (dogruMu ? "✔" : "✘") + "</div>" +
          "<div class='bant-metin'><b>" + (dogruMu ? "Doğru." : "Yanlış.") + "</b><span>Doğru cevap: " + "ABCD".charAt(s.dogru) + ") " + n(s.secenekler[s.dogru]).slice(0, 60) + "</span></div></div>"
        : "") +
      "<div class='koc-ust'><span class='koc-etiket'>" + (SM.i + 1) + " / " + SM.sorular.length + "</span>" +
      "<span class='koc-sayac'>" + s.ders + " · " + s.konu + "</span></div>" +
      "<h3 class='koc-soru'>" + s.soru + "</h3>" +
      "<div class='koc-secenekler'>" + s.secenekler.map(function (o, j) {
        var c = "";
        if (secili !== undefined && secili !== null) { if (j === s.dogru) c = "dogru"; else if (j === secili) c = "yanlis"; }
        return "<button class='koc-secenek " + c + "' data-sm='" + j + "'><b>" + "ABCD".charAt(j) + ")</b><span>" + o + "</span></button>";
      }).join("") + "</div>" +
      "<div class='soru-alt'>" +
        "<button class='ikincil-dugme' data-smgit='prev'>← Önceki</button>" +
        "<button class='ikincil-dugme' data-smgit='next'>Sonraki →</button>" +
        "<button class='ikincil-dugme' data-smoptik='1'>📋 Cevap kâğıdı</button>" +
        "<button class='ikincil-dugme kirmizi' data-smbitir='1'>Sınavı bitir</button>" +
      "</div></div></div>";
    document.body.appendChild(kap);
    zamanYaz();
    kap.querySelectorAll("[data-sm]").forEach(function (x) {
      x.addEventListener("click", function () {
        var j = Number(x.getAttribute("data-sm"));
        if (SM.cevap[SM.i] !== undefined && SM.cevap[SM.i] !== null) return;
        SM.cevap[SM.i] = j; simulasyonCiz(false);
      });
    });
    kap.querySelectorAll("[data-smgit]").forEach(function (x) {
      x.addEventListener("click", function () {
        var y = x.getAttribute("data-smgit");
        SM.i = y === "prev" ? Math.max(0, SM.i - 1) : Math.min(SM.sorular.length - 1, SM.i + 1);
        simulasyonCiz(false);
      });
    });
    kap.querySelector("[data-smoptik]").addEventListener("click", function () {
      panel("📋 Cevap Kâğıdı",
        "<div class='koc-liste'>" + SM.sorular.map(function (q, j) {
          var c = SM.cevap[j];
          var cev = (c === undefined || c === null) ? "—" : "ABCD".charAt(c);
          var sinif = (c === undefined || c === null) ? "" : (c === q.dogru ? "secili" : "yanlis-satir");
          return "<button class='koc-buyuk-satir " + sinif + "' data-atla='" + j + "'>" + (j + 1) + ". " + q.ders + "<span>Cevap: " + cev + "</span></button>";
        }).join("") + "</div>", "geniş").querySelectorAll("[data-atla]").forEach(function (x) {
          x.addEventListener("click", function () { SM.i = Number(x.getAttribute("data-atla")); panelKapat(); simulasyonCiz(false); });
        });
      function panelKapat() { var p = $(".koc-panel"); if (p) p.parentNode.removeChild(p); }
    });
    kap.querySelector("[data-smbitir]").addEventListener("click", function () { simulasyonBitir(); });
  }
  function simulasyonBitir() {
    var eski = $(".koc-sim"); if (eski) eski.parentNode.removeChild(eski);
    if (SM.zaman) { clearInterval(SM.zaman); SM.zaman = null; }
    var dersler = {};
    var dogruT = 0, yanlisT = 0, bosT = 0;
    SM.sorular.forEach(function (s, j) {
      var c = SM.cevap[j];
      dersler[s.ders] = dersler[s.ders] || { d: 0, y: 0, b: 0, soru: 0 };
      dersler[s.ders].soru++;
      if (c === undefined || c === null) { dersler[s.ders].b++; bosT++; }
      else if (c === s.dogru) { dersler[s.ders].d++; dogruT++; }
      else { dersler[s.ders].y++; yanlisT++; }
    });
    var netGY = 0, netGK = 0, dersAdlari = Object.keys(dersler);
    var gyDers = ["Türkçe", "Matematik"];
    dersAdlari.forEach(function (d) {
      var x = dersler[d], net = x.d - x.y / 4;
      if (gyDers.indexOf(d) >= 0) netGY += net; else netGK += net;
    });
    /* kaba yaklaşım: P3 ≈ 50 + GY oranı*30 + GK oranı*30 (yalnız tahmin) */
    var puan = Math.round(50 + (netGY / 60) * 30 + (netGK / 60) * 30);
    puan = Math.max(0, Math.min(100, puan));
    var dk = Math.floor((130 * 60 - SM.kalan) / 60), sn = (130 * 60 - SM.kalan) % 60;
    D.koy("koc.deneme", { girisim: (D.al("koc.deneme", {}).girisim || 0) + 1, sonPuan: puan, sonNet: { gy: Math.round(netGY * 10) / 10, gk: Math.round(netGK * 10) / 10 } });
    var dn = D.al("koc2.denemeler", []); dn.push({ tarih: new Date().toISOString(), puan: puan, dogru: dogruT, yanlis: yanlisT, bos: bosT });
    D.koy("koc2.denemeler", dn.slice(-30));
    basariKaydet(Math.round((dogruT / SM.sorular.length) * 100));
    panel("🎯 Deneme Sonucu",
      "<div class='koc-karne-kutular'>" +
        "<div><b>" + dogruT + "</b><span>Doğru</span></div><div><b>" + yanlisT + "</b><span>Yanlış</span></div>" +
        "<div><b>" + bosT + "</b><span>Boş</span></div><div><b>" + puan + "</b><span>Tahmini puan</span></div></div>" +
      "<div class='koc-ozet-satir'><span>Genel Yetenek net</span><b>" + (Math.round(netGY * 10) / 10) + " / 60</b></div>" +
      "<div class='koc-ozet-satir'><span>Genel Kültür net</span><b>" + (Math.round(netGK * 10) / 10) + " / 60</b></div>" +
      "<div class='koc-ozet-satir'><span>Süre</span><b>" + dk + " dk " + sn + " sn</b></div>" +
      "<table class='koc-tablo'><thead><tr><th>Ders</th><th>Doğru</th><th>Yanlış</th><th>Boş</th></tr></thead><tbody>" +
      dersAdlari.map(function (d) { var x = dersler[d]; return "<tr><td>" + d + "</td><td>" + x.d + "</td><td>" + x.y + "</td><td>" + x.b + "</td></tr>"; }).join("") +
      "</tbody></table><p class='aciklama'>Puan tahmini kaba bir yaklaşımdır (net = doğru − yanlış/4); kesin sonuç ÖSYM'nin değerlendirmesidir.</p>", "geniş");
    if (window.USTAD_MOTOR.kutlama) window.USTAD_MOTOR.kutlama(Math.round((dogruT / SM.sorular.length) * 100), "Deneme Sınavı", dogruT + " doğru · " + yanlisT + " yanlış · tahmini " + puan + " puan");
  }
  function denemeArsivi() {
    var dn = D.al("koc2.denemeler", []);
    var govde = !dn.length ? "<p class='aciklama'>Henüz deneme kaydı yok.</p>" :
      "<div class='koc-liste'>" + dn.slice().reverse().map(function (x) {
        return "<div class='koc-kayit-satir'><b>" + x.puan + "</b><span>" + new Date(x.tarih).toLocaleDateString("tr-TR") +
          "<i>" + x.dogru + " doğru · " + x.yanlis + " yanlış · " + x.bos + " boş</i></span></div>";
      }).join("") + "</div>";
    panel("🗂 Deneme Arşivi (" + dn.length + ")", govde, "geniş");
  }

  /* ─────────── 3) HATA DEFTERİ ─────────── */
  function hataDefteri() {
    var yanlislar = [];
    (b() || []).forEach(function (s) {
      var t = D.al("koc.tekrar", {})[K.soruKimlik ? K.soruKimlik(s) : ""];
      if (t && (t.kutu === 1 || t.kutu === 2)) yanlislar.push(s);
    });
    var notlar = D.al("koc2.notlar", {});
    var govde = !yanlislar.length ? "<p class='aciklama'>Hata defterin boş — yanlış yaptığın sorular burada birikir.</p>" :
      "<p class='aciklama'>Tekrar kutusunda 1-2. seviyede olan (yani henüz öğrenmediğin) sorular. Altına kendi notunu yaz.</p>" +
      "<div class='koc-liste'>" + yanlislar.slice(0, 30).map(function (s) {
        var id = K.soruKimlik ? K.soruKimlik(s) : s.soru.slice(0, 20);
        return "<div class='koc-hata'><b>" + s.ders + " · " + s.konu + "</b>" +
          "<span>" + n(s.soru).slice(0, 130) + "…</span>" +
          "<i>Doğru cevap: " + "ABCD".charAt(s.dogru) + ") " + n(s.secenekler[s.dogru]).slice(0, 80) + "</i>" +
          "<textarea class='koc-yazi' data-not='" + id + "' placeholder='Neden yanlış yaptım? Notum…'>" + (notlar[id] || "") + "</textarea></div>";
      }).join("") + "</div><div class='soru-alt'><button class='buyuk-dugme' data-kaydet='1'>💾 Notları kaydet</button>" +
      "<button class='ikincil-dugme' data-tekrar='1'>🔁 Bu konuları tekrar çöz</button></div>";
    var k = panel("📕 Hata Defteri (" + yanlislar.length + ")", govde, "geniş");
    if (!k) return;
    k.querySelector("[data-kaydet]").addEventListener("click", function () {
      var yeni = {};
      k.querySelectorAll("[data-not]").forEach(function (t) { if (t.value.trim()) yeni[t.getAttribute("data-not")] = t.value.trim(); });
      D.koy("koc2.notlar", yeni);
      alert("Hata notların kaydedildi (" + Object.keys(yeni).length + " not).");
    });
    var t2 = k.querySelector("[data-tekrar]");
    if (t2) t2.addEventListener("click", function () { var p = $(".koc-panel"); if (p) p.parentNode.removeChild(p); K.testBasla(yanlislar.slice(0, 20), "Hata Defteri Tekrarı", "hata"); });
  }

  /* ─────────── 4) KRONOMETRE & HIZ ANALİZİ ─────────── */
  var hizBasi = null;
  function hizBasla() { hizBasi = Date.now(); }
  function hizBitir(ders, konu) {
    if (!hizBasi) return;
    var sn = Math.round((Date.now() - hizBasi) / 1000);
    hizBasi = null;
    if (sn <= 0 || sn > 600) sn = 1;
    var h = D.al("koc2.hiz", []); h.push({ ders: ders, konu: konu, sn: sn, tarih: new Date().toISOString() });
    D.koy("koc2.hiz", h.slice(-400));
  }
  function hizAnalizi() {
    var h = D.al("koc2.hiz", []);
    if (!h.length) { panel("⏱ Hız Analizi", "<p class='aciklama'>Henüz ölçüm yok. KOÇ PRO testlerinde her soru için süre kaydedilir.</p>"); return; }
    var ders = {}, genel = 0;
    h.forEach(function (x) { ders[x.ders] = ders[x.ders] || { t: 0, n: 0, s: 0 }; ders[x.ders].t += x.sn; ders[x.ders].n++; if (x.sn > 120) ders[x.ders].s++; genel += x.sn; });
    var adlar = Object.keys(ders);
    var govde = "<p class='aciklama'>Ortalama çözüm süresi: <b>" + (Math.round(genel / h.length)) + " sn</b> · Ölçülen soru: " + h.length +
      " · 120 sn üstü (yavaş) soru: " + h.filter(function (x) { return x.sn > 120; }).length + "</p>" +
      "<table class='koc-tablo'><thead><tr><th>Ders</th><th>Ortalama</th><th>Soru</th><th>Yavaş</th></tr></thead><tbody>" +
      adlar.map(function (d) {
        var x = ders[d], ort = Math.round(x.t / x.n);
        return "<tr><td>" + d + "</td><td><b>" + ort + " sn</b></td><td>" + x.n + "</td><td>" + x.s + "</td></tr>";
      }).join("") + "</tbody></table><p class='aciklama'>İpucu: sınavda soru başına ortalama 65 sn düşer (130 dk / 120 soru). 90 sn üstü konuları hız çalışması yap.</p>";
    panel("⏱ Hız Analizi", govde, "geniş");
  }

  /* ─────────── 7) KONU TRENDİ ─────────── */
  function trendKaydet(harita) {
    var t = D.al("koc2.trend", {});
    (harita || []).forEach(function (x) {
      var a = x.konu + "|" + x.ders;
      t[a] = t[a] || [];
      t[a].push({ tarih: new Date().toISOString().slice(0, 10), oran: x.oran, toplam: x.toplam });
      if (t[a].length > 20) t[a] = t[a].slice(-20);
    });
    D.koy("koc2.trend", t);
  }
  function trendPaneli() {
    var t = D.al("koc2.trend", {});
    var adlar = Object.keys(t).filter(function (a) { return t[a].length >= 2; });
    if (!adlar.length) { panel("📈 Konu Trendi", "<p class='aciklama'>Trend oluşması için aynı konuda en az iki ölçüm gerekir. Test çözdükçe burada grafik oluşur.</p>"); return; }
    var govde = "<p class='aciklama'>Yanlış oranının zaman içindeki seyri (aşağı = gelişme). Son değer sağda.</p>" +
      adlar.slice(0, 12).map(function (a) {
        var p = a.split("|"), seri = t[a].slice(-10);
        var gen = Math.max(20, Math.max.apply(null, seri.map(function (x) { return x.oran; })));
        var ilk = seri[0].oran, son = seri[seri.length - 1].oran, fark = son - ilk;
        return "<div class='koc-trend'><b>" + p[0] + " <i>(" + p[1] + ")</i></b>" +
          "<div class='koc-trend-bar'>" + seri.map(function (x) {
            return "<i style='height:" + Math.max(8, Math.round((x.oran / gen) * 44)) + "px' title='" + x.tarih + " %" + x.oran + "'></i>";
          }).join("") + "</div>" +
          "<span class='" + (fark <= 0 ? "koc-iyi" : "koc-kotu") + "'>%" + ilk + " → %" + son + " (" + (fark <= 0 ? "▼" : "▲") + Math.abs(fark) + ")</span></div>";
      }).join("");
    panel("📈 Konu Trendi", govde, "geniş");
  }

  /* ─────────── 8) ŞIK DAĞILIMI ─────────── */
  function sikKaydet(secim, dogruMu) {
    var s = D.al("koc2.sik", { A: 0, B: 0, C: 0, D: 0, dogru: 0, yanlis: 0 });
    var harf = "ABCD".charAt(secim);
    s[harf] = (s[harf] || 0) + 1;
    if (dogruMu) s.dogru++; else s.yanlis++;
    D.koy("koc2.sik", s);
  }
  function sikPaneli() {
    var s = D.al("koc2.sik", { A: 0, B: 0, C: 0, D: 0, dogru: 0, yanlis: 0 });
    var top = s.A + s.B + s.C + s.D;
    if (!top) { panel("🎲 Şık Dağılımı", "<p class='aciklama'>Henüz veri yok. Test çözdükçe işaretlediğin şıklar analiz edilir.</p>"); return; }
    var govde = "<p class='aciklama'>İşaretlediğin şıkların dağılımı ve isabet oranı.</p>" +
      ["A", "B", "C", "D"].map(function (h) {
        var y = Math.round((s[h] / top) * 100);
        return "<div class='koc-sik'><b>" + h + "</b><span class='koc-sik-bar'><i style='width:" + y + "%'></i></span><em>%" + y + " (" + s[h] + ")</em></div>";
      }).join("") +
      "<div class='koc-ozet-satir'><span>Doğru işaretleme</span><b>" + s.dogru + " / " + top + " (%" + Math.round((s.dogru / top) * 100) + ")</b></div>" +
      "<p class='aciklama'>Bir şıkkı aşırı işaretliyorsan (ör. %40+) soruları okurken ön yargılı gidiyor olabilirsin.</p>";
    panel("🎲 Şık Dağılımı", govde, "geniş");
  }

  /* ─────────── 12) SON 7 GÜN PROGRAMI ─────────── */
  function sonYediGun() {
    var kg = K.kalanGun();
    var govde;
    if (kg === null) govde = "<p class='aciklama'>Sınav tarihini ayarlarsan son hafta planı otomatik kurulur. (Usta modu → Sınav tarihi)</p>";
    else if (kg > 7) govde = "<p class='aciklama'>Sınava <b>" + kg + " gün</b> var. Son 7 gün programı, sınav 7 günden az kalınca otomatik açılır. O güne kadar normal programına devam et.</p>";
    else govde = "<p class='aciklama'>Sınava <b>" + Math.max(0, kg) + " gün</b> kaldı. Bu hafta yeni konu yok; tekrar ve deneme var:</p>" +
      "<div class='koc-liste'>" +
        "<div class='koc-buyuk-satir'>📅 Yeni konu çalışma<span>Bu hafta yeni konu eklemek yerine var olanı pekiştir.</span></div>" +
        "<div class='koc-buyuk-satir'>🔁 Günde 40 soru tekrar<span>Akıllı tekrar kuyruğun + yanlışların</span></div>" +
        "<div class='koc-buyuk-satir'>🎯 Gün aşırı deneme<span>Simülasyon modu, 120 soru / 130 dk</span></div>" +
        "<div class='koc-buyuk-satir'>📚 Ders notlarını tara<span>20 notu hızlıca gözden geçir</span></div>" +
      "</div><div class='soru-alt'><button class='buyuk-dugme' data-islem='tekrar'>🔁 Tekrar kuyruğunu aç</button>" +
      "<button class='ikincil-dugme' data-islem='sim'>🎯 Deneme simülasyonu</button></div>";
    var k = panel("🗓 Son 7 Gün Programı", govde, "geniş");
    if (!k) return;
    var a = k.querySelector("[data-islem='tekrar']"), c = k.querySelector("[data-islem='sim']");
    if (a) a.addEventListener("click", function () { var p = $(".koc-panel"); if (p) p.parentNode.removeChild(p); var v = K.tekrarVadesiGelenler(true); if (!v.length) { alert("Tekrar kuyruğu boş."); return; } K.testBasla(v.slice(0, 20), "Son Hafta Tekrarı", "tekrar"); });
    if (c) c.addEventListener("click", function () { var p = $(".koc-panel"); if (p) p.parentNode.removeChild(p); denemeSimulasyon(); });
  }

  /* ─────────── 13) ÇALIŞMA ARKADAŞI KODU ─────────── */
  function arkadasKodu() {
    var kod = D.al("koc2.arkadasKod", null);
    if (!kod) {
      kod = "UKP-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      D.koy("koc2.arkadasKod", kod);
    }
    var puan2 = D.al("koc.puan", { dogru: 0, test: 0 }), seri = D.al("koc.seri", {}), rozet = (D.al("koc.rozet", []) || []).length;
    var paylas = JSON.stringify({ k: kod, d: puan2.dogru || 0, t: puan2.test || 0, s: seri.gun || 0, r: rozet });
    var govde = "<p class='aciklama'>Kendi kodunu arkadaşına ver; onun kodunu aşağıya yapıştır. Haftalık çalışmanı karşılaştırın (kimse görmez, her şey cihazda kalır).</p>" +
      "<div class='koc-kod'><b>" + kod + "</b><button class='ikincil-dugme' data-paylas='1'>📤 Kodumu paylaş</button></div>" +
      "<textarea class='koc-yazi' id='kocArkadasKutu' placeholder='Arkadaşının kodunu buraya yapıştır…'></textarea>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-karsilastir='1'>⚖️ Karşılaştır</button></div><div id='kocArkadasSonuc'></div>";
    var k = panel("🤝 Çalışma Arkadaşı", govde, "geniş");
    if (!k) return;
    k.querySelector("[data-paylas]").addEventListener("click", function () {
      try { navigator.clipboard.writeText(paylas); alert("Kodun kopyalandı:\n\n" + paylas); } catch (e) { alert(paylas); }
    });
    k.querySelector("[data-karsilastir]").addEventListener("click", function () {
      var v = $("#kocArkadasKutu").value.trim();
      var o;
      try { o = JSON.parse(v); } catch (e) {
        /* kısa "UKP-XXXX-XXXX" biçimi de kabul: yalnız kod, veri yok */
        if (/^UKP-/.test(v)) { $("#kocArkadasSonuc").innerHTML = "<p class='aciklama'>Yalnız kod girildi; karşılaştırma için arkadaşının “Kodumu paylaş” çıktısını (uzun metin) yapıştır.</p>"; return; }
        $("#kocArkadasSonuc").innerHTML = "<p class='aciklama'>Kod okunamadı.</p>"; return;
      }
      function satir(ad, ben, o) { return "<tr><td>" + ad + "</td><td><b>" + ben + "</b></td><td>" + o + "</td><td>" + (ben >= o ? "🏆" : "") + "</td></tr>"; }
      $("#kocArkadasSonuc").innerHTML = "<table class='koc-tablo'><thead><tr><th>Ölçüt</th><th>Ben</th><th>Arkadaş</th><th></th></tr></thead><tbody>" +
        satir("Doğru sayısı", puan2.dogru || 0, o.d || 0) + satir("Test sayısı", puan2.test || 0, o.t || 0) +
        satir("Gün serisi", seri.gun || 0, o.s || 0) + satir("Rozet", rozet, o.r || 0) + "</tbody></table>";
    });
  }

  /* ─────────── 15) HATIRLATMA SAATİ ─────────── */
  function hatirlatmaPaneli() {
    var h = D.al("koc2.hatirlatma", { saat: "20:00", acik: true });
    var govde = "<p class='aciklama'>Uygulamayı açtığında, belirlediğin saat geçtiyse ve o gün çalışmadıysan seni uyarır. (Android'de gerçek bildirim bir sonraki adımda eklenecek.)</p>" +
      "<label class='cip' style='display:inline-flex;gap:8px;align-items:center;padding:10px 14px'>" +
      "<input type='checkbox' id='kocHatAc' " + (h.acik ? "checked" : "") + "> Hatırlatma açık</label>" +
      "<input type='time' class='koc-girdi' id='kocHatSaat' value='" + h.saat + "'>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-kaydet='1'>💾 Kaydet</button>" +
      "<button class='ikincil-dugme' data-dene='1'>🔔 Şimdi dene</button></div>";
    var k = panel("🔔 Günlük Hatırlatma", govde);
    if (!k) return;
    k.querySelector("[data-kaydet]").addEventListener("click", function () {
      D.koy("koc2.hatirlatma", { acik: $("#kocHatAc").checked, saat: $("#kocHatSaat").value || "20:00" });
      alert("Hatırlatma kaydedildi.");
    });
    k.querySelector("[data-dene]").addEventListener("click", function () {
      var m = "Bugünkü sorularını çözmeyi unutma! 🔥 Seri: " + ((D.al("koc.seri", {}).gun) || 0) + " gün";
      try { if (window.USTAD && window.USTAD.bildir) window.USTAD.bildir(m); } catch (e) {}
      if (window.USTAD_MOTOR.konus) window.USTAD_MOTOR.konus("Bugünkü sorularını çözmeyi unutma.");
      alert("Sesli hatırlatma yapıldı:\n\n" + m);
    });
  }
  function hatirlatmaKontrol() {
    var h = D.al("koc2.hatirlatma", { saat: "20:00", acik: true });
    if (!h.acik) return;
    var sr = D.al("koc.seri", {});
    if (sr.son === new Date().toISOString().slice(0, 10)) return;   /* bugün çalışmış */
    var par = (h.saat || "20:00").split(":"), su = new Date();
    var simdiDk = su.getHours() * 60 + su.getMinutes(), hedefDk = Number(par[0]) * 60 + Number(par[1]);
    if (simdiDk >= hedefDk) setTimeout(function () {
      if (window.USTAD_MOTOR.konus) window.USTAD_MOTOR.konus("Bugün henüz çalışmadın. Serini kaybetmemek için birkaç soru çöz.");
    }, 2600);
  }

  /* ─────────── 19) SORU PAKETİ DIŞA / İÇE ─────────── */
  function soruPaketi() {
    var kendi = D.al("koc.sorular", []);
    var govde = "<p class='aciklama'>Kendi sorularını paket olarak dışa aktar (arkadaşına/öğrencine ver), ya da onların paketini içe al. Ana soru bankasına dokunulmaz.</p>" +
      "<div class='koc-ozet-satir'><span>Kendi soru sayın</span><b>" + kendi.length + "</b></div>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-disa='1'>📤 Paket olarak indir</button>" +
      "<button class='ikincil-dugme' data-ice='1'>📥 Paket içe al (dosya)</button>" +
      "<button class='ikincil-dugme' data-sil='1'>🗑 Kendi sorularımı sil</button></div>" +
      "<input type='file' id='kocPaketDosya' accept='.json,.ukp' style='display:none'>";
    var k = panel("📦 Soru Paketi", govde, "geniş");
    if (!k) return;
    k.querySelector("[data-disa]").addEventListener("click", function () {
      if (!kendi.length) { alert("Önce kendi sorularını ekle."); return; }
      var paket = { tur: "ustad-soru-paketi", surum: 1, tarih: new Date().toISOString(), sorular: kendi };
      var metin = JSON.stringify(paket, null, 1);
      try {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([metin], { type: "application/json" }));
        a.download = "ustad-soru-paketi-" + new Date().toISOString().slice(0, 10) + ".json";
        document.body.appendChild(a); a.click(); setTimeout(function () { document.body.removeChild(a); }, 400);
        alert("Paket indirildi (" + kendi.length + " soru).");
      } catch (e) { alert("Dosya indirilemedi."); }
    });
    k.querySelector("[data-ice]").addEventListener("click", function () { $("#kocPaketDosya").click(); });
    k.querySelector("#kocPaketDosya").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var j = JSON.parse(String(r.result));
          var gelen = j.sorular || j;
          if (!gelen.length) throw new Error("boş");
          var mevcut = D.al("koc.sorular", []);
          gelen.forEach(function (s) {
            if (s && s.soru && s.secenekler && typeof s.dogru === "number") mevcut.push({
              ders: s.ders || "Diğer", konu: s.konu || "Paylaşılan", zorluk: s.zorluk || "Orta",
              tip: "Paket", metin: "", soru: s.soru, secenekler: s.secenekler, dogru: s.dogru, aciklama: s.aciklama || ""
            });
          });
          D.koy("koc.sorular", mevcut);
          alert(gelen.length + " soru içe alındı. Toplam kendi sorun: " + mevcut.length);
        } catch (err) { alert("Paket okunamadı: dosya bozuk ya da farklı biçimde."); }
      };
      r.readAsText(f);
    });
    k.querySelector("[data-sil]").addEventListener("click", function () {
      if (!confirm("Kendi sorularının TAMAMI silinecek. Emin misin?")) return;
      D.koy("koc.sorular", []); alert("Kendi soruların silindi."); var p = $(".koc-panel"); if (p) p.parentNode.removeChild(p);
    });
  }

  /* ─────────── KOÇ PRO paneline bölüm ekle ─────────── */
  function blokEkle() {
    var alan = $("#kocAlan"); if (!alan || $("#koc2Blok")) return;
    var d = document.createElement("div");
    d.id = "koc2Blok"; d.className = "koc-blok";
    var hedef = hedefZorluk(), dn = D.al("koc2.denemeler", []);
    d.innerHTML = "<h3>🧪 Sınav & Analiz</h3>" +
      "<p class='aciklama'>Uyarlamalı seviye: <b>" + hedef + "</b> · Deneme kaydı: " + dn.length + " · " +
      "Ölçülen soru süresi: " + D.al("koc2.hiz", []).length + "</p>" +
      "<div class='soru-alt'>" +
        "<button class='buyuk-dugme' data-k2='uyarla'>🧠 Uyarlamalı test (20 soru)</button>" +
        "<button class='buyuk-dugme' data-k2='sim'>🎯 Deneme simülasyonu (120 soru · 130 dk)</button>" +
        "<button class='ikincil-dugme' data-k2='arsiv'>🗂 Deneme arşivi</button>" +
        "<button class='ikincil-dugme' data-k2='hiz'>⏱ Hız analizi</button>" +
        "<button class='ikincil-dugme' data-k2='hata'>📕 Hata defteri</button>" +
        "<button class='ikincil-dugme' data-k2='trend'>📈 Konu trendi</button>" +
        "<button class='ikincil-dugme' data-k2='sik'>🎲 Şık dağılımı</button>" +
        "<button class='ikincil-dugme' data-k2='son7'>🗓 Son 7 gün programı</button>" +
        "<button class='ikincil-dugme' data-k2='arkadas'>🤝 Çalışma arkadaşı</button>" +
        "<button class='ikincil-dugme' data-k2='hatirlatma'>🔔 Günlük hatırlatma</button>" +
        "<button class='ikincil-dugme' data-k2='paket'>📦 Soru paketi</button>" +
      "</div>";
    alan.appendChild(d);
    d.querySelectorAll("[data-k2]").forEach(function (x) {
      x.addEventListener("click", function () {
        var i = x.getAttribute("data-k2");
        if (i === "uyarla") uyarlamaliTest(20);
        else if (i === "sim") denemeSimulasyon();
        else if (i === "arsiv") denemeArsivi();
        else if (i === "hiz") hizAnalizi();
        else if (i === "hata") hataDefteri();
        else if (i === "trend") trendPaneli();
        else if (i === "sik") sikPaneli();
        else if (i === "son7") sonYediGun();
        else if (i === "arkadas") arkadasKodu();
        else if (i === "hatirlatma") hatirlatmaPaneli();
        else if (i === "paket") soruPaketi();
      });
    });
  }

  /* ─────────── kancaları bağla ─────────── */
  (K.cizKancalari = K.cizKancalari || []).push(blokEkle);
  var basla0 = K.testBasla;
  K.testBasla = function (sorular, baslik, bolum) {
    basla0(sorular, baslik, bolum);
    hizBasla();
    var eski = $(".koc-test");
    if (eski) {
      /* her şık tıklamasında süre + şık dağılımı kaydet */
      eski.querySelectorAll("[data-sec]").forEach(function (x) {
        x.addEventListener("click", function () {
          var j = Number(x.getAttribute("data-sec"));
          var s = sorular[Number((($(".koc-sayac") || {}).textContent || "0 / 1").split("/")[0].replace(/\D/g, "")) - 1] || sorular[0];
          hizBitir(s.ders, s.konu); sikKaydet(j, j === s.dogru); hizBasla();
        });
      });
    }
  };

  /* panel kısayolları + dışa açılanlar */
  window.KOC2 = {
    hedefZorluk: hedefZorluk, uyarlamaliTest: uyarlamaliTest, denemeSimulasyon: denemeSimulasyon,
    simulasyonBitir: simulasyonBitir, denemeArsivi: denemeArsivi, hataDefteri: hataDefteri,
    hizAnalizi: hizAnalizi, trendKaydet: trendKaydet, trendPaneli: trendPaneli, sikPaneli: sikPaneli,
    sonYediGun: sonYediGun, arkadasKodu: arkadasKodu, hatirlatmaPaneli: hatirlatmaPaneli,
    soruPaketi: soruPaketi, basariKaydet: basariKaydet, hatirlatmaKontrol: hatirlatmaKontrol,
    sikKaydet: sikKaydet, hizBitir: hizBitir
  };
  setTimeout(function () { try { hatirlatmaKontrol(); if ($("#kocAlan")) K.ciz(); } catch (e) {} }, 900);
})();
