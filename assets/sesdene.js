/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Sesli Deneme · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Denemedeki soruları ve çözümlerini sesli dinleme bölümü (kulakla pekiştirme).

   Veri kaynakları (hiçbiri uydurulmaz, hepsi gerçek depodan okunur):
     · window.USTAD_SORULAR  → soru bankası (ders/konu seçerek dinleme)
     · localStorage "ustad.kartlar"      → yanlış yaptığım sorular (kart hafızası; KARTLAR API'si varsa ondan)
     · localStorage "ustad.ka.denemeler" → son hızlı deneme (doğru sayısı, yüzde)
     · localStorage "ustad.yanlisKonu"   → son denemenin zayıf konuları
     · localStorage "ustad.sesdene"      → dinleme kaydı {toplam, sureDk, sonTarih}

   Ses motoru: SADECE window.KPSS_SES.konus(metin, secenek) + KPSS_SES.durdur kullanılır.
   Sayı/kısaltma dönüştürme YAPILMAZ — o iş ses motorunun metinHazirla adımına bırakılır ki
   ekranda görünen metinle okunan metin tutarlı kalsın. */
(function () {
  "use strict";
  var A = window.SESDENE = window.SESDENE || {};

  var HARFLER = ["A", "B", "C", "D", "E", "F"];
  var DEPO = "sesdene";        /* localStorage anahtarı: ustad.sesdene */
  var GECIS_MS = 900;          /* otomatik geçişte sorular arası kısa nefes */
  var DURAK_MS = 260;          /* soru ile şıklar arasındaki kısa durak (ses motorunun cümle durağı) */
  var TUMU = "__tum__";
  var MAX_SURE_DK = 100000;

  /* ───────────── temel yardımcılar ───────────── */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function depoAl(k, v) { try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } }
  function depoKoy(k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); } catch (e) {} }
  function depoVar(k) { try { return localStorage.getItem("ustad." + k) !== null; } catch (e) { return false; } }
  function depoSil(k) { try { localStorage.removeItem("ustad." + k); } catch (e) {} }
  function kopya(o) { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return o; } }
  function git(kod) { try { if (window.USTAD_MOTOR && window.USTAD_MOTOR.git) window.USTAD_MOTOR.git(kod); } catch (e) {} }
  function i2(n) { return (n < 10 ? "0" : "") + n; }
  function tarihYaz(ts) {
    var d = new Date(ts);
    if (isNaN(d.getTime())) return "—";
    return i2(d.getDate()) + "." + i2(d.getMonth() + 1) + "." + d.getFullYear() + " " + i2(d.getHours()) + ":" + i2(d.getMinutes());
  }
  function hizYaz(h) { var s = (Math.round(h * 100) / 100).toString(); return s + "×"; }

  /* ───────────── veri okuma ───────────── */
  /** Banka: window.USTAD_SORULAR (120 özgün soru). */
  function havuz() { var s = window.USTAD_SORULAR; return Array.isArray(s) ? s : []; }

  /** Kart hafızası: önce KARTLAR API'si (canlı), yoksa doğrudan localStorage "ustad.kartlar". */
  function kartlar() {
    try {
      if (window.KARTLAR && typeof window.KARTLAR.kayitlar === "function") {
        var k = window.KARTLAR.kayitlar();
        if (Array.isArray(k)) {
          return k.filter(function (x) { return x && (x.soru || x.metin); });
        }
      }
    } catch (e) {}
    var d = depoAl("kartlar", {});
    if (!d || typeof d !== "object") return [];
    return Object.keys(d).map(function (id) {
      var x = (d[id] && typeof d[id] === "object") ? d[id] : {};
      if (!x.id) x.id = id;
      return x;
    }).filter(function (x) { return x.soru || x.metin; });
  }

  /** Kart kaydını siler: KARTLAR.kayitSil varsa onu çağırır, yoksa depodan siler. */
  function kartSil(id) {
    if (!id) return false;
    var sonuc = false;
    try {
      if (window.KARTLAR && typeof window.KARTLAR.kayitSil === "function") sonuc = !!window.KARTLAR.kayitSil(id);
    } catch (e) {}
    var d = depoAl("kartlar", {});
    if (d && typeof d === "object" && Object.prototype.hasOwnProperty.call(d, id)) {
      delete d[id];
      depoKoy("kartlar", d);
      sonuc = true;
    }
    return sonuc;
  }

  function denemeler() {
    var g = depoAl("ka.denemeler", []);
    return Array.isArray(g) ? g.filter(function (d) { return d && typeof d === "object"; }) : [];
  }
  function sonDeneme() { var g = denemeler(); return g.length ? g[g.length - 1] : null; }
  function ortalamaYuzde() {
    var g = denemeler().map(function (d) { return Number(d.yuzde); }).filter(function (x) { return isFinite(x); });
    if (!g.length) return null;
    var t = g.reduce(function (a, b) { return a + b; }, 0);
    return Math.round((t / g.length) * 10) / 10;
  }
  function yanlisKonular() { var m = depoAl("yanlisKonu", {}); return (m && typeof m === "object") ? m : {}; }

  function kayitAl() {
    var k = depoAl(DEPO, null);
    if (!k || typeof k !== "object") k = {};
    k.toplam = Math.max(0, parseInt(k.toplam, 10) || 0);
    k.sureDk = Math.max(0, Math.round((Number(k.sureDk) || 0) * 10) / 10);
    k.sonTarih = typeof k.sonTarih === "string" ? k.sonTarih : "";
    return k;
  }

  /* ───────────── durum ───────────── */
  var D = {
    tur: "yanlis",     /* yanlis | ders | deneme */
    ders: null,
    konu: null,
    liste: [],
    i: 0,
    durum: "duruk",    /* duruk | caliyor | duraklatildi | geciyor | bitti */
    cumle: 0,
    cumleToplam: 0,
    hiz: 1,
    klasik: false,
    oto: true,
    yeniMetin: ""
  };
  A.durum = D;

  /* ───────────── soru listeleri ───────────── */
  /** Yanlış yaptığım sorular (kart hafızası) — kart kaydı soru biçimine çevrilir. */
  function yanlisSorular() {
    return kartlar().map(function (k) {
      return {
        kartId: k.id || "",
        ders: k.ders || "",
        konu: k.konu || "",
        metin: k.metin || "",
        soru: k.soru || "",
        secenekler: Array.isArray(k.secenekler) ? k.secenekler.slice(0, 6) : [],
        dogru: (typeof k.dogru === "number") ? k.dogru : -1,
        aciklama: k.aciklama || "",
        kutu: k.kutu || null,
        verilen: (typeof k.verilen === "number") ? k.verilen : null
      };
    });
  }

  /** Son hızlı denemenin konuları: denemede konu listesi varsa o; yoksa ustad.yanlisKonu'daki
      zayıf konular (en çok yanlış önce). Uydurma yok — ikisi de gerçek kayıtlardan gelir. */
  function denemeKonulari() {
    var sd = sonDeneme(), out = [];
    if (sd) {
      var ham = sd.konular || sd.yanlisKonular || null;
      if (Array.isArray(ham)) {
        ham.forEach(function (x) {
          if (typeof x === "string" && x.trim()) out.push(x.trim());
          else if (x && typeof x === "object" && x.konu) out.push(String(x.konu));
        });
      }
    }
    if (!out.length) {
      var y = yanlisKonular();
      out = Object.keys(y).sort(function (a, b) { return (Number(y[b]) || 0) - (Number(y[a]) || 0); })
        .map(function (k) { return String(k).split("|")[0]; });
    }
    var gor = {}, tekil = [];
    out.forEach(function (x) { if (x && !gor[x]) { gor[x] = 1; tekil.push(x); } });
    return tekil;
  }

  function denemeSoruListesi() {
    var ks = denemeKonulari();
    if (!ks.length) return [];
    var h = havuz(), l = [];
    ks.forEach(function (k) {
      h.forEach(function (s) { if (s.konu === k) l.push(kopya(s)); });
    });
    return l;
  }

  function dersler() {
    var gor = {}, l = [];
    havuz().forEach(function (s) { if (s.ders && !gor[s.ders]) { gor[s.ders] = 1; l.push(s.ders); } });
    return l;
  }
  function konular(dersAd) {
    var gor = {}, l = [];
    havuz().forEach(function (s) {
      if (dersAd && s.ders !== dersAd) return;
      if (s.konu && !gor[s.konu]) { gor[s.konu] = 1; l.push(s.konu); }
    });
    return l;
  }

  /** Aktif kaynağa göre okuma listesini kurar. */
  function listeOlustur() {
    var l = [];
    if (D.tur === "ders") {
      var h = havuz();
      if (D.ders) h = h.filter(function (s) { return s.ders === D.ders; });
      if (D.konu && D.konu !== TUMU) h = h.filter(function (s) { return s.konu === D.konu; });
      l = h.map(kopya);
    } else if (D.tur === "deneme") {
      l = denemeSoruListesi();
    } else {
      l = yanlisSorular();
    }
    D.liste = l;
    if (D.i >= D.liste.length) D.i = 0;
    D.cumle = 0; D.cumleToplam = 0;
    return D.liste;
  }

  /* ───────────── okunacak metin ───────────── */
  /** Sorunun sesli okunacak metni. Klasik modda şıklar okunmaz (sınav öncesi hızlı tekrar).
      Sayı/kısaltma dönüştürme burada YAPILMAZ — ses motoru yapar. */
  function soruMetni(s, klasik) {
    if (!s) return "";
    var p = [];
    if (s.metin) p.push(String(s.metin));
    if (s.soru) p.push(String(s.soru));
    var sl = Array.isArray(s.secenekler) ? s.secenekler.slice(0, 4) : [];
    if (!klasik && sl.length) {
      p.push(sl.map(function (x, j) { return HARFLER[j] + " şıkkı: " + x; }).join(" ; "));
    }
    var harf = (typeof s.dogru === "number" && s.dogru >= 0 && s.dogru < HARFLER.length) ? HARFLER[s.dogru] : "?";
    var cikarim = s.aciklama || (s.dogru >= 0 ? sl[s.dogru] : "") || "";
    p.push("Doğru cevap: " + harf + ". Çünkü: " + cikarim);
    return p.join(" ");
  }

  function kelimeSayisi(m) { return String(m || "").trim().split(/\s+/).filter(Boolean).length; }
  /** Süre tahmini DAKİKA cinsindendir: 140 kelime/dk okuma hızı (ses motorunun temposu). */
  function tahminiDk(s) {
    var k = kelimeSayisi(soruMetni(s, D.klasik));
    return Math.max(0.1, Math.round((k / (140 * (D.hiz || 1))) * 10) / 10);
  }
  function listeDk() { return Math.round(D.liste.reduce(function (a, s) { return a + tahminiDk(s); }, 0) * 10) / 10; }

  /* ───────────── dinleme kaydı: ustad.sesdene ───────────── */
  function dinlemeKaydet(s) {
    var k = kayitAl();
    k.toplam = k.toplam + 1;
    k.sureDk = Math.min(MAX_SURE_DK, Math.round((k.sureDk + tahminiDk(s)) * 10) / 10);
    k.sonTarih = new Date().toISOString();
    depoKoy(DEPO, k);
    return k;
  }

  /* ───────────── sesli çalma ───────────── */
  function sesVarMi() { return !!(window.KPSS_SES && typeof window.KPSS_SES.konus === "function"); }
  function durdur() { try { if (window.KPSS_SES && typeof window.KPSS_SES.durdur === "function") window.KPSS_SES.durdur(); } catch (e) {} }

  /** i. soruyu okur. tekrarOku: duraklatma sonrası devam (dinleme kaydı tekrar artmaz). */
  function oynat(i, tekrarOku) {
    if (!D.liste.length) return false;
    i = Math.max(0, Math.min(D.liste.length - 1, parseInt(i, 10) || 0));
    D.i = i;
    var s = D.liste[i];
    var metin = soruMetni(s, D.klasik);
    D.yeniMetin = metin;
    D.cumle = 0; D.cumleToplam = 0;
    if (!tekrarOku) dinlemeKaydet(s);
    D.durum = "caliyor";
    kayitCizgiGuncelle();
    oynaticiCiz();
    if (!sesVarMi()) { soruBitti(); return true; }
    try {
      window.KPSS_SES.konus(metin, {
        zorla: true,
        gecikme: DURAK_MS,
        ilerleme: function (n, t) { D.cumle = n + 1; D.cumleToplam = t; cubukGuncelle(); },
        bitti: function () { soruBitti(); }
      });
    } catch (e) {
      soruBitti();
    }
    return true;
  }

  function soruBitti() {
    if (D.durum === "duraklatildi") return;
    D.cumle = 0; D.cumleToplam = 0;
    if (D.oto && D.i + 1 < D.liste.length) {
      D.durum = "geciyor";
      oynaticiCiz();
      setTimeout(function () {
        if (D.durum !== "geciyor") return;
        if (D.i + 1 < D.liste.length) oynat(D.i + 1);
      }, GECIS_MS);
    } else {
      D.durum = "bitti";
      oynaticiCiz();
    }
  }

  function duraklat() {
    durdur();
    if (D.durum === "caliyor" || D.durum === "geciyor") D.durum = "duraklatildi";
    oynaticiCiz();
    return D.durum;
  }
  function devamEt() { return oynat(D.i, true); }
  function onceki() { return oynat(D.i - 1); }
  function sonraki() { return oynat(D.i + 1); }

  /** Hız, ses motorunun kendi ayarıdır (ustad.sesHiz) — böylece gerçekten etki eder. */
  function hizAyarla(h) {
    h = Number(h);
    if (!(h > 0.5 && h < 1.6)) h = 1;
    D.hiz = h;
    depoKoy("sesHiz", h);
    return h;
  }
  function klasikAyarla(b, sessiz) {
    D.klasik = !!b;
    if (!sessiz) oynaticiCiz();
    return D.klasik;
  }
  function otoAyarla(b) { D.oto = !!b; return D.oto; }

  /** Dinlenen yanlış soruyu "anladım" → kart hafızasından siler. */
  function anladim(kartId) {
    var id = kartId || (D.liste[D.i] && D.liste[D.i].kartId) || "";
    if (!id) return false;
    var oldu = kartSil(id);
    if (oldu) {
      D.liste = D.liste.filter(function (s) { return s.kartId !== id; });
      if (D.i >= D.liste.length) D.i = Math.max(0, D.liste.length - 1);
      ciz();
    }
    return oldu;
  }

  function turAyarla(tur, ders, konu) {
    D.tur = (tur === "ders" || tur === "deneme") ? tur : "yanlis";
    if (arguments.length > 1) D.ders = ders || null;
    if (arguments.length > 2) D.konu = konu || null;
    D.i = 0;
    listeOlustur();
    ciz();
    return D.liste.length;
  }

  /* ───────────── arayüz ───────────── */
  function kutu(ad, deger, alt, anahtar, ham) {
    return '<div class="sd-kutu" data-sd="' + kacis(anahtar) + '" data-deger="' + kacis(ham == null ? deger : ham) + '">' +
      '<span class="sd-kutu-a">' + kacis(ad) + "</span>" +
      '<span class="sd-kutu-b">' + kacis(deger) + "</span>" +
      '<span class="sd-kutu-c">' + kacis(alt) + "</span></div>";
  }
  function gostergeHtml() {
    var h = havuz().length, y = yanlisSorular().length, sd = sonDeneme(), ort = ortalamaYuzde();
    return '<div class="sd-gosterge">' +
      kutu("DİNLENEBİLİR SORU", h, "soru bankası", "havuz") +
      kutu("YANLIŞ SORULARIM", y, "kart hafızası", "yanlis") +
      kutu("SON DENEME DOĞRU", sd && sd.tDogru != null ? sd.tDogru : "—",
        sd ? (sd.yuzde != null ? sd.yuzde + "% başarı" : "hızlı deneme") : "deneme kaydı yok", "son") +
      kutu("ORTALAMA", ort == null ? "—" : ort + "%", denemeler().length + " deneme üzerinden", "ort", ort == null ? "" : ort) +
      "</div>";
  }
  function kayitCizgiGuncelle() {
    var e = $("#sdKayit");
    if (!e) return;
    var k = kayitAl();
    e.innerHTML = "🎧 Bugüne kadar <b>" + k.toplam + "</b> soru dinledin · toplam <b>" + k.sureDk +
      "</b> dakika" + (k.sonTarih ? ' <span class="ka-etiket">son: ' + kacis(tarihYaz(k.sonTarih)) + "</span>" : "");
  }
  function kayitCizgiHtml() {
    var k = kayitAl();
    return '<div class="sd-kayit" id="sdKayit">🎧 Bugüne kadar <b>' + k.toplam + '</b> soru dinledin · toplam <b>' +
      k.sureDk + "</b> dakika" + (k.sonTarih ? ' <span class="ka-etiket">son: ' + kacis(tarihYaz(k.sonTarih)) + "</span>" : "") + "</div>";
  }

  function kaynakHtml() {
    var y = yanlisSorular().length, dn = denemeSoruListesi().length;
    function d(tur, ad, sayi) {
      return '<button class="ka-dugme ' + (D.tur === tur ? "" : "ka-ikincil") + '" data-sd-kaynak="' + tur + '">' +
        ad + ' <span class="ka-etiket">' + sayi + "</span></button>";
    }
    return '<div class="sd-kaynak">' +
      d("yanlis", "❌ Yanlış yaptığım sorular", y) +
      d("ders", "📚 Ders / konu seçerek bankadan", havuz().length) +
      d("deneme", "⚡ Son hızlı denemenin konuları", dn) +
      "</div>";
  }

  function secimHtml() {
    if (D.tur === "ders") {
      var ds = dersler(), ks = konular(D.ders);
      if (!ds.length) return "";
      return '<div class="sd-secim" id="sdSecim"><b>Ders:</b>' +
        '<button class="ka-mini ' + (D.ders ? "" : "secili") + '" data-sd-ders="">tüm banka</button>' +
        ds.map(function (x) {
          return '<button class="ka-mini ' + (D.ders === x ? "secili" : "") + '" data-sd-ders="' + kacis(x) + '">' + kacis(x) + "</button>";
        }).join("") +
        (D.ders ? '<b style="flex-basis:100%">Konu:</b><button class="ka-mini ' +
          ((!D.konu || D.konu === TUMU) ? "secili" : "") + '" data-sd-konu="' + TUMU + '">tüm konular</button>' +
          ks.map(function (x) {
            return '<button class="ka-mini ' + (D.konu === x ? "secili" : "") + '" data-sd-konu="' + kacis(x) + '">' + kacis(x) + "</button>";
          }).join("") : "") + "</div>";
    }
    if (D.tur === "deneme") {
      var kk = denemeKonulari();
      if (!kk.length) return "";
      return '<div class="sd-secim" id="sdSecim"><b>Son denemenin konuları:</b>' +
        kk.map(function (x) { return '<span class="ka-etiket">' + kacis(x) + "</span>"; }).join("") + "</div>";
    }
    return "";
  }

  function bosHtml(baslik, satir, ipucu) {
    return '<div class="sd-bos" id="sdBos"><h4>' + kacis(baslik) + "</h4>" +
      satir.map(function (x) { return "<p>" + x + "</p>"; }).join("") +
      '<p class="sd-ipucu">' + ipucu + "</p></div>";
  }

  function listeBosMu() {
    if (D.liste.length) return "";
    if (D.tur === "yanlis") {
      return bosHtml("Dinlenecek yanlış soru yok",
        ["Henüz yanlış yaptığın bir soru kart hafızasına girmemiş.",
         "Kart Tekrarı, Mini Test veya Deneme bölümlerinde yanlış yaptığın sorular buraya otomatik düşer."],
        'Başka bir kaynak seçebilirsin: yukarıdaki <b>“Ders / konu seçerek bankadan”</b> düğmesine bas.');
    }
    if (D.tur === "deneme") {
      return bosHtml("Son denemede konu kaydı yok",
        ["Hızlı deneme geçmişinde ya da zayıf konu sayacında henüz konu bilgisi yok.",
         "Deneme çözüp (yanlışların kaydedilince) bu liste kendiliğinden oluşur."],
        "Şimdilik <b>yanlış sorularım</b> veya <b>ders/konu</b> kaynağını kullanabilirsin.");
    }
    return bosHtml("Bu seçimde soru bulunamadı",
      ["Seçtiğin ders/konu için bankada soru yok."],
      "Dersi <b>tüm banka</b> yapmayı ya da başka bir konu seçmeyi dene.");
  }

  function siklarHtml(s) {
    var sl = Array.isArray(s.secenekler) ? s.secenekler.slice(0, 4) : [];
    if (!sl.length) return "";
    return '<div class="sd-siklar">' + sl.map(function (x, j) {
      var dogruMu = (j === s.dogru);
      return '<div class="sd-sik' + (dogruMu ? " sd-dogru" : "") + '"><i>' + HARFLER[j] + "</i><span>" + kacis(x) +
        (dogruMu ? " <b>(doğru)</b>" : "") + "</span></div>";
    }).join("") + "</div>";
  }

  function oynaticiCiz() {
    var kap = $("#sdOynatici");
    if (!kap) return;
    if (!D.liste.length) { kap.innerHTML = ""; return; }
    var s = D.liste[D.i] || {};
    var n = D.liste.length;
    var caliyor = (D.durum === "caliyor");
    var yuzde = Math.round(((D.i + (D.cumleToplam ? D.cumle / D.cumleToplam : 0)) / n) * 100);
    var durakAd = { "duruk": "hazır", "caliyor": "okunuyor", "duraklatildi": "duraklatıldı", "geciyor": "sıradaki soruya geçiyor", "bitti": "soru bitti" }[D.durum] || D.durum;
    kap.innerHTML =
      '<div class="sd-simdi" id="sdSimdi">' +
        '<span class="sd-rozet">' + (caliyor ? "🔊 ŞU AN OKUNUYOR" : (D.durum === "duraklatildi" ? "⏸ DURAKLATILDI" : "🎧 ŞU AN OKUNAN")) + "</span>" +
        '<div class="sd-ust"><span class="ka-etiket"><b class="rakam">' + (D.i + 1) + " / " + n + "</b></span>" +
          '<span class="ka-etiket">' + kacis(s.ders || "Genel") + "</span>" +
          (s.konu ? '<span class="ka-etiket">' + kacis(s.konu) + "</span>" : "") +
          '<span class="ka-etiket">' + hizYaz(D.hiz) + " hız</span>" +
          (D.klasik ? '<span class="ka-etiket">klasik mod (şıksız)</span>' : '<span class="ka-etiket">şıklar okunuyor</span>') +
          "<span>" + durakAd + "</span></div>" +
        '<p class="sd-one">' + kacis(s.metin || "") + "</p>" +
        '<p class="sd-two">' + kacis(s.soru || "") + "</p>" +
        siklarHtml(s) +
        (s.aciklama ? '<div class="sd-cozum"><b>Çözüm:</b> ' + kacis(s.aciklama) + "</div>" : "") +
      "</div>" +
      '<div class="sd-cubuk" id="sdCubuk"><i style="width:' + yuzde + '%"></i></div>' +
      '<div class="sd-cubuk-ad"><span id="sdIlerleme">' + (D.i + 1) + " / " + n + " soru · " +
        (D.cumleToplam ? (D.cumle + "/" + D.cumleToplam + ". cümle") : "cümle bekleniyor") + "</span>" +
        "<span>liste ~" + listeDk() + " dk · " + kacis(D.tur === "yanlis" ? "yanlışlarım" : (D.tur === "deneme" ? "son deneme konuları" : (D.ders || "tüm banka"))) + "</span></div>" +
      '<div class="sd-kumanda">' +
        '<button class="ka-dugme" id="sdOynat">' + (caliyor ? "⏸ Duraklat" : "▶ Sesli dinle") + "</button>" +
        '<button class="ka-dugme ka-ikincil" id="sdOnceki">⏮ Önceki soru</button>' +
        '<button class="ka-dugme ka-ikincil" id="sdSonraki">⏭ Sonraki soru</button>' +
        '<button class="ka-dugme ka-ikincil" id="sdSus">⏹ Sus</button>' +
      "</div>" +
      '<div class="sd-ayar"><b>Hız:</b>' +
        [0.75, 1, 1.25].map(function (h) {
          return '<button class="ka-mini ' + (Math.abs(D.hiz - h) < 0.001 ? "secili" : "") + '" data-sd-hiz="' + h + '">' + hizYaz(h) + "</button>";
        }).join("") +
        '<button class="sd-anahtar ' + (D.klasik ? "acik" : "") + '" id="sdKlasik" data-sd-klasik="' + (D.klasik ? "1" : "0") + '">' +
        (D.klasik ? "✓" : "○") + " Klasik mod (şıkları okumadan soru + çözüm)</button>" +
        '<button class="sd-anahtar ' + (D.oto ? "acik" : "") + '" id="sdOto" data-sd-oto="' + (D.oto ? "1" : "0") + '">' +
        (D.oto ? "✓" : "○") + " Otomatik geç (soru bitince sıradakine)</button>" +
      "</div>" +
      '<div class="sd-kumanda">' +
        (s.kartId ? '<button class="ka-mini" id="sdAnladim" data-sd-anladim="' + kacis(s.kartId) + '">✅ Anladım, karttan sil</button>' : "") +
        '<button class="ka-mini" id="sdSesiDene">🔊 Bu sorunun metnini dinle</button>' +
      "</div>" +
      '<p class="sd-uyari">Ses motoru okuma sırası: <b>soru metni → soru → kısa durak → şıklar (A şıkkı: …) → doğru cevap + çözüm</b>. ' +
      "Sayı ve kısaltmaları ses motoru okunur hâle getirir; ekrandaki yazı ile okunan metin aynı kalır.</p>";

    $("#sdOynat").addEventListener("click", function () {
      if (D.durum === "caliyor") duraklat(); else if (D.durum === "duraklatildi") devamEt(); else oynat(D.i);
    });
    $("#sdOnceki").addEventListener("click", function () { onceki(); });
    $("#sdSonraki").addEventListener("click", function () { sonraki(); });
    $("#sdSus").addEventListener("click", function () {
      durdur();
      if (D.durum === "caliyor" || D.durum === "geciyor") D.durum = "duraklatildi";
      oynaticiCiz();
    });
    $$("#sdOynatici [data-sd-hiz]").forEach(function (b) {
      b.addEventListener("click", function () { hizAyarla(Number(b.getAttribute("data-sd-hiz"))); oynaticiCiz(); });
    });
    $("#sdKlasik").addEventListener("click", function () {
      klasikAyarla(!D.klasik);
      if (D.durum === "caliyor") { durdur(); oynat(D.i, true); }
    });
    $("#sdOto").addEventListener("click", function () { otoAyarla(!D.oto); oynaticiCiz(); });
    if ($("#sdAnladim")) {
      $("#sdAnladim").addEventListener("click", function () { anladim($("#sdAnladim").getAttribute("data-sd-anladim")); });
    }
    $("#sdSesiDene").addEventListener("click", function () {
      try { if (window.KPSS_SES && window.KPSS_SES.konus) window.KPSS_SES.konus(soruMetni(s, D.klasik), { zorla: true, gecikme: DURAK_MS }); } catch (e) {}
    });
  }

  function cubukGuncelle() {
    if (!D.liste.length) return;
    var n = D.liste.length;
    var yuzde = Math.round(((D.i + (D.cumleToplam ? D.cumle / D.cumleToplam : 0)) / n) * 100);
    var i = $("#sdCubuk i");
    if (i) i.style.width = yuzde + "%";
    var il = $("#sdIlerleme");
    if (il) il.textContent = (D.i + 1) + " / " + n + " soru · " + (D.cumleToplam ? (D.cumle + "/" + D.cumleToplam + ". cümle") : "cümle bekleniyor");
  }

  function listeHtml() {
    if (!D.liste.length) return "";
    return '<div class="ka-butonlar">' +
        '<button class="ka-dugme" id="sdTumDinle">▶ Hepsini sesli dinle (' + D.liste.length + " soru · ~" + listeDk() + " dk)</button>" +
        '<button class="ka-dugme ka-ikincil" id="sdKaristir">🔀 Karıştır</button>' +
      "</div>" +
      '<div class="sd-liste" id="sdListe">' + D.liste.map(function (s, i) {
        return '<div class="sd-satir' + (i === D.i ? " sd-aktif" : "") + '" data-sd-satir="' + i + '">' +
          '<span class="sd-no rakam">' + (i + 1) + "</span>" +
          '<span class="sd-govde"><b>' + kacis(String(s.soru || "").slice(0, 96)) + "</b>" +
          "<span>" + kacis(s.ders || "Genel") + (s.konu ? " · " + kacis(s.konu) : "") +
          (s.kartId ? " · kart " + (s.kutu ? s.kutu + ". kutu" : "hafızasında") : "") + "</span></span>" +
          '<span class="sd-arac"><button class="ka-mini" data-sd-oku="' + i + '">▶ dinle</button></span></div>';
      }).join("") + "</div>";
  }

  /* ───────────── ana çizim ───────────── */
  function ciz() {
    var kap = $("#sesdeneAlan");
    if (!kap) return false;
    var sayi = listeOlustur().length;
    kap.innerHTML =
      gostergeHtml() +
      kayitCizgiHtml() +
      kaynakHtml() +
      secimHtml() +
      (sayi ? '<div class="sd-oynatici" id="sdOynatici"></div>' + listeHtml() : listeBosMu());
    baglantilariBagla();
    if (sayi) oynaticiCiz();
    return true;
  }

  function baglantilariBagla() {
    $$("#sesdeneAlan [data-sd-kaynak]").forEach(function (b) {
      b.addEventListener("click", function () {
        durationIsle();
        D.tur = b.getAttribute("data-sd-kaynak");
        D.ders = null; D.konu = null; D.i = 0;
        listeOlustur();
        ciz();
      });
    });
    $$("#sesdeneAlan [data-sd-ders]").forEach(function (b) {
      b.addEventListener("click", function () {
        durationIsle();
        D.ders = b.getAttribute("data-sd-ders") || null;
        D.konu = null; D.i = 0;
        listeOlustur();
        ciz();
      });
    });
    $$("#sesdeneAlan [data-sd-konu]").forEach(function (b) {
      b.addEventListener("click", function () {
        durationIsle();
        D.konu = b.getAttribute("data-sd-konu");
        D.i = 0;
        listeOlustur();
        ciz();
      });
    });
    if ($("#sdTumDinle")) $("#sdTumDinle").addEventListener("click", function () { oynat(0); });
    if ($("#sdKaristir")) $("#sdKaristir").addEventListener("click", function () {
      var a = D.liste.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      D.liste = a; D.i = 0; ciz();
    });
    $$("#sesdeneAlan [data-sd-oku]").forEach(function (b) {
      b.addEventListener("click", function () { oynat(Number(b.getAttribute("data-sd-oku"))); });
    });
  }
  /** Kaynak değişirken çalan sesi keser (bölüm içi gezinmede). */
  function durationIsle() { if (D.durum === "caliyor" || D.durum === "geciyor") { durdur(); D.durum = "duruk"; } }

  /* ───────────── motor kancaları ───────────── */
  A.bolumAc = function (kod) {
    if (kod === "sesdene") ciz();
    else if (D.durum === "caliyor" || D.durum === "geciyor") { durdur(); D.durum = "duruk"; }
  };

  A.ciz = ciz;
  A.havuz = havuz;
  A.kartlar = kartlar;
  A.yanlisSorular = yanlisSorular;
  A.denemeKonulari = denemeKonulari;
  A.denemeSoruListesi = denemeSoruListesi;
  A.dersler = dersler;
  A.konular = konular;
  A.sonDeneme = sonDeneme;
  A.ortalamaYuzde = ortalamaYuzde;
  A.listeOlustur = listeOlustur;
  A.soruMetni = soruMetni;
  A.kayitAl = kayitAl;
  A.dinlemeKaydet = dinlemeKaydet;
  A.oynat = oynat;
  A.duraklat = duraklat;
  A.devamEt = devamEt;
  A.onceki = onceki;
  A.sonraki = sonraki;
  A.hizAyarla = hizAyarla;
  A.klasikAyarla = klasikAyarla;
  A.otoAyarla = otoAyarla;
  A.anladim = anladim;
  A.turAyarla = turAyarla;

  /* ───────────── kendi kendini test (?test=1) ───────────── */
  if (location.search.indexOf("test=1") >= 0) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        var t = [];
        var ok = function (ad, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : "")); };
        var yaz = function () {
          var eski = document.getElementById("sesdeneTestSonuc");
          if (eski) eski.parentNode.removeChild(eski);
          var kap = document.createElement("div");
          kap.id = "sesdeneTestSonuc";
          kap.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
          kap.innerHTML = "<h3>ÜSTAD KOÇ PRO · sesli deneme testi</h3>" + t.map(function (x) { return "<div>" + kacis(x) + "</div>"; }).join("") +
            "<hr><b>" + t.filter(function (x) { return x.indexOf("✔") === 0; }).length + " / " + t.length + " geçti</b>";
          document.body.appendChild(kap);
          document.title = (document.title || "").replace(/\s*SESDENETEST \S+/, "") + " SESDENETEST " +
            t.filter(function (x) { return x.indexOf("✔") === 0; }).length + "/" + t.length;
        };

        var govde = function () {
        /* ── 1) eski depoyu sakla ── */
        var ANAHTARLAR = ["kartlar", "ka.denemeler", "sesdene", "yanlisKonu", "sesHiz"];
        var eski = {}, vardi = {};
        ANAHTARLAR.forEach(function (k) { vardi[k] = depoVar(k); eski[k] = vardi[k] ? localStorage.getItem("ustad." + k) : null; });

        /* ── 2) ses motorunu sahte fonksiyonla değiştir: okunan metinleri TOPLA ── */
        var yakalanan = [], eskiKonus = null, sesKancasiVar = false;
        try {
          if (window.KPSS_SES && typeof window.KPSS_SES.konus === "function") {
            eskiKonus = window.KPSS_SES.konus;
            window.KPSS_SES.konus = function (m, sec) { yakalanan.push({ metin: String(m == null ? "" : m), sec: sec || {} }); return null; };
            sesKancasiVar = true;
          }
        } catch (e) {}
        ok("kurulum: ses motoru kancası bağlandı", sesKancasiVar && typeof window.KPSS_SES.konus === "function");

        /* ── 3) sentetik veri (gerçek banka sorularından) ── */
        var banka = havuz();
        ok("veri: soru bankası (window.USTAD_SORULAR)", banka.length >= 100, banka.length + " soru");
        var q0 = banka[0], q1 = banka[1], q2 = banka[2];
        function kartYap(i, s) {
          return { id: "TEST|" + i, ders: s.ders || "", konu: s.konu || "", soru: s.soru,
                   secenekler: (s.secenekler || []).slice(0, 4), dogru: s.dogru, aciklama: s.aciklama || "",
                   metin: s.metin || "", kutu: 1, sonraki: new Date().toISOString() };
        }
        depoKoy("kartlar", { "TEST|0": kartYap(0, q0), "TEST|1": kartYap(1, q1), "TEST|2": kartYap(2, q2) });
        var simdi = Date.now(), gun = 86400000;
        depoKoy("ka.denemeler", [
          { id: "ts1", tarih: new Date(simdi - 2 * gun).toISOString(), tDogru: 74, yuzde: 61.7, gosterge: 52 },
          { id: "ts2", tarih: new Date(simdi - gun).toISOString(), tDogru: 81, yuzde: 67.5, gosterge: 57 }
        ]);
        depoKoy("yanlisKonu", { "Sözcükte Anlam|Türkçe": 5, "Paragraf|Türkçe": 2 });
        depoKoy("sesdene", { toplam: 0, sureDk: 0, sonTarih: "" });
        depoKoy("sesHiz", 1);

        /* ── 4) bölüm çizimi + göstergeler ── */
        A.bolumAc("sesdene");
        ok("arayüz: bölüm çizildi (#sesdeneAlan dolu)", !!$("#sesdeneAlan .sd-gosterge"));
        ok("gösterge: 4 kutu", $$("#sesdeneAlan .sd-kutu").length === 4, $$("#sesdeneAlan .sd-kutu").length + " kutu");
        var deger = function (k) { var e = $("#sesdeneAlan .sd-kutu[data-sd='" + k + "']"); return e ? e.getAttribute("data-deger") : null; };
        ok("gösterge: dinlenebilir soru = banka", Number(deger("havuz")) === banka.length, deger("havuz") + " (beklenen " + banka.length + ")");
        ok("gösterge: yanlış sorularım = kart sayısı", Number(deger("yanlis")) === 3, deger("yanlis") + " kart");
        ok("gösterge: son deneme doğru = 81", Number(deger("son")) === 81, deger("son"));
        ok("gösterge: ortalama % = 64.6", Number(deger("ort")) === 64.6, deger("ort"));
        ok("dinleme kaydı: 'bugüne kadar N soru dinledin'", /Bugüne kadar/.test($("#sdKayit").textContent) && /0\s*soru/.test($("#sdKayit").textContent), $("#sdKayit").textContent.slice(0, 60));

        /* ── 5) kaynak seçimi + liste ── */
        ok("kaynak: 3 kaynak düğmesi", $$("#sesdeneAlan [data-sd-kaynak]").length === 3, $$("#sesdeneAlan [data-sd-kaynak]").length + " düğme");
        A.turAyarla("yanlis");
        ok("kaynak: yanlış sorular listesi = kart sayısı", $$("#sdListe .sd-satir").length === 3, $$("#sdListe .sd-satir").length + " satır");
        ok("kuyruk: sıra kart sırasıyla aynı", A.durum.liste[0].soru === q0.soru && A.durum.liste[2].soru === q2.soru, (A.durum.liste[0].soru || "").slice(0, 30));
        ok("kuyruk: kart kimliği taşınıyor", A.durum.liste[0].kartId === "TEST|0", String(A.durum.liste[0].kartId));

        /* ders / konu kaynağı */
        A.turAyarla("ders");
        ok("kaynak(ders): ders düğmeleri bankadan", $$("#sesdeneAlan [data-sd-ders]").length === A.dersler().length + 1,
           $$("#sesdeneAlan [data-sd-ders]").length + " düğme (" + A.dersler().length + " ders + tüm banka)");
        var ilkDers = A.dersler()[0];
        $$("#sesdeneAlan [data-sd-ders]").filter(function (b) { return b.getAttribute("data-sd-ders") === ilkDers; })[0].click();
        var beklenenDers = banka.filter(function (s) { return s.ders === ilkDers; }).length;
        ok("kaynak(ders): ders seçilince liste o dersin soruları", A.durum.liste.length === beklenenDers && A.durum.liste.length > 0,
           A.durum.liste.length + " soru / beklenen " + beklenenDers);
        var konuBtn = $$("#sesdeneAlan [data-sd-konu]");
        ok("kaynak(ders): konu düğmeleri geldi", konuBtn.length >= 2, konuBtn.length + " düğme");
        konuBtn[1].click();
        var secKonu = A.durum.konu;
        var beklenenKonu = banka.filter(function (s) { return s.ders === ilkDers && s.konu === secKonu; }).length;
        ok("kaynak(ders): konu seçilince liste daraldı", A.durum.liste.length === beklenenKonu, secKonu + " → " + A.durum.liste.length + " soru");
        ok("kaynak(deneme): son denemenin konularından liste", (function () { A.turAyarla("deneme"); return A.durum.liste.length > 0; })(),
           A.denemeKonulari().join(", ") + " → " + A.durum.liste.length + " soru");

        /* ── 6) sesli çalma: okunan metin ── */
        A.turAyarla("yanlis");
        A.klasikAyarla(false, true);
        A.otoAyarla(false);
        A.hizAyarla(1);
        yakalanan.length = 0;
        A.oynat(0);
        ok("çalma: okuma başladı, ses motoruna metin gitti", yakalanan.length === 1 && A.durum.durum === "caliyor", yakalanan.length + " çağrı / durum " + A.durum.durum);
        var m0 = yakalanan.length ? yakalanan[0].metin : "";
        ok("metin: soru metni + soru gövdesi okunuyor", m0.indexOf(String(q0.soru).slice(0, 30)) >= 0 && m0.indexOf(String(q0.metin).slice(0, 20)) >= 0, m0.slice(0, 70));
        ok("metin: dört şık 'A şıkkı: …' biçiminde okunuyor",
           ["A şıkkı:", "B şıkkı:", "C şıkkı:", "D şıkkı:"].every(function (x) { return m0.indexOf(x) >= 0; }) &&
           m0.indexOf(String(q0.secenekler[0]).slice(0, 18)) >= 0,
           m0.slice(m0.indexOf("A şıkkı:"), m0.indexOf("A şıkkı:") + 60));
        var harfler = ["A", "B", "C", "D"];
        ok("metin: 'Doğru cevap: X. Çünkü:' cümlesi birleşiyor", m0.indexOf("Doğru cevap: " + harfler[q0.dogru] + ". Çünkü:") >= 0,
           m0.slice(Math.max(0, m0.indexOf("Doğru cevap:"))).slice(0, 70));
        ok("metin: açıklama (çözüm) okunuyor", m0.indexOf(String(q0.aciklama).slice(0, 25)) >= 0, String(q0.aciklama).slice(0, 45));
        ok("çalma: ilerleme çubuğu ve 'şu an okunan' kartı var",
           !!$("#sdCubuk i") && !!$("#sdSimdi") && /ŞU AN OKUNUYOR|DURAKLATILDI|ŞU AN OKUNAN/.test($("#sdSimdi").textContent),
           ($("#sdSimdi").textContent || "").slice(0, 30));

        /* ── 7) klasik mod: şık içermemeli ── */
        A.klasikAyarla(true, true);
        yakalanan.length = 0;
        A.oynat(0, true);
        var mk = yakalanan.length ? yakalanan[0].metin : "";
        ok("klasik mod: metinde şık YOK", mk.indexOf("şıkkı") < 0, mk.slice(0, 70));
        ok("klasik mod: soru + doğru cevap var", mk.indexOf(String(q0.soru).slice(0, 25)) >= 0 && mk.indexOf("Doğru cevap: ") >= 0, mk.slice(0, 60));
        ok("klasik mod: kısa metin (şıksız < şıklı)", mk.length < m0.length, mk.length + " < " + m0.length + " karakter");
        A.klasikAyarla(false, true);

        /* ── 8) ileri / geri gezinme ── */
        A.oynat(0);
        A.sonraki();
        ok("gezinme: sonraki soruya geçti", A.durum.i === 1 && yakalanan[yakalanan.length - 1].metin.indexOf(String(q1.soru).slice(0, 25)) >= 0, "i=" + A.durum.i);
        A.onceki();
        ok("gezinme: önceki soruya döndü", A.durum.i === 0, "i=" + A.durum.i);
        A.oynat(99);
        ok("gezinme: sınır dışı istek kırpıldı", A.durum.i === 2, "i=" + A.durum.i);
        $$("#sdListe [data-sd-oku]")[0].click();
        ok("gezinme: listeden 'dinle' düğmesi çalışıyor", A.durum.i === 0, "i=" + A.durum.i);

        /* ── 9) hız + otomatik geç anahtarı ── */
        $$("#sdOynatici [data-sd-hiz]")[0].click();
        ok("hız: 0.75× seçildi ve ses motoruna yazıldı", A.durum.hiz === 0.75 && depoAl("sesHiz", 1) === 0.75, "hiz=" + A.durum.hiz);
        A.hizAyarla(1);
        ok("hız: 1× geri alındı", A.durum.hiz === 1 && Number(depoAl("sesHiz", 1)) === 1, "hiz=" + A.durum.hiz);

        A.otoAyarla(false);
        yakalanan.length = 0;
        A.oynat(0);
        var bittiFn0 = yakalanan.length ? yakalanan[0].sec.bitti : null;
        if (bittiFn0) bittiFn0();
        ok("otomatik geç KAPALI: soru bitince ilerlemiyor", A.durum.i === 0 && A.durum.durum === "bitti", "i=" + A.durum.i + " / " + A.durum.durum);
        $("#sdOto").click();
        ok("otomatik geç anahtarı: açıldı", A.durum.oto === true && /✓/.test($("#sdOto").textContent), $("#sdOto").textContent.trim());
        yakalanan.length = 0;
        A.oynat(0);
        var bittiFn1 = yakalanan.length ? yakalanan[0].sec.bitti : null;
        if (bittiFn1) bittiFn1();

        /* ── 10) dinleme kaydı ── */
        var kayit = A.kayitAl();
        ok("kayıt: ustad.sesdene yazıldı (toplam > 0)", kayit.toplam > 0, JSON.stringify(kayit));
        ok("kayıt: süre ve son tarih tutuluyor", kayit.sureDk > 0 && !isNaN(Date.parse(kayit.sonTarih)), kayit.sureDk + " dk · " + kayit.sonTarih);
        ok("kayıt: süre tahmini makul (soru başına < 3 dk)", (kayit.sureDk / kayit.toplam) < 3,
           "soru başına " + (Math.round(kayit.sureDk / kayit.toplam * 10) / 10) + " dk");
        ok("kayıt: ekranda güncellendi", /Bugüne kadar/.test($("#sdKayit").textContent) && $("#sdKayit").textContent.indexOf(String(kayit.toplam)) >= 0, $("#sdKayit").textContent.slice(0, 50));

        /* ── 11) otomatik geçişi bekle (asenkron) — kart hafızası bu ana kadar DOLU kalmalı ──
           UYARI (ölçüm güvenilirliği): Bu sayfada bütün modüllerin kendi kendini testleri aynı anda
           koşar. Başka bir modülün testi bölüm değiştirdiğinde motor SESDENE.bolumAc(kod) çağırır ve
           bekleyen otomatik geçiş DOĞRU ŞEKİLDE iptal edilir (kullanıcı bölümden çıkıyor); ayrıca
           yoğun sayfada tarayıcı zamanlayıcıları geciktirebilir. Bu yüzden ölçüm sabit bir gecikmeye
           (setTimeout) DEĞİL, "sıradaki soruya geçti mi?" döngüsüne bağlanır: dış müdahale görülürse
           ölçüm yeniden kurulur ve başarı ya da süre dolana kadar beklenir. Modülün davranışı
           değişmez; yalnızca testin zamanlamaya bağımlılığı kaldırılır. */
        var otoGecisBekle = function (bitir) {
          var basla = Date.now(), deneme = 0, son = "";
          var kur = function () {
            deneme++;
            try { A.bolumAc("sesdene"); } catch (e) {}
            A.otoAyarla(true);          /* otomatik geç açık */
            A.turAyarla("yanlis");      /* kart listesi (3 soru) */
            yakalanan.length = 0;
            A.oynat(0);
            var f = yakalanan.length ? yakalanan[0].sec.bitti : null;
            if (f) f();                 /* ses bitti → modülün kendi geçiş zamanlayıcısı kurulur */
          };
          var bak = function () {
            son = "i=" + A.durum.i + " / " + A.durum.durum + (deneme > 1 ? " (" + deneme + ". ölçüm)" : "");
            if (A.durum.i >= 1) return bitir(true, son);
            if (Date.now() - basla > 15000) return bitir(false, son + " · 15 sn beklendi, geçiş olmadı");
            if (A.durum.durum === "duruk") { kur(); return void setTimeout(bak, 60); }  /* dış bölüm değişimi → yeniden kur */
            setTimeout(bak, 50);
          };
          setTimeout(bak, 50);
        };

        var devam = function (otoGecti, otoEk) {
          ok("otomatik geç AÇIK: soru bitince sıradakine geçti", otoGecti, otoEk);

          /* ── 12) "anladım" → karttan sil ── */
          var silinenId = (A.durum.liste[A.durum.i] || {}).kartId;
          var btnAnladim = $("#sdAnladim");
          ok("anladım: düğme yalnız kart sorularında var", !!btnAnladim && !!silinenId, String(silinenId));
          if (btnAnladim) btnAnladim.click();
          var kartSon = A.kartlar();
          ok("anladım: kart hafızasından silindi", kartSon.filter(function (k) { return k.id === silinenId; }).length === 0,
             kartSon.length + " kart kaldı");
          ok("anladım: listeden de düştü", A.durum.liste.filter(function (s) { return s.kartId === silinenId; }).length === 0, A.durum.liste.length + " satır kaldı");

          /* ── 13) boş durum ── */
          depoKoy("kartlar", {});
          A.turAyarla("yanlis");
          var bos = $("#sdBos");
          ok("boş durum: açık zeminli mesaj kutusu", !!bos && $$("#sdListe .sd-satir").length === 0, bos ? bos.textContent.slice(0, 60) : "kutu yok");
          ok("boş durum: yönlendirici metin var", !!bos && /kayna/i.test(bos.textContent), bos ? bos.textContent.slice(40, 110) : "kutu yok");

          /* ── 14) depoyu ESKİ HÂLİNE döndür ── */
          try { durdur(); } catch (e) {}
          try { if (window.KPSS_SES && eskiKonus) window.KPSS_SES.konus = eskiKonus; } catch (e) {}
          ANAHTARLAR.forEach(function (k) {
            if (vardi[k]) { try { localStorage.setItem("ustad." + k, eski[k]); } catch (e) {} }
            else depoSil(k);
          });
          var geriTam = ANAHTARLAR.every(function (k) {
            var simdiki = depoVar(k) ? localStorage.getItem("ustad." + k) : null;
            return simdiki === (vardi[k] ? eski[k] : null);
          });
          ok("geri yükleme: eski depo değerleri aynen döndü", geriTam, ANAHTARLAR.join(", "));
          ok("geri yükleme: ses motoru fonksiyonu geri kondu", window.KPSS_SES.konus === eskiKonus);
          var kalan = A.kayitAl();
          ok("geri yükleme: kayıt değeri eskiye döndü", kalan.toplam === (vardi.sesdene ? (JSON.parse(eski.sesdene || "{}").toplam || 0) : 0),
             kalan.toplam + " (eski " + (vardi.sesdene ? (JSON.parse(eski.sesdene || "{}").toplam || 0) : 0) + ")");
          A.bolumAc("sesdene");
          yaz();
        };

        otoGecisBekle(devam);

        };

        try { govde(); }
        catch (eH) { t.push("✘ test bloğu hata verdi → " + (eH && eH.message ? eH.message : String(eH))); yaz(); }
      }, 500);
    });
  }
})();
