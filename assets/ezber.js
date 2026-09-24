/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Ezber Kartları (formül/kural/kod) · TÜM HAKLARI SAKLIDIR (5846 FSEK). */
/* Ezber Kartları bölümü: formül/kural ve güncel bilgi desteleri — çevir-öğren, kendini değerlendir, sesli oku.
   Kaynakların HEPSİ mevcut içerikten TÜRETİLİR; hiçbir kart uydurulmaz: her kartın ARKA yüzü,
   kaynak dosyadaki bir cümlenin birebir aynısıdır.
     · icerik/notlar.js      → window.USTAD_NOTLAR  (Matematik notları: püf noktaları + formül/kural cümleleri)
     · icerik/sorular.js     → window.USTAD_SORULAR (ders|konu başına soru açıklaması = püf noktası)
     · icerik/kpss-guncel.js → window.KPSS_GUNCEL   (2026 güncel bilgi maddeleri)
     · localStorage "ustad.kartlar" (yanlış yapılan sorular — kartlar.js havuzu)
   İlerleme cihazda localStorage "ustad.ezber" içinde tutulur: { "<deste>::<kartId>": {bildi, kez, sonTarih} }.
   Ağ erişimi YOKTUR. Bölüm rengi: var(--ezber)/var(--ezber2). */
(function () {
  "use strict";

  var A = window.EZBER = window.EZBER || {};

  var DEPO = "ustad.ezber";        // ilerleme deposu
  var KAYNAK_DEPO = "ustad.kartlar"; // yanlış yapılan sorular (kartlar.js yazar)
  var HARFLER = ["A", "B", "C", "D", "E", "F"];

  /* çalışma durumu: açık deste, kuyruk (destede kalan kartlar), sıra, kart açık mı, sesli akış */
  var DURUM = { deste: null, kuyruk: [], sira: 0, acik: false, ses: null };

  /* ───────────── yardımcılar ───────────── */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function sadeles(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  /* çok satırlı metin (yanlış soru + şıklar): satır sonları korunur, satır içi boşluklar sadeleşir */
  function sadelesCok(s) {
    return String(s == null ? "" : s).split("\n").map(sadeles).filter(Boolean).join("\n");
  }
  function kisalt(s, n) {
    s = sadeles(s);
    if (s.length <= n) return s;
    var k = s.slice(0, n), i = k.lastIndexOf(" ");
    return (i > n * 0.5 ? k.slice(0, i) : k).replace(/[,;:]$/, "").trim() + " …";
  }
  /* cümlelere böl (yalnız . ! ? — noktalı virgül cümle içi bağdır, koparılmaz) */
  function tamCumleler(metin) {
    return sadeles(metin).split(/(?<=[.!?])\s+/).map(sadeles).filter(function (c) { return c.length > 1; });
  }
  /* veri yapısındaki tüm metinleri (JSON kaçışı OLMADAN) düz metne çevir — kaynak doğrulaması için */
  function metinTopla(o) {
    if (typeof o === "string") return o + " ";
    if (Array.isArray(o)) return o.map(metinTopla).join(" ");
    if (o && typeof o === "object") return Object.keys(o).map(function (k) { return metinTopla(o[k]); }).join(" ");
    return "";
  }
  function iki(n) { return (n < 10 ? "0" : "") + n; }
  function tarihIso() { return new Date().toISOString(); }

  /* ───────────── kaynak veriler ───────────── */
  function notlar() { return Array.isArray(window.USTAD_NOTLAR) ? window.USTAD_NOTLAR : []; }
  function sorular() { return Array.isArray(window.USTAD_SORULAR) ? window.USTAD_SORULAR : []; }
  function guncelMaddeler() {
    var g = window.KPSS_GUNCEL;
    return (g && Array.isArray(g.maddeler)) ? g.maddeler : [];
  }
  function yanlisKayitlar() {
    try {
      var s = localStorage.getItem(KAYNAK_DEPO);
      if (!s) return [];
      var o = JSON.parse(s);
      if (!o || typeof o !== "object" || Array.isArray(o)) return [];
      return Object.keys(o).map(function (k) { return o[k]; }).filter(function (k) { return k && typeof k === "object"; });
    } catch (e) { return []; }
  }

  /* ───────────── ilerleme deposu (ustad.ezber) ───────────── */
  function ezOku() {
    try {
      var s = localStorage.getItem(DEPO);
      if (!s) return {};
      var o = JSON.parse(s);
      return (o && typeof o === "object" && !Array.isArray(o)) ? o : {};
    } catch (e) { return {}; }
  }
  function ezYaz(o) { try { localStorage.setItem(DEPO, JSON.stringify(o)); } catch (e) {} }
  function anahtar(desteId, kartId) { return String(desteId) + "::" + String(kartId); }
  function kayitAl(desteId, kartId) { return ezOku()[anahtar(desteId, kartId)] || null; }

  A.depo = function () { return ezOku(); };

  /** Kartı işaretler: bildi=true → "biliyorum", false → "tekrar göster".
      kez her işaretlemede artar, sonTarih ISO olarak yazılır. */
  A.isaretle = function (desteId, kartId, bildi) {
    var o = ezOku(), k = anahtar(desteId, kartId);
    var m = o[k] || { kez: 0 };
    m.bildi = !!bildi;
    m.kez = (parseInt(m.kez, 10) || 0) + 1;
    m.sonTarih = tarihIso();
    o[k] = m;
    ezYaz(o);
    return m;
  };

  /* ───────────── kart üretimi (ön yüz = soru/başlık, arka yüz = kaynaktan BİREBİR) ───────────── */

  /* Ön yüz: arka yüzdeki cümleden türetilen ipucu (formülde "= …", tanımda ana cümle). */
  function onYuz(cumle, konu) {
    var s = sadeles(cumle);
    var i = s.indexOf("=");
    if (i > 0 && i <= 90 && i < s.length - 2) return sadeles(s.slice(0, i + 1)) + " …";
    var p = s.split(/[;:]/)[0];
    if (p.length >= 24 && p.length < s.length - 3) return sadeles(p) + " …";
    if (s.length > 70) return kisalt(s, 70);
    return sadeles(konu || "Kural") + " — bu kural ne diyor?";
  }

  function kartYap(o) {
    return {
      id: o.id, deste: o.deste, on: sadelesCok(o.on), arka: sadeles(o.arka),
      konu: sadeles(o.konu || ""), tur: o.tur || "kural",
      kaynak: sadeles(o.kaynak || ""), ek: sadeles(o.ek || "")
    };
  }

  /* 1) MATEMATİK FORMÜLLERİ — Matematik notlarının püf noktaları + formül/kural cümleleri */
  function matDeste() {
    var kartlar = [], gor = {};
    var matNotlar = notlar().filter(function (n) { return n && n.ders === "Matematik"; });
    var pufSayi = 0, cumleSayi = 0;
    function ekle(id, cumle, tur, baslik, konu) {
      var c = sadeles(cumle);
      if (c.length < 25) return;
      var imza = c.slice(0, 70);
      if (gor[imza]) return;
      gor[imza] = 1;
      kartlar.push(kartYap({
        id: id, deste: "mat", on: onYuz(c, konu), arka: c, tur: tur,
        konu: "Matematik · " + sadeles(ilkKonu(konu)),
        kaynak: "Ders Notları · " + sadeles(baslik)
      }));
    }
    matNotlar.forEach(function (n, ni) {
      (n.pufNoktalar || []).forEach(function (p, pi) {
        var once = kartlar.length;
        ekle("n" + ni + "p" + pi, p, "püf noktası", n.baslik, n.konu);
        if (kartlar.length > once) pufSayi++;
      });
      (n.metin || []).forEach(function (m) {
        tamCumleler(m).forEach(function (c, ci) {
          if (!/=/.test(c) && !/\d\s*[·×:/]\s*\d/.test(c) && !/(kural|formül|bağıntı|eşitli)/i.test(c)) return;
          var once = kartlar.length;
          ekle("n" + ni + "m" + ci, c, "formül/kural", n.baslik, n.konu);
          if (kartlar.length > once) cumleSayi++;
        });
      });
    });
    return {
      id: "mat", ad: "Matematik Formülleri", simge: "🧮",
      aciklama: "Matematik notlarındaki formül ve kural cümleleri.",
      kaynak: "icerik/notlar.js · " + matNotlar.length + " Matematik notu",
      ayrinti: sadeles(matNotlar.length + " Matematik notundan " + pufSayi + " püf noktası + " +
        cumleSayi + " formül/kural cümlesi → " + kartlar.length + " kart"),
      kartlar: kartlar
    };
  }

  function ilkKonu(konu) {
    var p = sadeles(konu).split(",")[0];
    return p || sadeles(konu);
  }
  function konuNotu(konu) {
    var hedef = sadeles(konu);
    var bul = null;
    notlar().forEach(function (n) {
      if (bul) return;
      var parcalar = sadeles(n.konu).split(",").map(sadeles);
      if (parcalar.indexOf(hedef) >= 0) bul = n;
    });
    return bul;
  }

  /* 2) DERS KURAL HATIRLATMALARI — her ders|konu için soru açıklamasının ilk cümlesi (püf noktası) */
  function kuralDeste() {
    var kartlar = [], gor = {}, notSayi = 0;
    sorular().forEach(function (s) {
      if (!s || !s.ders || !s.konu) return;
      var anahtar = s.ders + "|" + s.konu;
      if (gor[anahtar]) return;
      gor[anahtar] = 1;
      var acik = tamCumleler(s.aciklama || "")[0] || "";
      if (acik.length < 20) return;
      var n = konuNotu(s.konu);
      var ek = "";
      if (n && sadeles(n.sinavIpucu)) { ek = "📚 Not ipucu: " + sadeles(n.sinavIpucu); notSayi++; }
      kartlar.push(kartYap({
        id: "k" + kartlar.length, deste: "kural",
        on: sadeles(s.konu) + " — püf noktası ne?", arka: acik,
        tur: "kural hatırlatma", konu: s.ders + " · " + sadeles(s.konu),
        kaynak: "Soru Bankası · " + s.ders + " · " + sadeles(s.konu) + " açıklaması", ek: ek
      }));
    });
    return {
      id: "kural", ad: "Ders Kural Hatırlatmaları", simge: "📌",
      aciklama: "Her dersin konu başlığı için soru açıklamalarından çıkarılan püf noktası.",
      kaynak: "icerik/sorular.js · " + sorular().length + " soru",
      ayrinti: sadeles(Object.keys(gor).length + " ders-konu başlığından " + kartlar.length +
        " kural kartı (" + notSayi + " kartta ders notu ipucu eklendi)"),
      kartlar: kartlar
    };
  }

  /* 3) GÜNCEL BİLGİ KARTLARI — KPSS_GUNCEL.maddeler */
  function guncelDeste() {
    var kartlar = [];
    guncelMaddeler().forEach(function (m, i) {
      var bilgi = sadeles(m.bilgi);
      if (!bilgi) return;
      kartlar.push(kartYap({
        id: "g" + (i + 1), deste: "guncel", on: sadeles(m.konu), arka: bilgi,
        tur: "güncel bilgi", konu: "Güncel Bilgiler",
        kaynak: "icerik/kpss-guncel.js · " + sadeles(m.kaynak_ad || "kaynak") +
          (m.tarih ? " (" + sadeles(m.tarih) + ")" : "")
      }));
    });
    return {
      id: "guncel", ad: "Güncel Bilgi Kartları", simge: "📰",
      aciklama: "2026 güncel bilgiler paketindeki her madde; arka yüzünde kaynağı yazar.",
      kaynak: "icerik/kpss-guncel.js · derleme " + sadeles((window.KPSS_GUNCEL || {}).derleme || "-"),
      ayrinti: sadeles(guncelMaddeler().length + " madde → " + kartlar.length + " kart (her kartta kaynak adı)"),
      kartlar: kartlar
    };
  }

  /* 4) YANLIŞ YAPTIĞIM SORULAR — localStorage "ustad.kartlar" kayıtları */
  function yanlisDeste() {
    var kayitlar = yanlisKayitlar(), kartlar = [];
    kayitlar.sort(function (a, b) { return (parseInt(b.kez, 10) || 0) - (parseInt(a.kez, 10) || 0); });
    kayitlar.forEach(function (k) {
      var soru = sadeles(k.soru || k.metin || "");
      if (soru.length < 10) return;
      var sec = Array.isArray(k.secenekler) ? k.secenekler : [];
      var di = (typeof k.dogru === "number") ? k.dogru : -1;
      var on = soru;
      if (sec.length) on += "\n" + sec.map(function (x, i) { return HARFLER[i] + ") " + sadeles(x); }).join("  ");
      var arka = "";
      if (di >= 0 && sec[di]) arka += "✔ Doğru cevap: " + HARFLER[di] + ") " + sadeles(sec[di]) + "\n";
      arka += sadeles(k.aciklama || "");
      if (!sadeles(arka)) arka = "✔ Doğru cevap: " + (di >= 0 ? HARFLER[di] : "-");
      kartlar.push(kartYap({
        id: "y|" + String(k.id || kartlar.length), deste: "yanlis", on: on, arka: arka,
        tur: "yanlış yaptığım soru", konu: sadeles((k.ders || "") + " · " + (k.konu || "")),
        kaynak: "Yanlış Defterim · " + (parseInt(k.kez, 10) || 0) + " kez yanlış yapıldı"
      }));
    });
    return {
      id: "yanlis", ad: "Yanlış Yaptığım Sorular", simge: "✍️",
      aciklama: "Testlerde yanlış yaptığın sorular: ön yüzü soru, arka yüzü doğru cevap + açıklama.",
      kaynak: "localStorage ustad.kartlar",
      ayrinti: "ustad.kartlar havuzundan " + kartlar.length + " soru kartı",
      kartlar: kartlar
    };
  }

  function destelerUret() { return [matDeste(), kuralDeste(), guncelDeste(), yanlisDeste()]; }

  A.desteler = function () { return destelerUret(); };
  A.kartlar = function (id) {
    var d = destelerUret().filter(function (x) { return x.id === id; })[0];
    return d ? d.kartlar : [];
  };
  function desteBul(id) {
    return destelerUret().filter(function (x) { return x.id === id; })[0] || null;
  }

  /* ───────────── ölçüm: gösterge ve ilerleme ───────────── */
  A.ilerleme = function (desteId) {
    var d = desteBul(desteId);
    var o = ezOku(), bilinen = 0, tekrar = 0, toplam = 0;
    if (d) d.kartlar.forEach(function (k) {
      toplam++;
      var m = o[anahtar(d.id, k.id)];
      if (m && m.bildi === true) bilinen++;
      else if (m && m.bildi === false && (parseInt(m.kez, 10) || 0) > 0) tekrar++;
    });
    return { toplam: toplam, bilinen: bilinen, tekrar: tekrar, yuzde: toplam ? Math.round(bilinen / toplam * 100) : 0 };
  };

  A.ozet = function () {
    var ds = destelerUret(), o = ezOku(), kartSayisi = 0, bilinen = 0, tekrar = 0;
    ds.forEach(function (d) {
      d.kartlar.forEach(function (k) {
        kartSayisi++;
        var m = o[anahtar(d.id, k.id)];
        if (m && m.bildi === true) bilinen++;
        else if (m && m.bildi === false && (parseInt(m.kez, 10) || 0) > 0) tekrar++;
      });
    });
    return { desteSayisi: ds.length, kartSayisi: kartSayisi, bilinen: bilinen, tekrar: tekrar };
  };

  /* ───────────── çalışma akışı ───────────── */
  A.desteAc = function (id) {
    var d = desteBul(id);
    if (!d) return false;
    DURUM.deste = id;
    DURUM.kuyruk = d.kartlar.slice(0);
    DURUM.sira = 0;
    DURUM.acik = false;
    geciciDurum = "";
    ciz();
    return true;
  };
  A.desteKapat = function () {
    A.dinlemeyiDurdur(true);
    DURUM.deste = null; DURUM.kuyruk = []; DURUM.sira = 0; DURUM.acik = false;
    ciz();
  };
  A.durum = function () {
    return { deste: DURUM.deste, sira: DURUM.sira, toplam: DURUM.kuyruk.length, acik: DURUM.acik, ses: !!DURUM.ses };
  };
  A.kuyruk = function () { return DURUM.kuyruk.map(function (k) { return k.id; }); };
  A.durumKart = function () { return DURUM.kuyruk[DURUM.sira] || null; };

  A.cevir = function () {
    if (!DURUM.deste) return false;
    DURUM.acik = !DURUM.acik;
    geciciDurum = DURUM.acik ? "Kart çevrildi: cevap görünüyor." : "";
    ciz();
    return DURUM.acik;
  };
  A.biliyorum = function () {
    if (!DURUM.deste) return false;
    var k = A.durumKart();
    if (!k) return false;
    A.isaretle(DURUM.deste, k.id, true);
    var mesaj = "✔ Bilinen olarak işaretlendi (desteden düştü sayılmaz, ilerleme sayılır).";
    if (DURUM.sira < DURUM.kuyruk.length - 1) DURUM.sira++;
    else mesaj = "Deste bitti — bu destedeki kartların %" + A.ilerleme(DURUM.deste).yuzde + "'ini biliyorsun.";
    DURUM.acik = false;
    geciciDurum = mesaj;
    ciz();
    return true;
  };
  /* "Tekrar göster": kart destede KALIR (kaydı bildi=false), kuyruğun sonuna atılır. */
  A.tekrarGoster = function () {
    if (!DURUM.deste) return false;
    var k = A.durumKart();
    if (!k) return false;
    A.isaretle(DURUM.deste, k.id, false);
    DURUM.kuyruk.splice(DURUM.sira, 1);
    DURUM.kuyruk.push(k);
    if (DURUM.sira >= DURUM.kuyruk.length) DURUM.sira = 0;
    DURUM.acik = false;
    geciciDurum = "⟳ «" + kisalt(k.on, 40) + "» deste sonuna alındı (tekrar edilecek).";
    ciz();
    return true;
  };
  A.geri = function () {
    if (!DURUM.deste) return false;
    DURUM.sira = Math.max(0, DURUM.sira - 1);
    DURUM.acik = false;
    geciciDurum = "";
    ciz();
    return DURUM.sira;
  };
  A.karistir = function () {
    if (!DURUM.deste) return false;
    for (var i = DURUM.kuyruk.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var g = DURUM.kuyruk[i]; DURUM.kuyruk[i] = DURUM.kuyruk[j]; DURUM.kuyruk[j] = g;
    }
    DURUM.sira = 0; DURUM.acik = false;
    geciciDurum = "🔀 Deste karıştırıldı.";
    ciz();
    return true;
  };

  /* ───────────── sesli okuma (assets/ses.js gerçek API'si) ───────────── */
  function sesKonus(metin, secenek) {
    try {
      var S = window.KPSS_SES;
      if (S && typeof S.konus === "function") S.konus(metin, secenek || {});
    } catch (e) {}
  }
  function sesSus() {
    try {
      var S = window.KPSS_SES;
      if (S && typeof S.durdur === "function") S.durdur();
    } catch (e) {}
  }
  function sesMetni(k, acik, sira) {
    var t = "";
    if (typeof sira === "number") t = (sira + 1) + ". kart. ";
    t += sadeles(k.on).replace(/…/g, "");
    if (acik) t += ". Cevap: " + sadeles(k.arka).replace(/✔/g, "");
    return sadeles(t) + " .";
  }

  A.kartMetni = function () {
    var k = A.durumKart();
    return k ? sesMetni(k, DURUM.acik, DURUM.sira) : "";
  };
  /** "🔊 Kartı oku": önce soru, cevap açıksa cevabı da okur. Okunan metni döndürür. */
  A.kartOku = function () {
    var k = A.durumKart();
    if (!k) return "";
    var m = sesMetni(k, DURUM.acik, DURUM.sira);
    sesKonus(m, { zorla: true });
    return m;
  };
  A.sesDurumu = function () {
    return DURUM.ses ? { caliyor: true, i: DURUM.ses.i } : { caliyor: false, i: null };
  };
  A.dinlemeyiDurdur = function (sessiz) {
    if (DURUM.ses) DURUM.ses.devam = false;
    DURUM.ses = null;
    sesSus();
    if (!sessiz) ciz();
    return true;
  };
  function okut() {
    var S = DURUM.ses;
    if (!S || !S.devam) return;
    if (S.i >= DURUM.kuyruk.length) { A.dinlemeyiDurdur(); return; }
    DURUM.sira = S.i;
    DURUM.acik = true;
    S.token++;
    var tk = S.token;
    var kart = A.durumKart();
    ciz();
    if (!kart) { A.dinlemeyiDurdur(); return; }
    sesKonus(sesMetni(kart, true, S.i), {
      zorla: true,
      bitti: function () {
        if (!DURUM.ses || DURUM.ses !== S || S.token !== tk || !S.devam) return;
        S.i++;
        okut();
      }
    });
  }
  /** "🔊 Desteyi dinle": sırayla okur, kartı çevirir, ilerler. Açıksa durdurur. */
  A.desteDinle = function () {
    if (!DURUM.deste) return false;
    if (DURUM.ses) { A.dinlemeyiDurdur(); return false; }
    if (!DURUM.kuyruk.length) return false;
    DURUM.ses = { i: DURUM.sira, devam: true, token: 0 };
    okut();
    return true;
  };

  /* ───────────── sıfırlama ───────────── */
  function onayla(mesaj) {
    try { if (typeof window.confirm === "function") return window.confirm(mesaj); } catch (e) {}
    return true;
  }
  A.sifirla = function () {
    if (!onayla("Ezber kartları ilerlemesi silinsin mi? (Bilinen kartlar sıfırlanacak)")) return false;
    try { localStorage.removeItem(DEPO); } catch (e) {}
    ciz();
    durumCiz("İlerleme sıfırlandı — tüm kartlar yeniden 'bilinmiyor' durumunda.");
    return true;
  };

  /* ───────────── arayüz ───────────── */
  var geciciDurum = "";   // son işlem bildirimi (çizimden sonra yazılır)
  function durumCiz(metin) {
    geciciDurum = metin || "";
    var el = $("#ezDurum");
    if (el) el.textContent = geciciDurum;
  }

  function cubukHtml(yuzde) {
    return '<div class="ez-cubuk"><i style="width:' + yuzde + '%"></i></div>';
  }

  function desteSatiri(d) {
    var il = A.ilerleme(d.id);
    var bos = d.kartlar.length === 0;
    var h = '<div class="ez-deste' + (DURUM.deste === d.id ? " secili" : "") + '" data-deste="' + kacis(d.id) + '">' +
      '<div class="ez-deste-ust"><b>' + d.simge + " " + kacis(d.ad) + "</b>" +
      '<span class="ka-etiket">' + d.kartlar.length + " kart</span>" +
      '<span class="ka-etiket">Kaynak: ' + kacis(d.kaynak) + "</span></div>" +
      '<p class="ez-deste-yazi">' + kacis(d.ayrinti) + "</p>";
    if (bos) {
      h += '<div class="ez-bos"><p><b>' + kacis(d.ad) + " şu an boş.</b> " + kacis(d.aciklama) + "</p>" +
        '<p class="aciklama">Testlerde ya da denemede yanlış yaptığın sorular otomatik olarak bu desteye düşer.</p>' +
        '<button class="ka-dugme" data-ez-git="testler" style="--bolum:var(--ezber)">📝 Teste git</button></div>';
    } else {
      h += '<div class="ez-cubuk-bas"><span>Bu destede <span class="ez-yuzde">%' + il.yuzde + "</span> biliyorsun</span>" +
        "<span>" + il.bilinen + "/" + il.toplam + " bilinen · " + il.tekrar + " tekrar</span></div>" +
        cubukHtml(il.yuzde) +
        '<div class="ez-butonlar">' +
        '<button class="ka-dugme" data-ez-ac="' + kacis(d.id) + '" style="--bolum:var(--ezber)">🃏 Çalış</button>' +
        '<button class="ka-dugme ka-ikincil" data-ez-dinle="' + kacis(d.id) + '">🔊 Desteyi dinle</button>' +
        "</div>";
    }
    return h + "</div>";
  }

  function calismaHtml() {
    var d = desteBul(DURUM.deste);
    if (!d) return "";
    var k = A.durumKart();
    var il = A.ilerleme(d.id);
    var h = '<div class="ez-blok" id="ezCalisma">' +
      '<div class="ez-calisma-bas"><b>' + d.simge + " " + kacis(d.ad) + "</b>" +
      '<span class="ka-etiket" id="ezCalSira">' + (DURUM.sira + 1) + " / " + DURUM.kuyruk.length + "</span>" +
      '<span class="ka-etiket">Bilinen: ' + il.bilinen + "</span>" +
      '<span class="ka-etiket">Tekrar: ' + il.tekrar + "</span>" +
      '<button class="ka-mini ez-calisma-geri" id="ezCalKapat">← Desteler</button></div>';
    if (!k) {
      h += '<div class="ez-bos"><p><b>Bu destede kart yok.</b></p></div></div>';
      return h;
    }
    h += '<div class="ez-kart-buyuk" id="ezKart" data-acik="' + (DURUM.acik ? "1" : "0") + '" tabindex="0" role="button" ' +
      'aria-label="Kartı çevir">' +
      '<div class="ez-kart-ust"><span class="ez-kart-deste">' + kacis(k.tur) + "</span>" +
      '<span class="ez-kart-no">' + (DURUM.sira + 1) + " / " + DURUM.kuyruk.length + "</span></div>" +
      '<div class="ez-yuz ez-on"><span class="ez-etiket-tur">SORU</span>' +
      '<p class="ez-on-cumle">' + kacis(k.on) + "</p>" +
      (k.konu ? '<p class="ez-konu">' + kacis(k.konu) + "</p>" : "") +
      '<p class="ez-ipucu">Çevirmek için karta dokun (ya da boşluk tuşu).</p></div>' +
      '<div class="ez-yuz ez-arka"><span class="ez-etiket-tur">CEVAP</span>' +
      '<p class="ez-arka-cumle">' + kacis(k.arka) + "</p>" +
      (k.ek ? '<p class="ez-arka-ek">' + kacis(k.ek) + "</p>" : "") +
      '<p class="ez-kaynak-satir">📚 Kaynak: ' + kacis(k.kaynak) + (k.konu ? " · " + kacis(k.konu) : "") + "</p></div></div>";

    h += '<div class="ez-butonlar">' +
      '<button class="ka-dugme" id="ezBiliyorum" style="--bolum:#12a150">✔ Biliyorum</button>' +
      '<button class="ka-dugme ka-ikincil" id="ezTekrar">⟳ Tekrar göster</button>' +
      '<button class="ka-dugme ka-ikincil" id="ezCevir">🔄 Çevir</button>' +
      '<button class="ka-dugme ka-ikincil" id="ezOku">🔊 Kartı oku</button>' +
      '<button class="ka-dugme ka-ikincil" id="ezDesteDinle">' + (DURUM.ses ? "⏹ Durdur" : "🔊 Desteyi dinle") + "</button>" +
      '<button class="ka-dugme ka-ikincil" id="ezKaristir">🔀 Karıştır</button></div>' +
      '<p class="ez-durum" id="ezDurum">' + kacis(geciciDurum) + "</p>" +
      '<p class="ez-kisayol">Klavye: <kbd>Boşluk</kbd>/<kbd>Enter</kbd> çevir · ' +
      "<kbd>→</kbd> biliyorum · <kbd>←</kbd> geri · <kbd>↓</kbd> tekrar göster</p>" +
      '<div class="ez-kutular ez-kutular-mini">' +
      '<div class="ez-kutu"><b>' + il.toplam + "</b><span>DESTE KARTI</span></div>" +
      '<div class="ez-kutu"><b>' + il.bilinen + "</b><span>BİLİNEN</span></div>" +
      '<div class="ez-kutu"><b>%' + il.yuzde + "</b><span>DESTE İLERLEMESİ</span></div></div>";
    return h + "</div>";
  }

  function ciz() {
    var kap = $("#ezberAlan");
    if (!kap) return;
    var ds = destelerUret();
    var oz = A.ozet();
    var h = '<div class="ez-kok">' +
      '<div class="ez-ust"><div class="ez-ust-yazi"><b>🧠 Ezber Kartları</b>' +
      "<span>Formül, kural ve güncel bilgi kartları: çevir-öğren, kendini değerlendir, sesli oku.</span></div>" +
      '<span class="ez-rozet">' + oz.desteSayisi + " deste</span>" +
      '<span class="ez-rozet">' + oz.kartSayisi + " kart</span></div>" +
      '<div class="ez-kutular">' +
      '<div class="ez-kutu"><b>' + oz.desteSayisi + "</b><span>DESTE SAYISI</span></div>" +
      '<div class="ez-kutu"><b>' + oz.kartSayisi + "</b><span>KART SAYISI</span></div>" +
      '<div class="ez-kutu"><b>' + oz.bilinen + "</b><span>BİLİNEN</span></div>" +
      '<div class="ez-kutu"><b>' + oz.tekrar + "</b><span>TEKRAR EDİLECEK</span></div></div>" +
      '<div class="ez-blok"><h3 class="ez-bas">Desteler</h3><div class="ez-deste-liste">' +
      ds.map(desteSatiri).join("") + "</div>" +
      '<p class="ez-not">Kartlar iki yüzlüdür: ön yüz ipucu/soru, arka yüz kaynaktaki cümlenin aynısı. ' +
      "İlerleme bu cihazda saklanır.</p></div>" +
      (DURUM.deste ? calismaHtml() : "") +
      '<div class="ez-blok"><h3 class="ez-bas">Bu kartlar nereden geldi?</h3>' +
      '<ul class="ez-kaynak-liste">' +
      ds.map(function (d) {
        return "<li><b>" + kacis(d.ad) + "</b>: " + kacis(d.ayrinti) + " · kaynak: " + kacis(d.kaynak) + "</li>";
      }).join("") +
      "</ul>" +
      '<p class="ez-not">Hiçbir kart uydurulmamıştır; her kartın arka yüzü kaynak dosyadaki bir cümlenin birebir aynısıdır. ' +
      "Toplam " + oz.kartSayisi + " kart.</p></div>" +
      '<div class="ez-blok"><h3 class="ez-bas">İlerlemeyi yönet</h3>' +
      '<div class="ez-butonlar"><button class="ka-dugme ka-ikincil" id="ezSifirla">🧹 İlerlemeyi sıfırla (onaylı)</button></div>' +
      '<p class="ez-not" id="ezSifirlaDurum">Depo anahtarı: localStorage "ustad.ezber" · kayıtlı kart: ' +
      Object.keys(A.depo()).length + " · bilinen: " + oz.bilinen + " · tekrar: " + oz.tekrar + "</p></div>" +
      "</div>";
    kap.innerHTML = h;
    bagla();
  }

  function bagla() {
    var kap = $("#ezberAlan");
    if (!kap) return;
    $$("#ezberAlan [data-ez-ac]").forEach(function (b) {
      b.addEventListener("click", function () { A.desteAc(b.getAttribute("data-ez-ac")); });
    });
    $$("#ezberAlan [data-ez-dinle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-ez-dinle");
        if (DURUM.deste !== id || !DURUM.ses) { if (DURUM.deste !== id) A.desteAc(id); A.desteDinle(); }
        else A.desteDinle();
      });
    });
    $$("#ezberAlan [data-ez-git]").forEach(function (b) {
      b.addEventListener("click", function () { git(b.getAttribute("data-ez-git")); });
    });
    var kart = $("#ezKart");
    if (kart) kart.addEventListener("click", function () { A.cevir(); });
    var d;
    if ((d = $("#ezBiliyorum"))) d.addEventListener("click", function () { A.biliyorum(); });
    if ((d = $("#ezTekrar"))) d.addEventListener("click", function () { A.tekrarGoster(); });
    if ((d = $("#ezCevir"))) d.addEventListener("click", function () { A.cevir(); });
    if ((d = $("#ezOku"))) d.addEventListener("click", function () { A.kartOku(); durumCiz("Kart sesli okundu."); });
    if ((d = $("#ezDesteDinle"))) d.addEventListener("click", function () { A.desteDinle(); });
    if ((d = $("#ezKaristir"))) d.addEventListener("click", function () { A.karistir(); });
    if ((d = $("#ezCalKapat"))) d.addEventListener("click", function () { A.desteKapat(); });
    if ((d = $("#ezSifirla"))) {
      d.addEventListener("click", function () {
        A.sifirla();
        var el = $("#ezSifirlaDurum");
        if (el) el.textContent = "İlerleme sıfırlandı · kayıtlı kart: " + Object.keys(A.depo()).length + " · bilinen: " + A.ozet().bilinen;
      });
    }
  }

  function git(kod) {
    try {
      if (window.USTAD_MOTOR && typeof window.USTAD_MOTOR.git === "function") { window.USTAD_MOTOR.git(kod); return; }
    } catch (e) {}
    var b = document.querySelector('[data-git="' + kod + '"]');
    if (b) b.click();
  }

  /* klavye kısayolları: Boşluk/Enter çevir · → biliyorum · ← geri · ↓ tekrar */
  document.addEventListener("keydown", function (e) {
    if (!DURUM.deste || !$("#ezKart")) return;
    var el = e.target || {};
    var et = String(el.tagName || "").toUpperCase();
    if (et === "INPUT" || et === "TEXTAREA" || et === "SELECT") return;
    var k = e.key;
    if (k === " " || k === "Spacebar" || e.code === "Space" || k === "Enter") {
      if (e.preventDefault) e.preventDefault();
      A.cevir();
    } else if (k === "ArrowRight") {
      if (e.preventDefault) e.preventDefault();
      A.biliyorum();
    } else if (k === "ArrowLeft") {
      if (e.preventDefault) e.preventDefault();
      A.geri();
    } else if (k === "ArrowDown") {
      if (e.preventDefault) e.preventDefault();
      A.tekrarGoster();
    }
  });

  /* motor sözleşmesi: bölüm açılınca çiz */
  A.bolumAc = function (kod) { if (kod === "ezber") ciz(); };

  /* ───────────── TEST KANCASI (?test=1) — assets/koc-ai.js deseni ───────────── */
  function ezberTesti() {
    var t = [];
    function ok(ad, gecti, ayrinti) {
      t.push((gecti ? "✔ " : "✘ ") + ad + (ayrinti === undefined || ayrinti === null ? "" : " — " + ayrinti));
    }
    function tusla(key) {
      try { document.dispatchEvent(new KeyboardEvent("keydown", { key: key, code: key === " " ? "Space" : key, bubbles: true })); }
      catch (e) {}
    }
    function cubuk(id) {
      var el = $("#ezberAlan .ez-deste[data-deste='" + id + "'] .ez-cubuk i");
      return el ? String(el.style.width) : "yok";
    }
    function gorunur(sel) {
      var el = $("#ezberAlan " + sel);
      return el ? getComputedStyle(el).display : "yok";
    }

    /* test verisini sakla */
    var eskiEzber = null, eskiKart = null;
    var eskiKonus = window.KPSS_SES ? window.KPSS_SES.konus : null;
    var eskiDurdur = window.KPSS_SES ? window.KPSS_SES.durdur : null;
    var eskiOnay = window.confirm;
    try { eskiEzber = localStorage.getItem(DEPO); } catch (e) {}
    try { eskiKart = localStorage.getItem(KAYNAK_DEPO); } catch (e) {}
    try { localStorage.removeItem(DEPO); } catch (e) {}

    /* 0) kaynaklar */
    var NL = notlar(), SL = sorular(), GL = guncelMaddeler();
    ok("kaynak: ders notları yüklü", NL.length >= 20, NL.length + " not");
    ok("kaynak: soru bankası yüklü", SL.length >= 100, SL.length + " soru");
    ok("kaynak: güncel maddeler yüklü", GL.length >= 25, GL.length + " madde");

    /* 1) yanlış defteri havuzunu 2 GERÇEK soruyla doldur (kartlar.js kayıt biçimi) */
    var ka = {};
    SL.slice(0, 2).forEach(function (s) {
      var id = (s.ders || "") + "|" + (s.konu || "") + "|" + String(s.soru || "").slice(0, 48);
      ka[id] = { id: id, ders: s.ders, konu: s.konu, soru: s.soru, secenekler: s.secenekler, dogru: s.dogru,
                 aciklama: s.aciklama, metin: s.metin, kez: 1, kutu: 1 };
    });
    try { localStorage.setItem(KAYNAK_DEPO, JSON.stringify(ka)); } catch (e) {}

    /* 2) bölümü aç → desteler */
    A.bolumAc("ezber");
    var ds = A.desteler();
    var mat = ds.filter(function (d) { return d.id === "mat"; })[0];
    var kural = ds.filter(function (d) { return d.id === "kural"; })[0];
    var guncel = ds.filter(function (d) { return d.id === "guncel"; })[0];
    var yanlis = ds.filter(function (d) { return d.id === "yanlis"; })[0];
    var ozetSayi = ds.map(function (d) { return d.id + "=" + d.kartlar.length; }).join(", ");
    ok("deste: 4 deste üretildi (mat, kural, guncel, yanlis)",
       ds.length === 4 && !!mat && !!kural && !!guncel && !!yanlis, ozetSayi);
    ok("deste: Matematik Formülleri kart sayısı > 0", !!mat && mat.kartlar.length >= 10, mat ? mat.kartlar.length + " kart" : "yok");
    ok("deste: Ders Kural Hatırlatmaları kart sayısı > 0", !!kural && kural.kartlar.length >= 40, kural ? kural.kartlar.length + " kart" : "yok");
    ok("deste: Güncel Bilgi Kartları kart sayısı > 0", !!guncel && guncel.kartlar.length >= 25, guncel ? guncel.kartlar.length + " kart" : "yok");
    ok("deste: Yanlış Yaptığım Sorular depodan üretildi", !!yanlis && yanlis.kartlar.length === 2, yanlis ? yanlis.kartlar.length + " kart" : "yok");

    /* 3) içerik kaynaktan mı? (uydurma yok) */
    var corpus = sadeles(metinTopla([NL, SL, GL]));
    var kontrol = 0, eslesen = 0, ornek = [];
    [mat, kural, guncel].forEach(function (d) {
      if (!d) return;
      d.kartlar.forEach(function (k) {
        kontrol++;
        var p = sadeles(k.arka).slice(0, 40);
        if (p.length > 20 && corpus.indexOf(p) >= 0) {
          eslesen++;
          if (ornek.length < 3) ornek.push(sadeles(k.arka).slice(0, 30));
        }
      });
    });
    ok("içerik: her kartın arka yüzü kaynak dosyadaki cümleyle BİREBİR",
       kontrol > 0 && eslesen === kontrol, eslesen + "/" + kontrol + " kart kaynakla eşleşti");
    ok("içerik: en az 3 kart için eşleşme kanıtlandı (örnekler)", ornek.length === 3,
       ornek.join(" · ").slice(0, 140));
    ok("içerik: ön yüz ile arka yüz farklı (çevir-öğren anlamlı)",
       [mat, kural, guncel].every(function (d) {
         return d && d.kartlar.every(function (k) { return sadeles(k.on) !== sadeles(k.arka); });
       }), "tüm kartlar");

    /* 4) göstergeler */
    var oz = A.ozet();
    var toplamKart = ds.reduce(function (a, d) { return a + d.kartlar.length; }, 0);
    ok("gösterge: DESTE SAYISI 4 ve KART SAYISI destelerin toplamına eşit",
       oz.desteSayisi === 4 && oz.kartSayisi === toplamKart, oz.desteSayisi + " deste / " + oz.kartSayisi + " kart");
    ok("gösterge: depo boşken BİLİNEN=0, TEKRAR EDİLECEK=0",
       oz.bilinen === 0 && oz.tekrar === 0, oz.bilinen + " bilinen / " + oz.tekrar + " tekrar");
    ok("arayüz: 4 gösterge kutusu ve deste satırları çizildi",
       $$("#ezberAlan .ez-kutu").length === 4 && $$("#ezberAlan .ez-deste").length === 4 && $$("#ezberAlan .ez-cubuk").length === 4,
       $$("#ezberAlan .ez-kutu").length + " kutu / " + $$("#ezberAlan .ez-deste").length + " deste");

    /* 5) çalışma paneli: kart ön/arka */
    A.desteAc("mat");
    var d0 = A.durum();
    ok("çalışma: deste açıldı, kuyruk dolu, ilk kart kapalı",
       d0.deste === "mat" && d0.toplam === mat.kartlar.length && d0.sira === 0 && d0.acik === false, JSON.stringify(d0));
    var k0 = A.durumKart();
    var onDis = gorunur(".ez-kart-buyuk .ez-on"), arkaDis = gorunur(".ez-kart-buyuk .ez-arka");
    ok("çalışma: ön yüz görünür, arka yüz GİZLİ (display)",
       onDis !== "none" && arkaDis === "none", "ön:" + onDis + " / arka:" + arkaDis);
    ok("çalışma: ön yüzde ipucu, arka yüzde kaynak cümle yazıyor",
       !!k0 && sadeles($("#ezberAlan .ez-on").textContent).indexOf(sadeles(k0.on).slice(0, 20)) >= 0 &&
       sadeles($("#ezberAlan .ez-arka").textContent).indexOf(sadeles(k0.arka).slice(0, 30)) >= 0,
       sadeles(k0.on).slice(0, 40));

    /* 6) sesli okuma — gerçek KPSS_SES.konus geçici olarak sahte ile değiştirilir */
    var toplanan = [];
    try {
      window.KPSS_SES.konus = function (m, s) {
        toplanan.push({ m: String(m == null ? "" : m), s: s || {} });
        if (typeof s.bitti === "function" && s.oto === true) {}
      };
    } catch (e) {}
    A.desteAc("mat");
    var m1 = A.kartOku();
    ok("sesli: 'kartı oku' ön yüzü seslendiriyor",
       toplanan.length === 1 && sadeles(toplanan[0].m).indexOf(sadeles(A.durumKart().on).replace(/…/g, "").slice(0, 22)) >= 0,
       sadeles(toplanan[0] ? toplanan[0].m : "").slice(0, 60));

    /* 7) çevirme: karta dokun → arka yüz açılır */
    $("#ezKart").click();
    var arkaDis2 = gorunur(".ez-kart-buyuk .ez-arka"), onDis2 = gorunur(".ez-kart-buyuk .ez-on");
    ok("çevirme: karta dokununca arka yüz açıldı (ön gizlendi)",
       A.durum().acik === true && arkaDis2 !== "none" && onDis2 === "none", A.durum().acik + " · arka:" + arkaDis2 + " ön:" + onDis2);
    toplanan.length = 0;
    A.kartOku();
    ok("sesli: cevap açıkken cevabı da okuyor",
       toplanan.length === 1 && sadeles(toplanan[0].m).indexOf(sadeles(A.durumKart().arka).slice(0, 30)) >= 0,
       sadeles(toplanan[0] ? toplanan[0].m : "").slice(0, 70));

    /* 8) klavye: boşluk çevirir */
    var oncekiAcik = A.durum().acik;
    tusla(" ");
    ok("klavye: boşluk tuşu kartı çeviriyor", A.durum().acik === !oncekiAcik, oncekiAcik + " → " + A.durum().acik);

    /* 9) "Biliyorum" → depo + ilerleme */
    var N = mat.kartlar.length;
    var kIlk = A.durumKart().id;
    $("#ezBiliyorum").click();
    var kayit1 = A.depo()["mat::" + kIlk];
    ok("depo: 'Biliyorum' ustad.ezber'e yazdı (bildi/kez/sonTarih)",
       !!kayit1 && kayit1.bildi === true && kayit1.kez === 1 && /^\d{4}-\d{2}-\d{2}T/.test(String(kayit1.sonTarih)),
       kayit1 ? JSON.stringify(kayit1).slice(0, 80) : "kayıt yok");
    ok("ilerleme: 'biliyorum' işaretlenince bilinen sayısı 1 oldu", A.ozet().bilinen === 1, A.ozet().bilinen + " bilinen");
    ok("ilerleme: kart ilerledi (sıradaki farklı kart)",
       A.durum().sira === 1 && A.durumKart().id !== kIlk, A.durum().sira + ". sıra · " + A.durumKart().id);
    var yuzde = Math.round(1 / N * 100);
    ok("ilerleme çubuğu: yüzde ve çubuk genişliği doğru (%" + yuzde + ")",
       A.ilerleme("mat").yuzde === yuzde && cubuk("mat") === yuzde + "%",
       A.ilerleme("mat").yuzde + "% · çubuk:" + cubuk("mat"));

    /* 10) "Tekrar göster" → destede kalır, kuyruk sonuna gider */
    var kIkinci = A.durumKart().id;
    $("#ezTekrar").click();
    var kuyruk = A.kuyruk();
    var kayit2 = A.depo()["mat::" + kIkinci];
    ok("'Tekrar göster': kart destede KALDI (kart sayısı değişmedi)",
       A.ilerleme("mat").toplam === N && kuyruk.length === N, A.ilerleme("mat").toplam + " kart / kuyruk " + kuyruk.length);
    ok("'Tekrar göster': bildi=false yazıldı ve kart kuyruğun SONUNA atıldı",
       !!kayit2 && kayit2.bildi === false && kuyruk[kuyruk.length - 1] === kIkinci,
       kayit2 ? JSON.stringify(kayit2).slice(0, 60) + " · son:" + kuyruk[kuyruk.length - 1] : "kayıt yok");
    ok("gösterge: TEKRAR EDİLECEK 1 oldu", A.ozet().tekrar === 1, A.ozet().tekrar + " tekrar");

    /* 11) klavye → biliyorum, ← geri */
    var bilinenOnce = A.ozet().bilinen;
    tusla("ArrowRight");
    ok("klavye: → tuşu 'biliyorum' işaretledi", A.ozet().bilinen === bilinenOnce + 1, bilinenOnce + " → " + A.ozet().bilinen);
    var siraOnce = A.durum().sira;
    tusla("ArrowLeft");
    ok("klavye: ← tuşu geri döndü (bilinen değişmedi)",
       A.durum().sira === Math.max(0, siraOnce - 1) && A.ozet().bilinen === bilinenOnce + 1,
       siraOnce + " → " + A.durum().sira);

    /* 12) "Desteyi dinle": sırayla okur, çevirir, ilerler */
    toplanan.length = 0;
    var basladiMi = A.desteDinle();
    var sd = A.sesDurumu();
    ok("sesli: 'desteyi dinle' başladı ve 1. kartı okudu",
       basladiMi === true && toplanan.length === 1 && sd.caliyor === true, "okunan metin: " + toplanan.length + " · " + JSON.stringify(sd));
    var siraSes = A.durum().sira;
    var bitti1 = toplanan[0] ? toplanan[0].s.bitti : null;
    if (typeof bitti1 === "function") bitti1();
    ok("sesli: kart bitince sonraki karta geçti ve kartı çevirdi (arka yüz açık)",
       A.sesDurumu().caliyor === true && A.durum().sira === siraSes + 1 && A.durum().acik === true && toplanan.length === 2,
       "sıra " + siraSes + " → " + A.durum().sira + " · okunan " + toplanan.length + " · açık:" + A.durum().acik);
    ok("sesli: okunan 2. metin yeni kartın ön yüzünü ve cevabını içeriyor",
       toplanan.length >= 2 && sadeles(toplanan[1].m).indexOf(sadeles(A.durumKart().on).replace(/…/g, "").slice(0, 20)) >= 0 &&
       sadeles(toplanan[1].m).indexOf(sadeles(A.durumKart().arka).slice(0, 25)) >= 0,
       sadeles(toplanan[1] ? toplanan[1].m : "").slice(0, 70));
    A.dinlemeyiDurdur();
    ok("sesli: 'durdur' akışı kesti", A.sesDurumu().caliyor === false && A.sesDurumu().i === null, JSON.stringify(A.sesDurumu()));

    /* 13) sıfırlama (onaylı) */
    window.confirm = function () { return true; };
    $("#ezSifirla").click();
    ok("sıfırlama: depo boşaldı, göstergeler sıfır",
       Object.keys(A.depo()).length === 0 && A.ozet().bilinen === 0 && A.ozet().tekrar === 0,
       "kayıt: " + Object.keys(A.depo()).length + " · bilinen: " + A.ozet().bilinen);

    /* 14) sözleşme: bolumAc yalnız "ezber" kodunda çizer */
    var htmlOnce = $("#ezberAlan") ? $("#ezberAlan").innerHTML : "";
    A.bolumAc("testler");
    ok("sözleşme: A.bolumAc yalnız 'ezber' kodunda çiziyor",
       ($("#ezberAlan") ? $("#ezberAlan").innerHTML : "") === htmlOnce, "değişmedi");

    /* 15) boş deste: yanlış defteri boşken açık zeminli boş durum */
    try { localStorage.removeItem(KAYNAK_DEPO); } catch (e) {}
    A.bolumAc("ezber");
    var yd = A.desteler().filter(function (d) { return d.id === "yanlis"; })[0];
    var bosEl = $("#ezberAlan .ez-bos");
    ok("boş deste: yanlış defteri boşken 0 kart + okunabilir boş durum yazısı",
       !!yd && yd.kartlar.length === 0 && !!bosEl && /boş/i.test(bosEl.textContent) &&
       getComputedStyle(bosEl).backgroundColor.indexOf("rgba(0, 0, 0, 0)") !== 0,
       bosEl ? sadeles(bosEl.textContent).slice(0, 55) : "yok");

    /* 16) temizlik: her şeyi eski hâline döndür */
    try { if (eskiEzber === null) localStorage.removeItem(DEPO); else localStorage.setItem(DEPO, eskiEzber); } catch (e) {}
    try { if (eskiKart === null) localStorage.removeItem(KAYNAK_DEPO); else localStorage.setItem(KAYNAK_DEPO, eskiKart); } catch (e) {}
    try { window.KPSS_SES.konus = eskiKonus; window.KPSS_SES.durdur = eskiDurdur; } catch (e) {}
    window.confirm = eskiOnay;
    var g1 = null, g2 = null;
    try { g1 = localStorage.getItem(DEPO); } catch (e) {}
    try { g2 = localStorage.getItem(KAYNAK_DEPO); } catch (e) {}
    ok("temizlik: ustad.ezber ve ustad.kartlar eski hâline döndü",
       g1 === eskiEzber && g2 === eskiKart, (g1 === null ? "ezber: boş" : "ezber: geri") + " · " + (g2 === null ? "kartlar: boş" : "kartlar: geri"));
    ok("temizlik: KPSS_SES.konus/durdur geri konuldu",
       window.KPSS_SES.konus === eskiKonus && window.KPSS_SES.durdur === eskiDurdur, typeof window.KPSS_SES.konus + "/" + typeof window.KPSS_SES.durdur);

    A.bolumAc("ezber");

    var kap = document.createElement("div");
    kap.id = "ezberTestSonuc";
    kap.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
    kap.innerHTML = "<h3>ÜSTAD KOÇ PRO · Ezber Kartları testi</h3>" +
      t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
      "<hr><b>" + t.filter(function (x) { return x.indexOf("✔") === 0; }).length + " / " + t.length + " geçti</b>";
    document.body.appendChild(kap);

    var gecenAdet = t.filter(function (x) { return x.indexOf("✔") === 0; }).length;
    var baslikYaz = function () {
      if (String(document.title).indexOf("EZBERTEST") < 0) {
        document.title = (document.title || "") + " EZBERTEST " + gecenAdet + "/" + t.length;
      }
    };
    baslikYaz();
    var sayac = 0;
    var zamanB = setInterval(function () { baslikYaz(); if (++sayac > 40) clearInterval(zamanB); }, 250);
  }

  if (location.search.indexOf("test=1") >= 0) {
    var kos = function () { setTimeout(ezberTesti, 500); };
    if (document.readyState === "complete") kos();
    else window.addEventListener("load", kos);
  }
})();
