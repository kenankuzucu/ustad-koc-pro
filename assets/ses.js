/* © 2026 Kenan Kuzucu · ÜSTAD KPSS-B KOÇ PRO · SES MOTORU + SESLİ DERSLER · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Bu dosya üç işi yapar:
     1) KONUŞMA: metni okunur hâle getirir (sayı/kısaltma/emoji), cümlelere böler, kadın/erkek sesi
        cihazın GERÇEK ses listesinden seçer (APK'da Java köprüsü, webde speechSynthesis).
     2) SES STÜDYOSU: Ayarlar içinde cihazdaki Türkçe sesleri dinletir, kadın/erkek sesi elle atatır.
     3) SESLİ DERSLER: ders notları + 2026 güncel bilgiler + soru çözümlerini sesli kitap gibi okur. */
(function () {
  "use strict";
  var S = window.KPSS_SES = window.KPSS_SES || {};

  /* ───────────── temel yardımcılar ───────────── */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function depoAl(k, v) {
    try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; }
  }
  function depoKoy(k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); } catch (e) {} }
  function cinsiyet() { var c = depoAl("cinsiyet", ""); return c === "kiz" ? "kiz" : "erkek"; }
  function kopru() { try { return (window.USTAD && window.USTAD.sesListesi) ? window.USTAD : null; } catch (e) { return null; } }

  /* ───────────── 1) METNİ OKUNUR HÂLE GETİR ───────────── */
  var BIRLER = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
  var ONLAR = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
  var BASAMAK = ["", "bin", "milyon", "milyar"];
  function ucBasamak(n) {
    var y = Math.floor(n / 100), k = n % 100, s = "";
    if (y === 1) s += "yüz"; else if (y > 1) s += BIRLER[y] + " yüz";
    var o = Math.floor(k / 10), b = k % 10;
    if (o > 0) s += (s ? " " : "") + ONLAR[o];
    if (b > 0) s += (s ? " " : "") + BIRLER[b];
    return s;
  }
  function sayiYazisi(n) {
    n = Math.floor(Math.abs(Number(n) || 0));
    if (n === 0) return "sıfır";
    var gruplar = [], i = 0;
    while (n > 0) { gruplar.push(n % 1000); n = Math.floor(n / 1000); i++; }
    var parcalar = [];
    for (var g = gruplar.length - 1; g >= 0; g--) {
      var v = gruplar[g];
      if (v === 0) continue;
      var ad = BASAMAK[g] || "";
      if (g === 1 && v === 1) parcalar.push("bin");
      else parcalar.push(ucBasamak(v) + (ad ? " " + ad : ""));
    }
    return parcalar.join(" ");
  }
  var KISALTMA = { "ösym": "Ö S Y M", "kpss": "K P S S", "dhbt": "D H B T", "tüik": "TÜİK", "brics": "briks",
    "cop31": "jop otuz bir", "g20": "ji yirmi", "nato": "nato", "bm": "B M", "ai": "yapay zekâ",
    "vs.": "vesaire", "vb.": "ve benzeri", "bkz.": "bakınız", "örn.": "örneğin", "yy.": "yüzyıl",
    "sn.": "saniye", "dk.": "dakika", "kg": "kilogram", "km": "kilometre", "tl": "T L" };

  /** "31,51" → "otuz bir virgül elli bir" · "86320" → "seksen altı bin üç yüz yirmi" */
  function sayiMetni(parca) {
    var s = String(parca).trim();
    var virgul = s.indexOf(",");
    if (virgul < 0) return sayiYazisi(s);
    var tam = s.slice(0, virgul), ondalik = s.slice(virgul + 1).replace(/0+$/, "");
    if (!ondalik) return sayiYazisi(tam);
    return sayiYazisi(tam) + " virgül " + ondalikOku(ondalik);
  }
  /** Metni konuşmaya hazırlar: emoji/simge atılır, sayı ve kısaltmalar okunur hâle gelir. */
  function metinHazirla(girdi) {
    var s = " " + String(girdi == null ? "" : girdi) + " ";
    s = s.replace(/&/g, " ve ").replace(/=/g, " eşittir ");              // önce simge sözleri
    s = s.replace(/%\s*([\d.,]+)/g, function (_m, x) { return " yüzde " + sayiMetni(x) + " "; });
    // binlik ayracı: 86.320.602 → 86320602 (4 tur, iç içe ayraçlar için)
    for (var tur = 0; tur < 4; tur++) s = s.replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2");
    s = s.replace(/(\d+),(\d+)/g, function (_m, a, b) { return " " + sayiYazisi(a) + " virgül " + ondalikOku(b) + " "; });
    s = s.replace(/(\d{1,3})\.(?=\s)/g, function (_m, a) { return " " + siraOku(Number(a)) + " "; });
    s = s.replace(/\b(\d{1,4})\s*[-–]\s*(\d{1,4})\b/g, function (_m, a, b) { return " " + sayiYazisi(a) + " " + sayiYazisi(b) + " "; });
    s = s.replace(/\d+/g, function (d) { return " " + sayiYazisi(d) + " "; });
    Object.keys(KISALTMA).forEach(function (k) {
      var re = new RegExp("(^|[^\\wçğıöşüÇĞİÖŞÜ])" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\wçğıöşüÇĞİÖŞÜ])", "gi");
      s = s.replace(re, "$1 " + KISALTMA[k] + " ");
    });
    // harf, rakam ve okunabilir noktalama dışındaki her şey (emoji, ok, kutu işareti) atılır
    s = s.replace(/[^\p{L}\p{N}\s.,;:!?'’()%+\-/]/gu, " ");
    s = s.replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1");
    return s.trim();
  }
  function ondalikOku(parca) {
    // 2 haneye kadar tam sayı gibi (51 → elli bir), daha uzunsa rakam rakam (125 → bir iki beş)
    var p = String(parca).replace(/^0+/, "");
    if (!p) return "sıfır";
    if (p.length <= 2) return sayiYazisi(p);
    return p.split("").map(function (d) { return BIRLER[Number(d)] || "sıfır"; }).join(" ");
  }
  function siraOku(n) {
    var s = sayiYazisi(n), ek = {"bir": "birinci", "iki": "ikinci", "üç": "üçüncü", "dört": "dördüncü",
      "beş": "beşinci", "altı": "altıncı", "yedi": "yedinci", "sekiz": "sekizinci", "dokuz": "dokuzuncu",
      "on": "onuncu", "yirmi": "yirminci", "otuz": "otuzuncu", "kırk": "kırkıncı", "elli": "ellinci",
      "altmış": "altmışıncı", "yetmiş": "yetmişinci", "seksen": "sekseninci", "doksan": "doksanıncı",
      "yüz": "yüzüncü", "bin": "bininci"}[s];
    return ek || (s + " inci");
  }
  /** Metni konuşma parçalarına böler: her cümle ayrı okunur (nefes durağı doğal olur),
      çok uzun cümleler kelime sınırından bölünür. */
  function cumlelereBol(metin, enFazla) {
    enFazla = enFazla || 200;
    var temiz = metinHazirla(metin);
    var cumleler = temiz.split(/(?<=[.!?;:])\s+/).map(function (c) { return c.trim(); }).filter(Boolean);
    if (!cumleler.length) cumleler = [temiz];
    var sonuc = [];
    cumleler.forEach(function (c) {
      if (c.length <= enFazla) { sonuc.push(c); return; }
      var kelimeler = c.split(" "), tampon = "";
      kelimeler.forEach(function (k) {
        if ((tampon + " " + k).trim().length > enFazla && tampon) { sonuc.push(tampon.trim()); tampon = k; }
        else tampon = (tampon + " " + k).trim();
      });
      if (tampon.trim()) sonuc.push(tampon.trim());
    });
    return sonuc.length ? sonuc : [temiz];
  }
  S.metinHazirla = metinHazirla;
  S.cumlelereBol = cumlelereBol;

  /* ───────────── 2) SES SEÇİMİ ───────────── */
  var KADIN_VARSAYILAN = ["filiz", "emel", "yelda", "ceren", "ipek", "aylin", "ayşe", "zeynep", "selin",
    "esra", "hande", "dilruba", "seda", "zira", "dilara", "melis", "female", "kadın", "kadin",
    "tr-tr-wavenet-a", "tr-tr-wavenet-c", "tr-tr-wavenet-d", "tr-tr-standard-a", "tr-tr-standard-c", "tr-tr-standard-d"];
  var ERKEK_VARSAYILAN = ["tolga", "ahmet", "cem", "barış", "mert", "kerem", "murat", "mustafa", "emre",
    "hakan", "serkan", "onur", "burak", "male", "erkek", "tr-tr-wavenet-b", "tr-tr-wavenet-e",
    "tr-tr-standard-b", "tr-tr-standard-e"];
  function sesListesi() {
    var liste = [];
    var k = kopru();
    if (k) {
      try {
        var ham = k.sesListesi();
        if (ham) liste = JSON.parse(ham);
      } catch (e) {}
    }
    if (!liste.length) {
      try {
        (window.speechSynthesis ? window.speechSynthesis.getVoices() : []).forEach(function (v) {
          if ((v.lang || "").toLowerCase().indexOf("tr") === 0) {
            var ad = (v.name || "").toLowerCase();
            liste.push({ ad: v.name, kadin: KADIN_VARSAYILAN.some(function (x) { return ad.indexOf(x) >= 0; }),
                         erkek: ERKEK_VARSAYILAN.some(function (x) { return ad.indexOf(x) >= 0; }), web: true });
          }
        });
      } catch (e) {}
    }
    return liste;
  }
  S.sesListesi = sesListesi;
  function adaGore(liste, cins) {
    var ipucu = cins === "kiz" ? KADIN_VARSAYILAN : ERKEK_VARSAYILAN;
    for (var i = 0; i < liste.length; i++) {
      var ad = (liste[i].ad || "").toLowerCase();
      if (cins === "kiz" && liste[i].kadin) return liste[i].ad;
      if (cins === "erkek" && liste[i].erkek) return liste[i].ad;
      for (var j = 0; j < ipucu.length; j++) if (ad.indexOf(ipucu[j]) >= 0) return liste[i].ad;
    }
    if (liste.length > 1) return cins === "kiz" ? liste[liste.length - 1].ad : liste[0].ad;
    return liste.length ? liste[0].ad : "";
  }
  function sesAdi(cins) {
    var elle = depoAl(cins === "kiz" ? "sesKadin" : "sesErkek", "");
    if (elle) return elle;
    var liste = sesListesi();
    return liste.length ? adaGore(liste, cins) : "";
  }
  function perdeHiz(cins) {
    var kadin = cins === "kiz";
    var perde = Number(depoAl(kadin ? "sesKadinPerde" : "sesErkekPerde", kadin ? 1.06 : 0.88));
    var hiz = Number(depoAl("sesHiz", 1.0));
    if (!(hiz > 0.5 && hiz < 1.6)) hiz = 1.0;
    // Karşı cinse ait ses elle atanmadıysa perde ile dengele (elle atandıysa perde 1'e yakın kalır)
    var elle = depoAl(kadin ? "sesKadin" : "sesErkek", "");
    if (elle) perde = kadin ? 1.0 : 0.96;
    return { perde: perde, hiz: hiz };
  }
  S.perdeHiz = perdeHiz;

  /* ───────────── 3) KONUŞMA MOTORU (cümle cümle, doğal duraklı) ───────────── */
  var kuyruk = null;   // { cumleler, i, hiz, perde, sesAdi, devam, sessiz }
  function suankiSes() { return { cins: cinsiyet(), ad: sesAdi(cinsiyet()), ph: perdeHiz(cinsiyet()) }; }
  S.durum = function () {
    var ph = perdeHiz(cinsiyet());
    return { cins: cinsiyet(), sesAdi: sesAdi(cinsiyet()), perde: ph.perde, hiz: ph.hiz,
             konusuyor: !!(kuyruk && kuyruk.devam), cumle: kuyruk ? kuyruk.i + 1 : 0,
             toplam: kuyruk ? kuyruk.cumleler.length : 0, kopru: !!kopru() };
  };
  function tekCumle(cumle, perde, hiz, ad) {
    var k = kopru();
    if (k) {
      try { if (k.konusSesli) { k.konusSesli(cumle, perde, hiz, ad || ""); return; } } catch (e) {}
      try { k.konusTon(cumle, perde, hiz); return; } catch (e) {}
    }
    try {
      var u = new SpeechSynthesisUtterance(cumle);
      u.lang = "tr-TR"; u.rate = hiz; u.pitch = perde;
      var v = sesListesi().filter(function (x) { return x.ad === ad && x.web; })[0];
      if (v) {
        var gercek = (window.speechSynthesis.getVoices() || []).filter(function (x) { return x.name === ad; })[0];
        if (gercek) u.voice = gercek;
      }
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  /* Cümleyi söyler ve BİTMESİNİ bekler: web'de onend, köprüde süre tahmini
     (cümle uzunluğu / saniyedeki karakter * hız). Bu sayede duraklat/ileri/geri çalışır. */
  function cumleSoyle(cumle, perde, hiz, ad) {
    return new Promise(function (bitir) {
      var k = kopru();
      if (k) {
        tekCumle(cumle, perde, hiz, ad);
        var ms = Math.max(700, Math.round(cumle.length / (13.5 * (hiz || 1)) * 1000) + 120);
        setTimeout(bitir, ms);
        return;
      }
      try {
        var u = new SpeechSynthesisUtterance(cumle);
        u.lang = "tr-TR"; u.rate = hiz; u.pitch = perde;
        var gercek = (window.speechSynthesis.getVoices() || []).filter(function (x) { return x.name === ad; })[0];
        if (gercek) u.voice = gercek;
        var bittiMi = false;
        u.onend = function () { if (!bittiMi) { bittiMi = true; bitir(); } };
        u.onerror = function () { if (!bittiMi) { bittiMi = true; bitir(); } };
        window.speechSynthesis.speak(u);
        setTimeout(function () { if (!bittiMi) { bittiMi = true; bitir(); } },
                   Math.max(1200, Math.round(cumle.length / (12 * (hiz || 1)) * 1000) + 400));
      } catch (e) { bitir(); }
    });
  }
  function durdur() {
    kuyruk = null;
    try { var k = kopru(); if (k && k.sus) k.sus(); } catch (e) {}
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }
  S.durdur = durdur;
  /** Metni cümlelere bölüp sırayla okur. gecikme: cümleler arası nefes durağı (ms). */
  S.konus = function (metin, secenek) {
    secenek = secenek || {};
    if (!depoAl("ses", true) && !secenek.zorla) return;
    if (!metin || !String(metin).trim()) return;
    durdur();
    var cumleler = secenek.cumleler || cumlelereBol(metin);
    var durumKopya = { cumleler: cumleler, i: 0, devam: true, gecikme: secenek.gecikme == null ? 170 : secenek.gecikme,
                       bitti: secenek.bitti || null, ilerleme: secenek.ilerleme || null,
                       dogal: depoAl("sesDogal", true) };
    kuyruk = durumKopya;
    var ph = perdeHiz(cinsiyet()), ad = sesAdi(cinsiyet());
    (function dongu() {
      if (!kuyruk || !kuyruk.devam || kuyruk !== durumKopya) return;
      if (durumKopya.i >= durumKopya.cumleler.length) {
        var b = durumKopya.bitti; kuyruk = null; if (b) b(); return;
      }
      var cumle = durumKopya.cumleler[durumKopya.i];
      // Doğallık: cümle başında hafif perde/hız oynaması (robotluk hissini kırar)
      var oynat = durumKopya.dogal ? (1 + ((durumKopya.i % 3) - 1) * 0.025) : 1;
      if (durumKopya.ilerleme) durumKopya.ilerleme(durumKopya.i, durumKopya.cumleler.length);
      cumleSoyle(cumle, ph.perde * oynat, Math.max(0.6, ph.hiz * (durumKopya.dogal ? (durumKopya.i % 2 ? 0.985 : 1.015) : 1)), ad)
        .then(function () {
          if (!kuyruk || kuyruk !== durumKopya || !durumKopya.devam) return;
          durumKopya.i++;
          setTimeout(dongu, durumKopya.gecikme);
        });
    })();
  };
  S.duraklat = function () { if (kuyruk) kuyruk.devam = false; durdur(); };

  /* ───────────── 4) SES STÜDYOSU (Ayarlar içi) ───────────── */
  var sesDenemeMetni = "Merhaba Kenan. Ben ÜSTAD sınav koçuyum. Bu sesle ders anlatacağım: konuları cümle cümle, nefes duraklarıyla okuyorum.";
  function studyoKur() {
    var kap = $("#sesStudyosu"); if (!kap || kap.getAttribute("data-kuruldu") === "1") return;
    kap.setAttribute("data-kuruldu", "1");
    kap.innerHTML =
      '<h3>🎙 Ses stüdyosu</h3>' +
      '<p class="aciklama">Cihazında kurulu <b>Türkçe</b> sesler aşağıda listelenir. Kız öğrenci için kadın, ' +
        'erkek öğrenci için erkek sesini seç — seçim kalıcı olarak kaydedilir. Cihazda yalnızca tek ses varsa ' +
        'Android Ayarlar → Diller ve giriş → Metin okuma → "Google konuşma hizmetleri" içinden Türkçe ses paketlerini indir.</p>' +
      '<div class="ses-satir"><b>Şu an:</b> <span id="sesDurum" class="ka-etiket">ölçülüyor…</span></div>' +
      '<div class="ses-satir"><b>Kadın sesi (kız öğrenci):</b> <span id="sesKadinAd" class="ka-etiket">otomatik</span>' +
        '<button class="ka-mini" id="sesKadinTemizle">otomatiğe dön</button></div>' +
      '<div class="ses-satir"><b>Erkek sesi (erkek öğrenci):</b> <span id="sesErkekAd" class="ka-etiket">otomatik</span>' +
        '<button class="ka-mini" id="sesErkekTemizle">otomatiğe dön</button></div>' +
      '<div class="ses-liste" id="sesListeAlan"></div>' +
      '<div class="ses-satir"><label class="cip"><input type="checkbox" id="sesDogalKutu"><span>Doğal konuşma (cümle cümle, nefes duraklı)</span></label></div>' +
      '<div class="ses-satir"><b>Hız:</b> <input type="range" id="sesHizAyar" min="0.7" max="1.3" step="0.05"> <span id="sesHizDeger" class="ka-etiket">1.0×</span></div>' +
      '<div class="ka-butonlar">' +
        '<button class="ka-dugme" id="sesTest">🔊 Seçili sesle dinle</button>' +
        '<button class="ka-dugme ka-ikincil" id="sesKizYap">👩 Kız öğrenci sesiyle konuş</button>' +
        '<button class="ka-dugme ka-ikincil" id="sesErkekYap">👨 Erkek öğrenci sesiyle konuş</button>' +
      '</div>';
    var dogal = depoAl("sesDogal", true);
    $("#sesDogalKutu").checked = dogal;
    $("#sesDogalKutu").addEventListener("change", function () {
      depoKoy("sesDogal", $("#sesDogalKutu").checked);
    });
    var hiz = Number(depoAl("sesHiz", 1.0));
    $("#sesHizAyar").value = hiz;
    $("#sesHizDeger").textContent = hiz.toFixed(2).replace(/0$/, "") + "×";
    $("#sesHizAyar").addEventListener("input", function () {
      var v = Number($("#sesHizAyar").value);
      depoKoy("sesHiz", v);
      $("#sesHizDeger").textContent = v.toFixed(2).replace(/0$/, "") + "×";
    });
    $("#sesTest").addEventListener("click", function () { S.konus(sesDenemeMetni, { zorla: true }); });
    $("#sesKizYap").addEventListener("click", function () { depoKoy("cinsiyet", "kiz"); S.konus(sesDenemeMetni, { zorla: true }); studyoYenile(); });
    $("#sesErkekYap").addEventListener("click", function () { depoKoy("cinsiyet", "erkek"); S.konus(sesDenemeMetni, { zorla: true }); studyoYenile(); });
    $("#sesKadinTemizle").addEventListener("click", function () { depoKoy("sesKadin", ""); studyoYenile(); });
    $("#sesErkekTemizle").addEventListener("click", function () { depoKoy("sesErkek", ""); studyoYenile(); });
    studyoYenile();
    // Cihaz ses listesi geç gelebilir (TTS kurulumu ~1 sn): 3 kez yenile
    [1200, 2600, 5000].forEach(function (ms) { setTimeout(studyoYenile, ms); });
  }
  function studyoYenile() {
    var kap = $("#sesListeAlan"); if (!kap) return;
    var liste = sesListesi();
    var k = depoAl("sesKadin", ""), e = depoAl("sesErkek", "");
    var d = S.durum();
    if ($("#sesDurum")) {
      $("#sesDurum").textContent = "kız→" + (k || d.cins === "kiz" ? (d.cins === "kiz" ? d.sesAdi : k || "otomatik") : "otomatik") +
        " · erkek→" + (e || "otomatik") + " · " + (d.kopru ? "cihaz motoru" : "tarayıcı sesi") +
        " · " + liste.length + " Türkçe ses";
    }
    if ($("#sesKadinAd")) $("#sesKadinAd").textContent = k || ("otomatik (" + (S.sesListesi().length ? "" : "") + ")");
    if ($("#sesErkekAd")) $("#sesErkekAd").textContent = e || "otomatik";
    if (!liste.length) {
      kap.innerHTML = '<p class="aciklama">Cihazda Türkçe ses bulunamadı. Android Ayarlar → Diller ve giriş → ' +
        'Metin okuma → Google konuşma hizmetleri → Türkçe ses verilerini indir.</p>';
      return;
    }
    kap.innerHTML = "<h4>Bulunan sesler</h4>" + liste.map(function (v, i) {
      var etiketK = v.kadin ? ' <span class="ka-etiket">kadın</span>' : (v.erkek ? ' <span class="ka-etiket">erkek</span>' : "");
      return '<div class="ses-ses"><b>' + kacis(v.ad) + "</b>" + etiketK +
        '<span class="ses-dugme-grup">' +
          '<button class="ka-mini" data-ses-dinle="' + i + '">🔊 dinle</button>' +
          '<button class="ka-mini" data-ses-kadin="' + i + '">👩 kadın yap</button>' +
          '<button class="ka-mini" data-ses-erkek="' + i + '">👨 erkek yap</button>' +
        "</span></div>";
    }).join("");
    $$("#sesListeAlan [data-ses-dinle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = liste[Number(b.getAttribute("data-ses-dinle"))];
        tekCumle(metinHazirla("Bu ses şöyle konuşuyor. Sınav koçunuz hazır."), 1.0, 1.0, v.ad);
      });
    });
    $$("#sesListeAlan [data-ses-kadin]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = liste[Number(b.getAttribute("data-ses-kadin"))];
        depoKoy("sesKadin", v.ad); depoKoy("cinsiyet", "kiz");
        try { var kk = kopru(); if (kk && kk.sesSec) kk.sesSec(v.ad); } catch (er) {}
        studyoYenile();
        S.konus("Bu sesi kız öğrenci için ayarladım.", { zorla: true });
      });
    });
    $$("#sesListeAlan [data-ses-erkek]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = liste[Number(b.getAttribute("data-ses-erkek"))];
        depoKoy("sesErkek", v.ad); depoKoy("cinsiyet", "erkek");
        try { var kk = kopru(); if (kk && kk.sesSec) kk.sesSec(v.ad); } catch (er) {}
        studyoYenile();
        S.konus("Bu sesi erkek öğrenci için ayarladım.", { zorla: true });
      });
    });
  }
  S.studyoKur = studyoKur;
  S.studyoYenile = studyoYenile;

  /* ───────────── 5) SESLİ DERSLER (sesli kitap) ───────────── */
  var calan = null;       // { kategori, parca, cumle, cumleler, durum }
  var uykuZaman = null;
  function dersler() { return (window.USTAD_NOTLAR && Object.keys(window.USTAD_NOTLAR).map(function (k) { return window.USTAD_NOTLAR[k]; })) || []; }
  function guncelMaddeler() { var g = window.KPSS_GUNCEL || window.GUNCEL || {}; return g.maddeler || []; }
  function ozgunSorular() { var c = window.KPSS_CIKMIS || window.CIKMIS || {}; return c.ozgun || []; }

  function sesliParcalar(kategori) {
    if (kategori === "notlar") {
      return dersler().map(function (d, i) {
        var p = [];
        p.push((d.ders ? d.ders + ". " : "") + "Ders " + (i + 1) + ": " + (d.baslik || ""));
        if (d.ozet) p.push("Özet. " + d.ozet);
        if (d.metin) p.push(d.metin);
        if (d.pufNoktalar && d.pufNoktalar.length) p.push("Püf noktaları. " + d.pufNoktalar.join(" "));
        if (d.sinavIpucu) p.push("Sınav ipucu. " + d.sinavIpucu);
        return { baslik: d.baslik || ("Ders " + (i + 1)), alt: d.ders || "", metin: p.join(" ") };
      });
    }
    if (kategori === "guncel") {
      return guncelMaddeler().map(function (m, i) {
        return { baslik: (i + 1) + ". " + (m.konu || "Güncel bilgi"), alt: m.tarih || "",
                 metin: m.bilgi + (m.kaynak_ad ? " Kaynak: " + m.kaynak_ad + "." : "") };
      });
    }
    return ozgunSorular().map(function (s, i) {
      var harf = "ABCDE";
      return { baslik: "Soru " + (i + 1) + " · " + (s.ders || ""), alt: s.konu || "",
               metin: s.soru + " Seçenekler: " + s.siklar.map(function (k, j) { return harf.charAt(j) + ") " + k; }).join(" ") +
                 " Doğru cevap " + harf.charAt(s.dogru) + ": " + s.siklar[s.dogru] + ". " + (s.aciklama || "") };
    });
  }
  S.sesliParcalar = sesliParcalar;

  function sureTahmini(metin, hiz) {
    var kelime = metin.split(/\s+/).length;
    return Math.max(1, Math.round(kelime / (140 * (hiz || 1)) * 60));
  }
  function dakika(y) { return Math.floor(y / 60) + ":" + (y % 60 < 10 ? "0" : "") + (y % 60); }

  S.bolumAc = function (kod) {
    if (kod === "sesli") sesliCiz();
    else if (kod === "ayarlar") studyoKur();
    if (kod !== "sesli") { calan = null; durdur(); if (uykuZaman) { clearTimeout(uykuZaman); uykuZaman = null; } }
  };

  function konumAl() { return depoAl("sesliKonum", null); }
  function konumKoy(k) { depoKoy("sesliKonum", k); }

  function sesliCiz() {
    var kap = $("#sesSesliAlan"); if (!kap) return;
    var kat = depoAl("sesliKat", "notlar");
    if (kat === "notlar" && !dersler().length) kat = "guncel";
    var parcalar = sesliParcalar(kat);
    var konum = konumAl();
    var d = S.durum();
    var toplamDk = Math.round(parcalar.reduce(function (a, p) { return a + sureTahmini(p.metin, 1); }, 0) / 60);
    kap.innerHTML =
      '<p class="aciklama">Dersler sesli kitap gibi okunur: kız öğrenci seçili ise kadın sesi, erkek öğrenci seçili ise erkek sesi. ' +
        'Metin okunmadan önce sayı/kısaltmalar düzeltilir; cümleler arasında nefes durağı bırakılır.</p>' +
      '<div class="ses-ust">' +
        '<span class="ka-etiket">ses: ' + (d.cins === "kiz" ? "👩 kız (kadın sesi)" : "👨 erkek sesi") + "</span>" +
        '<span class="ka-etiket">' + (d.kopru ? "cihaz Türkçe motoru" : "tarayıcı sesi") + "</span>" +
        '<span class="ka-etiket">' + parcalar.length + " bölüm · ~" + toplamDk + " dakika</span>" +
      "</div>" +
      '<div class="ka-butonlar">' +
        '<button class="ka-dugme ' + (kat === "notlar" ? "" : "ka-ikincil") + '" data-ses-kat="notlar">📚 Ders notları (' + sesliParcalar("notlar").length + ")</button>" +
        '<button class="ka-dugme ' + (kat === "guncel" ? "" : "ka-ikincil") + '" data-ses-kat="guncel">📰 Güncel bilgiler (' + sesliParcalar("guncel").length + ")</button>" +
        '<button class="ka-dugme ' + (kat === "sorular" ? "" : "ka-ikincil") + '" data-ses-kat="sorular">🧠 Soru çözümleri (' + sesliParcalar("sorular").length + ")</button>" +
      "</div>" +
      (konum ? '<div class="ka-butonlar"><button class="ka-dugme" id="sesDevam">▶ Kaldığın yerden devam: ' +
        kacis(konum.baslik || "bölüm " + (konum.parca + 1)) + " (" + (konum.cumle + 1) + ". cümle)</button></div>" : "") +
      '<div class="ses-oynatici" id="sesOynatici"></div>' +
      '<div class="ka-butonlar"><b>Uyku zamanlayıcı:</b>' +
        [10, 20, 30].map(function (dk) { return '<button class="ka-mini" data-ses-uyku="' + dk + '">' + dk + " dk</button>"; }).join("") +
        '<button class="ka-mini" data-ses-uyku="0">kapat</button>' +
        '<span class="ka-etiket" id="sesUykuDurum">kapalı</span>' +
      "</div>" +
      '<div class="ses-liste" id="sesParcaListe"></div>';
    $$("[data-ses-kat]").forEach(function (b) {
      b.addEventListener("click", function () { depoKoy("sesliKat", b.getAttribute("data-ses-kat")); calan = null; durdur(); sesliCiz(); });
    });
    $$("[data-ses-uyku]").forEach(function (b) {
      b.addEventListener("click", function () {
        var dk = Number(b.getAttribute("data-ses-uyku"));
        if (uykuZaman) { clearTimeout(uykuZaman); uykuZaman = null; }
        if (!dk) { $("#sesUykuDurum").textContent = "kapalı"; return; }
        $("#sesUykuDurum").textContent = dk + " dk sonra susacak";
        uykuZaman = setTimeout(function () { durdur(); $("#sesUykuDurum").textContent = "süre doldu, susuldu"; }, dk * 60000);
      });
    });
    if ($("#sesDevam")) $("#sesDevam").addEventListener("click", function () {
      var k = konumAl(); if (!k) return;
      depoKoy("sesliKat", k.kategori);
      if (k.kategori !== kat) { sesliCiz(); setTimeout(function () { bolumOynat(k.kategori, k.parca, k.cumle); }, 120); }
      else bolumOynat(k.kategori, k.parca, k.cumle);
    });
    $("#sesParcaListe").innerHTML = parcalar.map(function (p, i) {
      var dk = sureTahmini(p.metin, 1);
      return '<div class="ses-parca"><b>' + (i + 1) + ". " + kacis(p.baslik) + "</b>" +
        '<span class="ka-etiket">' + kacis(p.alt || "") + "</span>" +
        '<span class="ka-etiket">~' + dakika(dk) + "</span>" +
        '<span class="ses-dugme-grup"><button class="ka-mini" data-ses-oynat="' + i + '">▶ oku</button>' +
        '<button class="ka-mini" data-ses-ozet="' + i + '">📄 metni gör</button></span></div>';
    }).join("");
    $$("#sesParcaListe [data-ses-oynat]").forEach(function (b) {
      b.addEventListener("click", function () { bolumOynat(kat, Number(b.getAttribute("data-ses-oynat")), 0); });
    });
    $$("#sesParcaListe [data-ses-ozet]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = parcalar[Number(b.getAttribute("data-ses-ozet"))];
        var kap2 = $("#sesOynatici");
        kap2.innerHTML = "<h4>" + kacis(p.baslik) + "</h4><p class=\"ses-metin\">" + kacis(metinHazirla(p.metin)) + "</p>";
      });
    });
    if (calan && calan.kategori === kat) oynaticiCiz();
  }

  function bolumOynat(kategori, parca, cumle) {
    var parcalar = sesliParcalar(kategori);
    if (!parcalar[parca]) return;
    var cumleler = cumlelereBol(parcalar[parca].metin);
    calan = { kategori: kategori, parca: parca, cumle: Math.min(cumle || 0, cumleler.length - 1), cumleler: cumleler, durum: "caliyor" };
    depoKoy("sesliKat", kategori);
    oynaticiCiz();
    oku();
  }
  function oku() {
    if (!calan) return;
    var p = sesliParcalar(calan.kategori)[calan.parca];
    calan.durum = "caliyor";
    oynaticiCiz();
    var basla = calan.cumle;
    S.konus("", { cumleler: calan.cumleler.slice(basla), zorla: true,
      ilerleme: function (i) {
        if (!calan) return;
        calan.cumle = basla + i;
        konumKoy({ kategori: calan.kategori, parca: calan.parca, cumle: calan.cumle, baslik: p.baslik, zaman: Date.now() });
        oynaticiIlerlemeGuncelle();
      },
      bitti: function () {
        if (!calan) return;
        calan.durum = "bitti";
        oynaticiCiz();
        // sonraki bölüme kendiliğinden geç
        var parcalar = sesliParcalar(calan.kategori);
        if (calan.parca + 1 < parcalar.length) bolumOynat(calan.kategori, calan.parca + 1, 0);
      } });
  }

  function oynaticiCiz() {
    var kap = $("#sesOynatici"); if (!kap || !calan) return;
    var p = sesliParcalar(calan.kategori)[calan.parca];
    var yuzde = Math.round((calan.cumle / Math.max(1, calan.cumleler.length)) * 100);
    kap.innerHTML =
      '<h4>' + kacis(p.baslik) + "</h4>" +
      '<p class="aciklama">' + (calan.parca + 1) + ". bölüm · " + (calan.cumle + 1) + "/" + calan.cumleler.length + ". cümle · kayıtlı ilerleme %" + yuzde + "</p>" +
      '<div class="ses-cubuk"><i style="width:' + yuzde + '%"></i></div>' +
      '<p class="ses-cumle">' + kacis(calan.cumleler[calan.cumle]) + "</p>" +
      '<div class="ka-butonlar">' +
        '<button class="ka-dugme" id="sesDurak">' + (calan.durum === "caliyor" ? "⏸ Duraklat" : "▶ Devam") + "</button>" +
        '<button class="ka-dugme ka-ikincil" id="sesGeriCumle">⏮ Cümle</button>' +
        '<button class="ka-dugme ka-ikincil" id="sesIleriCumle">⏭ Cümle</button>' +
        '<button class="ka-dugme ka-ikincil" id="sesGeriBolum">◀ Bölüm</button>' +
        '<button class="ka-dugme ka-ikincil" id="sesIleriBolum">Bölüm ▶</button>' +
        '<button class="ka-dugme ka-ikincil" id="sesSus">⏹ Sus</button>' +
      "</div>";
    $("#sesDurak").addEventListener("click", function () {
      if (calan.durum === "caliyor") { calan.durum = "duraklatildi"; durdur(); oynaticiCiz(); }
      else { oku(); }
    });
    $("#sesGeriCumle").addEventListener("click", function () { calan.cumle = Math.max(0, calan.cumle - 1); durdur(); oku(); });
    $("#sesIleriCumle").addEventListener("click", function () { calan.cumle = Math.min(calan.cumleler.length - 1, calan.cumle + 1); durdur(); oku(); });
    $("#sesGeriBolum").addEventListener("click", function () { bolumOynat(calan.kategori, Math.max(0, calan.parca - 1), 0); });
    $("#sesIleriBolum").addEventListener("click", function () {
      var n = sesliParcalar(calan.kategori).length;
      bolumOynat(calan.kategori, Math.min(n - 1, calan.parca + 1), 0);
    });
    $("#sesSus").addEventListener("click", function () { durdur(); calan.durum = "duraklatildi"; oynaticiCiz(); });
  }
  function oynaticiIlerlemeGuncelle() {
    if (!calan) return;
    var k = $("#sesOynatici .ses-cumle"), y = $("#sesOynatici .ses-cubuk i"), e = $("#sesOynatici .aciklama");
    if (k) k.textContent = calan.cumleler[calan.cumle] || "";
    if (y) y.style.width = Math.round((calan.cumle / Math.max(1, calan.cumleler.length)) * 100) + "%";
    if (e) e.textContent = (calan.parca + 1) + ". bölüm · " + (calan.cumle + 1) + "/" + calan.cumleler.length + ". cümle";
  }

  /* ───────────── 6) kendi kendini test (?test=1) ───────────── */
  if (location.search.indexOf("test=1") >= 0) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        var t = [], ok = function (ad, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : "")); };
        ok("metin: 2026 yılı okunur", metinHazirla("2026").indexOf("iki bin yirmi altı") >= 0, metinHazirla("2026"));
        ok("metin: yüzde", /yüzde otuz bir virgül elli bir/.test(metinHazirla("%31,51")), metinHazirla("%31,51"));
        ok("metin: 86.320.602 → söz", /seksen altı milyon/.test(metinHazirla("86.320.602")), metinHazirla("86.320.602").slice(0, 60));
        ok("metin: emoji temizlenir", metinHazirla("⏳ ⏭ ✔").indexOf("⏳") < 0, metinHazirla("⏳ ⏭ ✔").slice(0, 40));
        ok("metin: kısaltma ÖSYM", /Ö S Y M/.test(metinHazirla("ÖSYM takvimi")), metinHazirla("ÖSYM takvimi"));
        ok("cümle: bölme", cumlelereBol("Bir. İki! Üç?").length === 3, JSON.stringify(cumlelereBol("Bir. İki! Üç?")));
        ok("cümle: uzun metin parçalanır", cumlelereBol("a ".repeat(400)).every(function (c) { return c.length <= 240; }));
        ok("ses: perde/hız kadın", perdeHiz("kiz").perde >= 1.0 && perdeHiz("kiz").hiz > 0, JSON.stringify(perdeHiz("kiz")));
        ok("ses: perde/hız erkek", perdeHiz("erkek").perde < 1.05 && perdeHiz("erkek").hiz > 0, JSON.stringify(perdeHiz("erkek")));
        ok("ses: liste (köprü ya da tarayıcı)", Array.isArray(sesListesi()), sesListesi().length + " ses");
        // bölüm çizimi
        sesliCiz();
        ok("sesli: bölüm listesi çizildi", $$("#sesParcaListe .ses-parca").length > 0, $$("#sesParcaListe .ses-parca").length + " bölüm");
        ok("sesli: oynat düğmesi", $$("#sesParcaListe [data-ses-oynat]").length === $$("#sesParcaListe .ses-parca").length);
        ok("sesli: kategori düğmeleri", $$("[data-ses-kat]").length === 3, $$("[data-ses-kat]").length + "");
        ok("sesli: ders sayısı", sesliParcalar("notlar").length >= 20, sesliParcalar("notlar").length + " ders");
        ok("sesli: güncel sayısı", sesliParcalar("guncel").length >= 20, sesliParcalar("guncel").length + " madde");
        ok("sesli: soru çözümü sayısı", sesliParcalar("sorular").length >= 30, sesliParcalar("sorular").length + " soru");
        var ilk = sesliParcalar("notlar")[0];
        ok("sesli: bölüm metni anlamlı", ilk.metin.length > 200, ilk.metin.length + " karakter");
        // oynatıcı (sessiz test: konuşma başlatılmaz, yalnız arayüz)
        calan = { kategori: "notlar", parca: 0, cumle: 0, cumleler: cumlelereBol(ilk.metin), durum: "duraklatildi" };
        oynaticiCiz();
        ok("oynatıcı: düğmeler var", $$("#sesOynatici .ka-dugme").length >= 6, $$("#sesOynatici .ka-dugme").length + " düğme");
        var cumleEl = $("#sesOynatici .ses-cumle");
        ok("oynatıcı: cümle yazısı", !!cumleEl && cumleEl.textContent.length > 5, cumleEl ? cumleEl.textContent.slice(0, 40) : "yok");
        ok("konum: kayıt anahtarı", typeof konumAl() === "object");
        // ayarlar > ses stüdyosu
        studyoKur();
        ok("stüdyo: liste alanı", !!$("#sesListeAlan"));
        ok("stüdyo: hız ayarı", !!$("#sesHizAyar"));
        ok("stüdyo: doğal kutu", !!$("#sesDogalKutu"));
        var kap = document.createElement("div");
        kap.id = "sesTestSonuc";
        kap.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
        kap.innerHTML = "<h3>KOÇ PRO · ses motoru testi</h3>" + t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
          "<hr><b>" + t.filter(function (x) { return x.indexOf("✔") === 0; }).length + " / " + t.length + " geçti</b>";
        document.body.appendChild(kap);
        document.title = "SESTEST " + t.filter(function (x) { return x.indexOf("✔") === 0; }).length + "/" + t.length;
      }, 500);
    });
  }
})();
