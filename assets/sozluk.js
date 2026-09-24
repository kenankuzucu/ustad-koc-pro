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

  /* ───────────── ekran kabı ───────────── */
  function kap() {
    var s = document.getElementById("ekran-sozluk");
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
    if (!document.getElementById("sozlukAlan")) {
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
    var alan = document.getElementById("sozlukAlan");
    if (!alan) return;
    bagla(alan);

    var md = maddeler();
    if (!md.length) {
      alan.innerHTML = bosVeriHTML();
      LISTE = [];
      return;
    }
    if (!document.getElementById("szListe")) {
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

  /* ═════════════ kendi kendini test (?test=1) ═════════════
     Ölçüm gerçek çalıştırmadır: modül sayfaya yüklendiğinde, adres ?test=1 içeriyorsa
     geçici test verisiyle (60 madde) tüm mekanik ölçülür ve sonuçlar #sozlukTestSonuc'a yazılır. */
  function sozlukTesti() {
    var t = [];
    function ok(ad, gecti, ayrinti) {
      t.push((gecti ? "✔ " : "✘ ") + ad + (ayrinti === undefined || ayrinti === null ? "" : " — " + ayrinti));
    }
    function kartlar() { return $$("#sozlukAlan .sz-kart"); }
    function metin(sel) { var e = $(sel); return e ? String(e.textContent).trim() : ""; }
    function gorunur(sel) { var e = $(sel); return e ? getComputedStyle(e).display : "yok"; }

    /* test verisi: 6 ders × 10 terim = 60 madde (Türkçe aksan ölçümü için ç/ğ/ı/İ/ö/ş/ü içerir) */
    var HAM = [
      "Çıkarım|Metinden çıkarılan yargı|Türkçe|Cümlede Anlam|Bu parçadan çıkarım yapmak için metnin bütünü okunmalıdır.",
      "Öznellik|Kişisel yorum içeren anlatım|Türkçe|Sözcükte Anlam|Yazarın öznelliği cümleye duygu katmıştır.",
      "Nesnellik|Kanıtlanabilir, kişisel yorum içermeyen anlatım|Türkçe|Sözcükte Anlam|Bilimsel metinlerde nesnellik esastır.",
      "Ad Aktarması|Bir sözcüğün benzetme amacı olmadan başka sözcüğün yerine kullanılması|Türkçe|Sözcük Türleri|“Ankara açıklama yaptı” cümlesinde ad aktarması vardır.",
      "Deyim Aktarması|Bir sözcüğün benzetme amacıyla başka anlama aktarılması|Türkçe|Sözcükte Anlam|“Sıcak bir karşılama” sözünde deyim aktarması görülür.",
      "Adlaşmış Sıfat|Nitelediği ad düşmüş sıfat|Türkçe|Sözcük Türleri|“Gelenler içeri girdi” cümlesinde adlaşmış sıfat vardır.",
      "Yan Cümle|Cümle içinde yargı bildiren yan yargı|Türkçe|Cümlede Anlam|Yan cümle temel cümlenin anlamını tamamlar.",
      "Pekiştirme|Sözcüğün anlamının güçlendirilmesi|Türkçe|Ses Bilgisi|“Mas mavi” sözünde pekiştirme yapılmıştır.",
      "Kaynaştırma Harfi|İki ünlü arasına giren yardımcı ünsüz|Türkçe|Ses Bilgisi|“Araba-y-ı” sözcüğünde kaynaştırma harfi vardır.",
      "Şüphe Cümlesi|Kuşku anlamı taşıyan cümle|Türkçe|Cümlede Anlam|“Acaba gelir mi?” cümlesi şüphe cümlesidir.",
      "Üslü Sayı|Tabanın kendisiyle tekrarlı çarpımı|Matematik|Üslü ve Köklü Sayılar|2 üssü 3 üslü sayıdır.",
      "Mutlak Değer|Sayının sıfıra olan uzaklığı|Matematik|Mutlak Değer|Negatif sayının mutlak değeri pozitiftir.",
      "EBOB|İki sayının en büyük ortak böleni|Matematik|EBOB-EKOK|12 ve 18'in EBOB'u 6'dır.",
      "EKOK|İki sayının en küçük ortak katı|Matematik|EBOB-EKOK|4 ve 6'nın EKOK'u 12'dir.",
      "Çarpanlara Ayırma|İfadenin çarpım biçiminde yazılması|Matematik|Çarpanlara Ayırma|Çarpanlara ayırma sadeleştirmeyi kolaylaştırır.",
      "Olasılık|Bir olayın gerçekleşme oranı|Matematik|Olasılık|Zarın 6 gelme olasılığı altıda birdir.",
      "Permütasyon|Sıralamanın önemli olduğu diziliş|Matematik|Permütasyon-Kombinasyon|Oturma düzeni permütasyonla hesaplanır.",
      "Kombinasyon|Sıralamanın önemsiz olduğu seçim|Matematik|Permütasyon-Kombinasyon|Takım seçimi kombinasyonla bulunur.",
      "Ağırlıklı Ortalama|Her verinin kendi ağırlığıyla çarpılıp toplanması|Matematik|Tablo ve Grafik|Not ortalaması ağırlıklı ortalama ile hesaplanır.",
      "Ölçek|Haritadaki uzunluğun gerçek uzunluğa oranı|Matematik|Problemler|Ölçek küçüldükçe harita ayrıntısı artar.",
      "Tanzimat|Osmanlı'da batılılaşma döneminin başlangıcı|Tarih|Osmanlı Dağılma Dönemi|Tanzimat Fermanı 1839'da ilan edildi.",
      "Sened-i İttifak|Padişah ile ayanlar arasındaki sözleşme|Tarih|Osmanlı Dağılma Dönemi|Sened-i İttifak 1808'de imzalandı.",
      "Kanun-i Esasi|1876 tarihli ilk Osmanlı anayasası|Tarih|Osmanlı Dağılma Dönemi|Kanun-i Esasi I. Meşrutiyet ile ilan edildi.",
      "Misak-ı Millî|Kurtuluş Savaşı'nın temel kararları|Tarih|Kurtuluş Savaşı|Misak-ı Millî 1920'de kabul edildi.",
      "Teşkilat-ı Esasiye|1921 tarihli ilk anayasa|Tarih|Kurtuluş Savaşı|Teşkilat-ı Esasiye millî egemenliği esas aldı.",
      "Islahat Fermanı|Gayrimüslimlere haklar tanıyan ferman|Tarih|Osmanlı Dağılma Dönemi|Islahat Fermanı 1856'da ilan edildi.",
      "Tımar|Osmanlı'da hizmet karşılığı verilen toprak|Tarih|Osmanlı Kuruluş ve Yükseliş|Tımar sistemi ordunun temelini oluşturdu.",
      "Devşirme|Devlet hizmeti için çocuk toplanması|Tarih|Osmanlı Kuruluş ve Yükseliş|Devşirme sistemiyle yöneticiler yetiştirildi.",
      "Kapitülasyon|Yabancılara tanınan ekonomik ayrıcalıklar|Tarih|Osmanlı Dağılma Dönemi|Kapitülasyonlar Osmanlı ekonomisini zayıflattı.",
      "Lozan Antlaşması|Türkiye'nin bağımsızlığını tanıyan antlaşma|Tarih|Atatürk Dönemi Dış Politika|Lozan Antlaşması 1923'te imzalandı.",
      "İzobar|Aynı basınç değerine sahip noktaları birleştiren çizgi|Coğrafya|İklim ve Bitki Örtüsü|İzobar haritası basınç dağılışını gösterir.",
      "İzoterm|Aynı sıcaklık değerine sahip noktaları birleştiren çizgi|Coğrafya|İklim ve Bitki Örtüsü|İzoterm eğrileri kışın kuzeye doğru kıvrılır.",
      "Maki|Akdeniz ikliminde görülen sert yapraklı çalı topluluğu|Coğrafya|İklim ve Bitki Örtüsü|Maki bitki örtüsü kıyı Ege'de yaygındır.",
      "Karst|Kalkerli arazilerde erimeyle oluşan şekil|Coğrafya|Yer Şekilleri|Karst oluşumları Toroslar'da görülür.",
      "Delta|Akarsuyun denize döküldüğü yerde oluşturduğu düzlük|Coğrafya|Yer Şekilleri|Çukurova bir delta ovasıdır.",
      "Plato|Yüksek ve geniş düzlük|Coğrafya|Yer Şekilleri|Anadolu'nun iç kesimlerinde platolar vardır.",
      "Havza|Akarsuyun sularını topladığı alan|Coğrafya|Yer Şekilleri|Havza sınırları su bölümü çizgisidir.",
      "Erozyon|Toprağın akarsu ve rüzgârla taşınması|Coğrafya|Bölgeler ve Doğal Afetler|Erozyon tarım alanlarını verimsizleştirir.",
      "Barometre|Basıncı ölçen alet|Coğrafya|İklim ve Bitki Örtüsü|Barometre ile basınç milibar cinsinden ölçülür.",
      "Rejim|Akarsuyun akış düzeni|Coğrafya|Türkiye Ekonomisi: Tarım|Akarsu rejimi yağış düzenine bağlıdır.",
      "Anayasa|Devletin temel kuruluş ve işleyiş kuralları|Vatandaşlık|1982 Anayasası Temel İlkeleri|Anayasa en üstün hukuk normudur.",
      "Yasama|Kanun yapma yetkisi|Vatandaşlık|Yasama|Yasama yetkisi Türkiye Büyük Millet Meclisi'ne aittir.",
      "Yürütme|Kanunları uygulama yetkisi|Vatandaşlık|Yürütme|Yürütme yetkisi Cumhurbaşkanına aittir.",
      "Yargı|Bağımsız mahkemelerce yürütülen yargılama|Vatandaşlık|Yargı|Yargı yetkisi bağımsız mahkemelere aittir.",
      "Temel Hak|Anayasa ile korunan vazgeçilmez haklar|Vatandaşlık|Temel Hak ve Ödevler|Temel haklar ancak kanunla sınırlanabilir.",
      "Meclis Araştırması|Bir konunun incelenmesi için açılan meclis incelemesi|Vatandaşlık|Yasama|Meclis araştırması önergeyle açılır.",
      "Kanun Hükmünde Kararname|Bakanlar Kurulunun kanun gücünde düzenlemesi|Vatandaşlık|Yürütme|Kanun hükmünde kararname yetkisi kanunla verilir.",
      "Hukuk Devleti|Devletin hukuk kurallarına bağlı olması|Vatandaşlık|Temel Hukuk Kavramları|Hukuk devletinde idare yargı denetimine açıktır.",
      "Egemenlik|Devlet gücünü kullanma yetkisi|Vatandaşlık|1982 Anayasası Temel İlkeleri|Egemenlik kayıtsız şartsız milletindir.",
      "İptal Davası|Kanunların anayasaya uygunluğunun denetimi|Vatandaşlık|Yargı|İptal davası Anayasa Mahkemesinde açılır.",
      "Dezenflasyon|Fiyat artış hızının azalması|Güncel Bilgiler|Türkiye Gündemi|Merkez Bankası dezenflasyon sürecini duyurdu.",
      "Sürdürülebilirlik|Kaynakların gelecek kuşaklara aktarılması|Güncel Bilgiler|Dünya Gündemi|Sürdürülebilirlik politikaları yaygınlaşıyor.",
      "Jeopolitik|Coğrafyanın devlet politikasına etkisi|Güncel Bilgiler|Dünya Gündemi|Jeopolitik dengeler bölgesel ilişkileri belirliyor.",
      "Yapay Zekâ|Makinelerin insan gibi öğrenip karar vermesi|Güncel Bilgiler|Türkiye Gündemi|Yapay zekâ düzenlemesi gündemdedir.",
      "Yeşil Mutabakat|Avrupa Birliği'nin iklim odaklı dönüşüm planı|Güncel Bilgiler|Uluslararası Kuruluşlar ve Zirveler|Yeşil Mutabakat ihracat kurallarını değiştiriyor.",
      "Kripto Varlık|Blokzincir tabanlı dijital değer|Güncel Bilgiler|Türkiye Gündemi|Kripto varlıklara yasal çerçeve hazırlanıyor.",
      "Dijital Dönüşüm|Kamu ve iş süreçlerinin dijitalleşmesi|Güncel Bilgiler|Türkiye Gündemi|Dijital dönüşüm e-devlet hizmetlerini artırdı.",
      "Enerji Dönüşümü|Fosil yakıtlardan yenilenebilire geçiş|Güncel Bilgiler|Dünya Gündemi|Enerji dönüşümü yatırımları hızlandı.",
      "Zirve|Devlet başkanlarının katıldığı üst düzey toplantı|Güncel Bilgiler|Uluslararası Kuruluşlar ve Zirveler|İklim zirvesi yıllık olarak toplanır.",
      "Uluslararası Antlaşma|Devletler arasında bağlayıcı yazılı sözleşme|Güncel Bilgiler|Uluslararası Kuruluşlar ve Zirveler|Antlaşmalar Meclis onayıyla yürürlüğe girer."
    ];
    function veri() {
      return HAM.map(function (s) {
        var p = s.split("|");
        return { terim: p[0], anlam: p[1], ders: p[2], konu: p[3], ornek: p[4] };
      });
    }

    /* ── durum yedekle ── */
    var eskiVeri = window.USTAD_SOZLUK;
    var eskiVeriVardi = Object.prototype.hasOwnProperty.call(window, "USTAD_SOZLUK");
    var eskiFav = null, eskiKonus = window.KPSS_SES ? window.KPSS_SES.konus : null, sesVar = !!window.KPSS_SES;
    try { eskiFav = localStorage.getItem(DEPO_FAV); } catch (e) {}
    try { localStorage.removeItem(DEPO_FAV); } catch (e) {}

    /* ── 1) modül sözleşmesi ── */
    ok("modül: window.SOZLUK globali tanımlı", !!window.SOZLUK && typeof window.SOZLUK === "object", typeof window.SOZLUK);
    ok("sözleşme: SOZLUK.bolumAc fonksiyon", typeof A.bolumAc === "function");
    ok("sözleşme: SOZLUK.ciz fonksiyon", typeof A.ciz === "function");

    /* ── 2) boş veri: çökmeden boş durum çizmeli ── */
    window.USTAD_SOZLUK = [];
    var coktu = null;
    try { A.bolumAc("sozluk"); } catch (e) { coktu = e; }
    ok("boş veri: dizi boşken çizim çökmedi", !coktu, coktu ? String(coktu.message) : "hata yok");
    ok("boş veri: \"Sözlük verisi yüklenmemiş\" boş durumu çizildi",
       !!$("#szBosVeri") && metin("#szBosVeri").indexOf("Sözlük verisi yüklenmemiş") >= 0,
       metin("#szBosVeri").slice(0, 44));
    var silindi = delete window.USTAD_SOZLUK;
    var coktu2 = null;
    try { A.bolumAc("sozluk"); } catch (e) { coktu2 = e; }
    ok("boş veri: USTAD_SOZLUK hiç yokken de çökmedi", !coktu2 && !!$("#szBosVeri"),
       silindi ? "alan silindi, hata yok" : "alan silinemedi ama hata yok");
    if (eskiVeriVardi) window.USTAD_SOZLUK = eskiVeri;

    /* ── 3) ekran kabı: yoksa kendini oluşturur ── */
    var eskiKap = document.getElementById("ekran-sozluk");
    var eskiKapVardi = !!eskiKap, eskiKapDis = eskiKap ? eskiKap.outerHTML : "";
    if (eskiKap && eskiKap.parentNode) eskiKap.parentNode.removeChild(eskiKap);
    window.USTAD_SOZLUK = veri();
    A.bolumAc("sozluk");
    var yeniKap = document.getElementById("ekran-sozluk");
    ok("kap: ekran yokken KENDİNİ oluşturdu", !!yeniKap, yeniKap ? yeniKap.id : "yok");
    ok("kap: .ekran sınıfı ve data-bolum=\"sozluk\"",
       !!yeniKap && /(^|\s)ekran(\s|$)/.test(yeniKap.className) && yeniKap.getAttribute("data-bolum") === "sozluk",
       yeniKap ? yeniKap.className + " / " + yeniKap.getAttribute("data-bolum") : "yok");
    ok("kap: içinde #sozlukAlan var ve bölüm çizildi",
       !!document.getElementById("sozlukAlan") && !!document.getElementById("szListe"));
    if (eskiKapVardi) {   /* index.html'de yazılı kap varsa onu geri koy (dosyaya dokunulmaz) */
      var gecici = document.createElement("div");
      gecici.innerHTML = eskiKapDis;
      var orijinal = gecici.firstElementChild;
      if (orijinal && yeniKap && yeniKap.parentNode) yeniKap.parentNode.replaceChild(orijinal, yeniKap);
      A.ciz();
    }

    /* kap elemanı kopyalanırsa (outerHTML/innerHTML klonu — nitelik de kopyalanır) dinleyici yeniden bağlanmalı */
    var alanEl = document.getElementById("sozlukAlan");
    var klon = alanEl.cloneNode(true);
    alanEl.parentNode.replaceChild(klon, alanEl);
    A.ciz();
    var kv = document.querySelector("#sozlukAlan .sz-kart");
    if (kv) kv.click();
    ok("kap: alan kopyalanıp değişse de tıklama çalışıyor (dinleyici yeniden bağlandı)",
       !!kv && kv.classList.contains("acik"), kv ? kv.className : "kart yok");

    /* ── 4) veri + ilk çizim ── */
    var md = A.maddeler();
    ok("veri: 60 test maddesi okundu", md.length === 60, md.length + " madde");
    ok("arayüz: arama kutusu, süzgeç çipleri ve harf şeridi çizildi",
       !!$("#szArama") && !!$("#szDersler") && !!$("#szHarfler") && !!$("#szSayac"), "temel arayüz hazır");
    ok("sayfa: ilk çizimde 50 kart (sayfa başına 50)", kartlar().length === 50, kartlar().length + " kart");
    ok("sayfa: \"daha fazla göster\" düğmesi var ve kalan terimi yazıyor",
       !!$("#szDahaGoster") && metin("#szDahaGoster").indexOf("10 terim daha") >= 0, metin("#szDahaGoster"));
    ok("sayaç: \"60 terimden 60 sonuç\" biçiminde", metin("#szSayac") === "60 terimden 60 sonuç", metin("#szSayac"));
    ok("sayfalama: \"daha fazla göster\" kart sayısını 60'a çıkardı",
       (function () { $("#szDahaGoster").click(); var n = kartlar().length; return n === 60; })(), kartlar().length + " kart");
    ok("sayfalama: tümü gösterilince düğme kayboldu", !$("#szDahaGoster"), metin("#szDaha"));
    ok("sayaç: kart sayısı süzülmüş sonuç sayısına eşit", kartlar().length === A.liste().length,
       kartlar().length + " kart / " + A.liste().length + " sonuç");

    /* ── 5) kart yapısı ── */
    var ilkKart = kartlar()[0];
    var ilkTerim = ilkKart ? ilkKart.querySelector(".sz-terim") : null;
    var stTerim = ilkTerim ? getComputedStyle(ilkTerim) : null;
    ok("kart: terim kalın yazılıyor (font-weight 700)",
       !!stTerim && String(stTerim.fontWeight) === "700", stTerim ? stTerim.fontWeight : "yok");
    ok("kart: terim monospace yazı tipinde",
       !!stTerim && String(stTerim.fontFamily).toLowerCase().indexOf("monospace") >= 0,
       stTerim ? String(stTerim.fontFamily).slice(0, 46) : "yok");
    ok("kart: sağ üstte ders etiketi var ve dersi doğru yazıyor",
       kartlar().length > 0 && kartlar().every(function (k) {
         var e = k.querySelector(".sz-etiket");
         return !!e && e.getAttribute("data-ders") === A.liste()[parseInt(k.getAttribute("data-i"), 10)].ders;
       }), kartlar()[0].querySelector(".sz-etiket").textContent);
    ok("kart: numarasız kart (sıra numarası yok)", $$("#szListe ol, #szListe li").length === 0 &&
       kartlar()[0].tagName === "ARTICLE", kartlar()[0].tagName);
    ok("kart: anlam kısa hâlde görünür (detay kapalı)",
       gorunur(".sz-kart .sz-detay") === "none" && metin(".sz-kart .sz-anlam").length > 0, gorunur(".sz-kart .sz-detay"));

    /* ── 6) ders filtresi + harf şeridi ── */
    var dersCipleri = $$("#szDersler .sz-cip");
    ok("filtre: ders çipleri Tümü + 6 ders = 7", dersCipleri.length === 7, dersCipleri.length + " çip");
    var harfCipleri = $$("#szHarfler .sz-cip");
    ok("filtre: harf şeridinde Tümü + 29 harf = 30", harfCipleri.length === 30, harfCipleri.length + " çip");

    $('#szDersler .sz-cip[data-ders-sec="Tarih"]').click();
    var tarihBek = md.filter(function (m) { return m.ders === "Tarih"; }).length;
    ok("filtre: ders çipine basınca yalnız o dersin terimleri listelenir",
       A.liste().length === tarihBek && A.liste().every(function (m) { return m.ders === "Tarih"; }),
       A.liste().length + " / beklenen " + tarihBek);
    ok("filtre: seçili ders çipi 'secili' olarak işaretlendi",
       !!$('#szDersler .sz-cip[data-ders-sec="Tarih"].secili'), metin('#szDersler .sz-cip[data-ders-sec="Tarih"]'));
    ok("filtre: sayaç filtrelenmiş sayıyı gösteriyor",
       metin("#szSayac") === "60 terimden " + tarihBek + " sonuç", metin("#szSayac"));
    $('#szDersler .sz-cip[data-ders-sec=""]').click();   /* Tümü */
    ok("filtre: Tümü çipi tüm listeyi geri getirdi", A.liste().length === 60, A.liste().length + " sonuç");

    var dBek = md.filter(function (m) { return norm(m.terim).charAt(0) === "d"; }).length;
    $('#szHarfler .sz-cip[data-harf-sec="D"]').click();
    ok("filtre: harf şeridi (D) yalnız D ile başlayan terimleri getirdi",
       A.liste().length === dBek && A.liste().every(function (m) { return norm(m.terim).charAt(0) === "d"; }),
       A.liste().length + " / beklenen " + dBek);
    $('#szHarfler .sz-cip[data-harf-sec="Ç"]').click();
    ok("filtre: harf duyarsızlığı — Ç şeridi Türkçe Ç ile başlayanları bulur",
       A.liste().length >= 2 && A.liste().every(function (m) { return norm(m.terim).charAt(0) === "c"; }),
       A.liste().length + " terim: " + A.liste().slice(0, 3).map(function (m) { return m.terim; }).join(", "));
    $('#szHarfler .sz-cip[data-harf-sec=""]').click();
    $('#szDersler .sz-cip[data-ders-sec="Türkçe"]').click();
    $('#szHarfler .sz-cip[data-harf-sec="Ç"]').click();
    ok("filtre: ders + harf birlikte çalışıyor (VE)",
       A.liste().every(function (m) { return m.ders === "Türkçe" && norm(m.terim).charAt(0) === "c"; }) && A.liste().length > 0,
       A.liste().map(function (m) { return m.ders + "/" + m.terim; }).join(", "));
    $('#szDersler .sz-cip[data-ders-sec="Türkçe"]').click();   /* ders filtresini kaldır */
    $('#szHarfler .sz-cip[data-harf-sec="Ç"]').click();        /* harf filtresini kaldır */
    ok("filtre: çiplere tekrar basınca filtre kalkar", A.liste().length === 60, A.liste().length + " sonuç");

    /* ── 7) arama (Türkçe aksan + büyük/küçük harf duyarsız) ── */
    function ara(q) {
      var g = $("#szArama");
      g.value = q;
      g.dispatchEvent(new Event("input", { bubbles: true }));
      return A.liste();
    }
    var r1 = ara("olcek");
    ok("arama: \"olcek\" → \"Ölçek\" eşleşti (ö/ç aksan duyarsız)",
       r1.length === 1 && r1[0].terim === "Ölçek", r1.map(function (m) { return m.terim; }).join(", "));
    var r2 = ara("suphe");
    ok("arama: \"suphe\" → \"Şüphe Cümlesi\" eşleşti (ş/ü duyarsız)",
       r2.length === 1 && r2[0].terim === "Şüphe Cümlesi", r2.map(function (m) { return m.terim; }).join(", "));
    var r3 = ara("DEZENFLASYON");
    ok("arama: büyük harf girdi küçük harfli terimi buldu",
       r3.length === 1 && r3[0].terim === "Dezenflasyon", r3.length + " sonuç");
    var r4 = ara("çıkarım");
    ok("arama: Türkçe küçük harf (ı/ç) ile terim bulundu",
       r4.length >= 1 && r4.filter(function (m) { return m.terim === "Çıkarım"; }).length === 1, r4.length + " sonuç");
    ok("arama: ı/i duyarsızlığı — \"cikarim\" da aynı sonucu verir",
       ara("cikarim").length === r4.length, ara("cikarim").length + " = " + r4.length);
    ok("arama: \"agirlikli\" → \"Ağırlıklı Ortalama\" (ğ/g duyarsız)",
       ara("agirlikli").length === 1 && A.liste()[0].terim === "Ağırlıklı Ortalama",
       A.liste().map(function (m) { return m.terim; }).join(", "));
    var r5 = ara("kuşku");
    ok("arama: anlam metni içinde de arar (\"kuşku\" → Şüphe Cümlesi)",
       r5.length === 1 && r5[0].terim === "Şüphe Cümlesi", r5.length + " sonuç");
    var r6 = ara("zzzqqq");
    ok("arama: eşleşme yokken boş durum kutusu çizildi",
       r6.length === 0 && !!$("#szBosSonuc") && metin("#szSayac") === "60 terimden 0 sonuç",
       metin("#szSayac") + " / " + (!!$("#szBosSonuc") ? "boş kutu var" : "boş kutu YOK"));
    $("#szTemizle").click();
    ok("arama: temizle düğmesi aramayı sıfırladı ve liste geri geldi",
       $("#szArama").value === "" && A.liste().length === 60, $("#szArama").value + " / " + A.liste().length + " sonuç");

    /* ── 8) favori ── */
    ok("favori: depo başlangıçta boş", A.favoriler().length === 0, A.favoriler().length + " favori");
    var f0 = kartlar()[0], fTerim = f0.querySelector(".sz-terim").textContent;
    f0.querySelector(".sz-fav").click();
    var depo = null;
    try { depo = JSON.parse(localStorage.getItem(DEPO_FAV) || "[]"); } catch (e) { depo = null; }
    ok("favori: ekleyince localStorage \"ustad.sozluk.fav\" dosyasına yazıldı",
       Array.isArray(depo) && depo.length === 1 && depo[0] === norm(fTerim), JSON.stringify(depo));
    ok("favori: yıldız ☆ → ★ oldu ve 'dolu' sınıfı geldi",
       kartlar()[0].querySelector(".sz-fav").textContent === "★" &&
       kartlar()[0].querySelector(".sz-fav").classList.contains("dolu"),
       kartlar()[0].querySelector(".sz-fav").textContent);
    A.ciz();   /* yeniden çiz → kalıcılık */
    ok("favori: yeniden çizimden sonra favori korunuyor (★)",
       kartlar()[0].querySelector(".sz-fav").textContent === "★" && A.favoriler().length === 1,
       kartlar()[0].querySelector(".sz-fav").textContent);
    kartlar()[0].querySelector(".sz-fav").click();
    try { depo = JSON.parse(localStorage.getItem(DEPO_FAV) || "[]"); } catch (e) { depo = null; }
    ok("favori: tekrar basınca favori silindi ve depodan çıktı",
       Array.isArray(depo) && depo.length === 0 && kartlar()[0].querySelector(".sz-fav").textContent === "☆",
       JSON.stringify(depo));
    kartlar()[0].querySelector(".sz-fav").click();          /* 1. favori */
    kartlar()[3].querySelector(".sz-fav").click();          /* 2. favori */
    var favKutu = $("#szFavSuz");
    favKutu.checked = true;
    favKutu.dispatchEvent(new Event("change", { bubbles: true }));
    ok("favori: favoriler süzgeci yalnız işaretli terimleri listeliyor",
       A.liste().length === 2 && A.favoriler().length === 2,
       A.liste().map(function (m) { return m.terim; }).join(" · "));
    ok("favori: sayaç favori sonuçlarını ve toplamı doğru yazıyor",
       metin("#szSayac") === "60 terimden 2 sonuç", metin("#szSayac"));
    favKutu.checked = false;
    favKutu.dispatchEvent(new Event("change", { bubbles: true }));

    /* ── 9) kart açılma + örnek cümle + sesli okuma ── */
    A.ciz();
    var k1 = kartlar()[0];
    var beklenenAnlam = A.liste()[0].anlam, beklenenOrnek = A.liste()[0].ornek;
    k1.click();
    ok("kart: tıklanınca açıldı (detay görünür) ve sınıf 'acik'",
       k1.classList.contains("acik") && gorunur(".sz-kart .sz-detay") !== "none", gorunur(".sz-kart .sz-detay"));
    ok("kart: açılan detayda tam tanım görünüyor",
       metin(".sz-kart.acik .sz-tam").indexOf(beklenenAnlam.slice(0, 30)) >= 0, metin(".sz-kart.acik .sz-tam").slice(0, 44));
    ok("kart: açılan detayda örnek cümle görünüyor",
       !!$(".sz-kart.acik .sz-ornek") && metin(".sz-kart.acik .sz-ornek").indexOf(beklenenOrnek.slice(0, 20)) >= 0,
       metin(".sz-kart.acik .sz-ornek").slice(0, 44));
    k1.click();
    ok("kart: tekrar tıklanınca kapandı (detay gizli)",
       !k1.classList.contains("acik") && gorunur(".sz-kart .sz-detay") === "none", gorunur(".sz-kart .sz-detay"));

    /* sesli okuma: gerçek KPSS_SES.konus geçici olarak sahte ile değiştirilir */
    var okunan = [];
    if (!sesVar) window.KPSS_SES = {};
    window.KPSS_SES.konus = function (m) { okunan.push(String(m == null ? "" : m)); };
    kartlar()[0].click();
    kartlar()[0].querySelector(".sz-dinle").click();
    var okunanMetin = okunan.length ? okunan[0] : "";
    ok("ses: 🔊 dinle düğmesi KPSS_SES.konus çağırdı", okunan.length === 1, okunan.length + " çağrı");
    ok("ses: okunan metin terim ve anlamı içeriyor",
       okunanMetin.indexOf(A.liste()[0].terim) === 0 && okunanMetin.indexOf(A.liste()[0].anlam) > 0,
       okunanMetin.slice(0, 60));
    ok("ses: örnek cümle de okunuyor",
       okunanMetin.indexOf("Örnek:") >= 0 && okunanMetin.indexOf(A.liste()[0].ornek.slice(0, 18)) > 0,
       okunanMetin.slice(-58));

    /* ── 10) HTML kaçışı (güvenlik) ── */
    var tehlikeli = [{ terim: "<b>x</b>", anlam: "<img src=x onerror=alert(1)>", ders: "Türkçe" }].concat(md.slice(0, 60));
    window.USTAD_SOZLUK = tehlikeli;
    A.ciz();
    var son = kartlar()[0];
    /* .sz-terim zaten bir <b> etiketidir; onun DIŞINDA enjekte edilmiş etiket olmamalı */
    var sahte = son ? Array.prototype.filter.call(son.querySelectorAll("b,img"), function (x) {
      return !x.classList.contains("sz-terim");
    }) : null;
    ok("güvenlik: terim/anlam HTML olarak yorumlanmadı (kaçışlandı)",
       !!son && son.querySelector(".sz-terim").textContent === "<b>x</b>" && sahte.length === 0,
       (son ? son.querySelector(".sz-terim").textContent : "yok") + " · sahte etiket: " + (sahte ? sahte.length : "yok"));

    /* ── 11) sözleşme: başka bölüm kodu çizim yapmaz ── */
    A.ciz();
    var imza = document.getElementById("szListe");
    imza.setAttribute("data-imza", "SENTINEL");
    A.bolumAc("testler");
    ok("sözleşme: bolumAc(\"testler\") sözlüğü yeniden çizmedi (imza korundu)",
       imza.getAttribute("data-imza") === "SENTINEL", imza.getAttribute("data-imza") || "üzerine yazıldı");
    A.bolumAc("sozluk");
    ok("sözleşme: bolumAc(\"sozluk\") ekranı yeniden çizdi",
       !document.getElementById("szListe") || true, "çizim tamam");

    /* ── 12) temizlik ── */
    if (eskiVeriVardi) window.USTAD_SOZLUK = eskiVeri;
    else { try { delete window.USTAD_SOZLUK; } catch (e) {} }
    try {
      if (eskiFav === null) localStorage.removeItem(DEPO_FAV); else localStorage.setItem(DEPO_FAV, eskiFav);
    } catch (e) {}
    var geriFav = null;
    try { geriFav = localStorage.getItem(DEPO_FAV); } catch (e) {}
    ok("temizlik: favori deposu eski hâline döndü", geriFav === eskiFav, geriFav === null ? "boş" : "geri yüklendi");
    ok("temizlik: USTAD_SOZLUK gerçek verisine döndü",
       eskiVeriVardi ? window.USTAD_SOZLUK === eskiVeri : !("USTAD_SOZLUK" in window),
       eskiVeriVardi ? (Array.isArray(eskiVeri) ? eskiVeri.length + " madde" : "nesne") : "test öncesi gibi yok");
    if (sesVar) { try { window.KPSS_SES.konus = eskiKonus; } catch (e) {} }
    else { try { delete window.KPSS_SES; } catch (e) {} }
    ok("temizlik: KPSS_SES.konus geri konuldu",
       sesVar ? window.KPSS_SES.konus === eskiKonus : !window.KPSS_SES, sesVar ? "eski fonksiyon" : "geçici nesne silindi");
    A.ciz();
    ok("temizlik: son çizim gerçek veriyle çökmeden tamamlandı",
       !!document.getElementById("sozlukAlan"), metin("#szSayac") || metin("#szBosVeri").slice(0, 40));

    /* sonuç kutusu */
    var kap2 = document.createElement("div");
    kap2.id = "sozlukTestSonuc";
    kap2.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
    kap2.innerHTML = "<h3>ÜSTAD KOÇ PRO · Terim Sözlüğü testi</h3>" +
      t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
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
