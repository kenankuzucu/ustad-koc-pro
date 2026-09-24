/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Sınav Koçu (KPSS-B paketi) · TÜM HAKLARI SAKLIDIR.
   5846 sayılı FSEK kapsamında korunur. İzinsiz çoğaltma, kopyalama, satış, dağıtım,
   değiştirme, tersine mühendislik ve türev eser üretimi yasaktır.
   Eser künyesi ve kullanım lisansı: uygulama içinde 'Hakkında & Telif' bölümü. */
/* ═══════════════════════════════════════════════════════════════════
   ÜSTAD MOTOR · deneme.js — gerçek formatlı deneme sınavı motoru
   Kurallar (Kenan'ın şartnamesi):
     • Soru sayısı ve süre GERÇEK sınavla aynı (KPSS-B: 120 soru / 130 dakika)
     • Süre, sınava girildiği AN başlar
     • Süre bitince 15 dakika boyunca o sınavın sorularına erişim kapanır
     • Öğrenci geçtiği (boş bıraktığı) soruları görebilir
     • KPSS'de yanlış doğruyu GÖTÜRMEZ → puan = doğru sayısı
   Paket: icerik/veri.js · Soru bankası: icerik/sorular.js (derlenmiş)
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var P = window.USTAD_PAKET;
  var ON_EK = "ustad.";
  var KILIT_DK = 15;

  function al(a, v) {
    try { var s = localStorage.getItem(ON_EK + a); return s === null ? v : JSON.parse(s); }
    catch (e) { return v; }
  }
  function koy(a, v) {
    try { localStorage.setItem(ON_EK + a, JSON.stringify(v)); } catch (e) {}
  }
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  function banka() {
    if (window.USTAD_SORULAR && window.USTAD_SORULAR.length) return window.USTAD_SORULAR;
    return (P.ornekSorular || []);
  }

  function sorulariHazirla() {
    var banka1 = banka();
    var hedef = P.sinav.soruSayisi;
    // Ders sırası korunur (Genel Yetenek → Genel Kültür), sorular dengeli seçilir
    var sirali = [];
    P.dersler.forEach(function (d) {
      var dersSorulari = banka1.filter(function (s) { return s.ders === d.ad; });
      sirali = sirali.concat(dersSorulari.slice(0, d.soru));
    });
    if (sirali.length < 10) sirali = banka1.slice(0, hedef);
    return sirali.slice(0, hedef);
  }

  /* ---------- durum ---------- */
  function durum() { return al("deneme.durum", null); }
  function kaydet(d) { koy("deneme.durum", d); }
  function kilitBitis() { return al("deneme.kilit", 0); }
  function suAnKilitli() { return Date.now() < kilitBitis(); }
  function snBicim(sn) {
    sn = Math.max(0, Math.round(sn));
    var s = Math.floor(sn / 60), k = sn % 60;
    return (s < 10 ? "0" : "") + s + ":" + (k < 10 ? "0" : "") + k;
  }

  /* ═══════════ 1) DENEME EKRANI (bilgi + başla) ═══════════ */
  function panel() {
    var kap = $("#denemeBilgi");
    if (!kap) return;
    var banka1 = banka();
    var dersSayisi = P.dersler.length;
    var hazir = banka1.length;
    var d = durum();
    var bitmemis = d && !d.bitti;

    kap.innerHTML =
      "<div class='bilgi-kutu'><b>" + P.sinav.soruSayisi + "</b><span>Soru</span></div>" +
      "<div class='bilgi-kutu'><b>" + P.sinav.dakika + "</b><span>Dakika</span></div>" +
      "<div class='bilgi-kutu'><b>" + dersSayisi + "</b><span>Ders</span></div>" +
      "<div class='bilgi-kutu'><b>" + hazir + "</b><span>Bankadaki soru</span></div>";

    var eski = $("#denemeAlt"); if (eski) eski.parentNode.removeChild(eski);
    var alt = document.createElement("div");
    alt.id = "denemeAlt";

    if (suAnKilitli()) {
      alt.innerHTML = "<div class='kilit-kutu'><b>⛔ Süre bitti — erişim kapalı</b>" +
        "<p class='aciklama'>Şartname gereği, süre dolduktan sonra " + KILIT_DK +
        " dakika boyunca sorulara erişim engellenir.</p>" +
        "<p class='kilit-sayac'>Kalan kilit: <span id='kilitSayac'>--:--</span></p></div>";
    } else if (bitmemis) {
      var gecen = Math.round((Date.now() - d.basladi) / 1000);
      alt.innerHTML = "<div class='kart' style='margin-bottom:12px'>" +
        "<b>⏳ Devam eden deneme var</b><p class='aciklama'>Başlangıç: " +
        new Date(d.basladi).toLocaleTimeString("tr-TR") + " · Geçen: " + snBicim(gecen) +
        " · Kalan: " + snBicim((d.bitis - Date.now()) / 1000) + "</p>" +
        "<button class='buyuk-dugme' id='denemeDevam'>SINAVA DEVAM ET</button></div>";
    } else {
      alt.innerHTML = "<button class='buyuk-dugme' id='denemeBasla'>DENEMEYE BAŞLA</button>";
    }
    /* BAŞLA/DEVAM düğmesi, arşiv bağlantısının ÜSTÜNE yerleşir (ikisi yapışık durmasın) */
    var arsivSatir = document.getElementById("denemeArsivSatir");
    if (arsivSatir) kap.parentNode.insertBefore(alt, arsivSatir);
    else kap.parentNode.appendChild(alt);
    var b1 = $("#denemeBasla");
    if (b1) b1.addEventListener("click", function () { basla(false); });
    var b2 = $("#denemeDevam");
    if (b2) b2.addEventListener("click", function () { basla(true); });
    kilitSayaci();
  }

  function kilitSayaci() {
    var yer = $("#kilitSayac");
    if (!yer) return;
    var tik = function () {
      if (!$("#kilitSayac")) return;
      var kalan = (kilitBitis() - Date.now()) / 1000;
      if (kalan <= 0) { panel(); return; }
      $("#kilitSayac").textContent = snBicim(kalan);
      setTimeout(tik, 1000);
    };
    tik();
  }

  /* ═══════════ 2) SINAV ═══════════ */
  var SUAN = null;   // {d, zamanlayici, gorunen}

  function basla(devam) {
    if (suAnKilitli()) { panel(); return; }
    var d = devam ? durum() : null;
    if (!d) {
      var sorular = sorulariHazirla();
      d = {
        no: (d && d.no) || 1,
        sorular: sorular,
        cevaplar: {},
        isaretli: {},
        basladi: Date.now(),
        bitis: Date.now() + P.sinav.dakika * 60000,
        bitti: false
      };
      kaydet(d);
    }
    SORULAR_CACHE = d;
    SUAN = { d: d, zamanlayici: null, gorunen: 0, optik: false };
    ciz();
  }

  var SORULAR_CACHE = null;

  function ciz() {
    var d = SUAN.d;
    var eski = $(".sinav-perde"); if (eski) eski.parentNode.removeChild(eski);
    var soru = d.sorular[SUAN.gorunen];
    var i = SUAN.gorunen;
    var cevap = d.cevaplar[i];
    var toplam = d.sorular.length;

    /* Anında geri bildirim (varsayılan AÇIK): testlerdeki gibi doğru/yanlış hemen işaretlenir.
       Ayarlar > Deneme sınavı > "Anında geri bildirim" kapatılırsa gerçek sınav provası olur. */
    var hemen = al("aninda", true) !== false;
    var cevaplandi = (cevap !== undefined && cevap !== null);
    var dogruMu = cevaplandi && cevap === soru.dogru;
    var goster = cevaplandi && hemen;

    var bosSay = 0, cevapSay = 0, dogruSay = 0, yanlisSay = 0;
    for (var k = 0; k < toplam; k++) {
      if (d.cevaplar[k] === undefined || d.cevaplar[k] === null) bosSay++;
      else {
        cevapSay++;
        if (d.cevaplar[k] === d.sorular[k].dogru) dogruSay++; else yanlisSay++;
      }
    }

    var kap = document.createElement("div");
    kap.className = "modul sinav-perde";
    /* Anında geri bildirim BANDI: en üstte yapışkan — testlerle aynı davranış */
    var bant = "";
    if (goster) {
      bant = "<div class='cevap-bant " + (dogruMu ? "iyi" : "kotu") + "'>" +
        "<span class='cb-isaret'>" + (dogruMu ? "✔" : "✘") + "</span>" +
        "<span class='cb-metin'>" + (dogruMu
          ? "<b>Doğru cevap verdiniz.</b><span class='cb-alt'>Aferin — sonraki soruya geçebilirsiniz.</span>"
          : "<b>Yanlış cevap.</b> Doğru cevap: <b>" + "ABCD".charAt(soru.dogru) + ") " + (soru.secenekler[soru.dogru] || "") +
            "</b><span class='cb-alt'>Bu soru sonuç ekranındaki optik formda kırmızı görünecek.</span>") +
        "</span>" +
        "<button class='bant-dugme' data-islem='sonraki'>Sonraki Soru →</button>" +
        "</div>";
    }
    var govde = "<div class='modul-ic'>" + bant +
      "<div class='sinav-ust'>" +
        "<span>" + P.sinav.kod + " · Deneme " + d.no + " · Soru " + (i + 1) + " / " + toplam + "</span>" +
        "<span class='sayac-kutu' id='sinavSayac'>--:--</span>" +
      "</div>" +
      "<div class='soru-kutu'>" +
        "<div class='soru-ust'><span>" + (soru.ders || "") + " · " + (soru.konu || "") +
          (soru.zorluk ? " · " + soru.zorluk : "") + "</span>" +
          "<span>" + (d.isaretli[i] ? "🔖 işaretli" : "") + "</span></div>" +
        "<div class='soru-metin'>" + (soru.metin ? soru.metin + "<br><br>" : "") + "<b>" + soru.soru + "</b></div>";

    (soru.secenekler || []).forEach(function (sec, j) {
      var sinif = "";
      if (goster) {
        if (j === soru.dogru) sinif = " dogru";            // doğru şık yeşil
        else if (j === cevap) sinif = " yanlis";           // işaretlenen yanlış şık kırmızı
        else sinif = " soluk";
      } else if (cevap === j) { sinif = " secili"; }
      govde += "<div class='secenek" + sinif + "' data-sec='" + j + "'>" +
               "<b>" + "ABCD".charAt(j) + ")</b><span>" + sec + "</span></div>";
    });

    if (!cevaplandi) {
      govde += "<p class='aciklama'>Şıkkı işaretleyin" + (hemen ? "; doğru ya da yanlış olduğunu <b>hemen</b> göstereceğim." : ".") + "</p>";
    } else if (!goster) {
      govde += "<p class='aciklama'>Cevabınız kaydedildi. (Denemede anında geri bildirim kapalı — gerçek sınav provası.)</p>";
    }

    govde += "<div class='soru-alt'>" +
        "<button class='ikincil-dugme' data-islem='onceki'>← Önceki</button>" +
        "<button class='ikincil-dugme' data-islem='sonraki'>Sonraki →</button>" +
        "<button class='ikincil-dugme sari' data-islem='isaretle'>" + (d.isaretli[i] ? "🔖 İşareti Kaldır" : "🔖 İşaretle") + "</button>" +
        "<button class='ikincil-dugme yesil' data-islem='dogru'>✅ Doğru Cevaplananlar (" + dogruSay + ")</button>" +
        "<button class='ikincil-dugme kirmizi' data-islem='yanlis'>❌ Yanlış Cevaplananlar (" + yanlisSay + ")</button>" +
        "<button class='ikincil-dugme sari' data-islem='bos'>⏭ Boş Bıraktıklarım (" + bosSay + ")</button>" +
        "<button class='ikincil-dugme' data-islem='optik'>Optik Form</button>" +
        "<button class='ikincil-dugme kirmizi' data-islem='bitir'>Sınavı Bitir</button>" +
      "</div>" +
      "<p class='aciklama'>Cevaplanan: " + cevapSay + " · Boş: " + bosSay + " · Toplam: " + toplam + "</p>";

    if (SUAN.optik) {
      govde += "<div class='optik'><div class='optik-baslik'>OPTİK FORM — soruya gitmek için dokun</div><div class='optik-izgara'>";
      for (var n = 0; n < toplam; n++) {
        var durum2 = "bos";
        if (d.isaretli[n]) durum2 = "isaretli";
        if (d.cevaplar[n] !== undefined && d.cevaplar[n] !== null) durum2 = "cevapli";
        if (n === i) durum2 += " suanki";
        govde += "<button class='optik-kutu " + durum2 + "' data-git='" + n + "'>" + (n + 1) + "</button>";
      }
      govde += "</div></div>";
    }
    govde += "</div></div>";
    kap.innerHTML = govde;
    document.body.appendChild(kap);

    kap.querySelectorAll(".secenek").forEach(function (el) {
      el.addEventListener("click", function () {
        var sec = Number(el.getAttribute("data-sec"));
        var onceki = d.cevaplar[SUAN.gorunen];
        var verilmis = (onceki !== undefined && onceki !== null);
        // Anında geri bildirim açıkken cevap kilitlenir (testlerdeki gibi)
        if (verilmis && al("aninda", true) !== false) return;
        d.cevaplar[SUAN.gorunen] = sec;
        kaydet(d);
        ciz();
        if (al("aninda", true) !== false) {
          var s = d.sorular[SUAN.gorunen];
          if (window.USTAD_MOTOR && window.USTAD_MOTOR.konus) {
            window.USTAD_MOTOR.konus(sec === s.dogru ? "Doğru cevap verdiniz."
                                                     : "Yanlış. Doğru cevap " + "ABCD".charAt(s.dogru) + ".");
          }
        }
      });
    });
    kap.querySelectorAll("[data-islem]").forEach(function (b) {
      b.addEventListener("click", function () { islem(b.getAttribute("data-islem")); });
    });
    kap.querySelectorAll("[data-git]").forEach(function (b) {
      b.addEventListener("click", function () { SUAN.gorunen = Number(b.getAttribute("data-git")); ciz(); });
    });

    sayacBaslat();
  }

  /* ✅ ❌ ⏭ soru listesi panelleri — testlerdeki panellerin deneme sürümü */
  function soruListesi(tur) {
    var d = SUAN.d, liste = [];
    for (var k = 0; k < d.sorular.length; k++) {
      var c = d.cevaplar[k];
      var bosMu = (c === undefined || c === null);
      var dogruMu = !bosMu && c === d.sorular[k].dogru;
      if ((tur === "dogru" && dogruMu) || (tur === "yanlis" && !bosMu && !dogruMu) || (tur === "bos" && bosMu)) {
        liste.push({ j: k, s: d.sorular[k], c: c });
      }
    }
    var bas = tur === "dogru" ? "✅ Doğru Cevaplananlar"
            : tur === "yanlis" ? "❌ Yanlış Cevaplananlar"
            : "⏭ Boş Bıraktıklarım";
    var eski = document.querySelector(".soru-paneli");
    if (eski) eski.parentNode.removeChild(eski);
    var kap = document.createElement("div");
    kap.className = "modul sinav-perde soru-paneli";
    var govde = "<div class='modul-ic'><div class='soru-kutu'><h3 class='panel-baslik " + tur + "'>" +
      bas + " (" + liste.length + ")</h3>";
    if (!liste.length) {
      govde += "<p class='aciklama'>" + (tur === "dogru" ? "Henüz doğru cevaplanan soru yok — şıkkı işaretledikçe burada birikecek."
        : tur === "yanlis" ? "Yanlış cevaplanan soru yok. Aferin!" : "Boş bıraktığın soru yok. Aferin!") + "</p>";
    } else {
      govde += "<p class='aciklama'>Bir soruya dokununca sınavda o soru açılır.</p><div class='panel-liste'>" +
        liste.map(function (x) {
          var alt = tur === "yanlis"
            ? "Verdiğin: " + "ABCD".charAt(x.c) + " · Doğru: " + "ABCD".charAt(x.s.dogru) + ") " + (x.s.secenekler[x.s.dogru] || "").slice(0, 34)
            : tur === "dogru"
            ? "Doğru cevap: " + "ABCD".charAt(x.s.dogru) + ") " + (x.s.secenekler[x.s.dogru] || "").slice(0, 42)
            : "Cevap verilmedi · Doğru: " + "ABCD".charAt(x.s.dogru);
          return "<button class='panel-satir " + tur + "' data-git='" + x.j + "'><b>" + (x.j + 1) + "</b>" +
            "<span>" + x.s.ders + " · " + x.s.konu + "<i>" + alt + "</i></span></button>";
        }).join("") + "</div>";
    }
    govde += "<div class='soru-alt'><button class='ikincil-dugme' data-kapat='1'>Kapat</button>" +
      (liste.length ? "<button class='ikincil-dugme' data-ilk='" + liste[0].j + "'>İlkine git →</button>" : "") +
      "</div></div></div>";
    kap.innerHTML = govde;
    document.body.appendChild(kap);
    kap.querySelector("[data-kapat]").addEventListener("click", function () { kap.parentNode.removeChild(kap); });
    var ilk = kap.querySelector("[data-ilk]");
    if (ilk) ilk.addEventListener("click", function () {
      SUAN.gorunen = Number(ilk.getAttribute("data-ilk")); kap.parentNode.removeChild(kap); ciz();
    });
    kap.querySelectorAll("[data-git]").forEach(function (b) {
      b.addEventListener("click", function () {
        SUAN.gorunen = Number(b.getAttribute("data-git")); kap.parentNode.removeChild(kap); ciz();
      });
    });
  }

  function islem(kod) {
    var d = SUAN.d;
    if (kod === "onceki") { SUAN.gorunen = Math.max(0, SUAN.gorunen - 1); ciz(); }
    else if (kod === "sonraki") { SUAN.gorunen = Math.min(d.sorular.length - 1, SUAN.gorunen + 1); ciz(); }
    else if (kod === "isaretle") { d.isaretli[SUAN.gorunen] = !d.isaretli[SUAN.gorunen]; kaydet(d); ciz(); }
    else if (kod === "dogru") soruListesi("dogru");
    else if (kod === "yanlis") soruListesi("yanlis");
    else if (kod === "optik") { SUAN.optik = !SUAN.optik; ciz(); }
    else if (kod === "bos") soruListesi("bos");
    else if (kod === "bitir") bitir(false);
  }

  function sayacBaslat() {
    if (SUAN.zamanlayici) clearInterval(SUAN.zamanlayici);
    var tik = function () {
      var yer = $("#sinavSayac");
      if (!yer) { clearInterval(SUAN.zamanlayici); return; }
      var kalan = (SUAN.d.bitis - Date.now()) / 1000;
      yer.textContent = "⏳ " + snBicim(kalan);
      yer.style.color = kalan < 300 ? "#dc2626" : "";
      if (kalan <= 0) { clearInterval(SUAN.zamanlayici); bitir(true); }
    };
    tik();
    SUAN.zamanlayici = setInterval(tik, 1000);
  }

  /* ═══════════ 3) BİTİR + SONUÇ ═══════════ */
  function bitir(sureBitti) {
    var d = SUAN ? SUAN.d : durum();
    if (!d) return;
    if (SUAN && SUAN.zamanlayici) clearInterval(SUAN.zamanlayici);
    d.bitti = true;
    d.sureBitti = !!sureBitti;
    kaydet(d);
    if (sureBitti) koy("deneme.kilit", Date.now() + KILIT_DK * 60000);
    sonuc(d, sureBitti);
  }

  function sonuc(d, sureBitti) {
    var eski = $(".sinav-perde"); if (eski) eski.parentNode.removeChild(eski);
    var dersler = {};
    var dogru = 0, yanlis = 0, bos = 0;
    var yanlisKonu = al("yanlisKonu", {});

    d.sorular.forEach(function (s, i) {
      var c = d.cevaplar[i];
      var ad = s.ders || "Diğer";
      if (!dersler[ad]) dersler[ad] = { soru: 0, dogru: 0, yanlis: 0, bos: 0 };
      dersler[ad].soru++;
      if (c === undefined || c === null) { bos++; dersler[ad].bos++; }
      else if (c === s.dogru) { dogru++; dersler[ad].dogru++; }
      else {
        yanlis++; dersler[ad].yanlis++;
        var anahtar = (s.konu || "Konu") + "|" + ad;
        yanlisKonu[anahtar] = (yanlisKonu[anahtar] || 0) + 1;
      }
    });
    koy("yanlisKonu", yanlisKonu);

    var ist = al("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 });
    ist.cozulen += d.sorular.length; ist.dogru += dogru; ist.yanlis += yanlis; ist.bos += bos;
    koy("ist", ist);

    var basari = d.sorular.length ? Math.round((dogru / d.sorular.length) * 100) : 0;

    var tablo = "<table class='program-tablo'><tr><th>Ders</th><th>Soru</th><th>Doğru</th><th>Yanlış</th><th>Boş</th><th>Başarı</th></tr>";
    Object.keys(dersler).forEach(function (ad) {
      var x = dersler[ad];
      var y = x.soru ? Math.round((x.dogru / x.soru) * 100) : 0;
      tablo += "<tr><td>" + ad + "</td><td>" + x.soru + "</td><td>" + x.dogru + "</td><td>" +
               x.yanlis + "</td><td>" + x.bos + "</td><td>%" + y + "</td></tr>";
    });
    tablo += "<tr><td><b>TOPLAM</b></td><td><b>" + d.sorular.length + "</b></td><td><b>" + dogru +
             "</b></td><td><b>" + yanlis + "</b></td><td><b>" + bos + "</b></td><td><b>%" + basari + "</b></td></tr></table>";

    var optik = "<div class='optik'><div class='optik-baslik'>OPTİK FORM — yeşil doğru, kırmızı yanlış, gri boş</div><div class='optik-izgara'>";
    d.sorular.forEach(function (s, i) {
      var c = d.cevaplar[i], sinif = "bos";
      if (c !== undefined && c !== null) sinif = (c === s.dogru) ? "cevapli" : "yanlis";
      if (d.isaretli[i]) sinif += " isaretli";
      optik += "<button class='optik-kutu " + sinif + "'>" + (i + 1) + "</button>";
    });
    optik += "</div></div>";

    var kap = document.createElement("div");
    kap.className = "modul sinav-perde";
    kap.innerHTML = "<div class='modul-ic'>" +
      "<div class='soru-kutu'>" +
      "<h3 style='margin:0 0 6px'>" + (sureBitti ? "⛔ Süre doldu — sınav otomatik bitirildi" : "✅ Sınav bitti") +
        " · Deneme " + d.no + "</h3>" +
      "<div class='deneme-bilgi'>" +
        "<div class='bilgi-kutu'><b>" + dogru + "</b><span>Doğru</span></div>" +
        "<div class='bilgi-kutu'><b>" + yanlis + "</b><span>Yanlış</span></div>" +
        "<div class='bilgi-kutu'><b>" + bos + "</b><span>Boş</span></div>" +
        "<div class='bilgi-kutu'><b>%" + basari + "</b><span>Başarı</span></div>" +
      "</div>" +
      "<p class='aciklama'>KPSS'de yanlış doğruyu götürmez; puan doğru sayısı üzerinden hesaplanır. " +
        "Süre bitiminden sonra " + KILIT_DK + " dakika sorulara erişim kapalıdır.</p>" +
      "<h4 style='margin:14px 0 6px'>Ders Bazlı Sonuç</h4>" + tablo + optik +
      "<div class='soru-alt'>" +
        "<button class='ikincil-dugme' data-oneri='1'>💡 Eksik Konularıma Git</button>" +
        "<button class='ikincil-dugme kirmizi' data-yeniden='1'>Deneme Sayacımı Sıfırla</button>" +
        "<button class='ikincil-dugme' data-kapat='1'>Kapat</button>" +
      "</div></div></div>";
    document.body.appendChild(kap);

    kap.querySelector("[data-kapat]").addEventListener("click", function () { kap.parentNode.removeChild(kap); panel(); });
    kap.querySelector("[data-oneri]").addEventListener("click", function () {
      kap.parentNode.removeChild(kap);
      if (window.USTAD_MOTOR && window.USTAD_MOTOR.oneriyor) window.USTAD_MOTOR.oneriyor();
      if (window.USTAD_MOTOR && window.USTAD_MOTOR.git) window.USTAD_MOTOR.git("oneriyor");
    });
    kap.querySelector("[data-yeniden]").addEventListener("click", function () {
      koy("deneme.durum", null); koy("deneme.kilit", 0);
      kap.parentNode.removeChild(kap); panel();
    });
    /* Tebrik / teselli animasyonu (kız-erkek öğrenci maskotu motor tarafında çizilir) */
    if (window.USTAD_MOTOR && window.USTAD_MOTOR.kutlama) {
      window.USTAD_MOTOR.kutlama(basari, "Deneme " + d.no, d.sorular.length + " soru");
    }
  }

  /* ═══════════ 4) DIŞA AÇIK ═══════════ */
  window.Deneme = {
    panel: panel,
    basla: basla,
    bitir: function (sure) { bitir(!!sure); },
    kilitliMi: suAnKilitli,
    bankaSayisi: function () { return banka().length; },
    /* Ölçüm/demo: soruları örnek biçimde doldurur (ekran görüntüsü ve sınama için) */
    demoDoldur: function () {
      var d = (SUAN && SUAN.d) ? SUAN.d : durum();
      if (!d) return 0;
      var doldurulan = 0;
      d.sorular.forEach(function (s, i) {
        var r = (i * 7 + 3) % 10;
        if (r < 7) {
          // cevapların çoğu doğru, bir kısmı yanlış (gerçekçi sonuç ekranı için)
          d.cevaplar[i] = (i % 3 === 0) ? ((s.dogru + 1) % 4) : s.dogru;
          doldurulan++;
        } else if (r < 8) {
          d.isaretli[i] = true;   // işaretli ama boş
        }
      });
      kaydet(d);
      return doldurulan;
    }
  };
})();
