/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Sınav Koçu (KPSS-B paketi) · TÜM HAKLARI SAKLIDIR.
   5846 sayılı FSEK kapsamında korunur. İzinsiz çoğaltma, kopyalama, satış, dağıtım,
   değiştirme, tersine mühendislik ve türev eser üretimi yasaktır.
   Eser künyesi ve kullanım lisansı: uygulama içinde 'Hakkında & Telif' bölümü. */

/* ═══════════════════════════════════════════════════════════════════════════
   ÜSTAD KOÇ PRO · EKLENTİ MODÜLÜ (koc.js)
   Motor (motor.js) DEĞİŞMEZ; bu dosya yalnız KOÇ PRO paketine özel özellikleri ekler:
   1 akıllı tekrar · 2 konu haritası · 3 klasik (yazılı) mod · 4 soruyu dinle ·
   5 kendi soru/not ekleme · 6 geri sayım + seri · 7 rozet/seviye · 8 karne ·
   9 kaygı modülü · 10 yedekle/geri yükle · 11 günün sorusu · 12 usta modu ·
   13 çoklu profil · 14 yazı boyutu + gece modu · 15 optik form (yazdır)
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var D = {
    al: function (k, v) { try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } },
    koy: function (k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); } catch (e) {} },
    sil: function (k) { try { localStorage.removeItem("ustad." + k); } catch (e) {} }
  };

  var KUTU_GUN = [0, 1, 3, 7, 15, 30];      /* akıllı tekrar aralıkları (gün) */
  var SEVIYELER = [0, 50, 150, 300, 500, 800, 1200];
  var SEVIYE_AD = ["Çırak", "Kalfa", "Usta", "Baş Usta", "Üstat", "Efsane", "Şampiyon"];

  /* ─────────── yardımcılar ─────────── */
  function bugun() { var d = new Date(); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  function gunFark(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
  function soruKimlik(s) {
    var t = (s.soru || "").slice(0, 48), h = 0;
    for (var i = 0; i < t.length; i++) { h = ((h << 5) - h + t.charCodeAt(i)) | 0; }
    return (s.ders || "x") + ":" + Math.abs(h).toString(36);
  }
  function banka() { return (window.USTAD_SORULAR || []).concat(D.al("koc.sorular", [])); }
  function karistir(d) {
    d = d.slice();
    for (var i = d.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = d[i]; d[i] = d[j]; d[j] = t; }
    return d;
  }
  function konus(m) { try { window.USTAD_MOTOR.konus(m); } catch (e) {} }
  function titret(ms) { try { if (window.USTAD && window.USTAD.titret) window.USTAD.titret(ms || 30); } catch (e) {} }
  function kutla(yuzde, a, b, moral) { try { if (moral) window.USTAD_MOTOR.kutlama(yuzde, a, b, moral); else window.USTAD_MOTOR.kutlama(yuzde, a, b); } catch (e) { alert(a + " — " + b); } }

  /* ─────────── 1) AKILLI TEKRAR kaydı ─────────── */
  function tekrarKaydet(s, dogruMu) {
    var t = D.al("koc.tekrar", {});
    var id = soruKimlik(s);
    var kayit = t[id] || { kutu: 0, ders: s.ders, konu: s.konu, ilk: bugun(), soru: s.soru };
    kayit.kutu = dogruMu ? Math.min(5, (kayit.kutu || 0) + 1) : 1;
    kayit.son = bugun();
    kayit.gosterim = (kayit.gosterim || 0) + 1;
    kayit.dogru = (kayit.dogru || 0) + (dogruMu ? 1 : 0);
    t[id] = kayit;
    D.koy("koc.tekrar", t);
    return kayit;
  }
  function tekrarVadesiGelenler(hepsi) {
    var t = D.al("koc.tekrar", {}), b = banka(), su = bugun();
    function bul(id) {
      return b.filter(function (s) { return soruKimlik(s) === id; })[0];
    }
    var d = [];
    Object.keys(t).forEach(function (id) {
      var k = t[id], aralik = KUTU_GUN[Math.min(5, k.kutu || 1)];
      if (hepsi || !k.son || gunFark(k.son, su) >= aralik) { var s = bul(id); if (s) d.push(s); }
    });
    return d;
  }
  function tekrarOzet() {
    var t = D.al("koc.tekrar", {}), su = bugun(), vade = 0, ogrenilen = 0, bekleyen = 0;
    Object.keys(t).forEach(function (id) {
      var k = t[id];
      if ((k.kutu || 0) >= 5) ogrenilen++;
      else if (!k.son || gunFark(k.son, su) >= KUTU_GUN[Math.min(5, k.kutu || 1)]) vade++;
      else bekleyen++;
    });
    return { toplam: Object.keys(t).length, vade: vade, ogrenilen: ogrenilen, bekleyen: bekleyen };
  }

  /* ─────────── 2) KONU HARİTASI ─────────── */
  function konuHaritasi() {
    var yk = D.al("yanlisKonu", {});
    var kk = D.al("koc.konu", {});   /* kendi testlerimdeki konu sayaçları {ders|konu: {d,y}} */
    var harita = {};
    Object.keys(yk).forEach(function (k) {
      var p = k.split("|");
      var ad = (p[1] || "?") + " · " + (p[0] || "?");
      harita[ad] = harita[ad] || { ders: p[1], konu: p[0], yanlis: 0, dogru: 0 };
      harita[ad].yanlis += yk[k];
    });
    Object.keys(kk).forEach(function (k) {
      var p = k.split("|");
      var ad = (p[1] || "?") + " · " + (p[0] || "?");
      harita[ad] = harita[ad] || { ders: p[1], konu: p[0], yanlis: 0, dogru: 0 };
      harita[ad].dogru += kk[k].d || 0; harita[ad].yanlis += kk[k].y || 0;
    });
    var liste = Object.keys(harita).map(function (a) { return harita[a]; });
    liste.forEach(function (x) { x.toplam = x.dogru + x.yanlis; x.oran = x.toplam ? Math.round((x.yanlis / x.toplam) * 100) : 0; });
    liste.sort(function (a, b) { return b.oran - a.oran || b.yanlis - a.yanlis; });
    return liste;
  }
  function konuTesti(ders, konu, adet) {
    var s = banka().filter(function (x) { return x.ders === ders && x.konu === konu; });
    if (!s.length) { alert("Bu konuda soru bulunamadı: " + konu); return; }
    testBasla(karistir(s).slice(0, adet || 20), ders + " · " + konu);
  }

  /* ─────────── 6) GERİ SAYIM + SERİ ─────────── */
  function kalanGun() {
    var t = D.al("koc.sinavTarihi", null);
    if (!t) return null;
    return gunFark(bugun(), t);
  }
  function seriIsle() {
    var sr = D.al("koc.seri", { son: null, gun: 0, en: 0, toplam: 0 });
    var b = bugun();
    if (sr.son === b) { sr.toplam++; D.koy("koc.seri", sr); return sr; }
    sr.gun = (sr.son && gunFark(sr.son, b) === 1) ? sr.gun + 1 : 1;
    sr.son = b; sr.toplam = (sr.toplam || 0) + 1;
    if (sr.gun > (sr.en || 0)) sr.en = sr.gun;
    D.koy("koc.seri", sr);
    if (sr.gun === 3 || sr.gun === 7 || sr.gun === 30) konus(sr.gun + " gün üst üste çalıştın. Harikasın, böyle devam!");
    return sr;
  }

  /* ─────────── 7) SEVİYE + ROZETLER ─────────── */
  function puan() {
    var k = D.al("koc.puan", { dogru: 0, test: 0 });
    var ist = D.al("ist", { dogru: 0 });
    return { dogru: (ist.dogru || 0) + (k.dogru || 0), test: (k.test || 0) };
  }
  function seviyeBilgi() {
    var p = puan().dogru, i = 0;
    while (i + 1 < SEVIYELER.length && p >= SEVIYELER[i + 1]) i++;
    var alt = SEVIYELER[i], ust = SEVIYELER[i + 1] || (SEVIYELER[i] + 500);
    return { no: i + 1, ad: SEVIYE_AD[i], dogru: p, alt: alt, ust: ust,
             yuzde: Math.max(0, Math.min(100, Math.round(((p - alt) / (ust - alt)) * 100))) };
  }
  var ROZETLER = [
    { k: "ilk", ad: "İlk Adım", simg: "🎯", kosul: function (s) { return s.test >= 1; } },
    { k: "on", ad: "On Test", simg: "🔟", kosul: function (s) { return s.test >= 10; } },
    { k: "yuz", ad: "Yüz Doğru", simg: "💯", kosul: function (s) { return s.dogru >= 100; } },
    { k: "besyuz", ad: "Beş Yüz Doğru", simg: "🏅", kosul: function (s) { return s.dogru >= 500; } },
    { k: "seri7", ad: "7 Gün Seri", simg: "🔥", kosul: function () { return (D.al("koc.seri", {}).gun || 0) >= 7; } },
    { k: "seri30", ad: "30 Gün Seri", simg: "🌟", kosul: function () { return (D.al("koc.seri", {}).gun || 0) >= 30; } },
    { k: "usta", ad: "Tekrar Ustası", simg: "🧠", kosul: function () { return tekrarOzet().ogrenilen >= 20; } },
    { k: "deneme", ad: "Deneme Sınavı", simg: "📝", kosul: function () { return (D.al("koc.deneme", {}).girisim || 0) >= 1; } },
    { k: "karne", ad: "Karne Sahibi", simg: "🎓", kosul: function () { return (puan().dogru || 0) >= 50; } }
  ];
  function rozetDurum() {
    var s = puan(), kazanilan = D.al("koc.rozet", []);
    return ROZETLER.map(function (r) {
      var var_mi = kazanilan.indexOf(r.k) >= 0 || r.kosul(s);
      if (var_mi && kazanilan.indexOf(r.k) < 0) { kazanilan.push(r.k); D.koy("koc.rozet", kazanilan); }
      return { k: r.k, ad: r.ad, simg: r.simg, var_mi: var_mi };
    });
  }

  /* ─────────── 10) YEDEKLE / GERİ YÜKLE ─────────── */
  function yedekAl() {
    var veri = {};
    for (var i = 0; i < localStorage.length; i++) {
      var a = localStorage.key(i);
      if (a && a.indexOf("ustad.") === 0) veri[a] = localStorage.getItem(a);
    }
    return { uygulama: "ÜSTAD KPSS-B KOÇ PRO", surum: "2.0", tarih: new Date().toISOString(), veri: veri };
  }
  function yedekMetni() {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(yedekAl())))); }
    catch (e) { return JSON.stringify(yedekAl()); }
  }
  function yedekYukle(metin) {
    try {
      var j = metin.trim().indexOf("{") === 0 ? JSON.parse(metin) : JSON.parse(decodeURIComponent(escape(atob(metin.trim()))));
      if (!j.veri) throw new Error("Biçim tanınmadı");
      var n = 0;
      Object.keys(j.veri).forEach(function (a) { try { localStorage.setItem(a, j.veri[a]); n++; } catch (e) {} });
      return n;
    } catch (e) { return -1; }
  }

  /* ─────────── 11) GÜNÜN SORUSU ─────────── */
  function gununSorusu() {
    var b = banka(); if (!b.length) return null;
    var d = new Date();
    var tohum = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return b[tohum % b.length];
  }

  /* ─────────── 12) USTA MODU ─────────── */
  function ustaSifre() { return D.al("koc.ustaSifre", "kenan1981"); }

  /* ─────────── 13) ÇOKLU PROFİL ─────────── */
  function profiller() { return D.al("koc.profiller", [{ ad: "Ben", no: 1 }]); }
  function aktifProfil() { return D.al("koc.aktifProfil", 1); }
  function profilDegistir(no, ad) {
    var eski = aktifProfil();
    if (eski === no) return;
    /* mevcut veriyi eski profilin kutusuna taşı */
    var kutu = {};
    for (var i = 0; i < localStorage.length; i++) {
      var a = localStorage.key(i);
      if (a && a.indexOf("ustad.") === 0 && a.indexOf("ustad.p") !== 0 && a.indexOf("ustad.koc.profiller") !== 0 && a.indexOf("ustad.koc.aktifProfil") !== 0) {
        kutu[a] = localStorage.getItem(a);
      }
    }
    D.koy("koc.profilVeri." + eski, kutu);
    /* seçili profilin verisini geri yükle */
    Object.keys(kutu).forEach(function (a) { localStorage.removeItem(a); });
    var yeni = D.al("koc.profilVeri." + no, {});
    Object.keys(yeni).forEach(function (a) { try { localStorage.setItem(a, yeni[a]); } catch (e) {} });
    D.koy("koc.aktifProfil", no);
    var pl = profiller();
    if (!pl.filter(function (p) { return p.no === no; }).length) { pl.push({ ad: ad || ("Profil " + no), no: no }); D.koy("koc.profiller", pl); }
  }

  /* ─────────── 14) YAZI BOYUTU + GECE MODU ─────────── */
  function yaziUygula() {
    var y = D.al("koc.yazi", "normal");
    var olcek = y === "buyuk" ? "118%" : y === "cokbuyuk" ? "134%" : y === "kucuk" ? "92%" : "100%";
    document.documentElement.style.fontSize = olcek;
  }
  function geceUygula() {
    var g = D.al("koc.gece", false);
    document.body.classList.toggle("gece-mod", !!g);
  }
  function ekranAyarlariUygula() { yaziUygula(); geceUygula(); }

  /* ─────────── 15) OPTİK FORM (yazdırılabilir) ─────────── */
  function optikFormYazdir(adet, baslik) {
    adet = adet || 120;
    var satir = "";
    for (var i = 1; i <= adet; i++) {
      satir += "<tr><td class='no'>" + i + "</td>";
      for (var j = 0; j < 4; j++) satir += "<td class='kut'>" + "ABCD".charAt(j) + "</td>";
      satir += "</tr>";
    }
    var pencere = window.open("", "_blank");
    var icerik = "<!DOCTYPE html><html lang='tr'><head><meta charset='utf-8'><title>ÜSTAD KOÇ PRO · Optik Form</title>" +
      "<style>body{font-family:system-ui,Segoe UI,Arial;margin:18px;color:#111}h1{font-size:17px;margin:0 0 2px}" +
      ".alt{font-size:11px;color:#555;margin-bottom:10px}.kunye{font-size:10px;color:#777;margin-top:10px;border-top:1px solid #999;padding-top:6px}" +
      "table{border-collapse:collapse;width:100%}td{border:1px solid #bbb;text-align:center;font-size:10px;padding:2px 0}" +
      "td.no{background:#eef3f7;font-weight:700;width:38px}td.kut{width:34px}" +
      ".imza{display:flex;gap:20px;margin-top:12px;font-size:11px}.imza div{flex:1;border-bottom:1px solid #999;height:34px}" +
      "@media print{@page{margin:10mm}}</style></head><body>" +
      "<h1>" + (baslik || "ÜSTAD KOÇ PRO · KPSS-B Deneme Sınavı · Optik Cevap Formu") + "</h1>" +
      "<div class='alt'>Ad Soyad: ______________________________  Tarih: ____ / ____ / ______  Süre: 130 dakika</div>" +
      "<table>" + satir + "</table>" +
      "<div class='imza'><div>Doğru ………</div><div>Yanlış ………</div><div>Boş ………</div><div>Puan ………</div></div>" +
      "<div class='kunye'>© 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Tüm hakları saklıdır. 5846 sayılı FSEK kapsamında korunur; izinsiz çoğaltılamaz.</div>" +
      "</body></html>";
    if (pencere) { pencere.document.write(icerik); pencere.document.close(); setTimeout(function () { try { pencere.print(); } catch (e) {} }, 400); }
    else { alert("Yazdırma penceresi açılamadı. Tarayıcıda deneyin."); }
  }

  /* ═══════════ TEST MOTORU (KOÇ PRO'nun kendi testi) ═══════════ */
  var ST = { sorular: [], cevap: [], i: 0, baslik: "", klasik: false, bolum: "" };

  function testBasla(sorular, baslik, seciliBolum) {
    if (!sorular || !sorular.length) { alert("Soru bulunamadı."); return; }
    ST.sorular = sorular; ST.cevap = []; ST.i = 0; ST.baslik = baslik || "KOÇ PRO Testi";
    ST.klasik = D.al("koc.klasik", false);
    ST.bolum = seciliBolum || "tekrar";
    testCiz();
  }

  function testCiz() {
    var eski = $(".koc-test"); if (eski) eski.parentNode.removeChild(eski);
    var s = ST.sorular[ST.i];
    if (!s) return;
    var secili = ST.cevap[ST.i];
    var cevaplandi = (secili !== undefined && secili !== null && secili !== "");
    var dogruMu = cevaplandi && (ST.klasik ? klasikDogruMu(secili, s) : secili === s.dogru);
    var hemen = D.al("aninda", true);

    var bant = "";
    if (cevaplandi && hemen) {
      bant = "<div class='cevap-bant " + (dogruMu ? "iyi" : "kotu") + "'>" +
        "<div class='bant-simge'>" + (dogruMu ? "✔" : "✘") + "</div>" +
        "<div class='bant-metin'><b>" + (dogruMu ? "Doğru cevap verdiniz." : "Yanlış cevap.") + "</b>" +
        "<span>" + (dogruMu ? (s.aciklama || "") : "Doğru cevap: " + "ABCD".charAt(s.dogru) + ") " + (s.secenekler[s.dogru] || "")) + "</span></div>" +
        "<button class='bant-dugme' data-sonraki='1'>" + (ST.i + 1 < ST.sorular.length ? "Sonraki Soru →" : "Bitir ✓") + "</button>" +
        "</div>";
    }

    var govde;
    if (ST.klasik) {
      govde = "<textarea class='koc-yazi' id='kocCevap' placeholder='Cevabını buraya yaz…' " + (cevaplandi ? "readonly" : "") + ">" +
        (cevaplandi ? String(secili).replace(/</g, "&lt;") : "") + "</textarea>" +
        (cevaplandi
          ? "<div class='koc-karsilastir'><b>" + (dogruMu ? "Cevabın doğru görünüyor ✔" : "Karşılaştırma") + "</b>" +
            "<p>Senin cevabın: " + String(secili).replace(/</g, "&lt;") + "</p>" +
            "<p>Beklenen cevap: <b>" + (s.secenekler[s.dogru] || "") + "</b></p>" +
            "<p class='aciklama'>Benzerlik: %" + benzerlik(secili, s.secenekler[s.dogru] || "") + " · " + (s.aciklama || "") + "</p></div>"
          : "<div class='soru-alt'><button class='buyuk-dugme' data-karsilastir='1'>Karşılaştır ✓</button></div>");
    } else {
      govde = "<div class='koc-secenekler'>" + s.secenekler.map(function (o, j) {
        var sinif = "";
        if (cevaplandi && hemen) {
          if (j === s.dogru) sinif = "dogru";
          else if (j === secili) sinif = "yanlis";
        } else if (cevaplandi && j === secili) sinif = "isaretli";
        return "<button class='koc-secenek " + sinif + "' data-sec='" + j + "' " + (cevaplandi ? "disabled" : "") + ">" +
          "<b>" + "ABCD".charAt(j) + ")</b><span>" + o + "</span></button>";
      }).join("") + "</div>";
    }

    var kap = document.createElement("div");
    kap.className = "modul koc-test";
    kap.innerHTML = "<div class='modul-ic'><div class='soru-kutu'>" + bant +
      "<div class='koc-ust'><span class='koc-etiket'>" + (ST.baslik) + "</span>" +
      "<span class='koc-sayac'>Soru " + (ST.i + 1) + " / " + ST.sorular.length + "</span></div>" +
      "<div class='koc-kunye'><span class='cip'>" + s.ders + "</span><span class='cip'>" + s.konu + "</span>" +
      "<span class='cip'>" + (s.zorluk || "Orta") + "</span></div>" +
      (s.metin ? "<p class='koc-metin'>" + s.metin + "</p>" : "") +
      "<h3 class='koc-soru'>" + s.soru + "</h3>" + govde +
      "<div class='soru-alt'>" +
        "<button class='ikincil-dugme' data-kapat='1'>Kapat</button>" +
        "<button class='ikincil-dugme' data-dinle='1'>🔊 Soruyu dinle</button>" +
        "<button class='ikincil-dugme' data-klasik='1'>" + (ST.klasik ? "Şıklı moda geç" : "✍️ Yazılı moda geç") + "</button>" +
      "</div></div></div>";
    document.body.appendChild(kap);

    kap.querySelector("[data-kapat]").addEventListener("click", function () { kap.parentNode.removeChild(kap); });
    kap.querySelector("[data-dinle]").addEventListener("click", function () {
      konus(s.soru + ". Seçenekler: " + s.secenekler.map(function (o, j) { return "ABCD".charAt(j) + ", " + o; }).join(". "));
    });
    kap.querySelector("[data-klasik]").addEventListener("click", function () {
      ST.klasik = !ST.klasik; D.koy("koc.klasik", ST.klasik); testCiz();
    });
    var sn = kap.querySelector("[data-sonraki]");
    if (sn) sn.addEventListener("click", function () { sonrakiSoru(); });
    var ks = kap.querySelector("[data-karsilastir]");
    if (ks) ks.addEventListener("click", function () {
      var v = ($("#kocCevap") || {}).value || "";
      if (!v.trim()) { alert("Önce cevabını yaz."); return; }
      ST.cevap[ST.i] = v; testCiz();
    });
    kap.querySelectorAll("[data-sec]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (ST.cevap[ST.i] !== undefined && ST.cevap[ST.i] !== null) return;
        var j = Number(b.getAttribute("data-sec"));
        ST.cevap[ST.i] = j;
        var s2 = ST.sorular[ST.i];
        tekrarKaydet(s2, j === s2.dogru);
        konuSayac(s2, j === s2.dogru);
        titret(j === s2.dogru ? 20 : 40);
        if (!D.al("aninda", true)) sonrakiSoru(); else testCiz();
      });
    });
  }

  function sonrakiSoru() {
    var s = ST.sorular[ST.i];
    if (s && (ST.cevap[ST.i] === undefined || ST.cevap[ST.i] === null)) { ST.cevap[ST.i] = null; }
    if (ST.i + 1 < ST.sorular.length) { ST.i++; testCiz(); } else testBitir();
  }

  function benzerlik(a, b) {
    var norm = function (t) { return String(t).toLocaleLowerCase("tr-TR").replace(/[^\wçğıöşü ]/g, " ").split(/\s+/).filter(function (x) { return x.length > 2; }); };
    var A = norm(a), B = norm(b);
    if (!A.length || !B.length) return 0;
    var ortak = A.filter(function (x) { return B.indexOf(x) >= 0; }).length;
    return Math.round((ortak / Math.max(A.length, B.length)) * 100);
  }
  function klasikDogruMu(cevap, s) { return benzerlik(cevap, s.secenekler[s.dogru] || "") >= 50; }
  function konuSayac(s, dogruMu) {
    var kk = D.al("koc.konu", {});
    var a = s.konu + "|" + s.ders;
    kk[a] = kk[a] || { d: 0, y: 0 };
    if (dogruMu) kk[a].d++; else kk[a].y++;
    D.koy("koc.konu", kk);
  }

  function testBitir() {
    var eski = $(".koc-test"); if (eski) eski.parentNode.removeChild(eski);
    var dogru = 0, yanlis = 0, bos = 0;
    ST.sorular.forEach(function (s, j) {
      var c = ST.cevap[j];
      if (c === undefined || c === null || c === "") { bos++; return; }
      var ok = ST.klasik ? klasikDogruMu(c, s) : c === s.dogru;
      if (ok) dogru++; else {
        yanlis++;
        var yk = D.al("yanlisKonu", {}); yk[s.konu + "|" + s.ders] = (yk[s.konu + "|" + s.ders] || 0) + 1; D.koy("yanlisKonu", yk);
      }
    });
    var ist = D.al("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 });
    ist.cozulen += ST.sorular.length; ist.dogru += dogru; ist.yanlis += yanlis; ist.bos += bos;
    D.koy("ist", ist);
    if (ST.bolum === "deneme") { var dn = D.al("koc.deneme", { girisim: 0 }); dn.girisim++; D.koy("koc.deneme", dn); }
    var kp = D.al("koc.puan", { dogru: 0, test: 0 });
    kp.dogru += dogru; kp.test++;
    D.koy("koc.puan", kp);
    var seri = seriIsle();
    var yeniRozet = rozetDurum().filter(function (r) { return r.var_mi; });

    var yuzde = Math.round((dogru / ST.sorular.length) * 100);
    var kap = document.createElement("div");
    kap.className = "modul koc-test";
    var sv = seviyeBilgi();
    kap.innerHTML = "<div class='modul-ic'><div class='soru-kutu'>" +
      "<h3 style='margin:0 0 12px'>" + ST.baslik + " bitti</h3>" +
      "<div class='deneme-bilgi'>" +
        "<div class='bilgi-kutu'><b>" + dogru + "</b><span>Doğru</span></div>" +
        "<div class='bilgi-kutu'><b>" + yanlis + "</b><span>Yanlış</span></div>" +
        "<div class='bilgi-kutu'><b>" + bos + "</b><span>Boş</span></div>" +
      "</div>" +
      "<div class='koc-ozet-satir'><span>Başarı</span><b>%" + yuzde + "</b></div>" +
      "<div class='koc-ozet-satir'><span>Çalışma serisi</span><b>🔥 " + seri.gun + " gün (en iyi " + (seri.en || seri.gun) + ")</b></div>" +
      "<div class='koc-ozet-satir'><span>Seviye</span><b>" + sv.no + " · " + sv.ad + " (" + sv.dogru + " doğru)</b></div>" +
      "<div class='koc-ozet-satir'><span>Kazanılan rozet</span><b>" + yeniRozet.length + " / " + ROZETLER.length + "</b></div>" +
      "<div class='soru-alt'>" +
        "<button class='ikincil-dugme' data-kapat='1'>Kapat</button>" +
        "<button class='ikincil-dugme' data-tekrar='1'>🔁 Vadesi gelenleri tekrar et</button>" +
        "<button class='ikincil-dugme' data-harita='1'>🧭 Konu haritası</button>" +
      "</div></div></div>";
    document.body.appendChild(kap);
    kap.querySelector("[data-kapat]").addEventListener("click", function () { kap.parentNode.removeChild(kap); kocCiz(); });
    kap.querySelector("[data-tekrar]").addEventListener("click", function () {
      kap.parentNode.removeChild(kap);
      var v = tekrarVadesiGelenler(false);
      if (!v.length) { alert("Şu an vadesi gelen tekrar yok. Yarın tekrar bak — aralıklı tekrar böyle çalışır."); kocCiz(); return; }
      testBasla(v.slice(0, 20), "Akıllı Tekrar", "tekrar");
    });
    kap.querySelector("[data-harita]").addEventListener("click", function () { kap.parentNode.removeChild(kap); haritaPaneli(); });
    kutla(yuzde, ST.baslik, dogru + " doğru · " + yanlis + " yanlış");
  }

  /* ═══════════ PANELLER (modal) ═══════════ */
  function panel(baslik, govde, genislikSinif) {
    var eski = $(".koc-panel"); if (eski) eski.parentNode.removeChild(eski);
    var kap = document.createElement("div");
    kap.className = "modul koc-panel " + (genislikSinif || "");
    kap.innerHTML = "<div class='modul-ic'><div class='soru-kutu'><h3 class='koc-panel-baslik'>" + baslik + "</h3>" + govde +
      "<div class='soru-alt'><button class='ikincil-dugme' data-kapat='1'>Kapat</button></div></div></div>";
    document.body.appendChild(kap);
    kap.querySelector("[data-kapat]").addEventListener("click", function () { kap.parentNode.removeChild(kap); });
    return kap;
  }

  function panelKapat() { var p = $(".koc-panel"); if (p) p.parentNode.removeChild(p); }

  function haritaPaneli() {
    var h = konuHaritasi();
    if (!h.length) { panel("🧭 Konu Haritası", "<p class='aciklama'>Henüz veri yok. Test çözdükçe hangi konuda kaç yanlışın olduğu burada ısı haritası olur.</p>"); return; }
    var govde = "<p class='aciklama'>Yanlış oranı yüksek konular üstte. “Çalış” düğmesi o konudan 20 soruluk test kurar.</p><div class='koc-liste'>" +
      h.map(function (x) {
        var sinif = x.oran >= 50 ? "cok" : x.oran >= 25 ? "orta" : "az";
        return "<div class='koc-harita-satir " + sinif + "'>" +
          "<span class='koc-harita-ad'><b>" + x.konu + "</b><i>" + x.ders + " · " + x.dogru + " doğru / " + x.yanlis + " yanlış</i></span>" +
          "<span class='koc-isitma'><i style='width:" + Math.max(6, x.oran) + "%'></i></span>" +
          "<b class='koc-oran'>%" + x.oran + "</b>" +
          "<button class='ikincil-dugme' data-konu=\"" + x.konu + "\" data-ders=\"" + x.ders + "\">Çalış</button>" +
        "</div>";
      }).join("") + "</div>";
    var k = panel("🧭 Konu Haritası", govde, "geniş");
    k.querySelectorAll("[data-konu]").forEach(function (b) {
      b.addEventListener("click", function () {
        panelKapat();
        konuTesti(b.getAttribute("data-ders"), b.getAttribute("data-konu"), 20);
      });
    });
  }

  function rozetPaneli() {
    var r = rozetDurum(), sv = seviyeBilgi();
    var govde = "<div class='koc-seviye'><div class='koc-seviye-ust'><b>Seviye " + sv.no + " · " + sv.ad + "</b><span>" + sv.dogru + " doğru</span></div>" +
      "<div class='koc-cubuk'><i style='width:" + sv.yuzde + "%'></i></div>" +
      "<p class='aciklama'>Sonraki seviye (" + (sv.no + 1) + "): " + sv.ust + " doğru · kaldı " + Math.max(0, sv.ust - sv.dogru) + "</p></div>" +
      "<div class='koc-rozetler'>" + r.map(function (x) {
        return "<div class='koc-rozet " + (x.var_mi ? "var" : "yok") + "'><span>" + x.simg + "</span><b>" + x.ad + "</b></div>";
      }).join("") + "</div>";
    panel("🏅 Rozetler ve Seviye", govde, "geniş");
  }

  function karnePaneli() {
    var ist = D.al("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 });
    var h = konuHaritasi(), sv = seviyeBilgi(), t = tekrarOzet(), seri = D.al("koc.seri", {});
    var dersler = {};
    h.forEach(function (x) { dersler[x.ders] = dersler[x.ders] || { d: 0, y: 0 }; dersler[x.ders].d += x.dogru; dersler[x.ders].y += x.yanlis; });
    var satirlar = Object.keys(dersler).map(function (d) {
      var t2 = dersler[d].d + dersler[d].y, o = t2 ? Math.round((dersler[d].d / t2) * 100) : 0;
      return "<tr><td>" + d + "</td><td>" + dersler[d].d + "</td><td>" + dersler[d].y + "</td><td><b>%" + o + "</b></td></tr>";
    }).join("");
    var ad = D.al("isim", "") || "Öğrenci";
    var govde =
      "<div class='koc-karne' id='kocKarne'>" +
        "<div class='koc-karne-ust'><b>ÜSTAD KOÇ PRO · KARNESİ</b><span>" + ad + " · " + new Date().toLocaleDateString("tr-TR") + "</span></div>" +
        "<div class='koc-karne-kutular'>" +
          "<div><b>" + ist.cozulen + "</b><span>Çözülen Soru</span></div>" +
          "<div><b>" + ist.dogru + "</b><span>Doğru</span></div>" +
          "<div><b>" + ist.yanlis + "</b><span>Yanlış</span></div>" +
          "<div><b>%" + (ist.cozulen ? Math.round((ist.dogru / ist.cozulen) * 100) : 0) + "</b><span>Başarı</span></div>" +
        "</div>" +
        "<table class='koc-tablo'><thead><tr><th>Ders</th><th>Doğru</th><th>Yanlış</th><th>Başarı</th></tr></thead><tbody>" +
          (satirlar || "<tr><td colspan='4'>Henüz veri yok</td></tr>") + "</tbody></table>" +
        "<div class='koc-karne-alt'><b>Seviye " + sv.no + " · " + sv.ad + "</b> · " + sv.dogru + " doğru · " +
          "🔥 " + (seri.gun || 0) + " gün seri · Akıllı tekrarda öğrenilen " + t.ogrenilen + " soru</div>" +
        "<div class='koc-karne-imza'>© 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Tüm hakları saklıdır.</div>" +
      "</div>" +
      "<div class='soru-alt'><button class='ikincil-dugme' data-yazdir='1'>🖨 Yazdır / PDF olarak kaydet</button>" +
      "<button class='ikincil-dugme' data-paylas='1'>📤 Özeti kopyala</button></div>";
    var k = panel("🎓 Karne ve Sertifika", govde, "geniş");
    k.querySelector("[data-yazdir]").addEventListener("click", function () {
      var karne = $("#kocKarne").innerHTML;
      var p = window.open("", "_blank");
      var ic = "<!DOCTYPE html><html lang='tr'><head><meta charset='utf-8'><title>ÜSTAD KOÇ PRO · Karne</title>" +
        "<style>body{font-family:system-ui,Segoe UI,Arial;margin:24px;color:#122}.koc-karne-ust{display:flex;justify-content:space-between;font-size:18px;font-weight:800;color:#0b5570;border-bottom:3px solid #0f6f92;padding-bottom:8px}" +
        ".koc-karne-kutular{display:flex;gap:12px;margin:14px 0}.koc-karne-kutular>div{flex:1;border:1px solid #cfd8e0;border-radius:10px;padding:10px;text-align:center}" +
        ".koc-karne-kutular b{display:block;font-size:22px;color:#0f6f92}.koc-karne-kutular span{font-size:11px;color:#556}" +
        "table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #cfd8e0;padding:6px;font-size:12px;text-align:center}th{background:#eef3f7}" +
        ".koc-karne-alt{margin-top:14px;font-size:13px}.koc-karne-imza{margin-top:10px;font-size:10px;color:#667;border-top:1px solid #cfd8e0;padding-top:6px}</style></head><body>" +
        karne + "</body></html>";
      if (p) { p.document.write(ic); p.document.close(); setTimeout(function () { try { p.print(); } catch (e) {} }, 400); }
    });
    k.querySelector("[data-paylas]").addEventListener("click", function () {
      var ozet = "ÜSTAD KOÇ PRO Karnem · " + ad + "\nÇözülen: " + ist.cozulen + " · Doğru: " + ist.dogru +
        " · Yanlış: " + ist.yanlis + " · Başarı: %" + (ist.cozulen ? Math.round((ist.dogru / ist.cozulen) * 100) : 0) +
        "\nSeviye " + sv.no + " · " + sv.ad + " · 🔥 " + (seri.gun || 0) + " gün seri";
      try { navigator.clipboard.writeText(ozet); alert("Özet kopyalandı:\n\n" + ozet); } catch (e) { alert(ozet); }
    });
  }

  function kaygiPaneli() {
    var sozler = [
      "Bugün attığın adım, yarınki başarının temelidir.",
      "Zor olan başlamaktır; sen başladın.",
      "Her yanlış, doğruya bir adım daha yaklaştırır.",
      "Sabreden derviş, muradına ermiş.",
      "Kalem kırılır, azim kırılmaz.",
      "Sınav bilgiyi ölçer; sen azmini göster.",
      "Bir gün değil, her gün: işte formül bu."
    ];
    var govde =
      "<p class='aciklama'>Nefes egzersizi: 4 saniye al, 7 saniye tut, 8 saniye ver. Daire büyüyüp küçülürken nefesini ona uydur.</p>" +
      "<div class='koc-nefes'><div class='koc-nefes-daire' id='kocNefes'></div><b id='kocNefesYazi'>Başlat</b></div>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-basla='1'>Nefes egzersizini başlat</button></div>" +
      "<div class='koc-soz'><b>“" + sozler[Math.floor(Math.random() * sozler.length)] + "”</b><span>Kenan Kuzucu · ÜSTAD KOÇ PRO</span></div>";
    var k = panel("🌿 Sınav Kaygısı Modülü", govde, "geniş");
    var zaman = null;
    k.querySelector("[data-basla]").addEventListener("click", function () {
      var d = $("#kocNefes"), y = $("#kocNefesYazi"), tur = 0;
      if (zaman) { clearInterval(zaman); zaman = null; }
      function faz(ad, sn, buyu) {
        y.textContent = ad + " · " + sn + " sn";
        d.style.transition = "transform " + sn + "s ease-in-out";
        d.style.transform = "scale(" + buyu + ")";
      }
      faz("Al", 4, 1.35);
      konus("Nefes al.");
      zaman = setInterval(function () {
        tur++;
        if (tur % 3 === 1) { faz("Tut", 7, 1.35); konus("Tut."); }
        else if (tur % 3 === 2) { faz("Ver", 8, 0.7); konus("Ver."); }
        else { faz("Al", 4, 1.35); konus("Nefes al."); }
        if (tur >= 9) { clearInterval(zaman); zaman = null; y.textContent = "Bitti · kendini iyi hisset"; d.style.transform = "scale(1)"; konus("Tebrikler. Şimdi devam edebilirsin."); }
      }, 8000);
    });
  }

  function yedekPaneli() {
    var govde =
      "<p class='aciklama'>Yedek kodu; tüm ilerlemeni (çözülen sorular, tekrar kutusu, seri, rozetler, kendi soruların, ayarların) içerir. " +
      "Kodu bir yere kaydet; yeni telefonda “Yedekten geri yükle” ile aynen devam edersin.</p>" +
      "<textarea class='koc-yazi' id='kocYedekKutu' placeholder='Yedek kodunu buraya yapıştır…'></textarea>" +
      "<div class='soru-alt'>" +
        "<button class='buyuk-dugme' data-al='1'>📦 Yedek kodumu oluştur</button>" +
        "<button class='ikincil-dugme' data-indir='1'>⬇ Dosya olarak indir</button>" +
        "<button class='ikincil-dugme' data-yukle='1'>♻ Yedekten geri yükle</button>" +
        "<button class='ikincil-dugme' data-dosya='1'>📂 Dosyadan yükle</button>" +
      "</div><input type='file' id='kocYedekDosya' accept='.txt,.json,.koc' style='display:none'>";
    var k = panel("📦 Yedekle ve Geri Yükle", govde, "geniş");
    k.querySelector("[data-al]").addEventListener("click", function () {
      var kod = yedekMetni();
      $("#kocYedekKutu").value = kod;
      try { navigator.clipboard.writeText(kod); alert("Yedek kodu oluşturuldu ve panoya kopyalandı (" + kod.length + " karakter)."); }
      catch (e) { alert("Yedek kodu oluşturuldu. Kutudan kopyalayabilirsin."); }
    });
    k.querySelector("[data-indir]").addEventListener("click", function () {
      var kod = yedekMetni();
      var ad = "ustad-koc-pro-yedek-" + bugun() + ".txt";
      try {
        var b = new Blob([kod], { type: "text/plain" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(b); a.download = ad; document.body.appendChild(a); a.click();
        setTimeout(function () { document.body.removeChild(a); }, 500);
        alert("Yedek dosyası indirildi: " + ad);
      } catch (e) { alert("Dosya indirilemedi; yedek kodunu kopyalayıp bir yere kaydet."); }
    });
    k.querySelector("[data-yukle]").addEventListener("click", function () {
      var v = $("#kocYedekKutu").value;
      if (!v.trim()) { alert("Önce yedek kodunu yapıştır ya da dosyadan yükle."); return; }
      var n = yedekYukle(v);
      if (n < 0) { alert("Yedek kodu okunamadı. Kodu eksiksiz kopyaladığından emin ol."); return; }
      alert(n + " kayıt geri yüklendi. Uygulama yenilenecek.");
      location.reload();
    });
    k.querySelector("[data-dosya]").addEventListener("click", function () { $("#kocYedekDosya").click(); });
    k.querySelector("#kocYedekDosya").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var n = yedekYukle(String(r.result));
        alert(n < 0 ? "Dosya okunamadı ya da biçim tanınmadı." : n + " kayıt geri yüklendi.");
        if (n >= 0) location.reload();
      };
      r.readAsText(f);
    });
  }

  function ustaPaneli() {
    var govde = "<p class='aciklama'>Bu bölüm şifreyle korunur: soru ekleme, istatistik sıfırlama, profiller ve tüm ayarlar.</p>" +
      "<input type='password' class='koc-girdi' id='kocUstaSifre' placeholder='Usta şifresi'>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-gir='1'>Gir</button></div>";
    var k = panel("🔐 Usta Modu", govde);
    k.querySelector("[data-gir]").addEventListener("click", function () {
      if ($("#kocUstaSifre").value !== ustaSifre()) { alert("Şifre yanlış."); return; }
      panelKapat(); ustaEkrani();
    });
  }

  function ustaEkrani() {
    var ist = D.al("ist", {});
    var govde =
      "<div class='koc-liste'>" +
        "<button class='koc-buyuk-satir' data-islem='soru'>➕ Kendi sorumu ekle<span>Kendi sorularını testlere kat</span></button>" +
        "<button class='koc-buyuk-satir' data-islem='profil'>👥 Profiller<span>Çoklu profil yönetimi</span></button>" +
        "<button class='koc-buyuk-satir' data-islem='tarih'>📅 Sınav tarihi<span>Geri sayımı ayarla</span></button>" +
        "<button class='koc-buyuk-satir' data-islem='sifirla'>🧹 İstatistiği sıfırla<span>Çözülen: " + (ist.cozulen || 0) + "</span></button>" +
        "<button class='koc-buyuk-satir' data-islem='temizle'>🗑 Tüm verileri sil<span>Fabrika ayarına döner</span></button>" +
        "<button class='koc-buyuk-satir' data-islem='optik'>🖨 Optik form<span>Yazdırılabilir cevap formu</span></button>" +
      "</div>";
    var k = panel("🔐 Usta Modu · Yönetim", govde, "geniş");
    k.querySelectorAll("[data-islem]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = b.getAttribute("data-islem");
        if (i === "soru") { panelKapat(); kendiSoruPaneli(); }
        else if (i === "profil") { panelKapat(); profilPaneli(); }
        else if (i === "tarih") { panelKapat(); tarihPaneli(); }
        else if (i === "sifirla") { if (confirm("İstatistik ve kayıtlar sıfırlanacak. Emin misin?")) { D.koy("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 }); D.koy("yanlisKonu", {}); D.koy("koc.puan", { dogru: 0, test: 0 }); panelKapat(); kocCiz(); } }
        else if (i === "temizle") { if (confirm("TÜM veriler silinecek (kendi soruların dahil). Emin misin?")) { var a = []; for (var x = 0; x < localStorage.length; x++) { var an = localStorage.key(x); if (an && an.indexOf("ustad.") === 0) a.push(an); } a.forEach(function (an) { localStorage.removeItem(an); }); location.reload(); } }
        else if (i === "optik") { panelKapat(); optikPaneli(); }
      });
    });
  }

  function tarihPaneli() {
    var t = D.al("koc.sinavTarihi", "");
    var govde = "<p class='aciklama'>Sınav tarihini seç; ana sayfada kalan gün sayacı işlesin.</p>" +
      "<input type='date' class='koc-girdi' id='kocTarih' value='" + (t || "") + "'>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-kaydet='1'>Kaydet</button>" +
      "<button class='ikincil-dugme' data-sil='1'>Temizle</button></div>";
    var k = panel("📅 Sınav Tarihi", govde);
    k.querySelector("[data-kaydet]").addEventListener("click", function () {
      var v = $("#kocTarih").value;
      if (!v) { alert("Bir tarih seç."); return; }
      D.koy("koc.sinavTarihi", v); panelKapat(); kocCiz();
    });
    k.querySelector("[data-sil]").addEventListener("click", function () { D.sil("koc.sinavTarihi"); panelKapat(); kocCiz(); });
  }

  function profilPaneli() {
    var pl = profiller(), ak = aktifProfil();
    var govde = "<p class='aciklama'>Aynı telefonda birden fazla kişi kendi ilerlemesini ayrı tutar. Profil değiştirince veriler yer değiştirir.</p>" +
      "<div class='koc-liste'>" + pl.map(function (p) {
        return "<button class='koc-buyuk-satir" + (p.no === ak ? " secili" : "") + "' data-profil='" + p.no + "'>" +
          (p.no === ak ? "✔ " : "") + p.ad + "<span>Profil " + p.no + (p.no === ak ? " · aktif" : "") + "</span></button>";
      }).join("") + "</div>" +
      "<div class='soru-alt'><input class='koc-girdi' id='kocYeniProfil' placeholder='Yeni profil adı'>" +
      "<button class='ikincil-dugme' data-yeni='1'>➕ Profil ekle ve geç</button></div>";
    var k = panel("👥 Profiller", govde, "geniş");
    k.querySelectorAll("[data-profil]").forEach(function (b) {
      b.addEventListener("click", function () {
        var no = Number(b.getAttribute("data-profil"));
        if (no === aktifProfil()) { panelKapat(); return; }
        if (!confirm("Profil değiştirilecek. Mevcut ilerleme bu profilin kutusuna kaydedilir, seçilen profilin verisi yüklenir. Devam?")) return;
        profilDegistir(no);
        panelKapat(); location.reload();
      });
    });
    k.querySelector("[data-yeni]").addEventListener("click", function () {
      var ad = $("#kocYeniProfil").value.trim(); if (!ad) { alert("Profil adı yaz."); return; }
      var pl2 = profiller(), yeniNo = Math.max.apply(null, pl2.map(function (p) { return p.no; })) + 1;
      pl2.push({ ad: ad, no: yeniNo }); D.koy("koc.profiller", pl2);
      if (!confirm("“" + ad + "” profili oluşturuldu ve ona geçilecek. Devam?")) return;
      profilDegistir(yeniNo, ad);
      location.reload();
    });
  }

  function kendiSoruPaneli() {
    var mevcut = D.al("koc.sorular", []).length;
    var dersler = (window.USTAD_PAKET && window.USTAD_PAKET.dersler || []).map(function (d) { return d.ad; });
    var govde =
      "<p class='aciklama'>Kendi sorunu ekle; “Kendi Sorularım” testinde ve akıllı tekrarda kullanılır. Şu an " + mevcut + " kendi sorun var.</p>" +
      "<select class='koc-girdi' id='kocSDers'>" + dersler.map(function (d) { return "<option>" + d + "</option>"; }).join("") + "</select>" +
      "<input class='koc-girdi' id='kocSKonu' placeholder='Konu (ör. Paragraf)'>" +
      "<textarea class='koc-yazi' id='kocSSoru' placeholder='Soru metni'></textarea>" +
      "<input class='koc-girdi' id='kocSA' placeholder='A şıkkı'><input class='koc-girdi' id='kocSB' placeholder='B şıkkı'>" +
      "<input class='koc-girdi' id='kocSC' placeholder='C şıkkı'><input class='koc-girdi' id='kocSD' placeholder='D şıkkı'>" +
      "<select class='koc-girdi' id='kocSDogru'><option value='0'>Doğru: A</option><option value='1'>Doğru: B</option><option value='2'>Doğru: C</option><option value='3'>Doğru: D</option></select>" +
      "<input class='koc-girdi' id='kocSAcik' placeholder='Açıklama (isteğe bağlı)'>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-ekle='1'>💾 Soruyu kaydet</button>" +
      "<button class='ikincil-dugme' data-test='1'>▶ Kendi sorularımla test çöz</button>" +
      "<button class='ikincil-dugme' data-liste='1'>📋 Sorularımı listele</button></div>";
    var k = panel("➕ Kendi Sorularım", govde, "geniş");
    k.querySelector("[data-ekle]").addEventListener("click", function () {
      var d = $("#kocSDers").value, konu = $("#kocSKonu").value.trim() || "Kendi Konum";
      var s = $("#kocSSoru").value.trim();
      var sec = [$("#kocSA").value.trim(), $("#kocSB").value.trim(), $("#kocSC").value.trim(), $("#kocSD").value.trim()];
      if (!s || sec.filter(function (x) { return x; }).length < 2) { alert("Soru metni ve en az 2 şık gerekli."); return; }
      var liste = D.al("koc.sorular", []);
      liste.push({ ders: d, konu: konu, zorluk: "Kendi", tip: "Kendi Sorum", metin: "", soru: s,
        secenekler: sec, dogru: Number($("#kocSDogru").value), aciklama: $("#kocSAcik").value.trim() });
      D.koy("koc.sorular", liste);
      alert("Kaydedildi. Toplam " + liste.length + " kendi sorun var.");
      panelKapat(); kocCiz();
    });
    k.querySelector("[data-test]").addEventListener("click", function () {
      var l = D.al("koc.sorular", []);
      if (!l.length) { alert("Henüz kendi sorun yok."); return; }
      panelKapat(); testBasla(karistir(l), "Kendi Sorularım", "kendi");
    });
    k.querySelector("[data-liste]").addEventListener("click", function () {
      var l = D.al("koc.sorular", []);
      var govde2 = !l.length ? "<p class='aciklama'>Liste boş.</p>" :
        "<div class='koc-liste'>" + l.map(function (s, j) {
          return "<div class='koc-kayit-satir'><b>" + (j + 1) + "</b><span>" + s.ders + " · " + s.konu +
            "<i>" + s.soru.slice(0, 90) + "</i></span><button class='ikincil-dugme kirmizi' data-sil='" + j + "'>Sil</button></div>";
        }).join("") + "</div>";
      var k2 = panel("📋 Kendi Sorularım (" + l.length + ")", govde2, "geniş");
      k2.querySelectorAll("[data-sil]").forEach(function (b) {
        b.addEventListener("click", function () {
          var l2 = D.al("koc.sorular", []); l2.splice(Number(b.getAttribute("data-sil")), 1);
          D.koy("koc.sorular", l2); panelKapat(); kendiSoruPaneli();
        });
      });
    });
  }

  function optikPaneli() {
    var govde = "<p class='aciklama'>Denemeyi kâğıttan çözmek istersen 120 soruluk optik form yazdır ya da PDF olarak kaydet.</p>" +
      "<select class='koc-girdi' id='kocOptikAdet'><option value='120'>120 soru (KPSS-B)</option><option value='60'>60 soru</option><option value='30'>30 soru</option></select>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-yazdir='1'>🖨 Optik formu yazdır / PDF</button></div>";
    var k = panel("🖨 Optik Form", govde);
    k.querySelector("[data-yazdir]").addEventListener("click", function () { optikFormYazdir(Number($("#kocOptikAdet").value), null); });
  }

  function gununSorusuPaneli() {
    var s = gununSorusu(); if (!s) return;
    var govde = "<div class='koc-kunye'><span class='cip'>" + s.ders + "</span><span class='cip'>" + s.konu + "</span>" +
      "<span class='cip'>" + new Date().toLocaleDateString("tr-TR") + "</span></div>" +
      "<p class='koc-soru'>" + s.soru + "</p>" +
      "<div class='koc-secenekler'>" + s.secenekler.map(function (o, j) {
        return "<button class='koc-secenek' data-sec='" + j + "'><b>" + "ABCD".charAt(j) + ")</b><span>" + o + "</span></button>";
      }).join("") + "</div><div id='kocGsSonuc'></div>";
    var k = panel("☀️ Günün Sorusu", govde, "geniş");
    k.querySelectorAll("[data-sec]").forEach(function (b) {
      b.addEventListener("click", function () {
        var j = Number(b.getAttribute("data-sec")), ok = j === s.dogru;
        tekrarKaydet(s, ok); konuSayac(s, ok);
        k.querySelectorAll("[data-sec]").forEach(function (x, xi) {
          x.disabled = true;
          if (xi === s.dogru) x.classList.add("dogru");
          else if (xi === j) x.classList.add("yanlis");
        });
        $("#kocGsSonuc").innerHTML = "<div class='cevap-bant " + (ok ? "iyi" : "kotu") + "'><div class='bant-simge'>" + (ok ? "✔" : "✘") + "</div>" +
          "<div class='bant-metin'><b>" + (ok ? "Doğru!" : "Yanlış — doğru cevap: " + "ABCD".charAt(s.dogru)) + "</b><span>" + (s.aciklama || "") + "</span></div></div>";
        var kp = D.al("koc.puan", { dogru: 0, test: 0 }); kp.dogru += ok ? 1 : 0; kp.test += 1; D.koy("koc.puan", kp);
        seriIsle();
        if (ok) konus("Doğru cevap. Aferin!");
      });
    });
  }

  /* ═══════════ KOÇ PRO PANELİ (ana ekran) ═══════════ */
  function kocCiz() {
    var alan = $("#kocAlan"); if (!alan) return;
    var kg = kalanGun(), seri = D.al("koc.seri", { gun: 0, en: 0, toplam: 0 }), sv = seviyeBilgi(), tz = tekrarOzet();
    var rozet = rozetDurum(), kaz = rozet.filter(function (r) { return r.var_mi; }).length;
    var gs = gununSorusu();
    var ist = D.al("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 });

    alan.innerHTML =
      "<div class='koc-kutular'>" +
        "<div class='koc-kutu'><b>" + (kg === null ? "—" : kg) + "</b><span>Sınava kalan gün</span></div>" +
        "<div class='koc-kutu'><b>🔥 " + (seri.gun || 0) + "</b><span>Gün seri (en iyi " + (seri.en || 0) + ")</span></div>" +
        "<div class='koc-kutu'><b>" + sv.no + "</b><span>Seviye · " + sv.ad + "</span></div>" +
        "<div class='koc-kutu'><b>" + kaz + "/" + rozet.length + "</b><span>Rozet</span></div>" +
      "</div>" +
      "<div class='koc-seviye'><div class='koc-seviye-ust'><b>Seviye ilerlemesi</b><span>" + sv.dogru + " doğru · sonraki " + sv.ust + "</span></div>" +
        "<div class='koc-cubuk'><i style='width:" + sv.yuzde + "%'></i></div></div>" +

      "<div class='koc-blok'><h3>🔁 Akıllı Tekrar</h3>" +
        "<p class='aciklama'>Yanlış yaptığın sorular 1-3-7-15-30 gün aralıklarıyla geri gelir. Şu an <b>" + tz.vade +
        "</b> soru vadesi geldi, <b>" + tz.ogrenilen + "</b> soru öğrenildi (5. kutuya ulaştı).</p>" +
        "<div class='soru-alt'><button class='buyuk-dugme' data-islem='tekrar-vade'>▶ Vadesi gelenleri çöz (" + tz.vade + ")</button>" +
        "<button class='ikincil-dugme' data-islem='tekrar-hepsi'>Tüm yanlışlarımı çalış</button></div></div>" +

      "<div class='koc-blok'><h3>🧭 Konu Haritası</h3>" +
        "<p class='aciklama'>Hangi konuda kaç yanlışın var, ısı haritasında gör; zayıf konunu tek düğmeyle çalış.</p>" +
        "<div class='soru-alt'><button class='buyuk-dugme' data-islem='harita'>Haritayı aç</button></div></div>" +

      "<div class='koc-blok'><h3>☀️ Günün Sorusu</h3>" +
        (gs ? "<p class='koc-gs-soru'>" + gs.soru.slice(0, 120) + (gs.soru.length > 120 ? "…" : "") + "</p>" +
          "<div class='koc-kunye'><span class='cip'>" + gs.ders + "</span><span class='cip'>" + gs.konu + "</span></div>" : "") +
        "<div class='soru-alt'><button class='buyuk-dugme' data-islem='gunun'>Bugünün sorusunu çöz</button>" +
        "<button class='ikincil-dugme' data-islem='dinlet'>🔊 Soruyu dinle</button></div></div>" +

      "<div class='koc-blok'><h3>📦 Yedekle & Geri Yükle</h3>" +
        "<p class='aciklama'>İlerlemeni yedek kodu ya da dosya olarak sakla; yeni telefonda aynen devam et.</p>" +
        "<div class='soru-alt'><button class='buyuk-dugme' data-islem='yedek'>Yedekle / geri yükle</button></div></div>" +

      "<div class='koc-blok'><h3>🎓 Karne, Rozetler ve Kaygı</h3>" +
        "<div class='soru-alt'><button class='buyuk-dugme' data-islem='karne'>🎓 Karne ve sertifika</button>" +
        "<button class='ikincil-dugme' data-islem='rozet'>🏅 Rozetler</button>" +
        "<button class='ikincil-dugme' data-islem='kaygi'>🌿 Sınav kaygısı (nefes)</button></div></div>" +

      "<div class='koc-blok'><h3>⚙️ Kolaylıklar ve Yönetim</h3>" +
        "<div class='soru-alt'>" +
          "<button class='ikincil-dugme' data-islem='kendi'>➕ Kendi sorularım</button>" +
          "<button class='ikincil-dugme' data-islem='optik'>🖨 Optik form</button>" +
          "<button class='ikincil-dugme' data-islem='tarih'>📅 Sınav tarihi</button>" +
          "<button class='ikincil-dugme' data-islem='görünüm'>🔠 Yazı boyutu / gece modu</button>" +
          "<button class='ikincil-dugme' data-islem='profil'>👥 Profiller</button>" +
          "<button class='ikincil-dugme' data-islem='usta'>🔐 Usta modu</button>" +
        "</div></div>" +

      "<p class='aciklama koc-alt-not'>Çözülen: " + (ist.cozulen || 0) + " · Doğru: " + (ist.dogru || 0) +
      " · Yanlış: " + (ist.yanlis || 0) + " · Boş: " + (ist.bos || 0) + "</p>";

    alan.querySelectorAll("[data-islem]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = b.getAttribute("data-islem");
        if (i === "tekrar-vade") {
          var v = tekrarVadesiGelenler(false);
          if (!v.length) { alert("Şu an vadesi gelen tekrar yok. Yarın yine bak — aralıklı tekrarın gücü burada."); return; }
          testBasla(v.slice(0, 20), "Akıllı Tekrar (" + v.length + " sorudan 20'si)", "tekrar");
        }
        else if (i === "tekrar-hepsi") {
          var t = tekrarVadesiGelenler(true);
          if (!t.length) { alert("Henüz yanlış kaydın yok. Test çözdükçe burada birikir."); return; }
          testBasla(karistir(t).slice(0, 20), "Tüm Yanlışlarım", "tekrar");
        }
        else if (i === "harita") haritaPaneli();
        else if (i === "gunun") gununSorusuPaneli();
        else if (i === "dinlet") { var s = gununSorusu(); if (s) konus(s.soru + ". Seçenekler: " + s.secenekler.map(function (o, j) { return "ABCD".charAt(j) + ", " + o; }).join(". ")); }
        else if (i === "yedek") yedekPaneli();
        else if (i === "karne") karnePaneli();
        else if (i === "rozet") rozetPaneli();
        else if (i === "kaygi") kaygiPaneli();
        else if (i === "kendi") kendiSoruPaneli();
        else if (i === "optik") optikPaneli();
        else if (i === "tarih") tarihPaneli();
        else if (i === "profil") profilPaneli();
        else if (i === "usta") ustaPaneli();
        else if (i === "görünüm") gorunumPaneli();
      });
    });
  }

  function gorunumPaneli() {
    var y = D.al("koc.yazi", "normal"), g = D.al("koc.gece", false);
    var govde = "<p class='aciklama'>Yazı boyutunu büyüt, gece modunu aç. Tercihler cihazda saklanır.</p>" +
      "<div class='koc-liste'>" +
        ["kucuk", "normal", "buyuk", "cokbuyuk"].map(function (k) {
          var ad = k === "kucuk" ? "Küçük" : k === "normal" ? "Normal" : k === "buyuk" ? "Büyük" : "Çok büyük";
          return "<button class='koc-buyuk-satir" + (y === k ? " secili" : "") + "' data-yazi='" + k + "'>" + (y === k ? "✔ " : "") + "🔠 " + ad + "</button>";
        }).join("") +
        "<button class='koc-buyuk-satir" + (g ? " secili" : "") + "' data-gece='1'>" + (g ? "✔ " : "🌙 ") + "Gece modu (karanlık ekran)</button>" +
      "</div>";
    var k = panel("🔠 Yazı Boyutu ve Gece Modu", govde);
    k.querySelectorAll("[data-yazi]").forEach(function (b) {
      b.addEventListener("click", function () { D.koy("koc.yazi", b.getAttribute("data-yazi")); yaziUygula(); panelKapat(); gorunumPaneli(); });
    });
    k.querySelector("[data-gece]").addEventListener("click", function () { D.koy("koc.gece", !D.al("koc.gece", false)); geceUygula(); panelKapat(); gorunumPaneli(); });
  }

  /* ═══════════ MENÜYE EKLE + BAŞLAT ═══════════ */
  function menuEkle() {
    var kap = $(".menu-icerik"); if (!kap || $("#kocMenuOge")) return;
    var b = document.createElement("button");
    b.className = "menu-oge";
    b.id = "kocMenuOge";
    b.setAttribute("data-git", "koc");
    b.innerHTML = "<span class='menu-simg'>🎓</span><span>KOÇ PRO<small>Tekrar · Karne · Rozet · Yedek</small></span>";
    kap.appendChild(b);
    b.addEventListener("click", function () { gitKoc(); });
  }

  function gitKoc() {
    try { window.USTAD_MOTOR.git("koc"); } catch (e) {}
    var hedef = $("#ekran-koc");
    $$(".ekran").forEach(function (e) { e.classList.remove("acik"); });
    if (hedef) hedef.classList.add("acik");
    $$(".menu-oge").forEach(function (o) { o.classList.toggle("secili", o.getAttribute("data-git") === "koc"); });
    document.body.setAttribute("data-bolum", "koc");
    document.body.style.setProperty("--bolum", "var(--koc)");
    document.title = "ÜSTAD KOÇ PRO · KOÇ PRO";
    try { $(".menu").classList.remove("acik"); $("#menuPerde").classList.remove("acik"); } catch (e) {}
    window.scrollTo(0, 0);
    kocCiz();
  }

  /* Ana sayfaya kısa KOÇ PRO şeridi (kalan gün + seri + günün sorusu düğmesi) */
  function anaSerit() {
    var ana = $("#ekran-ana"); if (!ana || $("#kocSerit")) return;
    var kg = kalanGun(), seri = D.al("koc.seri", { gun: 0 });
    var d = document.createElement("div");
    d.id = "kocSerit";
    d.className = "kart koc-serit";
    d.innerHTML = "<div class='koc-serit-ic'><span class='koc-serit-simg'>🎓</span>" +
      "<div><b>KOÇ PRO</b><i>" + (kg === null ? "Sınav tarihini ayarla, geri sayım başlasın" : "Sınava " + kg + " gün kaldı") +
      " · 🔥 " + (seri.gun || 0) + " gün seri</i></div>" +
      "<button class='ikincil-dugme' id='kocSeritGit'>Aç</button></div>";
    ana.insertBefore(d, ana.firstChild);
    $("#kocSeritGit").addEventListener("click", function () { gitKoc(); });
  }

  function basla() {
    ekranAyarlariUygula();
    menuEkle();
    anaSerit();
    kocCiz();
    /* ilk açılışta hatırlatma */
    var son = D.al("koc.sonAcilis", null);
    if (son !== bugun()) {
      D.koy("koc.sonAcilis", bugun());
      var kg = kalanGun(), tz = tekrarOzet();
      setTimeout(function () {
        if (kg !== null && kg >= 0) konus("Sınava " + kg + " gün kaldı. Bugünkü sorunu çözmeye ne dersin?");
        else if (tz.vade > 0) konus("Tekrar vadesi gelen " + tz.vade + " sorun var. Hadi tazeleyelim.");
      }, 1400);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(basla, 300); });
  else setTimeout(basla, 300);

  /* dışa açılanlar (test ve entegrasyon için) */
  window.KOC = {
    git: gitKoc, ciz: kocCiz, testBasla: testBasla, testBitir: testBitir, panel: panel,
    soruKimlik: soruKimlik, sonTestBilgi: function () { return { adet: ST.sorular.length, baslik: ST.baslik }; },
    tekrarOzet: tekrarOzet, tekrarKaydet: tekrarKaydet,
    tekrarVadesiGelenler: tekrarVadesiGelenler, konuHaritasi: konuHaritasi, seviyeBilgi: seviyeBilgi,
    rozetDurum: rozetDurum, yedekAl: yedekAl, yedekMetni: yedekMetni, yedekYukle: yedekYukle,
    gununSorusu: gununSorusu, kalanGun: kalanGun, seri: function () { return D.al("koc.seri", {}); },
    profiller: profiller, profilDegistir: profilDegistir, optikFormYazdir: optikFormYazdir,
    yaziUygula: yaziUygula, geceUygula: geceUygula, Depo: D, benzerlik: benzerlik,
    panelTestleri: { harita: haritaPaneli, karne: karnePaneli, kaygi: kaygiPaneli, yedek: yedekPaneli,
                     rozet: rozetPaneli, usta: ustaPaneli, profil: profilPaneli, kendi: kendiSoruPaneli,
                     optik: optikPaneli, tarih: tarihPaneli, gorunum: gorunumPaneli, gunun: gununSorusuPaneli }
  };

  /* ── kancalar: eklenti modülleri (koc2.js / koc3.js) buraya bağlanır ── */
  window.KOC.cizKancalari = [];
  window.KOC.bitisKancalari = [];
  (function () {
    var c0 = kocCiz, t0 = testBitir;
    kocCiz = function () {
      c0();
      (window.KOC.cizKancalari || []).forEach(function (f) { try { f(); } catch (e) {} });
    };
    testBitir = function () {
      t0();
      (window.KOC.bitisKancalari || []).forEach(function (f) { try { f(); } catch (e) {} });
    };
  })();
})();
