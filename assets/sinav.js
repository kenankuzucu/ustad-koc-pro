/* © 2026 Kenan Kuzucu · ÜSTAD KPSS-B KOÇ PRO · TAM SINAV SİMÜLASYONU · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   5846 sayılı FSEK kapsamında korunur. İzinsiz çoğaltma, kopyalama, satış ve dağıtım yasaktır.
   ─────────────────────────────────────────────────────────────────────────────────────────────
   Tam Sınav Simülasyonu: gerçek KPSS-B formatı 120 soru / 130 dakika
     · Genel Yetenek  60 → Türkçe 30 + Matematik 30
     · Genel Kültür   60 → Tarih 27 + Coğrafya 18 + Vatandaşlık 9 + Güncel Bilgiler 6
   Veri kaynağı : window.USTAD_SORULAR (özgün soru bankası), window.USTAD_PAKET (format).
   Ekran kabı  : assets/sinav.js kendi kabını kurar (#ekran-sinav + #sinavAlan).
   Çıkış verisi: ustad.sinav.gecmis (son 20 sınav) · ustad.ka.denemeler (deneme analizi biçimi)
                 ustad.yanlisKonu · ustad.ist · ustad.danaliz.veri (KOÇ AI ayna kaydı)
   Hiçbir sayı uydurulmaz; bütün sonuçlar cevap kâğıdından ölçülerek üretilir. */
(function () {
  "use strict";

  var SINAV = (window.SINAV = window.SINAV || {});

  /* ─═══════════════ 0) SABİTLER ═══════════════ */
  var SURE_DK = 130;                       /* gerçek KPSS-B süresi */
  var SURE_SN = SURE_DK * 60;              /* 7800 sn */
  var TOPLAM_SORU = 120;
  var HARFLER = ["A", "B", "C", "D"];
  var UYARI_ESIK = 300;                    /* son 5 dakika uyarısı (sn) */
  var GECMIS_LIMIT = 20;                   /* kullanıcının istediği: son 20 sınav */
  var MAX_DENEME_KAYIT = 100;
  var KILAVUZ_SAYFA = "sinav";

  var DEPO_GECMIS = "sinav.gecmis";
  var DEPO_DURUM = "sinav.durum";
  var DEPO_VERI = "danaliz.veri";
  var DEPO_DENEME = "ka.denemeler";

  /* Paket yoksa kullanılacak gerçek KPSS-B cetveli */
  var CETVEL_YEDEK = [
    { ders: "Türkçe", soru: 30, bolum: "Genel Yetenek", simg: "📖" },
    { ders: "Matematik", soru: 30, bolum: "Genel Yetenek", simg: "🔢" },
    { ders: "Tarih", soru: 27, bolum: "Genel Kültür", simg: "🏛️" },
    { ders: "Coğrafya", soru: 18, bolum: "Genel Kültür", simg: "🗺️" },
    { ders: "Vatandaşlık", soru: 9, bolum: "Genel Kültür", simg: "⚖️" },
    { ders: "Güncel Bilgiler", soru: 6, bolum: "Genel Kültür", simg: "📰" }
  ];

  /* ─═══════════════ 1) YARDIMCILAR ═══════════════ */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function depoAl(k, v) { try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } }
  function depoKoy(k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function depoSil(k) { try { localStorage.removeItem("ustad." + k); } catch (e) {} }
  function i2(n) { n = Number(n) || 0; return n < 10 ? "0" + n : "" + n; }
  function i3(n) { n = Number(n) || 0; return n < 100 ? ("0" + i2(n)) : "" + n; }
  /** mm:ss (süre 130:00 gibi üç haneli dakikaya çıkabilir) */
  function sureYaz(sn) {
    sn = Math.max(0, Math.round(Number(sn) || 0));
    var dk = Math.floor(sn / 60);
    return (dk >= 100 ? "" + dk : i2(dk)) + ":" + i2(sn % 60);
  }
  function trTarih(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso || "—");
    return i2(d.getDate()) + "." + i2(d.getMonth() + 1) + "." + d.getFullYear() + " " + i2(d.getHours()) + ":" + i2(d.getMinutes());
  }
  function karistir(a) {
    var b = (a || []).slice();
    for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }
  function ses(metin) { try { if (window.KPSS_SES && window.KPSS_SES.konus) KPSS_SES.konus(metin); } catch (e) {} }

  /* ─═══════════════ 2) VERİ ═══════════════ */
  function banka() { var s = window.USTAD_SORULAR; return Array.isArray(s) ? s : []; }
  function paket() { return window.USTAD_PAKET || {}; }
  /** Sınav cetveli: paket varsa ondan, yoksa gerçek KPSS-B cetvelinden. */
  function cetvel() {
    var d = paket().dersler;
    if (Array.isArray(d) && d.length) {
      var t = d.filter(function (x) { return x && x.ad && Number(x.soru) > 0; })
        .map(function (x) { return { ders: x.ad, soru: Number(x.soru), bolum: x.bolum || "", simg: x.simg || "" }; });
      var top = 0;
      t.forEach(function (x) { top += x.soru; });
      if (t.length && top >= 60) return t;
    }
    return CETVEL_YEDEK;
  }
  function hedefSoru() { var t = 0; cetvel().forEach(function (x) { t += x.soru; }); return t; }
  function dersSimg(ad) {
    var c = cetvel().filter(function (x) { return x.ders === ad; })[0];
    if (c && c.simg) return c.simg;
    var d = (paket().dersler || []).filter(function (x) { return x.ad === ad; })[0];
    return (d && d.simg) || "📘";
  }
  function dersBolum(ad) {
    var c = cetvel().filter(function (x) { return x.ders === ad; })[0];
    return (c && c.bolum) || "";
  }
  /** Bir dersin bankadaki soruları → [{q, i}] (i = banka sırası = tekilleştirme anahtarı) */
  function dersHavuzu(ad) {
    var b = banka(), out = [];
    for (var i = 0; i < b.length; i++) {
      var q = b[i];
      if (q && typeof q === "object" && String(q.ders) === String(ad)) out.push({ q: q, i: i });
    }
    return out;
  }

  /* ─═══════════════ 3) KAĞIT ÜRETİMİ (120 soru, ders dağılımı, tekrarsızlık) ═══════════════ */
  /** Gerçek sınav sırası: Türkçe → Matematik → Tarih → Coğrafya → Vatandaşlık → Güncel Bilgiler.
   *  Aynı soru aynı sınavda iki kez kullanılmaz; bir derste yeterli soru yoksa mevcut sorular
   *  tekrar kullanılır ve kullanıcıya uyarı üretilir (uydurma soru ÜRETİLMEZ). */
  function kagitUret() {
    var sorular = [], uyarilar = [], kullanilanToplam = {};
    cetvel().forEach(function (c) {
      var havuz = dersHavuzu(c.ders);
      if (!havuz.length) {
        uyarilar.push({ ders: c.ders, mevcut: 0, istenen: c.soru, eksik: c.soru, tekrar: 0, tip: "yok" });
        return;
      }
      var benzersiz = karistir(havuz).slice(0, Math.min(havuz.length, c.soru));
      benzersiz.forEach(function (o) { kullanilanToplam[o.i] = true; });
      var secilen = benzersiz.slice();
      var kalan = c.soru - benzersiz.length;
      while (kalan > 0) {
        var tur = karistir(havuz);              /* her turda yeni sıra → tekrarlar üst üste gelmez */
        for (var k = 0; k < tur.length && kalan > 0; k++) { secilen.push(tur[k]); kalan--; }
        if (!tur.length) break;
      }
      var tekrarAdet = secilen.length - benzersiz.length;
      sorular = sorular.concat(secilen);
      if (havuz.length < c.soru) {
        uyarilar.push({
          ders: c.ders, mevcut: havuz.length, istenen: c.soru,
          eksik: c.soru - havuz.length, tekrar: Math.max(0, tekrarAdet), tip: "tekrar"
        });
      }
    });
    /* her soru kağıt içinde numaralanır ve hangi dersten geldiği yazılır */
    sorular = sorular.map(function (o, n) {
      return { no: n + 1, bankaIdx: o.i, ders: o.q.ders || "Diğer", konu: o.q.konu || "Konu", soru: o.q };
    });
    return { sorular: sorular, uyarilar: uyarilar, hedef: hedefSoru() };
  }

  /* ─═══════════════ 4) HESAP (KPSS kuralı) ═══════════════ */
  /** KPSS net kuralı: net = doğru − yanlış / 4 */
  function netHesap(dogru, yanlis) {
    return Math.round(((Number(dogru) || 0) - (Number(yanlis) || 0) / 4) * 100) / 100;
  }
  /** 100 üzerinden yaklaşık puan tahmini: 30 + 70 × (toplam net / 120). 0 net → 30, tam net → 100. */
  function puanHesap(net) {
    var p = 30 + 70 * ((Number(net) || 0) / TOPLAM_SORU);
    if (p < 0) p = 0; if (p > 100) p = 100;
    return Math.round(p * 10) / 10;
  }
  function netYaz(n) { return (n > 0 ? "" : "") + (Math.round(n * 100) / 100); }

  /* ─═══════════════ 5) EKRAN KABI ═══════════════ */
  function ekranKur() {
    var kap = document.getElementById("ekran-sinav");
    if (!kap) {
      kap = document.createElement("section");
      kap.id = "ekran-sinav";
      kap.className = "ekran";
      kap.setAttribute("data-bolum", "sinav");
      kap.innerHTML = '<h2 class="sayfa-baslik">🎯 Tam Sınav Simülasyonu</h2>' +
        '<div class="kart" id="sinavAlan"></div>';
      document.body.appendChild(kap);
    } else if (!kap.querySelector("#sinavAlan")) {
      var alan = document.createElement("div");
      alan.className = "kart";
      alan.id = "sinavAlan";
      kap.appendChild(alan);
    }
    return kap;
  }
  function alan() { ekranKur(); return document.getElementById("sinavAlan"); }
  /** Motor (motor.js) bölüm değiştirmeyi kendisi yapar; burada yalnız kendi kodumuz çizilir. */
  function ekranGoster(kod) {
    try {
      if (window.USTAD_MOTOR && window.USTAD_MOTOR.git) { window.USTAD_MOTOR.git(kod); return; }
    } catch (e) {}
    $$(".ekran").forEach(function (e) { e.classList.remove("acik"); });
    var h = document.getElementById("ekran-" + kod);
    if (h) h.classList.add("acik");
    if (document.body) document.body.setAttribute("data-bolum", kod);
    window.scrollTo(0, 0);
  }

  /* ─═══════════════ 6) DURUM ═══════════════ */
  var D = {
    sorular: [], cevaplar: [], isaretli: {}, i: 0,
    kalan: SURE_SN, sayac: null, bitti: false, basladi: false, duraklat: false,
    otomatik: false, uyarilar: [], uyariVerildi: false, sonuc: null, gorunum: "baslangic"
  };
  SINAV.D = D;

  function cevapVar(no) { var c = D.cevaplar[no]; return c !== undefined && c !== null; }
  function cevapSayisi() { var t = 0; for (var i = 0; i < D.sorular.length; i++) if (cevapVar(i)) t++; return t; }
  function bosSayisi() { return D.sorular.length - cevapSayisi(); }
  function bayrakSayisi() { return Object.keys(D.isaretli).filter(function (k) { return D.isaretli[k]; }).length; }

  /* ─═══════════════ 7) SÜRE / SAYAÇ ═══════════════ */
  function sayacYaz() {
    var s = document.getElementById("sinavSayac");
    if (!s) return;
    s.textContent = sureYaz(D.kalan);
    s.className = "sinav-sayac" + (D.kalan <= UYARI_ESIK ? " sinav-sayac-az" : "");
    var b = document.getElementById("sinavUyariBandi");
    if (b && D.kalan > UYARI_ESIK) b.className = "sinav-uyari-bandi sinav-gizli";
  }
  function tik() {
    if (!D.basladi || D.bitti || D.duraklat) return D.kalan;
    D.kalan = Math.max(0, D.kalan - 1);
    sayacYaz();
    if (D.kalan === UYARI_ESIK) { uyariGoster("⏰ Son 5 dakika! İşaretlemediğin soruları kontrol et."); ses("Son beş dakika kaldı."); }
    if (D.kalan % 5 === 0) durumKaydet();
    if (D.kalan <= 0) bitir(true);
    return D.kalan;
  }
  function sayacBaslat() {
    sayacDurdur();
    D.sayac = setInterval(tik, 1000);
  }
  function sayacDurdur() { if (D.sayac) { clearInterval(D.sayac); D.sayac = null; } }
  function uyariGoster(metin) {
    var b = document.getElementById("sinavUyariBandi");
    if (!b) return;
    b.innerHTML = "<b>" + kacis(metin) + "</b>";
    b.className = "sinav-uyari-bandi";
    D.uyariVerildi = true;
  }

  /* ─═══════════════ 8) SIFAHLAMA (beklenmedik hata sınavı düşürmesin) ═══════════════ */
  function koru(fn, ad) {
    return function () {
      try { return fn.apply(null, arguments); }
      catch (e) {
        var k = document.getElementById("sinavHata");
        if (k) k.textContent = "⚠ " + (ad || "işlem") + " hatası: " + (e && e.message ? e.message : e);
        return null;
      }
    };
  }

  /* ─═══════════════ 9) GÖRÜNÜM: BAŞLANGIÇ ═══════════════ */
  function bankaDurumTablosu() {
    var b = banka(), h = "<table class='sinav-tablo'><thead><tr><th>Ders</th><th>Bölüm</th><th>İstenen</th>" +
      "<th>Bankada</th><th>Durum</th></tr></thead><tbody>";
    cetvel().forEach(function (c) {
      var mevcut = dersHavuzu(c.ders).length;
      var durum = mevcut >= c.soru ? "<span class='sinav-iyi'>✔ yeterli</span>"
        : (mevcut === 0 ? "<span class='sinav-kotu'>✘ bankada soru yok</span>"
          : "<span class='sinav-orta'>⚠ " + mevcut + " soru var, tekrar kullanılacak</span>");
      h += "<tr><td>" + (c.simg ? c.simg + " " : "") + kacis(c.ders) + "</td><td>" + kacis(c.bolum || "—") + "</td>" +
        "<td class='rakam'>" + c.soru + "</td><td class='rakam'>" + mevcut + "</td><td>" + durum + "</td></tr>";
    });
    h += "<tr class='toplam'><td><b>TOPLAM</b></td><td>Genel Yetenek + Genel Kültür</td><td class='rakam'><b>" +
      hedefSoru() + "</b></td><td class='rakam'><b>" + b.length + "</b></td><td>—</td></tr></tbody></table>";
    return h;
  }
  function uyariListesi(kagit) {
    var u = (kagit && kagit.uyarilar) || [];
    if (!u.length) return "<p class='sinav-iyi-yazi'>✔ Bankada her ders için yeterli soru var; bu sınavda hiçbir soru tekrar kullanılmayacak.</p>";
    var h = "<ul class='sinav-uyari-liste'>";
    u.forEach(function (x) {
      h += x.tip === "yok"
        ? "<li><b>" + kacis(x.ders) + "</b>: bu derste hiç soru yok (" + x.istenen + " soru eksik). Soru bankasına ekleme yapılmalı.</li>"
        : "<li><b>" + kacis(x.ders) + "</b>: bu derste <b>" + x.mevcut + " soru</b> var, " + x.istenen +
        " soru istendi → <b>" + x.tekrar + " soru tekrar kullanıldı</b>.</li>";
    });
    return h + "</ul><p class='aciklama'>Uyarı: yetersiz derste soru uydurulmaz; mevcut sorular rastgele sırayla yeniden kullanılır.</p>";
  }
  function gecmisTablosu() {
    var g = gecmisOku();
    if (!g.length) return "<p class='aciklama' id='sinavGecmisBos'>Henüz kayıtlı simülasyon yok. İlk sınavını bitirdiğinde sonuçlar buraya işlenir (son " + GECMIS_LIMIT + " sınav).</p>";
    var h = "<table class='sinav-tablo' id='sinavGecmisTablo'><thead><tr><th>#</th><th>Tarih</th><th>Doğru</th><th>Yanlış</th>" +
      "<th>Boş</th><th>Net</th><th>Puan</th><th>Süre</th></tr></thead><tbody>";
    var enIyi = null, enKotu = null, topNet = 0;
    g.slice(-GECMIS_LIMIT).forEach(function (x, i) {
      topNet += x.net;
      if (!enIyi || x.net > enIyi.net) enIyi = x;
      if (!enKotu || x.net < enKotu.net) enKotu = x;
      h += "<tr><td class='rakam'>" + (i + 1) + "</td><td>" + kacis(trTarih(x.tarih)) + "</td><td class='rakam'>" + x.dogru +
        "</td><td class='rakam'>" + x.yanlis + "</td><td class='rakam'>" + x.bos + "</td><td class='rakam'><b>" + netYaz(x.net) +
        "</b></td><td class='rakam'>" + x.puan + "</td><td class='rakam'>" + sureYaz(x.sure) + "</td></tr>";
    });
    var ort = Math.round((topNet / g.slice(-GECMIS_LIMIT).length) * 100) / 100;
    h += "</tbody></table><p class='sinav-sayi'>" + g.slice(-GECMIS_LIMIT).length + " sınav · ortalama net " + netYaz(ort) +
      " · en iyi " + netYaz(enIyi.net) + " · en düşük " + netYaz(enKotu.net) + "</p>";
    return h;
  }
  function baslangicCiz() {
    var a = alan(); if (!a) return null;
    D.gorunum = "baslangic";
    var kayit = durumOku();
    var b = banka();
    var h = "<div class='sinav-bolum sinav-ilk'>" +
      "<h3 class='sinav-baslik'>Gerçek sınav provası</h3>" +
      "<p><b>" + hedefSoru() + " soru · " + SURE_DK + " dakika</b> — Genel Yetenek " +
      ((cetvel()[0] ? cetvel()[0].bolum : "Genel Yetenek")) + " + Genel Kültür. " +
      "Süre başladığı anda işler; süre bitince kâğıt otomatik olarak teslim edilir.</p>" +
      "<div class='sinav-kutular'>" +
      "<div class='sinav-kutu'><b>" + hedefSoru() + "</b><span>SORU</span><i>120 gerçek format</i></div>" +
      "<div class='sinav-kutu'><b>" + SURE_DK + ":00</b><span>SÜRE</span><i>dakika:saniye</i></div>" +
      "<div class='sinav-kutu'><b>" + b.length + "</b><span>BANKADAKİ SORU</span><i>window.USTAD_SORULAR</i></div>" +
      "<div class='sinav-kutu'><b>" + gecmisOku().length + "</b><span>GEÇMİŞ SINAV</span><i>son " + GECMIS_LIMIT + "</i></div>" +
      "</div>" +
      "<div class='sinav-butonlar'>" +
      "<button class='buyuk-dugme' id='sinavBasla' type='button'>▶ SINAVI BAŞLAT</button>" +
      (kayit ? "<button class='ikincil-dugme sari' id='sinavDevam' type='button'>⏯ Yarıda kalan sınava devam et (" +
        cevapVarSay(kayit) + "/" + ((kayit.bankaIdx || []).length || hedefSoru()) + " işaretli · " + sureYaz(kayit.kalan) + " kaldı)</button>" : "") +
      "</div>" +
      "<p class='aciklama'>Net kuralı KPSS’deki gibidir: <b>net = doğru − yanlış / 4</b>. " +
      "Puan tahmini <b>30 + 70 × (net / " + hedefSoru() + ")</b> ile hesaplanır (100 üzerinden yaklaşık değer).</p>" +
      "<div id='sinavHata' class='sinav-hata'></div>" +
      "</div>";

    h += "<div class='sinav-bolum'><h3 class='sinav-baslik'>1) Soru bankası durumu</h3>" + bankaDurumTablosu() +
      "<div id='sinavUyarilar'>" + uyariListesi({ uyarilar: bankaUyarilari() }) + "</div>" +
      (b.length ? "" : "<p class='sinav-kotu' id='sinavBankaBos'>✘ Soru bankası boş: sınav kâğıdı üretilemez. " +
        "Banka dolduğunda bu bölüm çalışır.</p>") + "</div>";

    h += "<div class='sinav-bolum'><h3 class='sinav-baslik'>2) Sınav geçmişi (son " + GECMIS_LIMIT + ")</h3>" +
      "<div id='sinavGecmisKutu'>" + gecmisTablosu() + "</div>" +
      "<div class='sinav-butonlar'><button class='ikincil-dugme kirmizi' id='sinavGecmisSil' type='button'>🗑 Geçmişi temizle</button></div></div>";

    h += "<div class='sinav-bolum'><h3 class='sinav-baslik'>3) Nasıl işler?</h3><ul class='sinav-adimlar'>" +
      "<li>Kâğıt ders dağılımına göre rastgele üretilir; <b>aynı soru bir sınavda iki kez sorulmaz</b>.</li>" +
      "<li>Optik cevap kâğıdındaki 120 kutuya dokunarak soruya gidebilirsin; işaretli sorular <b>mavi</b>, bayraklılar <b>turuncu çerçeveli</b>, boşlar <b>gri</b> görünür.</li>" +
      "<li>⏸ ile sınavı duraklatabilir (sorular gizlenir), devam ettiğinde süre kaldığı yerden işler.</li>" +
      "<li>Sınavı bitirince ders ve konu bazlı döküm, süre kullanımı ve puan tahmini çıkar.</li>" +
      "<li>Sonuç <b>Deneme Analizi</b> ve <b>ÜSTAD KOÇ AI</b> bölümlerinin okuduğu kayıtlara işlenir.</li>" +
      "</ul></div>";

    a.innerHTML = h;

    var bs = document.getElementById("sinavBasla");
    if (bs) bs.addEventListener("click", koru(function () { basla(); }, "başlatma"));
    var dv = document.getElementById("sinavDevam");
    if (dv) dv.addEventListener("click", koru(function () { devamEt(kayit); }, "devam etme"));
    var gs = document.getElementById("sinavGecmisSil");
    if (gs) gs.addEventListener("click", koru(function () {
      depoSil(DEPO_GECMIS); ciz();
    }, "geçmiş silme"));
    return a;
  }
  function cevapVarSay(kayit) {
    var c = (kayit && kayit.cevaplar) || [], t = 0;
    for (var i = 0; i < c.length; i++) if (c[i] !== undefined && c[i] !== null) t++;
    return t;
  }
  /** Banka uyarıları: hangi derste kaç soru var (başlangıç görünümü için ön üretim yapmadan) */
  function bankaUyarilari() {
    var u = [];
    cetvel().forEach(function (c) {
      var m = dersHavuzu(c.ders).length;
      if (m < c.soru) u.push({ ders: c.ders, mevcut: m, istenen: c.soru, eksik: c.soru - m, tekrar: Math.max(0, c.soru - m), tip: m ? "tekrar" : "yok" });
    });
    return u;
  }

  /* ─═══════════════ 10) GÖRÜNÜM: SINAV ═══════════════ */
  function sinavCiz() {
    var a = alan(); if (!a) return null;
    D.gorunum = "sinav";
    var optik = "";
    for (var i = 0; i < D.sorular.length; i++) {
      optik += "<button class='sinav-optik-kutu' type='button' data-no='" + i + "'>" + (i + 1) + "</button>";
    }
    a.innerHTML =
      "<div class='sinav-ust' id='sinavUst'>" +
      "<div class='sinav-sayac-kap'><span class='sinav-sayac-etiket'>KALAN SÜRE</span>" +
      "<b class='sinav-sayac' id='sinavSayac'>" + sureYaz(D.kalan) + "</b></div>" +
      "<div class='sinav-ilerleme' id='sinavIlerleme'></div>" +
      "<div class='sinav-ust-dugmeler'>" +
      "<button class='ikincil-dugme' id='sinavDurakla' type='button'>⏸ Duraklat</button>" +
      "<button class='ikincil-dugme kirmizi' id='sinavBitir' type='button'>🏁 Sınavı bitir</button>" +
      "<button class='ikincil-dugme' id='sinavCikis' type='button'>↩ Çıkış</button>" +
      "</div></div>" +
      "<div class='sinav-uyari-bandi sinav-gizli' id='sinavUyariBandi'></div>" +
      "<div class='sinav-govde'>" +
      "<div class='sinav-kagit' id='sinavKagit'>" +
      "<div class='sinav-soru-kart' id='sinavSoruKart'></div>" +
      "<div class='sinav-soru-dugmeler'>" +
      "<button class='ikincil-dugme' id='sinavOnceki' type='button'>◀ Önceki</button>" +
      "<button class='ikincil-dugme' id='sinavBos' type='button'>◻ Boş bırak</button>" +
      "<button class='ikincil-dugme sari' id='sinavBayrakla' type='button'>🚩 Bayrakla işaretle</button>" +
      "<button class='ikincil-dugme' id='sinavSonraki' type='button'>Sonraki ▶</button>" +
      "</div>" +
      "<div class='sinav-durakla-maske sinav-gizli' id='sinavDuraklaMaske'>" +
      "<b>⏸ Sınav duraklatıldı</b><p>Sorular gizlendi, süre durdu. Devam ettiğinde sayaç kaldığı yerden işler.</p>" +
      "<button class='buyuk-dugme' id='sinavDevamEt' type='button'>▶ DEVAM ET</button></div>" +
      "</div>" +
      "<div class='sinav-optik-kap'>" +
      "<h4 class='sinav-baslik'>Optik cevap kâğıdı</h4>" +
      "<div class='sinav-optik' id='sinavOptik'>" + optik + "</div>" +
      "<div class='sinav-optik-aciklama'><span class='sinav-ornek sinav-optik-cevapli'></span> işaretli " +
      "<span class='sinav-ornek sinav-optik-isaretli'></span> bayraklı " +
      "<span class='sinav-ornek sinav-optik-sorulan'></span> şu anki soru " +
      "<span class='sinav-ornek sinav-optik-bos'></span> boş</div>" +
      "<p class='aciklama'>Kutuya dokun → o soruya gider. Boş kutular gri kalır.</p>" +
      "</div></div>";

    document.getElementById("sinavDurakla").addEventListener("click", koru(duraklatDegistir, "duraklatma"));
    document.getElementById("sinavDevamEt").addEventListener("click", koru(duraklatDegistir, "duraklatma"));
    document.getElementById("sinavBitir").addEventListener("click", koru(function () { bitir(false); }, "bitirme"));
    document.getElementById("sinavCikis").addEventListener("click", koru(function () { cikisSor("sinav"); }, "çıkış"));
    document.getElementById("sinavOnceki").addEventListener("click", koru(function () { git(D.i - 1); }, "gezinme"));
    document.getElementById("sinavSonraki").addEventListener("click", koru(function () { git(D.i + 1); }, "gezinme"));
    document.getElementById("sinavBos").addEventListener("click", koru(bosBirak, "boş bırakma"));
    document.getElementById("sinavBayrakla").addEventListener("click", koru(function () { bayrakDegistir(D.i); }, "bayraklama"));
    document.getElementById("sinavOptik").addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest(".sinav-optik-kutu") : null;
      if (!t) return;
      koru(function () { git(Number(t.getAttribute("data-no"))); }, "optik gezinme")();
    });
    soruCiz(); optikYenile(); ilerlemeYaz();
    return a;
  }
  function soruCiz() {
    var k = document.getElementById("sinavSoruKart");
    if (!k) return;
    var x = D.sorular[D.i];
    if (!x) { k.innerHTML = "<p class='sinav-kotu'>Bu numarada soru yok.</p>"; return; }
    var q = x.soru || {};
    var secenekler = Array.isArray(q.secenekler) ? q.secenekler : [];
    var h = "<div class='sinav-soru-ust'>" +
      "<span class='sinav-soru-no'>SORU " + x.no + " / " + D.sorular.length + "</span>" +
      "<span class='sinav-rozet-ders'>" + dersSimg(x.ders) + " " + kacis(x.ders) + "</span>" +
      "<span class='sinav-rozet-konu'>" + kacis(x.konu) + "</span>" +
      (q.zorluk ? "<span class='sinav-rozet-zorluk'>" + kacis(q.zorluk) + "</span>" : "") +
      (D.isaretli[D.i] ? "<span class='sinav-rozet-bayrak'>🚩 bayraklı</span>" : "") +
      "</div>";
    if (q.metin) h += "<p class='sinav-soru-metin' id='sinavSoruMetin'>" + kacis(q.metin) + "</p>";
    else h += "<p class='sinav-soru-metin sinav-gizli' id='sinavSoruMetin'></p>";
    h += "<p class='sinav-soru-govde' id='sinavSoruGovde'>" + kacis(q.soru || "(soru metni yok)") + "</p>" +
      "<div class='sinav-secenekler' id='sinavSecenekler'>";
    secenekler.forEach(function (s, si) {
      var secili = D.cevaplar[D.i] === si;
      h += "<button class='sinav-secenek" + (secili ? " secili" : "") + "' type='button' data-secim='" + si + "'>" +
        "<b>" + HARFLER[si] + ")</b> <span>" + kacis(s) + "</span></button>";
    });
    h += "</div>";
    var cevap = D.cevaplar[D.i];
    h += "<p class='sinav-secili-bilgi' id='sinavSeciliBilgi'>" +
      (cevapVar(D.i) ? "🖊 İşaretlediğin cevap: <b>" + HARFLER[cevap] + "</b>" : "◻ Bu soru şu an <b>boş</b>.") + "</p>";
    k.innerHTML = h;
    var sc = document.getElementById("sinavSecenekler");
    if (sc) sc.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest(".sinav-secenek") : null;
      if (!t) return;
      koru(function () { cevapla(D.i, Number(t.getAttribute("data-secim"))); }, "cevaplama")();
    });
  }
  function optikYenile() {
    var kutular = $$("#sinavOptik .sinav-optik-kutu");
    for (var i = 0; i < kutular.length; i++) {
      var k = kutular[i], cls = "sinav-optik-kutu";
      if (cevapVar(i)) cls += " sinav-optik-cevapli"; else cls += " sinav-optik-bos";
      if (D.isaretli[i]) cls += " sinav-optik-isaretli";
      if (i === D.i) cls += " sinav-optik-sorulan";
      k.className = cls;
    }
  }
  function ilerlemeYaz() {
    var e = document.getElementById("sinavIlerleme");
    if (!e) return;
    e.innerHTML = "🖊 <b>" + cevapSayisi() + "</b> işaretli · ◻ <b>" + bosSayisi() + "</b> boş · 🚩 <b>" + bayrakSayisi() + "</b> bayraklı · " +
      "Soru <b>" + (D.i + 1) + "</b>/" + D.sorular.length;
  }
  function guncelleMu() { sayacYaz(); soruCiz(); optikYenile(); ilerlemeYaz(); }

  /* ─═══════════════ 11) SINAV EYLEMLERİ ═══════════════ */
  function basla(yeniden) {
    var kagit = kagitUret();
    if (!kagit.sorular.length) {
      uyariGoster("✘ Soru bankası boş — sınav başlatılamadı.");
      var a = alan();
      if (a) { var e = document.getElementById("sinavHata"); if (e) e.textContent = "✘ Soru bankası boş: sınav başlatılamaz."; }
      return false;
    }
    D.sorular = kagit.sorular;
    D.cevaplar = [];
    D.isaretli = {};
    D.i = 0;
    D.kalan = SURE_SN;
    D.bitti = false; D.basladi = true; D.duraklat = false; D.otomatik = false;
    D.uyarilar = kagit.uyarilar; D.uyariVerildi = false; D.sonuc = null;
    sinavCiz();
    sayacBaslat();
    durumKaydet();
    if (D.uyarilar.length) {
      var t = D.uyarilar.map(function (x) { return x.ders + " (" + x.mevcut + "/" + x.istenen + ")"; }).join(", ");
      uyariGoster("⚠ Banka uyarısı: " + t);
    }
    return true;
  }
  /** Kayıt bulunan yarıda kalmış sınavı yeniden kurar */
  function devamEt(kayit) {
    kayit = kayit || durumOku();
    if (!kayit) { basla(); return false; }
    var b = banka(), sorular = [], cevaplar = [], isaretli = {};
    (kayit.bankaIdx || []).forEach(function (bi) {
      var q = b[bi];
      if (!q) return;
      sorular.push({ no: sorular.length + 1, bankaIdx: bi, ders: q.ders || "Diğer", konu: q.konu || "Konu", soru: q });
    });
    if (!sorular.length) { depoSil(DEPO_DURUM); basla(); return false; }
    var eskiC = kayit.cevaplar || [], eskiI = kayit.isaretli || {};
    for (var i = 0; i < sorular.length; i++) {
      var c = eskiC[i];
      cevaplar.push(c === undefined ? null : (typeof c === "number" ? c : null));
      if (eskiI[i]) isaretli[i] = true;
    }
    D.sorular = sorular; D.cevaplar = cevaplar; D.isaretli = isaretli;
    D.i = Math.min(Math.max(0, Number(kayit.i) || 0), sorular.length - 1);
    D.kalan = Math.max(1, Number(kayit.kalan) || SURE_SN);
    D.bitti = false; D.basladi = true; D.duraklat = false; D.otomatik = false;
    D.uyarilar = kayit.uyarilar || []; D.uyariVerildi = false; D.sonuc = null;
    sinavCiz();
    sayacBaslat();
    return true;
  }
  function cevapla(no, secim) {
    if (!D.basladi || D.bitti || D.duraklat) return false;
    if (typeof no !== "number" || no < 0 || no >= D.sorular.length) return false;
    if (typeof secim !== "number" || secim < 0 || secim > 3) return false;
    D.cevaplar[no] = secim;
    if (no === D.i) guncelleMu(); else { optikYenile(); ilerlemeYaz(); }
    durumKaydet();
    return true;
  }
  function bosBirak(no) {
    if (!D.basladi || D.bitti || D.duraklat) return false;
    no = (typeof no === "number") ? no : D.i;
    if (no < 0 || no >= D.sorular.length) return false;
    D.cevaplar[no] = null;
    if (no === D.i) guncelleMu(); else { optikYenile(); ilerlemeYaz(); }
    durumKaydet();
    return true;
  }
  function bayrakDegistir(no) {
    if (!D.basladi || D.bitti) return false;
    no = (typeof no === "number") ? no : D.i;
    if (no < 0 || no >= D.sorular.length) return false;
    D.isaretli[no] = !D.isaretli[no];
    if (no === D.i) guncelleMu(); else { optikYenile(); ilerlemeYaz(); }
    durumKaydet();
    return true;
  }
  /** Sınavdan çıkıldığında kayıt saklanır, ekran başlangıç görünümüne döner:
   *  kullanıcı “Yarıda kalan sınava devam et” düğmesiyle kâğıdı geri açar. */
  function sinavdanCik() {
    if (D.basladi && !D.bitti) { durumKaydet(); }
    D.basladi = false;
    D.duraklat = false;
    sayacDurdur();
  }
  /** Yeni sınav: eldeki sonucu ve yarıda kalan kaydı temizler */
  function sifirla() {
    sayacDurdur();
    D.basladi = false; D.bitti = false; D.duraklat = false; D.sonuc = null;
    D.gorunum = "baslangic";
    return ciz();
  }
  function git(no) {
    if (!D.basladi || D.bitti) return false;
    no = Number(no);
    if (!isFinite(no) || no < 0 || no >= D.sorular.length) return false;
    D.i = no;
    guncelleMu();
    var k = document.querySelector("#sinavOptik .sinav-optik-kutu.sinav-optik-sorulan");
    if (k && k.scrollIntoView) { try { k.scrollIntoView({ block: "nearest" }); } catch (e) {} }
    return true;
  }
  function duraklatDegistir() { return D.duraklat ? devam() : duraklat(); }
  function duraklat() {
    if (!D.basladi || D.bitti) return false;
    D.duraklat = true;
    sayacDurdur();
    var m = document.getElementById("sinavDuraklaMaske");
    if (m) m.className = "sinav-durakla-maske";
    var b = document.getElementById("sinavDurakla");
    if (b) b.innerHTML = "▶ Devam et";
    durumKaydet();
    return true;
  }
  function devam() {
    if (!D.basladi || D.bitti) return false;
    D.duraklat = false;
    var m = document.getElementById("sinavDuraklaMaske");
    if (m) m.className = "sinav-durakla-maske sinav-gizli";
    var b = document.getElementById("sinavDurakla");
    if (b) b.innerHTML = "⏸ Duraklat";
    sayacBaslat();
    return true;
  }

  /* ─═══════════════ 12) SONUÇ HESABI ═══════════════ */
  function sonucHesapla() {
    var dersMap = {}, konuMap = {}, dogru = 0, yanlis = 0, bos = 0;
    var bolumMap = {};
    D.sorular.forEach(function (x, i) {
      var q = x.soru || {}, ad = x.ders || "Diğer";
      if (!dersMap[ad]) dersMap[ad] = { ders: ad, soru: 0, dogru: 0, yanlis: 0, bos: 0, net: 0 };
      if (!bolumMap[ad]) bolumMap[ad] = dersBolum(ad);
      var kk = ad + " | " + (x.konu || "Konu");
      if (!konuMap[kk]) konuMap[kk] = { ders: ad, konu: x.konu || "Konu", soru: 0, dogru: 0, yanlis: 0, bos: 0 };
      dersMap[ad].soru++; konuMap[kk].soru++;
      var c = D.cevaplar[i];
      if (c === undefined || c === null) { bos++; dersMap[ad].bos++; konuMap[kk].bos++; }
      else if (c === q.dogru) { dogru++; dersMap[ad].dogru++; konuMap[kk].dogru++; }
      else {
        yanlis++; dersMap[ad].yanlis++; konuMap[kk].yanlis++;
        /* yanlış soruyu kart tekrarı hafızasına da yaz (deneme.js ile aynı davranış) */
        try { if (window.KARTLAR && window.KARTLAR.yanlisaEkle) window.KARTLAR.yanlisaEkle(q, c); } catch (e) {}
      }
    });
    var dersler = Object.keys(dersMap).map(function (k) {
      var x = dersMap[k];
      x.net = netHesap(x.dogru, x.yanlis);
      x.bolum = bolumMap[k] || "";
      x.basari = x.soru ? Math.round((x.dogru / x.soru) * 1000) / 10 : 0;
      return x;
    });
    /* cetvel sırasını koru */
    var sira = {};
    cetvel().forEach(function (c, i) { sira[c.ders] = i; });
    dersler.sort(function (a, b) {
      var sa = sira[a.ders] === undefined ? 99 : sira[a.ders], sb = sira[b.ders] === undefined ? 99 : sira[b.ders];
      return sa - sb || String(a.ders).localeCompare(String(b.ders), "tr");
    });
    var konular = Object.keys(konuMap).map(function (k) { return konuMap[k]; });
    var enCokYanlis = konular.filter(function (x) { return x.yanlis > 0; })
      .sort(function (a, b) { return b.yanlis - a.yanlis || String(a.konu).localeCompare(String(b.konu), "tr"); });
    var net = netHesap(dogru, yanlis);
    var gy = dersler.filter(function (x) { return x.bolum === "Genel Yetenek"; });
    var gk = dersler.filter(function (x) { return x.bolum === "Genel Kültür"; });
    function topla(list, alan) { var t = 0; list.forEach(function (x) { t += x[alan]; }); return t; }
    var sure = SURE_SN - D.kalan;
    return {
      tarih: new Date().toISOString(), id: "sinav-" + Date.now(),
      soru: D.sorular.length, dogru: dogru, yanlis: yanlis, bos: bos,
      net: net, puan: puanHesap(net),
      yuzde: D.sorular.length ? Math.round((dogru / D.sorular.length) * 1000) / 10 : 0,
      dersler: dersler, konular: konular, enCokYanlisKonular: enCokYanlis.slice(0, 12),
      genelYetenek: { dogru: topla(gy, "dogru"), yanlis: topla(gy, "yanlis"), bos: topla(gy, "bos"), net: netHesap(topla(gy, "dogru"), topla(gy, "yanlis")), soru: topla(gy, "soru") },
      genelKultur: { dogru: topla(gk, "dogru"), yanlis: topla(gk, "yanlis"), bos: topla(gk, "bos"), net: netHesap(topla(gk, "dogru"), topla(gk, "yanlis")), soru: topla(gk, "soru") },
      sureKullanilan: sure, sureKalan: D.kalan, toplamSure: SURE_SN,
      sureOrt: D.sorular.length ? Math.round(sure / D.sorular.length * 10) / 10 : 0,
      otomatik: !!D.otomatik, uyarilar: D.uyarilar
    };
  }

  /* ─═══════════════ 13) DIŞA AKTARMA (Deneme Analizi + KOÇ AI) ═══════════════ */
  function yanlisKonuArttir(konu, ders) {
    var m = depoAl("yanlisKonu", {});
    if (!m || typeof m !== "object") m = {};
    var k = (konu || "Konu") + "|" + (ders || "Diğer");
    m[k] = (Number(m[k]) || 0) + 1;
    depoKoy("yanlisKonu", m);
    return m;
  }
  function istArttir(s) {
    var i = depoAl("ist", null);
    if (!i || typeof i !== "object") i = { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 };
    i.cozulen = (Number(i.cozulen) || 0) + s.soru;
    i.dogru = (Number(i.dogru) || 0) + s.dogru;
    i.yanlis = (Number(i.yanlis) || 0) + s.yanlis;
    i.bos = (Number(i.bos) || 0) + s.bos;
    depoKoy("ist", i);
    return i;
  }
  function gecmisOku() {
    var g = depoAl(DEPO_GECMIS, []);
    return Array.isArray(g) ? g.filter(function (x) { return x && typeof x === "object" && typeof x.net === "number"; }) : [];
  }
  function gecmisKaydet(ozet) {
    var g = depoAl(DEPO_GECMIS, []);
    if (!Array.isArray(g)) g = [];
    g.push(ozet);
    var yeni = g.slice(-GECMIS_LIMIT);
    depoKoy(DEPO_GECMIS, yeni);
    return yeni;
  }
  /** Sonucu diğer bölümlerin okuduğu kayıtlara işler.
   *  ustad.ka.denemeler → danaliz.js/koc-ai.js'in okuduğu deneme geçmişi biçimi
   *  ustad.danaliz.veri → KOÇ AI için ayrıntılı ayna kayıt
   *  ustad.yanlisKonu, ustad.ist → eksik konu avcısı ve istatistik */
  function aktar(s) {
    var rapor = { yazilan: [], hata: [] };
    try {
      var kayit = {
        id: s.id, tarih: s.tarih, tur: "Tam Sınav Simülasyonu",
        tDogru: s.dogru, tYanlis: s.yanlis, tBos: s.bos, net: s.net,
        yuzde: Math.round((s.dogru / TOPLAM_SORU) * 1000) / 10,
        gosterge: s.puan, puan: s.puan,
        Kalan: s.sureKalan, kalan: s.sureKalan,
        DogruYanlis: { dogru: s.dogru, yanlis: s.yanlis, bos: s.bos },
        dogruYanlis: s.dogru + "D " + s.yanlis + "Y " + s.bos + "B",
        dersler: s.dersler.map(function (x) { return { ders: x.ders, dogru: x.dogru, yanlis: x.yanlis, bos: x.bos, net: x.net }; }),
        sure: s.sureKullanilan
      };
      var liste = depoAl(DEPO_DENEME, []);
      if (!Array.isArray(liste)) liste = [];
      liste.push(kayit);
      depoKoy(DEPO_DENEME, liste.slice(-MAX_DENEME_KAYIT));
      rapor.yazilan.push(DEPO_DENEME);
    } catch (e) { rapor.hata.push(DEPO_DENEME); }

    try {
      s.enCokYanlisKonular.forEach(function (k) { yanlisKonuArttir(k.konu, k.ders); });
      rapor.yazilan.push("yanlisKonu");
    } catch (e) { rapor.hata.push("yanlisKonu"); }

    try { istArttir(s); rapor.yazilan.push("ist"); } catch (e) { rapor.hata.push("ist"); }

    var ozet = {
      id: s.id, tarih: s.tarih, net: s.net, puan: s.puan, yuzde: s.yuzde,
      dogru: s.dogru, yanlis: s.yanlis, bos: s.bos,
      sure: s.sureKullanilan, soru: s.soru,
      genelYetenekNet: s.genelYetenek.net, genelKulturNet: s.genelKultur.net,
      dersler: s.dersler.map(function (x) { return { ders: x.ders, dogru: x.dogru, yanlis: x.yanlis, bos: x.bos, net: x.net, basari: x.basari }; })
    };
    try { gecmisKaydet(ozet); rapor.yazilan.push(DEPO_GECMIS); } catch (e) { rapor.hata.push(DEPO_GECMIS); }

    try {
      depoKoy(DEPO_VERI, {
        kaynak: "Tam Sınav Simülasyonu", guncelleme: s.tarih, son: ozet,
        dersBazli: ozet.dersler,
        konuYanlis: s.enCokYanlisKonular.map(function (k) { return { ders: k.ders, konu: k.konu, yanlis: k.yanlis, dogru: k.dogru, bos: k.bos }; }),
        gecmis: gecmisOku()
      });
      rapor.yazilan.push(DEPO_VERI);
    } catch (e) { rapor.hata.push(DEPO_VERI); }

    /* ustalık istatistikleri (varsa) */
    try { if (window.ROZET && window.ROZET.olay) window.ROZET.olay("sinav", s); } catch (e) {}
    return rapor;
  }

  /* ─═══════════════ 14) GÖRÜNÜM: SONUÇ ═══════════════ */
  function bitir(otomatik) {
    if (!D.basladi || D.bitti) return false;
    D.otomatik = !!otomatik;
    D.duraklat = false;
    sayacDurdur();
    if (D.kalan <= 0) D.kalan = 0;
    D.bitti = true;
    var s = sonucHesapla();
    D.sonuc = s;
    var rapor = aktar(s);
    s.yazilan = rapor.yazilan;
    depoSil(DEPO_DURUM);
    sonucCiz(s);
    try { if (window.USTAD_MOTOR && window.USTAD_MOTOR.istatistik) window.USTAD_MOTOR.istatistik(); } catch (e) {}
    return true;
  }
  function kutular(s) {
    function k(etiket, deger, alt) { return "<div class='sinav-kutu'><b>" + kacis(deger) + "</b><span>" + kacis(etiket) + "</span><i>" + kacis(alt || "") + "</i></div>"; }
    return "<div class='sinav-kutular'>" +
      k("DOĞRU", s.dogru, "%" + s.yuzde) +
      k("YANLIŞ", s.yanlis, "4 yanlış 1 neti siler") +
      k("BOŞ", s.bos, "net getirmez") +
      k("NET", netYaz(s.net), "doğru − yanlış/4") +
      k("PUAN TAHMİNİ", s.puan, "30 + 70 × net/" + TOPLAM_SORU) +
      k("SÜRE", sureYaz(s.sureKullanilan), "kalan " + sureYaz(s.sureKalan)) +
      "</div>";
  }
  function dersTablosu(s) {
    var h = "<table class='sinav-tablo' id='sinavDersTablo'><thead><tr><th>Ders</th><th>Soru</th><th>Doğru</th><th>Yanlış</th>" +
      "<th>Boş</th><th>Net</th><th>Başarı</th></tr></thead><tbody>";
    s.dersler.forEach(function (x) {
      h += "<tr><td>" + dersSimg(x.ders) + " " + kacis(x.ders) + "</td><td class='rakam'>" + x.soru + "</td><td class='rakam'>" + x.dogru +
        "</td><td class='rakam'>" + x.yanlis + "</td><td class='rakam'>" + x.bos + "</td><td class='rakam'><b>" + netYaz(x.net) +
        "</b></td><td class='rakam'>%" + x.basari + "</td></tr>";
    });
    h += "<tr class='toplam'><td><b>TOPLAM</b></td><td class='rakam'><b>" + s.soru + "</b></td><td class='rakam'><b>" + s.dogru +
      "</b></td><td class='rakam'><b>" + s.yanlis + "</b></td><td class='rakam'><b>" + s.bos + "</b></td><td class='rakam'><b>" +
      netYaz(s.net) + "</b></td><td class='rakam'><b>%" + s.yuzde + "</b></td></tr>";
    h += "<tr><td colspan='3'>Genel Yetenek (" + s.genelYetenek.soru + " soru)</td><td class='rakam'>" + s.genelYetenek.dogru + "D</td>" +
      "<td class='rakam'>" + s.genelYetenek.yanlis + "Y</td><td class='rakam'><b>" + netYaz(s.genelYetenek.net) + "</b></td><td class='rakam'>—</td></tr>";
    h += "<tr><td colspan='3'>Genel Kültür (" + s.genelKultur.soru + " soru)</td><td class='rakam'>" + s.genelKultur.dogru + "D</td>" +
      "<td class='rakam'>" + s.genelKultur.yanlis + "Y</td><td class='rakam'><b>" + netYaz(s.genelKultur.net) + "</b></td><td class='rakam'>—</td></tr>";
    return h + "</tbody></table>";
  }
  function konuTablosu(s) {
    if (!s.enCokYanlisKonular.length) return "<p class='sinav-iyi-yazi' id='sinavKonuBos'>✔ Hiç yanlışın yok — konu bazlı eksik listesi boş.</p>";
    var h = "<table class='sinav-tablo' id='sinavKonuTablo'><thead><tr><th>#</th><th>Konu</th><th>Ders</th><th>Yanlış</th>" +
      "<th>Doğru</th><th>Boş</th></tr></thead><tbody>";
    s.enCokYanlisKonular.forEach(function (x, i) {
      h += "<tr><td class='rakam'>" + (i + 1) + "</td><td>" + kacis(x.konu) + "</td><td>" + kacis(x.ders) +
        "</td><td class='rakam'><b>" + x.yanlis + "</b></td><td class='rakam'>" + x.dogru + "</td><td class='rakam'>" + x.bos + "</td></tr>";
    });
    return h + "</tbody></table>";
  }
  function sureRaporu(s) {
    var yuzde = s.toplamSure ? Math.round((s.sureKullanilan / s.toplamSure) * 1000) / 10 : 0;
    return "<p id='sinavSureRapor'>⏱ <b>" + sureYaz(s.sureKullanilan) + "</b> kullandın (" + s.toplamSure / 60 + " dakikanın %" +
      yuzde + "'i), <b>" + sureYaz(s.sureKalan) + "</b> kaldı. Soru başına ortalama <b>" + s.sureOrt + " sn</b>. " +
      (s.otomatik ? "<b>Kâğıt süre bitince otomatik teslim edildi.</b>" : "Sınavı kendin bitirdin.") + "</p>";
  }
  function sonucCiz(s) {
    var a = alan(); if (!a) return null;
    D.gorunum = "sonuc";
    var h = "<div class='sinav-bolum sinav-ilk' id='sinavSonucIc'>" +
      "<h3 class='sinav-baslik'>📊 Sınav sonucu — " + kacis(trTarih(s.tarih)) + "</h3>" +
      kutular(s) + sureRaporu(s) +
      "<p class='sinav-ozet-yazi'>Genel Yetenek neti <b>" + netYaz(s.genelYetenek.net) + "</b> · Genel Kültür neti <b>" +
      netYaz(s.genelKultur.net) + "</b> · toplam <b>" + netYaz(s.net) + " net</b> · puan tahmini <b>" + s.puan + "/100</b>. " +
      "<span class='aciklama'>Puan tahmini gerçek KPSS ölçeklemesi değil, kendi netinin 100’lük yaklaşık karşılığıdır.</span></p>";
    if (s.uyarilar && s.uyarilar.length) {
      h += "<div class='sinav-banka-uyari'><b>⚠ Banka uyarısı (bu sınavda):</b><ul class='sinav-uyari-liste'>";
      s.uyarilar.forEach(function (x) {
        h += "<li>" + kacis(x.ders) + ": " + (x.tip === "yok" ? "bankada soru yok" : "bankada " + x.mevcut + " soru var, " + x.tekrar + " soru tekrar kullanıldı") + "</li>";
      });
      h += "</ul></div>";
    }
    h += "<div class='sinav-butonlar'>" +
      "<button class='buyuk-dugme' id='sinavYeni' type='button'>🔄 Yeni sınav</button>" +
      "<button class='ikincil-dugme' id='sinavSonucOptik' type='button'>🔎 Cevap kâğıdını gör</button>" +
      "<button class='ikincil-dugme yesil' id='sinavDanalizGit' type='button'>📈 Deneme Analizi’ne git</button>" +
      "</div></div>";

    h += "<div class='sinav-bolum' id='sinavOptikSonucKap'><h3 class='sinav-baslik'>1) Cevap kâğıdı dökümü</h3>" +
      "<div class='sinav-optik sinav-optik-sonuc' id='sinavOptikSonuc'>";
    D.sorular.forEach(function (x, i) {
      var c = D.cevaplar[i], cls = "sinav-optik-kutu ";
      if (c === undefined || c === null) cls += "sinav-optik-bos";
      else if (c === (x.soru || {}).dogru) cls += "sinav-optik-dogru";
      else cls += "sinav-optik-yanlis";
      if (D.isaretli[i]) cls += " sinav-optik-isaretli";
      h += "<button class='" + cls + "' type='button' data-no='" + i + "' title='" + kacis(x.ders + " · " + x.konu) + "'>" + (i + 1) + "</button>";
    });
    h += "</div><div class='sinav-optik-aciklama'><span class='sinav-ornek sinav-optik-dogru'></span> doğru " +
      "<span class='sinav-ornek sinav-optik-yanlis'></span> yanlış " +
      "<span class='sinav-ornek sinav-optik-bos'></span> boş</div></div>";

    h += "<div class='sinav-bolum'><h3 class='sinav-baslik'>2) Ders bazlı sonuç</h3>" + dersTablosu(s) + "</div>";
    h += "<div class='sinav-bolum'><h3 class='sinav-baslik'>3) En çok yanlış yaptığın konular</h3>" + konuTablosu(s) + "</div>";
    h += "<div class='sinav-bolum'><h3 class='sinav-baslik'>4) Sınava göre döküm (yazılı)</h3>" + dokum(s) + "</div>";
    h += "<div class='sinav-bolum'><h3 class='sinav-baslik'>5) Sınav geçmişi (son " + GECMIS_LIMIT + ")</h3>" +
      "<div id='sinavGecmisKutu'>" + gecmisTablosu() + "</div>" +
      "<p class='aciklama'>Kaydedilen yerler: <b>ustad.sinav.gecmis</b>, <b>ustad.ka.denemeler</b> (Deneme Analizi), " +
      "<b>ustad.yanlisKonu</b>, <b>ustad.ist</b>, <b>ustad.danaliz.veri</b> (KOÇ AI).</p></div>";

    a.innerHTML = h;
    var y = document.getElementById("sinavYeni");
    if (y) y.addEventListener("click", koru(sifirla, "yeni sınav"));
    var dg = document.getElementById("sinavDanalizGit");
    if (dg) dg.addEventListener("click", koru(function () { ekranGoster("danaliz"); }, "bölüme gitme"));
    var so = document.getElementById("sinavSonucOptik");
    if (so) so.addEventListener("click", koru(function () {
      var kap = document.getElementById("sinavOptikSonucKap");
      if (kap && kap.scrollIntoView) kap.scrollIntoView({ block: "start" });
    }, "optiğe gitme"));
    var os = document.getElementById("sinavOptikSonuc");
    if (os) os.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest(".sinav-optik-kutu") : null;
      if (!t) return;
      soruIncele(Number(t.getAttribute("data-no")));
    });
    return a;
  }
  /** Sonuç ekranında bir soruyu açıp doğru/yanlış dökümünü gösterir */
  function soruIncele(no) {
    var x = D.sorular[no]; if (!x) return false;
    var q = x.soru || {}, c = D.cevaplar[no];
    var durum = (c === undefined || c === null) ? "BOŞ" : (c === q.dogru ? "DOĞRU" : "YANLIŞ");
    var h = "<p class='sinav-soru-govde'><b>Soru " + x.no + " (" + durum + ") — " + kacis(x.ders) + " · " + kacis(x.konu) + "</b></p>" +
      "<p>" + kacis(q.soru || "") + "</p><ul class='sinav-incele-liste'>";
    (q.secenekler || []).forEach(function (s, si) {
      var im = si === q.dogru ? "✔" : (si === c ? "✘" : "•");
      h += "<li>" + im + " <b>" + HARFLER[si] + ")</b> " + kacis(s) + "</li>";
    });
    h += "</ul>" + (q.aciklama ? "<p class='aciklama'>💡 " + kacis(q.aciklama) + "</p>" : "");
    var k = document.getElementById("sinavIncele");
    if (!k) { k = document.createElement("div"); k.id = "sinavIncele"; k.className = "sinav-incele"; a_kap().appendChild(k); }
    k.innerHTML = h;
    return true;
  }
  function a_kap() { var a = document.getElementById("sinavAlan"); return a || document.body; }
  function dokum(s) {
    var h = "<ul class='sinav-dokum'>";
    h += "<li>Toplam soru: <b>" + s.soru + "</b> · doğru <b>" + s.dogru + "</b> · yanlış <b>" + s.yanlis + "</b> · boş <b>" + s.bos + "</b></li>";
    h += "<li>Net (doğru − yanlış/4): <b>" + netYaz(s.net) + "</b> → puan tahmini <b>" + s.puan + "/100</b></li>";
    s.dersler.forEach(function (x) {
      h += "<li>" + dersSimg(x.ders) + " <b>" + kacis(x.ders) + "</b>: " + x.soru + " soru · " + x.dogru + "D " + x.yanlis + "Y " + x.bos +
        "B · net " + netYaz(x.net) + " · başarı %" + x.basari + "</li>";
    });
    if (s.enCokYanlisKonular.length) {
      h += "<li>En çok yanlış: " + s.enCokYanlisKonular.slice(0, 5).map(function (k) { return kacis(k.konu) + " (" + k.yanlis + ")"; }).join(", ") + "</li>";
    }
    return h + "</ul>";
  }

  /* ─═══════════════ 15) DURUM KAYDI (yarıda kalan sınav) ═══════════════ */
  function durumKaydet() {
    if (!D.basladi || D.bitti || !D.sorular.length) return false;
    return depoKoy(DEPO_DURUM, {
      ts: Date.now(), kalan: D.kalan, i: D.i,
      bankaIdx: D.sorular.map(function (x) { return x.bankaIdx; }),
      cevaplar: D.cevaplar.map(function (c) { return (c === undefined || c === null) ? null : c; }),
      isaretli: D.isaretli, uyarilar: D.uyarilar, duraklat: D.duraklat
    });
  }
  function durumOku() {
    var d = depoAl(DEPO_DURUM, null);
    if (!d || typeof d !== "object" || !Array.isArray(d.bankaIdx) || !d.bankaIdx.length) return null;
    if (banka()) {
      var gecerli = true;
      d.bankaIdx.forEach(function (bi) { if (!banka()[bi]) gecerli = false; });
      if (!gecerli) return null;
    }
    return d;
  }

  /* ─═══════════════ 16) ÇIKIŞ ONAYI ═══════════════ */
  function cikisSor(kod, gitFn) {
    if (!(D.basladi && !D.bitti)) { if (gitFn) gitFn(); else ekranGoster(kod); return null; }
    var eski = document.getElementById("sinavCikisModal");
    if (eski && eski.parentNode) eski.parentNode.removeChild(eski);
    var kap = document.createElement("div");
    kap.id = "sinavCikisModal";
    kap.className = "sinav-modal";
    kap.innerHTML = "<div class='sinav-modal-ic'>" +
      "<b>Sınav yarıda kalacak</b>" +
      "<p>Şu an <b>" + cevapSayisi() + "</b> soru işaretli, <b>" + sureYaz(D.kalan) + "</b> süren kaldı. " +
      "Çıkarsan kaydın saklanır; <b>“devam et”</b> seçeneğiyle kâğıdı ve cevaplarını geri açabilirsin.</p>" +
      "<div class='sinav-modal-dugmeler'>" +
      "<button class='ikincil-dugme' id='sinavCikisVazgec' type='button'>Vazgeç, sınava devam et</button>" +
      "<button class='buyuk-dugme sinav-onay-dugme' id='sinavCikisOnayla' type='button'>Duraklat ve çık</button>" +
      "</div></div>";
    document.body.appendChild(kap);
    var vz = document.getElementById("sinavCikisVazgec");
    if (vz) vz.addEventListener("click", function () { modalKapat(); });
    var on = document.getElementById("sinavCikisOnayla");
    if (on) on.addEventListener("click", function () {
      modalKapat();
      duraklat();
      sinavdanCik();               /* kayıt saklanır, sınav kapanır → “devam et” seçeneği çıkar */
      if (gitFn) gitFn(); else ekranGoster(kod);
    });
    return kap;
  }
  function modalKapat() {
    var k = document.getElementById("sinavCikisModal");
    if (k && k.parentNode) k.parentNode.removeChild(k);
  }
  /** Sınav sürerken başka bölüme geçişi yakalar (yakalama evresi: motorun tıklamasından önce çalışır) */
  function cikisYakala(e) {
    if (!(D.basladi && !D.bitti)) return false;
    var t = e.target && e.target.closest ? e.target.closest("[data-git]") : null;
    if (!t) return false;
    var kod = t.getAttribute("data-git");
    if (kod === KILAVUZ_SAYFA) return false;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    cikisSor(kod, function () { ekranGoster(kod); });
    return true;
  }

  /* ─═══════════════ 17) MENÜ KAYDI (motor dosyasına dokunmadan) ═══════════════ */
  function menuEkle() {
    var kap = document.querySelector(".menu-icerik");
    if (!kap) return false;
    if (kap.querySelector('[data-git="sinav"]')) return true;
    var d = document.createElement("button");
    d.className = "menu-oge";
    d.setAttribute("data-git", "sinav");
    d.style.setProperty("--bolum", "var(--sinav)");
    d.innerHTML = "<span class='simg-renk'>🎯</span><span class='etiket'>Tam Sınav Simülasyonu</span>" +
      "<span class='rozet'>" + hedefSoru() + " soru · " + SURE_DK + " dk</span>";
    var son = kap.querySelector(".menu-oge[data-git='danaliz']");
    if (son && son.parentNode === kap) kap.insertBefore(d, son.nextSibling);
    else kap.appendChild(d);
    return true;
  }

  /* ─═══════════════ 18) ÇİZİM + SÖZLEŞME ═══════════════ */
  function ciz() {
    ekranKur();
    var kayit = durumOku();
    if (D.basladi && !D.bitti) { if (D.gorunum !== "sinav") sinavCiz(); else guncelleMu(); return document.getElementById("sinavAlan"); }
    if (D.bitti && D.sonuc) { if (D.gorunum !== "sonuc") sonucCiz(D.sonuc); return document.getElementById("sinavAlan"); }
    return baslangicCiz();
  }
  SINAV.bolumAc = function (kod) { if (kod === KILAVUZ_SAYFA) ciz(); };
  SINAV.ciz = ciz;
  SINAV.basla = koru(basla, "başlatma");
  SINAV.devamEt = koru(devamEt, "devam etme");
  SINAV.cevapla = koru(cevapla, "cevaplama");
  SINAV.bosBirak = koru(bosBirak, "boş bırakma");
  SINAV.bayrakDegistir = koru(bayrakDegistir, "bayraklama");
  SINAV.git = koru(git, "gezinme");
  SINAV.duraklat = koru(duraklat, "duraklatma");
  SINAV.devam = koru(devam, "devam");
  SINAV.sinavdanCik = koru(sinavdanCik, "sınavdan çıkma");
  SINAV.sifirla = koru(sifirla, "sıfırlama");
  SINAV.sayacDurdur = sayacDurdur;
  SINAV.sayacBaslat = sayacBaslat;
  SINAV.tik = tik;
  SINAV.bitir = koru(bitir, "bitirme");
  SINAV.soruIncele = koru(soruIncele, "soru inceleme");
  SINAV.cikisSor = koru(cikisSor, "çıkış onayı");
  SINAV.kagitUret = kagitUret;
  SINAV.netHesap = netHesap;
  SINAV.puanHesap = puanHesap;
  SINAV.sureYaz = sureYaz;
  SINAV.cetvel = cetvel;
  SINAV.dersHavuzu = function (ad) { return dersHavuzu(ad); };
  SINAV.banka = banka;
  SINAV.gecmisOku = gecmisOku;
  SINAV.gecmisKaydet = gecmisKaydet;
  SINAV.durumOku = durumOku;
  SINAV.ekranGoster = ekranGoster;
  SINAV.SURE_SN = SURE_SN;
  SINAV.SURE_DK = SURE_DK;
  SINAV.TOPLAM_SORU = TOPLAM_SORU;
  SINAV.GECMIS_LIMIT = GECMIS_LIMIT;
  SINAV.menuEkle = menuEkle;

  /* ─────────── kurulum ─────────── */
  ekranKur();
  ciz();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { menuEkle(); });
  else menuEkle();
  document.addEventListener("click", cikisYakala, true);
  try { window.addEventListener("beforeunload", function () { durumKaydet(); }); } catch (e) {}

  /* ════════════════ 19) KENDİ KENDİNİ TEST (?test=1) ════════════════ */
  if (location.search.indexOf("test=1") >= 0) {
    setTimeout(function () {
      var t = [];
      function ok(ad, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : "")); }

      /* eski localStorage hâlini sakla */
      function sakla(k) { try { return localStorage.getItem("ustad." + k); } catch (e) { return null; } }
      function koyHam(k, v) { try { if (v === null) localStorage.removeItem("ustad." + k); else localStorage.setItem("ustad." + k, v); } catch (e) {} }
      var ESKI = {};
      ["sinav.gecmis", "sinav.durum", "ka.denemeler", "yanlisKonu", "ist", "danaliz.veri", "kartlar"].forEach(function (k) { ESKI[k] = sakla(k); });
      /* test kendi sayaçlarını sıfırdan kurar; sonunda ESKI geri yazılır */
      ["sinav.gecmis", "sinav.durum", "ka.denemeler", "yanlisKonu", "ist", "danaliz.veri", "kartlar"].forEach(function (k) { depoSil(k); });
      var ESKI_SORULAR = window.USTAD_SORULAR;

      try {
        /* ── A) SÖZLEŞME + EKRAN KABI ── */
        ok("sözleşme: window.SINAV nesnesi kuruldu", !!window.SINAV && typeof window.SINAV === "object", typeof window.SINAV);
        ok("sözleşme: SINAV.bolumAc fonksiyon", typeof SINAV.bolumAc === "function");
        var kab = document.getElementById("ekran-sinav");
        ok("kabuk: #ekran-sinav oluşturuldu", !!kab);
        ok("kabuk: class 'ekran' ve data-bolum='sinav'", !!kab && kab.className.indexOf("ekran") >= 0 && kab.getAttribute("data-bolum") === "sinav",
          kab ? kab.className + " / " + kab.getAttribute("data-bolum") : "yok");
        ok("kabuk: #sinavAlan içinde", !!(kab && kab.querySelector("#sinavAlan")));
        ok("kabuk: document.body'ye eklendi", !!kab && kab.parentNode === document.body);
        var ilkBakis = document.getElementById("sinavAlan").innerHTML;
        SINAV.bolumAc("danaliz");
        ok("sözleşme: bolumAc yalnız 'sinav' kodunda çizer", document.getElementById("sinavAlan").innerHTML === ilkBakis, "değişmedi");
        SINAV.bolumAc("sinav");
        ok("görünüm: başlangıç ekranı çizildi", !!document.getElementById("sinavBasla"));

        /* ── B) KAĞIT ÜRETİMİ (120 soru + ders dağılımı) ── */
        var kagit = SINAV.kagitUret();
        var S = kagit.sorular;
        ok("kâğıt: 120 soru üretildi", S.length === 120, S.length + " soru");
        function dersSay(ad) { return S.filter(function (x) { return x.ders === ad; }).length; }
        ok("dağılım: Türkçe 30", dersSay("Türkçe") === 30, String(dersSay("Türkçe")));
        ok("dağılım: Matematik 30", dersSay("Matematik") === 30, String(dersSay("Matematik")));
        ok("dağılım: Tarih 27", dersSay("Tarih") === 27, String(dersSay("Tarih")));
        ok("dağılım: Coğrafya 18", dersSay("Coğrafya") === 18, String(dersSay("Coğrafya")));
        ok("dağılım: Vatandaşlık 9", dersSay("Vatandaşlık") === 9, String(dersSay("Vatandaşlık")));
        ok("dağılım: Güncel Bilgiler 6", dersSay("Güncel Bilgiler") === 6, String(dersSay("Güncel Bilgiler")));
        ok("dağılım: ders toplamı 120", dersSay("Türkçe") + dersSay("Matematik") + dersSay("Tarih") + dersSay("Coğrafya") + dersSay("Vatandaşlık") + dersSay("Güncel Bilgiler") === 120);
        ok("format: ilk 30 soru Türkçe (gerçek KPSS sırası)", S.slice(0, 30).every(function (x) { return x.ders === "Türkçe"; }));
        ok("format: 31-60 Matematik", S.slice(30, 60).every(function (x) { return x.ders === "Matematik"; }));
        ok("format: 61-87 Tarih", S.slice(60, 87).every(function (x) { return x.ders === "Tarih"; }));
        ok("format: 88-105 Coğrafya", S.slice(87, 105).every(function (x) { return x.ders === "Coğrafya"; }));
        ok("format: 106-114 Vatandaşlık", S.slice(105, 114).every(function (x) { return x.ders === "Vatandaşlık"; }));
        ok("format: 115-120 Güncel Bilgiler", S.slice(114, 120).every(function (x) { return x.ders === "Güncel Bilgiler"; }));
        var idx = S.map(function (x) { return x.bankaIdx; });
        var tekil = Object.keys(idx.reduce(function (a, b) { a[b] = 1; return a; }, {})).length;
        ok("tekrarsızlık: aynı soru iki kez yok", tekil === S.length, tekil + "/" + S.length + " tekil");
        ok("tekrarsızlık: soru metinleri de ayrık (çift metin yok)", (function () {
          var m = {}, cift = 0;
          S.forEach(function (x) { var k = String(x.soru.soru || "").trim().toLowerCase(); if (m[k]) cift++; m[k] = 1; });
          return cift === 0;
        })(), "çift metin");
        ok("soru: hepsi 4 seçenekli ve doğru 0-3", S.every(function (x) {
          var q = x.soru;
          return Array.isArray(q.secenekler) && q.secenekler.length === 4 && q.dogru >= 0 && q.dogru <= 3;
        }));
        ok("banka: uyarı listesi tutarlı (yalnız 'mevcut < istenen' dersler uyarır)",
          kagit.uyarilar.every(function (x) { return x.mevcut < x.istenen && x.istenen > 0; }), kagit.uyarilar.length + " uyarı");
        ok("banka: yeterli bankada hiç uyarı yok", kagit.uyarilar.length === 0, kagit.uyarilar.length + " uyarı");
        ok("süre: 130:00 başlangıcı", SINAV.sureYaz(SURE_SN) === "130:00", SINAV.sureYaz(SURE_SN));

        /* ── C) HESAP: KPSS NET KURALI ── */
        ok("net: 10 doğru 4 yanlış → 9 net", SINAV.netHesap(10, 4) === 9, String(SINAV.netHesap(10, 4)));
        ok("net: 0 doğru 0 yanlış → 0", SINAV.netHesap(0, 0) === 0);
        ok("net: 120 doğru → 120", SINAV.netHesap(120, 0) === 120);
        ok("puan: 120 net → 100", SINAV.puanHesap(120) === 100, String(SINAV.puanHesap(120)));
        ok("puan: 0 net → 30", SINAV.puanHesap(0) === 30, String(SINAV.puanHesap(0)));
        ok("puan: 30 + 70 × net/120 formülü", SINAV.puanHesap(60) === 65, String(SINAV.puanHesap(60)));
        ok("puan: 0-100 arasında kırpılıyor", SINAV.puanHesap(500) === 100 && SINAV.puanHesap(-500) === 0);

        /* ── D) SINAV BAŞLATMA ── */
        ok("başlatma: basla() true döndü", SINAV.basla() === true);
        ok("başlatma: kalan süre 7800 sn (130 dk)", D.kalan === 7800, String(D.kalan));
        ok("başlatma: sayaçta 130:00 yazıyor", (document.getElementById("sinavSayac") || {}).textContent === "130:00",
          (document.getElementById("sinavSayac") || {}).textContent);
        var kutular2 = $$("#sinavOptik .sinav-optik-kutu");
        ok("optik: ızgarada 120 kutu var", kutular2.length === 120, kutular2.length + " kutu");
        ok("optik: kutular 1..120 numaralı", kutular2[0].textContent === "1" && kutular2[119].textContent === "120");
        ok("soru kartı: 1. soru çizildi", /SORU 1 \//.test((document.getElementById("sinavSoruKart") || {}).textContent || ""));
        ok("soru kartı: 4 seçenek düğmesi", $$("#sinavSecenekler .sinav-secenek").length === 4);
        ok("başlatma: soru listesi 120 ve ilk i Türkçe", D.sorular.length === 120 && D.sorular[0].ders === "Türkçe");

        /* ── E) CEVAP İŞARETLEME ── */
        ok("cevap: cevapla(0,2) state'e yazdı", SINAV.cevapla(0, 2) === true && D.cevaplar[0] === 2, String(D.cevaplar[0]));
        ok("cevap: optik kutu 'cevapli' sınıfı aldı", kutular2[0].className.indexOf("sinav-optik-cevapli") >= 0, kutular2[0].className);
        ok("cevap: boş kutu 'bos' sınıfında", kutular2[1].className.indexOf("sinav-optik-bos") >= 0);
        ok("cevap: seçenek düğmesi işaretlendi", $$("#sinavSecenekler .sinav-secenek.secili").length === 1);
        ok("cevap: işaretli sayısı 1", /🖊 <b>1<\/b>/.test(document.getElementById("sinavIlerleme").innerHTML));
        ok("bayrak: bayrakla(0) işaretledi", SINAV.bayrakDegistir(0) === true && D.isaretli[0] === true);
        ok("bayrak: optik kutu 'isaretli' sınıfında", kutular2[0].className.indexOf("sinav-optik-isaretli") >= 0);
        ok("bayrak: ikinci çağrıda kalkıyor", SINAV.bayrakDegistir(0) === true && !D.isaretli[0]);
        ok("boş bırak: bosBirak(0) cevabı sildi", SINAV.bosBirak(0) === true && (D.cevaplar[0] === null || D.cevaplar[0] === undefined), String(D.cevaplar[0]));
        ok("gezinme: git(59) 60. soruya gitti", SINAV.git(59) === true && D.i === 59, String(D.i));
        ok("gezinme: optikte 'sorulan' tek kutu", $$("#sinavOptik .sinav-optik-sorulan").length === 1);
        kutular2[80].click();
        ok("optik tıklama: kutu 81 → soru 81", D.i === 80, String(D.i));
        ok("gezinme: sınır dışı reddedildi", SINAV.git(200) === false && SINAV.git(-5) === false);

        /* ── F) SAYAÇ / DURAKLAT / DEVAM / 5 DK UYARISI ── */
        var onceki = D.kalan;
        SINAV.tik();
        ok("sayaç: tik() süreyi 1 sn azalttı", D.kalan === onceki - 1, onceki + " → " + D.kalan);
        ok("sayaç: metin süreyle tutarlı (mm:ss)", document.getElementById("sinavSayac").textContent === SINAV.sureYaz(D.kalan),
          document.getElementById("sinavSayac").textContent + " = " + SINAV.sureYaz(D.kalan));
        ok("duraklat: aktif", SINAV.duraklat() === true && D.duraklat === true);
        var durmus = D.kalan; SINAV.tik();
        ok("duraklat: süre işlemiyor", D.kalan === durmus, String(D.kalan));
        ok("duraklat: maske göründü", document.getElementById("sinavDuraklaMaske").className.indexOf("sinav-gizli") < 0);
        ok("duraklat: cevaplama kilitli", SINAV.cevapla(D.i, 1) === false);
        ok("devam: aktif", SINAV.devam() === true && D.duraklat === false);
        ok("devam: maske yeniden gizlendi", document.getElementById("sinavDuraklaMaske").className.indexOf("sinav-gizli") >= 0);
        D.kalan = 301; SINAV.tik();
        ok("uyarı: 'kalan 5 dk' bandı çıktı", document.getElementById("sinavUyariBandi").className.indexOf("sinav-gizli") < 0);
        ok("uyarı: bant metni 'Son 5 dakika'", /Son 5 dakika/.test(document.getElementById("sinavUyariBandi").textContent),
          document.getElementById("sinavUyariBandi").textContent.slice(0, 40));
        SINAV.sayacDurdur();                      /* test boyunca gerçek saat işlemesin */

        /* ── G) SINAV SÜRERKEN BAŞKA BÖLÜME GEÇİŞ ENGELLEMESİ ── */
        var gercekGit = (window.USTAD_MOTOR || {}).git, cagri = 0;
        if (gercekGit) window.USTAD_MOTOR.git = function () { cagri++; return gercekGit.apply(null, arguments); };
        var menuAna = document.querySelector(".menu-oge[data-git='ana']");
        if (menuAna) menuAna.click();
        ok("çıkış: sınav sürerken bölüm değiştirme engellendi (motor.git çağrılmadı)", cagri === 0 && !!document.getElementById("sinavCikisModal"),
          cagri + " çağrı");
        ok("çıkış: onay penceresinde iki düğme var",
          !!document.getElementById("sinavCikisVazgec") && !!document.getElementById("sinavCikisOnayla"));
        if (document.getElementById("sinavCikisVazgec")) document.getElementById("sinavCikisVazgec").click();
        ok("çıkış: vazgeçince pencere kapandı, sınav sürüyor", !document.getElementById("sinavCikisModal") && D.bitti === false && D.basladi === true);
        if (window.USTAD_MOTOR) window.USTAD_MOTOR.git = gercekGit;

        /* ── H) YARIDA KALAN SINAV → “devam et” ── */
        var cevapliNo = 10;
        SINAV.git(cevapliNo); SINAV.cevapla(cevapliNo, 1);
        var kalanAni = D.kalan;
        ok("yarıda: çıkış onayı açıldı", !!SINAV.cikisSor("ana"));
        if (document.getElementById("sinavCikisOnayla")) document.getElementById("sinavCikisOnayla").click();
        ok("yarıda: çıkışta durum kaydı saklandı", !!localStorage.getItem("ustad.sinav.durum"));
        ok("yarıda: sınav kapandı ve bölüm değişti", D.basladi === false &&
          !document.getElementById("ekran-sinav").classList.contains("acik"), "ekran-sinav kapandı");
        SINAV.bolumAc("sinav");
        ok("yarıda: başlangıç görünümünde 'devam et' düğmesi", !!document.getElementById("sinavDevam"));
        ok("yarıda: 'devam et' kaydı özetliyor (işaretli soru/süre)", /işaretli/.test((document.getElementById("sinavDevam") || {}).textContent || ""),
          (document.getElementById("sinavDevam") || {}).textContent || "yok");
        document.getElementById("sinavDevam").click();
        ok("yarıda: devam edince kâğıt 120 soruyla geri geldi", D.basladi === true && D.sorular.length === 120, String(D.sorular.length));
        ok("yarıda: işaretlenen cevap korundu", D.cevaplar[cevapliNo] === 1, String(D.cevaplar[cevapliNo]));
        ok("yarıda: kalan süre korundu", D.kalan === kalanAni, kalanAni + " → " + D.kalan);
        ok("yarıda: soru numaraları 1..120 yeniden kuruldu", D.sorular[0].no === 1 && D.sorular[119].no === 120);
        SINAV.sayacDurdur();

        /* ── I) BİTİRME + SONUÇ ── */
        for (var i2 = 0; i2 < 120; i2++) {
          if (i2 % 4 === 0) D.cevaplar[i2] = D.sorular[i2].soru.dogru;             /* 30 doğru */
          else if (i2 % 4 === 1) D.cevaplar[i2] = (D.sorular[i2].soru.dogru + 1) % 4; /* 30 yanlış */
          else D.cevaplar[i2] = null;                                             /* 60 boş */
        }
        D.kalan = SINAV.SURE_SN - 3600;
        var bitirIlk = SINAV.bitir(false);
        ok("bitirme: bitir() true", bitirIlk === true && D.bitti === true);
        ok("bitirme: kalan süre metni sonuçta", /SÜRE/.test((document.getElementById("sinavSonucIc") || {}).textContent || ""));
        ok("sonuç: sonuç ekranı çizildi (#sinavSonucIc)", !!document.getElementById("sinavSonucIc"));
        var son = D.sonuc;
        ok("sonuç: doğru/yanlış/boş toplamı 120", son.dogru + son.yanlis + son.bos === 120,
          son.dogru + "+" + son.yanlis + "+" + son.bos);
        ok("sonuç: doğru 30 · yanlış 30 · boş 60", son.dogru === 30 && son.yanlis === 30 && son.bos === 60,
          son.dogru + "/" + son.yanlis + "/" + son.bos);
        ok("sonuç: net = doğru − yanlış/4 (22,5)", son.net === 22.5, String(son.net));
        ok("sonuç: puan formülü tutarlı", son.puan === SINAV.puanHesap(son.net), String(son.puan));
        ok("sonuç: ders tablosunda 6 ders + toplam + GY/GK satırı", $$("#sinavDersTablo tbody tr").length === 9, $$("#sinavDersTablo tbody tr").length + " satır");
        ok("sonuç: konu bazlı yanlış tablosu çizildi", !!document.getElementById("sinavKonuTablo"));
        ok("sonuç: süre kullanımı yazıldı", /kullandın/.test((document.getElementById("sinavSureRapor") || {}).textContent || ""));
        ok("sonuç: optik döküm 120 kutu", $$("#sinavOptikSonuc .sinav-optik-kutu").length === 120);
        ok("sonuç: doğru/yanlış/bos sınıfları var",
          $$("#sinavOptikSonuc .sinav-optik-dogru").length === 30 && $$("#sinavOptikSonuc .sinav-optik-yanlis").length === 30 &&
          $$("#sinavOptikSonuc .sinav-optik-bos").length === 60);
        ok("sonuç: Genel Yetenek/Kültür netleri ayrı yazıldı", typeof son.genelYetenek.net === "number" && typeof son.genelKultur.net === "number",
          son.genelYetenek.net + " / " + son.genelKultur.net);

        /* ── J) DIŞA AKTARMA ── */
        var g = SINAV.gecmisOku();
        ok("geçmiş: localStorage'a yazıldı", g.length === 1, g.length + " kayıt");
        ok("geçmiş: net ve puan kayıtta", g.length === 1 && g[0].net === son.net && g[0].puan === son.puan, g.length ? g[0].net + "/" + g[0].puan : "yok");
        var den = JSON.parse(localStorage.getItem("ustad.ka.denemeler") || "[]");
        ok("aktarım: ustad.ka.denemeler'e uyumlu kayıt", den.length === 1 && den[0].tDogru === 30 && typeof den[0].yuzde === "number" &&
          typeof den[0].gosterge === "number" && !!den[0].tarih && !!den[0].DogruYanlis, JSON.stringify(den[0] || {}).slice(0, 90));
        var yk = JSON.parse(localStorage.getItem("ustad.yanlisKonu") || "{}");
        ok("aktarım: ustad.yanlisKonu sayaçları arttı", Object.keys(yk).length > 0, Object.keys(yk).length + " anahtar");
        var ist = JSON.parse(localStorage.getItem("ustad.ist") || "{}");
        ok("aktarım: ustad.ist güncellendi", ist.cozulen === 120 && ist.dogru === 30 && ist.yanlis === 30 && ist.bos === 60, JSON.stringify(ist));
        var dv = JSON.parse(localStorage.getItem("ustad.danaliz.veri") || "null");
        ok("aktarım: ustad.danaliz.veri ayna kaydı", !!dv && dv.son && dv.son.net === son.net && Array.isArray(dv.dersBazli), dv ? "son net " + dv.son.net : "yok");
        ok("geçmiş: 20 kayıtla sınırlı", (function () {
          depoSil(DEPO_GECMIS);
          for (var i = 0; i < 25; i++) SINAV.gecmisKaydet({ id: "x" + i, tarih: new Date().toISOString(), net: i, puan: 50, dogru: 0, yanlis: 0, bos: 0, sure: 10 });
          return SINAV.gecmisOku().length === 20;
        })(), String(SINAV.gecmisOku().length));
        ok("bitirme: durum kaydı silindi", !localStorage.getItem("ustad.sinav.durum"));
        ok("sonuç: 'yeni sınav' düğmesi var", !!document.getElementById("sinavYeni"));
        document.getElementById("sinavYeni").click();
        ok("yeni sınav: başlangıç görünümüne döndü", !!document.getElementById("sinavBasla"));

        /* ── K) OTOMATİK BİTİRME (süre dolunca) ── */
        SINAV.basla();
        ok("otomatik: sınav yeniden başladı, süre 7800", D.kalan === 7800 && D.bitti === false);
        D.kalan = 2;
        SINAV.tik();
        SINAV.tik();
        ok("otomatik: süre dolunca sınav bitti", D.bitti === true, "bitti=" + D.bitti);
        ok("otomatik: sonuç ekranı çizildi", !!document.getElementById("sinavSonucIc"));
        ok("otomatik: sonuç 'otomatik teslim' bilgisi içeriyor", /otomatik/i.test((document.getElementById("sinavSureRapor") || {}).textContent || ""),
          (document.getElementById("sinavSureRapor") || {}).textContent ? document.getElementById("sinavSureRapor").textContent.slice(0, 44) : "yok");
        ok("otomatik: boş kâğıt net 0, puan 30", D.sonuc.dogru === 0 && D.sonuc.yanlis === 0 && D.sonuc.bos === 120 && D.sonuc.puan === 30,
          D.sonuc.dogru + "D/" + D.sonuc.bos + "B → " + D.sonuc.puan);

        /* ── L) YETERSİZ BANKA UYARISI (tekrar kullanımı) ── */
        var kucuk = [{ ders: "Türkçe", konu: "Paragraf", soru: "Küçük banka denemesi 1", secenekler: ["a", "b", "c", "d"], dogru: 0, metin: "", zorluk: "Kolay", tip: "Konu Testi" },
                     { ders: "Türkçe", konu: "Paragraf", soru: "Küçük banka denemesi 2", secenekler: ["a", "b", "c", "d"], dogru: 1, metin: "", zorluk: "Kolay", tip: "Konu Testi" },
                     { ders: "Matematik", konu: "Sayılar", soru: "Küçük banka denemesi 3", secenekler: ["a", "b", "c", "d"], dogru: 2, metin: "", zorluk: "Kolay", tip: "Konu Testi" }];
        window.USTAD_SORULAR = kucuk;
        var kk2 = SINAV.kagitUret();
        ok("yetersiz banka: 30 Türkçe soru üretildi (2 soru tekrar)", kk2.sorular.filter(function (x) { return x.ders === "Türkçe"; }).length === 30,
          kk2.sorular.filter(function (x) { return x.ders === "Türkçe"; }).length + " soru");
        ok("yetersiz banka: 'tekrar kullanıldı' uyarısı üretildi", kk2.uyarilar.some(function (x) { return x.tip === "tekrar" && x.ders === "Türkçe" && x.mevcut === 2 && x.istenen === 30; }),
          JSON.stringify(kk2.uyarilar.filter(function (x) { return x.ders === "Türkçe"; })));
        ok("yetersiz banka: bankada soru yok uyarısı (Güncel Bilgiler)", kk2.uyarilar.some(function (x) { return x.tip === "yok"; }));
        ok("yetersiz banka: eksik dersler için soru uydurulmadı (yalnız eldeki dersler)", (function () {
          var dersAdlari = {};
          kk2.sorular.forEach(function (x) { dersAdlari[x.ders] = 1; });
          return kk2.sorular.length === 60 && Object.keys(dersAdlari).length === 2;
        })(), kk2.sorular.length + " soru / " + Object.keys(kk2.sorular.reduce(function (a, x) { a[x.ders] = 1; return a; }, {})).join(","));
        ok("yetersiz banka: uyarı metni Türkçe'de 'tekrar' diyor", /tekrar kullanıl/.test(uyariListesiTest(kk2)), "metin");
        SINAV.basla();
        ok("yetersiz banka: sınav başladı ve uyarı bandı çıktı", D.basladi === true && document.getElementById("sinavUyariBandi").className.indexOf("sinav-gizli") < 0);
        SINAV.bitir(false);

        /* ── M) BOŞ BANKA ÇÖKME TESTİ ── */
        window.USTAD_SORULAR = [];
        SINAV.sifirla();
        var cokme = null, kk3 = null;
        try { kk3 = SINAV.kagitUret(); } catch (e) { cokme = e.message; }
        ok("boş banka: kagitUret() çökmüyor", cokme === null, cokme || "sorunsuz");
        ok("boş banka: soru üretilmedi, her ders için uyarı var", kk3 && kk3.sorular.length === 0 && kk3.uyarilar.length === 6, kk3 ? kk3.sorular.length + " soru / " + kk3.uyarilar.length + " uyarı" : "—");
        var c2 = null;
        try { ciz(); } catch (e) { c2 = e.message; }
        ok("boş banka: ciz() çökmüyor", c2 === null, c2 || "sorunsuz");
        ok("boş banka: 'soru bankası boş' uyarısı görünüyor", !!document.getElementById("sinavBankaBos"));
        var c3 = null;
        try { var r = SINAV.basla(); if (r !== false) c3 = "başladı"; } catch (e) { c3 = e.message; }
        ok("boş banka: sınav başlatılmıyor, çökme yok", c3 === null, c3 || "reddedildi");
        ok("boş banka: başlangıç görünümü ayakta", !!document.getElementById("sinavBasla"));

        /* ── N) MENÜ KAYDI + SON TEMİZLİK ── */
        window.USTAD_SORULAR = ESKI_SORULAR;
        ok("menü: kabuk bölümü menüye eklendi", !!document.querySelector(".menu-oge[data-git='sinav']"));
        ok("menü: tıklanınca bölüm açılıyor", (function () {
          var b = document.querySelector(".menu-oge[data-git='sinav']");
          if (!b) return false;
          b.click();
          var k = document.getElementById("ekran-sinav");
          return !!k && k.classList.contains("acik");
        })());
        ok("menü: tıklama sonrası ekran çizildi", !!document.getElementById("sinavAlan").innerHTML.length);

        /* eski hâle dön */
        depoSil(DEPO_DURUM);
        Object.keys(ESKI).forEach(function (k) { koyHam(k, ESKI[k]); });
        window.USTAD_SORULAR = ESKI_SORULAR;
        ciz();
      } catch (e) {
        ok("TEST ÇALIŞMASI tamamlandı", false, "beklenmeyen hata: " + (e && e.message ? e.message : e));
      }

      var gecen = t.filter(function (x) { return x.indexOf("✔") === 0; }).length;
      var kap = document.createElement("div");
      kap.id = "sinavTestSonuc";
      kap.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
      kap.innerHTML = "<h3>ÜSTAD TAM SINAV SİMÜLASYONU testi</h3>" +
        t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
        "<hr><b>" + gecen + " / " + t.length + " geçti</b>";
      document.body.appendChild(kap);
      document.title = (document.title || "") + " SINAVTEST " + gecen + "/" + t.length;

      function uyariListesiTest(kagit) {
        var gecici = document.createElement("div");
        gecici.innerHTML = uyariListesi(kagit);
        return gecici.textContent || "";
      }
    }, 600);
  }
})();
