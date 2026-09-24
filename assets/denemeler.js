/* © 2026 Kenan Kuzucu · ÜSTAD KPSS-B KOÇ PRO · DENEME KÜTÜPHANESİ · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Kaynak: window.USTAD_SORULAR (özgün banka) — YENİ SORU ÜRETİLMEZ. Her denemenin soruları
   ders + konu + zorluk ve SABİT TOHUM ile seçilir: aynı deneme her açılışta AYNI soruları getirir.
   Banka yetmezse eldeki sorularla doldurulur ve kullanıcıya dürüst uyarı gösterilir.
   Bu dosya index.html'e ve assets/motor.js'e DOKUNMAZ: ekran kabını (#ekran-denemeler), menü öğesini
   ve stil bağlantısını (assets/denemeler.css) KENDİSİ kurar.
   Sözleşme: window.DENEMELER.bolumAc = function (kod) { if (kod === "denemeler") ciz(); }
   Ölçüm kipi: index.html?test=1 → (en az 30 ölçüm) #denemelerTestSonuc */
(function () {
  "use strict";

  var A = window.DENEMELER = window.DENEMELER || {};
  /* Dosya iki kez yüklenirse (index.html'de bir kez + birleştirilmiş pakette bir kez gibi)
     ikinci kopya HİÇBİR ŞEY yapmaz: aksi hâlde iki ayrı durum (D) oluşur ve tıklamalar
     birinci kopyayı güncellerken test/okuma ikincisini okur. */
  if (A.__yuklendi) return;
  A.__yuklendi = true;
  var BOLUM = "denemeler";

  /* ═══════════════ sabitler ═══════════════ */
  var TAM_SAYI = 10, TAM_SORU = 120, TAM_SURE = 130;      /* 10 tam deneme · 120 soru · 130 dk */
  var KONU_SAYI = 30, KONU_SORU = 20, KONU_SURE = 25;     /* 30 konu denemesi · 20 soru · 25 dk  */
  var HARFLER = ["A", "B", "C", "D"];
  var KAYIT_ANAHTAR = "denemeler.sonuc";                  /* localStorage: ustad.denemeler.sonuc */
  var MAX_KAYIT = 200;
  var TUMU = "__hepsi__";

  /* KPSS-B resmî dağılım: 30 Türkçe + 30 Matematik + 27 Tarih + 18 Coğrafya + 9 Vatandaşlık + 6 Güncel */
  var TAM_DAGILIM = [
    { ders: "Türkçe", soru: 30 },
    { ders: "Matematik", soru: 30 },
    { ders: "Tarih", soru: 27 },
    { ders: "Coğrafya", soru: 18 },
    { ders: "Vatandaşlık", soru: 9 },
    { ders: "Güncel Bilgiler", soru: 6 }
  ];

  /* Zorluk profilleri — seçim bu oranları hedefler; etiket HER ZAMAN seçilen soruların
     gerçek zorluk dağılımından hesaplanır (uydurma etiket yok). */
  var PROFIL = [
    { ad: "Kolay ağırlıklı", dagilim: { Kolay: 0.60, Orta: 0.33, Zor: 0.07 } },
    { ad: "Orta ağırlıklı", dagilim: { Kolay: 0.30, Orta: 0.50, Zor: 0.20 } },
    { ad: "Zor ağırlıklı", dagilim: { Kolay: 0.15, Orta: 0.45, Zor: 0.40 } },
    { ad: "Dengeli", dagilim: { Kolay: 0.40, Orta: 0.40, Zor: 0.20 } }
  ];

  /* 30 konu denemesi — ders · konu deseni (bankadaki KONU ADLARIYLA eşleşir, uydurma konu yok) */
  var KONU_TANIM = [
    { ders: "Türkçe", ad: "Paragraf Denemesi", desen: /^Paragraf$/ },
    { ders: "Türkçe", ad: "Sözcükte Anlam Denemesi", desen: /Sözcükte Anlam/ },
    { ders: "Türkçe", ad: "Cümlede Anlam Denemesi", desen: /Cümlede Anlam/ },
    { ders: "Türkçe", ad: "Yazım Kuralları Denemesi", desen: /Yazım Kuralları/ },
    { ders: "Türkçe", ad: "Noktalama İşaretleri Denemesi", desen: /Noktalama/ },
    { ders: "Türkçe", ad: "Dil Bilgisi Denemesi", desen: /Sözcük Türleri|Sözcük Yapısı|Filimsi|Fiil Çatısı|Cümle Bilgisi|Cümlenin Ögeleri|Cümle Türleri|Anlatım Bozuklukları|Ses Bilgisi/ },

    { ders: "Matematik", ad: "Temel Kavramlar Denemesi", desen: /Temel Kavramlar/ },
    { ders: "Matematik", ad: "Problemler Denemesi", desen: /^Problemler/ },
    { ders: "Matematik", ad: "Yüzde ve Kâr-Zarar Denemesi", desen: /Yüzde/ },
    { ders: "Matematik", ad: "Permütasyon, Kombinasyon ve Olasılık Denemesi", desen: /Permütasyon|Olasılık/ },
    { ders: "Matematik", ad: "Geometri Denemesi", desen: /Geometri|Çember|Katı Cisim/ },
    { ders: "Matematik", ad: "Sayılar ve Bölünebilme Denemesi", desen: /Sayılar|Bölme|Bölünebilme|EBOB|EKOK|Rasyonel|Ondalık|Üslü|Köklü|Mutlak|Eşitsizlik|Çarpanlara|Dizileri/ },

    { ders: "Tarih", ad: "Kurtuluş Savaşı Denemesi", desen: /Kurtuluş Savaşı/ },
    { ders: "Tarih", ad: "Atatürk İlke ve İnkılapları Denemesi", desen: /Atatürk/ },
    { ders: "Tarih", ad: "Osmanlı Kuruluş ve Yükseliş Denemesi", desen: /Osmanlı Kuruluş|Osmanlı Kültür/ },
    { ders: "Tarih", ad: "Osmanlı Duraklama-Gerileme-Dağılma Denemesi", desen: /Osmanlı Duraklama|Osmanlı Dağılma|Osmanlı Yenileşme/ },
    { ders: "Tarih", ad: "İslamiyet Öncesi ve İlk Türk-İslam Devletleri Denemesi", desen: /İslamiyet Öncesi|Türk-İslam|İlk Müslüman/ },
    { ders: "Tarih", ad: "Çağdaş Türk ve Dünya Tarihi Denemesi", desen: /Çağdaş/ },

    { ders: "Coğrafya", ad: "Coğrafi Konum, Su ve Topraklar Denemesi", desen: /Coğrafi Konumu|Su Varlığı|Toprak/ },
    { ders: "Coğrafya", ad: "Yer Şekilleri Denemesi", desen: /Yer Şekilleri/ },
    { ders: "Coğrafya", ad: "İklim, Bitki Örtüsü ve Doğal Afetler Denemesi", desen: /İklim|Doğal Afet|Çevre/ },
    { ders: "Coğrafya", ad: "Nüfus, Yerleşme ve Göçler Denemesi", desen: /Nüfus|Yerleşme|Göç/ },
    { ders: "Coğrafya", ad: "Türkiye Ekonomisi (Tarım, Hayvancılık, Ormancılık) Denemesi", desen: /Tarım|Hayvancılık|Ormancılık/ },
    { ders: "Coğrafya", ad: "Madenler, Enerji, Sanayi ve Ulaşım Denemesi", desen: /Maden|Enerji|Sanayi|Ulaşım|Turizm|Ticaret/ },

    { ders: "Vatandaşlık", ad: "Temel Hukuk ve Temel Haklar Denemesi", desen: /Temel Hukuk|Temel Hak ve Ödevler/ },
    { ders: "Vatandaşlık", ad: "Yasama (TBMM) Denemesi", desen: /Yasama/ },
    { ders: "Vatandaşlık", ad: "Yürütme ve İdare Denemesi", desen: /Yürütme|İdare/ },
    { ders: "Vatandaşlık", ad: "Anayasal Gelişmeler Denemesi", desen: /Anayasal|1982 Anayasası/ },
    { ders: "Vatandaşlık", ad: "Yargı ve Mahalli İdareler Denemesi", desen: /Yargı|Mahalli İdare|Siyasi Parti|Yönetim Yapısı/ },

    { ders: "Güncel Bilgiler", ad: "Güncel Gelişmeler Denemesi", desen: /Uluslararası Kuruluşlar|Üye Olduğu Kuruluşlar|Güncel/ }
  ];

  /* ═══════════════ yardımcılar ═══════════════ */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function depoVar(k) { try { return localStorage.getItem("ustad." + k) !== null; } catch (e) { return false; } }
  function depoAl(k, v) { try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } }
  function depoKoy(k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); } catch (e) {} }
  function depoSil(k) { try { localStorage.removeItem("ustad." + k); } catch (e) {} }
  function ses(metin) { try { if (window.KPSS_SES && window.KPSS_SES.konus) window.KPSS_SES.konus(metin); } catch (e) {} }
  function i2(n) { return n < 10 ? "0" + n : "" + n; }
  function tarihYaz(ts) {
    var d = new Date(ts);
    return i2(d.getDate()) + "." + i2(d.getMonth() + 1) + "." + d.getFullYear() + " " + i2(d.getHours()) + ":" + i2(d.getMinutes());
  }
  function netYaz(n) { return (Math.round(n * 100) / 100).toFixed(2).replace(".", ","); }
  function saniyeYaz(sn) {
    sn = Math.max(0, Math.round(sn || 0));
    var d = Math.floor(sn / 60), s = sn % 60;
    return d + ":" + (s < 10 ? "0" + s : s);
  }

  /* ── tohumlu rastgele (Math.random KULLANILMAZ: aynı tohum → aynı sorular) ── */
  function tohumHash(s) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rastgele(t) {
    var a = (t >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function karistir(dizi, rng) {
    var b = dizi.slice();
    for (var i = b.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)), t = b[i]; b[i] = b[j]; b[j] = t;
    }
    return b;
  }

  /* ═══════════════ banka ═══════════════ */
  function sorular() { var s = window.USTAD_SORULAR; return Array.isArray(s) ? s : []; }
  function paketDersler() { var p = window.USTAD_PAKET; return (p && p.dersler) || []; }
  function normZorluk(z) { return (z === "Kolay" || z === "Orta" || z === "Zor") ? z : "Orta"; }

  /** Bankayı seçim kaydına çevirir (i = bankadaki sıra → kimlik). Banka DEĞİŞTİRİLMEZ. */
  function kayitYap(banka) {
    var out = [];
    for (var i = 0; i < banka.length; i++) {
      var s = banka[i];
      if (!s || typeof s !== "object") continue;
      if (!s.soru || !Array.isArray(s.secenekler) || s.secenekler.length < 2) continue;  /* bozuk kayıt seçilmez */
      out.push({ s: s, i: i, ders: s.ders || "", konu: s.konu || "", zorluk: normZorluk(s.zorluk) });
    }
    return out;
  }

  /* ── zorluk hedefi (en büyük kalan yöntemi) ── */
  function zorlukSay(dagilim, n) {
    var Z = ["Kolay", "Orta", "Zor"], kesir = [], out = { Kolay: 0, Orta: 0, Zor: 0 }, toplam = 0;
    Z.forEach(function (z) {
      var v = n * ((dagilim && dagilim[z]) || 0), t = Math.floor(v);
      out[z] = t; toplam += t; kesir.push({ z: z, k: v - t });
    });
    kesir.sort(function (a, b) { return b.k - a.k; });
    var eksik = n - toplam, i = 0;
    while (eksik > 0 && kesir.length) { out[kesir[i % kesir.length].z]++; eksik--; i++; }
    return out;
  }
  /** Gerçek dağılımdan zorluk etiketi (uydurma değil, ölçüm). */
  function zorlukEtiket(sayac) {
    var t = sayac.Kolay + sayac.Orta + sayac.Zor;
    if (!t) return "—";
    var puan = (sayac.Kolay * 1 + sayac.Orta * 2 + sayac.Zor * 3) / t;
    if (puan <= 1.55) return "Kolay";
    if (puan <= 2.20) return "Orta";
    return "Zor";
  }

  /* ═══════════════ seçim (katmanlı: konu → ders → banka) ═══════════════
     katmanlar: [{ havuz:[kayit], seviye:n, etiket:"..." }, ...] — sırayla tüketilir.
     Aynı deneme içinde AYNI soru iki kez gelmez; önce başka denemede kullanılmamış
     sorular tercih edilir (denemeler arası paylaşım en aza iner). */
  /** katmanlar: [{ havuz:[kayit], seviye:n }, ...] — sırayla tüketilir.
     `dislama` (opsiyonel): deneme genelinde paylaşılan "bu denemede seçildi" kümesi.
     Bu sayede tam denemelerde bir dersin diğer derslerden tamamlanan soruları
     başka bir ders tarafından TEKRAR seçilemez (aynı denemede tekrar yok). */
  function secim(katmanlar, adet, rng, dagilim, kullanilan, dislama) {
    var hedef = zorlukSay(dagilim, adet), Z = ["Kolay", "Orta", "Zor"];
    var secili = [], secSet = {}, sayac = { Kolay: 0, Orta: 0, Zor: 0 }, seviye = 0;
    if (dislama) Object.keys(dislama).forEach(function (k) { secSet[k] = true; });

    katmanlar.forEach(function (K, idx) {
      if (secili.length >= adet || !K || !K.havuz || !K.havuz.length) return;
      var aday = K.havuz.filter(function (r) { return !secSet[r.i]; });
      var sira = karistir(aday.filter(function (r) { return !kullanilan[r.i]; }), rng)
        .concat(karistir(aday.filter(function (r) { return kullanilan[r.i]; }), rng));
      var eklenen = 0;
      /* 1) zorluk hedeflerini bu katmandan tamamla */
      Z.forEach(function (z) {
        while (sayac[z] < hedef[z] && secili.length < adet) {
          var bulundu = false;
          for (var j = 0; j < sira.length; j++) {
            var r = sira[j];
            if (!r || secSet[r.i] || r.zorluk !== z) continue;
            secili.push(r); secSet[r.i] = true; sayac[z]++; sira[j] = null; eklenen++; bulundu = true; break;
          }
          if (!bulundu) break;
        }
      });
      /* 2) kalanı sırayla doldur */
      for (var j2 = 0; j2 < sira.length && secili.length < adet; j2++) {
        var r2 = sira[j2];
        if (!r2 || secSet[r2.i]) continue;
        secili.push(r2); secSet[r2.i] = true; sayac[r2.zorluk]++; eklenen++;
      }
      if (eklenen > 0) seviye = Math.max(seviye, K.seviye || 0);
    });

    return { secili: secili, eksik: adet - secili.length, seviye: seviye, sayac: sayac, hedef: hedef,
      dislamaYaz: function () { if (dislama) secili.forEach(function (r) { dislama[r.i] = true; }); } };
  }

  /* ═══════════════ kurgu: 10 tam + 30 konu denemesi ═══════════════ */
  function konuEtiketYap(secili, sinir) {
    var gorulen = {}, liste = [];
    secili.forEach(function (r) {
      var k = r.konu || r.ders;
      if (k && !gorulen[k]) { gorulen[k] = true; liste.push(k); }
    });
    if (!liste.length) return "—";
    var sn = sinir || 2;
    return liste.slice(0, sn).join(", ") + (liste.length > sn ? " +" + (liste.length - sn) : "");
  }

  function kurgula(bankaArg) {
    var banka = Array.isArray(bankaArg) ? bankaArg : sorular();
    var kayitlar = kayitYap(banka);
    var kullanilan = {};
    var tam = [], konu = [], genelUyari = [];

    /* ── 10 TAM DENEME ── */
    for (var i = 1; i <= TAM_SAYI; i++) {
      var rng = rastgele(tohumHash("ustad-deneme-tam-" + i));
      var profil = PROFIL[(i - 1) % PROFIL.length];
      var secili = [], dersOzet = [], uyarilar = [];
      var denemeSecSet = {};   /* bu denemede seçilen tüm sorular — dersler arası paylaşılır */

      TAM_DAGILIM.forEach(function (dd) {
        var havuz = kayitlar.filter(function (r) { return r.ders === dd.ders; });
        var katmanlar = [{ havuz: havuz, seviye: 0 }];
        if (havuz.length < dd.soru) katmanlar.push({ havuz: kayitlar, seviye: 1 });  /* banka yetersiz → eldekilerle doldur */
        var s = secim(katmanlar, dd.soru, rng, profil.dagilim, kullanilan, denemeSecSet);
        s.dislamaYaz();
        secili = secili.concat(s.secili);
        dersOzet.push({ ders: dd.ders, istenen: dd.soru, gelen: s.secili.length, havuz: havuz.length });
        if (s.seviye > 0) uyarilar.push(dd.ders + " bankasında " + havuz.length + " soru var, " + dd.soru +
          " gerekiyordu; " + (dd.soru - s.secili.length) + " soru diğer derslerden eklendi.");
        if (s.eksik > 0) uyarilar.push(dd.ders + " için " + s.eksik + " soru bulunamadı.");
      });

      secili.forEach(function (r) { kullanilan[r.i] = true; });
      var sayac = { Kolay: 0, Orta: 0, Zor: 0 };
      secili.forEach(function (r) { sayac[r.zorluk]++; });
      var d = {
        kod: "tam-" + i, tur: "tam", no: i, ad: i + ". Tam Deneme",
        altAd: "KPSS-B Genel Yetenek & Genel Kültür", ders: "", konuEtiket: "6 ders · sınav formatı",
        dersListesi: TAM_DAGILIM.map(function (x) { return x.ders; }),
        istenen: TAM_SORU, sureDk: TAM_SURE, tohum: "ustad-deneme-tam-" + i, profil: profil.ad,
        sorular: secili, soruSayisi: secili.length, zorlukSayac: sayac, zorluk: zorlukEtiket(sayac),
        dersOzet: dersOzet, uyari: uyarilar.join(" ") || null,
        konular: konuEtiketYap(secili, 3)
      };
      tam.push(d);
    }

    /* ── 30 KONU DENEMESİ ── */
    KONU_TANIM.forEach(function (T, idx) {
      var rng = rastgele(tohumHash("ustad-deneme-konu-" + (idx + 1) + "-" + T.ders));
      var profil = PROFIL[idx % PROFIL.length];
      var konuHavuz = kayitlar.filter(function (r) { return r.ders === T.ders && T.desen.test(r.konu); });
      var dersHavuz = kayitlar.filter(function (r) { return r.ders === T.ders; });
      var katmanlar = [{ havuz: konuHavuz, seviye: 0 }, { havuz: dersHavuz, seviye: 1 }];
      if (dersHavuz.length < KONU_SORU) katmanlar.push({ havuz: kayitlar, seviye: 2 });
      var s = secim(katmanlar, KONU_SORU, rng, profil.dagilim, kullanilan);
      s.secili.forEach(function (r) { kullanilan[r.i] = true; });

      var sayac = { Kolay: 0, Orta: 0, Zor: 0 };
      s.secili.forEach(function (r) { sayac[r.zorluk]++; });
      var uyari = null;
      if (s.seviye === 1) {
        uyari = T.ders + " bankasında bu konuda " + konuHavuz.length + " soru var; denemenin kalanı aynı dersin diğer konularından seçildi.";
      } else if (s.seviye === 2) {
        uyari = T.ders + " bankasında bu konuda " + konuHavuz.length + " soru var; kalan sorular diğer derslerden tamamlandı.";
      }
      if (s.eksik > 0) uyari = (uyari ? uyari + " " : "") + "Bankada toplam soru yetmedi: " + s.eksik + " soru eksik kaldı.";

      konu.push({
        kod: "konu-" + (idx + 1), tur: "konu", no: idx + 1, ad: T.ders + " · " + T.ad,
        altAd: T.ad, ders: T.ders, konuEtiket: T.ders + " · " + konuEtiketYap(s.secili, 2),
        dersListesi: [T.ders], istenen: KONU_SORU, sureDk: KONU_SURE,
        tohum: "ustad-deneme-konu-" + (idx + 1) + "-" + T.ders, profil: profil.ad,
        sorular: s.secili, soruSayisi: s.secili.length, zorlukSayac: sayac, zorluk: zorlukEtiket(sayac),
        havuz: { konu: konuHavuz.length, ders: dersHavuz.length }, uyari: uyari, konular: konuEtiketYap(s.secili, 3)
      });
    });

    /* ── genel banka bilgisi (dürüst: denemeler arası paylaşım) ── */
    TAM_DAGILIM.forEach(function (dd) {
      var n = kayitlar.filter(function (r) { return r.ders === dd.ders; }).length;
      var istenen = dd.soru * TAM_SAYI;
      if (n < istenen) {
        genelUyari.push(dd.ders + ": bankada " + n + " soru — 10 tam deneme " + istenen +
          " soru istiyor; " + (istenen - n) + " soru denemeler arasında paylaşılır (her denemede tekrar yok).");
      }
    });

    return {
      tam: tam, konu: konu, hepsi: tam.concat(konu), bankaSayisi: banka.length,
      kayitSayisi: kayitlar.length, genelUyari: genelUyari, tohumlu: true
    };
  }

  /* ═══════════════ sonuç deposu ═══════════════ */
  function gecmis() { var g = depoAl(KAYIT_ANAHTAR, []); return Array.isArray(g) ? g : []; }
  function gecmisKoy(g) { depoKoy(KAYIT_ANAHTAR, g.slice(0, MAX_KAYIT)); }
  function kayitlarKod(kod) { return gecmis().filter(function (k) { return k && k.kod === kod; }); }
  function sonNet(kod) { var k = kayitlarKod(kod); return k.length ? Number(k[0].net) : null; }
  function enIyiNet(kod) {
    var liste = kod ? kayitlarKod(kod) : gecmis();
    if (!liste.length) return null;
    var en = null;
    liste.forEach(function (k) { var n = Number(k.net); if (en === null || n > en) en = n; });
    return en;
  }
  function ortalamaNet() {
    var g = gecmis(); if (!g.length) return null;
    var t = 0; g.forEach(function (k) { t += Number(k.net) || 0; });
    return Math.round((t / g.length) * 100) / 100;
  }
  function cozulduMu(kod) { return kayitlarKod(kod).length > 0; }
  /** net = doğru − yanlış / 4 (2 basamağa yuvarlanır) */
  function netHesap(dogru, yanlis) { return Math.round((dogru - yanlis / 4) * 100) / 100; }
  function kayitEkle(deneme, sonuc, gecenSn) {
    var g = gecmis();
    var k = {
      kod: deneme.kod, ad: deneme.ad, tur: deneme.tur, ders: deneme.ders || "",
      tarih: new Date().toISOString(), ts: Date.now(),
      net: sonuc.net, dogru: sonuc.dogru, yanlis: sonuc.yanlis, bos: sonuc.bos,
      toplam: deneme.soruSayisi, sureDk: deneme.sureDk, gecenSn: gecenSn
    };
    g.unshift(k);
    gecmisKoy(g);
    return k;
  }
  /** Yanlış yapılan konuları uygulamanın "eksik konu avcısına" da işle (ustad.yanlisKonu). */
  function yanlisKonuIsle(yanlisKayitlar) {
    if (!yanlisKayitlar.length) return;
    var m = depoAl("yanlisKonu", null);
    if (!m || typeof m !== "object") m = {};
    yanlisKayitlar.forEach(function (r) {
      var k = (r.konu || "—") + "|" + (r.ders || "—");
      m[k] = (Number(m[k]) || 0) + 1;
    });
    depoKoy("yanlisKonu", m);
    try { if (window.DEFTER && window.DEFTER.yenile) window.DEFTER.yenile(); } catch (e) {}
  }

  /* ═══════════════ durum ═══════════════ */
  var D = {
    gorunum: "liste",                     /* liste | cozum | sonuc */
    kurgu: null,
    filtre: { ders: TUMU, cozulmemis: false },
    K: null,                              /* aktif çözüm oturumu */
    sonSonuc: null,                       /* son gösterilen sonuç (test erişimi için) */
    kuruldu: false
  };

  /* ═══════════════ çizim: liste ═══════════════ */
  function kutu(deger, etiket, genis) {
    return '<div class="dn-kutu' + (genis ? " dn-genis" : "") + '"><b>' + kacis(deger) + '</b><span>' + kacis(etiket) + '</span></div>';
  }
  function etiket(yazi) { return '<span class="dn-etiket">' + kacis(yazi) + '</span>'; }
  function zorlukEtiketDom(d) {
    var sn = d.zorluk === "Kolay" ? "dn-kolay" : (d.zorluk === "Zor" ? "dn-zor" : "dn-orta");
    return '<span class="dn-etiket ' + sn + '">' + kacis(d.zorluk) + '</span>';
  }
  function derslerListe() {
    var p = paketDersler().map(function (d) { return d.ad; });
    return p.length ? p : ["Türkçe", "Matematik", "Tarih", "Coğrafya", "Vatandaşlık", "Güncel Bilgiler"];
  }
  function gecerMi(d) {
    if (D.filtre.ders !== TUMU) {
      if (d.tur === "tam") { if (d.dersListesi.indexOf(D.filtre.ders) < 0) return false; }
      else if (d.ders !== D.filtre.ders) return false;
    }
    if (D.filtre.cozulmemis && cozulduMu(d.kod)) return false;
    return true;
  }
  function kartDom(d) {
    var son = sonNet(d.kod), iyi = enIyiNet(d.kod), cozuldu = son !== null;
    var h = '<div class="dn-kart' + (cozuldu ? " dn-cozuldu" : "") + (d.uyari ? " dn-eksik" : "") +
      (gecerMi(d) ? "" : " dn-gizli") + '" data-dn-kart="' + kacis(d.kod) + '">';
    h += '<div class="dn-kart-ust"><div class="dn-kart-ad">' + kacis(d.ad) + '</div>' +
      '<span class="dn-durum ' + (cozuldu ? "dn-var" : "dn-yok") + '">' + (cozuldu ? "✔ Çözüldü" : "○ Çözülmedi") + '</span></div>';
    h += '<div class="dn-etiketler">' + etiket(d.soruSayisi + " soru") + etiket(d.sureDk + " dk") +
      zorlukEtiketDom(d) + '<span class="dn-etiket dn-konubilgi">' + kacis(d.konuEtiket) + '</span>' +
      (d.uyari ? '<span class="dn-etiket dn-uyarili">⚠ banka uyarısı</span>' : "") + '</div>';
    h += '<div class="dn-kart-alt">' + kacis(d.altAd) + ' · tohum: ' + kacis(d.tohum) + '</div>';
    h += '<div class="dn-kart-net">' + (cozuldu
      ? 'Son net: <b>' + netYaz(son) + '</b> · En iyi net: <b>' + netYaz(iyi) + '</b>'
      : 'Net sonucu: <b>—</b> (henüz çözülmedi)') + '</div>';
    h += '<div class="dn-dugme-satir"><button class="dn-dugme" data-dn-islem="coz" data-kod="' + kacis(d.kod) + '">' +
      (cozuldu ? "🔁 Yeniden çöz" : "▶ Çözmeye başla") + '</button></div>';
    if (d.uyari) h += '<div class="dn-kart-alt">⚠ ' + kacis(d.uyari) + '</div>';
    return h + '</div>';
  }
  function grupDom(baslik, simge, liste) {
    return '<div class="dn-grup"><div class="dn-grup-baslik"><b>' + simge + " " + kacis(baslik) + '</b>' +
      '<span class="dn-adet">' + liste.length + ' deneme</span></div>' +
      '<div class="dn-kartlar">' + liste.map(kartDom).join("") + '</div></div>';
  }
  function gecmisDom() {
    var g = gecmis();
    var h = '<div class="dn-gecmis"><div class="dn-gecmis-baslik"><b>🗂️ Sonuç Geçmişi</b>' +
      '<span>' + g.length + ' kayıt · en iyi net: ' + (enIyiNet(null) === null ? "—" : netYaz(enIyiNet(null))) + '</span></div>';
    if (!g.length) return h + '<div class="dn-bos">Henüz çözülmüş deneme yok. Bir denemeyi bitirdiğinde net sonucun ve "en iyi net"in buraya yazılır.</div></div>';
    h += '<div class="dn-kaydir"><table class="dn-tablo dn-gecmis-tablo"><thead><tr>' +
      '<th>Deneme</th><th>Tarih</th><th class="dn-sayi">Net</th><th class="dn-sayi">Doğru</th>' +
      '<th class="dn-sayi">Yanlış</th><th class="dn-sayi">Boş</th><th class="dn-sayi">Süre</th></tr></thead><tbody>';
    g.slice(0, 20).forEach(function (k) {
      h += '<tr><td>' + kacis(k.ad) + '</td><td>' + kacis(tarihYaz(k.ts || Date.parse(k.tarih))) + '</td>' +
        '<td class="dn-sayi"><b>' + netYaz(k.net) + '</b></td><td class="dn-sayi">' + k.dogru + '</td>' +
        '<td class="dn-sayi">' + k.yanlis + '</td><td class="dn-sayi">' + k.bos + '</td>' +
        '<td class="dn-sayi">' + Math.round((k.gecenSn || 0) / 60) + " dk</td></tr>";
    });
    if (g.length > 20) h += '<tr><td colspan="7">… ilk 20 kayıt gösteriliyor (toplam ' + g.length + ')</td></tr>';
    return h + '</tbody></table></div>' +
      '<div class="dn-dugme-satir"><button class="dn-dugme dn-ikincil" data-dn-islem="gecmisSil">🗑 Geçmişi temizle</button></div></div>';
  }
  function listeDom() {
    var k = D.kurgu;
    var cozulen = k.hepsi.filter(function (d) { return cozulduMu(d.kod); }).length;
    var iyi = enIyiNet(null), ort = ortalamaNet();

    var h = '<div class="dn-kutular">' + kutu(k.hepsi.length, "TOPLAM DENEME") + kutu(cozulen, "ÇÖZÜLEN") +
      kutu(iyi === null ? "—" : netYaz(iyi), "EN İYİ NET") + kutu(ort === null ? "—" : netYaz(ort), "ORTALAMA NET") +
      kutu(k.kayitSayisi + " soru", "SORU BANKASI", true) + '</div>';

    h += '<div class="dn-filtre"><b>Ders seçimi</b><div class="dn-secim">' +
      '<button class="dn-sec' + (D.filtre.ders === TUMU ? " dn-secili" : "") + '" data-dn-islem="ders" data-ders="' + TUMU + '">' +
      '<span>🎯 Tüm dersler</span><span class="dn-sayi">' + k.hepsi.length + '</span></button>' +
      derslerListe().map(function (ad) {
        var n = k.hepsi.filter(function (d) { return d.tur === "konu" ? d.ders === ad : d.dersListesi.indexOf(ad) >= 0; }).length;
        return '<button class="dn-sec' + (D.filtre.ders === ad ? " dn-secili" : "") + '" data-dn-islem="ders" data-ders="' + kacis(ad) + '">' +
          '<span>' + kacis(ad) + '</span><span class="dn-sayi">' + n + '</span></button>';
      }).join("") + '</div></div>';

    h += '<div class="dn-filtre"><b>Görünüm</b><div class="dn-secim">' +
      '<button class="dn-anahtar' + (D.filtre.cozulmemis ? " dn-acik" : "") + '" data-dn-islem="cozulmemis" id="dnCozulmemis">' +
      '<i></i><span>Sadece çözülmemişler</span></button>' +
      '<button class="dn-dugme dn-ikincil" data-dn-islem="tohumDogrula">🔎 Tohum doğrula</button></div></div>';

    if (k.genelUyari.length) {
      h += '<div class="dn-uyari"><b>⚠ Banka uyarısı — yeni soru üretilmez</b>' +
        'Denemeler yalnızca mevcut soru bankasından seçilir. Banka bir dersin 10 denemeye yetecek soru sayısına ulaşmadığı için:' +
        '<ul>' + k.genelUyari.map(function (u) { return "<li>" + kacis(u) + "</li>"; }).join("") + '</ul></div>';
    } else {
      h += '<div class="dn-not">Banka yeterli: her deneme kendi içinde tekrarsız sorularla dolduruldu.</div>';
    }

    h += grupDom("Tam Denemeler", "🎯", k.tam);
    h += grupDom("Konu Denemeleri", "📚", k.konu);
    h += gecmisDom();
    return h;
  }

  /* ═══════════════ çizim: çözüm ═══════════════ */
  function aktifSoru() { return D.K.deneme.sorular[D.K.i]; }
  /** Soru bankası boşken (ya da denemeye soru düşmediğinde) gösterilen güvenli ekran. */
  function bosCozumDom(d) {
    return '<div class="dn-bos"><b>' + kacis(d ? d.ad : "Deneme") + '</b> için soru yok. ' +
      'Bu denemede soru yok (soru bankası boş ya da yüklenmedi); banka yüklendiğinde tekrar dene.</div>' +
      '<div class="dn-dugme-satir"><button class="dn-dugme dn-ikincil" data-dn-islem="liste">📋 Listeye dön</button></div>';
  }
  function cozumDom() {
    if (!D.K) return bosCozumDom(null);
    var K = D.K, d = K.deneme;
    if (!d.sorular.length) return bosCozumDom(d);
    var r = aktifSoru(), s = r.s;
    var h = '<div class="dn-cozum">';
    h += '<div class="dn-ust"><div class="dn-ust-ad">' + kacis(d.ad) + '</div>' +
      '<div class="dn-ust-bilgi">' +
      '<span class="dn-sayac" id="dnSayac">' + saniyeYaz(kalanSaniye()) + '</span>' +
      '<span class="dn-sira" id="dnSira">Soru ' + (K.i + 1) + " / " + d.soruSayisi + '</span>' +
      '<button class="dn-dugme dn-ikincil" data-dn-islem="liste">✕ Bırak</button></div></div>';
    h += '<div class="dn-cubuk"><i id="dnCubuk" style="width:' + Math.round(((K.i + 1) / d.soruSayisi) * 100) + '%"></i></div>';
    h += '<div class="dn-soru"><div class="dn-etiketler">' + etiket(s.ders || "") + etiket(s.konu || "") +
      zorlukEtiketDom({ zorluk: normZorluk(s.zorluk) }) + '<span class="dn-etiket dn-konubilgi">' + kacis(d.profil) + '</span></div>';
    if (s.metin) h += '<p class="dn-metin">' + kacis(s.metin) + '</p>';
    h += '<h4>' + (K.i + 1) + ") " + kacis(s.soru) + '</h4>';
    (s.secenekler || []).forEach(function (sec, j) {
      h += '<button class="dn-sik' + (K.cevaplar[K.i] === j ? " dn-secili" : "") + '" data-dn-islem="sik" data-sik="' + j + '">' +
        '<span class="dn-harf">' + (HARFLER[j] || (j + 1)) + '</span><span>' + kacis(sec) + '</span></button>';
    });
    h += '<div class="dn-islak">' +
      '<button class="dn-dugme dn-ikincil" data-dn-islem="onceki"' + (K.i === 0 ? " disabled" : "") + '>← Önceki</button>' +
      '<button class="dn-dugme dn-ikincil" data-dn-islem="sonraki"' + (K.i >= d.soruSayisi - 1 ? " disabled" : "") + '>Sonraki →</button>' +
      '<button class="dn-dugme dn-ikincil" data-dn-islem="temizle">⌫ Cevabı sil</button>' +
      '<button class="dn-dugme" data-dn-islem="bitir">🏁 Denemeyi bitir</button>' +
      '<span class="dn-kart-alt"><i class="dn-isaret' + (K.cevaplar[K.i] === null ? " dn-isaret-yok" : "") + '"></i>' +
      'cevaplanan: ' + cevaplananSayisi() + " / " + d.soruSayisi + ' · boş: ' + (d.soruSayisi - cevaplananSayisi()) + '</span>' +
      '</div></div></div>';
    return h;
  }
  function cevaplananSayisi() {
    var n = 0; D.K.cevaplar.forEach(function (c) { if (c !== null && c !== undefined) n++; });
    return n;
  }
  function kalanSaniye() {
    if (!D.K) return 0;
    return Math.max(0, Math.round((D.K.bitis - Date.now()) / 1000));
  }

  /* ═══════════════ çizim: sonuç ═══════════════ */
  function sonucHesapla(K) {
    var dogru = 0, yanlis = 0, bos = 0;
    var dersTablo = {}, yanlisKonu = {}, bosKonu = {}, yanlisKayitlar = [];
    K.deneme.sorular.forEach(function (r, idx) {
      var verilen = K.cevaplar[idx];
      var dAd = r.ders || "—";
      if (!dersTablo[dAd]) dersTablo[dAd] = { ders: dAd, soru: 0, dogru: 0, yanlis: 0, bos: 0 };
      dersTablo[dAd].soru++;
      if (verilen === null || verilen === undefined) {
        bos++; dersTablo[dAd].bos++;
        var bk = dAd + " · " + (r.konu || "—");
        bosKonu[bk] = (bosKonu[bk] || 0) + 1;
      } else if (verilen === r.s.dogru) {
        dogru++; dersTablo[dAd].dogru++;
      } else {
        yanlis++; dersTablo[dAd].yanlis++;
        yanlisKayitlar.push(r);
        var yk = dAd + " · " + (r.konu || "—");
        yanlisKonu[yk] = (yanlisKonu[yk] || 0) + 1;
      }
    });
    function sirala(m) {
      return Object.keys(m).map(function (k) { return { etiket: k, adet: m[k] }; })
        .sort(function (a, b) { return b.adet - a.adet; });
    }
    return {
      dogru: dogru, yanlis: yanlis, bos: bos, toplam: K.deneme.soruSayisi,
      net: netHesap(dogru, yanlis),
      dersTablo: Object.keys(dersTablo).map(function (k) { return dersTablo[k]; }),
      yanlisKonular: sirala(yanlisKonu), bosKonular: sirala(bosKonu),
      yanlisKayitlar: yanlisKayitlar
    };
  }
  function sonucDom() {
    var K = D.K, d = K.deneme, sn = D.sonSonuc;
    if (!sn) return '<div class="dn-bos">Sonuç bulunamadı.</div>';
    var h = '<div class="dn-sonuc">';
    h += '<div class="dn-sonuc-baslik">🏁 ' + kacis(d.ad) + ' bitti' + (sn.yeniEnIyi ? '<span class="dn-rozet-yeni">🎉 yeni en iyi net</span>' : "") + '</div>';
    h += '<div class="dn-sonuc-alt">' + kacis(tarihYaz(Date.now())) + ' · ' + d.soruSayisi + ' soru · ' + d.sureDk +
      ' dk süre · geçen süre ' + Math.floor(sn.gecenSn / 60) + ' dk ' + (sn.gecenSn % 60) + ' sn · banka tohumu: ' + kacis(d.tohum) + '</div>';
    h += '<div class="dn-net-buyuk"><b>' + netYaz(sn.net) + '</b><span>NET (net = doğru − yanlış ÷ 4)</span></div>';
    h += '<div class="dn-kutular">' + kutu(sn.dogru, "DOĞRU") + kutu(sn.yanlis, "YANLIŞ") + kutu(sn.bos, "BOŞ") +
      kutu(netYaz(enIyiNet(d.kod)), "BU DENEMEDE EN İYİ NET", true) + '</div>';

    h += '<table class="dn-tablo"><thead><tr><th>Ders</th><th class="dn-sayi">Soru</th><th class="dn-sayi">Doğru</th>' +
      '<th class="dn-sayi">Yanlış</th><th class="dn-sayi">Boş</th><th class="dn-sayi">Net</th></tr></thead><tbody>';
    sn.dersTablo.forEach(function (t) {
      h += '<tr><td>' + kacis(t.ders) + '</td><td class="dn-sayi">' + t.soru + '</td><td class="dn-sayi">' + t.dogru +
        '</td><td class="dn-sayi">' + t.yanlis + '</td><td class="dn-sayi">' + t.bos + '</td>' +
        '<td class="dn-sayi">' + netYaz(netHesap(t.dogru, t.yanlis)) + '</td></tr>';
    });
    h += '<tr class="dn-toplam"><td>TOPLAM</td><td class="dn-sayi">' + sn.toplam + '</td><td class="dn-sayi">' + sn.dogru +
      '</td><td class="dn-sayi">' + sn.yanlis + '</td><td class="dn-sayi">' + sn.bos + '</td><td class="dn-sayi">' + netYaz(sn.net) + '</td></tr>';
    h += '</tbody></table>';

    h += '<div class="dn-grup-baslik"><b>❌ Yanlış yaptığın konular</b><span class="dn-adet">' + sn.yanlisKonular.length + ' konu · ' + sn.yanlis + ' yanlış</span></div>';
    h += sn.yanlisKonular.length
      ? '<ul class="dn-yanlis-liste">' + sn.yanlisKonular.map(function (x) {
        return '<li><span>' + kacis(x.etiket) + '</span><b>' + x.adet + ' yanlış</b></li>';
      }).join("") + '</ul>'
      : '<div class="dn-yoksa">Yanlışın yok — tebrikler! 🎉</div>';

    h += '<div class="dn-grup-baslik"><b>⏭ Boş bıraktığın konular</b><span class="dn-adet">' + sn.bosKonular.length + ' konu · ' + sn.bos + ' boş</span></div>';
    h += sn.bosKonular.length
      ? '<ul class="dn-yanlis-liste">' + sn.bosKonular.map(function (x) {
        return '<li class="dn-bos-konu"><span>' + kacis(x.etiket) + '</span><b>' + x.adet + ' boş</b></li>';
      }).join("") + '</ul>'
      : '<div class="dn-yoksa">Hiç boş bırakmadın. 👏</div>';

    h += '<div class="dn-dugme-satir">' +
      '<button class="dn-dugme" data-dn-islem="tekrar" data-kod="' + kacis(d.kod) + '">🔁 Yeniden çöz</button>' +
      '<button class="dn-dugme dn-ikincil" data-dn-islem="liste">📋 Deneme listesi</button>' +
      '<button class="dn-dugme dn-ikincil" data-dn-islem="sonucDinle">🔊 Sonucu dinle</button>' +
      '</div></div>';
    return h;
  }

  /* ═══════════════ görünüm yönetimi ═══════════════ */
  function alan() { return document.getElementById("denemelerAlan"); }
  function ciz() {
    var kap = alan(); if (!kap) return false;
    D.kurgu = kurgula();
    D.gorunum = "liste";
    kap.innerHTML = listeDom();
    return true;
  }
  function cozumCiz() {
    var kap = alan(); if (!kap) return false;
    kap.innerHTML = cozumDom();
    return true;
  }
  function sonucCiz() {
    var kap = alan(); if (!kap) return false;
    kap.innerHTML = sonucDom();
    return true;
  }
  function listeyeDon() {
    if (D.K && D.K.sayacId) { clearInterval(D.K.sayacId); D.K.sayacId = null; }
    D.K = null;
    D.gorunum = "liste";
    if (D.kurgu) { var kap = alan(); if (kap) kap.innerHTML = listeDom(); }
    else ciz();
  }

  /* ═══════════════ akış: çözüm ═══════════════ */
  function denemeBul(kod) {
    var k = D.kurgu || kurgula();
    return k.hepsi.filter(function (d) { return d.kod === kod; })[0] || null;
  }
  function coz(kod) {
    var d = denemeBul(kod);
    if (!d) return false;
    if (D.K && D.K.sayacId) { clearInterval(D.K.sayacId); D.K.sayacId = null; }
    if (!d.sorular.length) {
      D.K = null;                       /* yarım kalan oturum bırakılmaz */
      D.gorunum = "cozum";
      var kap0 = alan();
      if (kap0) kap0.innerHTML = bosCozumDom(d);
      return false;
    }
    var cevaplar = [];
    for (var i = 0; i < d.sorular.length; i++) cevaplar.push(null);
    D.K = {
      deneme: d, i: 0, cevaplar: cevaplar,
      basladi: Date.now(), bitis: Date.now() + d.sureDk * 60 * 1000,
      sayacId: null, bitti: false
    };
    D.gorunum = "cozum";
    cozumCiz();
    sayacBaslat();
    return true;
  }
  function sayacBaslat() {
    if (!D.K) return;
    if (D.K.sayacId) clearInterval(D.K.sayacId);
    D.K.basladi = Date.now();
    D.K.bitis = D.K.basladi + D.K.deneme.sureDk * 60 * 1000;
    D.K.sayacId = setInterval(tik, 1000);
  }
  function tik() {
    if (!D.K || D.K.bitti || D.gorunum !== "cozum") return;
    var kalan = kalanSaniye();
    var yz = document.getElementById("dnSayac");
    if (yz) { yz.textContent = saniyeYaz(kalan); if (kalan <= 60) yz.classList.add("dn-asim"); }
    if (kalan <= 0) bitir(false);   /* süre bitti → sınav otomatik biter */
  }
  function sikSec(j) {
    if (!D.K || D.K.bitti) return false;
    D.K.cevaplar[D.K.i] = j;
    return cozumCiz();
  }
  function ilerle(git) {
    if (!D.K || D.K.bitti) return false;
    var yeni = D.K.i + git;
    if (yeni < 0 || yeni > D.K.deneme.soruSayisi - 1) return false;
    D.K.i = yeni;
    return cozumCiz();
  }
  function cevapSil() { if (!D.K) return false; D.K.cevaplar[D.K.i] = null; return cozumCiz(); }
  function atla(idx) {
    if (!D.K || idx < 0 || idx > D.K.deneme.soruSayisi - 1) return false;
    D.K.i = idx; return cozumCiz();
  }

  function bitir(onayli) {
    if (!D.K || D.K.bitti) return null;
    if (onayli) {
      var bosSayisi = D.K.deneme.soruSayisi - cevaplananSayisi();
      if (typeof window.confirm === "function" && !window.confirm("Denemeyi bitirmek istiyor musun?\nBoş soru: " + bosSayisi)) return null;
    }
    var K = D.K;
    K.bitti = true;
    if (K.sayacId) { clearInterval(K.sayacId); K.sayacId = null; }
    var sn = sonucHesapla(K);
    sn.gecenSn = Math.max(1, Math.round((Date.now() - K.basladi) / 1000));
    var oncekiEnIyi = enIyiNet(K.deneme.kod);
    sn.kayit = kayitEkle(K.deneme, sn, sn.gecenSn);
    sn.yeniEnIyi = (oncekiEnIyi === null || sn.net > oncekiEnIyi);
    yanlisKonuIsle(sn.yanlisKayitlar);
    try {
      sn.yanlisKayitlar.forEach(function (r) {
        if (window.KARTLAR && window.KARTLAR.yanlisaEkle) window.KARTLAR.yanlisaEkle(r.s, K.cevaplar[K.deneme.sorular.indexOf(r)]);
      });
    } catch (e) {}
    D.sonSonuc = sn;
    D.gorunum = "sonuc";
    sonucCiz();
    try { window.__denemelerSon = { kod: K.deneme.kod, net: sn.net, dogru: sn.dogru, yanlis: sn.yanlis, bos: sn.bos, kayit: sn.kayit }; } catch (e) {}
    ses("Deneme bitti. Net sonucun " + netYaz(sn.net) + ". Doğru " + sn.dogru + ", yanlış " + sn.yanlis + ", boş " + sn.bos + ".");
    return sn;
  }

  /* ═══════════════ menü / ekran kurulumu ═══════════════ */
  function stilEkle() {
    if (document.querySelector('link[data-denemeler], link[href*="denemeler.css"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = "assets/denemeler.css"; l.setAttribute("data-denemeler", "1");
    document.head.appendChild(l);
  }
  function ekranKur() {
    var mevcut = document.getElementById("ekran-denemeler");
    if (mevcut) {
      /* Ekran kabı başka yoldan (index.html'e elle eklenmiş ya da başka betik) hazırsa
         onu KULLAN: alan yoksa oluştur, olayları bir kez bağla. */
      if (!mevcut.querySelector("#denemelerAlan")) {
        var kab = document.createElement("div");
        kab.className = "kart";
        kab.innerHTML = '<div id="denemelerAlan" class="dn-alan"></div>';
        mevcut.appendChild(kab);
      }
      if (!mevcut.__dnBagli) { mevcut.addEventListener("click", tikla); mevcut.__dnBagli = true; }
      return false;
    }
    var sec = document.createElement("section");
    sec.id = "ekran-denemeler";
    sec.className = "ekran";
    sec.setAttribute("data-bolum", BOLUM);
    sec.innerHTML = '<h2 class="sayfa-baslik">📚 Deneme Kütüphanesi</h2>' +
      '<div class="kart"><div id="denemelerAlan" class="dn-alan"></div></div>';
    var kap = document.getElementById("icerik") || document.body;
    kap.appendChild(sec);
    if (!sec.__dnBagli) { sec.addEventListener("click", tikla); sec.__dnBagli = true; }
    return true;
  }
  function menuEkle() {
    var m = document.querySelector(".menu-icerik");
    if (!m || m.querySelector('[data-git="' + BOLUM + '"]')) return false;
    var b = document.createElement("button");
    b.className = "menu-oge";
    b.setAttribute("data-git", BOLUM);
    b.style.setProperty("--bolum", "var(--denemeler)");
    b.innerHTML = "<span class='simg-renk'>📚</span><span class='etiket'>Deneme Kütüphanesi</span>" +
      "<span class='rozet'>" + (TAM_SAYI + KONU_SAYI) + " deneme</span>";
    b.addEventListener("click", function () { ac(); });
    m.appendChild(b);
    return true;
  }
  /** Motor varsa onun git()'i kullanılır (menü kapanır, kaydırma başa döner); yoksa elle. */
  function ac() {
    ekranKur(); menuEkle(); stilEkle();
    if (window.USTAD_MOTOR && typeof window.USTAD_MOTOR.git === "function") {
      window.USTAD_MOTOR.git(BOLUM);
    } else {
      $$(".ekran").forEach(function (e) { e.classList.remove("acik"); });
      var s = document.getElementById("ekran-denemeler"); if (s) s.classList.add("acik");
    }
    document.body.setAttribute("data-bolum", BOLUM);
    document.body.style.setProperty("--bolum", "var(--denemeler)");
    $$(".menu-oge").forEach(function (o) { o.classList.toggle("secili", o.getAttribute("data-git") === BOLUM); });
    var menu = document.getElementById("menu"), perde = document.getElementById("menuPerde");
    if (menu) menu.classList.remove("acik");
    if (perde) perde.classList.remove("acik");
    window.scrollTo(0, 0);
    ciz();
    return true;
  }

  /* ═══════════════ olaylar (bölüm üzerinde delege) ═══════════════ */
  function tikla(e) {
    var g = e.target.closest ? e.target.closest("[data-dn-islem]") : null;
    if (!g) return;
    var islem = g.getAttribute("data-dn-islem");
    if (islem === "coz" || islem === "tekrar") { coz(g.getAttribute("data-kod")); return; }
    if (islem === "sik") { sikSec(Number(g.getAttribute("data-sik"))); return; }
    if (islem === "sonraki") { ilerle(1); return; }
    if (islem === "onceki") { ilerle(-1); return; }
    if (islem === "temizle") { cevapSil(); return; }
    if (islem === "bitir") { bitir(true); return; }
    if (islem === "liste") { listeyeDon(); return; }
    if (islem === "ders") { D.filtre.ders = g.getAttribute("data-ders"); listeCiz(); return; }
    if (islem === "cozulmemis") { D.filtre.cozulmemis = !D.filtre.cozulmemis; listeCiz(); return; }
    if (islem === "tohumDogrula") { tohumDogrula(); return; }
    if (islem === "gecmisSil") {
      if (typeof window.confirm === "function" && !window.confirm("Deneme sonuç geçmişi silinsin mi?")) return;
      depoSil(KAYIT_ANAHTAR); listeCiz(); return;
    }
    if (islem === "sonucDinle") {
      if (D.sonSonuc) ses("Net sonucun " + netYaz(D.sonSonuc.net) + ". Doğru " + D.sonSonuc.dogru + ", yanlış " +
        D.sonSonuc.yanlis + ", boş " + D.sonSonuc.bos + ".");
      return;
    }
  }
  function listeCiz() {
    if (D.K && D.K.sayacId) { clearInterval(D.K.sayacId); D.K.sayacId = null; }
    D.gorunum = "liste";
    var kap = alan(); if (!kap) return false;
    if (!D.kurgu) return ciz();
    kap.innerHTML = listeDom();
    return true;
  }
  /** Aynı tohumun aynı soruları getirdiğini kullanıcıya kanıtlar (iki kez üretir, karşılaştırır). */
  function tohumDogrula() {
    var k1 = kurgula(), k2 = kurgula();
    var ayni = k1.hepsi.length === k2.hepsi.length;
    if (ayni) {
      for (var i = 0; i < k1.hepsi.length; i++) {
        var a = k1.hepsi[i].sorular.map(function (r) { return r.i; }).join(",");
        var b = k2.hepsi[i].sorular.map(function (r) { return r.i; }).join(",");
        if (a !== b) { ayni = false; break; }
      }
    }
    var m = "🔎 Tohum doğrulaması: 40 deneme iki kez üretildi — " +
      (ayni ? "sorular BİREBİR AYNI (tohumlu seçim çalışıyor)." : "FARKLI! tohumlu seçim bozuk.");
    var kap = alan();
    if (kap) {
      var u = document.createElement("div");
      u.className = ayni ? "dn-not" : "dn-uyari";
      u.id = "dnTohumSonuc";
      u.textContent = m;
      kap.insertBefore(u, kap.firstChild);
    }
    D.tohumAyni = ayni;
    return ayni;
  }

  /* ═══════════════ geri tuşu: çözüm → liste ═══════════════ */
  function geriSar() {
    var eski = window.geriBas;
    if (typeof eski !== "function" || eski.__denemelerSarildi) return;
    var yeni = function () {
      if (D.gorunum === "cozum" || D.gorunum === "sonuc") { listeyeDon(); return "geri"; }
      return eski.apply(this, arguments);
    };
    yeni.__denemelerSarildi = true;
    window.geriBas = yeni;
  }

  /* ═══════════════ açılış ═══════════════ */
  function kur() {
    if (D.kuruldu) return true;
    D.kuruldu = true;
    stilEkle(); ekranKur(); menuEkle(); geriSar();
    return true;
  }
  function acilista() {
    kur();
    if (location.search.indexOf("ekran=denemeler") >= 0) ac();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", acilista);
  } else {
    acilista();
  }
  window.addEventListener("load", function () { menuEkle(); });

  /* ═══════════════ dışa açılan yüz ═══════════════ */
  A.bolumAc = function (kod) { if (kod === BOLUM) ciz(); };
  A.ciz = ciz;
  A.kur = kur;
  A.ac = ac;
  A.kurgula = kurgula;
  A.durum = D;
  A.coz = coz;
  A.sikSec = sikSec;
  A.sonraki = function () { return ilerle(1); };
  A.onceki = function () { return ilerle(-1); };
  A.atla = atla;
  A.cevapSil = cevapSil;
  A.bitir = bitir;
  A.tik = tik;
  A.netHesap = netHesap;
  A.sonucHesapla = sonucHesapla;
  A.gecmis = gecmis;
  A.enIyiNet = enIyiNet;
  A.sonNet = sonNet;
  A.ortalamaNet = ortalamaNet;
  A.cozulduMu = cozulduMu;
  A.tumDenemeler = function () { return (D.kurgu || kurgula()).hepsi; };
  A.denemeBul = denemeBul;
  A.listeyeDon = listeyeDon;
  A.listeCiz = listeCiz;
  A.tohumDogrula = tohumDogrula;
  A.zorlukEtiket = zorlukEtiket;
  A.zorlukSay = zorlukSay;
  A.tohumHash = tohumHash;
  A.kayitAnahtari = "ustad." + KAYIT_ANAHTAR;
  A.sabitler = { TAM_SAYI: TAM_SAYI, KONU_SAYI: KONU_SAYI, TAM_SORU: TAM_SORU, KONU_SORU: KONU_SORU, TAM_SURE: TAM_SURE, KONU_SURE: KONU_SURE, TAM_DAGILIM: TAM_DAGILIM };

  /* ═══════════════ KENDİ KENDİNİ TEST (?test=1) ═══════════════ */
  if (location.search.indexOf("test=1") >= 0) {
    window.addEventListener("load", function () {
      setTimeout(testCalistir, 500);
    });
  }

  function testCalistir() {
    var t = [], ok = function (ad, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : "")); };
    var S = A.sabitler;
    function idListesi(d) { return d.sorular.map(function (r) { return r.i; }); }
    function tekrarVarMi(d) { var g = {}, v = 0; idListesi(d).forEach(function (i) { if (g[i]) v++; g[i] = true; }); return v; }

    /* eski hâli sakla */
    var eskiSonucVar = depoVar(KAYIT_ANAHTAR), eskiSonuc = eskiSonucVar ? depoAl(KAYIT_ANAHTAR, null) : null;
    var eskiYanlisVar = depoVar("yanlisKonu"), eskiYanlis = eskiYanlisVar ? depoAl("yanlisKonu", null) : null;
    depoSil(KAYIT_ANAHTAR);
    depoSil("yanlisKonu");

    /* ── 1) kurgu ── */
    ok("window.DENEMELER nesnesi var", !!window.DENEMELER && typeof window.DENEMELER.bolumAc === "function", "bolumAc: " + typeof A.bolumAc);
    var k = A.kurgula();
    A.durum.kurgu = k;
    ok("40 deneme kurgulandı (10 tam + 30 konu)", k.hepsi.length === 40 && k.tam.length === 10 && k.konu.length === 30,
      k.hepsi.length + " = " + k.tam.length + " tam + " + k.konu.length + " konu");
    ok("toplam soru 1800 (10x120 + 30x20)", k.tam.reduce(function (a, d) { return a + d.soruSayisi; }, 0) +
      k.konu.reduce(function (a, d) { return a + d.soruSayisi; }, 0) === 10 * S.TAM_SORU + 30 * S.KONU_SORU, "1800 beklendi");
    ok("banka okundu (USTAD_SORULAR)", k.kayitSayisi === (window.USTAD_SORULAR || []).length && k.kayitSayisi > 0, k.kayitSayisi + " soru");
    var tam120 = k.tam.filter(function (d) { return d.soruSayisi === S.TAM_SORU; }).length;
    ok("10 tam denemenin her biri 120 soru", tam120 === 10, tam120 + "/10");
    var konu20 = k.konu.filter(function (d) { return d.soruSayisi === S.KONU_SORU; }).length;
    ok("30 konu denemesinin her biri 20 soru", konu20 === 30, konu20 + "/30");
    ok("tam deneme süresi 130 dk", k.tam.every(function (d) { return d.sureDk === 130; }), k.tam[0].sureDk + " dk");
    ok("konu denemesi süresi 25 dk", k.konu.every(function (d) { return d.sureDk === 25; }), k.konu[0].sureDk + " dk");

    /* ders dağılımı: 30/30/27/18/9/6 */
    var d1 = k.tam[0].dersOzet.map(function (x) { return x.ders + ":" + x.gelen; }).join(" ");
    var dagilimTam = S.TAM_DAGILIM.every(function (dd) {
      return k.tam.every(function (d) {
        var x = d.dersOzet.filter(function (y) { return y.ders === dd.ders; })[0];
        return x && x.gelen === dd.soru;
      });
    });
    ok("her tam denemede ders dağılımı 30/30/27/18/9/6", dagilimTam, d1);

    /* ── 2) tohumlu seçim ── */
    var k2 = A.kurgula();
    var ayni = k.hepsi.length === k2.hepsi.length && k.hepsi.every(function (d, i) {
      return idListesi(d).join(",") === idListesi(k2.hepsi[i]).join(",");
    });
    ok("aynı tohum → aynı sorular (40 denemede birebir)", ayni, "karşılaştırılan: " + k.hepsi.length + " deneme");
    ok("tohumHash kararlı", A.tohumHash("ustad-deneme-tam-1") === A.tohumHash("ustad-deneme-tam-1"),
      String(A.tohumHash("ustad-deneme-tam-1")));
    ok("farklı tohum → farklı deneme içeriği", idListesi(k.tam[0]).join(",") !== idListesi(k.tam[1]).join(","), "tam-1 ≠ tam-2");
    var ayniIcerik = k.hepsi.filter(function (d, i) {
      return i > 0 && d.tur === k.hepsi[i - 1].tur && idListesi(d).join(",") === idListesi(k.hepsi[i - 1]).join(",");
    }).length;
    ok("hiçbir iki deneme birebir aynı soru dizisi değil", ayniIcerik === 0, ayniIcerik + " eşleşme");
    ok("tohum doğrulama aracı 'aynı' diyor", A.tohumDogrula() === true, "A.tohumDogrula()");

    /* ── 3) tekrar denetimi ── */
    var tekrar = k.hepsi.filter(function (d) { return tekrarVarMi(d) > 0; });
    ok("hiçbir denemede tekrar eden soru yok", tekrar.length === 0, tekrar.length + " denemede tekrar");
    var tanimsiz = 0;
    k.hepsi.forEach(function (d) {
      d.sorular.forEach(function (r) { if (!r.s || !r.s.soru || !Array.isArray(r.s.secenekler) || r.s.dogru == null) tanimsiz++; });
    });
    ok("tüm seçilen sorular geçerli (soru/şıklar/doğru cevap)", tanimsiz === 0, tanimsiz + " bozuk soru");
    ok("her soru 4 şıklı", k.tam[0].sorular.every(function (r) { return r.s.secenekler.length === 4; }), "4 şık");
    ok("Güncel Bilgiler her tam denemede 6 soru", k.tam.every(function (d) {
      return d.dersOzet.filter(function (x) { return x.ders === "Güncel Bilgiler"; })[0].gelen === 6;
    }), "6 soru");

    /* ── 4) zorluk ── */
    var zEt = k.hepsi.every(function (d) { return ["Kolay", "Orta", "Zor"].indexOf(d.zorluk) >= 0; });
    ok("her denemede zorluk etiketi var", zEt, k.tam[0].zorluk + " / " + k.konu[0].zorluk);
    var zGerçek = k.hepsi.every(function (d) {
      var s = { Kolay: 0, Orta: 0, Zor: 0 };
      d.sorular.forEach(function (r) { s[r.zorluk]++; });
      return A.zorlukEtiket(s) === d.zorluk;
    });
    ok("zorluk etiketi seçilen soruların GERÇEK dağılımından hesaplanıyor", zGerçek, "etiket = ölçüm");
    var zToplam = k.tam[0].zorlukSayac.Kolay + k.tam[0].zorlukSayac.Orta + k.tam[0].zorlukSayac.Zor;
    ok("zorluk sayaçları soru sayısına eşit (120)", zToplam === 120, String(zToplam));
    var zDag = ["Kolay", "Orta", "Zor"].filter(function (z) {
      return k.hepsi.some(function (d) { return d.zorluk === z; });
    });
    ok("zorluk çeşitliliği var (en az 2 farklı etiket)", zDag.length >= 2, zDag.join(", "));
    ok("zorlukSay toplamı istenen adede eşit", (function () {
      var s = A.zorlukSay({ Kolay: 0.4, Orta: 0.4, Zor: 0.2 }, 30);
      return s.Kolay + s.Orta + s.Zor === 30;
    })(), "12/12/6 beklendi");

    /* ── 5) konu denemeleri ── */
    var adlar = k.konu.map(function (d) { return d.ad; });
    ok("konu denemesi adı 'Ders · Konu Denemesi' biçiminde", adlar.every(function (a) { return / · /.test(a); }), adlar[0]);
    ok("'Türkçe · Paragraf Denemesi' var", adlar.indexOf("Türkçe · Paragraf Denemesi") >= 0, "aranan: Türkçe · Paragraf Denemesi");
    ok("'Matematik · Problemler Denemesi' var", adlar.indexOf("Matematik · Problemler Denemesi") >= 0, "var");
    ok("'Tarih · Kurtuluş Savaşı Denemesi' var", adlar.indexOf("Tarih · Kurtuluş Savaşı Denemesi") >= 0, "var");
    var derslerK = {}; k.konu.forEach(function (d) { derslerK[d.ders] = (derslerK[d.ders] || 0) + 1; });
    ok("30 konu denemesi derslere dağıldı", Object.keys(derslerK).length === 6,
      Object.keys(derslerK).map(function (x) { return x + ":" + derslerK[x]; }).join(" "));
    ok("her konu denemesi tek derse ait", k.konu.every(function (d) { return d.sorular.every(function (r) { return r.ders === d.ders; }) || !!d.uyari; }),
      "konu dışı soru yalnız uyarılı denemelerde");
    var paragraf = k.konu.filter(function (d) { return d.ad === "Türkçe · Paragraf Denemesi"; })[0];
    ok("Paragraf denemesi yalnız Paragraf konusundan", paragraf.sorular.every(function (r) { return r.konu === "Paragraf"; }),
      paragraf.sorular.length + " soru");
    var kurtulus = k.konu.filter(function (d) { return d.ad === "Tarih · Kurtuluş Savaşı Denemesi"; })[0];
    ok("Kurtuluş Savaşı denemesi Kurtuluş Savaşı konularından", kurtulus.sorular.every(function (r) { return /Kurtuluş Savaşı/.test(r.konu); }),
      kurtulus.sorular.length + " soru · " + kurtulus.konular);

    /* ── 6) net hesabı ── */
    ok("net: 100 doğru 20 yanlış → 95", A.netHesap(100, 20) === 95, String(A.netHesap(100, 20)));
    ok("net: yanlış yoksa doğruya eşit", A.netHesap(30, 0) === 30, String(A.netHesap(30, 0)));
    ok("net: 4 yanlış 1 doğruyu götürür (29 doğru 4 yanlış → 28)", A.netHesap(29, 4) === 28, String(A.netHesap(29, 4)));
    ok("net: negatif olabilir (0 doğru 8 yanlış → -2)", A.netHesap(0, 8) === -2, String(A.netHesap(0, 8)));
    ok("net: iki basamağa yuvarlanır (10 doğru 1 yanlış → 9,75)", A.netHesap(10, 1) === 9.75, String(A.netHesap(10, 1)));

    /* ── 7) arayüz: ekran + liste ── */
    A.ac();
    ok("ekran kabı oluşturuldu (#ekran-denemeler)", !!document.getElementById("ekran-denemeler"), "id: ekran-denemeler");
    ok("ekran görünür (acik sınıfı)", !!document.querySelector("#ekran-denemeler.acik"), "acik");
    ok("menüye eklendi (data-git=denemeler)", !!document.querySelector('.menu-oge[data-git="denemeler"]'),
      document.querySelector('.menu-oge[data-git="denemeler"]') ? "menüde" : "yok");
    var menuDugme = document.querySelector('.menu-oge[data-git="denemeler"]');
    if (menuDugme) menuDugme.click();   /* gerçek tıklama: menüden bölüme giriş yolu */
    ok("menü düğmesine tıklayınca bölüm ve liste açılıyor",
      !!document.querySelector("#ekran-denemeler.acik") && !!document.querySelector("#denemelerAlan .dn-kartlar"),
      document.querySelector("#ekran-denemeler.acik") ? "acik + liste" : "açılmadı");
    ok("CSS bağlantısı eklendi (denemeler.css)", !!document.querySelector('link[href*="denemeler.css"]'), "link var");
    ok("bölüm rengi --denemeler tanımlı (CSS yüklendi)",
      getComputedStyle(document.documentElement).getPropertyValue("--denemeler").trim() === "#0f766e",
      getComputedStyle(document.documentElement).getPropertyValue("--denemeler").trim());
    var kartlar = $$("#denemelerAlan .dn-kart");
    ok("listede 40 kart var", kartlar.length === 40, kartlar.length + " kart");
    ok("kartlarda 'Çözülmedi' durumu yazılı", $$("#denemelerAlan .dn-durum.dn-yok").length === 40,
      $$("#denemelerAlan .dn-durum.dn-yok").length + " çözülmemiş");
    ok("tam ve konu denemeleri ayrı gruplar halinde", $$("#denemelerAlan .dn-grup").length === 2 &&
      /Tam Denemeler/.test($$("#denemelerAlan .dn-grup-baslik b")[0].textContent) &&
      /Konu Denemeleri/.test($$("#denemelerAlan .dn-grup-baslik b")[1].textContent),
      $$("#denemelerAlan .dn-grup").length + " grup");
    ok("kartta soru sayısı + süre + zorluk + konu etiketi var",
      /120 soru/.test($$("#denemelerAlan .dn-kart")[0].textContent) && /130 dk/.test($$("#denemelerAlan .dn-kart")[0].textContent) &&
      $$("#denemelerAlan .dn-kart")[0].querySelectorAll(".dn-etiket").length >= 4,
      $$("#denemelerAlan .dn-kart")[0].querySelectorAll(".dn-etiket").length + " etiket");
    ok("12 tam 120 soru etiketi (10 kart + konu)", $$("#denemelerAlan .dn-kart").filter(function (x) { return /120 soru/.test(x.textContent); }).length === 10, "10 kart");
    ok("banka uyarısı gösterildi (10 tam deneme Türkçe havuzuna sığmıyor)",
      !!document.querySelector("#denemelerAlan .dn-uyari") && k.genelUyari.length > 0,
      k.genelUyari.length + " uyarı satırı");

    /* ── 8) filtreler ── */
    A.durum.filtre.ders = "Türkçe"; A.listeCiz();
    var gorunen = $$("#denemelerAlan .dn-kart:not(.dn-gizli)");
    var turkceKonu = gorunen.filter(function (x) { return /Türkçe ·/.test(x.textContent); }).length;
    ok("filtre ders=Türkçe → 6 Türkçe konu denemesi görünür", turkceKonu === 6, turkceKonu + " konu denemesi");
    ok("filtre ders=Türkçe → tam denemeler gizlenmez (6 dersi kapsar)", gorunen.filter(function (x) { return /120 soru/.test(x.textContent); }).length === 10, "10 tam deneme");
    ok("filtre: gizli kart 24 (30-6 konu)", $$("#denemelerAlan .dn-kart.dn-gizli").length === 24, $$("#denemelerAlan .dn-kart.dn-gizli").length + " gizli");
    A.durum.filtre.ders = "__hepsi__"; A.listeCiz();
    ok("filtre temizlenince 40 kart geri gelir", $$("#denemelerAlan .dn-kart:not(.dn-gizli)").length === 40, "40 kart");

    /* ── 9) çözüm akışı (gerçek tıklama) ── */
    var hedefD = k.tam[0];
    var basladi = A.coz("tam-1");
    ok("çoз() deneme oturumunu açtı", basladi === true && !!A.durum.K, A.durum.K ? A.durum.K.deneme.ad : "yok");
    ok("çözüm görünümü çizildi (.dn-cozum)", !!document.querySelector("#denemelerAlan .dn-cozum"), "cozum");
    ok("soru metni ve 4 şık basıldı", $$("#denemelerAlan .dn-sik").length === 4 &&
      !!document.querySelector("#denemelerAlan .dn-soru h4"), $$("#denemelerAlan .dn-sik").length + " şık");
    ok("A/B/C/D harfleri doğru", $$("#denemelerAlan .dn-harf").map(function (x) { return x.textContent; }).join(",") === "A,B,C,D",
      $$("#denemelerAlan .dn-harf").map(function (x) { return x.textContent; }).join(","));
    ok("süre sayacı mm:ss biçiminde", /^\d+:\d{2}$/.test($("#dnSayac").textContent), $("#dnSayac").textContent);
    var ilkSik = document.querySelector('#denemelerAlan .dn-sik[data-sik="2"]');
    if (ilkSik) ilkSik.click();
    ok("şıka tıklayınca işaretlendi", A.durum.K.cevaplar[0] === 2 && $$("#denemelerAlan .dn-sik.dn-secili").length === 1, "şıк: C");
    ok("ilerleme çubuğu 1/120", Math.round(parseFloat($("#dnCubuk").style.width)) === 1, $("#dnCubuk").style.width);
    document.querySelector('[data-dn-islem="sonraki"]').click();
    ok("sonraki soruya geçti (2/120)", A.durum.K.i === 1 && /Soru 2 \/ 120/.test($("#dnSira").textContent), $("#dnSira").textContent);
    ok("yeni soru çizildi (ilerleme çubuğu arttı)", Math.round(parseFloat($("#dnCubuk").style.width)) === 2, $("#dnCubuk").style.width);
    document.querySelector('[data-dn-islem="onceki"]').click();
    ok("önceki soruya döndü ve cevap korundu", A.durum.K.i === 0 && A.durum.K.cevaplar[0] === 2, "i=" + A.durum.K.i);
    document.querySelector('[data-dn-islem="temizle"]').click();
    ok("cevap silme çalıştı", A.durum.K.cevaplar[0] === null, "cevap: boş");

    /* ── 10) sonuç + kayıt ── */
    var K = A.durum.K;
    var dogruSayisi = 0, yanlisSayisi = 0;
    K.deneme.sorular.forEach(function (r, idx) {
      if (idx < 60) { K.cevaplar[idx] = r.s.dogru; dogruSayisi++; }
      else if (idx < 80) { K.cevaplar[idx] = (r.s.dogru + 1) % (r.s.secenekler.length || 4); yanlisSayisi++; }
      else { K.cevaplar[idx] = null; }
    });
    var sn = A.bitir(false);
    ok("bitir() sonuç döndürdü", !!sn, sn ? "net " + sn.net : "yok");
    ok("sonuç görünümü çizildi (.dn-sonuc)", !!document.querySelector("#denemelerAlan .dn-sonuc"), "sonuc");
    ok("doğru/yanlış/boş sayıları doğru (60/20/40)", sn.dogru === 60 && sn.yanlis === 20 && sn.bos === 40,
      sn.dogru + "/" + sn.yanlis + "/" + sn.bos);
    ok("net = doğru − yanlış/4 (60-5=55)", sn.net === 55, String(sn.net));
    ok("süre geçen saniye kaydedildi", typeof sn.gecenSn === "number" && sn.gecenSn > 0, sn.gecenSn + " sn");
    ok("ders bazlı tablo çizildi (6 ders + toplam)", $$("#denemelerAlan .dn-tablo tbody tr").length === 7,
      $$("#denemelerAlan .dn-tablo tbody tr").length + " satır");
    ok("yanlış konu listesi dolu", sn.yanlisKonular.length > 0, sn.yanlisKonular.length + " konu · " + (sn.yanlisKonular[0] ? sn.yanlisKonular[0].etiket : "—"));
    ok("boş konu listesi dolu", sn.bosKonular.length > 0, sn.bosKonular.length + " konu");
    ok("sonuç localStorage'a yazıldı (ustad.denemeler.sonuc)", depoVar(KAYIT_ANAHTAR), A.kayitAnahtari);
    var g = A.gecmis();
    ok("geçmişte 1 kayıt var", g.length === 1, g.length + " kayıt");
    var kay = g[0];
    ok("kayıt alanları: deneme adı, tarih, net, doğru/yanlış/boş",
      !!kay.ad && !!kay.tarih && kay.net === 55 && kay.dogru === 60 && kay.yanlis === 20 && kay.bos === 40,
      kay.ad + " · " + kay.net);
    ok("en iyi net = 55", A.enIyiNet("tam-1") === 55, String(A.enIyiNet("tam-1")));
    ok("yeni en iyi net rozeti gösterildi", sn.yeniEnIyi === true && /yeni en iyi net/.test($("#denemelerAlan").textContent), "rozet");
    ok("çözülen deneme listeye 'Çözüldü' yansıdı", A.cozulduMu("tam-1") && A.sonNet("tam-1") === 55, "durum: çözüldü");
    ok("yanlış konular ustad.yanlisKonu sayacına işlendi", (function () {
      var m = depoAl("yanlisKonu", {}); return Object.keys(m).length > 0;
    })(), Object.keys(depoAl("yanlisKonu", {})).length + " konu");

    /* ikinci kayıt → en iyi net korunur */
    A.coz("tam-1");
    var K2 = A.durum.K;
    K2.deneme.sorular.forEach(function (r, idx) { K2.cevaplar[idx] = idx < 40 ? r.s.dogru : null; });
    var sn2 = A.bitir(false);
    ok("ikinci çözüm kaydı eklendi (2 kayıt)", A.gecmis().length === 2, A.gecmis().length + " kayıt");
    ok("en iyi net düşmedi (55 kalır)", A.enIyiNet("tam-1") === 55, String(A.enIyiNet("tam-1")));
    ok("son net güncellendi (40)", A.sonNet("tam-1") === 40, String(A.sonNet("tam-1")));
    ok("düşük nette 'yeni en iyi' rozeti çıkmaz", sn2.yeniEnIyi === false, "yok");
    ok("ortalama net hesaplandı (47,5)", A.ortalamaNet() === 47.5, String(A.ortalamaNet()));

    /* ── 11) listeye dönüş + filtre çözülmemişler ── */
    document.querySelector('[data-dn-islem="liste"]').click();
    ok("listeye dönüş çalıştı", A.durum.gorunum === "liste" && !!document.querySelector("#denemelerAlan .dn-kartlar"), A.durum.gorunum);
    ok("çözülen kart 'Çözüldü' ve net gösteriyor", (function () {
      var kt = document.querySelector('[data-dn-kart="tam-1"]');
      return !!kt && /Çözüldü/.test(kt.textContent) && /40,00/.test(kt.textContent);
    })(), "kart metni: çözüldü + son net");
    A.durum.filtre.cozulmemis = true; A.listeCiz();
    ok("filtre 'sadece çözülmemişler' → çözülen kart gizlendi", (function () {
      var kt = document.querySelector('[data-dn-kart="tam-1"]');
      return !!kt && kt.classList.contains("dn-gizli") && $$("#denemelerAlan .dn-kart:not(.dn-gizli)").length === 39;
    })(), $$("#denemelerAlan .dn-kart:not(.dn-gizli)").length + " görünür");
    A.durum.filtre.cozulmemis = false; A.listeCiz();
    ok("geçmiş tablosu listede görünüyor (2 satır + başlık)", $$("#denemelerAlan .dn-gecmis-tablo tbody tr").length >= 2,
      $$("#denemelerAlan .dn-gecmis-tablo tbody tr").length + " satır");

    /* ── 12) süre bitişi (otomatik bitirme) ── */
    A.coz("konu-1");
    var K3 = A.durum.K;
    K3.bitis = Date.now() - 1000;
    A.tik();
    ok("süre bitince deneme otomatik bitti", A.durum.gorunum === "sonuc" && K3.bitti === true, A.durum.gorunum);
    ok("otomatik bitişte boş sayısı tam (20 boş)", K3.deneme.soruSayisi === D.sonSonuc.bos + D.sonSonuc.dogru + D.sonSonuc.yanlis,
      D.sonSonuc.bos + " boş");

    /* ── 13) banka yetersiz / boş banka (dayanıklılık) ── */
    var kucukBanka = [];
    ["Türkçe", "Matematik", "Tarih", "Coğrafya", "Vatandaşlık", "Güncel Bilgiler"].forEach(function (d) {
      for (var i = 0; i < 7; i++) {
        kucukBanka.push({ ders: d, konu: "Deneme Konusu " + i, zorluk: i % 3 === 0 ? "Zor" : "Orta",
          metin: "", soru: d + " k" + i, secenekler: ["a", "b", "c", "d"], dogru: i % 4, aciklama: "" });
      }
    });
    var kk = A.kurgula(kucukBanka);
    ok("küçük banka: 40 deneme yine kurgulandı", kk.hepsi.length === 40, kk.hepsi.length + " deneme");
    ok("küçük banka: uyarı üretildi", kk.hepsi.filter(function (d) { return !!d.uyari; }).length > 0,
      kk.hepsi.filter(function (d) { return !!d.uyari; }).length + " denemede uyarı");
    ok("küçük banka: uyarı metni banka yetersizliğini söylüyor",
      /diger derslerden|diğer derslerden|yetersiz|yetmedi|diğer konularından/.test(kk.hepsi.filter(function (d) { return !!d.uyari; })[0].uyari),
      kk.hepsi.filter(function (d) { return !!d.uyari; })[0].uyari.slice(0, 80));
    ok("küçük banka: deneme içinde tekrar yok", kk.hepsi.every(function (d) { return tekrarVarMi(d) === 0; }), "tekrar yok");
    ok("küçük banka: denemeler arası paylaşım bilgisi var", kk.genelUyari.length > 0, kk.genelUyari.length + " satır");
    ok("küçük banka: soru sayısı bankayı aşmıyor (42 soru, 6 ders x 7)",
      kk.hepsi.every(function (d) { return d.soruSayisi <= kk.bankaSayisi; }),
      kk.hepsi[0].soruSayisi + " ≤ " + kk.bankaSayisi);
    ok("küçük banka: eksik soru uyarısı yazılı", /bulunamadı/.test(kk.hepsi.map(function (d) { return d.uyari || ""; }).join(" ")),
      "uyarı: 'soru bulunamadı'");
    ok("küçük banka: 120 soru dolmadı ama deneme bozulmadı (0 < soru < 120)",
      kk.tam.every(function (d) { return d.soruSayisi > 0 && d.soruSayisi < 120; }),
      kk.tam.map(function (d) { return d.soruSayisi; }).join(",").slice(0, 40));

    var cokme = null, bosKurgu = null;
    try { bosKurgu = A.kurgula([]); } catch (e) { cokme = e.message; }
    ok("boş banka ile kurgula() çökmüyor", cokme === null, cokme || "hata yok");
    ok("boş banka: 40 deneme kabuğu yine var", bosKurgu && bosKurgu.hepsi.length === 40, bosKurgu ? bosKurgu.hepsi.length + " deneme" : "yok");
    ok("boş banka: kartlar 0 soru gösteriyor", bosKurgu.hepsi.every(function (d) { return d.soruSayisi === 0; }), "0 soru");
    ok("boş banka: uyarı metni var", bosKurgu.genelUyari.length === 6, bosKurgu.genelUyari.length + " uyarı (6 ders)");
    var cokme2 = null, cozSonuc = null;
    try {
      A.durum.kurgu = bosKurgu;
      cozSonuc = A.coz("tam-1");
    } catch (e) { cokme2 = e.message; }
    ok("boş bankada coz() çökmüyor", cokme2 === null && cozSonuc === false, cokme2 || "false döndü");
    ok("boş bankada 'soru yok' mesajı çizildi", /soru yok/.test($("#denemelerAlan").textContent), "mesaj var");
    ok("boş bankada sonuç ekranı çökmüyor", (function () {
      try { A.bitir(false); return !!document.querySelector("#denemelerAlan"); } catch (e) { return false; }
    })(), "korumalı");

    /* ── 14) entegrasyon dayanıklılığı: hazır kabuk + kabın silinmesi ── */
    var kabukTesti = null;
    try {
      var eski = document.getElementById("ekran-denemeler");
      var bosKabuk = eski.cloneNode(false);      /* boş <section id=ekran-denemeler class=ekran data-bolum=denemeler> */
      eski.parentNode.removeChild(eski);
      (document.getElementById("icerik") || document.body).appendChild(bosKabuk);
      A.durum.kuruldu = false;
      A.kur(); A.ac();
      var kartDugme = document.querySelector('#denemelerAlan .dn-kart [data-dn-islem="coz"]');
      var listeVar = !!document.querySelector("#denemelerAlan .dn-kartlar");
      if (kartDugme) kartDugme.click();          /* gerçek kart tıklaması */
      kabukTesti = { liste: listeVar, gorunum: A.durum.gorunum, cozum: !!document.querySelector("#denemelerAlan .dn-cozum") };
    } catch (e) { kabukTesti = { hata: e.message }; }
    ok("index.html'de hazır ekran kabuğu varsa onu kullanır ve olayları bağlar",
      !!kabukTesti && kabukTesti.liste === true && kabukTesti.gorunum === "cozum" && kabukTesti.cozum === true,
      kabukTesti ? JSON.stringify(kabukTesti).slice(0, 80) : "yok");

    A.durum.kurgu = null;
    if (A.durum.K && A.durum.K.sayacId) clearInterval(A.durum.K.sayacId);
    A.durum.K = null; A.durum.gorunum = "liste";
    var kab2 = document.getElementById("ekran-denemeler");
    if (kab2) kab2.parentNode.removeChild(kab2);
    A.durum.kuruldu = false; A.kur();
    ok("ekran kabı silinse bile modül kendini yeniden kuruyor",
      !!document.getElementById("ekran-denemeler") && !!document.querySelector("#denemelerAlan"), "yeniden kuruldu");
    A.ciz();
    ok("gerçek bankayla liste yeniden kuruldu", $$("#denemelerAlan .dn-kart").length === 40, "40 kart");
    var cokme3 = null;
    try { A.bolumAc("denemeler"); } catch (e) { cokme3 = e.message; }
    ok("bolumAc('denemeler') çalışıyor", cokme3 === null, cokme3 || "hata yok");
    ok("bu test 40 denemeyi bozmadı (tohum hâlâ aynı)", (function () {
      var kk2 = A.kurgula();
      return idListesi(kk2.tam[0]).join(",") === idListesi(k.tam[0]).join(",");
    })(), "tam-1 aynı");

    if (!eskiSonucVar) depoSil(KAYIT_ANAHTAR); else depoKoy(KAYIT_ANAHTAR, eskiSonuc);
    if (!eskiYanlisVar) depoSil("yanlisKonu"); else depoKoy("yanlisKonu", eskiYanlis);
    A.listeCiz();
    ok("test artığı temizlendi (geçmiş eski hâlinde)", A.gecmis().length === (eskiSonucVar && Array.isArray(eskiSonuc) ? eskiSonuc.length : 0),
      A.gecmis().length + " kayıt");

    /* ── rapor ── */
    var gecen = t.filter(function (x) { return x.indexOf("✔") === 0; }).length;
    var eski = document.getElementById("denemelerTestSonuc");
    if (eski) eski.parentNode.removeChild(eski);
    var kap2 = document.createElement("div");
    kap2.id = "denemelerTestSonuc";
    kap2.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.65 monospace";
    kap2.innerHTML = "<h3>ÜSTAD DENEME KÜTÜPHANESİ testi (" + gecen + "/" + t.length + ")</h3>" +
      t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
      "<hr><b>" + gecen + " / " + t.length + " geçti</b>";
    document.body.appendChild(kap2);
    try { window.__denemelerTest = { gecen: gecen, toplam: t.length, hatalar: t.filter(function (x) { return x.indexOf("✘") === 0; }) }; } catch (e) {}
    document.title = (document.title || "") + " DNMTEST " + gecen + "/" + t.length;
  }
})();
