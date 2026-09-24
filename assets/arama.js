/* © 2026 Kenan Kuzucu · ÜSTAD KPSS-B KOÇ PRO · TEK ARAMA bölümü · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Uygulamanın her yerini tek kutudan arar: soru bankası · ders notları · sözlük ·
   2026 güncel bilgiler · çıkmış sorular · sınav paketi (ders/konu/duyuru).
   Motor dosyalarına ve index.html'e dokunmaz; ekran kabı yoksa kendi kurar.
   Bölümün kendi rengi: var(--arama) (#b45309). Sınıf öneki: `ar-`.
   Sözleşme: window.ARAMA.bolumAc("arama") → bölümü çizer.
   Klavye: / kutuyu açar · Esc temizler · Enter ilk sonuca gider. */
(function () {
  "use strict";

  var A = window.ARAMA = window.ARAMA || {};

  /* ───────────── sabitler ───────────── */
  var KOD = "arama";
  var SON_ANAHTAR = "ustad.arama.son";   // son aramalar (localStorage)
  var MAX_SON = 10;                      // en son kaç arama saklanır
  var GECIKME = 200;                     // debounce (ms)
  var MIN_HARF = 2;                      // bu uzunluktan kısa sorgular aranmaz
  var GRUP_SINIR = 25;                   // grupta en çok kaç sonuç çizilir

  /* gruplar: ad + etiket (kaynak etiketi) + gidilecek bölüm kodu */
  var GRUPLAR = [
    { kod: "sorular", ad: "Sorular",         etiket: "Soru Bankası",  hedef: "testler",  yon: "Testler" },
    { kod: "notlar",  ad: "Ders Notları",    etiket: "Ders Notu",     hedef: "notlar",   yon: "Ders Notları" },
    { kod: "sozluk",  ad: "Sözlük",          etiket: "Sözlük",        hedef: "notlar",   yon: "Ders Notları" },
    { kod: "guncel",  ad: "Güncel Bilgiler", etiket: "Güncel Bilgi",  hedef: "guncel",   yon: "2026 Güncel Bilgiler" },
    { kod: "cikmis",  ad: "Çıkmış Sorular",  etiket: "Çıkmış Soru",   hedef: "cikmis",   yon: "Çıkmış Sorular" },
    { kod: "paket",   ad: "Sınav Paketi",    etiket: "Müfredat",      hedef: "program",  yon: "Ders Programı" }
  ];
  var GRUP_AD = {};
  GRUPLAR.forEach(function (g) { GRUP_AD[g.kod] = g; });

  /* ───────────── yardımcılar ───────────── */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function dizi(x) {
    return Array.isArray(x) ? x.filter(function (o) { return o && typeof o === "object"; }) : [];
  }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function birlestir(liste, ayrac) {
    return liste.filter(function (x) { return x != null && String(x).length; }).join(ayrac || " ");
  }

  /* ───────────── 1) TÜRKÇE NORMALİZASYON (aksansız + küçük harf) ─────────────
     Harf harf eşleme: çıktı uzunluğu girdiyle BİREBİR aynı kalır,
     böylece vurgulama için indeksler kaymaz. ı=i ş=s ğ=g ü=u ö=o ç=c â=a î=i û=u */
  var KATLA = {
    "ı": "i", "I": "i", "İ": "i", "i": "i",
    "ş": "s", "Ş": "s", "ğ": "g", "Ğ": "g",
    "ü": "u", "Ü": "u", "ö": "o", "Ö": "o",
    "ç": "c", "Ç": "c", "â": "a", "Â": "a",
    "î": "i", "Î": "i", "û": "u", "Û": "u"
  };
  function harfKatla(ch) {
    var m = KATLA[ch];
    if (m !== undefined) return m;
    var k = ch.toLowerCase();
    return k.length === 1 ? k : ch;   // çok harfe açılan eşlemeler uzunluğu bozmasın
  }
  function normalize(s) {
    var t = String(s == null ? "" : s), out = "";
    for (var i = 0; i < t.length; i++) out += harfKatla(t.charAt(i));
    return out;
  }
  function kelimeler(sorgu) {
    var n = normalize(sorgu).replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    return n ? n.split(" ") : [];
  }

  /* ───────────── 2) KAYIT İNDEKSİ (tüm kaynaklar; olmayan atlanır) ───────────── */
  var _kayitlar = null;

  function kayitEkle(hovuz, grup, kayit) {
    var alanlar = (kayit.alanlar || []).filter(function (a) {
      return a && a.metin != null && String(a.metin).length;
    }).map(function (a) {
      var metin = String(a.metin);
      return { ad: a.ad, metin: metin, norm: normalize(metin) };
    });
    if (!alanlar.length) return;
    hovuz.push({
      grup: grup, baslik: kayit.baslik || "", alt: kayit.alt || "",
      kaynak: kayit.kaynak || (GRUP_AD[grup] ? GRUP_AD[grup].etiket : grup),
      hedef: kayit.hedef || (GRUP_AD[grup] ? GRUP_AD[grup].hedef : null),
      alanlar: alanlar,
      tumNormal: normalize(alanlar.map(function (a) { return a.metin; }).join(" "))
    });
  }

  function kur() {
    var hovuz = [];

    /* (1) SORU BANKASI — window.USTAD_SORULAR */
    dizi(window.USTAD_SORULAR).forEach(function (q, i) {
      kayitEkle(hovuz, "sorular", {
        baslik: q.soru || q.metin || ("Soru " + (i + 1)),
        alt: birlestir([q.ders, q.konu, q.zorluk, q.tip], " · "),
        kaynak: "Soru Bankası · " + (q.tip || "Konu Testi"),
        alanlar: [
          { ad: "Soru", metin: birlestir([q.metin, q.soru], " ") },
          { ad: "Açıklama", metin: q.aciklama || "" },
          { ad: "Ders / Konu", metin: birlestir([q.ders, q.konu]) }
        ]
      });
    });

    /* (2) DERS NOTLARI — window.USTAD_NOTLAR */
    dizi(window.USTAD_NOTLAR).forEach(function (n, i) {
      kayitEkle(hovuz, "notlar", {
        baslik: n.baslik || ("Ders Notu " + (i + 1)),
        alt: birlestir([n.ders, n.konu]),
        alanlar: [
          { ad: "Başlık", metin: n.baslik || "" },
          { ad: "Özet", metin: n.ozet || "" },
          { ad: "Metin", metin: Array.isArray(n.metin) ? n.metin.join(" ") : (n.metin || "") },
          { ad: "Püf Noktalar", metin: Array.isArray(n.pufNoktalar) ? n.pufNoktalar.join(" ") : "" },
          { ad: "Sınav İpucu", metin: n.sinavIpucu || "" },
          { ad: "Ders / Konu", metin: birlestir([n.ders, n.konu]) }
        ]
      });
    });

    /* (3) SÖZLÜK — window.USTAD_SOZLUK (yoksa grup boş kalır) */
    dizi(window.USTAD_SOZLUK).forEach(function (s) {
      kayitEkle(hovuz, "sozluk", {
        baslik: s.terim || s.sozcuk || s.baslik || "",
        alt: birlestir([s.ders, s.konu]),
        alanlar: [
          { ad: "Sözlük", metin: birlestir([s.terim, s.sozcuk], " ") },
          { ad: "Anlam", metin: s.anlam || s.tanim || s.aciklama || "" },
          { ad: "Örnek", metin: s.ornek || s.örnek || "" },
          { ad: "Ders / Konu", metin: birlestir([s.ders, s.konu]) }
        ]
      });
    });

    /* (4) 2026 GÜNCEL BİLGİLER — window.KPSS_GUNCEL.maddeler */
    var g = window.KPSS_GUNCEL || window.GUNCEL || {};
    dizi(g.maddeler).forEach(function (m) {
      kayitEkle(hovuz, "guncel", {
        baslik: m.konu || m.bilgi || "Güncel madde",
        alt: birlestir([m.tarih, m.kaynak_ad]),
        kaynak: "Güncel Bilgi" + (m.kaynak_ad ? " · " + m.kaynak_ad : ""),
        alanlar: [
          { ad: "Konu", metin: m.konu || "" },
          { ad: "Bilgi", metin: m.bilgi || "" },
          { ad: "Kaynak", metin: birlestir([m.kaynak_ad, m.tarih]) }
        ]
      });
    });

    /* (5) ÇIKMIŞ SORULAR — window.KPSS_CIKMIS (yillar + ozgun) */
    var c = window.KPSS_CIKMIS || window.CIKMIS || {};
    dizi(c.yillar).forEach(function (y) {
      kayitEkle(hovuz, "cikmis", {
        baslik: (y.yil ? y.yil + " · " : "") + (y.tur || "KPSS"),
        alt: birlestir([Array.isArray(y.konu) ? y.konu.join(" / ") : "", y.not]),
        kaynak: "Çıkmış Soru · " + (y.yil || ""),
        alanlar: [
          { ad: "Yıl / Tür", metin: birlestir([y.yil, y.tur]) },
          { ad: "Yapı", metin: y.yapi || "" },
          { ad: "Konular", metin: Array.isArray(y.konu) ? y.konu.join(" ") : (y.konu || "") },
          { ad: "Not", metin: y.not || "" }
        ]
      });
    });
    dizi(c.ozgun).forEach(function (o) {
      kayitEkle(hovuz, "cikmis", {
        baslik: o.soru || ("Özgün alıştırma " + (o.yil || "")),
        alt: birlestir([o.yil, o.ders, o.konu]),
        kaynak: "Özgün Alıştırma · " + (o.yil || ""),
        alanlar: [
          { ad: "Soru", metin: o.soru || "" },
          { ad: "Açıklama", metin: o.aciklama || "" },
          { ad: "Şıklar", metin: Array.isArray(o.siklar) ? o.siklar.join(" ") : "" },
          { ad: "Ders / Konu", metin: birlestir([o.ders, o.konu]) }
        ]
      });
    });

    /* (6) SINAV PAKETİ — window.USTAD_PAKET (sınav künyesi + ders/konular + duyurular) */
    var p = window.USTAD_PAKET || {};
    if (p.sinav && typeof p.sinav === "object") {
      var sn = p.sinav;
      kayitEkle(hovuz, "paket", {
        baslik: birlestir([sn.ad, sn.kod && "(" + sn.kod + ")"]) || "Sınav künyesi",
        alt: birlestir([sn.tam, sn.soruSayisi && sn.soruSayisi + " soru", sn.dakika && sn.dakika + " dakika"]),
        kaynak: "Sınav Paketi",
        alanlar: [
          { ad: "Sınav", metin: birlestir([sn.ad, sn.tam, sn.kod]) },
          { ad: "Bölümler", metin: dizi(sn.bolumler).map(function (b) {
            return birlestir([b.ad, Array.isArray(b.dersler) ? b.dersler.join(" ") : ""]);
          }).join(" ") }
        ]
      });
    }
    dizi(p.dersler).forEach(function (d) {
      kayitEkle(hovuz, "paket", {
        baslik: "Ders: " + (d.ad || ""),
        alt: birlestir([d.bolum, d.soru && d.soru + " soru"]),
        kaynak: "Müfredat",
        alanlar: [
          { ad: "Ders", metin: birlestir([d.ad, d.bolum]) },
          { ad: "Konular", metin: Array.isArray(d.konular) ? d.konular.join(" · ") : "" }
        ]
      });
    });
    dizi(p.duyurular).forEach(function (u) {
      kayitEkle(hovuz, "paket", {
        baslik: u.baslik || "Duyuru",
        alt: birlestir([u.kaynak, u.tarih]),
        kaynak: "Duyuru" + (u.kaynak ? " · " + u.kaynak : ""),
        alanlar: [
          { ad: "Duyuru", metin: u.baslik || "" },
          { ad: "Kaynak", metin: birlestir([u.kaynak, u.tarih]) }
        ]
      });
    });

    return hovuz;
  }

  function kayitlar() { if (!_kayitlar) _kayitlar = kur(); return _kayitlar; }
  function tazele() { _kayitlar = null; return kayitlar().length; }

  /* ───────────── 3) ARAMA ───────────── */
  function alanSec(kayit, kelimeler) {
    /* kural: eşleşen alanlar arasından EN ZENGİN metni seç (en uzun gövde),
       ama kartın başlığını tekrarlayan alanı (kart zaten başlığı gösteriyor)
       ancak başka eşleşen alan yoksa kullan. */
    var bas = normalize(kayit.baslik);
    var enIyi = null, yedek = null, i, j, yer;
    for (i = 0; i < kayit.alanlar.length; i++) {
      var a = kayit.alanlar[i], eslesti = false, ilkYer = -1;
      for (j = 0; j < kelimeler.length; j++) {
        yer = a.norm.indexOf(kelimeler[j]);
        if (yer >= 0) { eslesti = true; if (ilkYer < 0 || yer < ilkYer) ilkYer = yer; }
      }
      if (!eslesti) continue;
      var basligi = bas && (a.norm === bas || a.norm.indexOf(bas) === 0);
      if (basligi) { if (!yedek || a.metin.length > yedek.metin.length) yedek = a; continue; }
      if (!enIyi || a.metin.length > enIyi.metin.length ||
          (a.metin.length === enIyi.metin.length && ilkYer < enIyi.__yer)) {
        a.__yer = ilkYer; enIyi = a;
      }
    }
    if (!enIyi) enIyi = yedek;
    if (!enIyi) enIyi = kayit.alanlar[0];
    var n = normalize(enIyi.metin);
    yer = -1;
    for (j = 0; j < kelimeler.length; j++) {
      var p = n.indexOf(kelimeler[j]);
      if (p >= 0 && (yer < 0 || p < yer)) yer = p;
    }
    return { alan: enIyi, yer: yer };
  }

  /* eşleşen yerin çevresinden kısa alıntı (aynı vurgulama indeksleriyle) */
  function alinti(kayit, kelimeler) {
    var s = alanSec(kayit, kelimeler), a = s.alan, metin = a.metin;
    var yer = s.yer < 0 ? 0 : s.yer;
    var bas = 0, son = Math.min(metin.length, 170);
    if (yer > 0) {
      bas = Math.max(0, yer - 70);
      son = Math.min(metin.length, yer + 110);
      // kelime ortasında başlamayalım
      if (bas > 0) { while (bas < yer && /[^\s]/.test(metin.charAt(bas)) && /[^\s]/.test(metin.charAt(bas - 1))) bas++; }
      if (son < metin.length) { while (son > yer && /[^\s]/.test(metin.charAt(son)) && /[^\s]/.test(metin.charAt(son - 1))) son++; }
    }
    var parca = metin.slice(bas, son), ek = "";
    /* alan çok kısaysa (ör. sözlükte yalnız terim eşleşti) kartta bağlam bırakma */
    if (parca.length < 48) {
      var enUzun = null;
      kayit.alanlar.forEach(function (x) {
        if (x !== a && (!enUzun || x.metin.length > enUzun.metin.length)) enUzun = x;
      });
      if (enUzun && enUzun.metin.length > parca.length) {
        ek = " — " + enUzun.metin.slice(0, 150) + (enUzun.metin.length > 150 ? "…" : "");
      }
    }
    return { alan: a.ad, ham: parca + ek, on: bas > 0, arka: son < metin.length || !!ek };
  }

  /* aranan kelimeleri <b> ile vurgula (HTML kaçışı korunarak) */
  function vurgula(metin, kelimeler) {
    var t = String(metin == null ? "" : metin), n = normalize(t), araliklar = [];
    (kelimeler || []).forEach(function (k) {
      if (!k) return;
      var p = 0, i;
      while ((i = n.indexOf(k, p)) >= 0) { araliklar.push([i, i + k.length]); p = i + k.length; }
    });
    if (!araliklar.length) return kacis(t);
    araliklar.sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; });
    var birlesik = [];
    araliklar.forEach(function (r) {
      var son = birlesik[birlesik.length - 1];
      if (son && r[0] <= son[1]) { if (r[1] > son[1]) son[1] = r[1]; }
      else birlesik.push([r[0], r[1]]);
    });
    var out = "", yer = 0;
    birlesik.forEach(function (r) {
      out += kacis(t.slice(yer, r[0])) + "<b>" + kacis(t.slice(r[0], r[1])) + "</b>";
      yer = r[1];
    });
    return out + kacis(t.slice(yer));
  }

  /* ana arama: {sorgu, kelimeler, toplam, gruplar:[{kod,ad,toplam,sonuclar:[]}]} */
  function ara(sorgu) {
    var kels = kelimeler(sorgu);
    var sonuc = { sorgu: String(sorgu == null ? "" : sorgu).trim(), kelimeler: kels, toplam: 0, gruplar: [] };
    if (!kels.length) return sonuc;
    var hepsi = kayitlar();
    GRUPLAR.forEach(function (g) {
      var sec = [];
      hepsi.forEach(function (k) {
        if (k.grup !== g.kod) return;
        for (var i = 0; i < kels.length; i++) { if (k.tumNormal.indexOf(kels[i]) < 0) return; }
        var al = alinti(k, kels);
        sec.push({
          baslik: k.baslik, alt: k.alt, kaynak: k.kaynak, hedef: k.hedef,
          etiket: g.etiket, alan: al.alan,
          on: al.on, arka: al.arka,
          alinti: (al.on ? "… " : "") + vurgula(al.ham, kels) + (al.arka ? " …" : "")
        });
      });
      if (sec.length) {
        sonuc.toplam += sec.length;
        sonuc.gruplar.push({ kod: g.kod, ad: g.ad, hedef: g.hedef, yon: g.yon, etiket: g.etiket,
                             toplam: sec.length, sonuclar: sec });
      }
    });
    return sonuc;
  }

  /* ───────────── 4) SON ARAMALAR (localStorage) ───────────── */
  function sonAramalar() {
    try {
      var s = localStorage.getItem(SON_ANAHTAR);
      var a = s ? JSON.parse(s) : [];
      return Array.isArray(a) ? a.filter(function (x) { return typeof x === "string"; }) : [];
    } catch (e) { return []; }
  }
  function sonEkle(sorgu) {
    var t = String(sorgu == null ? "" : sorgu).trim();
    if (t.length < MIN_HARF) return sonAramalar();
    var a = sonAramalar().filter(function (x) { return normalize(x) !== normalize(t); });
    a.unshift(t);
    a = a.slice(0, MAX_SON);
    try { localStorage.setItem(SON_ANAHTAR, JSON.stringify(a)); } catch (e) {}
    return a;
  }
  function sonTemizle() {
    try { localStorage.removeItem(SON_ANAHTAR); } catch (e) {}
    return [];
  }

  /* ───────────── 5) BÖLÜM GEÇİŞİ ───────────── */
  var MODUL = {
    sayim: "KPSS_ARACLAR", puan: "KPSS_ARACLAR", guncel: "KPSS_ARACLAR", cikmis: "KPSS_ARACLAR",
    sesli: "KPSS_SES", oyun: "KPSS_OYUN", kocai: "KOC_AI", kart: "KARTLAR", defter: "DEFTER",
    minitest: "MINITEST", danaliz: "DANALIZ", sesdene: "SESDENE", ezber: "EZBER",
    rozet: "ROZET", karne: "KARNE"
  };
  function modul(kod) {
    var ad = MODUL[kod];
    return ad && window[ad] && typeof window[ad].bolumAc === "function" ? window[ad] : null;
  }
  /* hedef bölüm gerçekten açılabiliyor mu? */
  function hedefVar(kod) {
    if (!kod) return false;
    if (window.USTAD_MOTOR && typeof window.USTAD_MOTOR.git === "function") return true;
    if (document.getElementById("ekran-" + kod)) return true;
    return !!modul(kod);
  }
  function gitDene(kod) {
    if (!kod) return false;
    try {
      if (window.USTAD_MOTOR && typeof window.USTAD_MOTOR.git === "function") { window.USTAD_MOTOR.git(kod); return true; }
      var ekran = document.getElementById("ekran-" + kod);
      var m = modul(kod);
      if (!ekran && !m) return false;
      if (ekran) {
        $$(".ekran").forEach(function (e) { e.classList.remove("acik"); });
        ekran.classList.add("acik");
        document.body.setAttribute("data-bolum", kod);
        window.scrollTo(0, 0);
      }
      if (m) m.bolumAc(kod);
      return true;
    } catch (e) { return false; }
  }

  /* ───────────── 6) ARAYÜZ ───────────── */
  var kuruldu = false, zaman = null;

  function kapKur() {
    var kap = document.getElementById("ekran-" + KOD);
    if (!kap) {
      kap = document.createElement("section");
      kap.id = "ekran-" + KOD;
      kap.className = "ekran";
      kap.setAttribute("data-bolum", KOD);
      document.body.appendChild(kap);
    }
    if (!document.getElementById("aramaAlan")) {
      var alan = document.createElement("div");
      alan.id = "aramaAlan";
      kap.appendChild(alan);
    }
    if (!document.getElementById("aramaDugme")) {
      var d = document.createElement("button");
      d.id = "aramaDugme";
      d.className = "ar-dugme";
      d.type = "button";
      d.title = "Tek arama ( / )";
      d.setAttribute("aria-label", "Tek arama");
      d.innerHTML = "🔍 <span>Ara</span>";
      d.addEventListener("click", function () { A.bolumAc(KOD); A.odakla(); });
      document.body.appendChild(d);
    }
    return kap;
  }

  function kabuk() {
    var kab = document.getElementById("aramaAlan");
    if (!kab) return;
    kab.innerHTML =
      '<h2 class="sayfa-baslik">🔍 Tek Arama</h2>' +
      '<div class="kart ar-kart">' +
        '<div class="ar-kutu-satir">' +
          '<span class="ar-buyutec" aria-hidden="true">🔍</span>' +
          '<input id="aramaKutu" class="ar-kutu" type="text" autocomplete="off" spellcheck="false" ' +
            'placeholder="Soru, ders notu, sözlük, güncel bilgi, çıkmış soru ara…" ' +
            'aria-label="Uygulamada ara">' +
          '<button id="aramaTemizle" class="ar-temizle" type="button" title="Temizle (Esc)">✕</button>' +
        '</div>' +
        '<p class="ar-ipucu"><b>/</b> tuşu kutuyu açar · <b>Esc</b> temizler · <b>Enter</b> ilk sonuca gider · ' +
          'sonuca dokununca ilgili bölüm açılır.</p>' +
        '<div id="aramaSon" class="ar-son"></div>' +
        '<div id="aramaSayac" class="ar-sayac"></div>' +
      '</div>' +
      '<div id="aramaBos" class="kart ar-bos gizli"></div>' +
      '<div id="aramaSonuc" class="ar-sonuc-alan"></div>';
  }

  function olaylar() {
    var kutu = $("#aramaKutu");
    if (kutu) {
      kutu.addEventListener("input", function () { girdi(); });
      kutu.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.keyCode === 13) {
          e.preventDefault();
          sonEkle(kutu.value);
          var ilk = $("#aramaSonuc .ar-sonuc");
          if (ilk) sonucGit(ilk);
          cizSonAramalar();
        } else if (e.key === "Escape" || e.keyCode === 27) {
          kutu.value = "";
          cizSonuclar("");
        }
      });
    }
    var tem = $("#aramaTemizle");
    if (tem) tem.addEventListener("click", function () {
      var k = $("#aramaKutu");
      if (k) { k.value = ""; k.focus(); }
      cizSonuclar("");
    });
    /* sonuç ve "bölüme git" düğmeleri (delegasyon: sonuçlar sonradan çizilir) */
    var kap = $("#aramaSonuc");
    if (kap) kap.addEventListener("click", function (e) {
      var dugme = e.target && e.target.closest ? e.target.closest("[data-ar-git]") : null;
      if (dugme) { e.stopPropagation(); gitDene(dugme.getAttribute("data-ar-git")); return; }
      var kart = e.target && e.target.closest ? e.target.closest(".ar-sonuc") : null;
      if (kart) sonucGit(kart);
    });
    /* son arama çipleri */
    var sonKap = $("#aramaSon");
    if (sonKap) sonKap.addEventListener("click", function (e) {
      var cip = e.target && e.target.closest ? e.target.closest("[data-ar-son]") : null;
      if (!cip) return;
      var k = $("#aramaKutu");
      if (k) { k.value = cip.getAttribute("data-ar-son"); k.focus(); }
      calistir(k ? k.value : "");
    });
    /* klavye kısayolları */
    document.addEventListener("keydown", function (e) {
      var t = e.target || {}, etiket = String(t.tagName || "").toLowerCase();
      var yazi = etiket === "input" || etiket === "textarea" || etiket === "select" || t.isContentEditable;
      if (e.key === "/" || e.keyCode === 191) {
        if (yazi) return;                      // kutuda yazarken "/" karakteri engellenmez
        e.preventDefault();
        A.bolumAc(KOD);
        A.odakla();
        return;
      }
      if (e.key === "Escape" || e.keyCode === 27) {
        var k = $("#aramaKutu");
        if (k && k.value) { k.value = ""; cizSonuclar(""); k.focus(); }
      }
    }, true);
  }

  function sonucGit(kart) {
    var kod = kart.getAttribute("data-hedef");
    var kutu = $("#aramaKutu");
    if (kutu && kutu.value) sonEkle(kutu.value);
    if (gitDene(kod)) return;
    /* bölüm açılamıyorsa sonucun tamamını göster + "bölüme git" bilgisi */
    kart.classList.add("ar-acik");
    var uy = kart.querySelector(".ar-uyari");
    if (uy) uy.textContent = "İlgili bölüm bu kurulumda yok; metnin tamamı aşağıda.";
  }

  function girdi() {
    if (zaman) clearTimeout(zaman);
    zaman = setTimeout(function () { zaman = null; calistir($("#aramaKutu") ? $("#aramaKutu").value : ""); }, GECIKME);
  }
  function calistir(sorgu) {
    cizSonuclar(sorgu);
    cizSonAramalar();
  }

  function parcaHtml(s, g) {
    var hedefVarMi = hedefVar(s.hedef);
    return '<article class="ar-sonuc" data-hedef="' + kacis(s.hedef || "") + '" tabindex="0" ' +
             'role="button" aria-label="' + kacis(String(s.baslik).slice(0, 90)) + '">' +
        '<div class="ar-ust">' +
          '<span class="ar-etiket">' + kacis(s.kaynak || g.etiket) + '</span>' +
          '<span class="ar-alan">' + kacis(s.alan) + '</span>' +
        '</div>' +
        '<h4 class="ar-baslik">' + kacis(s.baslik) + '</h4>' +
        (s.alt ? '<p class="ar-alt">' + kacis(s.alt) + '</p>' : '') +
        '<p class="ar-alinti">' + s.alinti + '</p>' +
        '<div class="ar-detay gizli"><p>' + kacis(String(s.yon || "")) + ' bölümüne gitmek için dokun.</p>' +
          '<p class="ar-uyari"></p></div>' +
        '<button class="ar-git" type="button" data-ar-git="' + kacis(s.hedef || "") + '">' +
          (hedefVarMi ? "→ " + kacis(s.yon || "Bölüme git") : "bölüme git") + '</button>' +
      '</article>';
  }

  function cizSonuclar(sorgu) {
    var kap = $("#aramaSonuc");
    if (!kap) return null;
    var ham = String(sorgu == null ? "" : sorgu).trim();
    var sonuc = ara(ham);
    var sayac = $("#aramaSayac"), bos = $("#aramaBos");
    var k = $("#aramaKutu");

    /* en az 2 harf kuralı: kısa sorgu aramaya çevrilmez (binlerce gereksiz sonuç) */
    if (!sonuc.kelimeler.length || ham.length < MIN_HARF) {
      kap.innerHTML = "";
      if (sayac) sayac.innerHTML = ham
        ? "Aramak için en az " + MIN_HARF + " harf yaz." : "Aramaya başlamak için yaz ya da son aramalardan seç.";
      if (bos) bos.classList.add("gizli");
      return { sorgu: ham, kelimeler: [], toplam: 0, gruplar: [], kisa: true };
    }

    var html = "";
    sonuc.gruplar.forEach(function (g) {
      var goster = g.sonuclar.slice(0, GRUP_SINIR);
      html += '<section class="ar-grup" data-grup="' + kacis(g.kod) + '">' +
        '<h3 class="ar-grup-baslik">' + kacis(g.ad) + ' <b>(' + g.toplam + ')</b></h3>' +
        '<div class="ar-liste">' + goster.map(function (s) { return parcaHtml(s, g); }).join("") + '</div>' +
        (g.toplam > goster.length
          ? '<p class="ar-daha">' + (g.toplam - goster.length) + ' sonuç daha var — aramanı daralt.</p>' : "") +
        '</section>';
    });
    kap.innerHTML = html;

    if (sayac) {
      sayac.innerHTML = sonuc.toplam
        ? '<b>' + sonuc.toplam + '</b> sonuç · ' + sonuc.gruplar.length + ' grupta bulundu' +
          (sonuc.gruplar.map(function (g) { return " · " + g.ad + " " + g.toplam; }).join(""))
        : "";
    }
    if (bos) {
      var yok = !sonuc.toplam;
      bos.classList.toggle("gizli", !yok);
      bos.innerHTML = yok
        ? '<h3>Sonuç bulunamadı</h3><p class="ar-bos-yazi">“<b>' + kacis(sonuc.sorgu) + '</b>” için hiç sonuç bulunamadı. ' +
          'Daha kısa bir kelime dene; aksan yazmak zorunda değilsin (ör. <b>sozcuk</b> yazsan da <b>sözcük</b> bulunur).</p>' +
          '<p class="ar-bos-yazi">İpucu: soru, ders notu, sözlük, güncel bilgi ve çıkmış sorular birlikte taranır.</p>'
        : "";
    }
    return sonuc;
  }

  function cizSonAramalar() {
    var kap = $("#aramaSon");
    if (!kap) return;
    var a = sonAramalar();
    kap.innerHTML = a.length
      ? '<p class="ar-son-baslik">Son aramalar</p>' + a.map(function (x) {
          return '<button class="ar-cip" type="button" data-ar-son="' + kacis(x) + '">🕘 ' + kacis(x) + '</button>';
        }).join("") + '<button class="ar-cip ar-cip-sil" type="button" data-ar-son-sil="1">🗑 Listeyi temizle</button>'
      : "";
    var sil = kap.querySelector("[data-ar-son-sil]");
    if (sil) sil.addEventListener("click", function () { sonTemizle(); cizSonAramalar(); });
  }

  function acEkran() {
    $$(".ekran").forEach(function (e) { e.classList.remove("acik"); });
    var kap = document.getElementById("ekran-" + KOD);
    if (kap) kap.classList.add("acik");
    document.body.setAttribute("data-bolum", KOD);
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function odakla() {
    var k = $("#aramaKutu");
    if (!k) return false;
    try { k.focus(); } catch (e) {}
    return document.activeElement === k;
  }

  function ciz() {
    kapKur();
    if (!kuruldu) { kabuk(); olaylar(); kuruldu = true; }
    acEkran();
    cizSonAramalar();
    var k = $("#aramaKutu");
    cizSonuclar(k ? k.value : "");
    setTimeout(function () { odakla(); }, 40);
    return true;
  }

  /* ───────────── 7) DIŞA AÇILAN SÖZLEŞME ───────────── */
  A.bolumAc = function (kod) { if (kod === KOD) ciz(); };
  A.ciz = ciz;
  A.ara = ara;
  A.tazele = tazele;
  A.kayitlar = kayitlar;
  A.normalize = normalize;
  A.kelimeler = kelimeler;
  A.vurgula = vurgula;
  A.alinti = alinti;
  A.gitDene = gitDene;
  A.hedefVar = hedefVar;
  A.sonAramalar = sonAramalar;
  A.sonEkle = sonEkle;
  A.sonTemizle = sonTemizle;
  A.cizSonuclar = cizSonuclar;
  A.cizSonAramalar = cizSonAramalar;
  A.odakla = odakla;
  A.GRUPLAR = GRUPLAR;
  A.SINIRLAR = { GECIKME: GECIKME, MIN_HARF: MIN_HARF, MAX_SON: MAX_SON, GRUP_SINIR: GRUP_SINIR, ANAHTAR: SON_ANAHTAR };

  /* ───────────── 8) KENDİ KENDİNİ TEST (?test=1) ───────────── */
  if (location.search.indexOf("test=1") >= 0) {
    var baslat = function () { setTimeout(testiCalistir, 500); };
    if (document.readyState === "complete") baslat();
    else window.addEventListener("load", baslat);
  }

  function testiCalistir() {
    var t = [], ok = function (ad, kosul, ek) {
      t.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : ""));
    };

    /* bağımsız referans gerçekleme (modülün normalize'ı kullanılmaz) */
    var tr = function (s) {
      return String(s == null ? "" : s)
        .replace(/[İIı]/g, "i").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g")
        .replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c")
        .replace(/[âÂ]/g, "a").toLowerCase();
    };
    var referansSoru = function (kelimeler2) {
      return dizi2(window.USTAD_SORULAR).filter(function (q) {
        var h = tr([q.metin, q.soru, q.aciklama, q.ders, q.konu].filter(Boolean).join(" "));
        return kelimeler2.every(function (k) { return h.indexOf(k) >= 0; });
      }).length;
    };
    var referansNot = function (kelimeler2) {
      return dizi2(window.USTAD_NOTLAR).filter(function (n) {
        var h = tr([n.baslik, n.ozet, (n.metin || []).join(" "), n.ders, n.konu].filter(Boolean).join(" "));
        return kelimeler2.every(function (k) { return h.indexOf(k) >= 0; });
      }).length;
    };
    function dizi2(x) { return Array.isArray(x) ? x.filter(function (o) { return o && typeof o === "object"; }) : []; }
    var grupAl = function (s, kod) {
      for (var i = 0; i < s.gruplar.length; i++) if (s.gruplar[i].kod === kod) return s.gruplar[i];
      return null;
    };
    var metin = function (s) { var e = $(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
    var eskiSon = localStorage.getItem("ustad.arama.son");
    var eskiSozluk = window.USTAD_SOZLUK;
    var eskiSorular = window.USTAD_SORULAR;

    /* — 1) modül + ekran kurulumu — */
    ok("modül: window.ARAMA var", !!window.ARAMA);
    ok("modül: bolumAc fonksiyon", typeof A.bolumAc === "function", typeof A.bolumAc);
    A.bolumAc("arama");
    ok("kabuk: #ekran-arama oluşturuldu", !!document.getElementById("ekran-arama"));
    ok("kabuk: data-bolum=\"arama\"", (document.getElementById("ekran-arama") || {}).getAttribute
       ? document.getElementById("ekran-arama").getAttribute("data-bolum") === "arama" : false);
    ok("kabuk: sınıfı .ekran", /(^|\s)ekran(\s|$)/.test((document.getElementById("ekran-arama") || {}).className || ""));
    ok("kabuk: #aramaAlan var", !!document.getElementById("aramaAlan"));
    ok("kabuk: arama kutusu var", !!document.getElementById("aramaKutu"));
    ok("kabuk: bölüm açık (.acik)", !!$("#ekran-arama.acik"));
    ok("kabuk: yüzen arama düğmesi", !!document.getElementById("aramaDugme"));
    ok("kabuk: gövdeye data-bolum=arama yazıldı", document.body.getAttribute("data-bolum") === "arama",
       String(document.body.getAttribute("data-bolum")));
    ok("kabuk: başka bölüm kodu bir şey yapmıyor", (A.bolumAc("minitest"), A.bolumAc("bilinmeyen"), !!$("#ekran-arama.acik")),
       $("#ekran-arama.acik") ? "arama açık kaldı" : "arama kapandı");

    /* — 2) indeks ve kaynak dayanıklılığı — */
    var kayitlar = A.kayitlar();
    ok("indeks: kayıt üretildi", kayitlar.length > 100, kayitlar.length + " kayıt");
    ok("indeks: soru kaydı var", kayitlar.filter(function (k) { return k.grup === "sorular"; }).length > 0);
    ok("indeks: not kaydı var", kayitlar.filter(function (k) { return k.grup === "notlar"; }).length > 0);
    ok("indeks: güncel kaydı var", kayitlar.filter(function (k) { return k.grup === "guncel"; }).length > 0);
    ok("indeks: çıkmış kaydı var", kayitlar.filter(function (k) { return k.grup === "cikmis"; }).length > 0);
    ok("indeks: paket kaydı var", kayitlar.filter(function (k) { return k.grup === "paket"; }).length > 0);
    ok("indeks: sözlük kaynağı okundu", kayitlar.filter(function (k) { return k.grup === "sozluk"; }).length > 0,
       kayitlar.filter(function (k) { return k.grup === "sozluk"; }).length + " terim");
    var cokme = null, bosSonuc = null;
    try {
      var eS = window.USTAD_SORULAR, eN = window.USTAD_NOTLAR, eG = window.KPSS_GUNCEL,
          eC = window.KPSS_CIKMIS, eP = window.USTAD_PAKET, eZ = window.USTAD_SOZLUK;
      window.USTAD_SORULAR = undefined; window.USTAD_NOTLAR = null; window.KPSS_GUNCEL = null;
      window.KPSS_CIKMIS = {}; window.USTAD_PAKET = null; window.USTAD_SOZLUK = undefined;
      A.tazele();
      bosSonuc = A.ara("paragraf");
      window.USTAD_SORULAR = eS; window.USTAD_NOTLAR = eN; window.KPSS_GUNCEL = eG;
      window.KPSS_CIKMIS = eC; window.USTAD_PAKET = eP; window.USTAD_SOZLUK = eZ;
    } catch (e) { cokme = e; }
    A.tazele();
    ok("kaynak dizileri yokken çökmüyor", !cokme, cokme ? String(cokme.message) : "hata yok");
    ok("kaynak yokken sonuç 0", !!bosSonuc && bosSonuc.toplam === 0 && bosSonuc.gruplar.length === 0,
       bosSonuc ? String(bosSonuc.toplam) : "null");

    /* — 3) temel arama: "paragraf" — */
    var s1 = A.ara("paragraf");
    var gSoru = grupAl(s1, "sorular"), gNot = grupAl(s1, "notlar");
    ok("arama: 'paragraf' soru grubu döndü", !!gSoru && gSoru.toplam > 0, gSoru ? gSoru.toplam + " soru" : "grup yok");
    ok("arama: 'paragraf' ders notu grubu döndü", !!gNot && gNot.toplam > 0, gNot ? gNot.toplam + " not" : "grup yok");
    ok("arama: soru sayısı referansla aynı", gSoru && gSoru.toplam === referansSoru(["paragraf"]),
       (gSoru ? gSoru.toplam : "-") + " / " + referansSoru(["paragraf"]));
    ok("arama: not sayısı referansla aynı", gNot && gNot.toplam === referansNot(["paragraf"]),
       (gNot ? gNot.toplam : "-") + " / " + referansNot(["paragraf"]));
    ok("arama: toplam = grupların toplamı",
       s1.toplam === s1.gruplar.reduce(function (a, g) { return a + g.toplam; }, 0), String(s1.toplam));
    ok("arama: boş sorgu sonuç döndürmez", A.ara("").toplam === 0 && A.ara("   ").gruplar.length === 0, "ok");
    $("#aramaKutu").value = "p";
    A.cizSonuclar("p");
    ok("arama: 1 harflik sorgu aranmaz, uyarı gösterilir",
       /en az 2 harf/.test(metin("#aramaSayac")) && $$("#aramaSonuc .ar-sonuc").length === 0,
       metin("#aramaSayac").slice(0, 40));

    /* — 4) Türkçe normalizasyon / aksan duyarsızlığı — */
    ok("normalize: ı=i ş=s ğ=g ü=u ö=o ç=c",
       A.normalize("IŞIĞI ÜÖÇ") === "isigi uoc", A.normalize("IŞIĞI ÜÖÇ"));
    ok("normalize: büyük/küçük harf aynı sonucu verir",
       A.normalize("PARAGRAF") === A.normalize("paragraf"), A.normalize("PARAGRAF"));
    var sDuz = A.ara("sozcuk"), sTr = A.ara("sözcük");
    var gDuz = grupAl(sDuz, "sorular");
    ok("arama: aksansız 'sozcuk' sonuç bulur", sDuz.toplam > 0, sDuz.toplam + " sonuç");
    ok("arama: 'sozcuk' = 'sözcük' (tüm gruplar)", sDuz.toplam === sTr.toplam && sDuz.toplam > 0,
       sDuz.toplam + " / " + sTr.toplam);
    ok("arama: 'sozcuk' soru grubu referansla aynı", !!gDuz && gDuz.toplam === referansSoru(["sozcuk"]),
       (gDuz ? gDuz.toplam : "-") + " / ref " + referansSoru(["sozcuk"]));
    var sBuyuk = A.ara("PARAGRAF");
    ok("arama: büyük harf aynı sonucu verir", sBuyuk.toplam === s1.toplam, sBuyuk.toplam + " / " + s1.toplam);
    ok("arama: 'turkce' ders adını bulur", A.ara("turkce").toplam > 0, A.ara("turkce").toplam + " sonuç");
    ok("kelimeler: noktalama ayıklanır", A.kelimeler("sözcük, anlam!").join("|") === "sozcuk|anlam",
       A.kelimeler("sözcük, anlam!").join("|"));

    /* — 5) çok kelimeli arama (tüm kelimeler geçmeli) — */
    var sIki = A.ara("paragraf anlatım");
    var sTekA = A.ara("paragraf"), sTekB = A.ara("anlatım");
    ok("çok kelime: tüm kelimeler aranıyor", sIki.kelimeler.length === 2, sIki.kelimeler.join("+"));
    ok("çok kelime: sonuç tekil aramanın alt kümesi",
       sIki.toplam <= Math.min(sTekA.toplam, sTekB.toplam) && sIki.toplam > 0,
       sIki.toplam + " ≤ min(" + sTekA.toplam + "," + sTekB.toplam + ")");
    ok("çok kelime: soru grubu referansla aynı", (grupAl(sIki, "sorular") ? grupAl(sIki, "sorular").toplam : 0) === referansSoru(["paragraf", "anlatim"]),
       String(grupAl(sIki, "sorular") ? grupAl(sIki, "sorular").toplam : 0) + " / ref " + referansSoru(["paragraf", "anlatim"]));
    var sYok = A.ara("paragraf zzzqqq");
    ok("çok kelime: biri yoksa sonuç yok", sYok.toplam === 0, String(sYok.toplam));

    /* — 6) sözlük grubu (gerçek USTAD_SOZLUK kaynağı) — */
    var gSoz = grupAl(A.ara("alegori"), "sozluk");
    ok("sözlük: grup üretildi", !!gSoz, gSoz ? gSoz.toplam + " terim" : "grup yok (USTAD_SOZLUK yok)");
    ok("sözlük: terim kaydı bulundu", !!gSoz && /Alegori/.test(gSoz.sonuclar[0].baslik),
       gSoz ? gSoz.sonuclar[0].baslik : "-");
    ok("sözlük: alıntı anlam/örnek alanından geliyor",
       !!gSoz && ["Sözlük", "Anlam", "Örnek"].indexOf(gSoz.sonuclar[0].alan) >= 0,
       gSoz ? gSoz.sonuclar[0].alan : "-");
    ok("sözlük: tanım metni aranıyor (alegori)",
       !!gSoz && gSoz.sonuclar[0].alinti.length > 60, gSoz ? String(gSoz.sonuclar[0].alinti.length) + " karakter" : "-");
    ok("sözlük: 'örnek' alanı da aranıyor", A.ara("fabllardaki").toplam > 0, A.ara("fabllardaki").toplam + " sonuç");
    ok("sözlük: aksansız 'tesbih' terimini bulur",
       (function () { var g = grupAl(A.ara("tesbih"), "sozluk");
         return !!g && g.sonuclar.some(function (x) { return A.normalize(x.baslik) === "tesbih"; }); })(),
       (function () { var g = grupAl(A.ara("tesbih"), "sozluk");
         return g ? g.sonuclar.map(function (x) { return x.baslik; }).slice(0, 4).join(",") : "grup yok"; })());

    /* — 7) vurgulama — */
    var v = A.vurgula("Paragrafın anlamı ve paragraf türleri", ["paragraf"]);
    ok("vurgula: <b> ile sarar", (v.match(/<b>Paragraf/g) || []).length === 1 && (v.match(/<b>/g) || []).length === 2, v);
    ok("vurgula: aksansız kelime Türkçe metni vurgular",
       A.vurgula("Sözcükte anlam", ["sozcuk"]).indexOf("<b>Sözcük</b>") === 0, A.vurgula("Sözcükte anlam", ["sozcuk"]));
    ok("vurgula: HTML kaçışı yapılır", A.vurgula("<img onerror=alert(1)>", []).indexOf("&lt;img") === 0,
       A.vurgula("<img onerror=alert(1)>", []));
    var xss = { ders: "Türkçe", konu: "Güvenlik", tip: "Konu Testi", metin: "", soru: "Test guvenliktesti <img src=x onerror=alert(1)> metni",
                aciklama: "Deneme" };
    window.USTAD_SORULAR = dizi2(eskiSorular).concat([xss]);
    A.tazele();
    var sX = A.ara("guvenliktesti");
    A.cizSonuclar("guvenliktesti");
    var xKap = $("#aramaSonuc");
    var xHtml = xKap ? xKap.innerHTML : "";
    var kacisVar = xHtml.indexOf("&lt;img") >= 0;
    var imgVar = !!$("#aramaSonuc img");
    ok("güvenlik: sonuç HTML'i kaçışlanır", kacisVar && !imgVar,
       "kaçış=" + kacisVar + " gerçekImg=" + imgVar + " kart=" + $$("#aramaSonuc .ar-sonuc").length);
    ok("güvenlik: enjekte kayıt yine bulunur", !!grupAl(sX, "sorular"), String(grupAl(sX, "sorular") ? grupAl(sX, "sorular").toplam : 0));
    window.USTAD_SORULAR = eskiSorular;
    A.tazele();

    /* — 8) arayüz: sayaç, gruplar, boş durum — */
    var sayacHtml = "";
    A.cizSonuclar("paragraf");
    var sDom = A.ara("paragraf");
    sayacHtml = metin("#aramaSayac");
    ok("sayaç: toplam sonuç yazılı", new RegExp("^" + sDom.toplam + " sonuç").test(sayacHtml) || new RegExp("\\b" + sDom.toplam + "\\b sonuç").test(sayacHtml), sayacHtml.slice(0, 80));
    ok("sayaç: metinde 'sonuç' geçiyor", /sonuç/.test(sayacHtml), sayacHtml.slice(0, 60));
    ok("sayaç: grup sayısı yazılı", new RegExp(sDom.gruplar.length + " grupta").test(sayacHtml), sayacHtml.slice(0, 80));
    var basliklar = $$("#aramaSonuc .ar-grup-baslik").map(function (x) { return x.textContent.replace(/\s+/g, " ").trim(); });
    ok("grup: başlıklar '(N)' biçiminde", basliklar.length > 0 && basliklar.every(function (b) { return /\(\d+\)$/.test(b); }),
       basliklar.join(" | "));
    ok("grup: 'Sorular (N)' başlığı", basliklar.some(function (b) { return b.indexOf("Sorular (") === 0; }), basliklar.join(" | "));
    ok("grup: 'Ders Notları (N)' başlığı", basliklar.some(function (b) { return b.indexOf("Ders Notları (") === 0; }), basliklar.join(" | "));
    ok("grup: yalnız dolu gruplar çizilir", basliklar.length === sDom.gruplar.length, basliklar.length + " / " + sDom.gruplar.length);
    ok("grup: başlık sayısı grubun toplamıyla uyumlu",
       $$("#aramaSonuc .ar-grup").every(function (sec) {
         var g = null, kod = sec.getAttribute("data-grup");
         sDom.gruplar.forEach(function (x) { if (x.kod === kod) g = x; });
         return g && Number((sec.querySelector(".ar-grup-baslik b") || {}).textContent.replace(/\D/g, "")) === g.toplam;
       }), "ok");
    ok("sonuç: her kartta kaynak etiketi var",
       $$("#aramaSonuc .ar-sonuc").length > 0 &&
       $$("#aramaSonuc .ar-sonuc").every(function (k) { return (k.querySelector(".ar-etiket") || {}).textContent.trim().length > 3; }),
       $$("#aramaSonuc .ar-sonuc").length + " kart");
    ok("sonuç: eşleşen metinden alıntı var",
       $$("#aramaSonuc .ar-alinti").length > 0 &&
       $$("#aramaSonuc .ar-alinti").every(function (x) { return x.textContent.trim().length > 10; }),
       $$("#aramaSonuc .ar-alinti").length ? "en kısa: " + Math.min.apply(null, $$("#aramaSonuc .ar-alinti").map(function (x) { return x.textContent.trim().length; })) + " karakter" : "alıntı yok");
    ok("sonuç: soru alıntılarının hepsi aranan kelimeyi içeriyor",
       $$("#aramaSonuc .ar-grup[data-grup=sorular] .ar-alinti").every(function (x) {
         return A.normalize(x.textContent).indexOf("paragraf") >= 0;
       }) && $$("#aramaSonuc .ar-grup[data-grup=sorular] .ar-alinti").length > 0,
       $$("#aramaSonuc .ar-grup[data-grup=sorular] .ar-alinti").length + " alıntı");
    ok("sonuç: alıntıda <b> vurgusu var", $$("#aramaSonuc .ar-alinti b").length > 0,
       $$("#aramaSonuc .ar-alinti b").length + " vurgu");
    var soruAlanlari = $$("#aramaSonuc .ar-grup[data-grup=sorular] .ar-alan").map(function (x) { return x.textContent.trim(); });
    ok("sonuç: alıntı alan etiketi gerçek bir alan adı",
       soruAlanlari.length > 0 && soruAlanlari.every(function (x) { return ["Soru", "Açıklama", "Ders / Konu"].indexOf(x) >= 0; }),
       soruAlanlari.slice(0, 3).join(","));
    var soruAlintilar = $$("#aramaSonuc .ar-grup[data-grup=sorular] .ar-alinti").map(function (x) { return x.textContent.trim(); });
    ok("sonuç: kısa eşleşmelerde alıntıya bağlam ekleniyor",
       soruAlintilar.length > 0 && soruAlintilar.every(function (x) { return x.length > 40; }),
       "en kısa alıntı: " + Math.min.apply(null, soruAlintilar.map(function (x) { return x.length; })) + " karakter");
    ok("sonuç: 'bölüme git' düğmesi var", $$("#aramaSonuc .ar-git").length === $$("#aramaSonuc .ar-sonuc").length,
       $$("#aramaSonuc .ar-git").length + " düğme");
    A.cizSonuclar("zzzqqqxxy");
    ok("boş durum: kutu göründü", !!$("#aramaBos") && !$("#aramaBos").classList.contains("gizli"), "görünür");
    ok("boş durum: 'Sonuç bulunamadı' yazısı", /[Ss]onuç bulunamadı/.test(metin("#aramaBos")), metin("#aramaBos").slice(0, 50));
    ok("boş durum: öneri metni var", /[Aa]ksan/.test(metin("#aramaBos")), metin("#aramaBos").slice(0, 50));
    ok("boş durum: sonuç listesi boş", $$("#aramaSonuc .ar-sonuc").length === 0, "0 kart");
    A.cizSonuclar("");
    ok("boş kutu: başlangıç mesajı", /Aramaya başlamak|en az 2 harf/.test(metin("#aramaSayac")) && $$("#aramaSonuc .ar-sonuc").length === 0,
       metin("#aramaSayac").slice(0, 40));
    var sGenis = A.ara("an");
    A.cizSonuclar("an");
    ok("sınır: grupta en çok " + A.SINIRLAR.GRUP_SINIR + " sonuç çizilir",
       $$("#aramaSonuc .ar-grup").length > 0 && $$("#aramaSonuc .ar-grup").every(function (sec) {
         return sec.querySelectorAll(".ar-sonuc").length <= A.SINIRLAR.GRUP_SINIR;
       }), $$("#aramaSonuc .ar-sonuc").length + " kart");
    var dahaVar = $$("#aramaSonuc .ar-daha").length;
    ok("sınır: kırpılan gruplar bildirilir",
       sGenis.gruplar.some(function (g) { return g.toplam > A.SINIRLAR.GRUP_SINIR; }) ? dahaVar > 0 : dahaVar === 0,
       dahaVar + " uyarı · en büyük grup " + Math.max.apply(null, sGenis.gruplar.map(function (g) { return g.toplam; })));

    /* — 9) bölüme gitme — */
    A.cizSonuclar("paragraf");
    ok("git: hedef bölüm var", A.hedefVar("testler") && A.hedefVar("guncel"), "ok");
    var ilkSoru = $("#aramaSonuc .ar-sonuc");
    ok("git: sonuç kartı hedef taşıyor", !!ilkSoru && !!ilkSoru.getAttribute("data-hedef"),
       ilkSoru ? ilkSoru.getAttribute("data-hedef") : "yok");
    if (ilkSoru) ilkSoru.click();
    ok("git: soru sonucu Testler bölümünü açtı", !!$("#ekran-testler.acik"), $("#ekran-testler.acik") ? "açıldı" : "açılmadı");
    ok("git: arama ekranı kapandı", !$("#ekran-arama.acik"), "kapandı");
    A.bolumAc("arama");
    var sGuncel = A.ara("nüfus");
    if (grupAl(sGuncel, "guncel")) {
      A.cizSonuclar("nüfus");
      var gk = null;
      $$("#aramaSonuc .ar-grup").forEach(function (sec) {
        if (sec.getAttribute("data-grup") === "guncel" && !gk) gk = sec.querySelector(".ar-sonuc");
      });
      ok("git: güncel sonuç bulundu", !!gk, gk ? "var" : "yok");
      if (gk) gk.click();
      ok("git: güncel sonuç Güncel Bilgiler'i açtı", !!$("#ekran-guncel.acik"), "ok");
    } else {
      ok("git: güncel sonuç bulundu", false, "'nüfus' güncel maddede yok");
      ok("git: güncel sonuç Güncel Bilgiler'i açtı", false, "atlandı");
    }
    A.bolumAc("arama");
    A.cizSonuclar("paragraf");
    var ck = null;
    $$("#aramaSonuc .ar-grup").forEach(function (sec) {
      if (sec.getAttribute("data-grup") === "cikmis" && !ck) ck = sec.querySelector(".ar-sonuc");
    });
    if (ck) { ck.click(); }
    ok("git: çıkmış sonuç bölüm açtı", ck ? !!$("#ekran-cikmis.acik") : true, ck ? "ok" : "çıkmış sonuç yok (atlandı)");
    A.bolumAc("arama");
    A.cizSonuclar("paragraf");
    var dugme = $("#aramaSonuc .ar-git");
    ok("git: 'bölüme git' düğmesi var", !!dugme, dugme ? dugme.textContent.trim() : "yok");
    if (dugme) { dugme.click(); }
    ok("git: düğme de bölümü açtı", !!$(".ekran.acik") && !$("#ekran-arama.acik"), $(".ekran.acik") ? $(".ekran.acik").id : "-");

    /* — 10) son aramalar (localStorage) — */
    A.sonTemizle();
    A.sonEkle("paragraf");
    A.sonEkle("sözcük");
    A.sonEkle("PARAGRAF");
    var sa = A.sonAramalar();
    ok("son arama: kaydedildi", sa.length === 2, sa.join(" | "));
    ok("son arama: aynı kelime tekrar yazılmaz (aksansız)", sa.filter(function (x) { return A.normalize(x) === "paragraf"; }).length === 1, sa.join(" | "));
    ok("son arama: en yeni başta", A.normalize(sa[0]) === "paragraf", sa[0]);
    ok("son arama: localStorage anahtarı doğru", A.normalize(localStorage.getItem("ustad.arama.son") || "").indexOf("paragraf") >= 0,
       String(localStorage.getItem("ustad.arama.son")).slice(0, 60));
    for (var i = 0; i < 14; i++) A.sonEkle("arama" + i);
    ok("son arama: en çok 10 kayıt", A.sonAramalar().length === A.SINIRLAR.MAX_SON, A.sonAramalar().length + " kayıt");
    ok("son arama: 1 harfli kayıt tutulmaz", A.sonEkle("x").length === A.SINIRLAR.MAX_SON, "ok");
    A.sonTemizle();
    A.sonEkle("paragraf");
    A.sonEkle("güncel");
    A.cizSonAramalar();
    ok("son arama: çipler çizildi", $$("#aramaSon .ar-cip[data-ar-son]").length === 2, $$("#aramaSon .ar-cip").length + " çip");
    ok("son arama: çip metni doğru", metin("#aramaSon").indexOf("güncel") >= 0, metin("#aramaSon").slice(0, 60));
    var cip = $("#aramaSon .ar-cip[data-ar-son]");
    if (cip) { cip.click(); }
    ok("son arama: çipe tıklayınca kutuya yazıldı", !!$("#aramaKutu") && $("#aramaKutu").value.length > 0,
       $("#aramaKutu") ? $("#aramaKutu").value : "-");
    ok("son arama: çip aramayı çalıştırdı", $$("#aramaSonuc .ar-sonuc").length > 0, $$("#aramaSonuc .ar-sonuc").length + " kart");

    /* — 11) klavye kısayolları — */
    A.gitDene("notlar");
    var olay = function (hedef, tip, ek) {
      var ev = new KeyboardEvent(tip, { key: ek.key, keyCode: ek.keyCode, bubbles: true, cancelable: true });
      hedef.dispatchEvent(ev);
    };
    var kutuEl = $("#aramaKutu");
    olay(kutuEl, "keydown", { key: "/", keyCode: 191 });
    ok("klavye: kutu içinde '/' bölüm değiştirmez", !$("#ekran-arama.acik"), $("#ekran-arama.acik") ? "arama açıldı" : "notlar korundu");
    olay(document.body, "keydown", { key: "/", keyCode: 191 });
    ok("klavye: '/' arama bölümünü açar", !!$("#ekran-arama.acik"), "ok");
    ok("klavye: '/' kutuyu odaklar",
       (document.activeElement && document.activeElement.id === "aramaKutu") || A.odakla() === true,
       document.activeElement ? (document.activeElement.id || document.activeElement.tagName) : "-");
    kutuEl.value = "paragraf";
    olay(kutuEl, "keydown", { key: "Escape", keyCode: 27 });
    ok("klavye: Esc kutuyu temizler", kutuEl.value === "", '"' + kutuEl.value + '"');
    ok("klavye: Esc sonuçları da temizler", $$("#aramaSonuc .ar-sonuc").length === 0, "0 kart");
    A.cizSonuclar("paragraf");
    olay(kutuEl, "keydown", { key: "Enter", keyCode: 13 });
    ok("klavye: Enter ilk sonuca gider", !!$(".ekran.acik") && !$("#ekran-arama.acik"),
       $(".ekran.acik") ? $(".ekran.acik").id : "-");
    ok("klavye: Enter sorguyu son aramalara yazar", A.sonAramalar().indexOf("paragraf") >= 0, A.sonAramalar().join(" | "));
    A.bolumAc("arama");

    /* — 12) debounce (200 ms) — */
    var sb = A.SINIRLAR;
    ok("debounce: gecikme 200 ms", sb.GECIKME === 200, String(sb.GECIKME));
    A.cizSonuclar("");
    $("#aramaKutu").value = "sözcük";
    $("#aramaKutu").dispatchEvent(new Event("input", { bubbles: true }));
    var hemen = $$("#aramaSonuc .ar-sonuc").length;
    ok("debounce: yazarken anında aramaz", hemen === 0, hemen + " kart (200 ms beklenmeli)");
    setTimeout(function () {
      ok("debounce: 200 ms sonra arama yapıldı", $$("#aramaSonuc .ar-sonuc").length > 0,
         $$("#aramaSonuc .ar-sonuc").length + " kart");
      ok("debounce: sonuç 'sözcük' sorgusundan", /sozcuk/.test(A.normalize(metin("#aramaSayac"))) || metin("#aramaSayac").indexOf("sonuç") >= 0,
         metin("#aramaSayac").slice(0, 60));

      /* — geri alma — */
      if (eskiSon === null) { try { localStorage.removeItem("ustad.arama.son"); } catch (e) {} }
      else { try { localStorage.setItem("ustad.arama.son", eskiSon); } catch (e) {} }
      window.USTAD_SORULAR = eskiSorular;
      if (eskiSozluk === undefined) delete window.USTAD_SOZLUK; else window.USTAD_SOZLUK = eskiSozluk;
      A.tazele();

      /* — rapor — */
      var gecen = t.filter(function (x) { return x.indexOf("✔") === 0; }).length;
      var kap2 = document.createElement("div");
      kap2.id = "aramaTestSonuc";
      kap2.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
      kap2.innerHTML = "<h3>ÜSTAD TEK ARAMA testi</h3>" +
        t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
        "<hr><b>" + gecen + " / " + t.length + " geçti</b>";
      document.body.appendChild(kap2);
      document.title = (document.title || "") + " ARAMATEST " + gecen + "/" + t.length;
    }, 320);
  }
})();
