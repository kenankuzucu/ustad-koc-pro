/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Terim Sözlüğü bölümü · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Terim sözlüğü ekranı: ara (Türkçe aksan/küçük-büyük harf duyarsız), ders filtresi, A-Z harf şeridi,
   açılır kart (tam tanım + örnek cümle + 🔊 dinle), ⭐ favori, sayfalama (50 kart + daha fazla göster).
   Veri kaynağı: window.USTAD_SOZLUK (madde: { terim, anlam, ders, konu, ornek }).
   Veri yoksa çökmez: "Sözlük verisi yüklenmemiş" boş durumu çizilir.
   Favoriler cihazda localStorage "ustad.sozluk.fav" içinde tutulur. Ağ erişimi YOKTUR.
   Bölüm rengi: var(--sozluk) / var(--sozluk2) (#7c3aed mor). */
(function () {
  "use strict";

  var A = window.SOZLUK = window.SOZLUK || {};

  var DEPO_FAV = "ustad.sozluk.fav";   // favori terim anahtarları (JSON dizi)
  var SAYFA = 50;                      // sayfa başına kart
  var DERSLER = ["Türkçe", "Matematik", "Tarih", "Coğrafya", "Vatandaşlık", "Güncel Bilgiler"];
  /* Türk alfabesi (29 harf) — şeritte sırayla gösterilir */
  var HARFLER = ["A", "B", "C", "Ç", "D", "E", "F", "G", "Ğ", "H", "I", "İ", "J", "K", "L", "M",
                 "N", "O", "Ö", "P", "R", "S", "Ş", "T", "U", "Ü", "V", "Y", "Z"];

  /* ekran durumu */
  var DURUM = { arama: "", ders: "", harf: "", fav: false, gosterilen: SAYFA };
  var LISTE = [];   // son çizilen (süzülmüş) madde listesi — kartların data-i indeksi buraya bakar

  /* ───────────── yardımcılar ───────────── */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  /* en yakın ata (matches destekli olmayan WebView için yedekli) */
  function yakin(el, sel) {
    while (el && el.nodeType === 1) {
      var m = el.matches || el.msMatchesSelector || el.webkitMatchesSelector;
      if (m && m.call(el, sel)) return el;
      el = el.parentNode;
    }
    return null;
  }

  /* Türkçe normalleştirme: İ/I/ı → i, ş→s, ğ→g, ü→u, ö→o, ç→c (+ aksanlı uzun ünlüler).
     Böylece "TÜRKÇE" ile "turkce", "Ölçek" ile "olcek" eşleşir. */
  var TUR_MAP = {
    "ı": "i", "İ": "i", "I": "i", "i": "i",
    "ş": "s", "Ş": "s", "ğ": "g", "Ğ": "g", "ü": "u", "Ü": "u",
    "ö": "o", "Ö": "o", "ç": "c", "Ç": "c",
    "â": "a", "Â": "a", "î": "i", "Î": "i", "û": "u", "Û": "u"
  };
  function norm(s) {
    var t = String(s == null ? "" : s), out = "";
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i);
      out += (TUR_MAP[c] !== undefined ? TUR_MAP[c] : c.toLowerCase());
    }
    return out;
  }

  /* ───────────── veri ───────────── */
  function maddeler() {
    var v = window.USTAD_SOZLUK;
    if (!Array.isArray(v)) return [];
    return v.filter(function (m) { return m && typeof m === "object" && (m.terim || m.anlam); });
  }

  /* ───────────── favori deposu (ustad.sozluk.fav) ───────────── */
  function favAnahtar(m) {
    var k = norm(m && m.terim).trim();
    if (!k) k = norm(m && m.anlam).slice(0, 48).trim();
    return k;
  }
  function favOku() {
    try {
      var s = localStorage.getItem(DEPO_FAV);
      if (!s) return [];
      var o = JSON.parse(s);
      if (!Array.isArray(o)) return [];
      return o.filter(function (x) { return typeof x === "string"; });
    } catch (e) { return []; }
  }
  function favYaz(dizi) {
    try { localStorage.setItem(DEPO_FAV, JSON.stringify(dizi)); } catch (e) {}
  }
  function favVar(m) { return favOku().indexOf(favAnahtar(m)) >= 0; }

  /* ───────────── ekran kabı ─────────────
     TEK KONTEYNER KURALI: sayfada aynı anda tek #ekran-sozluk ve tek #sozlukAlan bulunur.
     Mevcut kap her zaman YENİDEN KULLANILIR (ikinci kabuk üretilmez); klonlama/HTML kopyalama
     ile oluşmuş fazlalıklar burada temizlenir. Böylece tıklama dinleyicisi her zaman ekranda
     görünen kaba bağlanır. */
  function kap() {
    var kabuklar = document.querySelectorAll("#ekran-sozluk");
    var s = kabuklar.length ? kabuklar[0] : null;
    for (var i = 1; i < kabuklar.length; i++) {
      if (kabuklar[i].parentNode) kabuklar[i].parentNode.removeChild(kabuklar[i]);
    }
    if (!s) {
      if (!document.body) return null;
      s = document.createElement("section");
      s.id = "ekran-sozluk";
      s.className = "ekran";
      s.setAttribute("data-bolum", "sozluk");
      s.setAttribute("data-sz-otomatik", "1");
      s.innerHTML = '<h2 class="sayfa-baslik">📖 Terim Sözlüğü</h2><div class="kart" id="sozlukAlan"></div>';
      document.body.appendChild(s);
    }
    var alanlar = s.querySelectorAll("#sozlukAlan");
    for (var j = 1; j < alanlar.length; j++) {
      if (alanlar[j].parentNode) alanlar[j].parentNode.removeChild(alanlar[j]);
    }
    if (!s.querySelector("#sozlukAlan")) {
      var alan = document.createElement("div");
      alan.id = "sozlukAlan";
      s.appendChild(alan);
    }
    return s;
  }

  /* ───────────── iskelet + listeler ───────────── */
  function iskeletHTML(n) {
    return '' +
      '<div class="sz-kok" id="sozlukIc">' +
        '<div class="sz-ust">' +
          '<div class="sz-ust-sol">' +
            '<b>📖 Terim Sözlüğü</b>' +
            '<span>Terimi ara, tanımı oku, örnek cümleyi gör, istersen sesli dinle.</span>' +
          '</div>' +
          '<span class="sz-rozet" id="szRozet">' + n + ' terim</span>' +
        '</div>' +
        '<div class="sz-arama">' +
          '<span class="sz-arama-simg">🔍</span>' +
          '<input id="szArama" class="sz-girdi" type="text" autocomplete="off" autocapitalize="off" ' +
            'spellcheck="false" placeholder="Terim veya anlam ara (örn. ölçek, kuşku)…">' +
          '<button class="sz-temizle" type="button" id="szTemizle" title="Aramayı temizle">✕</button>' +
          '<label class="sz-fav-kutu"><input type="checkbox" id="szFavSuz"><span>⭐ Favoriler</span></label>' +
        '</div>' +
        '<div class="sz-cip-serit" id="szDersler"></div>' +
        '<div class="sz-harf-serit" id="szHarfler"></div>' +
        '<p class="sz-sayac" id="szSayac"></p>' +
        '<div class="sz-liste" id="szListe"></div>' +
        '<div class="sz-daha" id="szDaha"></div>' +
      '</div>';
  }

  function cipHTML(deger, ad, secili, sayi, ekSinif, ekAttr) {
    return '<button class="sz-cip' + (ekSinif || "") + (secili ? " secili" : "") + (sayi === 0 ? " bos" : "") + '" ' +
      'type="button" ' + (ekAttr || 'data-ders-sec') + '="' + kacis(deger) + '">' +
      '<span>' + kacis(ad) + '</span><i>' + sayi + '</i></button>';
  }

  /* süzgeç: arama (terim+anlam) ∧ ders ∧ harf ∧ favori. harfYokSay=true → harf süzgeci uygulanmaz. */
  function filtrele(md, harfYokSay) {
    var q = norm(DURUM.arama).trim();
    var hq = norm(DURUM.harf).trim();
    var favK = DURUM.fav ? favOku() : null;
    return md.filter(function (m) {
      if (DURUM.ders && m.ders !== DURUM.ders) return false;
      if (DURUM.fav && favK.indexOf(favAnahtar(m)) < 0) return false;
      if (!harfYokSay && hq && norm(m.terim).charAt(0) !== hq.charAt(0)) return false;
      if (q) {
        var havuz = norm(m.terim) + " " + norm(m.anlam);
        if (havuz.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function kartHTML(m, i) {
    var f = favVar(m);
    return '<article class="sz-kart" data-i="' + i + '">' +
      '<div class="sz-kart-ust">' +
        '<b class="sz-terim">' + kacis(m.terim || "(terimsiz)") + '</b>' +
        (m.ders ? '<span class="sz-etiket" data-ders="' + kacis(m.ders) + '">' + kacis(m.ders) + '</span>' : '') +
        '<button class="sz-fav' + (f ? " dolu" : "") + '" type="button" data-fav="' + i + '" ' +
          'title="Favorilere ekle / çıkar" aria-label="Favori">' + (f ? "★" : "☆") + '</button>' +
      '</div>' +
      (m.konu ? '<span class="sz-konu">' + kacis(m.konu) + '</span>' : '') +
      '<p class="sz-anlam">' + kacis(m.anlam) + '</p>' +
      '<div class="sz-detay">' +
        '<p class="sz-tam">' + kacis(m.anlam) + '</p>' +
        (m.ornek ? '<p class="sz-ornek">“' + kacis(m.ornek) + '”</p>' : '') +
        '<button class="sz-dinle" type="button" data-dinle="' + i + '">🔊 Dinle</button>' +
      '</div>' +
    '</article>';
  }

  function bosSonucHTML() {
    if (DURUM.fav && !DURUM.arama && !DURUM.ders && !DURUM.harf) {
      return '<div class="sz-bos" id="szBosSonuc"><b>Henüz favori terim yok</b>' +
        '<span>Bir kartın sağ üstündeki ☆ simgesine dokun; terim buraya eklenir.</span></div>';
    }
    return '<div class="sz-bos" id="szBosSonuc"><b>Sonuç bulunamadı</b>' +
      '<span>Aramanı değiştir ya da ders/harf süzgecini temizle.</span></div>';
  }

  function bosVeriHTML() {
    return '<div class="sz-bos" id="szBosVeri"><b>Sözlük verisi yüklenmemiş</b>' +
      '<span>Terim listesi (window.USTAD_SOZLUK) henüz yüklenmedi. ' +
      'Veri eklendiğinde bu ekran kendiliğinden dolacak.</span></div>';
  }

  /* ───────────── çizim ───────────── */
  function cipleriCiz() {
    var md = maddeler();
    var dk = document.getElementById("szDersler");
    var hk = document.getElementById("szHarfler");

    if (dk) {
      var dsay = {};
      DERSLER.forEach(function (d) { dsay[d] = 0; });   /* sayaç anahtarları önce açılmalı */
      md.forEach(function (m) { if (dsay[m.ders] !== undefined) dsay[m.ders]++; });
      var h = '<span class="sz-cip-baslik">Ders</span>' +
        cipHTML("", "Tümü", DURUM.ders === "", md.length) +
        DERSLER.map(function (d) {
          return cipHTML(d, d, DURUM.ders === d, dsay[d] || 0);
        }).join("");
      dk.innerHTML = h;
    }

    if (hk) {
      /* harf sayıları: harf süzgeci HARİÇ diğer süzgeçlerle sayılır */
      var temel = filtrele(md, true);
      var hsay = {};
      temel.forEach(function (m) {
        var ilk = norm(m.terim).charAt(0).toUpperCase();
        hsay[ilk] = (hsay[ilk] || 0) + 1;
      });
      var hh = '<span class="sz-cip-baslik">Harf</span>' +
        cipHTML("", "Tümü", DURUM.harf === "", temel.length, " sz-harf-tumu", "data-harf-sec") +
        HARFLER.map(function (h2) {
          var anahtar = norm(h2);
          var adet = 0;
          Object.keys(hsay).forEach(function (k) { if (norm(k) === anahtar) adet += hsay[k]; });
          return cipHTML(h2, h2, DURUM.harf === h2, adet, " sz-harf", "data-harf-sec");
        }).join("");
      hk.innerHTML = hh;
    }
  }

  function listeyiCiz() {
    var md = maddeler();
    var suz = filtrele(md, false);
    LISTE = suz;

    var liste = document.getElementById("szListe");
    if (liste) {
      var gos = suz.slice(0, DURUM.gosterilen);
      liste.innerHTML = gos.length ? gos.map(kartHTML).join("") : bosSonucHTML();
    }

    var say = document.getElementById("szSayac");
    if (say) say.textContent = md.length + " terimden " + suz.length + " sonuç";

    var d = document.getElementById("szDaha");
    if (d) {
      var gosterilen = Math.min(DURUM.gosterilen, suz.length);
      var kalan = suz.length - gosterilen;
      d.innerHTML = kalan > 0
        ? '<button class="sz-daha-dugme" type="button" id="szDahaGoster">⬇ Daha fazla göster (' + kalan + ' terim daha)</button>'
        : "";
    }
  }

  function ciz() {
    var s = kap();
    if (!s) return;
    var alan = s.querySelector("#sozlukAlan");   /* tek konteyner: alan kabın içinden alınır */
    if (!alan) return;
    bagla(alan);

    var md = maddeler();
    if (!md.length) {
      alan.innerHTML = bosVeriHTML();
      LISTE = [];
      return;
    }
    if (!alan.querySelector("#szListe")) {
      alan.innerHTML = iskeletHTML(md.length);
      var girdi = document.getElementById("szArama");
      if (girdi) girdi.value = DURUM.arama;
      var fc = document.getElementById("szFavSuz");
      if (fc) fc.checked = !!DURUM.fav;
    }
    cipleriCiz();
    listeyiCiz();
  }

  /* ───────────── favori işlemleri ───────────── */
  function favoriCevir(i) {
    var m = LISTE[i];
    if (!m) return null;
    var k = favAnahtar(m);
    var f = favOku();
    var vardi = f.indexOf(k) >= 0;
    f = vardi ? f.filter(function (x) { return x !== k; }) : f.concat([k]);
    favYaz(f);

    var btn = $('#sozlukAlan .sz-fav[data-fav="' + i + '"]');
    if (btn) {
      btn.textContent = vardi ? "☆" : "★";
      if (vardi) btn.classList.remove("dolu"); else btn.classList.add("dolu");
    }
    /* favori süzgeci açıksa liste ve sayaç değişir */
    if (DURUM.fav) listeyiCiz();
    var roz = document.getElementById("szRozet");
    if (roz) roz.textContent = maddeler().length + " terim";
    return !vardi;
  }

  /* ───────────── sesli okuma ───────────── */
  function dinle(m) {
    if (!m) return "";
    var metin = (m.terim || "") + ". " + (m.anlam || "") + (m.ornek ? " Örnek: " + m.ornek : "");
    try {
      if (window.KPSS_SES && typeof window.KPSS_SES.konus === "function") window.KPSS_SES.konus(metin);
    } catch (e) {}
    return metin;
  }

  /* ───────────── olaylar (delege) ─────────────
     Bağlama kapısı ELEMAN KİMLİĞİ ile tutulur (BAGLI_EL): DOM kopyalanırken (outerHTML/innerHTML)
     data-sz-bagli niteliği kopyaya da geçebiliyor; niteliğe güvenmek dinleyicisiz eleman bırakır. */
  var BAGLI_EL = null;
  function bagla(alan) {
    if (BAGLI_EL === alan) return;
    BAGLI_EL = alan;
    alan.setAttribute("data-sz-bagli", "1");

    alan.addEventListener("click", function (e) {
      var t = e.target;

      var fv = yakin(t, ".sz-fav");
      if (fv) { e.stopPropagation(); favoriCevir(parseInt(fv.getAttribute("data-fav"), 10)); return; }

      var dn = yakin(t, ".sz-dinle");
      if (dn) { e.stopPropagation(); dinle(LISTE[parseInt(dn.getAttribute("data-dinle"), 10)]); return; }

      var dp = yakin(t, "[data-ders-sec]");
      if (dp) {
        var yeni = dp.getAttribute("data-ders-sec") || "";
        DURUM.ders = (DURUM.ders === yeni) ? "" : yeni;   /* aynı çipe tekrar basmak filtreyi kaldırır */
        DURUM.gosterilen = SAYFA;
        cipleriCiz(); listeyiCiz();
        return;
      }

      var hf = yakin(t, "[data-harf-sec]");
      if (hf) {
        var yh = hf.getAttribute("data-harf-sec") || "";
        DURUM.harf = (DURUM.harf === yh) ? "" : yh;
        DURUM.gosterilen = SAYFA;
        cipleriCiz(); listeyiCiz();
        return;
      }

      if (yakin(t, "#szTemizle")) {
        DURUM.arama = "";
        var g = document.getElementById("szArama");
        if (g) g.value = "";
        DURUM.gosterilen = SAYFA;
        listeyiCiz();
        return;
      }

      if (yakin(t, "#szDahaGoster")) {
        DURUM.gosterilen += SAYFA;
        listeyiCiz();
        return;
      }

      var kt = yakin(t, ".sz-kart");
      if (kt) { kt.classList.toggle("acik"); return; }
    });

    alan.addEventListener("input", function (e) {
      if (e.target && e.target.id === "szArama") {
        DURUM.arama = e.target.value;
        DURUM.gosterilen = SAYFA;
        listeyiCiz();
      }
    });

    alan.addEventListener("change", function (e) {
      if (e.target && e.target.id === "szFavSuz") {
        DURUM.fav = !!e.target.checked;
        DURUM.gosterilen = SAYFA;
        cipleriCiz(); listeyiCiz();
      }
    });
  }

  /* ───────────── motor sözleşmesi ───────────── */
  A.bolumAc = function (kod) { if (kod === "sozluk") ciz(); };

  /* dışa açık yardımcılar (testler ve diğer modüller için) */
  A.ciz = ciz;
  A.maddeler = maddeler;
  A.filtrele = function () { return filtrele(maddeler(), false); };
  A.liste = function () { return LISTE.slice(); };
  A.durum = function () {
    return { arama: DURUM.arama, ders: DURUM.ders, harf: DURUM.harf, fav: DURUM.fav, gosterilen: DURUM.gosterilen };
  };
  A.norm = norm;
  A.favoriAnahtar = favAnahtar;
  A.favoriler = favOku;
  A.dinle = dinle;
  A.sayfaBoyu = SAYFA;                                    /* sayfalama kuralı: sayfa başına kart */
  A.dersler = function () { return DERSLER.slice(); };     /* ders çipi listesi (sabit değil, modülden) */
  A.harfler = function () { return HARFLER.slice(); };     /* harf şeridi listesi */

  /* ═════════════ kendi kendini test (?test=1) ═════════════
     Ölçüm gerçek çalıştırmadır ve SAYFADAKİ GERÇEK VERİYLE (window.USTAD_SOZLUK) yapılır.
       1) Gerçek veri SAHTE VERİYLE DEĞİŞTİRİLMEZ. Boş/bozuk veri senaryolarında veri yedeklenir ve
          AYNI adımda geri konur; ölçüm bittiğinde window.USTAD_SOZLUK ilk hâlindedir (aynı referans).
       2) Beklenen sayılar SABİT YAZILMAZ; gerçek veriden ve modülün kendi kuralından türetilir:
          TOPLAM = gerçek madde sayısı, kart beklentisi = Math.min(A.sayfaBoyu, sonuç sayısı).
       3) TEK KONTEYNER garantisi ölçülür: sayfada tek #ekran-sozluk / #sozlukAlan / #szDersler /
          #szListe / #szHarfler bulunur; ciz() yeni kabuk üretmez.
     Sonuçlar #sozlukTestSonuc içine "✔ ..." / "✘ ..." satırları olarak yazılır. */
  function sozlukTesti(deneme) {
    var gercek = window.USTAD_SOZLUK;
    if (!(Array.isArray(gercek) && gercek.length > 0) && (deneme || 0) < 8) {
      /* gerçek veri şu an yerinde değil (başka bölümün testi kısa süreliğine kaldırmış olabilir):
         sahte veriyle ölçmek yerine kısa bekleyip yeniden dene — test SAHTE VERİ kullanmaz. */
      setTimeout(function () { sozlukTesti((deneme || 0) + 1); }, 250);
      return;
    }

    var t = [];
    function ok(ad, gecti, ayrinti) {
      t.push((gecti ? "✔ " : "✘ ") + ad + (ayrinti === undefined || ayrinti === null ? "" : " — " + ayrinti));
    }
    function kartlar() { return $$("#sozlukAlan .sz-kart"); }
    function metin(sel) { var e = $(sel); return e ? String(e.textContent).trim() : ""; }
    function gorunur(sel) { var e = $(sel); return e ? getComputedStyle(e).display : "yok"; }
    function kisalt(s, n) { return String(s == null ? "" : s).slice(0, n || 42); }
    function sayim(dizi, f) { return dizi.filter(f).length; }
    function terimler(dizi) { return dizi.map(function (m) { return m.terim; }).join(", "); }

    /* gerçek veriden türetilen beklentiler */
    var md = A.maddeler();
    var TOPLAM = md.length;
    var SAYFA = A.sayfaBoyu;
    var DERSLER = A.dersler();
    var HARFLER = A.harfler();
    function kartBek(n) { return Math.min(SAYFA, n); }
    function dersSay(d) { return sayim(md, function (m) { return m.ders === d; }); }
    function harfSay(h) { var a = norm(h); return sayim(md, function (m) { return norm(m.terim).charAt(0) === a; }); }

    ok("modül: window.SOZLUK globali tanımlı", !!window.SOZLUK && typeof window.SOZLUK === "object", typeof window.SOZLUK);
    ok("sözleşme: SOZLUK.bolumAc fonksiyon", typeof A.bolumAc === "function");
    ok("sözleşme: SOZLUK.ciz fonksiyon", typeof A.ciz === "function");
    ok("veri: GERÇEK sözlük verisi ölçülüyor (sahte veri kullanılmıyor)", Array.isArray(gercek) && TOPLAM > 0,
       "USTAD_SOZLUK " + (Array.isArray(gercek) ? gercek.length + " kayıt" : typeof gercek) + " · geçerli madde " + TOPLAM);

    /* favori deposu test boyunca boş tutulur, sonda eski hâline döner */
    var eskiFav = null, eskiKonus = window.KPSS_SES ? window.KPSS_SES.konus : null, sesVar = !!window.KPSS_SES;
    try { eskiFav = localStorage.getItem(DEPO_FAV); } catch (e) {}
    try { localStorage.removeItem(DEPO_FAV); } catch (e) {}

    /* ── 1) TEK KONTEYNER garantisi ── */
    A.bolumAc("sozluk");   /* gerçek veriyle çizim */
    ok("kap: sayfada tek #ekran-sozluk", $$("#ekran-sozluk").length === 1, $$("#ekran-sozluk").length + " kabuk");
    ok("kap: tek #sozlukAlan ve tek #szDersler / #szListe / #szHarfler",
       $$("#sozlukAlan").length === 1 && $$("#szDersler").length === 1 && $$("#szListe").length === 1 && $$("#szHarfler").length === 1,
       "alan " + $$("#sozlukAlan").length + " / ders " + $$("#szDersler").length + " / liste " + $$("#szListe").length + " / harf " + $$("#szHarfler").length);
    var kabA = document.getElementById("ekran-sozluk");
    A.ciz(); A.ciz();
    ok("kap: ciz() mevcut kabı kullanıyor, ikinci kabuk oluşturmuyor",
       document.getElementById("ekran-sozluk") === kabA && $$("#ekran-sozluk").length === 1,
       $$("#ekran-sozluk").length + " kabuk · aynı kap: " + (document.getElementById("ekran-sozluk") === kabA));
    var kopya = kabA.cloneNode(true);
    document.body.appendChild(kopya);
    var kopyaOncesi = $$("#ekran-sozluk").length;
    A.ciz();
    ok("kap: kopya kabuk enjekte edilince fazlalık temizlendi (tek konteyner kuralı)",
       kopyaOncesi > 1 && $$("#ekran-sozluk").length === 1 && $$("#sozlukAlan").length === 1 && $$("#szListe").length === 1,
       "enjekte sonrası " + kopyaOncesi + " → çizim sonrası " + $$("#ekran-sozluk").length);
    var kabB = document.getElementById("ekran-sozluk");
    if (kabB && kabB.parentNode) kabB.parentNode.removeChild(kabB);
    A.bolumAc("sozluk");
    var yeniKab = document.getElementById("ekran-sozluk");
    ok("kap: ekran yokken KENDİNİ oluşturdu", !!yeniKab && $$("#ekran-sozluk").length === 1, yeniKab ? yeniKab.id : "yok");
    ok("kap: .ekran sınıfı ve data-bolum=\"sozluk\"",
       !!yeniKab && /(^|\s)ekran(\s|$)/.test(yeniKab.className) && yeniKab.getAttribute("data-bolum") === "sozluk",
       yeniKab ? yeniKab.className + " / " + yeniKab.getAttribute("data-bolum") : "yok");
    ok("kap: içinde tek #sozlukAlan var ve bölüm çizildi",
       !!document.getElementById("sozlukAlan") && !!document.getElementById("szListe") && $$("#szListe").length === 1);
    /* kap elemanı kopyalanırsa (dinleyici kopyaya geçmez) tıklama yeniden bağlanmalı */
    var alanEl = document.getElementById("sozlukAlan");
    var klon = alanEl.cloneNode(true);
    alanEl.parentNode.replaceChild(klon, alanEl);
    A.ciz();
    var kv = document.querySelector("#sozlukAlan .sz-kart");
    if (kv) kv.click();
    ok("kap: alan kopyalanıp değişse de tıklama çalışıyor (dinleyici yeniden bağlandı)",
       !!kv && kv.classList.contains("acik"), kv ? kv.className : "kart yok");
    if (kv && kv.classList.contains("acik")) kv.click();

    /* ── 2) gerçek veri + ilk çizim / sayfalama ── */
    if ($("#szTemizle")) $("#szTemizle").click();   /* süzgeç ve sayfalamayı başlangıca al */
    ok("veri: modül gerçek veriyi olduğu gibi okuyor (kopya/sahte veri yok)",
       A.maddeler().length === TOPLAM && window.USTAD_SOZLUK === gercek,
       A.maddeler().length + " madde · aynı referans: " + (window.USTAD_SOZLUK === gercek));
    ok("arayüz: arama kutusu, süzgeç çipleri ve harf şeridi çizildi",
       !!$("#szArama") && !!$("#szDersler") && !!$("#szHarfler") && !!$("#szSayac"), "temel arayüz hazır");
    ok("sayfa: ilk çizimde " + kartBek(TOPLAM) + " kart (Math.min(sayfaBoyu=" + SAYFA + ", sonuç=" + TOPLAM + "))",
       kartlar().length === kartBek(TOPLAM), kartlar().length + " kart");
    var kalanBek = Math.max(0, TOPLAM - SAYFA);
    ok("sayfa: \"daha fazla göster\" düğmesi kalan " + kalanBek + " terimi yazıyor",
       kalanBek > 0 ? (!!$("#szDahaGoster") && metin("#szDahaGoster").indexOf(kalanBek + " terim daha") >= 0) : !$("#szDahaGoster"),
       metin("#szDahaGoster") || "düğme yok (tümü görünür)");
    ok("sayaç: \"" + TOPLAM + " terimden " + TOPLAM + " sonuç\"",
       metin("#szSayac") === TOPLAM + " terimden " + TOPLAM + " sonuç", metin("#szSayac"));
    var tik = 0, sinir = Math.ceil(TOPLAM / SAYFA) + 2;
    while (document.getElementById("szDahaGoster") && tik < sinir) { document.getElementById("szDahaGoster").click(); tik++; }
    ok("sayfalama: \"daha fazla göster\" tüm sonuçları açtı (" + tik + " tıklama)",
       kartlar().length === TOPLAM, kartlar().length + " kart / beklenen " + TOPLAM);
    ok("sayfalama: tümü gösterilince düğme kayboldu", !$("#szDahaGoster"), metin("#szDaha"));
    ok("sayaç: kart sayısı süzülmüş sonuç sayısına eşit",
       kartlar().length === A.liste().length, kartlar().length + " kart / " + A.liste().length + " sonuç");

    /* ── 3) kart yapısı ── */
    var ilkKart = kartlar()[0];
    var ilkTerim = ilkKart ? ilkKart.querySelector(".sz-terim") : null;
    var stTerim = ilkTerim ? getComputedStyle(ilkTerim) : null;
    ok("kart: terim kalın yazılıyor (font-weight 700)", !!stTerim && String(stTerim.fontWeight) === "700", stTerim ? stTerim.fontWeight : "yok");
    ok("kart: terim monospace yazı tipinde",
       !!stTerim && String(stTerim.fontFamily).toLowerCase().indexOf("monospace") >= 0, stTerim ? kisalt(stTerim.fontFamily, 46) : "yok");
    var etiketli = sayim(kartlar(), function (k) { return !!k.querySelector(".sz-etiket"); });
    var etiketBek = sayim(A.liste(), function (m) { return !!m.ders; });
    ok("kart: ders etiketi kartın dersini doğru yazıyor (" + etiketli + " etiket / " + etiketBek + " dersli madde)",
       etiketli === etiketBek && kartlar().every(function (k) {
         var m = A.liste()[parseInt(k.getAttribute("data-i"), 10)];
         var e = k.querySelector(".sz-etiket");
         return !!m && (m.ders ? (!!e && e.getAttribute("data-ders") === m.ders) : !e);
       }), etiketli + " / " + etiketBek);
    ok("kart: numarasız kart (sıra numarası yok)",
       $$("#szListe ol, #szListe li").length === 0 && !!ilkKart && ilkKart.tagName === "ARTICLE", ilkKart ? ilkKart.tagName : "kart yok");
    ok("kart: anlam kısa hâlde görünür (detay kapalı)",
       gorunur(".sz-kart .sz-detay") === "none" && metin(".sz-kart .sz-anlam").length > 0, gorunur(".sz-kart .sz-detay"));
    ok("kart: ilk kart listenin ilk maddesini gösteriyor",
       !!ilkKart && metin("#szListe .sz-kart .sz-terim") === (A.liste()[0].terim || "(terimsiz)"), kisalt(metin("#szListe .sz-kart .sz-terim")));

    /* ── 4) ders filtresi (beklentiler gerçek veriden) ── */
    ok("filtre: ders çipleri Tümü + " + DERSLER.length + " ders",
       $$("#szDersler .sz-cip").length === DERSLER.length + 1, $$("#szDersler .sz-cip").length + " çip");
    ok("filtre: harf şeridinde Tümü + " + HARFLER.length + " harf",
       $$("#szHarfler .sz-cip").length === HARFLER.length + 1, $$("#szHarfler .sz-cip").length + " çip");
    var dersSec = "", dersBek = 0;
    DERSLER.forEach(function (d) { if (!dersSec && dersSay(d) > 0) { dersSec = d; dersBek = dersSay(d); } });
    ok("filtre: gerçek veride çipi dolu en az bir ders var", !!dersSec && dersBek > 0, dersSec + " = " + dersBek + " terim");
    var dersCip = $('#szDersler .sz-cip[data-ders-sec="' + dersSec + '"]');
    if (dersCip) dersCip.click();
    ok("filtre: ders çipine basınca yalnız o dersin terimleri listelenir",
       A.liste().length === dersBek && A.liste().every(function (m) { return m.ders === dersSec; }),
       A.liste().length + " / beklenen " + dersBek + " (" + dersSec + ")");
    ok("filtre: seçili ders çipi 'secili' olarak işaretlendi",
       !!$('#szDersler .sz-cip[data-ders-sec="' + dersSec + '"].secili'), kisalt(metin('#szDersler .sz-cip[data-ders-sec="' + dersSec + '"]')));
    ok("filtre: sayaç \"" + TOPLAM + " terimden " + dersBek + " sonuç\"",
       metin("#szSayac") === TOPLAM + " terimden " + dersBek + " sonuç", metin("#szSayac"));
    ok("sayfa: süzülmüş listede kart sayısı Math.min(sayfaBoyu, sonuç)=" + kartBek(dersBek),
       kartlar().length === kartBek(dersBek), kartlar().length + " kart / beklenen " + kartBek(dersBek));
    var dersRozet = $('#szDersler .sz-cip[data-ders-sec="' + dersSec + '"] i');
    ok("çip: " + dersSec + " çipindeki sayaç gerçek terim sayısını gösteriyor",
       !!dersRozet && parseInt(dersRozet.textContent, 10) === dersBek, dersRozet ? dersRozet.textContent : "rozet yok");
    $('#szDersler .sz-cip[data-ders-sec=""]').click();   /* Tümü */
    ok("filtre: Tümü çipi tüm listeyi geri getirdi", A.liste().length === TOPLAM, A.liste().length + " / " + TOPLAM);
    var tumuRozet = $('#szDersler .sz-cip[data-ders-sec=""] i');
    ok("çip: Tümü çipindeki sayaç gerçek terim sayısını gösteriyor",
       !!tumuRozet && parseInt(tumuRozet.textContent, 10) === TOPLAM, tumuRozet ? tumuRozet.textContent : "rozet yok");

    /* ── 5) harf şeridi ── */
    var harfSec = "", harfBek = 0;
    HARFLER.forEach(function (h) { if (!harfSec && harfSay(h) > 0) { harfSec = h; harfBek = harfSay(h); } });
    ok("filtre: gerçek veride dolu en az bir harf var", !!harfSec && harfBek > 0, harfSec + " = " + harfBek + " terim");
    var harfCip = $('#szHarfler .sz-cip[data-harf-sec="' + harfSec + '"]');
    if (harfCip) harfCip.click();
    ok("filtre: harf şeridi (" + harfSec + ") yalnız o harfle başlayan terimleri getirdi",
       A.liste().length === harfBek && A.liste().every(function (m) { return norm(m.terim).charAt(0) === norm(harfSec); }),
       A.liste().length + " / beklenen " + harfBek);
    var cBek = harfSay("Ç");
    $('#szHarfler .sz-cip[data-harf-sec="Ç"]').click();
    ok("filtre: harf duyarsızlığı — Ç şeridi Türkçe Ç/C ile başlayanları bulur",
       A.liste().length === cBek && A.liste().every(function (m) { return norm(m.terim).charAt(0) === "c"; }),
       A.liste().length + " / beklenen " + cBek + " · " + terimler(A.liste().slice(0, 3)));
    $('#szHarfler .sz-cip[data-harf-sec=""]').click();
    ok("filtre: harf \"Tümü\" çipi harf süzgecini kaldırdı", A.liste().length === TOPLAM, A.liste().length + " / " + TOPLAM);
    $('#szDersler .sz-cip[data-ders-sec="' + dersSec + '"]').click();
    $('#szHarfler .sz-cip[data-harf-sec="' + harfSec + '"]').click();
    var dersHarfBek = sayim(md, function (m) { return m.ders === dersSec && norm(m.terim).charAt(0) === norm(harfSec); });
    ok("filtre: ders + harf birlikte çalışıyor (VE)",
       A.liste().length === dersHarfBek && A.liste().every(function (m) { return m.ders === dersSec && norm(m.terim).charAt(0) === norm(harfSec); }),
       A.liste().length + " / beklenen " + dersHarfBek + " · " + terimler(A.liste().slice(0, 3)));
    $('#szDersler .sz-cip[data-ders-sec="' + dersSec + '"]').click();
    $('#szHarfler .sz-cip[data-harf-sec="' + harfSec + '"]').click();
    ok("filtre: çiplere tekrar basınca filtre kalkar", A.liste().length === TOPLAM, A.liste().length + " / " + TOPLAM);

    /* ── 6) arama (Türkçe aksan + büyük/küçük harf duyarsız) — sorgular gerçek veriden ── */
    function ara(q) {
      var g = $("#szArama");
      g.value = q;
      g.dispatchEvent(new Event("input", { bubbles: true }));
      return A.liste();
    }
    var ozel = null;
    for (var i = 0; i < md.length && !ozel; i++) {
      if (norm(md[i].terim) !== String(md[i].terim).toLowerCase()) ozel = md[i];
    }
    ok("arama: gerçek veride Türkçe özel harfli terim var (ölçüm için)", !!ozel, ozel ? ozel.terim : "yok");
    var rOz = ozel ? ara(ozel.terim) : [];
    ok("arama: terim kendi yazımıyla bulundu (\"" + (ozel ? ozel.terim : "-") + "\")",
       !!ozel && sayim(rOz, function (m) { return m.terim === ozel.terim; }) === 1, rOz.length + " sonuç");
    var rNorm = ozel ? ara(norm(ozel.terim)) : [];
    ok("arama: aksansız yazım aynı sonucu veriyor (\"" + (ozel ? norm(ozel.terim) : "-") + "\")",
       !!ozel && rNorm.length === rOz.length && rNorm.every(function (m) { return rOz.indexOf(m) >= 0; }),
       rNorm.length + " = " + rOz.length);
    var rBuyuk = ozel ? ara(String(ozel.terim).toUpperCase()) : [];
    ok("arama: büyük harf girdisi de aynı sonucu veriyor", !!ozel && rBuyuk.length === rOz.length, rBuyuk.length + " = " + rOz.length);
    ok("arama: süzülmüş sonuçta kart sayısı Math.min(sayfaBoyu, sonuç)=" + kartBek(rOz.length),
       kartlar().length === kartBek(rOz.length), kartlar().length + " kart / beklenen " + kartBek(rOz.length));
    var anlamHedef = null, anlamSorgu = "";
    for (var w = 0; w < md.length && !anlamHedef; w++) {
      var toklar = norm(md[w].anlam).split(/[^a-z0-9]+/);
      for (var z = 0; z < toklar.length; z++) {
        if (toklar[z].length >= 8 && norm(md[w].terim).indexOf(toklar[z]) < 0) { anlamHedef = md[w]; anlamSorgu = toklar[z]; break; }
      }
    }
    var rAnlam = anlamHedef ? ara(anlamSorgu) : [];
    ok("arama: anlam metni içinde de arıyor (\"" + anlamSorgu + "\")",
       !!anlamHedef && sayim(rAnlam, function (m) { return m.terim === anlamHedef.terim; }) === 1, rAnlam.length + " sonuç");
    var rYok = ara("zzzqqqxx");
    ok("arama: eşleşme yokken boş durum kutusu çizildi",
       rYok.length === 0 && !!$("#szBosSonuc") && metin("#szSayac") === TOPLAM + " terimden 0 sonuç",
       metin("#szSayac") + " / " + (!!$("#szBosSonuc") ? "boş kutu var" : "boş kutu YOK"));
    $("#szTemizle").click();
    ok("arama: temizle düğmesi aramayı sıfırladı ve liste geri geldi",
       $("#szArama").value === "" && A.liste().length === TOPLAM, $("#szArama").value + " / " + A.liste().length + " sonuç");

    /* ── 7) favori ── */
    ok("favori: depo test başında boş", A.favoriler().length === 0, A.favoriler().length + " favori");
    var k0 = kartlar()[0];
    var fTerim = k0.querySelector(".sz-terim").textContent;
    k0.querySelector(".sz-fav").click();
    var depo = null;
    try { depo = JSON.parse(localStorage.getItem(DEPO_FAV) || "[]"); } catch (e) { depo = null; }
    ok("favori: ekleyince localStorage \"" + DEPO_FAV + "\" içine yazıldı",
       Array.isArray(depo) && depo.length === 1 && depo[0] === norm(fTerim), JSON.stringify(depo));
    ok("favori: yıldız ☆ → ★ oldu ve 'dolu' sınıfı geldi",
       kartlar()[0].querySelector(".sz-fav").textContent === "★" && kartlar()[0].querySelector(".sz-fav").classList.contains("dolu"),
       kartlar()[0].querySelector(".sz-fav").textContent);
    A.ciz();   /* yeniden çiz → kalıcılık */
    ok("favori: yeniden çizimden sonra favori korunuyor (★)",
       kartlar()[0].querySelector(".sz-fav").textContent === "★" && A.favoriler().length === 1, A.favoriler().length + " favori");
    kartlar()[0].querySelector(".sz-fav").click();
    try { depo = JSON.parse(localStorage.getItem(DEPO_FAV) || "[]"); } catch (e) { depo = null; }
    ok("favori: tekrar basınca favori silindi ve depodan çıktı",
       Array.isArray(depo) && depo.length === 0 && kartlar()[0].querySelector(".sz-fav").textContent === "☆", JSON.stringify(depo));
    /* iki FARKLI terime favori → süzgeç ve sayaç ölçümü */
    var L = A.liste(), fIdx = [0], fAnahtar = [norm(L[0].terim)];
    for (var q2 = 1; q2 < Math.min(L.length, 40) && fIdx.length < 2; q2++) {
      if (fAnahtar.indexOf(norm(L[q2].terim)) < 0) { fIdx.push(q2); fAnahtar.push(norm(L[q2].terim)); }
    }
    ok("favori: ölçüm için iki farklı terim bulundu", fIdx.length === 2, fIdx.join(", ") + " → " + fAnahtar.join(" · "));
    fIdx.forEach(function (n) { var k = kartlar()[n]; if (k) k.querySelector(".sz-fav").click(); });
    var favKutu = $("#szFavSuz");
    favKutu.checked = true;
    favKutu.dispatchEvent(new Event("change", { bubbles: true }));
    ok("favori: favoriler süzgeci yalnız işaretli terimleri listeliyor",
       A.liste().length === 2 && A.favoriler().length === 2, A.liste().length + " sonuç / " + A.favoriler().length + " favori · " + terimler(A.liste()));
    ok("favori: sayaç \"" + TOPLAM + " terimden 2 sonuç\"", metin("#szSayac") === TOPLAM + " terimden 2 sonuç", metin("#szSayac"));
    favKutu.checked = false;
    favKutu.dispatchEvent(new Event("change", { bubbles: true }));
    ok("favori: süzgeç kapatılınca liste geri geldi", A.liste().length === TOPLAM && A.favoriler().length === 2, A.liste().length + " / " + TOPLAM);
    try { localStorage.removeItem(DEPO_FAV); } catch (e) {}
    A.ciz();

    /* ── 8) kart açılma + örnek cümle + sesli okuma ── */
    var ornekIdx = -1;
    for (var o2 = 0; o2 < Math.min(A.liste().length, kartlar().length); o2++) {
      if (A.liste()[o2].anlam && A.liste()[o2].ornek) { ornekIdx = o2; break; }
    }
    ok("kart: gerçek veride örnek cümleli terim var (ölçüm için)", ornekIdx >= 0, ornekIdx >= 0 ? A.liste()[ornekIdx].terim : "yok");
    var k1 = kartlar()[0];
    k1.click();
    ok("kart: tıklanınca açıldı (detay görünür) ve sınıf 'acik'",
       k1.classList.contains("acik") && gorunur(".sz-kart .sz-detay") !== "none", gorunur(".sz-kart .sz-detay"));
    ok("kart: açılan detayda tam tanım görünüyor",
       !!A.liste()[0].anlam && metin(".sz-kart.acik .sz-tam").indexOf(String(A.liste()[0].anlam).slice(0, 30)) >= 0, kisalt(metin(".sz-kart.acik .sz-tam")));
    if (ornekIdx >= 0) {
      var ko = kartlar()[ornekIdx];
      ko.click();
      ok("kart: açılan detayda örnek cümle görünüyor",
         !!ko.querySelector(".sz-ornek") && ko.querySelector(".sz-ornek").textContent.indexOf(String(A.liste()[ornekIdx].ornek).slice(0, 20)) >= 0,
         kisalt(ko.querySelector(".sz-ornek") ? ko.querySelector(".sz-ornek").textContent : "yok"));
      ko.click();
    } else {
      ok("kart: açılan detayda örnek cümle görünüyor", false, "gerçek veride örnek cümleli terim yok");
    }
    k1.click();
    ok("kart: tekrar tıklanınca kapandı (detay gizli)",
       !k1.classList.contains("acik") && gorunur(".sz-kart .sz-detay") === "none", gorunur(".sz-kart .sz-detay"));

    /* sesli okuma: yalnız KPSS_SES.konus geçici olarak sarılır (sonda geri konur) */
    var sesIdx = ornekIdx >= 0 ? ornekIdx : 0;
    var okunan = [];
    if (!sesVar) window.KPSS_SES = {};
    window.KPSS_SES.konus = function (m2) { okunan.push(String(m2 == null ? "" : m2)); };
    var ks = kartlar()[sesIdx];
    ks.click();
    ks.querySelector(".sz-dinle").click();
    var okunanMetin = okunan.length ? okunan[0] : "";
    ok("ses: 🔊 dinle düğmesi KPSS_SES.konus çağırdı", okunan.length === 1, okunan.length + " çağrı");
    ok("ses: okunan metin terim ve anlamı içeriyor",
       okunanMetin.indexOf(A.liste()[sesIdx].terim) === 0 && okunanMetin.indexOf(String(A.liste()[sesIdx].anlam).slice(0, 20)) > 0, kisalt(okunanMetin, 60));
    ok("ses: örnek cümle de okunuyor",
       okunanMetin.indexOf("Örnek:") >= 0 && okunanMetin.indexOf(String(A.liste()[sesIdx].ornek).slice(0, 18)) > 0, kisalt(okunanMetin.slice(-58), 60));
    ks.click();

    /* ── 9) HTML kaçışı (güvenlik) — veri yedeklenir, AYNI adımda geri konur ── */
    var kacisSonuc = (function () {
      var yedekVardi = Object.prototype.hasOwnProperty.call(window, "USTAD_SOZLUK");
      var yedek = window.USTAD_SOZLUK;
      var r = { kartVar: false, terim: "", sahte: -1 };
      try {
        window.USTAD_SOZLUK = [{ terim: "<b>x</b>", anlam: "<img src=x onerror=alert(1)>", ders: "Türkçe",
                                 konu: "<i>k</i>", ornek: "<script>1</" + "script>" }];
        A.ciz();
        var son = document.querySelector("#sozlukAlan .sz-kart");
        if (son) {
          r.kartVar = true;
          r.terim = son.querySelector(".sz-terim") ? son.querySelector(".sz-terim").textContent : "";
          r.sahte = Array.prototype.filter.call(son.querySelectorAll("b,img,i,script,iframe"), function (x) {
            return !x.classList.contains("sz-terim");
          }).length;
        }
      } finally {
        if (yedekVardi) window.USTAD_SOZLUK = yedek;
        else { try { delete window.USTAD_SOZLUK; } catch (e2) {} }
      }
      return r;
    })();
    ok("güvenlik: terim/anlam HTML olarak yorumlanmadı (kaçışlandı)",
       kacisSonuc.kartVar && kacisSonuc.terim === "<b>x</b>" && kacisSonuc.sahte === 0,
       kisalt(kacisSonuc.terim) + " · sahte etiket: " + kacisSonuc.sahte);
    ok("güvenlik: ölçümden sonra gerçek veri geri konuldu (aynı referans)", window.USTAD_SOZLUK === gercek,
       window.USTAD_SOZLUK === gercek ? "aynı referans" : "referans değişti");
    A.ciz();

    /* ── 10) boş / bozuk veri: modül çökmemeli (veri AYNI adımda geri konur) ── */
    function bosSenaryo(ata) {
      var yedekVardi = Object.prototype.hasOwnProperty.call(window, "USTAD_SOZLUK");
      var yedek = window.USTAD_SOZLUK;
      var r = { hata: null, bosKutu: false, listeVar: true };
      try {
        ata();
        try { A.bolumAc("sozluk"); } catch (e) { r.hata = e; }
        r.bosKutu = !!document.getElementById("szBosVeri");
        r.listeVar = !!document.getElementById("szListe");
      } finally {
        if (yedekVardi) window.USTAD_SOZLUK = yedek;
        else { try { delete window.USTAD_SOZLUK; } catch (e2) {} }
      }
      return r;
    }
    var s1 = bosSenaryo(function () { window.USTAD_SOZLUK = []; });
    ok("boş veri: dizi boşken çizim çökmedi", !s1.hata, s1.hata ? String(s1.hata.message) : "hata yok");
    ok("boş veri: \"Sözlük verisi yüklenmemiş\" boş durumu çizildi",
       s1.bosKutu && !s1.listeVar && metin("#szBosVeri").indexOf("Sözlük verisi yüklenmemiş") >= 0, kisalt(metin("#szBosVeri")));
    var s2 = bosSenaryo(function () { window.USTAD_SOZLUK = "metin"; });
    ok("bozuk veri: dizi olmayan değerde çökmedi", !s2.hata, s2.hata ? String(s2.hata.message) : "hata yok");
    ok("bozuk veri: dizi olmayan değerde boş durum çizildi", s2.bosKutu, kisalt(metin("#szBosVeri")));
    var s3 = bosSenaryo(function () { try { delete window.USTAD_SOZLUK; } catch (e) {} });
    ok("boş veri: USTAD_SOZLUK hiç yokken de çökmedi", !s3.hata, s3.hata ? String(s3.hata.message) : "hata yok");
    ok("boş veri: alan yokken de boş durum çizildi", s3.bosKutu, kisalt(metin("#szBosVeri")));
    var s4 = bosSenaryo(function () { window.USTAD_SOZLUK = [null, 5, {}, { terim: "" }, { anlam: "" }]; });
    ok("bozuk veri: geçersiz kayıtlar süzüldü, çökme yok", !s4.hata && s4.bosKutu, s4.hata ? String(s4.hata.message) : "boş durum çizildi");
    A.ciz();
    ok("temizlik: boş/bozuk senaryolardan sonra gerçek veri geri çizildi",
       window.USTAD_SOZLUK === gercek && A.maddeler().length === TOPLAM && !!document.getElementById("szListe"),
       metin("#szSayac") + " · aynı referans: " + (window.USTAD_SOZLUK === gercek));
    ok("tekil konteyner: boş/bozuk senaryolardan sonra da tek kabuk",
       $$("#ekran-sozluk").length === 1 && $$("#sozlukAlan").length === 1 && $$("#szDersler").length === 1 && $$("#szListe").length === 1,
       "kabuk " + $$("#ekran-sozluk").length + " / alan " + $$("#sozlukAlan").length + " / liste " + $$("#szListe").length);

    /* ── 11) sözleşme: başka bölüm kodu sözlüğü yeniden çizmez ── */
    A.ciz();
    var imza = document.getElementById("szListe");
    imza.setAttribute("data-imza", "SENTINEL");
    A.bolumAc("testler");
    ok("sözleşme: bolumAc(\"testler\") sözlüğü yeniden çizmedi (imza korundu)",
       imza.getAttribute("data-imza") === "SENTINEL", imza.getAttribute("data-imza") || "üzerine yazıldı");
    A.bolumAc("sozluk");
    ok("sözleşme: bolumAc(\"sozluk\") ekranı çizdi ve tek konteyner korundu",
       !!document.getElementById("szListe") && $$("#ekran-sozluk").length === 1 && $$("#szListe").length === 1,
       "liste " + $$("#szListe").length + " / kabuk " + $$("#ekran-sozluk").length);

    /* ── 12) temizlik: her şey ilk hâlinde ── */
    ok("temizlik: USTAD_SOZLUK ilk hâlinde (test boyunca sahte veriyle değiştirilmedi)",
       window.USTAD_SOZLUK === gercek, Array.isArray(gercek) ? gercek.length + " madde · aynı referans" : typeof gercek);
    try {
      if (eskiFav === null) localStorage.removeItem(DEPO_FAV); else localStorage.setItem(DEPO_FAV, eskiFav);
    } catch (e) {}
    var geriFav = null;
    try { geriFav = localStorage.getItem(DEPO_FAV); } catch (e) {}
    ok("temizlik: favori deposu eski hâline döndü", geriFav === eskiFav, geriFav === null ? "boş" : "geri yüklendi");
    if (sesVar) { try { window.KPSS_SES.konus = eskiKonus; } catch (e) {} }
    else { try { delete window.KPSS_SES; } catch (e) {} }
    ok("temizlik: KPSS_SES.konus geri konuldu",
       sesVar ? window.KPSS_SES.konus === eskiKonus : !window.KPSS_SES, sesVar ? "eski fonksiyon" : "geçici nesne silindi");
    A.ciz();
    ok("temizlik: son çizim gerçek veriyle çökmeden tamamlandı",
       !!document.getElementById("sozlukAlan"), metin("#szSayac") || kisalt(metin("#szBosVeri")));
    ok("temizlik: ekranda gerçek veri var (ilk kart ilk maddeyi gösteriyor)",
       kartlar().length === kartBek(TOPLAM) && metin("#szListe .sz-kart .sz-terim") === (A.liste()[0].terim || "(terimsiz)"),
       kartlar().length + " kart · " + kisalt(metin("#szListe .sz-kart .sz-terim")));
    ok("temizlik: tek konteyner korundu (#ekran-sozluk=1, #szListe=1)",
       $$("#ekran-sozluk").length === 1 && $$("#szListe").length === 1,
       "kabuk " + $$("#ekran-sozluk").length + " / liste " + $$("#szListe").length);

    /* sonuç kutusu */
    var kap2 = document.createElement("div");
    kap2.id = "sozlukTestSonuc";
    kap2.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
    kap2.innerHTML = "<h3>ÜSTAD KOÇ PRO · Terim Sözlüğü testi (gerçek veriyle)</h3>" +
      t.map(function (x) { return "<div>" + kacis(x) + "</div>"; }).join("") +
      "<hr><b>" + t.filter(function (x) { return x.indexOf("✔") === 0; }).length + " / " + t.length + " geçti</b>";
    document.body.appendChild(kap2);

    /* başlık işareti: motor.git() başlığı sıfırlayabildiği için 10 sn boyunca yeniden eklenir */
    var gecenAdet = t.filter(function (x) { return x.indexOf("✔") === 0; }).length;
    function baslikYaz() {
      if (String(document.title).indexOf("SOZLUKTEST") < 0) {
        document.title = (document.title || "") + " SOZLUKTEST " + gecenAdet + "/" + t.length;
      }
    }
    baslikYaz();
    var sayac = 0;
    var zamanB = setInterval(function () { baslikYaz(); if (++sayac > 40) clearInterval(zamanB); }, 250);
  }

  if (location.search.indexOf("test=1") >= 0) {
    var kos = function () { setTimeout(sozlukTesti, 500); };
    if (document.readyState === "complete") kos();
    else window.addEventListener("load", kos);
  }
})();
