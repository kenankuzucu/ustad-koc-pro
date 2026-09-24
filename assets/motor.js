/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Sınav Koçu (KPSS-B paketi) · TÜM HAKLARI SAKLIDIR.
   5846 sayılı FSEK kapsamında korunur. İzinsiz çoğaltma, kopyalama, satış, dağıtım,
   değiştirme, tersine mühendislik ve türev eser üretimi yasaktır.
   Eser künyesi ve kullanım lisansı: uygulama içinde 'Hakkında & Telif' bölümü. */
/* ═══════════════════════════════════════════════════════════════════
   ÜSTAD MOTOR · motor.js  — sınavdan bağımsız çekirdek
   Paket: icerik/veri.js (window.USTAD_PAKET). Motor değişmez, paket değişir.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var P = window.USTAD_PAKET;

  /* ---------- Bölümler: her bölümün KENDİ rengi ve simgesi ---------- */
  var BOLUMLER = [
    { kod: "ana",        ad: "Ana Sayfa",       simg: "🏠", renk: "var(--ana)",        renk2: "#0e9f8e" },
    { kod: "program",    ad: "Ders Programı",   simg: "🗓️", renk: "var(--program)",    renk2: "#4f46e5" },
    { kod: "oneriyor",   ad: "ÜSTAD Öneriyor",  simg: "💡", renk: "var(--oneriyor)",   renk2: "#e08a00" },
    { kod: "testler",    ad: "Testler",         simg: "📝", renk: "var(--testler)",    renk2: "#12a150" },
    { kod: "deneme",     ad: "Deneme Sınavı",   simg: "🎯", renk: "var(--deneme)",     renk2: "#dc2626" },
    { kod: "notlar",     ad: "Ders Notları",    simg: "📚", renk: "var(--notlar)",     renk2: "#7c3aed" },
    { kod: "istatistik", ad: "İstatistik",      simg: "📊", renk: "var(--istatistik)", renk2: "#1d6fe0" },
    { kod: "ayarlar",    ad: "Ayarlar",         simg: "⚙️", renk: "var(--ayarlar)",    renk2: "#556070" },
    { kod: "hakkinda",   ad: "Hakkında & Telif", simg: "©️", renk: "var(--hakkinda)",  renk2: "#0b5570" }
  ];
  var RENKLER = [
    { kod: "turkuaz", ad: "Turkuaz" }, { kod: "badem", ad: "Badem" },
    { kod: "lavanta", ad: "Lavanta" }, { kod: "gul", ad: "Gül" },
    { kod: "gokyuzu", ad: "Gökyüzü" }, { kod: "nane", ad: "Nane" },
    { kod: "kum", ad: "Kum" }, { kod: "karanfil", ad: "Karanfil" },
    { kod: "fistik", ad: "Fıstık" }, { kod: "antik", ad: "Antik" },
    { kod: "deniz", ad: "Deniz" }, { kod: "gece", ad: "Gece" }
  ];
  var RENK_SERIT = {
    turkuaz: ["#eef7f6", "#0e9f8e", "#0a7f72"], badem: ["#f7f3e9", "#c99a2e", "#a87f1d"],
    lavanta: ["#f2eefb", "#7c3aed", "#6429c9"], gul: ["#fdeff2", "#d6336c", "#b22657"],
    gokyuzu: ["#eef4fd", "#1d6fe0", "#1659b8"], nane: ["#eef8ee", "#12a150", "#0d8442"],
    kum: ["#f8f2e6", "#b07d2b", "#8e6320"], karanfil: ["#f6efef", "#a04b4b", "#7f3a3a"],
    fistik: ["#f3f8e8", "#6b8e23", "#527013"], antik: ["#f4f1ec", "#8a7f6d", "#6b6253"],
    deniz: ["#e9f2f7", "#0f6f92", "#0b5570"], gece: ["#1b2130", "#3b82f6", "#1e40af"]
  };
  var GUNLER = { "1": "Pazartesi", "2": "Salı", "3": "Çarşamba", "4": "Perşembe", "5": "Cuma", "6": "Cumartesi", "0": "Pazar" };
  var GUN_KISA = { "1": "Pzt", "2": "Sal", "3": "Çar", "4": "Per", "5": "Cum", "6": "Cmt", "0": "Paz" };

  /* ---------- Basit depo (APK'da localStorage kalıcıdır) ---------- */
  var Depo = {
    al: function (anahtar, varsayilan) {
      try { var v = localStorage.getItem("ustad." + anahtar); return v === null ? varsayilan : JSON.parse(v); }
      catch (e) { return varsayilan; }
    },
    koy: function (anahtar, deger) {
      try { localStorage.setItem("ustad." + anahtar, JSON.stringify(deger)); } catch (e) {}
    }
  };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* ═════════ 1) MENÜ + YÖNLENDİRME ═════════ */
  function menuKur() {
    var kap = $(".menu-icerik");
    var h = document.createElement("div");
    h.className = "menu-baslik";
    h.innerHTML = '<img src="tasarim/ustad-kafa.png" alt=""><b>ÜSTAD KOÇ PRO</b>';
    kap.appendChild(h);

    var grup = document.createElement("div");
    grup.className = "menu-grup";
    grup.textContent = "BÖLÜMLER";
    kap.appendChild(grup);

    BOLUMLER.forEach(function (b) {
      var d = document.createElement("button");
      d.className = "menu-oge";
      d.setAttribute("data-git", b.kod);
      d.style.setProperty("--bolum", b.renk);
      var rozet = "";
      if (b.kod === "testler") rozet = "<span class='rozet'>30 soru</span>";
      if (b.kod === "deneme") rozet = "<span class='rozet'>" + P.sinav.soruSayisi + " soru</span>";
      d.innerHTML = "<span class='simg-renk'>" + b.simg + "</span>" +
                    "<span class='etiket'>" + b.ad + "</span>" + rozet;
      kap.appendChild(d);
    });
  }

  function git(kod) {
    $$(".ekran").forEach(function (e) { e.classList.remove("acik"); });
    var hedef = $("#ekran-" + kod);
    if (hedef) hedef.classList.add("acik");
    $$(".menu-oge").forEach(function (o) {
      o.classList.toggle("secili", o.getAttribute("data-git") === kod);
    });
    var b = BOLUMLER.filter(function (x) { return x.kod === kod; })[0];
    if (b) {
      document.body.setAttribute("data-bolum", kod);
      document.body.style.setProperty("--bolum", b.renk);
      document.title = "ÜSTAD KOÇ PRO · " + b.ad;
    }
    menuKapat();
    window.scrollTo(0, 0);
    // Ayarlar açılınca profil kartı (isim, maskot, fotoğraf önizlemesi) tazelenir
    if (kod === "ayarlar") ayarlar();
    // Ana sayfa açılınca panel madalyonu (fotoğraf/maskot + ÜSTAD <AD>) tazelenir
    if (kod === "ana") anaMadalyon();
    // Hakkında & Telif açılınca künye, telif ve bütünlük kontrolü tazelenir
    if (kod === "hakkinda") hakkinda();
  }

  function menuAc() { $("#menu").classList.add("acik"); $("#menuPerde").classList.add("acik"); }
  function menuKapat() { $("#menu").classList.remove("acik"); $("#menuPerde").classList.remove("acik"); }

  /* ═════════ 2) SESLİ KARŞILAMA (cinsiyete göre ses: kız → kadın sesi, erkek → erkek sesi) ═════════ */
  var KADIN_SES = ["filiz", "female", "kadın", "kadin", "aylin", "zira", "emel", "yelda", "dilara", "seda", "esra", "hande", "dilruba"];
  var ERKEK_SES = ["tolga", "male", "erkek", "ahmet", "mert", "kerem", "murat", "mustafa", "emre", "can"];

  /* Türkçe sesler arasından cinsiyete uyanı seçer; yoksa ilk Türkçe sesi döner */
  function sesSec(kadin, sesler) {
    var tr = sesler.filter(function (s) { return (s.lang || "").toLowerCase().indexOf("tr") === 0; });
    var havuz = tr.length ? tr : sesler;
    var anahtar = kadin ? KADIN_SES : ERKEK_SES;
    for (var i = 0; i < havuz.length; i++) {
      var ad = (havuz[i].name || "").toLowerCase();
      for (var j = 0; j < anahtar.length; j++) { if (ad.indexOf(anahtar[j]) >= 0) return havuz[i]; }
    }
    // İkinci tur: seste cinsiyet etiketi yoksa sırayla dene (birden fazla Türkçe ses varsa kız/erkek ayrı sese düşsün)
    if (havuz.length > 1) return kadin ? havuz[havuz.length - 1] : havuz[0];
    return havuz[0] || null;
  }

  function konus(metin) {
    if (!Depo.al("ses", true)) return;
    try { window.__sonKonusma = metin; } catch (e) {}
    var kadin = (cinsiyet() === "kiz");
    // Cinsiyet etiketli ses yoksa perde (pitch) farkı cinsiyet hissini verir: kadın daha ince, erkek daha kalın
    var pitch = kadin ? 1.32 : 0.78;
    var rate = kadin ? 1.00 : 0.95;
    var sesler = [], sesAdi = null;
    try {
      sesler = (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
      var v = sesSec(kadin, sesler);
      if (v) sesAdi = v.name;
    } catch (e) {}
    try {
      window.__sonSes = { cins: kadin ? "kiz" : "erkek", pitch: pitch, rate: rate, sesAdi: sesAdi, sesSayisi: sesler.length };
    } catch (e) {}
    // APK kabuğunda cihazın Türkçe konuşma motoru kullanılır (perde/ton da geçirilir)
    try {
      if (window.USTAD && window.USTAD.konusTon) { window.USTAD.konusTon(metin, pitch, rate); return; }
      if (window.USTAD && window.USTAD.konus) { window.USTAD.konus(metin); return; }
    } catch (e) {}
    try {
      var u = new SpeechSynthesisUtterance(metin);
      u.lang = "tr-TR"; u.rate = rate; u.pitch = pitch;
      if (sesAdi) {
        var bul = sesler.filter(function (s) { return s.name === sesAdi; })[0];
        if (bul) u.voice = bul;
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ═════════ 3) KARŞILAMA PERDESİ ═════════ */
  /* Kız/erkek seçimi — perde ve Ayarlar aynı deseni kullanır */
  function cinsBagla(kapSec, hemenKaydet) {
    var dugmeler = $$(kapSec + " .cins-dugme");
    dugmeler.forEach(function (b) {
      if (b.getAttribute("data-cins") === cinsiyet()) b.classList.add("secili");
      b.addEventListener("click", function () {
        dugmeler.forEach(function (x) { x.classList.remove("secili"); });
        b.classList.add("secili");
        if (hemenKaydet) {
          Depo.koy("cinsiyet", b.getAttribute("data-cins"));
          // Seçim anında kendi sesiyle kısa bir örnek (kız → kadın sesi, erkek → erkek sesi)
          var k = b.getAttribute("data-cins") === "kiz";
          konus(k ? "Merhaba! Ben kız öğrenci maskotunum. Seni kutlamak için sabırsızlanıyorum."
                  : "Merhaba! Ben erkek öğrenci maskotunum. Seni kutlamak için sabırsızlanıyorum.");
        }
      });
    });
  }

  function perde() {
    var isim = Depo.al("isim", "");
    anaMadalyon();
    if (isim) {
      $("#perde").classList.add("kapali");
      karsilamaYaz(isim);
      setTimeout(function () { konus("ÜSTAD sınav koçuna hoş geldin " + isim + ". Hazırsan başlayalım."); }, 500);
    }
    cinsBagla("#perdeCins", true);
    fotoBagla("#perdeFoto", "#perdeFotoSec", "#perdeFotoOnizleme", null);
    $("#isimKaydet").addEventListener("click", function () {
      var v = ($("#isimKutu").value || "").trim();
      if (v.length < 2) { $("#isimKutu").focus(); return; }
      // Kendi fotoğrafını seçtiyse maskot seçmesi gerekmez
      if (!cinsiyet() && !Depo.al("fotoAktif", false)) { konus("Kim görünsün: kız öğrenci, erkek öğrenci ya da kendi fotoğrafınız."); $("#perdeCins").classList.add("uyari"); return; }
      Depo.koy("isim", v);
      $("#perde").classList.add("kapali");
      karsilamaYaz(v);
      konus("Hoş geldin " + v + ". ÜSTAD sınav koçuna hoş geldiniz. Sana özel ders programını kurmaya hazırım.");
      git("program");
    });
    $("#isimKutu").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#isimKaydet").click(); });
  }

  function karsilamaYaz(isim) {
    $("#karsilamaYazi").textContent = "Hoş geldiniz " + isim + " · ÜSTAD yanınızda";
    anaMadalyon();
  }

  /* Ana sayfa panel başlığı: kendi fotoğrafı (ya da maskot) BÜYÜK madalyon + "ÜSTAD <AD>" */
  function anaMadalyon() {
    var kap = $("#anaMadalyon"); if (!kap) return;
    var foto = Depo.al("foto", null), aktif = Depo.al("fotoAktif", false);
    var ad = (Depo.al("isim", "") || "").trim();
    kap.innerHTML = (foto && aktif)
      ? "<img src='" + foto + "' alt='" + (ad || "Öğrenci") + " fotoğrafı'>"
      : maskotSVG(cinsiyet() || "erkek", "kazandi", true);
    var yz = $("#anaUstadAd");
    if (yz) yz.textContent = "ÜSTAD " + (ad ? ad.toLocaleUpperCase("tr-TR") : "ÖĞRENCİ");
  }

  /* ═════════ 4) 3B KÜRE (perde fonu; saf canvas, kütüphane yok) ═════════ */
  function kure() {
    var c = $("#kure"); if (!c) return;
    var ctx = c.getContext("2d"), noktalar = [], aci = 0;
    function boyutlandir() {
      c.width = c.clientWidth; c.height = c.clientHeight;
      noktalar = [];
      var n = 420, altin = Math.PI * (3 - Math.sqrt(5));
      for (var j = 0; j < n; j++) {
        var y = 1 - (j / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = altin * j;
        noktalar.push({ x: Math.cos(t) * r, y: y, z: Math.sin(t) * r });
      }
    }
    function ciz() {
      var g = c.width, y2 = c.height, r = Math.min(g, y2) * 0.42, cx = g / 2, cy = y2 / 2;
      ctx.clearRect(0, 0, g, y2);
      aci += 0.0035;
      var ca = Math.cos(aci), sa = Math.sin(aci);
      noktalar.forEach(function (p) {
        var x = p.x * ca - p.z * sa, z = p.x * sa + p.z * ca;
        var k = 1.6 / (1.6 + z);
        var ek = cx + x * r * k, ey = cy + p.y * r * k;
        var derin = (z + 1) / 2;
        var renk = z < 0 ? "255,140,60" : "210,90,220";
        ctx.fillStyle = "rgba(" + renk + "," + (0.18 + (1 - derin) * 0.6).toFixed(2) + ")";
        ctx.beginPath(); ctx.arc(ek, ey, 1.7 * k, 0, 6.284); ctx.fill();
      });
      requestAnimationFrame(ciz);
    }
    boyutlandir(); ciz();
    window.addEventListener("resize", boyutlandir);
  }

  /* ═════════ 5) ANA SAYFA: duyuru akışı (canlı haber beslemesi) ═════════ */
  function duyurular() {
    var kap = $("#duyuruAkis");
    kap.innerHTML = "";
    var besleme = window.USTAD_BESLEME;
    var canli = !!(besleme && besleme.haberler && besleme.haberler.length);
    var liste = canli ? besleme.haberler : P.duyurular;

    liste.slice(0, 25).forEach(function (h) {
      var a = document.createElement("div");
      a.className = "duyuru";
      var tarih = h.tarih ? kisaTarih(h.tarih) : "";
      a.innerHTML = h.baslik + "<span class='kaynak'>" + h.kaynak + (tarih ? " · " + tarih : "") + "</span>";
      a.addEventListener("click", function () { haberAc(h); });
      kap.appendChild(a);
    });

    var dip = $(".duyuru-dip");
    if (dip) {
      dip.textContent = canli
        ? "Canlı besleme · " + liste.length + " haber · son güncelleme " + kisaTarih(besleme.guncelleme) +
          " · Başlığa dokun → haber uygulama içinde açılır."
        : "Örnek besleme · haber servisi bağlanınca gerçek haberler akar.";
    }
  }

  function kisaTarih(iso) {
    if (!iso) return "";
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return String(iso).slice(0, 16);
    var ay = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz",
              "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"][Number(m[2]) - 1];
    return m[4] + ":" + m[5] + " · " + Number(m[3]) + " " + ay;
  }

  /* Haber penceresi: başlık + özet uygulama İÇİNDE açılır (yeni sekme kullanılmaz) */
  function haberAc(h) {
    var eski = $(".haber-perde"); if (eski) eski.parentNode.removeChild(eski);
    var kap = document.createElement("div");
    kap.className = "modul haber-perde";
    kap.innerHTML = "<div class='modul-ic'><div class='soru-kutu'>" +
      "<div class='soru-ust'><span>" + (h.kaynak || "Haber") + "</span><span>" +
      (h.tarih ? kisaTarih(h.tarih) : "") + "</span></div>" +
      "<h3 style='margin:8px 0 10px;line-height:1.35'>" + h.baslik + "</h3>" +
      (h.ozet ? "<p style='font-size:14px;line-height:1.55'>" + h.ozet + "</p>" : "") +
      "<p class='aciklama'>Haberin tamamı kaynağında okunur.</p>" +
      "<div class='soru-alt'>" +
      (h.url ? "<button class='ikincil-dugme' data-ac='1'>📰 Haberi Kaynağında Aç</button>" : "") +
      "<button class='ikincil-dugme' data-kapat='1'>Kapat</button>" +
      "</div></div></div>";
    document.body.appendChild(kap);
    var kapat = kap.querySelector("[data-kapat]");
    if (kapat) kapat.addEventListener("click", function () { kap.parentNode.removeChild(kap); });
    var ac = kap.querySelector("[data-ac]");
    if (ac) ac.addEventListener("click", function () { window.location.href = h.url; });
  }

  /* ═════════ 6) DERS PROGRAMI: anket → kişiye özel program ═════════ */
  function anketKur() {
    var sev = $("#sevKutu"), zor = $("#zorKutu");
    P.dersler.forEach(function (d) {
      sev.appendChild(cipYap(d.ad, "sev"));
      zor.appendChild(cipYap(d.ad, "zor"));
    });
  }
  function cipYap(ad) {
    var l = document.createElement("label");
    l.className = "cip";
    l.innerHTML = '<input type="checkbox" value="' + ad + '"><span>' + ad + '</span>';
    return l;
  }
  function secilen(kap) {
    return $$("#" + kap + " input:checked").map(function (i) { return i.value; });
  }

  function programUret(veri) {
    var bas = veri.bas, bit = veri.bit;
    var basS = saatDk(bas), bitS = saatDk(bit);
    var sevilen = secilen("sevKutu"), zorlanan = secilen("zorKutu");
    var havuz = zorlanan.concat(sevilen);
    if (!havuz.length) havuz = P.dersler.map(function (d) { return d.ad; });
    // Zorlanan derslerin ARASINA sevilen dersleri yerleştir
    var sira = [];
    var z = zorlanan.slice(), s = sevilen.slice();
    while (z.length || s.length) {
      if (z.length) sira.push(z.shift());
      if (s.length) sira.push(s.shift());
      if (!z.length && !s.length) break;
      if (z.length) sira.push(z.shift());
      if (s.length) sira.push(s.shift());
    }
    if (!sira.length) sira = havuz;

    var gunSaat = Number(veri.sure) || 4;
    var blokDk = 55, araDk = 10, soruDk = 35;
    var plan = [], i = 0, t = basS, son = bitS;
    while (t + blokDk <= son && plan.length < gunSaat * 3) {
      var ders = sira[i % sira.length];
      plan.push({ tur: "konu", ders: ders, bas: dkSaat(t), bit: dkSaat(t + blokDk), dk: blokDk });
      t += blokDk + araDk;
      plan.push({ tur: "soru", ders: ders, bas: dkSaat(t), bit: dkSaat(t + soruDk), dk: soruDk });
      t += soruDk + araDk;
      i++;
      if (bitS - t < blokDk + araDk + soruDk) break;
    }
    if (plan.length) plan.push({ tur: "bos", ders: "Boş Zaman", bas: dkSaat(t), bit: dkSaat(Math.min(t + 60, son)), dk: 60 });

    var ilk = plan[0], ilkBildirim = ilk ? dkEksi(ilk.bas, 5) : "-";
    var html = "<h3>🗓️ " + (veri.gunler.length) + " günlük kişisel programın hazır</h3>" +
      "<p class='aciklama'>Uyanma " + veri.uyanma + " · Uyuma " + veri.uyuma +
      " · Çalışma aralığı " + veri.bas + "-" + veri.bit + " · Hedef puan " + veri.puan1 + "-" + veri.puan2 +
      " · Günde " + veri.sure + " saat</p>";
    var alt = "<p class='aciklama'>Zorlandığın derslerin arasına sevdiğin dersler yerleştirildi: <b>" +
      (sira.length ? sira.join(" → ") : "-") + "</b></p>";

    var tablo = "<table class='program-tablo'><tr><th>Saat</th><th>Ders</th><th>Çalışma</th><th>Bildirim</th></tr>";
    plan.forEach(function (b) {
      var turAd = b.tur === "konu" ? "Konu Çalışması" : (b.tur === "soru" ? "Soru Çözümü" : "Boş Zaman");
      var sinif = b.tur === "konu" ? "tur-konu" : (b.tur === "soru" ? "tur-soru" : "tur-bos");
      var bild = b.tur === "konu" ? "🔔 " + dkEksi(b.bas, 5) + " · “Saat " + b.bas + "’te " + b.ders + " çalışman var”" : "—";
      tablo += "<tr><td>" + b.bas + " - " + b.bit + "</td><td>" + b.ders + "</td>" +
               "<td><span class='etiket-tur " + sinif + "'>" + turAd + "</span></td><td>" + bild + "</td></tr>";
    });
    tablo += "</table>";

    var takip = "<p class='aciklama'>Uyum takibi açık: program saati geldiğinde çalışmaya başlamazsan " +
      "ÜSTAD seni uyarır ve istatistiğine “uyulmadı” olarak işler.</p>";

    var kap = $("#programSonuc");
    kap.classList.remove("gizli");
    kap.innerHTML = html + alt + tablo + takip;
    Depo.koy("program", { gunler: veri.gunler, plan: plan, kuruldu: new Date().toISOString() });
    konus("Programın hazır. " + (plan[0] ? "İlk ders " + plan[0].bas + "'te " + plan[0].ders + "." : ""));
    kap.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function saatDk(s) { var p = String(s).split(":"); return Number(p[0]) * 60 + Number(p[1]); }
  function dkSaat(dk) { dk = ((dk % 1440) + 1440) % 1440; var s = Math.floor(dk / 60), d = dk % 60; return (s < 10 ? "0" : "") + s + ":" + (d < 10 ? "0" : "") + d; }
  function dkEksi(s, d) { return dkSaat(saatDk(s) - d); }

  function anketBagla() {
    $("#anket").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      var gunler = $$("#gunKutu input:checked").map(function (i) { return i.value; });
      if (!gunler.length) { alert("En az bir gün seçmelisin."); return; }
      programUret({
        uyanma: f.uyanma.value, uyuma: f.uyuma.value, bas: f.bas.value, bit: f.bit.value,
        gunler: gunler, puan1: f.puan1.value, puan2: f.puan2.value, sure: f.sure.value
      });
    });
  }

  /* ═════════ 7) TESTLER + SORU MODÜLÜ ═════════ */
  function bankaSorulari() {
    if (window.USTAD_SORULAR && window.USTAD_SORULAR.length) return window.USTAD_SORULAR;
    return P.ornekSorular;
  }

  function testler() {
    var kap = $("#testListe"); kap.innerHTML = "";
    var ist = Depo.al("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 });
    var banka = bankaSorulari();
    P.dersler.forEach(function (d) {
      var adet = banka.filter(function (s) { return s.ders === d.ad; }).length;
      var kart = document.createElement("div");
      kart.className = "liste-kart";
      kart.style.setProperty("--bolum", "var(--testler)");
      var oran = adet ? Math.min(100, Math.round((adet / d.konular.length) * 100)) : 0;
      kart.innerHTML = "<span class='ikon'>" + d.simg + "</span>" +
        "<span class='govde'><b>" + d.ad + " · Konu Testleri</b>" +
        "<span>" + d.konular.length + " konu · bankada " + adet + " soru · her test 30 soru · süresiz</span>" +
        "<span class='ilerleme'><i style='width:" + oran + "%'></i></span></span>" +
        "<button class='kucuk-dugme'>Test Çöz</button>";
      kart.querySelector("button").addEventListener("click", function () { testAc(d); });
      kap.appendChild(kart);
    });
  }

  var SUANKI = null;

  function testAc(ders) {
    var sorular = bankaSorulari().filter(function (s) { return s.ders === ders.ad; });
    if (!sorular.length) sorular = bankaSorulari().slice(0, 3);
    SUANKI = { ders: ders.ad, sorular: sorular, i: 0, cevap: {}, mod: "test", basladi: Date.now() };
    modulCiz();
  }

  function modulCiz() {
    var eski = $(".modul"); if (eski) eski.parentNode.removeChild(eski);
    var s = SUANKI.sorular[SUANKI.i];
    var verilen = SUANKI.cevap[SUANKI.i];
    var cevaplandi = (verilen !== undefined && verilen !== null);
    var dogruMu = cevaplandi && verilen === s.dogru;
    var kap = document.createElement("div");
    kap.className = "modul";
    var bosSay = Object.keys(SUANKI.cevap).filter(function (k) { return SUANKI.cevap[k] === null; }).length;
    var yanlisSay = Object.keys(SUANKI.cevap).filter(function (k) { return SUANKI.cevap[k] !== null && SUANKI.cevap[k] !== SUANKI.sorular[k].dogru; }).length;
    var dogruSay = Object.keys(SUANKI.cevap).filter(function (k) {
      return SUANKI.cevap[k] !== null && SUANKI.cevap[k] !== undefined && SUANKI.cevap[k] === SUANKI.sorular[k].dogru;
    }).length;

    /* Anında geri bildirim BANDI: soru kutusunun en üstünde, yapışkan — ekran nerede olursa olsun görünür */
    var bant = "";
    if (cevaplandi) {
      bant = "<div class='cevap-bant " + (dogruMu ? "iyi" : "kotu") + "'>" +
        "<span class='cb-isaret'>" + (dogruMu ? "✔" : "✘") + "</span>" +
        "<span class='cb-metin'>" + (dogruMu
          ? "<b>Doğru cevap verdiniz.</b><span class='cb-alt'>Aferin — bir sonraki soruya geçebilirsiniz.</span>"
          : "<b>Yanlış cevap.</b> Doğru cevap: <b>" + "ABCD".charAt(s.dogru) + ") " + (s.secenekler[s.dogru] || "") +
            "</b><span class='cb-alt'>Bu soru “Yanlış Cevaplanan Sorular” listesine işlendi.</span>") +
        "</span>" +
        "<button class='bant-dugme' data-islem='sonraki'>Sonraki Soru →</button>" +
        "</div>";
    }

    var govde = "<div class='modul-ic'>" + bant + "<div class='soru-kutu'>" +
      "<div class='soru-ust'><span>" + SUANKI.ders + " · " + s.konu + " · " + s.zorluk + "</span>" +
      "<span>Soru " + (SUANKI.i + 1) + " / " + SUANKI.sorular.length + "</span></div>" +
      "<div class='soru-metin'>" + s.metin + "<br><br><b>" + s.soru + "</b></div>";
    s.secenekler.forEach(function (sec, j) {
      var harf = "ABCD".charAt(j);
      var sinif = "";
      if (cevaplandi) {
        if (j === s.dogru) sinif = " dogru";              // doğru şık her zaman yeşil
        else if (j === verilen) sinif = " yanlis";        // seçtiğiniz yanlış şık kırmızı
        else sinif = " soluk";
      } else if (SUANKI.cevap[SUANKI.i] === j) { sinif = " secili"; }
      govde += "<div class='secenek" + sinif + "' data-sec='" + j + "'><b>" + harf + ")</b><span>" + sec + "</span></div>";
    });

    if (!cevaplandi) {
      govde += "<p class='aciklama'>Şıkkı işaretleyin; doğru ya da yanlış olduğunu <b>hemen</b> göstereceğim.</p>";
    }
    govde += "<div class='soru-alt'>" +
      "<button class='ikincil-dugme' data-islem='onceki'>← Önceki</button>" +
      "<button class='ikincil-dugme' data-islem='sonraki'>Sonraki →</button>" +
      "<button class='ikincil-dugme yesil' data-islem='dogru'>✅ Doğru Cevaplanan Sorular (" + dogruSay + ")</button>" +
      "<button class='ikincil-dugme sari' data-islem='bos'>Boş Bıraktığın Sorular (" + bosSay + ")</button>" +
      "<button class='ikincil-dugme kirmizi' data-islem='yanlis'>Yanlış Cevaplanan Sorular (" + yanlisSay + ")</button>" +
      "<button class='ikincil-dugme' data-islem='konu'>📖 Soru ile İlgili Konuya Git</button>" +
      "<button class='ikincil-dugme' data-islem='bitir'>Testi Bitir</button>" +
      "</div></div></div>";
    kap.innerHTML = govde;
    document.body.appendChild(kap);

    kap.querySelectorAll(".secenek").forEach(function (el) {
      el.addEventListener("click", function () {
        // Alıştırma kuralı: ilk cevaptan sonra değiştirilemez (anında geri bildirim verilir)
        if (SUANKI.cevap[SUANKI.i] !== undefined && SUANKI.cevap[SUANKI.i] !== null) return;
        var secim = Number(el.getAttribute("data-sec"));
        SUANKI.cevap[SUANKI.i] = secim;
        modulCiz();
        // sesli geri bildirim (Ayarlar > Sesli karşılama açıksa)
        if (secim === s.dogru) konus("Doğru cevap verdiniz.");
        else konus("Yanlış. Doğru cevap " + "ABCD".charAt(s.dogru) + ".");
      });
    });
    kap.querySelectorAll("[data-islem]").forEach(function (b) {
      b.addEventListener("click", function () { islem(b.getAttribute("data-islem")); });
    });
  }

  function islem(kod) {
    if (kod === "onceki") { SUANKI.i = Math.max(0, SUANKI.i - 1); modulCiz(); }
    else if (kod === "sonraki") { SUANKI.i = Math.min(SUANKI.sorular.length - 1, SUANKI.i + 1); modulCiz(); }
    else if (kod === "bos") soruPanel("bos");
    else if (kod === "yanlis") soruPanel("yanlis");
    else if (kod === "dogru") soruPanel("dogru");
    else if (kod === "konu") konuGit();
    else if (kod === "bitir") testBitir();
  }

  function bosGit(bosMu) {
    for (var j = 0; j < SUANKI.sorular.length; j++) {
      var c = SUANKI.cevap[j];
      if (bosMu && c === undefined) { SUANKI.i = j; modulCiz(); return; }
      if (!bosMu && c !== undefined && c !== null && c !== SUANKI.sorular[j].dogru) { SUANKI.i = j; modulCiz(); return; }
    }
    alert(bosMu ? "Boş bıraktığın soru yok." : "Yanlış cevapladığın soru yok.");
  }

  /* Soru listesi paneli: ✅ doğru · ❌ yanlış · ⏭ boş (Kenan'ın istediği "panel" görünümü) */
  function soruPanel(tur) {
    var liste = [];
    SUANKI.sorular.forEach(function (s, j) {
      var c = SUANKI.cevap[j];
      var bosMu = (c === undefined || c === null);
      var dogruMu = !bosMu && c === s.dogru;
      if ((tur === "bos" && bosMu) || (tur === "dogru" && dogruMu) || (tur === "yanlis" && !bosMu && !dogruMu)) {
        liste.push({ j: j, s: s, c: c });
      }
    });
    var baslik = tur === "dogru" ? "✅ Doğru Cevaplanan Sorular"
               : tur === "yanlis" ? "❌ Yanlış Cevaplanan Sorular"
               : "⏭ Boş Bıraktığın Sorular";
    var eski = $(".soru-paneli"); if (eski) eski.parentNode.removeChild(eski);
    var kap = document.createElement("div");
    kap.className = "modul soru-paneli";
    var govde = "<div class='modul-ic'><div class='soru-kutu'><h3 class='panel-baslik " + tur + "'>" +
      baslik + " (" + liste.length + ")</h3>";
    if (!liste.length) {
      govde += "<p class='aciklama'>" + (tur === "dogru" ? "Henüz doğru cevaplanan soru yok — şıkkı işaretledikçe burada birikecek."
        : tur === "yanlis" ? "Yanlış cevaplanan soru yok. Aferin!" : "Boş bıraktığın soru yok. Aferin!") + "</p>";
    } else {
      govde += "<p class='aciklama'>Bir soruya dokununca o soru açılır.</p><div class='panel-liste'>" +
        liste.map(function (x) {
          var alt = tur === "yanlis"
            ? "Verdiğin: " + "ABCD".charAt(x.c) + " · Doğru: " + "ABCD".charAt(x.s.dogru)
            : tur === "dogru" ? "Doğru cevap: " + "ABCD".charAt(x.s.dogru) + ") " + (x.s.secenekler[x.s.dogru] || "").slice(0, 42)
            : "Cevap verilmedi · Doğru: " + "ABCD".charAt(x.s.dogru);
          return "<button class='panel-satir " + tur + "' data-git='" + x.j + "'>" +
            "<b>" + (x.j + 1) + "</b><span>" + x.s.ders + " · " + x.s.konu + "<i>" + alt + "</i></span></button>";
        }).join("") + "</div>";
    }
    govde += "<div class='soru-alt'>" +
      "<button class='ikincil-dugme' data-kapat='1'>Kapat</button>" +
      (liste.length ? "<button class='ikincil-dugme' data-ilk='" + liste[0].j + "'>İlkine git →</button>" : "") +
      "</div></div></div>";
    kap.innerHTML = govde;
    document.body.appendChild(kap);
    kap.querySelector("[data-kapat]").addEventListener("click", function () { kap.parentNode.removeChild(kap); });
    var ilk = kap.querySelector("[data-ilk]");
    if (ilk) ilk.addEventListener("click", function () {
      var j = Number(ilk.getAttribute("data-ilk")); kap.parentNode.removeChild(kap); SUANKI.i = j; modulCiz();
    });
    kap.querySelectorAll("[data-git]").forEach(function (b) {
      b.addEventListener("click", function () {
        var j = Number(b.getAttribute("data-git")); kap.parentNode.removeChild(kap); SUANKI.i = j; modulCiz();
      });
    });
  }

  function konuGit() {
    var s = SUANKI.sorular[SUANKI.i];
    var notlar1 = tumNotlar().filter(function (n) {
      return n.ders === s.ders && (n.konu === s.konu || n.baslik === s.konu);
    });
    if (notlar1.length) { notAc(notlar1[0]); return; }
    var not = tumNotlar().filter(function (n) { return n.ders === s.ders; })[0];
    alert("📖 " + s.ders + " · " + s.konu + "\n\n" +
      (not ? not.baslik + "\n" + (not.ozet || "") : "Bu konunun ders notu henüz pakete eklenmemiş.") +
      "\n\n(Bu konunun notu yazıldığında doğrudan buradan açılacak.)");
  }

  function testBitir() {
    var eskiModul = $(".modul"); if (eskiModul) eskiModul.parentNode.removeChild(eskiModul);
    var dogru = 0, yanlis = 0, bos = 0, yanlisKonu = Depo.al("yanlisKonu", {});
    SUANKI.sorular.forEach(function (s, j) {
      var c = SUANKI.cevap[j];
      if (c === undefined || c === null) { bos++; yanlisKonu[s.konu + "|" + s.ders] = (yanlisKonu[s.konu + "|" + s.ders] || 0); }
      else if (c === s.dogru) dogru++;
      else { yanlis++; yanlisKonu[s.konu + "|" + s.ders] = (yanlisKonu[s.konu + "|" + s.ders] || 0) + 1; }
    });
    var ist = Depo.al("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 });
    ist.cozulen += SUANKI.sorular.length; ist.dogru += dogru; ist.yanlis += yanlis; ist.bos += bos;
    Depo.koy("ist", ist); Depo.koy("yanlisKonu", yanlisKonu);

    var yuzde = Math.round((dogru / SUANKI.sorular.length) * 100);
    var kap = document.createElement("div");
    kap.className = "modul";
    kap.innerHTML = "<div class='modul-ic'><div class='soru-kutu'>" +
      "<h3 style='margin:0 0 12px'>Test bitti · " + SUANKI.ders + "</h3>" +
      "<div class='deneme-bilgi'>" +
      "<div class='bilgi-kutu'><b>" + dogru + "</b><span>Doğru</span></div>" +
      "<div class='bilgi-kutu'><b>" + yanlis + "</b><span>Yanlış</span></div>" +
      "<div class='bilgi-kutu'><b>" + bos + "</b><span>Boş</span></div>" +
      "</div><p class='aciklama'>Başarı: %" + yuzde + ". “ÜSTAD Öneriyor” bölümü yanlışlarına göre güncellendi.</p>" +
      "<div class='soru-alt'><button class='ikincil-dugme' data-kapat='1'>Kapat</button>" +
      "<button class='ikincil-dugme' data-oneri='1'>💡 Eksik Konularıma Git</button></div>" +
      "</div></div>";
    document.body.appendChild(kap);
    kap.querySelector("[data-kapat]").addEventListener("click", function () { kap.parentNode.removeChild(kap); testler(); });
    kap.querySelector("[data-oneri]").addEventListener("click", function () { kap.parentNode.removeChild(kap); git("oneriyor"); oneriyor(); });
    kutlama(yuzde, "Test · " + SUANKI.ders, dogru + " doğru · " + yanlis + " yanlış");
  }

  /* ═════════ 8) ÜSTAD ÖNERİYOR ═════════ */
  function oneriyor() {
    var yanlisKonu = Depo.al("yanlisKonu", {});
    var kayitlar = Object.keys(yanlisKonu).filter(function (k) { return yanlisKonu[k] > 0; })
      .map(function (k) { var p = k.split("|"); return { konu: p[0], ders: p[1], adet: yanlisKonu[k] }; })
      .sort(function (a, b) { return b.adet - a.adet; });
    var kap = $("#eksikListe"); kap.innerHTML = "";
    if (!kayitlar.length) {
      kap.innerHTML = "<p class='aciklama'>Henüz yanlış kaydın yok. Test çözdükçe burada eksik konularını öncelik sırasıyla listelerim.</p>";
      return;
    }
    kayitlar.slice(0, 6).forEach(function (r) {
      var kart = document.createElement("div");
      kart.className = "liste-kart";
      kart.style.setProperty("--bolum", "var(--oneriyor)");
      kart.innerHTML = "<span class='ikon'>🎯</span><span class='govde'><b>" + r.konu + "</b>" +
        "<span>" + r.ders + " · " + r.adet + " yanlış</span></span>" +
        "<button class='kucuk-dugme'>Eksik Konuya Git</button>";
      kart.querySelector("button").addEventListener("click", function () { telafiAc(r); });
      kap.appendChild(kart);
    });
    var ozet = "<p class='aciklama'>Toplam " + kayitlar.length + " eksik konu tespit edildi; " +
      "en çok yanlış yaptığın konular üstte.</p>";
    kap.insertAdjacentHTML("afterbegin", ozet);
  }

  function telafiAc(r) {
    var sorular = P.ornekSorular.filter(function (s) { return s.konu === r.konu; });
    if (sorular.length < 3) sorular = P.ornekSorular.slice(0, 3);
    var kap = $("#telafiAlan");
    kap.classList.remove("gizli");
    kap.innerHTML = "<h3>📖 " + r.konu + " (" + r.ders + ")</h3>" +
      "<p class='aciklama'>Tekrar yapıp bitirdikten sonra bu konudan en az 5 soru çözmen isteniyor. " +
      "Paket tamamlandığında 5 telafi sorusu burada listelenir.</p>" +
      "<button class='buyuk-dugme' id='telafiCoz'>TELAFİ SORULARINI ÇÖZ</button>";
    kap.scrollIntoView({ behavior: "smooth" });
    var b = $("#telafiCoz");
    if (b) b.addEventListener("click", function () {
      SUANKI = { ders: r.ders, sorular: sorular, i: 0, cevap: {}, mod: "telafi" };
      modulCiz();
    });
  }

  /* ═════════ 9) DENEME SINAVI (motor: assets/deneme.js) ═════════ */
  function deneme() {
    if (window.Deneme && window.Deneme.panel) { window.Deneme.panel(); return; }
    var kap = $("#denemeBilgi");
    var aktif = P.denemeler.filter(function (d) { return d.durum === "açık"; })[0] || P.denemeler[0];
    kap.innerHTML =
      "<div class='bilgi-kutu'><b>" + aktif.soru + "</b><span>Soru</span></div>" +
      "<div class='bilgi-kutu'><b>" + aktif.dakika + "</b><span>Dakika</span></div>" +
      "<div class='bilgi-kutu'><b>" + P.denemeler.length + "</b><span>Haftalık deneme</span></div>" +
      "<div class='bilgi-kutu'><b>" + P.dersler.length + "</b><span>Ders</span></div>";
  }

  /* ═════════ 10) DERS NOTLARI ═════════ */
  function tumNotlar() {
    var uzun = (window.USTAD_NOTLAR && window.USTAD_NOTLAR.length) ? window.USTAD_NOTLAR : [];
    return uzun.length ? uzun : (P.notlar || []);
  }

  function notlar() {
    var kap = $("#notListe");
    kap.innerHTML = "";
    var liste = tumNotlar();
    var uzunMu = !!(window.USTAD_NOTLAR && window.USTAD_NOTLAR.length);
    kap.insertAdjacentHTML("afterbegin",
      "<p class='aciklama'>" + liste.length + " ders notu · " +
      (uzunMu ? "tam konu anlatımı" : "özet (tam notlar yazım aşamasında)") + "</p>");
    var dersSirasi = P.dersler.map(function (d) { return d.ad; });
    liste.slice().sort(function (a, b) {
      return dersSirasi.indexOf(a.ders) - dersSirasi.indexOf(b.ders);
    }).forEach(function (n) {
      var kart = document.createElement("div");
      kart.className = "liste-kart";
      kart.style.setProperty("--bolum", "var(--notlar)");
      var dersSimg = (P.dersler.filter(function (d) { return d.ad === n.ders; })[0] || {}).simg || "📚";
      kart.innerHTML = "<span class='ikon'>" + dersSimg + "</span><span class='govde'><b>" +
        n.ders + " · " + n.baslik + "</b><span>" + (n.ozet || "") + "</span></span>" +
        "<button class='kucuk-dugme'>Ders Notunu Oku</button>";
      kart.querySelector("button").addEventListener("click", function () { notAc(n); });
      kap.appendChild(kart);
    });
  }

  /* Not okuma penceresi */
  function notAc(n) {
    var eski = $(".not-perde"); if (eski) eski.parentNode.removeChild(eski);
    var metin = (n.metin || []).map(function (p) { return "<p style='line-height:1.6'>" + p + "</p>"; }).join("");
    var puf = (n.pufNoktalar || []).map(function (p) { return "<li>" + p + "</li>"; }).join("");
    var kap = document.createElement("div");
    kap.className = "modul not-perde";
    kap.innerHTML = "<div class='modul-ic'><div class='soru-kutu'>" +
      "<div class='soru-ust'><span>" + n.ders + (n.konu ? " · " + n.konu : "") + "</span><span>Ders Notu</span></div>" +
      "<h3 style='margin:10px 0 12px'>" + n.baslik + "</h3>" +
      (metin || "<p style='line-height:1.6'>" + (n.ozet || "") + "</p>") +
      (puf ? "<h4 style='margin:16px 0 6px'>🔑 Püf Noktaları</h4><ul style='line-height:1.6'>" + puf + "</ul>" : "") +
      (n.sinavIpucu ? "<p class='aciklama' style='border-left:4px solid #7c3aed;padding-left:10px'>" +
        "🎯 <b>Sınav ipucu:</b> " + n.sinavIpucu + "</p>" : "") +
      "<div class='soru-alt'>" +
      "<button class='ikincil-dugme' data-konutest='1'>📝 Bu Konudan Test Çöz</button>" +
      "<button class='ikincil-dugme' data-kapat='1'>Kapat</button>" +
      "</div></div></div>";
    document.body.appendChild(kap);
    kap.querySelector("[data-kapat]").addEventListener("click", function () { kap.parentNode.removeChild(kap); });
    var kt = kap.querySelector("[data-konutest]");
    if (kt) kt.addEventListener("click", function () {
      var sorular = bankaSorulari().filter(function (s) {
        return s.ders === n.ders && (s.konu === n.konu || s.konu === n.baslik);
      });
      if (!sorular.length) sorular = bankaSorulari().filter(function (s) { return s.ders === n.ders; });
      if (!sorular.length) { alert("Bu dersin sorusu henüz bankada yok."); return; }
      kap.parentNode.removeChild(kap);
      SUANKI = { ders: n.ders, sorular: sorular, i: 0, cevap: {}, mod: "test" };
      modulCiz();
    });
  }

  /* ═════════ 11) İSTATİSTİK ═════════ */
  function istatistik() {
    var ist = Depo.al("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 });
    var basari = ist.cozulen ? Math.round((ist.dogru / ist.cozulen) * 100) : 0;
    var prog = Depo.al("program", null);
    $("#istKutu").innerHTML =
      "<div class='ist-kart'><b>" + ist.cozulen + "</b><span>Çözülen soru</span></div>" +
      "<div class='ist-kart'><b>" + ist.dogru + "</b><span>Doğru</span></div>" +
      "<div class='ist-kart'><b>" + ist.yanlis + "</b><span>Yanlış</span></div>" +
      "<div class='ist-kart'><b>%" + basari + "</b><span>Başarı</span></div>" +
      "<div class='ist-kart'><b>" + (prog ? prog.gunler.length : 0) + "</b><span>Programlı gün</span></div>" +
      "<div class='ist-kart'><b>" + (prog ? prog.gunler.length * 3 : 0) + "</b><span>Programlı blok</span></div>" +
      "<div class='ist-kart'><b>30</b><span>Test başına soru</span></div>" +
      "<div class='ist-kart'><b>" + P.sinav.dakika + "</b><span>Deneme süresi (dk)</span></div>";
  }

  /* ═════════ 11b) TEBRİK / TESELLİ ANİMASYONU (kız-erkek öğrenci maskotu) ═════════ */
  function ogrenciAdi() {
    var ad = (Depo.al("isim", "") || "").trim();
    return ad || "öğrenci";
  }
  function cinsiyet() {
    var c = Depo.al("cinsiyet", "");
    return (c === "kiz" || c === "erkek") ? c : "";
  }

  /* Maskot: tamamen kodla çizilir (resim dosyası yok, APK şişmez).
     Gerçekçi oranlar + gradyanlar; kız/erkek ve ruh hâli (kazandi/yaklasti/uzgun) destekli. */
  function maskotSVG(cins, moral, kafaModu) {
    var kiz = (cins === "kiz");
    var mutlu = (moral !== "uzgun");
    var g = [];
    var deri1 = "#f9d9bd", deri2 = "#e9b78f", deriC = "#dda274";
    var sac1 = kiz ? "#4b2f21" : "#2c231d", sac2 = kiz ? "#7a4a2e" : "#4a3a2c";
    var forma1 = "#16b8a3", forma2 = "#0a7f72";
    var pant1 = "#33465f", pant2 = "#22303f";
    var gozIris = "#4a2c12", goz = "#241a14";

    // ── tanımlar (gradyanlar) ───────────────────────────────────────────
    g.push("<defs>" +
      "<linearGradient id='mDeri' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + deri1 + "'/><stop offset='1' stop-color='" + deri2 + "'/></linearGradient>" +
      "<linearGradient id='mForma' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + forma1 + "'/><stop offset='1' stop-color='" + forma2 + "'/></linearGradient>" +
      "<linearGradient id='mSac' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + sac2 + "'/><stop offset='1' stop-color='" + sac1 + "'/></linearGradient>" +
      "<linearGradient id='mPant' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + pant1 + "'/><stop offset='1' stop-color='" + pant2 + "'/></linearGradient>" +
      "<radialGradient id='mYanak'><stop offset='0' stop-color='#f08c8c' stop-opacity='.55'/><stop offset='1' stop-color='#f08c8c' stop-opacity='0'/></radialGradient>" +
      "</defs>");

    // ── zemin gölgesi ───────────────────────────────────────────────────
    g.push("<ellipse cx='120' cy='327' rx='55' ry='11' fill='#0b1f24' opacity='.16'/>");

    // ── bacaklar + spor ayakkabı ────────────────────────────────────────
    if (kiz) {
      // etek üstü: diz altı düz pantolon yerine tayt + etek
      g.push("<rect x='99' y='228' width='18' height='80' rx='9' fill='url(#mPant)'/>");
      g.push("<rect x='123' y='228' width='18' height='80' rx='9' fill='url(#mPant)'/>");
    } else {
      g.push("<rect x='98' y='226' width='20' height='82' rx='9' fill='url(#mPant)'/>");
      g.push("<rect x='122' y='226' width='20' height='82' rx='9' fill='url(#mPant)'/>");
    }
    g.push("<path d='M94 300 q0 -11 13 -11 h17 q12 0 12 11 v11 q0 7 -9 7 h-24 q-9 0 -9 -7 z' fill='#f4f6f8' stroke='#c9d2d9' stroke-width='1.6'/>");
    g.push("<path d='M94 306 h42' stroke='#e2574c' stroke-width='5'/>");
    g.push("<path d='M122 300 q0 -11 13 -11 h17 q12 0 12 11 v11 q0 7 -9 7 h-24 q-9 0 -9 -7 z' fill='#f4f6f8' stroke='#c9d2d9' stroke-width='1.6'/>");
    g.push("<path d='M122 306 h42' stroke='#e2574c' stroke-width='5'/>");

    // ── gövde: ÜSTAD forması (bel kıvrımlı) ─────────────────────────────
    g.push("<path d='M120 136 c-24 0 -38 9 -38 22 v74 c0 13 14 17 38 17 s38 -4 38 -17 v-74 c0 -13 -14 -22 -38 -22 z' fill='url(#mForma)'/>");
    // beyaz gömlek yakası
    g.push("<path d='M102 139 l18 22 l18 -22 q-18 -8 -36 0 z' fill='" + gomlekRengi() + "'/>");
    g.push("<path d='M111 137 l9 24 l9 -24 q-9 -3 -18 0 z' fill='#e8eef1'/>");
    // forma düğmeleri
    g.push("<circle cx='120' cy='178' r='2.5' fill='#e8eef1' opacity='.85'/>");
    g.push("<circle cx='120' cy='200' r='2.5' fill='#e8eef1' opacity='.85'/>");
    g.push("<circle cx='120' cy='222' r='2.5' fill='#e8eef1' opacity='.85'/>");
    // göğüs arması (ÜSTAD rozeti)
    g.push("<g transform='translate(100 160)'><circle cx='0' cy='0' r='9' fill='#f0b429'/><circle cx='0' cy='0' r='6.5' fill='#0a7f72'/>" +
      "<text x='0' y='3.4' font-size='9' font-weight='bold' text-anchor='middle' fill='#ffffff' font-family='sans-serif'>Ü</text></g>");
    // kemer
    g.push("<rect x='84' y='228' width='72' height='9' rx='4' fill='#1d2b3a'/>");
    g.push("<rect x='114' y='226' width='12' height='13' rx='3' fill='#f0b429'/>");

    // ── kollar: kazanan → V pozisyonunda yukarı, üzgün → yanlarda aşağı ──
    if (mutlu) {
      g.push("<g class='kol kol-sol'>" +
        "<path d='M101 152 q-20 -4 -28 -26 q-7 -19 1 -32' stroke='url(#mForma)' stroke-width='17' stroke-linecap='round' fill='none'/>" +
        "<circle cx='74' cy='92' r='9.5' fill='url(#mDeri)'/>" +
        "<path d='M70 86 q-4 -7 -9 -8 M75 82 q-1 -8 -5 -11 M81 83 q2 -8 1 -12' stroke='" + deriC + "' stroke-width='2' fill='none' stroke-linecap='round'/></g>");
      g.push("<g class='kol kol-sag'>" +
        "<path d='M139 152 q20 -4 28 -26 q7 -19 -1 -32' stroke='url(#mForma)' stroke-width='17' stroke-linecap='round' fill='none'/>" +
        "<circle cx='166' cy='92' r='9.5' fill='url(#mDeri)'/>" +
        "<path d='M170 86 q4 -7 9 -8 M165 82 q1 -8 5 -11 M159 83 q-2 -8 -1 -12' stroke='" + deriC + "' stroke-width='2' fill='none' stroke-linecap='round'/></g>");
    } else {
      g.push("<g class='kol kol-sol'>" +
        "<path d='M101 154 q-14 20 -12 46 q1 21 7 33' stroke='url(#mForma)' stroke-width='17' stroke-linecap='round' fill='none'/>" +
        "<circle cx='97' cy='236' r='9.5' fill='url(#mDeri)'/>" +
        "<path d='M92 242 q-5 4 -6 8 M97 245 q-4 5 -4 9 M102 246 q-2 6 -1 10' stroke='" + deriC + "' stroke-width='2' fill='none' stroke-linecap='round'/></g>");
      g.push("<g class='kol kol-sag'>" +
        "<path d='M139 154 q14 20 12 46 q-1 21 -7 33' stroke='url(#mForma)' stroke-width='17' stroke-linecap='round' fill='none'/>" +
        "<circle cx='143' cy='236' r='9.5' fill='url(#mDeri)'/>" +
        "<path d='M148 242 q5 4 6 8 M143 245 q4 5 4 9 M138 246 q2 6 1 10' stroke='" + deriC + "' stroke-width='2' fill='none' stroke-linecap='round'/></g>");
    }

    // ── boyun + kafa ────────────────────────────────────────────────────
    g.push("<path d='M110 118 h20 v22 h-20 z' fill='" + deri2 + "'/>");
    g.push("<ellipse cx='120' cy='96' rx='33' ry='37' fill='url(#mDeri)'/>");
    if (!kiz) {
      g.push("<ellipse cx='87' cy='100' rx='7' ry='9' fill='url(#mDeri)'/><ellipse cx='153' cy='100' rx='7' ry='9' fill='url(#mDeri)'/>");
    }

    // ── saç ─────────────────────────────────────────────────────────────
    if (kiz) {
      // omuzlara inen dalgalı saç + üst perçem
      g.push("<path class='sac-tutam' d='M83 88 q-6 -46 37 -46 q43 0 37 46 q7 52 3 92 q-9 12 -22 7 q7 -54 2 -86 q-20 -15 -40 0 q-5 32 2 86 q-13 5 -22 -7 q-4 -40 3 -92 z' fill='url(#mSac)'/>");
      g.push("<path d='M86 90 q2 -40 34 -40 q32 0 34 40 q-14 -21 -34 -21 q-20 0 -34 21 z' fill='url(#mSac)'/>");
      g.push("<path d='M90 76 q30 -18 60 0 q-7 -24 -30 -24 q-23 0 -30 24 z' fill='" + sac2 + "' opacity='.6'/>");
      // saç tokası (fiyonk)
      g.push("<g transform='translate(148 60)'><path d='M0 0 l-13 -8 l0 16 z' fill='#e0489b'/><path d='M0 0 l13 -8 l0 16 z' fill='#e0489b'/><circle cx='0' cy='0' r='4.6' fill='#c22c7f'/></g>");
    } else {
      g.push("<path d='M87 96 q-3 -46 33 -46 q36 0 33 46 q-4 -14 -12 -20 q-9 8 -21 8 q-12 0 -21 -8 q-8 6 -12 20 z' fill='url(#mSac)'/>");
      g.push("<path d='M92 62 q28 -14 56 0 q-8 -18 -28 -18 q-20 0 -28 18 z' fill='" + sac2 + "' opacity='.55'/>");
    }

    // ── yüz: kaşlar, gözler, burun, ağız, yanaklar ─────────────────────
    g.push("<path d='M99 82 q9 -6 19 -2' stroke='" + sac1 + "' stroke-width='3.2' fill='none' stroke-linecap='round' opacity='.9'/>");
    g.push("<path d='M122 80 q10 -4 19 2' stroke='" + sac1 + "' stroke-width='3.2' fill='none' stroke-linecap='round' opacity='.9'/>");
    g.push("<ellipse cx='108' cy='93' rx='7.6' ry='6.6' fill='#fdfbf8'/>");
    g.push("<ellipse cx='132' cy='93' rx='7.6' ry='6.6' fill='#fdfbf8'/>");
    g.push("<circle cx='108.6' cy='93.4' r='5' fill='" + gozIris + "'/><circle cx='131.4' cy='93.4' r='5' fill='" + gozIris + "'/>");
    g.push("<circle cx='108.6' cy='93.4' r='2.6' fill='" + goz + "'/><circle cx='131.4' cy='93.4' r='2.6' fill='" + goz + "'/>");
    g.push("<circle cx='106.6' cy='91' r='1.7' fill='#ffffff'/><circle cx='129.4' cy='91' r='1.7' fill='#ffffff'/>");
    if (kiz) {
      g.push("<path d='M100.5 87.6 q7.5 -4 15 0' stroke='#2c231d' stroke-width='1.8' fill='none' stroke-linecap='round'/>");
      g.push("<path d='M124.5 87.6 q7.5 -4 15 0' stroke='#2c231d' stroke-width='1.8' fill='none' stroke-linecap='round'/>");
    }
    // göz kapakları (kırpma animasyonu)
    g.push("<rect class='gozkapagi' x='100' y='84' width='16' height='12' rx='6' fill='" + deri1 + "'/>");
    g.push("<rect class='gozkapagi' x='124' y='84' width='16' height='12' rx='6' fill='" + deri1 + "'/>");
    g.push("<path d='M120 100 q3 6 -1 9' stroke='" + deriC + "' stroke-width='2' fill='none' stroke-linecap='round'/>");
    g.push("<circle cx='100' cy='106' r='7' fill='url(#mYanak)'/><circle cx='140' cy='106' r='7' fill='url(#mYanak)'/>");
    if (mutlu) {
      g.push("<path d='M104 113 q16 " + (moral === "kazandi" ? 17 : 12) + " 32 0 q-16 6 -32 0 z' fill='#b8453f'/>");
      g.push("<path d='M107 114 q13 7 26 0 q-13 4 -26 0 z' fill='#ffffff' opacity='.92'/>");
    } else {
      g.push("<path d='M106 119 q14 -8 28 0' stroke='#b8453f' stroke-width='3.6' fill='none' stroke-linecap='round'/>");
      g.push("<path d='M108 121 q12 -4 24 0' stroke='" + deriC + "' stroke-width='1.6' fill='none' opacity='.6'/>");
    }

    return "<svg class='maskot-svg" + (kafaModu ? " kafa-modu" : "") + "' viewBox='" +
      (kafaModu ? "62 30 116 116" : "0 0 240 340") + "' xmlns='http://www.w3.org/2000/svg' " +
      "aria-label='" + (kiz ? "Kız öğrenci" : "Erkek öğrenci") + "'>" +
      "<g class='maskot-govde'>" + g.join("") + "</g></svg>";
  }

  /* ── Kendi fotoğrafını kullanma: galeri/dosya yöneticisinden seçilir, cihazda küçültülüp saklanır ── */
  function fotoKucult(dosya, cb) {
    if (!dosya || !/^image\//i.test(dosya.type || "")) { cb(null); return; }
    var oku = new FileReader();
    oku.onload = function () {
      var im = new Image();
      im.onload = function () {
        var mx = 460, g = im.width || mx, y = im.height || mx;
        if (g >= y) { if (g > mx) { y = Math.round(y * mx / g); g = mx; } }
        else { if (y > mx) { g = Math.round(g * mx / y); y = mx; } }
        var c = document.createElement("canvas");
        c.width = Math.max(1, g); c.height = Math.max(1, y);
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL("image/jpeg", 0.82));
      };
      im.onerror = function () { cb(null); };
      im.src = oku.result;
    };
    oku.onerror = function () { cb(null); };
    oku.readAsDataURL(dosya);
  }

  function fotoOnizleme(kapId) {
    var kap = $(kapId); if (!kap) return;
    var foto = Depo.al("foto", null), aktif = Depo.al("fotoAktif", false);
    if (!foto) { kap.innerHTML = "<span class='foto-yok'>Henüz fotoğraf seçilmedi — maskot kullanılıyor.</span>"; return; }
    kap.innerHTML = "<div class='foto-mini" + (aktif ? " aktif" : "") + "'><img src='" + foto + "' alt='Profil fotoğrafı'>" +
      (aktif ? "<span class='foto-etiket'>✔ Kullanılıyor</span>" : "<span class='foto-etiket'>Pasif</span>") + "</div>" +
      "<span class='foto-yok'>" + (aktif ? "Tebrik ekranında bu fotoğraf görünecek." : "Fotoğraf kayıtlı ama şu an maskot görünüyor.") + "</span>";
  }

  /* Fotoğraf seçici bağla: input gizli, düğme dosya yöneticisini/galeriyi açar */
  function fotoBagla(inputId, dugmeId, onizlemeId, durumId) {
    var inp = $(inputId), dug = $(dugmeId);
    if (dug) dug.addEventListener("click", function () { if (inp) inp.click(); });
    if (inp) {
      inp.addEventListener("change", function () {
        var dosya = inp.files && inp.files[0];
        if (!dosya) return;
        if (durumId && $(durumId)) $(durumId).textContent = "Fotoğraf işleniyor…";
        fotoKucult(dosya, function (veri) {
          if (!veri) { if (durumId && $(durumId)) $(durumId).textContent = "⚠ Seçilen dosya bir resim değil."; return; }
          Depo.koy("foto", veri);
          Depo.koy("fotoAktif", true);
          fotoOnizleme(onizlemeId);
          if (durumId && $(durumId)) $(durumId).textContent = "✔ Fotoğraf kaydedildi — tebrik ekranında siz görüneceksiniz.";
          if (inputId === "#perdeFoto") {
            $$("#perdeCins .cins-dugme").forEach(function (x) { x.classList.remove("secili"); });
          } else {
            $$("#profilCins .cins-dugme").forEach(function (x) { x.classList.remove("secili"); });
          }
          konus("Fotoğrafınız kaydedildi. Tebrik ekranında siz görüneceksiniz.");
        });
        inp.value = "";
      });
    }
    fotoOnizleme(onizlemeId);
  }

  /* Kutlama ekranında gösterilecek figür: fotoğraf varsa madalyon, yoksa maskot */
  function figurHTML(moral) {
    var foto = Depo.al("foto", null), aktif = Depo.al("fotoAktif", false);
    if (foto && aktif) {
      return "<div class='foto-madalyon " + moral + "'>" +
        "<span class='fm-halka'></span>" +
        "<img class='fm-resim' src='" + foto + "' alt='" + ogrenciAdi() + " fotoğrafı'>" +
        (moral === "kazandi" ? "<span class='fm-tac'>👑</span>" : "") +
        (moral === "kazandi" ? "<span class='fm-isik fm-isik-1'>✨</span><span class='fm-isik fm-isik-2'>✨</span>" : "") +
        "</div>";
    }
    return maskotSVG(cinsiyet() || "erkek", moral);
  }

  /* ═════════ 14) HAKKINDA & TELİF — eser sahibinin hakları ve kopya koruması ═════════ */
  var ESER = {
    ad: "ÜSTAD KOÇ PRO",
    paket: "KPSS-B (Genel Yetenek · Genel Kültür)",
    sahip: "Kenan Kuzucu",
    isletme: "ÜSTAD SALON KENAN · Selimiye Mah., Şehitkamil / Gaziantep",
    yil: 2026,
    paketAdi: "tr.com.ustadkenankuzucu.ustadkocpro",
    surum: function () {
      // APK'da kurulu sürüm manifest'ten okunur; tarayıcıda index.html meta etiketi kullanılır
      try { if (window.USTAD && window.USTAD.surum) { var v = window.USTAD.surum(); if (v) return v; } } catch (e) {}
      var m = document.querySelector("meta[name=surum]");
      return (m && m.getAttribute("content")) || "1.0";
    }
  };

  /* İçerik imzası: soru bankası kurcalanmış mı? (sorular.js içindeki USTAD_BUTUNLUK ile karşılaştırılır) */
  function icerikImza() {
    var s = window.USTAD_SORULAR || [], karakter = 0, notKarakter = 0;
    s.forEach(function (x) { karakter += ((x.soru || "") + (x.metin || "")).length; });
    (window.USTAD_NOTLAR || []).forEach(function (n) { notKarakter += ((n.baslik || "") + (n.ozet || "") + (n.icerik || "")).length; });
    return { soruSayisi: s.length, karakter: karakter, notKarakter: notKarakter };
  }

  function butunlukKontrol() {
    var b = window.USTAD_BUTUNLUK, i = icerikImza();
    if (!b) return { durum: "bilinmiyor", i: i, b: null };
    var tamam = (b.soruSayisi === i.soruSayisi) && (b.karakter === i.karakter);
    return { durum: tamam ? "orijinal" : "degismis", i: i, b: b };
  }

  /* Her kuruluma özel üretim kimliği (filigran): izinsiz kopya bu kodla izlenebilir */
  function uretimKimligi() {
    var k = Depo.al("kimlik", null);
    if (!k) {
      var h = 0, t = (navigator.userAgent || "") + "|" + (new Date()).toISOString() + "|ÜSTAD";
      for (var i = 0; i < t.length; i++) { h = ((h << 5) - h + t.charCodeAt(i)) | 0; }
      k = "UKP-" + ESER.yil + "-" + Math.abs(h).toString(36).toUpperCase().slice(0, 6) + "-" +
          Math.random().toString(36).slice(2, 6).toUpperCase();
      Depo.koy("kimlik", k);
    }
    return k;
  }

  function hakkinda() {
    var kap = $("#hkAlan"); if (!kap) return;
    var s = ESER.surum(), b = butunlukKontrol(), i = b.i, kid = uretimKimligi();
    var cihaz = "";
    try { if (window.USTAD && window.USTAD.cihaz) cihaz = window.USTAD.cihaz(); } catch (e) {}
    kap.innerHTML =
      "<div class='hk-kunye'>" +
        "<div class='hk-madalyon'><img src='tasarim/ustad-kafa.png' alt=''></div>" +
        "<div class='panel-ad'><b>ÜSTAD KOÇ PRO</b><span>" + ESER.paket + " · Sürüm " + s + "</span></div>" +
      "</div>" +

      "<div class='hk-telif'>" +
        "<b>© " + ESER.yil + " " + ESER.sahip + " · TÜM HAKLARI SAKLIDIR.</b>" +
        "<p>Bu eser (yazılım, ekran tasarımı, resim ve simgeler, ders notları ve <b>120 özgün soru</b>)" +
        " 5846 sayılı <b>Fikir ve Sanat Eserleri Kanunu</b> kapsamında korunmaktadır.</p>" +
        "<p>İzinsiz olarak: çoğaltılamaz, kopyalanamaz, satılamaz, kiralanamaz, dağıtılamaz, yayımlanamaz," +
        " değiştirilemez, tersine mühendisliğe tabi tutulamaz, türev eser üretilemez," +
        " kendi ürünüymüş gibi sunulamaz. İhlâlde <b>tazminat ve cezaî sorumluluk</b> doğar.</p>" +
      "</div>" +

      "<div class='hk-bolum'><h3>📚 Soru bankası ve içerik</h3>" +
        "<p>Bu paketteki " + i.soruSayisi + " soru ve ders notları eser sahibinin <b>özgün telifidir</b>." +
        " ÖSYM'nin çıkmış soruları kopyalanmamış, sorular sıfırdan yazılmıştır. Haber başlıkları ilgili" +
        " kaynaklara ait olup uygulama içinde kaynağı belirtilerek gösterilir.</p></div>" +

      "<div class='hk-bolum'><h3>🔐 Bütünlük ve kopya kontrolü</h3>" +
        "<div class='hk-satir'><span>İçerik imzası</span><b class='hk-imza'>" +
          i.soruSayisi + " soru · " + i.karakter + " karakter</b></div>" +
        "<div class='hk-satir'><span>Beklenen imza</span><b class='hk-imza'>" +
          (b.b ? (b.b.soruSayisi + " soru · " + b.b.karakter + " karakter") : "tanımsız") + "</b></div>" +
        "<div class='hk-satir'><span>Durum</span><b class='" +
          (b.durum === "orijinal" ? "hk-iyi" : "hk-kotu") + "'>" +
          (b.durum === "orijinal" ? "✔ Doğrulanmış orijinal kopya" :
           b.durum === "degismis" ? "⚠ İçerik değiştirilmiş — bu sürüm orijinal değil" : "ℹ Doğrulama bilgisi yok") +
        "</b></div>" +
        "<div class='hk-satir'><span>Üretim kimliği (filigran)</span><b class='hk-imza'>" + kid + "</b></div>" +
        (cihaz ? "<div class='hk-satir'><span>Cihaz</span><b class='hk-imza'>" + cihaz + "</b></div>" : "") +
        "<p class='aciklama'>Uygulamanın içeriğinde eser sahibine ait görünmez kimlik işaretleri bulunur." +
        " İzinsiz kopyalanan ya da değiştirilen sürümler bu kimlik ve içerik imzasıyla tespit edilebilir.</p>" +
      "</div>" +

      "<div class='hk-bolum'><h3>📃 Kullanım lisansı</h3>" +
        "<p>Bu kopya, eser sahibi tarafından <b>kişisel kullanım</b> için verilmiştir. Tek cihazda kullanılır," +
        " devredilemez, satılamaz. Uygulama çevrimdışı çalışır; çözdüğün sorular, notlar ve kişisel tercihler" +
        " <b>yalnızca bu cihazda</b> saklanır, hiçbir sunucuya gönderilmez. Canlı haber başlıkları internetten" +
        " akar; bu durumda yalnızca haber sitelerine istek gider.</p></div>" +

      "<div class='hk-bolum'><h3>✍️ Eser künyesi</h3>" +
        "<div class='hk-satir'><span>Eser</span><b>" + ESER.ad + " · " + ESER.paket + "</b></div>" +
        "<div class='hk-satir'><span>Eser sahibi</span><b>" + ESER.sahip + "</b></div>" +
        "<div class='hk-satir'><span>İşletme</span><b>" + ESER.isletme + "</b></div>" +
        "<div class='hk-satir'><span>Sürüm / paket</span><b class='hk-imza'>" + s + " · " + ESER.paketAdi + "</b></div>" +
        "<div class='hk-satir'><span>Motor</span><b>ÜSTAD MOTOR (tek çekirdek · sınava özel paketler)</b></div>" +
      "</div>";

    try { console.log("%c© " + ESER.yil + " " + ESER.sahip + " · " + ESER.ad + " · " + kid +
      " · İzinsiz kopyalama 5846 sayılı FSEK gereği yasaktır.", "color:#0e9f8e;font-weight:bold"); } catch (e) {}
  }

  function gomlekRengi() { return "#f2f6f8"; }

  /* Tebrik katmanı: animasyonlu maskot + konfeti + konuşma balonu + sesli tebrik */
  function kutlama(basari, baslik, ekBilgi) {
    var eski = $(".kutlama-perde"); if (eski) eski.parentNode.removeChild(eski);
    var moral = basari >= 60 ? "kazandi" : (basari >= 40 ? "yaklasti" : "uzgun");
    var ad = ogrenciAdi();
    var cins = cinsiyet() || "erkek";
    var soz = {
      kazandi: {
        ust: "Yuppiii! 🎉", bas: "BAŞARDINIZ!",
        alt: "Tebrikler " + ad + "! Bu gidişle sınavı kazanacaksınız.",
        ses: "Yuppiii! Başardınız " + ad + ". Böyle devam, sınav sizin."
      },
      yaklasti: {
        ust: "Neredeyse oldu! 💪", bas: "AZ KALDI!",
        alt: "İyi gidiyorsunuz " + ad + ". Birkaç tekrar daha; olacak bu iş.",
        ses: "Neredeyse başardınız " + ad + ". Az kaldı, devam edin."
      },
      uzgun: {
        ust: "Üzülmeyin 🤗", bas: "BAŞARACAKSINIZ!",
        alt: "Her deneme sizi bir adım ileriye taşır " + ad + ". Pes etmek yok, ÜSTAD yanınızda.",
        ses: "Üzülmeyin " + ad + ". Başaracaksınız, ben size güveniyorum."
      }
    }[moral];

    var kap = document.createElement("div");
    kap.className = "kutlama-perde moral-" + moral + " " + (cins === "kiz" ? "ogrenci-kiz" : "ogrenci-erkek") +
      (basari >= 60 ? " konfetili" : "");
    kap.innerHTML =
      "<canvas class='konfeti'></canvas>" +
      "<div class='kutlama-kart'>" +
        "<div class='kutlama-maskot'>" + figurHTML(moral) + "</div>" +
        "<div class='kutlama-balon'>" +
          "<span class='k-ust'>" + soz.ust + "</span>" +
          "<b class='k-bas'>" + soz.bas + "</b>" +
          "<span class='k-alt'>" + soz.alt + "</span>" +
          "<span class='k-puan'>" + baslik + " · Başarı: %" + basari + (ekBilgi ? " · " + ekBilgi : "") + "</span>" +
        "</div>" +
        "<div class='kutlama-alt'>" +
          "<button class='buyuk-dugme' data-kapat='1'>" + (moral === "kazandi" ? "Sonuçlarımı Gör 🎯" : "Sonuçlarımı Gör") + "</button>" +
          "<button class='ikincil-dugme' data-dinle='1'>🔊 Beni yeniden dinle</button>" +
        "</div>" +
      "</div>";
    document.body.appendChild(kap);

    var kapat = kap.querySelector("[data-kapat]");
    if (kapat) kapat.addEventListener("click", function () { kap.parentNode.removeChild(kap); });
    var dinle = kap.querySelector("[data-dinle]");
    if (dinle) dinle.addEventListener("click", function () { konus(soz.ses); });

    konfeti(kap.querySelector(".konfeti"), moral);
    konus(soz.ses);
    try { window.__sonKutlama = { moral: moral, cins: cins, basari: basari, ses: soz.ses }; } catch (e) {}
    return moral;
  }

  /* Konfeti: küçük canvas üzerinde renkli parçacıklar (kazanınca uçar) */
  function konfeti(c, moral) {
    if (!c) return;
    var ctx = c.getContext("2d");
    function boyut() { c.width = c.clientWidth; c.height = c.clientHeight; }
    boyut();
    window.addEventListener("resize", boyut);
    var renkler = ["#0e9f8e", "#f0b429", "#e0489b", "#3b82f6", "#dc2626", "#12a150"];
    var parcalar = [], n = (moral === "kazandi") ? 170 : 0;
    for (var i = 0; i < n; i++) {
      parcalar.push({
        x: Math.random() * c.width, y: Math.random() * c.height,
        g: 1.6 + Math.random() * 3.2, b: 8 + Math.random() * 10,
        aci: Math.random() * 6.28, don: (Math.random() - 0.5) * 0.2,
        r: renkler[i % renkler.length], e: 7 + Math.random() * 9
      });
    }
    var bitti = 0;
    function ciz() {
      ctx.clearRect(0, 0, c.width, c.height);
      parcalar.forEach(function (p) {
        p.y += p.g; p.aci += p.don;
        if (p.y > c.height + 20) { p.y = -20; p.x = Math.random() * c.width; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.aci);
        ctx.fillStyle = p.r; ctx.fillRect(-p.e / 2, -p.e / 4, p.e, p.e / 2);
        ctx.restore();
      });
      if (parcalar.length) { bitti++; if (bitti < 1200) requestAnimationFrame(ciz); }
    }
    if (parcalar.length) requestAnimationFrame(ciz);
  }

  /* ═════════ 12) AYARLAR: renk paleti + düzen ═════════ */
  function ayarlar() {
    var kap = $("#renkListe"); kap.innerHTML = "";
    var seciliRenk = Depo.al("renk", "turkuaz");
    RENKLER.forEach(function (r) {
      var kart = document.createElement("div");
      kart.className = "renk-kart" + (r.kod === seciliRenk ? " secili" : "");
      var serit = RENK_SERIT[r.kod] || ["#eee", "#999", "#666"];
      kart.innerHTML = "<div class='renk-serit'><i style='background:" + serit[0] + "'></i>" +
        "<i style='background:" + serit[1] + "'></i><i style='background:" + serit[2] + "'></i></div>" + r.ad;
      kart.addEventListener("click", function () {
        document.documentElement.setAttribute("data-renk", r.kod);
        Depo.koy("renk", r.kod); ayarlar();
      });
      kap.appendChild(kart);
    });

    var dkap = $("#duzenListe");
    var duzenler = [{ kod: "ferah", ad: "Ferah (geniş satır)" }, { kod: "sik", ad: "Sıkı (kısa satır)" }];
    dkap.innerHTML = "";
    duzenler.forEach(function (d) {
      var kart = document.createElement("div");
      kart.className = "renk-kart" + (Depo.al("duzen", "ferah") === d.kod ? " secili" : "");
      kart.textContent = d.ad;
      kart.addEventListener("click", function () { Depo.koy("duzen", d.kod); ayarlar(); });
      dkap.appendChild(kart);
    });

    /* Öğrenci profili: ad + maskot (kız/erkek) + isteğe bağlı kendi fotoğrafı */
    var pa = $("#profilAd");
    if (pa) {
      pa.value = Depo.al("isim", "");
      cinsBagla("#profilCins", false);
      fotoBagla("#profilFoto", "#profilFotoSec", "#profilFotoOnizleme", "#profilDurum");
      var fk = $("#profilFotoKullan");
      if (fk) fk.addEventListener("click", function () {
        if (!Depo.al("foto", null)) { $("#profilDurum").textContent = "Önce bir fotoğraf seçin."; return; }
        Depo.koy("fotoAktif", true);
        fotoOnizleme("#profilFotoOnizleme");
        $("#profilDurum").textContent = "✔ Fotoğrafınız kullanılacak.";
      });
      var fs = $("#profilFotoSil");
      if (fs) fs.addEventListener("click", function () {
        Depo.koy("foto", null); Depo.koy("fotoAktif", false);
        fotoOnizleme("#profilFotoOnizleme");
        $("#profilDurum").textContent = "🗑 Fotoğraf silindi — maskot kullanılacak.";
      });
      var sd = $("#sesDene");
      if (sd) sd.addEventListener("click", function () {
        var ad = (Depo.al("isim", "") || "").trim();
        var kadin = (cinsiyet() === "kiz");
        konus((kadin ? "Merhaba " : "Merhaba ") + (ad || "öğrenci") + ". Ben senin " +
          (kadin ? "kız" : "erkek") + " öğrenci maskotunum. Seni kutlamak için sabırsızlanıyorum.");
        setTimeout(function () {
          var s = window.__sonSes || {};
          var el = $("#sesDurum");
          if (el) el.textContent = "🔊 Ses: " + (s.cins === "kiz" ? "kadın (ince perde)" : "erkek (kalın perde)") +
            " · ton " + s.pitch + (s.sesAdi ? " · cihaz sesi: " + s.sesAdi : " · cihazın varsayılan Türkçe sesi");
        }, 200);
      });
      var pk = $("#profilKaydet");
      if (pk) pk.addEventListener("click", function () {
        var ad = (pa.value || "").trim();
        var sec = $("#profilCins .cins-dugme.secili");
        var fotoVar = !!Depo.al("foto", null) && Depo.al("fotoAktif", false);
        if (ad.length < 2) { $("#profilDurum").textContent = "Lütfen adınızı yazın."; pa.focus(); return; }
        if (!sec && !fotoVar) { $("#profilDurum").textContent = "Lütfen maskotunuzu seçin ya da kendi fotoğrafınızı yükleyin."; return; }
        Depo.koy("isim", ad);
        if (sec) Depo.koy("cinsiyet", sec.getAttribute("data-cins"));
        karsilamaYaz(ad);
        $("#profilDurum").textContent = "✔ Kaydedildi · " + (fotoVar ? "tebrik ekranında kendi fotoğrafınız görünecek" :
          (sec && sec.getAttribute("data-cins") === "kiz" ? "maskot: kız öğrenci" : "maskot: erkek öğrenci"));
        konus("Profil kaydedildi. Hoş geldiniz " + ad + ".");
      });
    }
    var td = $("#tebrikDene");
    if (td) td.addEventListener("click", function () { kutlama(80, "Önizleme", "örnek sonuç"); });
    var at = $("#anaTebrik");
    if (at) at.addEventListener("click", function () { kutlama(85, "Ana Sayfa · Önizleme", "örnek sonuç"); });
  }

  /* ═════════ 13) DİĞER BAĞLANTILAR ═════════ */
  function baglantilar() {
    $("#menuDugme").addEventListener("click", function () {
      $("#menu").classList.contains("acik") ? menuKapat() : menuAc();
    });
    $("#menuPerde").addEventListener("click", menuKapat);
    document.addEventListener("click", function (e) {
      var g = e.target.closest ? e.target.closest("[data-git]") : null;
      if (g) { var k = g.getAttribute("data-git"); if (k === "oneriyor") oneriyor(); git(k); }
    });
    $("#sesDugme").addEventListener("click", function () {
      var acik = !Depo.al("ses", true);
      Depo.koy("ses", acik);
      $("#sesDugme").textContent = acik ? "🔊" : "🔇";
      konus("Sesli karşılama " + (acik ? "açıldı" : "kapatıldı") + ".");
    });
    $("#sesDugme").textContent = Depo.al("ses", true) ? "🔊" : "🔇";
    var sc = $("#sesAc"), ses = Depo.al("ses", true);
    if (sc) { sc.checked = ses; sc.addEventListener("change", function () { Depo.koy("ses", sc.checked); $("#sesDugme").textContent = sc.checked ? "🔊" : "🔇"; }); }
    var ac = $("#anindaAc");
    if (ac) {
      ac.checked = Depo.al("aninda", true) !== false;
      ac.addEventListener("change", function () {
        Depo.koy("aninda", !!ac.checked);
        if (window.Deneme && window.Deneme.basla) { /* açık sınav varsa sonraki çizimde uygulanır */ }
      });
    }
    document.documentElement.setAttribute("data-renk", Depo.al("renk", "turkuaz"));
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = function () {};
  }

  function saat() {
    function tik() {
      var d = new Date();
      $("#saat").textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    }
    tik(); setInterval(tik, 20000);
  }

  /* ═════════ BAŞLAT ═════════ */
  document.addEventListener("DOMContentLoaded", function () {
    $("#markaSinav").textContent = "KOÇ PRO · " + P.sinav.kod + " · " + P.sinav.tam;
    menuKur(); perde(); kure(); duyurular(); anketKur(); anketBagla();
    testler(); deneme(); notlar(); istatistik(); ayarlar(); baglantilar(); saat();
    /* ---- Kopya caydırıcılığı: sağ tık, sürükleme ve metin seçimi kapalı (eser koruması) ---- */
 if (Depo.al("kopyaEngel", true)) {
   ["contextmenu", "dragstart", "selectstart"].forEach(function (olay) {
     document.addEventListener(olay, function (e) {
       var t = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
       if (t === "input" || t === "textarea" || t === "select") return;
       e.preventDefault();
     });
   });
 }
    git("ana");
    olcumKipi();
  });

  /* ---- Diğer modüllerin kullanması için dışa açılan çekirdek ---- */
  window.USTAD_MOTOR = {
    git: git,
    hakkinda: hakkinda,
    icerikImza: icerikImza,
    butunlukKontrol: butunlukKontrol,
    uretimKimligi: uretimKimligi,
    konus: konus,
    kutlama: kutlama,
    maskotSVG: maskotSVG,
    oneriyor: oneriyor,
    notlar: notlar,
    testler: testler,
    istatistik: istatistik,
    duyurular: duyurular,
    bankaSorulari: bankaSorulari,
    kisaTarih: kisaTarih
  };

  /* ---- Geri tuşu (APK kabuğu çağırır): açık pencere → menü → ana sayfa → çık ---- */
  window.geriBas = function () {
    var modul = document.querySelector(".modul");
    var kut = document.querySelector(".kutlama-perde");
    if (kut) { kut.parentNode.removeChild(kut); return "geri"; }
    if (modul) { modul.parentNode.removeChild(modul); return "geri"; }
    if ($("#menu").classList.contains("acik")) { menuKapat(); return "geri"; }
    var acik = document.querySelector(".ekran.acik");
    if (acik && acik.id !== "ekran-ana") { git("ana"); return "geri"; }
    return "cik";
  };

  /* ---- Ölçüm/demo kipi: ?isim=Kenan&ekran=program&demo=1&menu=1&test=1 ---- */
  function olcumKipi() {
    var q = {};
    window.location.search.replace(/^\?/, "").split("&").forEach(function (p) {
      if (!p) return; var i = p.indexOf("="); q[decodeURIComponent(p.slice(0, i))] = decodeURIComponent(p.slice(i + 1));
    });
    if (q.statik) {   // ölçüm/ekran görüntüsü kipi: geçiş animasyonlarını kapat
      var st = document.createElement("style");
      st.textContent = "*{transition:none !important;animation:none !important}";
      document.head.appendChild(st);
    }
    if (q.isim) { Depo.koy("isim", q.isim); $("#perde").classList.add("kapali"); $("#perde").style.display = "none"; karsilamaYaz(q.isim); }
    if (q.ses === "0") Depo.koy("ses", false);
    if (q.renk) { document.documentElement.setAttribute("data-renk", q.renk); Depo.koy("renk", q.renk); ayarlar(); }
    if (q.demo) {
      $("#gunKutu").querySelectorAll("input").forEach(function (i, j) { i.checked = j < 5; });
      ["Türkçe", "Matematik"].forEach(function (d) { var i = $("#sevKutu").querySelector('input[value="' + d + '"]'); if (i) i.checked = true; });
      ["Tarih", "Vatandaşlık"].forEach(function (d) { var i = $("#zorKutu").querySelector('input[value="' + d + '"]'); if (i) i.checked = true; });
      $("#anket").dispatchEvent(new Event("submit", { cancelable: true }));
    }
    if (q.yanlis) { Depo.koy("yanlisKonu", { "Paragraf|Türkçe": 4, "Problemler|Matematik": 3, "Kurtuluş Savaşı|Tarih": 2 }); oneriyor(); }
    if (q.ekran) { if (q.ekran === "oneriyor") oneriyor(); git(q.ekran); }
    if (q.menu) menuAc();
    if (q.test) {
      var ders = q.ders ? P.dersler.filter(function (d) { return d.ad === q.ders; })[0] : null;
      var sorular = ders ? bankaSorulari().filter(function (s) { return s.ders === ders.ad; }) : bankaSorulari();
      SUANKI = { ders: ders ? ders.ad : "Genel Deneme Testi", sorular: sorular, i: 0, cevap: {}, mod: "test" };
      modulCiz();
    }
    if (q.haber) {   // haber penceresini göster
      var b = window.USTAD_BESLEME;
      if (b && b.haberler && b.haberler.length) haberAc(b.haberler[Number(q.haber) || 0]);
    }
    if (q.deneme && window.Deneme) {
      if (q.deneme === "basla") window.Deneme.basla(false);
      else if (q.deneme === "optik") { window.Deneme.basla(false); var ob = document.querySelector("[data-islem='optik']"); if (ob) ob.click(); }
      else if (q.deneme === "sonuc") {
        window.Deneme.basla(false);
        var doldurulan = window.Deneme.demoDoldur();
        window.Deneme.bitir(false);
        console.log("demo: " + doldurulan + " soru dolduruldu");
      } else if (q.deneme === "kilit") {
        try { localStorage.setItem("ustad.deneme.kilit", JSON.stringify(Date.now() + 14 * 60000 + 32000)); } catch (e) {}
        deneme();
      }
    }
  }
})();
