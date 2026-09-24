/* © 2026 Kenan Kuzucu · ÜSTAD KPSS-B KOÇ PRO · ÇALIŞMA ARAÇLARI eklentisi · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   İçindekiler:
     1) POMODORO  : 25 dk çalışma / 5 dk mola, 4 turda 15 dk uzun mola · geri sayım halkası · günlük kayıt
     2) YEDEKLEME : ustad.* localStorage kayıtlarını tek JSON dosyasına indir / dosyadan doğrulayarak geri yükle
     3) GÜNLÜK 5 SORU : tarihten türeyen sabit tohum → gün içinde hep aynı 5 soru · seri + doğru sayısı
   Bu dosya AYRI bir uygulama değildir: index.html ve motor.js'e DOKUNMADAN kendi ekranını kurar
   (<section id="ekran-araclar-ekstra" class="ekran" data-bolum="araclar-ekstra">) ve menüye kendi öğesini ekler.
   Dışa açılan tek nesne: window.ARAC_EK  ·  Sözleşme: ARAC_EK.bolumAc("araclar-ekstra") */
(function () {
  "use strict";

  var AE = window.ARAC_EK = window.ARAC_EK || {};
  var KOD = "araclar-ekstra";
  var ONEK = "ustad.";                       /* yedeklenen tüm anahtarların ortak öneki */
  var POM_ANAHTAR = "ustad.pomodoro";
  var G5_ANAHTAR = "ustad.gunluk5";

  /* Süreler (saniye) — değiştirmek istersen yalnız burayı değiştir */
  var SURE = { calisma: 25 * 60, mola: 5 * 60, uzunMola: 15 * 60, turHedef: 4 };

  /* ───────────── temel yardımcılar ───────────── */
  function $(s, kok) { return (kok || document).querySelector(s); }
  function $$(s, kok) { return Array.prototype.slice.call((kok || document).querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function iki(n) { return n < 10 ? "0" + n : "" + n; }
  function depoAl(k, v) {
    try { var s = localStorage.getItem(k); return s === null ? v : JSON.parse(s); } catch (e) { return v; }
  }
  function depoKoy(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }
  function baytYazi(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (Math.round(n / 102.4) / 10) + " KB";
    return (Math.round(n / 104857.6) / 10) + " MB";
  }
  function gunAnahtar(t) {
    t = t || new Date();
    return t.getFullYear() + "-" + iki(t.getMonth() + 1) + "-" + iki(t.getDate());
  }
  function gunTarih(gunStr) {                       /* "2026-09-24" → yerel Date */
    var p = String(gunStr || "").split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function gunKaydir(gunStr, fark) {
    var t = gunTarih(gunStr);
    if (isNaN(t.getTime())) t = new Date();
    t.setDate(t.getDate() + fark);
    return gunAnahtar(t);
  }
  /* Sesi konuş: önce uygulamanın ses motoru (KPSS_SES), yoksa tarayıcı motoru. */
  function konus(metin) {
    try {
      if (window.KPSS_SES && typeof window.KPSS_SES.konus === "function") { window.KPSS_SES.konus(metin); return "kpss_ses"; }
    } catch (e) {}
    try {
      if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
        var u = new SpeechSynthesisUtterance(metin);
        u.lang = "tr-TR"; u.rate = 0.98;
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
        return "tarayici";
      }
    } catch (e) {}
    return "yok";
  }
  function ekranBildir(metin, tur) {
    var kap = $("#aeBildirim");
    if (!kap) return;
    kap.className = "ae-bildirim" + (tur ? " " + tur : "");
    kap.innerHTML = "<b>" + (tur === "kotu" ? "⛔" : tur === "iyi" ? "✔" : "🔔") + " " + kacis(metin) + "</b>";
    kap.setAttribute("data-zaman", String(Date.now()));
  }
  /* İşletim sistemi bildirimi (varsa) — bloklamaz, izin yoksa sessizce atlanır. */
  function sistemBildir(baslik, metin) {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(baslik, { body: metin });
        return true;
      }
    } catch (e) {}
    return false;
  }

  /* ═════════════════════ EKRAN KABI (kendi kendini kurar) ═════════════════════ */
  function kabuk() { return document.getElementById("ekran-" + KOD); }
  function kabukKur() {
    var s = kabuk();
    if (s) return s;
    s = document.createElement("section");
    s.id = "ekran-" + KOD;
    s.className = "ekran";
    s.setAttribute("data-bolum", KOD);
    s.innerHTML = '<h2 class="sayfa-baslik">🧰 Çalışma Araçları</h2>' +
      '<div class="kart" id="aeBildirimKart" style="padding:10px 14px">' +
        '<div id="aeBildirim" class="ae-bildirim">Araçlar hazır: pomodoro, yedekleme ve günlük 5 soru.</div>' +
      '</div>' +
      '<div class="kart" id="aracEkAlan"></div>';
    document.body.appendChild(s);
    return s;
  }
  /* Menüye kendi öğesini ekler — motor.js'in menüsü değiştirilmeden.
     motor.js sonradan bölümü kendisi listelerse çift öğe oluşmasın diye önce arar. */
  function menuEkle() {
    var kap = $(".menu-icerik");
    if (!kap) return false;
    if ($('.menu-oge[data-git="' + KOD + '"]')) return true;
    var b = document.createElement("button");
    b.className = "menu-oge";
    b.setAttribute("data-git", KOD);
    b.setAttribute("data-ae-menu", "1");
    b.style.setProperty("--bolum", "var(--aracek)");
    b.innerHTML = "<span class='simg-renk'>🧰</span><span class='etiket'>Çalışma Araçları</span>" +
      "<span class='rozet'>pomodoro</span>";
    b.addEventListener("click", function () { git(KOD); });
    kap.appendChild(b);
    return true;
  }
  /* Motor varsa onun yönlendirmesini kullan (menü seçimi + body rengi doğru olsun diye). */
  function git(kod) {
    var motor = window.USTAD_MOTOR || window.USTAD_CEKIRDEK;
    if (motor && typeof motor.git === "function") {
      try { motor.git(kod); } catch (e) {}
    } else {
      $$(".ekran").forEach(function (e) { e.classList.remove("acik"); });
      var h = document.getElementById("ekran-" + kod);
      if (h) h.classList.add("acik");
      $$(".menu-oge").forEach(function (o) { o.classList.toggle("secili", o.getAttribute("data-git") === kod); });
      document.body.setAttribute("data-bolum", kod);
    }
    if (kod === KOD) ciz();
  }
  /* motor.js'in git() fonksiyonu bölümü tanımıyorsa ekranı yine de açar. */
  var baslangicZamani = Date.now();

  /* ═════════════════════ 1) POMODORO ═════════════════════ */
  var pom = { evre: "calisma", kalan: SURE.calisma, tamamlananTur: 0, calisiyor: false };
  var pomZaman = null;
  AE.pomodoro = pom;
  AE.pomodoroSure = SURE;

  function pomKayit() {                                   /* { surum, gunler:{ "2026-09-24": saniye }, toplam } */
    var d = depoAl(POM_ANAHTAR, null);
    if (!d || typeof d !== "object" || !d.gunler || typeof d.gunler !== "object") d = { surum: 1, gunler: {} };
    if (!d.surum) d.surum = 1;
    return d;
  }
  function pomToplam(d) {
    var t = 0;
    Object.keys(d.gunler || {}).forEach(function (k) { t += Number(d.gunler[k]) || 0; });
    return t;
  }
  function gunDakika(gunStr, d) {
    d = d || pomKayit();
    var s = Number((d.gunler || {})[gunStr || gunAnahtar()]) || 0;
    return Math.round(s / 60);
  }
  function pomEkle(saniye) {
    if (!(saniye > 0)) return pomKayit();
    var d = pomKayit(), g = gunAnahtar();
    d.gunler[g] = (Number(d.gunler[g]) || 0) + saniye;
    d.toplam = pomToplam(d);
    d.sonGuncelleme = new Date().toISOString();
    depoKoy(POM_ANAHTAR, d);
    return d;
  }
  function son7Gun(d) {
    d = d || pomKayit();
    var g = gunAnahtar(), liste = [];
    for (var i = 6; i >= 0; i--) {
      var k = gunKaydir(g, -i);
      liste.push({ gun: k, saniye: Number((d.gunler || {})[k]) || 0, dakika: Math.round((Number((d.gunler || {})[k]) || 0) / 60) });
    }
    return liste;
  }
  AE.gunDakika = gunDakika;
  AE.son7Gun = son7Gun;
  AE.pomodoroKayit = pomKayit;

  function evreYazi(evre) {
    return evre === "calisma" ? "ÇALIŞMA" : evre === "mola" ? "KISA MOLA" : "UZUN MOLA";
  }
  function sureYazi(sn) {
    sn = Math.max(0, Math.floor(sn));
    var dk = Math.floor(sn / 60);
    if (dk >= 60) return Math.floor(dk / 60) + ":" + iki(dk % 60) + ":" + iki(sn % 60);
    return iki(dk) + ":" + iki(sn % 60);
  }
  AE.sureYazi = sureYazi;

  /* Evre bitti: mola/çalışma geçişi + sesli uyarı + ekranda bildirim */
  function pomBitir() {
    var kalinan = pom.evre, tur = pom.tamamlananTur;
    if (kalinan === "calisma") {
      pom.tamamlananTur = tur + 1;
      if (pom.tamamlananTur % SURE.turHedef === 0) {
        pom.evre = "uzunMola"; pom.kalan = SURE.uzunMola;
        konus("Uzun mola zamanı, " + (SURE.uzunMola / 60) + " dakika dinlen.");
        ekranBildir(pom.tamamlananTur + ". tur tamam! Uzun mola başladı (" + (SURE.uzunMola / 60) + " dk).", "iyi");
        sistemBildir("ÜSTAD KOÇ PRO · Uzun mola", pom.tamamlananTur + ". tur tamamlandı, " + (SURE.uzunMola / 60) + " dakika mola.");
      } else {
        pom.evre = "mola"; pom.kalan = SURE.mola;
        konus("Mola zamanı");
        ekranBildir("Tebrikler, tur tamam! Kısa mola başladı (" + (SURE.mola / 60) + " dk).", "iyi");
        sistemBildir("ÜSTAD KOÇ PRO · Mola zamanı", pom.tamamlananTur + ". tur tamamlandı.");
      }
    } else {
      pom.evre = "calisma"; pom.kalan = SURE.calisma;
      konus("Çalışma zamanı");
      ekranBildir("Mola bitti. Yeni çalışma turu başlıyor (" + (SURE.calisma / 60) + " dk).");
      sistemBildir("ÜSTAD KOÇ PRO · Çalışma zamanı", "Mola bitti, yeni tur başlıyor.");
    }
    pom.calisiyor = false;
    pomDur();
    pomCiz();
  }
  AE.pomBitir = pomBitir;

  /* Saniye saniye ilerlet. adet > 1 verilirse (test/ölçüm) hızlı ilerletir. */
  function tikle(adet) {
    adet = adet || 1;
    var sayac = 0;
    while (sayac < adet) {
      if (!pom.calisiyor) break;
      sayac++;
      if (pom.evre === "calisma") pomEkle(1);
      pom.kalan--;
      if (pom.kalan <= 0) { pomBitir(); break; }
      if (sayac % 5 === 0) pomCiz();       /* halkanın akıcı görünmesi için ara tazeleme */
    }
    if (sayac) pomCiz();
    return sayac;
  }
  AE.pomodoroTikle = tikle;
  function pomZamanla() {
    if (pomZaman) clearInterval(pomZaman);
    pomZaman = setInterval(function () { tikle(1); }, 1000);
    return pomZaman;
  }
  function pomDur() { if (pomZaman) { clearInterval(pomZaman); pomZaman = null; } }
  AE.pomodoroBaslat = function () {
    if (pom.kalan <= 0) pom.kalan = pom.evre === "calisma" ? SURE.calisma : SURE.mola;
    pom.calisiyor = true;
    pomZamanla();
    pomCiz();
    ekranBildir(evreYazi(pom.evre) + " başladı · " + sureYazi(pom.kalan) + " (" + (pom.tamamlananTur + 1) + ". tur).");
    return pom;
  };
  AE.pomodoroDuraklat = function () {
    pom.calisiyor = false;
    pomDur();
    pomCiz();
    ekranBildir("Sayacı duraklattın · kalan " + sureYazi(pom.kalan) + ".");
    return pom;
  };
  AE.pomodoroSifirla = function () {
    pom.calisiyor = false; pomDur();
    pom.evre = "calisma"; pom.kalan = SURE.calisma; pom.tamamlananTur = 0;
    pomCiz();
    ekranBildir("Pomodoro sıfırlandı: 1. tur, 25 dk çalışma.");
    return pom;
  };
  AE.pomodoroDurum = function () {
    return { evre: pom.evre, kalan: pom.kalan, tamamlananTur: pom.tamamlananTur,
             calisiyor: pom.calisiyor, yazi: evreYazi(pom.evre), kalanYazi: sureYazi(pom.kalan) };
  };

  var CEVRE = 2 * Math.PI * 88;   /* halka çevresi (r=88) */
  function pomCiz() {
    var s = $("#aeSayac");
    if (s) s.textContent = sureYazi(pom.kalan);
    var e = $("#aeEvre");
    if (e) e.textContent = evreYazi(pom.evre) + " · " + (pom.tamamlananTur + 1) + ". TUR";
    var h = $("#aeRing");
    if (h) {
      var toplam = pom.evre === "calisma" ? SURE.calisma : (pom.evre === "mola" ? SURE.mola : SURE.uzunMola);
      var oran = Math.max(0, Math.min(1, pom.kalan / toplam));
      h.setAttribute("stroke-dasharray", String(Math.round(CEVRE * 1000) / 1000));
      h.setAttribute("stroke-dashoffset", String(Math.round(CEVRE * (1 - oran) * 1000) / 1000));
      h.setAttribute("data-oran", String(Math.round(oran * 100) / 100));
    }
    var b = $("#aePomBal");
    if (b) { b.textContent = pom.calisiyor ? "⏸ Duraklat" : "▶ Başlat"; b.className = "ka-dugme" + (pom.calisiyor ? " ka-ikincil" : ""); }
    var k = $("#aePomKutu");
    if (k) k.setAttribute("data-durum", pom.calisiyor ? "calisiyor" : "durdu");
    var tur = $("#aeTurNokta");
    if (tur) {
      var h2 = "";
      for (var i = 1; i <= SURE.turHedef; i++) {
        h2 += '<i class="' + (i <= pom.tamamlananTur % SURE.turHedef || (pom.tamamlananTur > 0 && pom.tamamlananTur % SURE.turHedef === 0 && i <= SURE.turHedef) ? "dolu" : "") + '"></i>';
      }
      tur.innerHTML = h2;
    }
  }
  AE.pomCiz = pomCiz;

  function kayitCiz() {
    var d = pomKayit(), g = gunAnahtar();
    var bugun = gunDakika(g, d), toplam = Math.round(pomToplam(d) / 60);
    var b = $("#aePomBugun"); if (b) b.textContent = bugun;
    var t = $("#aePomToplam"); if (t) t.textContent = toplam;
    var akt = $("#aePomAktif"); if (akt) akt.textContent = Object.keys(d.gunler || {}).length;
    var kap = $("#aeGrafik");
    if (!kap) return;
    var liste = son7Gun(d), enBuyuk = Math.max.apply(null, liste.map(function (x) { return x.dakika; }).concat([1]));
    var haftaBos = liste.every(function (x) { return x.dakika === 0; });
    kap.innerHTML = liste.map(function (x, i) {
      var yuzde = Math.round(x.dakika / enBuyuk * 100);
      return '<div class="ae-cubuk' + (x.gun === g ? " bugun" : "") + '" data-gun="' + x.gun + '">' +
        '<b>' + (x.dakika ? x.dakika : "") + "</b><i style=\"height:" + Math.max(x.dakika ? 8 : 2, yuzde) + '%"></i>' +
        '<span>' + gunTarih(x.gun).toLocaleDateString("tr-TR", { weekday: "short" }) + "</span></div>";
    }).join("");
    var ipucu = $("#aeGrafikIpucu");
    if (ipucu) ipucu.textContent = haftaBos ? "Bu hafta kayıt yok — ▶ Başlat'a bas, çalıştığın süre gün gün burada birikir." : "";
  }
  AE.kayitCiz = kayitCiz;

  function pomodoroCiz() {
    var kap = $("#aePomAlan");
    if (!kap) return;
    kap.innerHTML =
      '<div class="ae-pom">' +
        '<div class="ae-ring" id="aePomKutu">' +
          '<svg viewBox="0 0 200 200" aria-hidden="true">' +
            '<circle class="ae-ring-arka" cx="100" cy="100" r="88"></circle>' +
            '<circle class="ae-ring-one" id="aeRing" cx="100" cy="100" r="88"></circle>' +
          "</svg>" +
          '<div class="ae-ring-icerik"><b id="aeSayac">' + sureYazi(pom.kalan) + "</b>" +
            '<span id="aeEvre">' + evreYazi(pom.evre) + " · " + (pom.tamamlananTur + 1) + ". TUR</span>" +
            '<em class="ae-tur-nokta" id="aeTurNokta"></em>' +
          "</div>" +
        "</div>" +
        '<div class="ae-pom-yan">' +
          '<p class="aciklama">Pomodoro: <b>25 dk çalışma</b>, <b>5 dk mola</b>, her <b>4 turda 15 dk uzun mola</b>. ' +
            "Süre bitince sesli uyarı verilir; çalıştığın süre gün gün kaydedilir.</p>" +
          '<div class="ka-butonlar">' +
            '<button class="ka-dugme" id="aePomBal">' + (pom.calisiyor ? "⏸ Duraklat" : "▶ Başlat") + "</button>" +
            '<button class="ka-dugme ka-ikincil" id="aePomSifir">↺ Sıfırla</button>' +
            '<button class="ka-dugme ka-ikincil" id="aePomAtla">⏭ Bu evreyi bitir</button>' +
            '<button class="ka-dugme ka-ikincil" id="aePomOku">🔊 Durumu oku</button>' +
          "</div>" +
          '<div class="ae-kutular">' +
            '<div class="ae-kutu"><b id="aePomBugun">0</b><span>BUGÜN DK</span></div>' +
            '<div class="ae-kutu"><b id="aePomToplam">0</b><span>TOPLAM DK</span></div>' +
            '<div class="ae-kutu"><b id="aePomAktif">0</b><span>KAYITLI GÜN</span></div>' +
          "</div>" +
          '<h4 class="ae-alt-baslik">Son 7 gün çalışma (dakika)</h4>' +
          '<div class="ae-grafik" id="aeGrafik"></div>' +
          '<p class="aciklama" id="aeGrafikIpucu"></p>' +
        "</div>" +
      "</div>";
    $("#aePomBal").addEventListener("click", function () { if (pom.calisiyor) AE.pomodoroDuraklat(); else AE.pomodoroBaslat(); });
    $("#aePomSifir").addEventListener("click", function () { AE.pomodoroSifirla(); });
    $("#aePomAtla").addEventListener("click", function () {
      pom.kalan = 0; pomBitir();
    });
    $("#aePomOku").addEventListener("click", function () {
      konus(evreYazi(pom.evre) + ". Kalan süre " + sureYazi(pom.kalan).replace(":", " dakika ") + " saniye. " +
        "Bugün " + gunDakika() + " dakika çalıştın.");
    });
    pomCiz(); kayitCiz();
  }

  /* ═════════════════════ 2) YEDEKLEME ═════════════════════ */
  function ustadAnahtarlari() {
    var liste = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(ONEK) === 0) liste.push(k);
      }
    } catch (e) {}
    return liste.sort();
  }
  AE.ustadAnahtarlari = ustadAnahtarlari;

  /* Kayıt listesi: anahtar + boyut + kısa içerik özeti */
  function kayitListesi() {
    return ustadAnahtarlari().map(function (k) {
      var ham = "";
      try { ham = localStorage.getItem(k) || ""; } catch (e) { ham = ""; }
      var ozet = ham.slice(0, 60).replace(/\s+/g, " ");
      var kayitSayisi = null;
      try {
        var p = JSON.parse(ham);
        if (Array.isArray(p)) kayitSayisi = p.length;
        else if (p && typeof p === "object") kayitSayisi = Object.keys(p).length;
      } catch (e) { kayitSayisi = -1; }      /* JSON değil — yine de yedeklenir */
      return { anahtar: k, bayt: ham.length, yazi: baytYazi(ham.length), kayitSayisi: kayitSayisi, ozet: ozet };
    });
  }
  AE.kayitListesi = kayitListesi;

  AE.yedekAdi = function (t) {
    var d = t || new Date();
    return "USTAD-KOC-PRO-YEDEK-" + d.getFullYear() + "-" + iki(d.getMonth() + 1) + "-" + iki(d.getDate()) + ".json";
  };
  AE.yedekTopla = function () {
    var anahtarlar = {};
    ustadAnahtarlari().forEach(function (k) {
      try { anahtarlar[k] = localStorage.getItem(k); } catch (e) {}
    });
    return { surum: 1, uygulama: "ÜSTAD KPSS-B KOÇ PRO", tarih: new Date().toISOString(),
             anahtarSayisi: Object.keys(anahtarlar).length, anahtarlar: anahtarlar };
  };
  AE.yedekMetni = function () { return JSON.stringify(AE.yedekTopla(), null, 2); };

  /* Doğrulama: geçerli JSON mu, surum alanı var mı, kaç anahtar içeriyor */
  AE.yedekDogrula = function (metin) {
    if (typeof metin !== "string" || !metin.trim()) return { gecerli: false, hata: "Dosya boş." };
    var v;
    try { v = JSON.parse(metin); }
    catch (e) { return { gecerli: false, hata: "Geçerli JSON değil: " + (e.message || "okuma hatası") }; }
    if (!v || typeof v !== "object" || Array.isArray(v)) return { gecerli: false, hata: "Kök alan bir nesne değil." };
    if (v.surum == null) return { gecerli: false, hata: "surum alanı yok — bu dosya ÜSTAD yedeği değil." };
    if (!v.anahtarlar || typeof v.anahtarlar !== "object" || Array.isArray(v.anahtarlar))
      return { gecerli: false, hata: "anahtarlar alanı yok ya da nesne değil." };
    var gecerliAnahtar = {}, atlanan = 0;
    Object.keys(v.anahtarlar).forEach(function (k) {
      if (k.indexOf(ONEK) !== 0) { atlanan++; return; }             /* güvenlik: yalnız ustad.* yazılır */
      if (typeof v.anahtarlar[k] !== "string") { atlanan++; return; }
      gecerliAnahtar[k] = v.anahtarlar[k];
    });
    var sayi = Object.keys(gecerliAnahtar).length;
    if (!sayi) return { gecerli: false, hata: "Dosyada ustad.* anahtarı yok (atlanan: " + atlanan + ")." };
    var boyut = 0;
    Object.keys(gecerliAnahtar).forEach(function (k) { boyut += gecerliAnahtar[k].length; });
    return { gecerli: true, surum: v.surum, tarih: v.tarih || "", uygulama: v.uygulama || "",
             anahtarSayisi: sayi, atlanan: atlanan, bayt: boyut, yazi: baytYazi(boyut), anahtarlar: gecerliAnahtar };
  };

  /* Geri yükleme: yalnız açık onayla yazılır (dosya okunur okunmaz üzerine YAZILMAZ). */
  AE.geriYukleUygula = function (dogrulama, onaylandi) {
    if (!onaylandi) return { ok: false, hata: "Onay verilmedi — geri yükleme yapılmadı." };
    if (!dogrulama || !dogrulama.gecerli) return { ok: false, hata: "Doğrulanmamış veri geri yüklenemez." };
    var yazilan = 0, atlanan = 0;
    Object.keys(dogrulama.anahtarlar).forEach(function (k) {
      if (k.indexOf(ONEK) !== 0) { atlanan++; return; }
      try { localStorage.setItem(k, dogrulama.anahtarlar[k]); yazilan++; } catch (e) { atlanan++; }
    });
    AE.yedekSonYukleme = { zaman: Date.now(), yazilan: yazilan, atlanan: atlanan, tarih: dogrulama.tarih };
    return { ok: true, yazilan: yazilan, atlanan: atlanan };
  };

  function yedekIndir() {
    var metin = AE.yedekMetni(), ad = AE.yedekAdi();
    var sonuc = { ok: false, ad: ad, boyut: metin.length };
    try {
      var b = new Blob([metin], { type: "application/json" });
      var u = URL.createObjectURL(b);
      var a = document.createElement("a");
      a.href = u; a.download = ad; a.rel = "noopener"; a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { try { URL.revokeObjectURL(u); a.parentNode.removeChild(a); } catch (e) {} }, 5000);
      sonuc.ok = true;
    } catch (e) {
      sonuc.hata = e.message || "indirme desteklenmiyor";
    }
    var kap = $("#aeYedekSonuc");
    if (kap) {
      kap.className = "ae-sonuc " + (sonuc.ok ? "iyi" : "kotu");
      kap.innerHTML = "<b>" + (sonuc.ok ? "✔ Yedek indirildi: " : "✘ İndirme başarısız: ") + kacis(ad) + "</b>" +
        "<p class=\"aciklama\">" + AE.yedekTopla().anahtarSayisi + " anahtar · " + baytYazi(sonuc.boyut) +
        (sonuc.ok ? " · İndirilenler klasörüne bak." : " · Hata: " + kacis(sonuc.hata || "") +
         " — aşağıdaki metni elle kopyalayıp saklayabilirsin.") + "</p>";
      var det = $("#aeYedekMetinKutu");
      if (det) { det.value = metin; det.style.display = sonuc.ok ? "none" : "block"; }
    }
    return sonuc;
  }
  AE.yedekIndir = yedekIndir;

  var bekleyenYedek = null;
  function dosyaOkundu(metin, dosyaAdi) {
    var d = AE.yedekDogrula(metin);
    bekleyenYedek = d;
    var kap = $("#aeGeriOnay");
    if (!kap) return d;
    if (!d.gecerli) {
      kap.className = "ae-sonuc kotu";
      kap.innerHTML = "<b>✘ Bu dosya yedek olarak kabul edilmedi.</b><p class=\"aciklama\">" + kacis(d.hata) + "</p>";
      var b2 = $("#aeGeriUygula"); if (b2) b2.disabled = true;
      return d;
    }
    kap.className = "ae-sonuc";
    kap.innerHTML =
      "<b>✔ Dosya doğrulandı: " + kacis(dosyaAdi || "yedek.json") + "</b>" +
      "<ul class=\"ae-liste\">" +
        "<li>sürüm: <b>" + kacis(String(d.surum)) + "</b>" + (d.uygulama ? " · " + kacis(d.uygulama) : "") + "</li>" +
        "<li>yedek tarihi: <b>" + (d.tarih ? kacis(new Date(d.tarih).toLocaleString("tr-TR")) : "belirtilmemiş") + "</b></li>" +
        "<li>geri yüklenecek kayıt: <b>" + d.anahtarSayisi + " anahtar</b> · " + d.yazi +
          (d.atlanan ? " · atlanan (uygunsuz): " + d.atlanan : "") + "</li>" +
        "<li>anahtarlar: " + Object.keys(d.anahtarlar).map(function (k) { return "<code>" + kacis(k) + "</code>"; }).join(", ") + "</li>" +
      "</ul>" +
      "<p class=\"aciklama\">Geri yükleme mevcut kayıtların <b>üzerine yazar</b>. Onaylıyor musun? " +
        "(Önce mevcut durumun yedeğini alman önerilir.)</p>";
    var b = $("#aeGeriUygula");
    if (b) b.disabled = false;
    return d;
  }
  AE.dosyaOkundu = dosyaOkundu;
  AE.geriYukleOnayla = function () {
    if (!bekleyenYedek) return { ok: false, hata: "Önce bir yedek dosyası seç." };
    var s = AE.geriYukleUygula(bekleyenYedek, true);
    if (s.ok) {
      ekranBildir(s.yazilan + " kayıt geri yüklendi (" + (s.atlanan ? s.atlanan + " atlandı, " : "") + "toplam " + s.yazilan + ").", "iyi");
      yedekCiz();
      pom = { evre: "calisma", kalan: SURE.calisma, tamamlananTur: 0, calisiyor: false };
      AE.pomodoro = pom;
      var kap = $("#aeGeriOnay");
      if (kap) kap.className = "ae-sonuc iyi", kap.innerHTML = "<b>✔ Geri yükleme tamam: " + s.yazilan + " kayıt yazıldı.</b>";
    } else ekranBildir(s.hata, "kotu");
    return s;
  };
  AE.bekleyenYedekAl = function () { return bekleyenYedek; };

  function yedekCiz() {
    var kap = $("#aeYedekAlan");
    if (!kap) return;
    var liste = kayitListesi(), d = AE.yedekTopla();
    kap.innerHTML =
      '<p class="aciklama">Uygulamadaki <b>tüm ilerleme</b> <code>' + ONEK + '*</code> anahtarlarında tutulur. ' +
        "Tek JSON dosyası olarak indir, başka cihaza taşırken geri yükle. Sunucuya hiçbir şey gönderilmez.</p>" +
      '<div class="ae-kutular">' +
        '<div class="ae-kutu"><b id="aeYedekSayi">' + liste.length + "</b><span>KAYIT (ANAHTAR)</span></div>" +
        '<div class="ae-kutu"><b id="aeYedekBoyut">' + baytYazi(liste.reduce(function (a, b) { return a + b.bayt; }, 0)) + "</b><span>TOPLAM BOYUT</span></div>" +
        '<div class="ae-kutu"><b id="aeYedekAd">' + kacis(AE.yedekAdi()) + "</b><span>DOSYA ADI</span></div>" +
      "</div>" +
      '<div class="ka-butonlar">' +
        '<button class="ka-dugme" id="aeYedekIndir">💾 Yedeği indir (JSON)</button>' +
        '<button class="ka-dugme ka-ikincil" id="aeYedekListele">🔄 Kayıt listesini yenile</button>' +
        '<button class="ka-dugme ka-ikincil" id="aeYedekMetin">📄 Metni göster</button>' +
      "</div>" +
      '<div id="aeYedekSonuc" class="ae-sonuc"></div>' +
      '<textarea id="aeYedekMetinKutu" class="ae-metin" style="display:none" readonly rows="6"></textarea>' +
      '<h4 class="ae-alt-baslik">Kayıtlı ilerleme (' + liste.length + " anahtar)</h4>" +
      (liste.length ? '<div class="ae-tablo-kap"><table class="ae-tablo"><thead><tr><th>localStorage anahtarı</th><th>Kayıt</th><th>Boyut</th></tr></thead><tbody>' +
        liste.map(function (x) {
          return "<tr><td><code>" + kacis(x.anahtar) + "</code></td><td>" +
            (x.kayitSayisi === null ? "—" : x.kayitSayisi === -1 ? "JSON değil" : x.kayitSayisi + " kayıt") +
            "</td><td class=\"rakam\">" + x.yazi + "</td></tr>";
        }).join("") + "</tbody></table></div>"
        : '<p class="aciklama">Henüz kayıt yok — test çözdükçe burası dolar.</p>') +
      '<h4 class="ae-alt-baslik">Geri yükle</h4>' +
      '<p class="aciklama">Daha önce indirdiğin <code>USTAD-KOC-PRO-YEDEK-*.json</code> dosyasını seç. ' +
        "Dosya önce <b>doğrulanır</b> (geçerli JSON mu, surum alanı var mı, kaç anahtar içeriyor); " +
        "ancak sen onay verdikten sonra üzerine yazılır.</p>" +
      '<div class="ka-butonlar">' +
        '<label class="ka-dugme" for="aeDosya">📂 Yedek dosyası seç</label>' +
        "<input type=\"file\" id=\"aeDosya\" accept=\".json,application/json\" style=\"display:none\">" +
        '<button class="ka-dugme" id="aeGeriUygula" disabled>♻ Onayla ve geri yükle</button>' +
      "</div>" +
      '<div id="aeGeriOnay" class="ae-sonuc"></div>';
    $("#aeYedekIndir").addEventListener("click", function () { yedekIndir(); });
    $("#aeYedekListele").addEventListener("click", function () { yedekCiz(); ekranBildir("Kayıt listesi yenilendi: " + kayitListesi().length + " anahtar."); });
    $("#aeYedekMetin").addEventListener("click", function () {
      var t = $("#aeYedekMetinKutu");
      t.value = AE.yedekMetni();
      t.style.display = t.style.display === "none" ? "block" : "none";
      if (t.style.display === "block") t.select();
    });
    $("#aeGeriUygula").addEventListener("click", function () { AE.geriYukleOnayla(); });
    $("#aeDosya").addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var okur = new FileReader();
      okur.onload = function () { dosyaOkundu(String(okur.result || ""), f.name); };
      okur.onerror = function () { dosyaOkundu("", f.name); };
      okur.readAsText(f);
    });
  }

  /* ═════════════════════ 3) GÜNLÜK 5 SORU ═════════════════════ */
  /* Tohum: tarih metninden FNV-1a ile türetilir → gün içinde hep aynı 5 soru. */
  function tohumYap(metin) {
    var h = 2166136261, s = String(metin || "");
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  AE.tohumYap = tohumYap;
  function rastgeleUret(tohum) {
    var t = tohum >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) | 0;
      var x = Math.imul(t ^ (t >>> 15), 1 | t);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function soruBankasi() {
    var b = window.USTAD_SORULAR;
    if (!Array.isArray(b)) return [];
    return b.filter(function (s) { return s && typeof s === "object" && s.soru && Array.isArray(s.secenekler) && s.secenekler.length >= 2; });
  }
  AE.soruBankasi = soruBankasi;

  /* Günün 5 sorusu: bankadan tohumla seçilmiş indeksler (aynı gün → aynı indeksler) */
  AE.gunluk5Indeksler = function (gun) {
    var b = soruBankasi();
    if (!b.length) return [];
    var g = gun || gunAnahtar();
    var r = rastgeleUret(tohumYap(g)), kopya = [], i;
    for (i = 0; i < b.length; i++) kopya.push(i);
    var sec = [], adet = Math.min(5, kopya.length);
    for (i = 0; i < adet; i++) {
      var x = Math.floor(r() * kopya.length);
      sec.push(kopya.splice(x, 1)[0]);
    }
    return sec.sort(function (a, c) { return a - c; });
  };
  AE.gunluk5Sec = function (gun) {
    var b = soruBankasi();
    return AE.gunluk5Indeksler(gun).map(function (i) { return b[i]; });
  };

  function g5Kayit() {
    var d = depoAl(G5_ANAHTAR, null);
    if (!d || typeof d !== "object" || !d.gunler || typeof d.gunler !== "object") d = { surum: 1, gunler: {} };
    if (!d.surum) d.surum = 1;
    return d;
  }
  AE.gunluk5Kayit = g5Kayit;
  function g5Bugun() {
    var d = g5Kayit(), g = gunAnahtar();
    if (!d.gunler[g]) d.gunler[g] = { cozulen: 0, dogru: 0, yanlis: 0 };
    return d.gunler[g];
  }
  function g5Kaydet(dogruMu) {
    var d = g5Kayit(), g = gunAnahtar();
    if (!d.gunler[g]) d.gunler[g] = { cozulen: 0, dogru: 0, yanlis: 0 };
    d.gunler[g].cozulen++;
    if (dogruMu) d.gunler[g].dogru++; else d.gunler[g].yanlis++;
    d.sonGun = g;
    d.surum = 1;
    depoKoy(G5_ANAHTAR, d);
    return d;
  }
  AE.gunluk5Cevapla = function (sira, sik) {           /* programatik cevap (test için) */
    var s = g5Sorular[sira];
    if (!s) return null;
    return soruCevapla(sira, sik, s);
  };
  /* Seri: bugünden geriye doğru kesintisiz çözülmüş gün sayısı.
     Bugün henüz çözülmediyse seri bozulmamış sayılır, dünden sayılır. */
  AE.seriHesapla = function (gunler, bugun) {
    gunler = gunler || {};
    var g = bugun || gunAnahtar(), n = 0, koruma = 0;
    function cozuldu(k) { return gunler[k] && Number(gunler[k].cozulen) > 0; }
    if (!cozuldu(g)) g = gunKaydir(g, -1);
    while (cozuldu(g) && koruma < 4000) { n++; koruma++; g = gunKaydir(g, -1); }
    return n;
  };
  AE.seri = function () { return AE.seriHesapla(g5Kayit().gunler); };

  var g5Sorular = [], g5Cevaplar = {};
  function g5Ciz() {
    var kap = $("#aeG5Alan");
    if (!kap) return;
    var banka = soruBankasi();
    if (!banka.length) {
      kap.innerHTML = '<div class="ae-sonuc kotu"><b>Soru bankası boş.</b>' +
        '<p class="aciklama">icerik/sorular.js yüklenmemiş görünüyor; günlük 5 soru bu dosya olmadan çalışmaz.</p></div>';
      return;
    }
    var gun = gunAnahtar();
    g5Sorular = AE.gunluk5Sec(gun);
    g5Cevaplar = {};
    var k = g5Bugun(), seri = AE.seri(), d = g5Kayit();
    var toplamDogru = 0, toplamCozulen = 0;
    Object.keys(d.gunler || {}).forEach(function (x) { toplamDogru += Number(d.gunler[x].dogru) || 0; toplamCozulen += Number(d.gunler[x].cozulen) || 0; });
    kap.innerHTML =
      '<p class="aciklama">Sorular <b>günün tarihinden türeyen sabit tohumla</b> bankadan seçilir: gün içinde ' +
        "kaç kez açarsan aç <b>hep aynı 5 soru</b> gelir, gece yarısı yenilenir.</p>" +
      '<div class="ae-kutular">' +
        '<div class="ae-kutu"><b id="aeG5TarihYazi">' + new Date().toLocaleDateString("tr-TR") + "</b><span>GÜNÜN SETİ</span></div>" +
        '<div class="ae-kutu"><b id="aeG5Seri">' + seri + "</b><span>GÜN SERİ</span></div>" +
        '<div class="ae-kutu"><b id="aeG5Bugun">' + k.dogru + "/" + k.cozulen + "</b><span>BUGÜN DOĞRU</span></div>" +
        '<div class="ae-kutu"><b id="aeG5Toplam">' + toplamDogru + "/" + toplamCozulen + "</b><span>TOPLAM DOĞRU</span></div>" +
      "</div>" +
      '<div class="ka-butonlar">' +
        '<button class="ka-dugme ka-ikincil" id="aeG5Yenile">🔄 Günün setini yenile</button>' +
        '<button class="ka-dugme ka-ikincil" id="aeG5Seri">📅 Seri geçmişi</button>' +
      "</div>" +
      '<div id="aeG5Liste"></div>' +
      '<div class="ae-tablo-kap"><table class="ae-tablo"><thead><tr><th>Gün</th><th>Çözülen</th><th>Doğru</th><th>Yanlış</th></tr></thead><tbody>' +
        Object.keys(d.gunler || {}).sort().reverse().slice(0, 10).map(function (x) {
          return "<tr><td>" + x + "</td><td class=\"rakam\">" + d.gunler[x].cozulen + "</td><td class=\"rakam\">" +
            d.gunler[x].dogru + "</td><td class=\"rakam\">" + d.gunler[x].yanlis + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    $("#aeG5Yenile").addEventListener("click", function () { g5Ciz(); ekranBildir("Günün seti tazelendi: " + gun + " (" + AE.gunluk5Sec(gun).length + " soru)."); });
    $("#aeG5Seri").addEventListener("click", function () {
      var dd = g5Kayit();
      konus("Şu an " + AE.seri() + " gün üst üste soru çözdün. Bugün " + g5Bugun().dogru + " doğru yaptın.");
      ekranBildir("Seri: " + AE.seri() + " gün · bugün " + g5Bugun().dogru + " doğru · toplam " + toplamDogru + " doğru.");
      kayitCiz();
    });
    g5ListeCiz();
  }
  AE.g5Ciz = g5Ciz;
  function g5ListeCiz() {
    var kap = $("#aeG5Liste");
    if (!kap) return;
    kap.innerHTML = g5Sorular.map(function (s, i) {
      return '<div class="ae-soru" data-soru="' + i + '">' +
        '<div class="ae-soru-ust"><span class="ka-etiket">Soru ' + (i + 1) + "/" + g5Sorular.length + "</span>" +
          '<span class="ka-etiket">' + kacis(s.ders || "") + (s.konu ? " · " + kacis(s.konu) : "") + "</span>" +
          (s.zorluk ? '<span class="ka-etiket">' + kacis(s.zorluk) + "</span>" : "") + "</div>" +
        '<p class="ae-soru-metin">' + kacis(s.soru) + "</p>" +
        s.secenekler.map(function (k, j) {
          return '<button class="ae-sik" data-soru="' + i + '" data-sik="' + j + '">' + "ABCDE".charAt(j) + ") " + kacis(k) + "</button>";
        }).join("") +
        '<div class="ae-geri" id="aeGeri' + i + '"></div>' +
      "</div>";
    }).join("");
    $$("#aeG5Liste .ae-sik").forEach(function (b) {
      b.addEventListener("click", function () {
        var sira = Number(b.getAttribute("data-soru")), sik = Number(b.getAttribute("data-sik"));
        soruCevapla(sira, sik, g5Sorular[sira]);
      });
    });
  }
  function soruCevapla(sira, sik, s) {
    if (!s || g5Cevaplar[sira] !== undefined) return null;
    var dogruMu = Number(sik) === Number(s.dogru);
    g5Cevaplar[sira] = sik;
    var g = g5Kaydet(dogruMu);
    $$('#aeG5Liste .ae-sik[data-soru="' + sira + '"]').forEach(function (c) {
      var j = Number(c.getAttribute("data-sik"));
      if (j === Number(s.dogru)) c.className = "ae-sik dogru";
      else if (j === Number(sik)) c.className = "ae-sik yanlis";
      else c.className = "ae-sik soluk";
      c.disabled = true;
    });
    var k = $("#aeGeri" + sira);
    if (k) {
      k.className = "ae-geri " + (dogruMu ? "iyi" : "kotu");
      k.innerHTML = "<b>" + (dogruMu ? "✔ Doğru cevap verdin." : "✘ Yanlış. Doğru cevap: " + "ABCDE".charAt(s.dogru)) + "</b>" +
        (s.aciklama ? "<p>" + kacis(s.aciklama) + "</p>" : "") +
        (s.metin ? '<p class="aciklama">' + kacis(s.metin) + "</p>" : "") +
        '<div class="ka-butonlar"><button class="ka-mini ae-oku" data-soru="' + sira + '">🔊 Dinle</button></div>';
      var ok = $(".ae-oku", k);
      if (ok) ok.addEventListener("click", function () {
        konus(s.soru + ". Doğru cevap " + "ABCDE".charAt(s.dogru) + ": " + s.secenekler[s.dogru] + ". " + (s.aciklama || ""));
      });
    }
    var bug = g5Bugun(), seri = AE.seri();
    var b = $("#aeG5Bugun"); if (b) b.textContent = bug.dogru + "/" + bug.cozulen;
    var s2 = $("#aeG5Seri"); if (s2) s2.textContent = seri;
    ekranBildir(dogruMu ? "✔ Doğru! Bugün " + bug.dogru + "/" + bug.cozulen + " · seri " + seri + " gün."
      : "✘ Yanlış. Doğru cevap " + "ABCDE".charAt(s.dogru) + ")", dogruMu ? "iyi" : "kotu");
    if (dogruMu) konus("Doğru cevap verdin.");
    else konus("Yanlış. Doğru cevap " + "ABCDE".charAt(s.dogru) + ".");
    return { dogru: dogruMu, bugun: bug, seri: seri };
  }
  AE.soruCevapla = soruCevapla;

  /* ═════════════════════ sekmeli ekran ═════════════════════ */
  var SEKMELER = [
    { kod: "pomodoro", ad: "⏱️ Pomodoro", renk: "var(--aracek)" },
    { kod: "yedek", ad: "💾 Yedekleme", renk: "var(--aracek2)" },
    { kod: "gunluk5", ad: "🎯 Günlük 5 Soru", renk: "var(--aracek3)" }
  ];
  var sekme = "pomodoro";

  function ciz() {
    kabukKur();
    menuEkle();
    var kap = $("#aracEkAlan");
    if (!kap) return;
    kap.innerHTML =
      '<div class="ae-sekme-cubuk">' + SEKMELER.map(function (s) {
        return '<button class="ae-sekme' + (s.kod === sekme ? " secili" : "") + '" data-ae-sekme="' + s.kod +
          '" style="--bolum:' + s.renk + '">' + s.ad + "</button>";
      }).join("") + "</div>" +
      '<div class="ae-govde">' +
        '<div class="ae-panel" id="aePomAlan" style="display:' + (sekme === "pomodoro" ? "block" : "none") + '"></div>' +
        '<div class="ae-panel" id="aeYedekAlan" style="display:' + (sekme === "yedek" ? "block" : "none") + '"></div>' +
        '<div class="ae-panel" id="aeG5Alan" style="display:' + (sekme === "gunluk5" ? "block" : "none") + '"></div>' +
      "</div>";
    $$("[data-ae-sekme]").forEach(function (b) {
      b.addEventListener("click", function () { sekmeAc(b.getAttribute("data-ae-sekme")); });
    });
    if (sekme === "pomodoro") { pomodoroCiz(); kayitCiz(); }
    else if (sekme === "yedek") yedekCiz();
    else g5Ciz();
  }
  AE.ciz = ciz;
  function sekmeAc(kod) {
    if (!SEKMELER.some(function (s) { return s.kod === kod; })) return;
    sekme = kod;
    ciz();
  }
  AE.sekmeAc = sekmeAc;
  AE.sekme = function () { return sekme; };

  /* ═════════════════════ bölüm açılışı (sözleşme) ═════════════════════ */
  AE.bolumAc = function (kod) {
    if (kod === KOD) ciz();
    else if (pom.calisiyor && kod !== KOD) { /* başka bölüme geçilse de sayaç çalışmaya devam eder */ }
  };

  /* Kendini kur: ekran kabı + menü öğesi. Başka dosyaya dokunmadan. */
  function basla() {
    kabukKur();
    menuEkle();
    try { if (location.hash && location.hash.indexOf(KOD) >= 0) git(KOD); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", basla);
  else basla();
  window.addEventListener("load", function () { menuEkle(); });
  /* motor.js menüyü sonradan yeniden kurarsa (ayarlar vb.) öğemizi tekrar ekler */
  AE.menuEkle = menuEkle;
  AE.kabukKur = kabukKur;

  /* ═════════════════════ kendi kendini test (?test=1) ═════════════════════ */
  function testiKos() {
    var s = [];
    function ok(ad, kosul, ek) { s.push((kosul ? "✔" : "✘") + " " + ad + (ek !== undefined ? " → " + ek : "")); }
    var oncekiSes = window.KPSS_SES, sesCagri = [];
    var pomYedek = null, g5Yedek = null;
    try { pomYedek = localStorage.getItem(POM_ANAHTAR); g5Yedek = localStorage.getItem(G5_ANAHTAR); } catch (e) {}
    window.KPSS_SES = { konus: function (m) { sesCagri.push(String(m)); } };   /* sesi yalnız kaydet, konuşma */

    try {
      /* — modül ve kabuk — */
      ok("modül globali window.ARAC_EK", !!window.ARAC_EK && typeof window.ARAC_EK === "object");
      ok("sözleşme: ARAC_EK.bolumAc fonksiyon", typeof AE.bolumAc === "function");
      AE.bolumAc(KOD);
      var k = kabuk();
      ok("ekran kabı <section id=ekran-araclar-ekstra>", !!k && k.tagName === "SECTION" && k.id === "ekran-araclar-ekstra");
      ok("ekran kabı sınıfı .ekran ve data-bolum", !!k && k.classList.contains("ekran") && k.getAttribute("data-bolum") === KOD,
        k ? k.className + " / " + k.getAttribute("data-bolum") : "yok");
      ok("alan #aracEkAlan var", !!$("#aracEkAlan"));
      ok("3 sekme düğmesi", $$("[data-ae-sekme]").length === 3, $$("[data-ae-sekme]").length + " düğme");
      ok("sekme değişince panel görünür", (function () {
        AE.sekmeAc("yedek");
        var y = $("#aeYedekAlan"), p = $("#aePomAlan");
        return !!y && y.style.display !== "none" && p.style.display === "none";
      })());
      ok("menüye kendi öğesi eklendi (motor.js'e dokunmadan)", !!$('.menu-oge[data-git="' + KOD + '"]'));

      /* — POMODORO — */
      AE.sekmeAc("pomodoro");
      var d0 = AE.pomodoroDurum();
      ok("pomodoro başlangıç: 25 dk çalışma", d0.evre === "calisma" && d0.kalan === 1500, d0.kalanYazi + " / " + d0.evre);
      ok("pomodoro başlangıçta duruyor", d0.calisiyor === false);
      AE.pomodoroBaslat();
      ok("başlat → calisiyor true", AE.pomodoroDurum().calisiyor === true);
      var t1 = AE.pomodoroTikle(60);
      ok("başlat + 60 saniye → sayaç 1440", AE.pomodoroDurum().kalan === 1440, AE.pomodoroDurum().kalan + " sn (" + t1 + " tik)");
      ok("geri sayım halkası SVG çizildi", !!$("#aeRing") && Number($("#aeRing").getAttribute("data-oran")) < 1,
        $("#aeRing") ? "doluluk oranı " + $("#aeRing").getAttribute("data-oran") : "yok");
      ok("büyük sayaç yazısı 24:00", ($("#aeSayac") || {}).textContent === "24:00", ($("#aeSayac") || {}).textContent);
      AE.pomodoroDuraklat();
      var oncekiKalan = AE.pomodoroDurum().kalan;
      var tiklanan = AE.pomodoroTikle(30);
      ok("duraklat → sayaç durur (tik işlemez)", AE.pomodoroDurum().calisiyor === false && AE.pomodoroDurum().kalan === oncekiKalan && tiklanan === 0,
        "tik " + tiklanan + " · kalan " + AE.pomodoroDurum().kalan);
      ok("çalışma süresi günlük kayda yazıldı", AE.gunDakika() === 1, "bugün " + AE.gunDakika() + " dk");
      ok("localStorage ustad.pomodoro yazıldı", !!localStorage.getItem(POM_ANAHTAR));
      AE.pomodoroSifirla();
      var d1 = AE.pomodoroDurum();
      ok("sıfırla → 1. tur / 25 dk / durdu", d1.evre === "calisma" && d1.kalan === 1500 && d1.tamamlananTur === 0 && d1.calisiyor === false);
      /* tur tamamlanması: kalanı 1 sn'ye indirip tikle */
      AE.pomodoroBaslat();
      pom.kalan = 1; pom.evre = "calisma"; pom.tamamlananTur = 0;
      AE.pomodoroTikle(1);
      ok("çalışma bitince mola evresine geçer (5 dk)", pom.evre === "mola" && pom.kalan === 300, pom.evre + " · " + AE.sureYazi(pom.kalan));
      ok("tur sayacı 1 oldu", pom.tamamlananTur === 1, "tur " + pom.tamamlananTur);
      ok("sesli uyarı: 'Mola zamanı' konuşuldu", sesCagri.some(function (m) { return /Mola zamanı/.test(m); }),
        sesCagri.join(" | ").slice(0, 80));
      ok("ekranda bildirim gösterildi", ($("#aeBildirim") || {}).textContent && /mola/i.test($("#aeBildirim").textContent),
        (($("#aeBildirim") || {}).textContent || "").slice(0, 60));
      /* mola bitince çalışmaya döner */
      AE.pomodoroBaslat(); pom.kalan = 1; AE.pomodoroTikle(1);
      ok("mola bitince çalışmaya döner (25 dk)", pom.evre === "calisma" && pom.kalan === 1500, pom.evre + " · " + AE.sureYazi(pom.kalan));
      ok("mola bitince 'Çalışma zamanı' uyarısı", sesCagri.some(function (m) { return /Çalışma zamanı/.test(m); }));
      /* 4 turda uzun mola */
      pom.evre = "calisma"; pom.tamamlananTur = 3; pom.kalan = 1; pom.calisiyor = true;
      pomBitir();
      ok("4. tur bitince uzun mola (15 dk)", pom.evre === "uzunMola" && pom.kalan === 900, pom.evre + " · " + AE.sureYazi(pom.kalan));
      ok("uzun mola uyarısı sesli okundu", sesCagri.some(function (m) { return /Uzun mola zamanı/.test(m); }));
      ok("tur noktaları DOM'da (4 tur)", $$("#aeTurNokta i").length === 4, $$("#aeTurNokta i").length + " nokta");
      /* günlük kayıt + 7 gün grafiği */
      var kayitD = AE.pomodoroKayit();
      ok("pomodoro kaydı surum + gunler içeriyor", kayitD.surum >= 1 && !!kayitD.gunler && Object.keys(kayitD.gunler).length >= 1,
        Object.keys(kayitD.gunler).length + " gün");
      var y7 = AE.son7Gun();
      ok("son 7 gün listesi 7 gün", y7.length === 7, y7.map(function (x) { return x.dakika; }).join(","));
      ok("son 7 günün son elemanı bugün", y7[6].gun === gunAnahtar(), y7[6].gun);
      AE.kayitCiz();
      ok("7 gün mini grafiği çizildi", $$("#aeGrafik .ae-cubuk").length === 7, $$("#aeGrafik .ae-cubuk").length + " çubuk");
      ok("boş haftada grafik ipucu verir", (function () {
        var esk = localStorage.getItem(POM_ANAHTAR);
        localStorage.setItem(POM_ANAHTAR, JSON.stringify({ surum: 1, gunler: {} }));
        AE.kayitCiz();
        var bos = $$("#aeGrafik .ae-cubuk").length === 7 && /kayıt yok/.test($("#aeGrafikIpucu").textContent);
        if (esk === null) localStorage.removeItem(POM_ANAHTAR); else localStorage.setItem(POM_ANAHTAR, esk);
        AE.kayitCiz();
        return bos && $("#aeGrafikIpucu").textContent === "";
      })(), ($("#aeGrafikIpucu") || {}).textContent);
      ok("bozuk ustad.pomodoro kaydı çökmez", (function () {
        var esk = localStorage.getItem(POM_ANAHTAR);
        localStorage.setItem(POM_ANAHTAR, "{{bozuk json");
        var d = AE.pomodoroKayit(), t = AE.son7Gun();
        if (esk === null) localStorage.removeItem(POM_ANAHTAR); else localStorage.setItem(POM_ANAHTAR, esk);
        return !!d && !!d.gunler && t.length === 7;
      })());
      ok("bugün/toplam dakika kutuları dolu", ($("#aePomBugun") || {}).textContent === String(AE.gunDakika()) && !!$("#aePomToplam"),
        "bugün " + ($("#aePomBugun") || {}).textContent + " dk");
      ok("süre yazımı 25 dk → 25:00", AE.sureYazi(1500) === "25:00" && AE.sureYazi(59) === "00:59", AE.sureYazi(1500) + " / " + AE.sureYazi(59));
      AE.pomodoroSifirla();

      /* — YEDEKLEME — */
      AE.sekmeAc("yedek");
      ok("ustad.* anahtarları listeleniyor", AE.ustadAnahtarlari().length >= 2, AE.ustadAnahtarlari().length + " anahtar");
      ok("tüm anahtarlar ustad.* önekli", AE.ustadAnahtarlari().every(function (x) { return x.indexOf("ustad.") === 0; }));
      var yedek = AE.yedekTopla();
      ok("yedek JSON: surum alanı", yedek.surum === 1, String(yedek.surum));
      ok("yedek JSON: tarih alanı (ISO)", /^\d{4}-\d{2}-\d{2}T/.test(yedek.tarih || ""), yedek.tarih);
      ok("yedek JSON: anahtarlar + ustad.* içeriyor", !!yedek.anahtarlar && Object.keys(yedek.anahtarlar).length >= 2 &&
        Object.keys(yedek.anahtarlar).every(function (x) { return x.indexOf("ustad.") === 0; }),
        Object.keys(yedek.anahtarlar).length + " anahtar");
      ok("yedek JSON metni parse edilebilir", (function () { try { JSON.parse(AE.yedekMetni()); return true; } catch (e) { return false; } })());
      ok("dosya adı USTAD-KOC-PRO-YEDEK-<tarih>.json", /^USTAD-KOC-PRO-YEDEK-\d{4}-\d{2}-\d{2}\.json$/.test(AE.yedekAdi()), AE.yedekAdi());
      ok("kayıt listesi anahtar + boyut veriyor", AE.kayitListesi().every(function (x) { return x.anahtar.indexOf("ustad.") === 0 && x.bayt >= 0 && /B|KB|MB/.test(x.yazi); }),
        AE.kayitListesi().length + " satır");
      ok("DOM'da kayıt tablosu satırları", $$("#aeYedekAlan .ae-tablo tbody tr").length === AE.kayitListesi().length,
        $$("#aeYedekAlan .ae-tablo tbody tr").length + " satır");
      ok("yedek doğrulama: geçersiz JSON reddedilir", AE.yedekDogrula("{bu json degil").gecerli === false, AE.yedekDogrula("{bu json degil").hata);
      ok("yedek doğrulama: surum alanı yoksa reddedilir", AE.yedekDogrula('{"anahtarlar":{"ustad.x":"1"}}').gecerli === false,
        AE.yedekDogrula('{"anahtarlar":{"ustad.x":"1"}}').hata);
      ok("yedek doğrulama: boş dosya reddedilir", AE.yedekDogrula("").gecerli === false);
      ok("yedek doğrulama: dizi reddedilir", AE.yedekDogrula("[1,2,3]").gecerli === false);
      ok("yedek doğrulama: ustad.* olmayan anahtar reddedilir", AE.yedekDogrula('{"surum":1,"anahtarlar":{"baska.x":"1"}}').gecerli === false);
      var gt = AE.yedekDogrula(AE.yedekMetni());
      ok("yedek doğrulama: kendi yedeğimiz geçer", gt.gecerli === true, gt.anahtarSayisi + " anahtar · " + gt.yazi);
      ok("yedek doğrulama: uygunsuz anahtar atlanır (güvenlik)", (function () {
        var z = AE.yedekDogrula('{"surum":1,"anahtarlar":{"ustad.deneme":"1","kotu.anahtar":"1"}}');
        return z.gecerli === true && z.anahtarSayisi === 1 && z.atlanan === 1;
      })());
      /* geri yükleme akışı */
      var dondurulan = '{"surum":1,"tarih":"2026-09-01T00:00:00.000Z","anahtarlar":{"ustad.ae.test":"{\\"a\\":42}"}}';
      var dk2 = AE.dosyaOkundu(dondurulan, "test.json");
      ok("geçerli dosya doğrulanıp özet gösterildi", dk2.gecerli === true && /anahtar/.test($("#aeGeriOnay").innerHTML),
        dk2.anahtarSayisi + " anahtar");
      ok("onay verilmeden üzerine YAZILMAZ", (function () {
        try { localStorage.removeItem("ustad.ae.test"); } catch (e) {}
        var r = AE.geriYukleUygula(dk2, false);
        return r.ok === false && localStorage.getItem("ustad.ae.test") === null;
      })(), AE.geriYukleUygula(dk2, false).hata);
      var gy = AE.geriYukleOnayla();
      ok("onay sonrası geri yükleme yazdı", gy.ok === true && gy.yazilan === 1, gy.yazilan + " kayıt");
      ok("geri yüklenen kayıt okunabiliyor", (function () {
        try { return JSON.parse(localStorage.getItem("ustad.ae.test")).a === 42; } catch (e) { return false; }
      })());
      ok("geri yükleme sonrası liste tazelendi", AE.ustadAnahtarlari().indexOf("ustad.ae.test") >= 0,
        AE.ustadAnahtarlari().length + " anahtar");
      ok("bozuk localStorage kaydı yedeklemeyi bozmaz", (function () {
        try { localStorage.setItem("ustad.ae.bozuk", "{{json degil"); } catch (e) { return false; }
        var l = AE.kayitListesi().filter(function (x) { return x.anahtar === "ustad.ae.bozuk"; })[0];
        var y = AE.yedekTopla();
        return !!l && l.kayitSayisi === -1 && y.anahtarlar["ustad.ae.bozuk"] === "{{json degil";
      })());
      try { localStorage.removeItem("ustad.ae.bozuk"); } catch (e) {}

      /* — GÜNLÜK 5 SORU — */
      AE.sekmeAc("gunluk5");
      var banka = AE.soruBankasi();
      ok("soru bankası (USTAD_SORULAR) yüklendi", banka.length >= 5, banka.length + " soru");
      var i1 = AE.gunluk5Indeksler(), i2 = AE.gunluk5Indeksler();
      ok("aynı gün iki kez → AYNI 5 soru (indeksler)", JSON.stringify(i1) === JSON.stringify(i2), i1.join(","));
      ok("günün seti tam 5 soru", i1.length === 5, i1.length + " soru");
      ok("seçilen 5 indeks benzersiz", new Set(i1).size === i1.length);
      ok("seçilen sorular şık + doğru cevap içeriyor", AE.gunluk5Sec().every(function (x) {
        return x.secenekler.length >= 2 && x.dogru >= 0 && x.dogru < x.secenekler.length && !!x.soru;
      }));
      ok("tohum tarihten türüyor (farklı gün → farklı tohum)", AE.tohumYap("2026-09-24") !== AE.tohumYap("2026-09-25"));
      ok("farklı gün → farklı set (genelde)", JSON.stringify(AE.gunluk5Indeksler("2026-09-24")) !== JSON.stringify(AE.gunluk5Indeksler("2027-03-11")),
        AE.gunluk5Indeksler("2026-09-24").join(",") + " ↔ " + AE.gunluk5Indeksler("2027-03-11").join(","));
      ok("DOM'da 5 soru + şıklar çizildi", $$("#aeG5Liste .ae-soru").length === 5 &&
        $$("#aeG5Liste .ae-sik").length === AE.gunluk5Sec().reduce(function (a, x) { return a + x.secenekler.length; }, 0),
        $$("#aeG5Liste .ae-soru").length + " soru / " + $$("#aeG5Liste .ae-sik").length + " şık");
      var s0 = g5Sorular[0];
      var c0 = AE.soruCevapla(0, s0.dogru, s0);
      ok("doğru cevap → doğru geri bildirim", c0 && c0.dogru === true, $("#aeGeri0").textContent.slice(0, 40));
      ok("açıklama gösterildi", !!s0.aciklama && $("#aeGeri0").innerHTML.indexOf(kacis(s0.aciklama).slice(0, 25)) >= 0);
      ok("🔊 Dinle düğmesi var", !!$("#aeGeri0 .ae-oku"));
      var s1 = g5Sorular[1], yanlisSik = (s1.dogru + 1) % s1.secenekler.length;
      var c1 = AE.soruCevapla(1, yanlisSik, s1);
      ok("yanlış cevap → yanlış geri bildirimi + doğru şık", c1 && c1.dogru === false && /Yanlış/.test($("#aeGeri1").textContent));
      ok("aynı soruya ikinci kez cevap verilemez", AE.soruCevapla(1, s1.dogru, s1) === null);
      ok("cevaplar localStorage ustad.gunluk5'e yazıldı", (function () {
        var g = AE.gunluk5Kayit().gunler[gunAnahtar()];
        return !!g && g.cozulen === 2 && g.dogru === 1 && g.yanlis === 1;
      })(), JSON.stringify(AE.gunluk5Kayit().gunler[gunAnahtar()]));
      ok("doğru sayısı kutuda güncellendi", ($("#aeG5Bugun") || {}).textContent === "1/2", ($("#aeG5Bugun") || {}).textContent);
      ok("seri: bugün + dün + önceki gün → 3", AE.seriHesapla({
        "2026-09-24": { cozulen: 5 }, "2026-09-23": { cozulen: 3 }, "2026-09-22": { cozulen: 5 }
      }, "2026-09-24") === 3);
      ok("seri: arada boşluk varsa kesilir (→ 2)", AE.seriHesapla({
        "2026-09-24": { cozulen: 5 }, "2026-09-23": { cozulen: 3 }, "2026-09-21": { cozulen: 5 }
      }, "2026-09-24") === 2);
      ok("seri: bugün çözülmediyse dünden sayılır (→ 2)", AE.seriHesapla({
        "2026-09-23": { cozulen: 3 }, "2026-09-22": { cozulen: 5 }
      }, "2026-09-24") === 2);
      ok("seri: hiç kayıt yoksa 0", AE.seriHesapla({}, "2026-09-24") === 0);
      ok("çözülen 0 olan gün seriyi başlatmaz", AE.seriHesapla({ "2026-09-24": { cozulen: 0 } }, "2026-09-24") === 0);
      ok("sesli okuma çağrısı yapıldı (KPSS_SES)", sesCagri.length >= 3, sesCagri.length + " çağrı");
      ok("boş banka çökmeden uyarı verir", (function () {
        var gercek = window.USTAD_SORULAR;
        window.USTAD_SORULAR = [];
        var a = AE.gunluk5Sec().length === 0 && AE.gunluk5Indeksler().length === 0;
        AE.g5Ciz();
        var uyari = /Soru bankası boş/.test($("#aeG5Alan").innerHTML);
        window.USTAD_SORULAR = gercek;
        return a && uyari;
      })());
      ok("banka geri yüklendi (5 soru yeniden seçilebiliyor)", AE.gunluk5Sec().length === 5);
      ok("toplam 12 araç sekmesi yok — panel sayısı 3", $$(".ae-panel").length === 3, $$(".ae-panel").length + " panel");
    } catch (e) {
      s.push("✘ TEST ÇALIŞIRKEN HATA → " + (e && e.message ? e.message : e));
    }

    /* gerçek verileri geri koy (test kullanıcının kaydını bozmasın) */
    try {
      if (pomYedek === null) localStorage.removeItem(POM_ANAHTAR); else localStorage.setItem(POM_ANAHTAR, pomYedek);
      if (g5Yedek === null) localStorage.removeItem(G5_ANAHTAR); else localStorage.setItem(G5_ANAHTAR, g5Yedek);
      localStorage.removeItem("ustad.ae.test");
    } catch (e) {}
    if (oncekiSes === undefined) { try { delete window.KPSS_SES; } catch (e) { window.KPSS_SES = undefined; } }
    else window.KPSS_SES = oncekiSes;

    var gecen = s.filter(function (x) { return x.indexOf("✔") === 0; }).length;
    var eski = document.getElementById("aracEkTestSonuc");
    if (eski && eski.parentNode) eski.parentNode.removeChild(eski);
    var kap = document.createElement("div");
    kap.id = "aracEkTestSonuc";
    kap.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
    kap.innerHTML = "<h3>KOÇ PRO · ÇALIŞMA ARAÇLARI testi</h3>" +
      s.map(function (x) { return "<div>" + kacis(x) + "</div>"; }).join("") +
      "<hr><b>" + gecen + " / " + s.length + " geçti</b>";
    document.body.appendChild(kap);
    document.title = "ARAÇTEST " + gecen + "/" + s.length;
    return { gecen: gecen, toplam: s.length, hatalar: s.filter(function (x) { return x.indexOf("✘") === 0; }) };
  }
  AE.testiKos = testiKos;
  AE.testSonuc = null;
  function testOto() { AE.testSonuc = testiKos(); }
  if (location.search.indexOf("test=1") >= 0) {
    if (document.readyState === "complete") setTimeout(testOto, 600);
    else window.addEventListener("load", function () { setTimeout(testOto, 600); });
  }
})();
