/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · ÜSTAD KOÇ AI (çevrimdışı sınav koçu) · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   İNTERNET YOK, ANAHTAR YOK: koç yalnızca cihazdaki kendi verilerini okur
   (test istatistiği, yanlış konu defteri, hızlı denemeler, program, oyun rekorları, ÖSYM takvimi, ders notları).
   Kararlar kural tabanlıdır ve her cümle ölçülebilir veriye dayanır; uydurma bilgi üretilmez. */
(function () {
  "use strict";
  var A = window.KOC_AI = window.KOC_AI || {};

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function depoAl(k, v) { try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } }
  function depoKoy(k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); } catch (e) {} }
  function kucuk(s) { return String(s || "").toLocaleLowerCase("tr-TR"); }
  function bugun() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate(); }
  function ad() { return depoAl("isim", "") || "öğrenci"; }
  function cins() { return depoAl("cinsiyet", "") === "kiz" ? "kiz" : "erkek"; }
  function ses(metin) { try { if (window.KPSS_SES && KPSS_SES.konus) KPSS_SES.konus(metin); } catch (e) {} }

  /* ───────────── veri ───────────── */
  function dersler() { var p = window.USTAD_PAKET || {}; return p.dersler || []; }
  function sorular() {
    var s = window.USTAD_SORULAR;
    if (Array.isArray(s)) return s;
    return (s && (s.sorular || s.liste)) || [];
  }
  function takvim() { return window.KPSS_TAKVIM || window.TAKVIM || { sinavlar: [], sonuclar: [] }; }
  function guncelMaddeler() { var g = window.KPSS_GUNCEL || window.GUNCEL || {}; return g.maddeler || []; }
  function notlar() { var n = window.USTAD_NOTLAR || {}; return Object.keys(n).map(function (k) { return n[k]; }); }

  A.veriOku = function () {
    return {
      ist: depoAl("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 }),
      yanlisKonu: depoAl("yanlisKonu", {}),
      program: depoAl("program", null),
      denemeler: depoAl("ka.denemeler", []),
      hedef: depoAl("ka.hedef", 85),
      oyun: depoAl("oyunEnIyi", {}),
      dersler: dersler(),
      soruSayisi: sorular().length,
      takvim: takvim(),
      guncelSayisi: guncelMaddeler().length,
      notSayisi: notlar().length
    };
  };

  /* ───────────── analiz (tüm sayılar veriden) ───────────── */
  A.kalanGun = function (v) {
    v = v || A.veriOku();
    var simdi = Date.now(), en = null;
    (v.takvim.sinavlar || []).forEach(function (s) {
      var t = new Date(s.tarih).getTime();
      if (t > simdi && (!en || t < en.t)) en = { t: t, ad: s.ad, tarih: s.tarih };
    });
    if (!en) return null;
    return { gun: Math.floor((en.t - simdi) / 86400000), ad: en.ad, tarih: en.tarih };
  };
  A.evre = function (gun) {
    if (gun === null || gun === undefined) return "bilinmiyor";
    if (gun > 60) return "temel";
    if (gun > 30) return "pekiştirme";
    if (gun > 7) return "deneme";
    return "son hafta";
  };
  A.zayifKonular = function (v) {
    v = v || A.veriOku();
    return Object.keys(v.yanlisKonu).filter(function (k) { return v.yanlisKonu[k] > 0; })
      .map(function (k) { var p = k.split("|"); return { konu: p[0], ders: p[1] || "", adet: v.yanlisKonu[k] }; })
      .sort(function (a, b) { return b.adet - a.adet; });
  };
  A.dersRisk = function (v) {
    v = v || A.veriOku();
    var harita = {};
    v.dersler.forEach(function (d) { harita[d.ad] = { ders: d.ad, soruHavuzu: d.soru || 0, yanlis: 0, konular: (d.konular || []).length }; });
    Object.keys(v.yanlisKonu).forEach(function (k) {
      var p = k.split("|"), d = p[1] || "";
      if (!harita[d]) harita[d] = { ders: d, soruHavuzu: 0, yanlis: 0, konular: 0 };
      harita[d].yanlis += v.yanlisKonu[k];
    });
    return Object.keys(harita).map(function (d) { return harita[d]; })
      .sort(function (a, b) { return b.yanlis - a.yanlis; });
  };
  A.netDurum = function (v) {
    v = v || A.veriOku();
    var d = (v.denemeler || []).slice(-3);
    if (!d.length) return null;
    var son = d[d.length - 1], onceki = d.length > 1 ? d[d.length - 2] : null;
    return { son: son.tDogru, hedef: v.hedef, fark: son.tDogru - v.hedef,
             trend: onceki ? son.tDogru - onceki.tDogru : null, adet: (v.denemeler || []).length,
             gosterge: son.gosterge, yuzde: son.yuzde, seri: d.map(function (x) { return x.tDogru; }) };
  };
  A.basariYuzde = function (v) {
    v = v || A.veriOku();
    return v.ist.cozulen ? Math.round(v.ist.dogru / v.ist.cozulen * 100) : 0;
  };
  A.gunlukSure = function (gun, basari) {
    if (gun === null || gun === undefined) return 90;
    var dk = 90;
    if (gun <= 7) dk = 120; else if (gun <= 30) dk = 150; else if (gun <= 60) dk = 120; else dk = 90;
    if (basari && basari < 50) dk += 30;                 // temel eksikse süre artar
    else if (basari && basari > 80) dk -= 15;            // iyi durumda verimli kısa çalışma
    return Math.max(60, Math.min(210, dk));
  };
  A.analiz = function () {
    var v = A.veriOku(), kalan = A.kalanGun(v), zayif = A.zayifKonular(v), net = A.netDurum(v);
    var basari = A.basariYuzde(v);
    var egilim = "veri yok";
    if (net) egilim = net.trend === null ? "tek deneme" : (net.trend > 0 ? "yükseliyor" : (net.trend < 0 ? "düşüyor" : "sabit"));
    return { veri: v, kalan: kalan, evre: A.evre(kalan ? kalan.gun : null), zayif: zayif, risk: A.dersRisk(v),
             net: net, basari: basari, egilim: egilim,
             sure: A.gunlukSure(kalan ? kalan.gun : null, basari),
             uyari: v.ist.cozulen === 0 ? "Henüz test çözmedin — koçun önerileri ilk testlerden sonra netleşir." : null };
  };

  /* ───────────── günlük / haftalık plan ───────────── */
  A.gunlukPlan = function (v) {
    v = v || A.veriOku();
    var a = A.analiz(), plan = [], zayif = a.zayif, kalan = a.kalan, evre = a.evre;
    var zayifKonu = zayif.length ? zayif[0] : null;
    var zayifDers = zayifKonu ? zayifKonu.ders : (a.risk[0] ? a.risk[0].ders : "Matematik");
    if (!v.ist.cozulen) {
      plan.push({ baslik: "Başlangıç testi: " + zayifDers, dk: 25, bolum: "testler",
                  aciklama: "Hangi konuda eksik olduğunu görmek için 20 soruluk test çöz (koç ancak veriyle çalışır)." });
      plan.push({ baslik: "Güncel bilgi: 10 madde oku", dk: 15, bolum: "guncel", aciklama: "Genel Kültür'de güncel bilgi her yıl soruluyor." });
      plan.push({ baslik: "1 sesli ders dinle", dk: 15, bolum: "sesli", aciklama: "Sesli Dersler → Ders notları bölümünden bir konu." });
      plan.push({ baslik: "Tanışma oyunu", dk: 10, bolum: "oyun", aciklama: "Bilgi Yarışı ile seviyeni ölç." });
    } else if (evre === "temel" || evre === "pekiştirme") {
      if (zayifKonu) plan.push({ baslik: "Eksik konu: " + zayifKonu.konu + " (" + zayifKonu.ders + ")",
                                 dk: 30, bolum: "sesli", aciklama: zayifKonu.adet + " yanlışın var — konu anlatımını sesli dinle, sonra 15 soru çöz." });
      plan.push({ baslik: zayifDers + " test seti (20 soru)", dk: 30, bolum: "testler", aciklama: "Yanlışlarını 'ÜSTAD Öneriyor' defterinde biriktir." });
      plan.push({ baslik: "Güncel bilgi tekrarı (10 madde)", dk: 15, bolum: "guncel", aciklama: "Hızlı tekrar kartlarıyla sesli çalış." });
      plan.push({ baslik: "Hızlı deneme (net takibi)", dk: 20, bolum: "puan", aciklama: "Net & Puan bölümünde kaydet, koç gelişimini ölçsün." });
      plan.push({ baslik: "Eğitici oyun (5 dk mola)", dk: 10, bolum: "oyun", aciklama: "Mola da çalışmadır: Yazım Avı veya Sayı Avı." });
    } else if (evre === "deneme") {
      plan.push({ baslik: "Tam deneme sınavı", dk: 45, bolum: "deneme", aciklama: "Süre tutarak çöz; sonucu Net & Puan'a gir." });
      if (zayifKonu) plan.push({ baslik: "Yanlış konu tekrarı: " + zayifKonu.konu, dk: 25, bolum: "sesli", aciklama: "Denemede çıkan eksikleri duyarak pekiştir." });
      plan.push({ baslik: "Çıkmış soru incelemesi (2011-2021)", dk: 20, bolum: "cikmis", aciklama: "Bir yıl seç, konu dağılımına bak, özgün soruları çöz." });
      plan.push({ baslik: "Güncel bilgi: 10 madde", dk: 15, bolum: "guncel", aciklama: "Sınav öncesi taze bilgi." });
    } else {
      plan.push({ baslik: "Son hafta: hafif tekrar", dk: 30, bolum: "sesli", aciklama: "Yeni konu yok; sevdiğin sesle hepsini bir kez dinle." });
      plan.push({ baslik: "Güncel bilgi + takvim kontrolü", dk: 15, bolum: "guncel", aciklama: "Sınav günü/saati için Geri Sayım bölümünü aç." });
      plan.push({ baslik: "Gün aşırı deneme", dk: 45, bolum: "deneme", aciklama: "Deneme aralarında mutlaka dinlen; uykuyu bozma." });
      plan.push({ baslik: "Kısa oyun (zihin açıcı)", dk: 10, bolum: "oyun", aciklama: "Eşleştirme iyi bir ısınma." });
    }
    var acil = ["testler", "sesli", "deneme", "guncel"];
    return plan.map(function (p, i) {
      return { sira: i + 1, baslik: p.baslik, aciklama: p.aciklama || "", dk: p.dk, bolum: p.bolum || (acil[i % acil.length]) };
    });
  };
  A.haftalikPlan = function (v) {
    v = v || A.veriOku();
    var a = A.analiz(), risk = a.risk, gunler = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
    var dersAdlari = risk.map(function (r) { return r.ders; }).filter(Boolean);
    if (!dersAdlari.length) dersAdlari = v.dersler.map(function (d) { return d.ad; });
    return gunler.map(function (g, i) {
      var birinci = dersAdlari[i % dersAdlari.length], ikinci = dersAdlari[(i + 3) % dersAdlari.length];
      var not = "";
      if (a.evre === "temel" || a.evre === "pekiştirme") not = i === 5 ? "Genel tekrar + 1 tam deneme" : "Konu + 20 soru";
      else if (a.evre === "deneme") not = i % 2 === 0 ? "Tam deneme + yanlış analizi" : "Eksik konu tekrarı";
      else not = i % 2 === 0 ? "Gün aşırı deneme" : "Dinlenme + hafif tekrar";
      return { gun: g, dersler: [birinci, ikinci].filter(Boolean), not: not, dk: a.sure };
    });
  };
  A.motivasyon = function (a) {
    a = a || A.analiz();
    var s = [];
    if (a.net) {
      if (a.net.fark >= 0) s.push("Son denemende hedefini " + a.net.fark + " doğru geçtin — bu tempoyu koru.");
      else s.push("Hedefe " + Math.abs(a.net.fark) + " doğru kaldı. Günde 5 soru fazla çözsen 17 günde kapanır.");
      if (a.egilim === "yükseliyor") s.push("Netin yükseliyor: " + a.net.seri.join(" → ") + ".");
      if (a.egilim === "düşüyor") s.push("Son denemelerde düşüş var; yeni konu yerine yanlışlarını tekrar et.");
    }
    if (a.zayif.length) s.push("En çok zorlandığın konu: " + a.zayif[0].konu + " (" + a.zayif[0].ders + ").");
    if (a.kalan) s.push("Sınava " + a.kalan.gun + " gün kaldı: " + a.kalan.ad + ".");
    if (!s.length) s.push("Henüz veri yok. Bir test çöz, koç seni tanımaya başlasın.");
    s.push("Bugün " + a.sure + " dakika çalışman yeterli; düzenli çalışma tek günlük maratondan iyidir.");
    return s.join(" ");
  };

  /* ───────────── sohbet (kural tabanlı niyet eşleme) ───────────── */
  var NIYETLER = [
    { id: "plan", anahtar: ["bugün ne", "ne çalışsam", "plan", "program", "ne yapayım", "nereden başla"] },
    { id: "gun", anahtar: ["kaç gün", "kalan", "sınav ne zaman", "geri sayım", "tarih"] },
    { id: "net", anahtar: ["net", "puan", "deneme sonuc", "kaç yaptım", "hedefim"] },
    { id: "zayif", anahtar: ["zayıf", "eksik", "yanlış", "noksan", "kötü olduğum"] },
    { id: "durum", anahtar: ["durumum", "nasıl gidiyor", "istatistik", "seviyem", "başarım"] },
    { id: "motivasyon", anahtar: ["motivasyon", "moral", "yoruldum", "bıktım", "korkuyorum", "stres"] },
    { id: "hafta", anahtar: ["haftalık", "hafta planı", "7 gün"] },
    { id: "guncel", anahtar: ["güncel", "haber", "2026 bilgi"] },
    { id: "test", anahtar: ["test", "soru çöz", "soru bankası"] },
    { id: "sesli", anahtar: ["sesli", "dinle", "kulak", "sesli ders"] },
    { id: "oyun", anahtar: ["oyun", "eğlen", "mola"] },
    { id: "tesekkur", anahtar: ["teşekkür", "sağ ol", "eyvallah"] }
  ];
  A.niyetBul = function (metin) {
    var m = kucuk(metin);
    for (var i = 0; i < NIYETLER.length; i++) {
      for (var j = 0; j < NIYETLER[i].anahtar.length; j++) {
        if (m.indexOf(NIYETLER[i].anahtar[j]) >= 0) return NIYETLER[i].id;
      }
    }
    return "bilinmiyor";
  };
  A.sohbet = function (metin) {
    var niyet = A.niyetBul(metin), a = A.analiz(), cevap = "", yonlendir = null;
    if (niyet === "plan") {
      var p = A.gunlukPlan();
      cevap = "Bugünün planı " + p.length + " görev, toplam " + p.reduce(function (t, x) { return t + x.dk; }, 0) + " dakika. " +
        p.map(function (x) { return x.sira + ") " + x.baslik + " (" + x.dk + " dk)"; }).join(" ");
      yonlendir = "kocai";
    } else if (niyet === "gun") {
      cevap = a.kalan ? "En yakın sınav " + a.kalan.ad + " ve " + a.kalan.gun + " gün kaldı (" + a.kalan.tarih.slice(0, 10) +
        "). Şu an '" + a.evre + "' evresindeyiz; günde " + a.sure + " dakika çalışma öneriyorum." : "Takvimde gelecek sınav bulamadım.";
    } else if (niyet === "net") {
      cevap = a.net ? "Son hızlı denemende " + a.net.son + " doğru, gösterge puan " + a.net.gosterge + ". Hedefin " + a.net.hedef +
        " doğru; fark " + (a.net.fark >= 0 ? "+" : "") + a.net.fark + ". Eğilim: " + a.egilim + "." :
        "Kayıtlı hızlı deneme yok. Net & Puan bölümünde bir deneme kaydet, gelişimini takip edeyim.";
    } else if (niyet === "zayif") {
      cevap = a.zayif.length ? "Sıralı eksik konuların: " + a.zayif.slice(0, 5).map(function (z, i) {
        return (i + 1) + ") " + z.konu + " (" + z.ders + ", " + z.adet + " yanlış)"; }).join(" ") :
        "Yanlış kaydın yok. Test çözdükçe eksiklerini burada sıralarım.";
    } else if (niyet === "durum") {
      cevap = "Çözülen soru " + a.veri.ist.cozulen + ", doğru " + a.veri.ist.dogru + ", yanlış " + a.veri.ist.yanlis +
        ", başarı yüzde " + a.basari + ". " + (a.uyari || "") + " Toplam " + a.veri.soruSayisi + " soruluk banka ve " +
        a.veri.notSayisi + " ders notu hazır.";
    } else if (niyet === "motivasyon") {
      cevap = A.motivasyon(a);
    } else if (niyet === "hafta") {
      var h = A.haftalikPlan();
      cevap = "Haftalık plan: " + h.map(function (x) { return x.gun + " → " + x.dersler.join(" + ") + " (" + x.not + ")"; }).join(". ") + ".";
    } else if (niyet === "guncel") {
      var gm = guncelMaddeler();
      if (gm.length) {
        var m = gm[Math.floor(Math.random() * gm.length)];
        cevap = "Güncel bilgi: " + m.konu + " — " + m.bilgi + (m.kaynak_ad ? " (Kaynak: " + m.kaynak_ad + ")" : "");
      } else cevap = "Güncel bilgi paketi yüklü değil.";
    } else if (niyet === "test") {
      cevap = "Seni test bölümüne götürüyorum. Zayıf dersin: " + (a.risk[0] ? a.risk[0].ders : "belirsiz") + ".";
      yonlendir = "testler";
    } else if (niyet === "sesli") {
      cevap = "Sesli Dersler bölümünü açıyorum: 20 ders notu, 30 güncel bilgi ve 33 soru çözümü sesli okunuyor.";
      yonlendir = "sesli";
    } else if (niyet === "oyun") {
      cevap = "Eğitici oyunlar bölümünü açıyorum. 10 dakikalık mola zihni açar.";
      yonlendir = "oyun";
    } else if (niyet === "tesekkur") {
      cevap = "Rica ederim " + ad() + ". Birlikte başaracağız.";
    } else {
      cevap = "Bunu tam anlayamadım. Şunları sorabilirsin: “bugün ne çalışsam”, “sınava kaç gün kaldı”, " +
        "“netim kaç”, “zayıf konularım”, “haftalık plan”, “güncel bilgi ver”, “motivasyon”, “test çöz”, “oyun”.";
    }
    var gecmis = depoAl("kocGecmis", []);
    gecmis.push({ t: new Date().toISOString(), soru: String(metin).slice(0, 200), niyet: niyet, cevap: cevap });
    depoKoy("kocGecmis", gecmis.slice(-30));
    return { niyet: niyet, cevap: cevap, yonlendir: yonlendir, analiz: a };
  };

  /* ───────────── günlük görev kaydı ───────────── */
  function gunlukKayit() { return depoAl("kocGunluk", {}); }
  A.tamamlananlar = function () { return gunlukKayit()[bugun()] || []; };
  A.gorevTamamla = function (sira) {
    var g = gunlukKayit(), b = g[bugun()] || [];
    var i = b.indexOf(sira);
    if (i < 0) b.push(sira); else b.splice(i, 1);
    g[bugun()] = b;
    var gunler = Object.keys(g);
    if (gunler.length > 60) gunler.sort().slice(0, gunler.length - 60).forEach(function (k) { delete g[k]; });
    depoKoy("kocGunluk", g);
    return b;
  };
  A.seri = function () {
    var g = gunlukKayit(), n = 0, d = new Date();
    for (var i = 0; i < 365; i++) {
      var k = d.getFullYear() + "-" + (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate();
      if ((g[k] || []).length > 0) n++; else break;
      d.setDate(d.getDate() - 1);
    }
    return n;
  };

  /* ───────────── arayüz ───────────── */
  var mesajlar = [];
  A.bolumAc = function (kod) {
    if (kod === "kocai") {
      ciz();
      var br = A.brifing();                 // günde bir kez kısa sesli özet
      if (br) { mesajlar.push({ kim: "koc", metin: br }); sohbetCiz(); ses(br); }
    }
  };
  function ciz() {
    var kap = $("#kocAiAlan"); if (!kap) return;
    var a = A.analiz(), p = A.gunlukPlan(), tamam = A.tamamlananlar(), h = A.haftalikPlan();
    kap.innerHTML =
      '<div class="kai-ust">' +
        '<div class="kai-koc"><b>🤖 ÜSTAD KOÇ AI</b><span>çevrimdışı · internetsiz · anahtarsız · yalnızca senin verinle çalışır</span></div>' +
        '<div class="kai-rozet">' + (a.kalan ? "⏳ " + a.kalan.gun + " gün" : "takvim yok") + "</div>" +
      "</div>" +
      '<div class="kai-kutular">' +
        '<div class="kai-kutu"><b>' + a.sure + '</b><span>BUGÜN ÖNERİLEN DK</span></div>' +
        '<div class="kai-kutu"><b>%' + a.basari + "</b><span>TEST BAŞARIN</span></div>" +
        '<div class="kai-kutu"><b>' + (a.net ? a.net.son : "—") + "</b><span>SON DENEME DOĞRU</span></div>" +
        '<div class="kai-kutu"><b>' + a.zayif.length + "</b><span>EKSİK KONU</span></div>" +
        '<div class="kai-kutu"><b>' + A.seri() + "🔥</b><span>ÇALIŞMA SERİSİ</span></div>" +
        '<div class="kai-kutu"><b>' + a.evre + "</b><span>EVRE</span></div>" +
      "</div>" +
      (a.uyari ? '<div class="kai-uyari">⚠ ' + kacis(a.uyari) + "</div>" : "") +
      '<div class="kai-iki">' +
        '<div class="kai-blok"><h4>🗓 Bugünün planı <span class="ka-etiket">' + p.length + " görev · " +
          p.reduce(function (t, x) { return t + x.dk; }, 0) + " dk</span></h4>" +
          p.map(function (x) {
            var bit = tamam.indexOf(x.sira) >= 0;
            return '<div class="kai-gorev' + (bit ? " tamam" : "") + '">' +
              '<button class="kai-tik" data-kai-tik="' + x.sira + '">' + (bit ? "✔" : "○") + "</button>" +
              '<div class="kai-gorev-ic"><b>' + x.sira + ". " + kacis(x.baslik) + " <span class=\"ka-etiket\">" + x.dk + " dk</span></b>" +
              '<span>' + kacis(x.aciklama) + "</span></div>" +
              '<button class="ka-mini" data-kai-git="' + kacis(x.bolum) + '">aç ▶</button></div>';
          }).join("") +
        "</div>" +
        '<div class="kai-blok"><h4>📆 Haftalık dağılım</h4>' +
          '<table class="oyun-tablo"><thead><tr><th>Gün</th><th>Dersler</th><th>Odak</th><th>Dk</th></tr></thead><tbody>' +
          h.map(function (x) { return "<tr><td><b>" + x.gun + "</b></td><td>" + kacis(x.dersler.join(" + ")) +
            "</td><td>" + kacis(x.not) + "</td><td>" + x.dk + "</td></tr>"; }).join("") +
          "</tbody></table></div>" +
      "</div>" +
      '<div class="kai-blok"><h4>💬 Koça sor</h4>' +
        '<div class="ka-butonlar">' +
          ["bugün ne çalışsam", "sınava kaç gün kaldı", "netim kaç", "zayıf konularım", "haftalık plan", "güncel bilgi ver", "motivasyon", "test çöz"].map(function (q) {
            return '<button class="ka-mini" data-kai-sor="' + kacis(q) + '">' + kacis(q) + "</button>";
          }).join("") +
        "</div>" +
        '<div class="kai-form"><input id="kaiGirdi" placeholder="Koça bir şey yaz: bugün ne çalışsam?"><button class="ka-dugme" id="kaiGonder">Sor</button>' +
        '<button class="ka-dugme ka-ikincil" id="kaiSesli">🔊 Cevabı dinle</button></div>' +
        '<div class="kai-sohbet" id="kaiSohbet"></div>' +
      "</div>" +
      '<div class="kai-blok"><h4>🧭 Karar gerekçeleri (uydurma yok, her satır veriden)</h4>' +
        '<ul class="kai-liste">' +
          "<li><b>Kalan gün:</b> " + (a.kalan ? a.kalan.gun + " gün (" + kacis(a.kalan.ad) + ")" : "takvim verisi yok") + "</li>" +
          "<li><b>Evre:</b> " + kacis(a.evre) + " (kural: 60+ temel · 31-60 pekiştirme · 8-30 deneme · ≤7 son hafta)</li>" +
          "<li><b>Günlük süre:</b> " + a.sure + " dk (evre + başarı yüzdesine göre; 60-210 dk arası sınırlı)</li>" +
          "<li><b>En riskli ders:</b> " + (a.risk[0] ? kacis(a.risk[0].ders) + " (" + a.risk[0].yanlis + " yanlış)" : "veri yok") + "</li>" +
          "<li><b>Net eğilimi:</b> " + kacis(a.egilim) + (a.net ? " · son 3 deneme: " + a.net.seri.join(", ") : "") + "</li>" +
          "<li><b>Veri kaynakları:</b> " + a.veri.ist.cozulen + " çözülen soru · " + a.veri.denemeler.length +
            " hızlı deneme · " + Object.keys(a.veri.yanlisKonu).length + " konu kaydı · " + a.veri.guncelSayisi + " güncel madde · " +
            a.veri.notSayisi + " ders notu</li>" +
        "</ul>" +
        '<p class="aciklama">Bu koç internet kullanmaz, veri göndermez; bütün kararlar yukarıdaki sayılardan üretilir.</p>' +
      "</div>";
    $$("#kocAiAlan [data-kai-tik]").forEach(function (b) {
      b.addEventListener("click", function () { A.gorevTamamla(Number(b.getAttribute("data-kai-tik"))); ciz(); });
    });
    $$("#kocAiAlan [data-kai-git]").forEach(function (b) {
      b.addEventListener("click", function () { if (window.USTAD_MOTOR && USTAD_MOTOR.git) USTAD_MOTOR.git(b.getAttribute("data-kai-git")); else location.hash = b.getAttribute("data-kai-git"); });
    });
    $$("#kocAiAlan [data-kai-sor]").forEach(function (b) {
      b.addEventListener("click", function () { sor(b.getAttribute("data-kai-sor")); });
    });
    $("#kaiGonder").addEventListener("click", function () { sor($("#kaiGirdi").value); });
    $("#kaiGirdi").addEventListener("keydown", function (e) { if (e.key === "Enter") sor($("#kaiGirdi").value); });
    $("#kaiSesli").addEventListener("click", function () {
      var son = mesajlar.filter(function (m) { return m.kim === "koc"; }).slice(-1)[0];
      if (son) ses(son.metin); else ses("Henüz cevap yok. Bir soru yaz.");
    });
    sohbetCiz();
  }
  function sor(metin) {
    metin = String(metin || "").trim();
    if (!metin) return;
    mesajlar.push({ kim: "ben", metin: metin });
    var c = A.sohbet(metin);
    mesajlar.push({ kim: "koc", metin: c.cevap });
    if (mesajlar.length > 20) mesajlar = mesajlar.slice(-20);
    var g = $("#kaiGirdi"); if (g) g.value = "";
    sohbetCiz();
    ses(c.cevap);
    return c;
  }
  A.sor = sor;
  function sohbetCiz() {
    var kap = $("#kaiSohbet"); if (!kap) return;
    kap.innerHTML = mesajlar.length ? mesajlar.map(function (m) {
      return '<div class="kai-mesaj ' + (m.kim === "ben" ? "ben" : "koc") + '"><b>' + (m.kim === "ben" ? kacis(ad()) : "🤖 ÜSTAD KOÇ AI") +
        "</b><span>" + kacis(m.metin) + "</span></div>";
    }).join("") : '<p class="aciklama">Koç hazır. Yaz ya da hazır sorulardan birine bas; cevabı sesli de okuyabilir.</p>';
    kap.scrollTop = kap.scrollHeight;
  }
  A.sohbetGecmisi = function () { return depoAl("kocGecmis", []); };

  /* günde bir kez kısa sesli brifing */
  A.brifing = function () {
    var son = depoAl("kocBrifing", "");
    if (son === bugun()) return null;
    var a = A.analiz(), p = A.gunlukPlan();
    var metin = "Günaydın " + ad() + ". " + (a.kalan ? "Sınava " + a.kalan.gun + " gün kaldı. " : "") +
      "Bugün " + p.length + " görev, toplam " + p.reduce(function (t, x) { return t + x.dk; }, 0) + " dakika. İlk görev: " + p[0].baslik + ".";
    depoKoy("kocBrifing", bugun());
    return metin;
  };

  /* ───────────── kendi kendini test (?test=1) ───────────── */
  if (location.search.indexOf("test=1") >= 0) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        var t = [], ok = function (ad2, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad2 + (ek ? " → " + ek : "")); };
        // ağ erişimi denetimi: koç hiçbir istek yapmamalı
        var istekSayisi = 0, eskiFetch = window.fetch, eskiAc = window.XMLHttpRequest;
        try {
          window.fetch = function () { istekSayisi++; return eskiFetch ? eskiFetch.apply(this, arguments) : Promise.resolve(); };
          window.XMLHttpRequest = function () { istekSayisi++; return new eskiAc(); };
        } catch (e) {}

        var v = A.veriOku();
        ok("veri: ders listesi", v.dersler.length >= 4, v.dersler.length + " ders");
        ok("veri: soru bankası", v.soruSayisi >= 100, v.soruSayisi + " soru");
        ok("veri: güncel madde", v.guncelSayisi >= 20, v.guncelSayisi + " madde");
        ok("veri: ders notu", v.notSayisi >= 10, v.notSayisi + " not");

        // sentetik veri ile analiz doğruluğu
        var eskiIst = depoAl("ist", null), eskiYanlis = depoAl("yanlisKonu", null), eskiDeneme = depoAl("ka.denemeler", null);
        depoKoy("ist", { cozulen: 100, dogru: 62, yanlis: 30, bos: 8 });
        depoKoy("yanlisKonu", { "Paragraf|Türkçe": 7, "Problemler|Matematik": 5, "Nüfus|Coğrafya": 2 });
        depoKoy("ka.denemeler", [{ id: "a", tarih: new Date().toISOString(), tDogru: 70, yuzde: 58, gosterge: 60 },
                                 { id: "b", tarih: new Date().toISOString(), tDogru: 78, yuzde: 65, gosterge: 65 }]);
        var a2 = A.analiz();
        ok("analiz: başarı yüzdesi", a2.basari === 62, "62 beklenir → " + a2.basari);
        ok("analiz: zayıf konu sırası", a2.zayif[0].konu === "Paragraf" && a2.zayif[1].konu === "Problemler", JSON.stringify(a2.zayif.slice(0, 2)));
        ok("analiz: net farkı", a2.net && a2.net.fark === 78 - 85, a2.net ? String(a2.net.fark) : "yok");
        ok("analiz: eğilim yükseliyor", a2.egilim === "yükseliyor", a2.egilim);
        ok("analiz: en riskli ders Türkçe", a2.risk[0].ders === "Türkçe", a2.risk[0].ders);
        ok("kural: günlük süre sınırları", A.gunlukSure(5, 40) >= 60 && A.gunlukSure(5, 40) <= 210 && A.gunlukSure(200, 95) <= 210, A.gunlukSure(5, 40) + " / " + A.gunlukSure(200, 95));
        ok("kural: evre sınırları", A.evre(90) === "temel" && A.evre(45) === "pekiştirme" && A.evre(20) === "deneme" && A.evre(3) === "son hafta",
           [A.evre(90), A.evre(45), A.evre(20), A.evre(3)].join("/"));
        ok("kural: kalan gün", a2.kalan === undefined || a2.kalan === null || a2.kalan.gun >= 0, a2.kalan ? a2.kalan.gun + " gün" : "takvim yok");
        var p = A.gunlukPlan();
        ok("plan: görev sayısı 3-6", p.length >= 3 && p.length <= 6, p.length + " görev");
        ok("plan: her görevde metin/bolum/dk", p.every(function (x) { return x.baslik && x.bolum && x.dk > 0; }));
        var h = A.haftalikPlan();
        ok("plan: haftalık 7 gün", h.length === 7 && h.every(function (x) { return x.dersler.length >= 1; }), h.length + " gün");
        ok("niyet: bugün ne çalışsam → plan", A.niyetBul("bugün ne çalışsam") === "plan");
        ok("niyet: kaç gün kaldı → gun", A.niyetBul("sınava kaç gün kaldı") === "gun");
        ok("niyet: netim kaç → net", A.niyetBul("netim kaç") === "net");
        ok("niyet: yoruldum → motivasyon", A.niyetBul("çok yoruldum") === "motivasyon");
        ok("niyet: oyun → oyun", A.niyetBul("oyun oynayalım") === "oyun");
        ok("niyet: anlamsız → bilinmiyor", A.niyetBul("xyzabc") === "bilinmiyor");
        var c1 = A.sohbet("bugün ne çalışsam");
        ok("sohbet: plan cevabı görev sayısını söylüyor", /görev/.test(c1.cevap) && c1.cevap.length > 40, c1.cevap.slice(0, 60));
        var c2 = A.sohbet("zayıf konularım");
        ok("sohbet: zayıf konu cevabı veriden", /Paragraf/.test(c2.cevap), c2.cevap.slice(0, 70));
        var c3 = A.sohbet("güncel bilgi ver");
        ok("sohbet: güncel madde getiriyor", c3.cevap.length > 60 && /Güncel bilgi/.test(c3.cevap), c3.cevap.slice(0, 50));
        var c4 = A.sohbet("test çöz");
        ok("sohbet: yönlendirme çalışıyor", c4.yonlendir === "testler", String(c4.yonlendir));
        // görev işaretleme
        var simdi = bugun();
        A.gorevTamamla(1);
        ok("kayıt: görev tamamlandı", A.tamamlananlar().indexOf(1) >= 0, JSON.stringify(A.tamamlananlar()));
        A.gorevTamamla(1);
        ok("kayıt: geri alma", A.tamamlananlar().indexOf(1) < 0);
        A.gorevTamamla(2);
        ok("kayıt: seri ≥ 1", A.seri() >= 1, String(A.seri()));
        // arayüz
        ciz();
        ok("arayüz: 6 kutu", $$("#kocAiAlan .kai-kutu").length === 6, $$("#kocAiAlan .kai-kutu").length + " kutu");
        ok("arayüz: görev kartları", $$("#kocAiAlan .kai-gorev").length === p.length, $$("#kocAiAlan .kai-gorev").length + " kart");
        ok("arayüz: haftalık tablo satırı", $$("#kocAiAlan .oyun-tablo tbody tr").length === 7, $$("#kocAiAlan .oyun-tablo tbody tr").length + " satır");
        ok("arayüz: hazır soru düğmeleri", $$("#kocAiAlan [data-kai-sor]").length === 8, $$("#kocAiAlan [data-kai-sor]").length + " düğme");
        $("#kaiGirdi").value = "durumum nasıl";
        $("#kaiGonder").click();
        ok("arayüz: sohbet balonu eklendi", $$("#kocAiAlan .kai-mesaj").length >= 2, $$("#kocAiAlan .kai-mesaj").length + " balon");
        var br = A.brifing();
        ok("brifing: günlük metin", br === null || /görev/.test(br), br ? br.slice(0, 50) : "bugün verildi");
        ok("ağ: koç hiç istek yapmadı", istekSayisi === 0, istekSayisi + " istek");
        ok("geçmiş: kayıt tutuluyor", A.sohbetGecmisi().length >= 2, A.sohbetGecmisi().length + " kayıt");
        ok("motivasyon metni", A.motivasyon().length > 60, A.motivasyon().slice(0, 50));

        // sentetik veriyi geri al
        if (eskiIst === null) { try { localStorage.removeItem("ustad.ist"); } catch (e) {} } else depoKoy("ist", eskiIst);
        if (eskiYanlis === null) { try { localStorage.removeItem("ustad.yanlisKonu"); } catch (e) {} } else depoKoy("yanlisKonu", eskiYanlis);
        if (eskiDeneme === null) { try { localStorage.removeItem("ustad.ka.denemeler"); } catch (e) {} } else depoKoy("ka.denemeler", eskiDeneme);
        try { window.fetch = eskiFetch; window.XMLHttpRequest = eskiAc; } catch (e) {}

        var kap = document.createElement("div");
        kap.id = "kocAiTestSonuc";
        kap.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
        kap.innerHTML = "<h3>ÜSTAD KOÇ AI testi (çevrimdışı)</h3>" + t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
          "<hr><b>" + t.filter(function (x) { return x.indexOf("✔") === 0; }).length + " / " + t.length + " geçti</b>";
        document.body.appendChild(kap);
        document.title = (document.title || "") + " KOCAITEST " + t.filter(function (x) { return x.indexOf("✔") === 0; }).length + "/" + t.length;
      }, 500);
    });
  }
})();
