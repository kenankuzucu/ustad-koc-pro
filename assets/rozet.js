/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Seri & Rozet · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Kaynak YALNIZCA cihazdaki gerçek verilerdir; uydurma veri üretilmez:
     ustad.kocGunluk     {"YYYY-MM-DD":[görev sıra no]}   → KOÇ AI günlük görev kaydı
     ustad.minitest      [{tarih,ders,konu,dogru,toplam,sureOrt}]
     ustad.ka.denemeler  [{tarih,tDogru,yuzde,gosterge}]  · ustad.ka.hedef (hedef doğru)
     ustad.ist           {cozulen,dogru,yanlis,bos}
     ustad.oyunEnIyi     {oyunKodu: puan | {puan,tarih,tur}}
     ustad.kartlar       {"id":{kutu,...}}   (kutu 1..5, 5 = ezberlenen)
     ustad.sesdene       {toplam,...}
   Yazılanlar: ustad.rozetHedef (günlük hedef), ustad.rozetKutlama (günü tamamlama kaydı).
   "Çalışılan gün" tanımı: o gün en az bir görev işaretlenmiş, mini test çözülmüş veya deneme yapılmışsa sayılır
   (seri, ısı haritası ve göstergeler aynı tanımı kullanır). Hedef/kutlama ise KOÇ AI görev sayısına bakar. */
(function () {
  "use strict";
  var A = window.ROZET = window.ROZET || {};

  /* ───────────── küçük yardımcılar ───────────── */
  function $(s, k) { return (k || document).querySelector(s); }
  function $$(s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function depoAl(k, v) { try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } }
  function depoKoy(k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); } catch (e) {} }
  function depoVar(k) { try { return localStorage.getItem("ustad." + k) !== null; } catch (e) { return false; } }
  function depoSil(k) { try { localStorage.removeItem("ustad." + k); } catch (e) {} }
  function tam(x, v) { var n = parseInt(x, 10); return isNaN(n) ? v : n; }
  function kirp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function ses(metin) { try { if (window.KPSS_SES && window.KPSS_SES.konus) window.KPSS_SES.konus(metin); } catch (e) {} }

  /* ───────────── tarih ───────────── */
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var GUNKISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];   /* Pazartesi = 0 */
  function iki(n) { return n < 10 ? "0" + n : "" + n; }
  function anahtar(d) { return d.getFullYear() + "-" + iki(d.getMonth() + 1) + "-" + iki(d.getDate()); }
  function bugunAnahtar() { return anahtar(new Date()); }
  function gunEkle(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function anahtardanTarih(k) {
    var p = String(k || "").split("-");
    return new Date(tam(p[0], 1970), tam(p[1], 1) - 1, tam(p[2], 1));
  }
  function tarihtenAnahtar(s) {
    s = String(s == null ? "" : s);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    var t = Date.parse(s);
    return isNaN(t) ? "" : anahtar(new Date(t));
  }
  /* iki anahtar arasındaki gün farkı (k1 - k2) */
  function gunFarki(k1, k2) {
    return Math.round((anahtardanTarih(k1).getTime() - anahtardanTarih(k2).getTime()) / 86400000);
  }
  function kisaTarih(k) { var d = anahtardanTarih(k); return d.getDate() + " " + AYLAR[d.getMonth()]; }
  function uzunTarih(k) { var d = anahtardanTarih(k); return d.getDate() + " " + AYLAR[d.getMonth()] + " " + d.getFullYear(); }
  /* haftanın pazartesi (00:00) */
  function haftaBas(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var g = x.getDay();
    x.setDate(x.getDate() + (g === 0 ? -6 : 1 - g));
    return x;
  }

  /* ───────────── veri okuma (gerçek veri, uydurma yok) ───────────── */
  function veriOku() {
    var g = depoAl("kocGunluk", {});
    if (!g || typeof g !== "object") g = {};
    var mt = depoAl("minitest", []);
    if (!Array.isArray(mt)) mt = [];
    var den = depoAl("ka.denemeler", []);
    if (!Array.isArray(den)) den = [];
    var ist = depoAl("ist", {});
    if (!ist || typeof ist !== "object") ist = {};
    var oyun = depoAl("oyunEnIyi", {});
    if (!oyun || typeof oyun !== "object") oyun = {};
    var kart = depoAl("kartlar", {});
    if (!kart || typeof kart !== "object") kart = {};
    return {
      gunluk: g, minitest: mt, denemeler: den,
      ist: { cozulen: tam(ist.cozulen, 0), dogru: tam(ist.dogru, 0), yanlis: tam(ist.yanlis, 0), bos: tam(ist.bos, 0) },
      oyun: oyun, kartlar: kart, sesdene: depoAl("sesdene", {}),
      kaHedef: kirp(tam(depoAl("ka.hedef", 85), 85), 0, 120)
    };
  }

  /* gün bazlı çalışma haritası: {anahtar:{gorev, mt, soru, den}} */
  function gunHaritasi(v) {
    var m = {};
    function ek(k) { if (!m[k]) m[k] = { gorev: 0, mt: 0, soru: 0, den: 0 }; return m[k]; }
    Object.keys(v.gunluk).forEach(function (k) {
      var a = v.gunluk[k], n = Array.isArray(a) ? a.length : (a ? 1 : 0);
      if (n > 0) ek(k).gorev += n;
    });
    v.minitest.forEach(function (x) {
      var k = tarihtenAnahtar(x && x.tarih); if (!k) return;
      var o = ek(k); o.mt++; o.soru += tam(x && x.toplam, 0);
    });
    v.denemeler.forEach(function (x) {
      var k = tarihtenAnahtar(x && x.tarih); if (!k) return;
      ek(k).den++;
    });
    return m;
  }

  /* ───────────── seri hesapları ───────────── */
  function seriBilgi(m) {
    var bugun = bugunAnahtar(), d = new Date();
    /* güncel seri: bugünden geriye doğru kesintisiz çalışılan gün */
    var guncel = 0;
    for (var i = 0; i < 3650; i++) {
      if (m[anahtar(gunEkle(d, -i))]) guncel++; else break;
    }
    var anahtarlar = Object.keys(m).sort();
    var enUzun = 0, enUzunBas = "", enUzunBit = "", toplamGun = 0;
    var onceki = null, run = 0, runBas = "";
    anahtarlar.forEach(function (k) {
      toplamGun++;
      if (onceki && gunFarki(k, onceki) === 1) run++; else { run = 1; runBas = k; }
      if (run > enUzun) { enUzun = run; enUzunBas = runBas; enUzunBit = k; }
      onceki = k;
    });
    /* bu hafta: bugün dahil son 7 günde çalışılan gün sayısı */
    var yedi = {}, j;
    for (j = 0; j < 7; j++) yedi[anahtar(gunEkle(d, -j))] = 1;
    var hafta = 0;
    anahtarlar.forEach(function (k) { if (yedi[k]) hafta++; });
    var b = m[bugun] || null;
    return {
      guncel: guncel, enUzun: enUzun, enUzunBas: enUzunBas, enUzunBit: enUzunBit,
      toplamGun: toplamGun, hafta: hafta,
      bugunVar: !!b, bugunGorev: b ? b.gorev : 0, bugunSoru: b ? b.soru : 0,
      dunVar: !!m[anahtar(gunEkle(d, -1))]
    };
  }

  /* n günlük seriye ilk ulaşılan gün (kazanma tarihi) */
  function seriTarihi(m, n) {
    var anahtarlar = Object.keys(m).sort(), onceki = null, run = 0;
    for (var i = 0; i < anahtarlar.length; i++) {
      var k = anahtarlar[i];
      run = (onceki && gunFarki(k, onceki) === 1) ? run + 1 : 1;
      if (run >= n) return k;
      onceki = k;
    }
    return "";
  }

  /* ───────────── ısı haritası (son 12 hafta × 7 gün = 84 kare) ───────────── */
  function kademe(o) {
    if (!o) return 0;
    var skor = o.gorev + o.mt * 2 + o.den * 3 + Math.ceil(o.soru / 10);
    if (skor <= 0) return 0;
    if (skor <= 2) return 1;
    if (skor <= 5) return 2;
    if (skor <= 9) return 3;
    return 4;
  }
  function kareBaslik(k, o) {
    if (!o) return kisaTarih(k) + " · çalışma yok";
    var p = [];
    if (o.gorev) p.push(o.gorev + " görev");
    if (o.soru) p.push(o.soru + " soru");
    if (o.mt) p.push(o.mt + " mini test");
    if (o.den) p.push(o.den + " deneme");
    return kisaTarih(k) + " · " + (p.length ? p.join(", ") : "çalışma yok");
  }
  function isiHaritasi(m) {
    var bugunT = new Date(), bugunK = anahtar(bugunT), bu = haftaBas(bugunT);
    var haftalar = [];
    for (var h = 11; h >= 0; h--) {
      var bas = gunEkle(bu, -7 * h), gunler = [];
      for (var g = 0; g < 7; g++) {
        var d = gunEkle(bas, g), k = anahtar(d);
        gunler.push({ anahtar: k, bugun: k === bugunK, gelecek: d.getTime() > bugunT.getTime(), kayit: m[k] || null });
      }
      haftalar.push(gunler);
    }
    return haftalar;
  }

  /* ───────────── 13 rozet ───────────── */
  function oyunPuan(x) {
    if (typeof x === "number") return x;
    if (x && typeof x === "object") return tam(x.puan, 0);
    return 0;
  }
  function oyunTarihi(x) {
    if (x && typeof x === "object" && x.tarih) {
      var t = new Date(tam(x.tarih, 0));
      return isNaN(t.getTime()) ? "" : anahtar(t);
    }
    return "";
  }
  function rozetleriHazirla(v, s) {
    var m = s.harita;
    var r = [];

    /* 1 — İlk Adım */
    var ilkGun = Object.keys(v.gunluk).filter(function (k) { return (v.gunluk[k] || []).length > 0; }).sort()[0] || "";
    r.push({ kod: "ilk-adim", ad: "İlk Adım", simg: "🌱", nasil: "KOÇ AI'da ilk günlük görevini işaretle.",
      kazanildi: !!ilkGun, tarih: ilkGun, ilerleme: (ilkGun ? 1 : 0) + "/1" });

    /* 2-5 — seri rozetleri */
    [[3, "3 Gün Seri", "🔥"], [7, "7 Gün Seri", "🔥"], [30, "30 Gün Seri", "🔥"], [100, "100 Gün Seri", "🏆"]].forEach(function (x) {
      var n = x[0], kazan = s.enUzun >= n;
      r.push({ kod: "seri-" + n, ad: x[1], simg: x[2],
        nasil: "Üst üste " + n + " gün görev işaretle.",
        kazanildi: kazan, tarih: kazan ? seriTarihi(m, n) : "",
        ilerleme: Math.min(s.enUzun, n) + "/" + n });
    });

    /* 6-7 — mini test */
    var mtSirali = v.minitest.slice().sort(function (a, b) {
      return String((a && a.tarih) || "").localeCompare(String((b && b.tarih) || ""));
    });
    r.push({ kod: "minitest-1", ad: "İlk Mini Test", simg: "⏱️", nasil: "İlk mini testini tamamla.",
      kazanildi: mtSirali.length >= 1, tarih: mtSirali.length >= 1 ? tarihtenAnahtar(mtSirali[0].tarih) : "",
      ilerleme: Math.min(mtSirali.length, 1) + "/1" });
    r.push({ kod: "minitest-10", ad: "10 Mini Test", simg: "📈", nasil: "10 mini test tamamla.",
      kazanildi: mtSirali.length >= 10, tarih: mtSirali.length >= 10 ? tarihtenAnahtar(mtSirali[9].tarih) : "",
      ilerleme: Math.min(mtSirali.length, 10) + "/10" });

    /* 8 — ilk deneme */
    var denSirali = v.denemeler.slice().sort(function (a, b) {
      return String((a && a.tarih) || "").localeCompare(String((b && b.tarih) || ""));
    });
    r.push({ kod: "deneme-1", ad: "İlk Deneme", simg: "🎯", nasil: "İlk deneme sınavını bitir.",
      kazanildi: denSirali.length >= 1, tarih: denSirali.length >= 1 ? tarihtenAnahtar(denSirali[0].tarih) : "",
      ilerleme: Math.min(denSirali.length, 1) + "/1" });

    /* 9 — hedefi geçtin */
    var enIyiNet = 0, hedefGun = "";
    denSirali.forEach(function (x) {
      var t = tam(x && x.tDogru, 0);
      if (t > enIyiNet) enIyiNet = t;
      if (!hedefGun && t >= v.kaHedef) hedefGun = tarihtenAnahtar(x && x.tarih);
    });
    r.push({ kod: "hedef-gec", ad: "Hedefi Geçtin", simg: "🥇",
      nasil: "Bir denemede " + v.kaHedef + " nete ulaş (Deneme Analizi'nde hedefini ayarlayabilirsin).",
      kazanildi: enIyiNet >= v.kaHedef && denSirali.length > 0, tarih: hedefGun,
      ilerleme: Math.min(enIyiNet, v.kaHedef) + "/" + v.kaHedef + " net" });

    /* 10 — 1000 soru */
    r.push({ kod: "soru-1000", ad: "1000 Soru", simg: "📚", nasil: "Toplam 1000 soru çöz.",
      kazanildi: v.ist.cozulen >= 1000, tarih: "",
      ilerleme: Math.min(v.ist.cozulen, 1000) + "/1000 soru" });

    /* 11 — ezberci */
    var ezber = 0;
    Object.keys(v.kartlar).forEach(function (id) {
      var k = v.kartlar[id];
      if (k && tam(k.kutu, 0) >= 5) ezber++;
    });
    r.push({ kod: "ezberci", ad: "Ezberci", simg: "🧠", nasil: "20 kartı 5. kutuya (ezberlenen) taşı.",
      kazanildi: ezber >= 20, tarih: "", ilerleme: Math.min(ezber, 20) + "/20 kart" });

    /* 12 — dinleyici */
    var sd = v.sesdene, sdTop = 0;
    if (typeof sd === "number") sdTop = sd;
    else if (sd && typeof sd === "object") sdTop = tam(sd.toplam, 0);
    r.push({ kod: "dinleyici", ad: "Dinleyici", simg: "🎧", nasil: "Sesli denemede toplam 100 soru dinle.",
      kazanildi: sdTop >= 100, tarih: "", ilerleme: Math.min(sdTop, 100) + "/100 soru" });

    /* 13 — oyun ustası */
    var oynanan = 0, oyunT = "";
    Object.keys(v.oyun).forEach(function (id) {
      if (oyunPuan(v.oyun[id]) <= 0) return;
      oynanan++;
      var t = oyunTarihi(v.oyun[id]);
      if (t && (!oyunT || t > oyunT)) oyunT = t;
    });
    r.push({ kod: "oyun-ustasi", ad: "Oyun Ustası", simg: "🎮", nasil: "3 farklı oyunda puan kazan.",
      kazanildi: oynanan >= 3, tarih: oyunT, ilerleme: Math.min(oynanan, 3) + "/3 oyun" });

    return r;
  }

  /* ───────────── günlük hedef ───────────── */
  var HEDEFLER = [
    { tur: "gorev", deger: 3, ad: "3 görev" },
    { tur: "dk", deger: 20, ad: "20 dakika" },
    { tur: "dk", deger: 40, ad: "40 dakika" },
    { tur: "dk", deger: 60, ad: "60 dakika" }
  ];
  function hedefAl() {
    var h = depoAl("rozetHedef", null);
    if (h && typeof h === "object" && (h.tur === "gorev" || h.tur === "dk") && tam(h.deger, 0) > 0) {
      return { tur: h.tur, deger: tam(h.deger, 0) };
    }
    return { tur: "gorev", deger: 3 };   /* seçim yapılmadıysa önerilen başlangıç */
  }
  function hedefKoy(tur, deger) { depoKoy("rozetHedef", { tur: tur, deger: tam(deger, 0), an: new Date().toISOString() }); }

  function bugunGorevleri() {
    var g = depoAl("kocGunluk", {}), a = (g && g[bugunAnahtar()]) || [];
    return Array.isArray(a) ? a : [];
  }
  /* bugün tamamlanan görevlerin GERÇEK süresi: KOÇ AI'nın bugünkü planındaki dk'lardan */
  function tamamlananDk() {
    var bit = bugunGorevleri(), plan = planAl();
    if (!plan.length) return bit.length * 20;   /* plan yoksa tahmin (arayüzde belirtilir) */
    var t = 0;
    bit.forEach(function (sira) { var p = plan[tam(sira, 0) - 1]; if (p && p.dk) t += tam(p.dk, 0); });
    return t;
  }
  function planAl() {
    try {
      if (window.KOC_AI && window.KOC_AI.gunlukPlan) {
        var p = window.KOC_AI.gunlukPlan();
        if (Array.isArray(p)) return p;
      }
    } catch (e) {}
    return [];
  }
  function yuzde(t, h) { return h > 0 ? kirp(Math.round(t / h * 100), 0, 100) : 0; }

  function hedefIlerleme() {
    var h = hedefAl();
    if (h.tur === "gorev") {
      var n = bugunGorevleri().length;
      return { tur: h.tur, hedef: h.deger, birim: "görev", ham: n, tamam: Math.min(n, h.deger), yuzde: yuzde(n, h.deger), olcum: "gerçek" };
    }
    var dk = tamamlananDk();
    return { tur: h.tur, hedef: h.deger, birim: "dakika", ham: dk, tamam: Math.min(dk, h.deger), yuzde: yuzde(dk, h.deger),
             olcum: planAl().length ? "gerçek" : "tahmini" };
  }

  /* ───────────── kutlama (günde bir kez) ───────────── */
  var sonKutlama = null;
  function kutlamaKontrol() {
    var i = hedefIlerleme(), kayit = depoAl("rozetKutlama", null);
    if (i.yuzde < 100) return { kutlandi: false, yuzde: i.yuzde };
    if (kayit && typeof kayit === "object" && kayit.tarih === bugunAnahtar()) {
      return { kutlandi: false, tekrar: true, metin: kayit.metin || "", yuzde: i.yuzde };
    }
    var ad2 = depoAl("isim", "") || "";
    var metin = "Tebrikler" + (ad2 ? " " + ad2 : "") + "! Bugünü tamamladın. Günlük hedefin " + i.hedef + " " + i.birim + " tamamlandı.";
    depoKoy("rozetKutlama", { tarih: bugunAnahtar(), hedef: hedefAl(), tamam: i.ham, metin: metin, an: new Date().toISOString() });
    sonKutlama = metin;
    konfeti();
    ses(metin);
    toast("🎉 Bugünü tamamladın! (" + i.hedef + " " + i.birim + ")");
    return { kutlandi: true, metin: metin, yuzde: i.yuzde };
  }
  function konfeti() {
    var renk = ["#ea580c", "#f97316", "#fb923c", "#facc15", "#c2410c"];
    var k = document.createElement("div");
    k.className = "rz-kutlama-perde";
    var h = "";
    for (var i = 0; i < 28; i++) {
      h += '<i class="rz-konfeti" style="left:' + (Math.round(Math.random() * 96)) + '%;' +
        'background:' + renk[i % renk.length] + ';' +
        'animation-duration:' + (1.1 + Math.random() * 1.2).toFixed(2) + 's;' +
        'animation-delay:' + (Math.random() * .5).toFixed(2) + 's;' +
        'transform:rotate(' + Math.round(Math.random() * 360) + 'deg)"></i>';
    }
    k.innerHTML = h;
    document.body.appendChild(k);
    setTimeout(function () { try { k.parentNode.removeChild(k); } catch (e) {} }, 3200);
    return k;
  }
  function toast(metin) {
    try {
      var t = document.createElement("div");
      t.className = "rz-kutlama-toast";
      t.textContent = metin;
      document.body.appendChild(t);
      setTimeout(function () { try { t.parentNode.removeChild(t); } catch (e) {} }, 4200);
    } catch (e) {}
  }

  /* ───────────── çizim ───────────── */
  function ciz() {
    var kap = document.getElementById("rozetAlan");
    if (!kap) return null;
    var v = veriOku(), m = gunHaritasi(v);
    var s = seriBilgi(m);
    s.harita = m;
    var rl = rozetleriHazirla(v, s);
    var kazanilan = rl.filter(function (x) { return x.kazanildi; }).length;
    var bos = (s.toplamGun === 0 && v.minitest.length === 0 && v.denemeler.length === 0 &&
               v.ist.cozulen === 0 && Object.keys(v.oyun).length === 0 && Object.keys(v.kartlar).length === 0);

    var h = ['<div class="rz-panel">'];

    /* 1) göstergeler */
    h.push('<div class="rz-gostergeler">');
    h.push('<div class="rz-gosterge rz-vurgu"><b>' + s.guncel + '</b><span>Güncel Seri</span><i>' + (s.guncel === 1 ? "gün" : "gün") + '</i></div>');
    h.push('<div class="rz-gosterge"><b>' + s.enUzun + '</b><span>En Uzun Seri</span><i>' + (s.enUzunBas ? kisaTarih(s.enUzunBas) + " – " + kisaTarih(s.enUzunBit) : "kayıt yok") + '</i></div>');
    h.push('<div class="rz-gosterge"><b>' + s.hafta + '</b><span>Bu Hafta</span><i>son 7 günde çalışılan gün</i></div>');
    h.push('<div class="rz-gosterge"><b>' + s.toplamGun + '</b><span>Toplam Çalışılan Gün</span><i>görev · mini test · deneme</i></div>');
    h.push('<div class="rz-gosterge"><b>' + s.bugunGorev + '</b><span>Bugün</span><i>' + (s.bugunSoru ? s.bugunSoru + " soru · " : "") + (s.bugunVar ? "çalışıldı" : "henüz yok") + '</i></div>');
    h.push('</div>');

    /* boş veri dürüst durumu */
    if (bos) {
      h.push('<div class="rz-bos" id="rzBosDurum">Henüz kayıt yok — bir test çöz, seri başlasın.</div>');
    }

    /* 5) seri bozulma uyarısı */
    if (!s.bugunVar) {
      h.push('<div class="rz-uyari" id="rzSeriUyari"><span>🔥</span><div>' +
        '<b>Serini kaybetmemek için bugün en az 1 görev işaretle</b>' +
        '<span>' + (s.guncel > 0 ? s.guncel + " günlük serin var. " : "") +
        'KOÇ AI bölümünde günlük görevlerinden birini işaretle; seri bugün de devam etsin.</span></div></div>');
    } else {
      h.push('<div class="rz-tamam-kutu" id="rzBugunTamam"><b>✔ Bugün çalışıldı</b><span>' + s.bugunGorev + ' görev işaretlendi — seri devam ediyor.</span></div>');
    }

    /* 2) ısı haritası */
    h.push('<h3 class="rz-altbaslik">📅 Son 12 Hafta (ısı haritası)</h3>');
    var har = isiHaritasi(m), toplamKare = 0;
    h.push('<div class="rz-isiharita-sar"><div class="rz-isiharita" id="rzIsiHarita">');
    h.push('<div class="rz-gunetiket">' + GUNKISA.map(function (g) { return "<span>" + g + "</span>"; }).join("") + '</div>');
    har.forEach(function (hafta) {
      h.push('<div class="rz-hafta">');
      hafta.forEach(function (g2) {
        toplamKare++;
        var kadem = kademe(g2.kayit);
        var cls = "rz-kare rz-s" + kadem + (g2.bugun ? " rz-bugun" : "") + (g2.gelecek ? " rz-gelecek" : "");
        h.push('<div class="' + cls + '" data-rz-kare="' + kacis(g2.anahtar) + '" title="' + kacis(kareBaslik(g2.anahtar, g2.kayit)) + '"></div>');
      });
      h.push('</div>');
    });
    h.push('</div></div>');
    h.push('<div class="rz-lejant"><span>az</span><div class="rz-kare"></div><div class="rz-kare rz-s1"></div><div class="rz-kare rz-s2"></div><div class="rz-kare rz-s3"></div><div class="rz-kare rz-s4"></div><span>çok</span></div>');
    h.push('<p class="rz-ipucu" id="rzKareIpucu">Karelerin üzerine gel: o günün görev, soru ve deneme sayısı görünür. Bugünün karesi çerçevelidir.</p>');

    /* 4) günlük hedef */
    var hd = hedefAl(), il = hedefIlerleme();
    h.push('<h3 class="rz-altbaslik">🎯 Günlük Hedef</h3>');
    h.push('<div class="rz-hedef-kutu">');
    h.push('<div class="rz-halka" id="rzHalka" style="background:conic-gradient(var(--rozet) 0% ' + il.yuzde + '%, var(--cizgi) ' + il.yuzde + '% 100%)">' +
      '<div class="rz-halka-ic"><b>' + il.yuzde + '%</b><span>' + il.tamam + '/' + il.hedef + ' ' + il.birim + '</span></div></div>');
    h.push('<div class="rz-hedef-sag">');
    h.push('<b>Hedefin: ' + hd.deger + ' ' + (hd.tur === "gorev" ? "görev" : "dakika") + '</b>');
    h.push('<div class="rz-hedef-dugmeler" id="rzHedefDugmeler">' +
      HEDEFLER.map(function (x) {
        var sec = (x.tur === hd.tur && x.deger === hd.deger) ? " rz-secili" : "";
        return '<button type="button" class="rz-hedef-dugme' + sec + '" data-rz-hedef="' + x.tur + ':' + x.deger + '">' + x.ad + '</button>';
      }).join("") + '</div>');
    h.push('<div class="rz-cubuk"><i style="width:' + il.yuzde + '%"></i></div>');
    h.push('<div class="rz-ilerleme-yazi" id="rzHedefYazi">Bugün ' + il.ham + ' / ' + il.hedef + ' ' + il.birim + ' · %' + il.yuzde +
      (il.ham > il.hedef ? ' · hedefin üstünde 🎉' : '') + '</div>');
    if (il.tur === "dk") {
      h.push('<div class="rz-olcum-not">' + (il.olcum === "gerçek"
        ? 'Süre, KOÇ AI günlük planındaki gerçek görev sürelerinden toplanır.'
        : 'Plan henüz kurulmamış; görev başına 20 dakika tahminiyle hesaplanır.') + '</div>');
    }
    if (il.yuzde >= 100) h.push('<div class="rz-ilerleme-yazi" id="rzHedefTamam">✔ Hedef tamam! Bugünü bitirdin.</div>');
    h.push('</div></div>');

    /* 3) rozetler */
    h.push('<h3 class="rz-altbaslik">🏅 Rozetler</h3>');
    h.push('<div class="rz-ozet"><b id="rzRozetOzet">' + rl.length + ' rozetten ' + kazanilan + "'ini kazandın" + '</b>' +
      '<span class="rz-kazanildi-not">' + (rl.length - kazanilan) + ' rozet seni bekliyor.</span></div>');
    h.push('<div class="rz-rozetler">');
    rl.forEach(function (x) {
      var parca = String(x.ilerleme).split("/");
      var oran = tam(parca[1], 1) > 0 ? kirp(Math.round(tam(parca[0], 0) / tam(parca[1], 1) * 100), 0, 100) : 0;
      h.push('<div class="rz-rozet ' + (x.kazanildi ? "rz-kazanildi" : "rz-kazanilmadi") + '" data-rz-rozet="' + kacis(x.kod) + '">' +
        '<div class="rz-rozet-ust"><span class="rz-rozet-simg">' + x.simg + '</span>' +
        '<div><div class="rz-rozet-ad">' + kacis(x.ad) + '</div>' +
        (x.kazanildi ? '<div class="rz-rozet-tarih">' + (x.tarih ? uzunTarih(x.tarih) + " · kazanıldı" : "kazanıldı") + '</div>'
                     : '<div class="rz-rozet-tarih rz-yok">kazanılmadı</div>') +
        '</div></div>' +
        (x.kazanildi ? '' : '<div class="rz-rozet-nasil">' + kacis(x.nasil) + '</div>') +
        '<div class="rz-rozet-cubuk"><i style="width:' + (x.kazanildi ? 100 : oran) + '%"></i></div>' +
        '<div class="rz-rozet-sayi">' + kacis(x.ilerleme) + '</div>' +
        '</div>');
    });
    h.push('</div>');
    h.push('<p class="aciklama" style="margin-top:16px">🔥 Seri &amp; Rozet · tüm ölçümler cihazdaki gerçek çalışma kayıtlarından hesaplanır. ' +
      '© 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · TÜM HAKLARI SAKLIDIR (5846 FSEK).</p>');
    h.push('</div>');

    kap.innerHTML = h.join("");
    bagla(kap);
    elIpuclari(kap);
    var kt = kutlamaKontrol();
    return { seri: s, rozetler: rl, kazanilan: kazanilan, kare: toplamKare, hedef: hd, ilerleme: il, kutlama: kt, bos: bos };
  }

  function bagla(kap) {
    $$("[data-rz-hedef]", kap).forEach(function (b) {
      b.addEventListener("click", function () {
        var p = String(b.getAttribute("data-rz-hedef")).split(":");
        hedefKoy(p[0], tam(p[1], 0));
        ciz();
      });
    });
  }
  /* dokunmatik cihazda (APK) kare başlığı alt satırda gösterilir */
  function elIpuclari(kap) {
    var ip = document.getElementById("rzKareIpucu");
    if (!ip) return;
    function goster(el) {
      var t = el.getAttribute("title");
      if (t) { ip.textContent = t; $$("[data-rz-kare]", kap).forEach(function (x) { x.classList.remove("rz-secili"); }); el.classList.add("rz-secili"); }
    }
    $$("[data-rz-kare]", kap).forEach(function (el) {
      el.addEventListener("mouseenter", function () { goster(el); });
      el.addEventListener("click", function () { goster(el); });
    });
  }

  /* ───────────── dışa açılan API ───────────── */
  A.bolumAc = function (kod) { if (kod === "rozet") ciz(); };
  A.ciz = ciz;
  A.veriOku = veriOku;
  A.gunHaritasi = gunHaritasi;
  A.seriBilgi = function () { return seriBilgi(gunHaritasi(veriOku())); };
  A.isiHaritasi = function () { return isiHaritasi(gunHaritasi(veriOku())); };
  A.kademe = kademe;
  A.kareBaslik = kareBaslik;
  A.rozetler = function () { var v = veriOku(), s = seriBilgi(gunHaritasi(v)); s.harita = gunHaritasi(v); return rozetleriHazirla(v, s); };
  A.seriTarihi = seriTarihi;
  A.hedefAl = hedefAl;
  A.hedefKoy = hedefKoy;
  A.hedefIlerleme = hedefIlerleme;
  A.tamamlananDk = tamamlananDk;
  A.kutlamaKontrol = kutlamaKontrol;
  A.konfeti = konfeti;
  A.sonKutlama = function () { return sonKutlama; };
  A.HEDEFLER = HEDEFLER;

  /* ───────────── kendi kendini test (?test=1) ───────────── */
  if (location.search.indexOf("test=1") >= 0) {
    window.addEventListener("load", function () {
      setTimeout(function () { testCalistir(); }, 500);
    });
  }

  function testCalistir() {
    var t = [], ok = function (ad, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : "")); };
    var K = ["kocGunluk", "minitest", "ka.denemeler", "ist", "kartlar", "sesdene", "oyunEnIyi", "ka.hedef", "rozetHedef", "rozetKutlama"];
    var eski = {}, i;
    for (i = 0; i < K.length; i++) { eski[K[i]] = depoVar(K[i]) ? localStorage.getItem("ustad." + K[i]) : null; }
    function geri(k) {
      try {
        if (eski[k] === null) localStorage.removeItem("ustad." + k);
        else localStorage.setItem("ustad." + k, eski[k]);
      } catch (e) {}
    }
    var eskiSes = window.KPSS_SES, soylenen = [];
    try { window.KPSS_SES = { konus: function (m) { soylenen.push(String(m)); } }; } catch (e) {}

    var B = bugunAnahtar();
    var D1 = anahtar(gunEkle(new Date(), -1)), D10 = anahtar(gunEkle(new Date(), -10)),
        D11 = anahtar(gunEkle(new Date(), -11)), D12 = anahtar(gunEkle(new Date(), -12)),
        D13 = anahtar(gunEkle(new Date(), -13));
    var simdi = new Date().toISOString();

    /* ── sentetik ama gerçekçi kayıt: bugün + dün dolu, 2 gün önce BOŞ, 10-13 gün önce 4 günlük seri ── */
    var g = {};
    g[B] = [1, 2];
    g[D1] = [1, 2, 3];
    g[D10] = [1]; g[D11] = [1]; g[D12] = [1]; g[D13] = [1];
    depoKoy("kocGunluk", g);
    depoKoy("minitest", [
      { tarih: simdi, ders: "Türkçe", konu: "Paragraf", dogru: 7, toplam: 10, sureOrt: 40 },
      { tarih: new Date(Date.now() - 86400000).toISOString(), ders: "Matematik", konu: "Problemler", dogru: 6, toplam: 10, sureOrt: 45 },
      { tarih: new Date(Date.now() - 4 * 86400000).toISOString(), ders: "Tarih", konu: "Kurtuluş", dogru: 8, toplam: 10, sureOrt: 30 }
    ]);
    depoKoy("ka.denemeler", [{ id: "t1", tarih: simdi, tDogru: 90, yuzde: 72, gosterge: 70 }]);
    depoKoy("ka.hedef", 85);
    depoKoy("ist", { cozulen: 1200, dogru: 760, yanlis: 330, bos: 110 });
    var kart = {};
    for (i = 0; i < 21; i++) kart["k" + i] = { id: "k" + i, kutu: 5, kez: 4 };
    kart["k21"] = { id: "k21", kutu: 1, kez: 1 };
    depoKoy("kartlar", kart);
    depoKoy("sesdene", { toplam: 150, dogru: 120 });
    depoKoy("oyunEnIyi", { kelime: 120, esle: { puan: 90, tarih: Date.now(), tur: "puan" }, hizli: 40, bos: 0 });
    depoSil("rozetKutlama");
    depoKoy("rozetHedef", { tur: "gorev", deger: 3, an: simdi });

    /* ── 1-5: seri hesapları ── */
    var v = veriOku(), m = gunHaritasi(v), s = seriBilgi(m);
    ok("veri: kocGunluk 6 gün okundu", Object.keys(v.gunluk).length === 6, Object.keys(v.gunluk).length + " gün");
    ok("seri: güncel seri = 2 (bugün + dün dolu, 2 gün önce boş)", s.guncel === 2, "güncel=" + s.guncel);
    ok("seri: en uzun seri = 4 (10-13 gün önceki kesintisiz blok)", s.enUzun === 4, "enUzun=" + s.enUzun + " (" + s.enUzunBas + "→" + s.enUzunBit + ")");
    ok("seri: bu hafta (son 7 gün) = 3 (bugün, dün + 4 gün önceki mini test)", s.hafta === 3, "hafta=" + s.hafta);
    ok("seri: toplam çalışılan gün = 7 (6 görev günü + 4 gün önceki mini test)", s.toplamGun === 7, "toplam=" + s.toplamGun);
    ok("seri: bugün tespiti (görev=2, soru=10)", s.bugunVar === true && s.bugunGorev === 2 && s.bugunSoru === 10,
       s.bugunGorev + " görev / " + s.bugunSoru + " soru");
    ok("seri: 3 günlük seri tarihi = bloğun 3. günü (11 gün önce)", seriTarihi(m, 3) === D11,
       "tarih=" + seriTarihi(m, 3) + " · beklenen " + D11);

    /* ── 6-9: ısı haritası ── */
    var ih = isiHaritasi(m), kare = 0;
    ih.forEach(function (w) { kare += w.length; });
    ok("ısı haritası: 12 hafta × 7 gün = 84 kare", kare === 84 && ih.length === 12, kare + " kare / " + ih.length + " hafta");

    ciz();
    var kap = document.getElementById("rozetAlan");
    ok("ısı haritası: ekranda 84 kare çizildi", $$(".rz-kare[data-rz-kare]", kap).length === 84, $$(".rz-kare[data-rz-kare]", kap).length + " kare");
    var bugunKare = kap.querySelector('.rz-kare[data-rz-kare="' + B + '"]');
    ok("ısı haritası: bugünün karesi çerçeveli", !!bugunKare && bugunKare.classList.contains("rz-bugun"),
       bugunKare ? bugunKare.className : "kare yok");
    var dunKare = kap.querySelector('.rz-kare[data-rz-kare="' + D1 + '"]');
    ok("ısı haritası: dünün karesi 2+ kademe (3 görev + 1 mini test)", !!dunKare && /rz-s[234]/.test(dunKare.className),
       dunKare ? dunKare.className : "kare yok");
    ok("ısı haritası: bugünün başlığı görev/soru içeriyor", !!bugunKare && /görev/.test(bugunKare.getAttribute("title")) && /soru/.test(bugunKare.getAttribute("title")),
       bugunKare ? bugunKare.getAttribute("title") : "");
    var bosGun = anahtar(gunEkle(new Date(), -2));
    var bosKare = kap.querySelector('.rz-kare[data-rz-kare="' + bosGun + '"]');
    ok("ısı haritası: boş gün 0. kademe", !!bosKare && bosKare.classList.contains("rz-s0"), bosKare ? bosKare.className : "kare yok");

    /* ── 10-15: rozetler ── */
    var rl = A.rozetler(), kazan = rl.filter(function (x) { return x.kazanildi; }).length;
    ok("rozet: toplam 13 rozet", rl.length === 13, rl.length + " rozet");
    ok("rozet: kazanılan 9 (ilk adım, 3 gün, ilk/10 mini test, ilk deneme, hedefi geçtin, 1000 soru, ezberci, dinleyici, oyun ustası→9)",
       kazan === 9, kazan + " kazanıldı");
    var kod = {}; rl.forEach(function (x) { kod[x.kod] = x; });
    ok("rozet: 'İlk Adım' kazanıldı ve tarihi ilk kayıt günü", kod["ilk-adim"] && kod["ilk-adim"].kazanildi && kod["ilk-adim"].tarih === D13,
       kod["ilk-adim"] ? kod["ilk-adim"].tarih : "yok");
    ok("rozet: '3 Gün Seri' kazanıldı, '7 Gün Seri' kazanılmadı", !!kod["seri-3"].kazanildi && kod["seri-7"].kazanildi === false,
       "3gün=" + kod["seri-3"].kazanildi + " / 7gün=" + kod["seri-7"].kazanildi);
    ok("rozet: 'Hedefi Geçtin' kazanıldı (90 net ≥ 85 hedef)", !!kod["hedef-gec"].kazanildi, kod["hedef-gec"].ilerleme);
    ok("rozet: '10 Mini Test' kazanılmadı, ilerleme 3/10", kod["minitest-10"].kazanildi === false && kod["minitest-10"].ilerleme === "3/10",
       kod["minitest-10"].ilerleme);
    ok("rozet: '7 Gün Seri' ilerleme metni 4/7", kod["seri-7"].ilerleme === "4/7", kod["seri-7"].ilerleme);
    ok("rozet: 'Ezberci' 5. kutuda 21 kart ile kazanıldı", !!kod["ezberci"].kazanildi && kod["ezberci"].ilerleme === "20/20 kart", kod["ezberci"].ilerleme);
    ok("rozet: 'Oyun Ustası' 3 oyunda puan>0 ile kazanıldı", !!kod["oyun-ustasi"].kazanildi && kod["oyun-ustasi"].ilerleme === "3/3 oyun", kod["oyun-ustasi"].ilerleme);
    ok("rozet: 'Dinleyici' 150 sesli soru ile kazanıldı", !!kod["dinleyici"].kazanildi, kod["dinleyici"].ilerleme);
    var kazanilmamisKart = kap.querySelector(".rz-rozet.rz-kazanilmadi");
    ok("arayüz: kazanılmamış rozette 'nasıl kazanılır' + soluk stil var",
       !!kazanilmamisKart && !!kazanilmamisKart.querySelector(".rz-rozet-nasil") && kazanilmamisKart.querySelector(".rz-rozet-nasil").textContent.length > 10,
       kazanilmamisKart ? kazanilmamisKart.querySelector(".rz-rozet-nasil").textContent.slice(0, 42) : "yok");
    var ozet = document.getElementById("rzRozetOzet");
    ok("arayüz: özet metni '13 rozetten 9'unu kazandın'", !!ozet && /13 rozetten 9/.test(ozet.textContent), ozet ? ozet.textContent : "yok");
    var kazanilmisKart = kap.querySelector(".rz-rozet.rz-kazanildi .rz-rozet-tarih");
    ok("arayüz: kazanılmış rozette tarih yazıyor", !!kazanilmisKart && /\d{4}/.test(kazanilmisKart.textContent), kazanilmisKart ? kazanilmisKart.textContent : "yok");

    /* ── 16-18: günlük hedef ── */
    depoKoy("rozetHedef", { tur: "gorev", deger: 3, an: simdi });
    var il = hedefIlerleme();
    ok("hedef: kayıt localStorage'a yazıldı", (depoAl("rozetHedef", {})).deger === 3 && depoAl("rozetHedef", {}).tur === "gorev",
       JSON.stringify(depoAl("rozetHedef", {})));
    ok("hedef: görev modu ilerleme %67 (2/3)", il.yuzde === 67 && il.ham === 2 && il.hedef === 3, "%" + il.yuzde + " · " + il.ham + "/" + il.hedef);
    A.hedefKoy("dk", 40);
    var il2 = hedefIlerleme();
    ok("hedef: dakika modu ilerleme 0-100 arası ve birim dakika", il2.birim === "dakika" && il2.yuzde >= 0 && il2.yuzde <= 100 && il2.ham > 0,
       "%" + il2.yuzde + " · " + il2.ham + "/" + il2.hedef + " " + il2.birim + " (" + il2.olcum + ")");
    ok("hedef: düğme seçimi kaydı değiştirdi (dk:40)", depoAl("rozetHedef", {}).tur === "dk" && depoAl("rozetHedef", {}).deger === 40,
       JSON.stringify(depoAl("rozetHedef", {})));

    /* ── 19-21: hedef tamamlandı → kutlama BİR KEZ ── */
    A.hedefKoy("gorev", 2);
    depoSil("rozetKutlama");
    ciz();
    var kk = depoAl("rozetKutlama", null);
    ok("kutlama: hedef tamamlanınca ustad.rozetKutlama yazıldı", !!kk && kk.tarih === B, kk ? JSON.stringify({ tarih: kk.tarih, tamam: kk.tamam }) : "yok");
    ok("kutlama: sesli tebrik metni oluştu ve okundu", soylenen.length === 1 && /Bugünü tamamladın/.test(soylenen[0]),
       soylenen.length + " okuma · " + (soylenen[0] || "").slice(0, 48));
    ok("kutlama: konfeti animasyonu DOM'a eklendi", $$(".rz-konfeti").length >= 20, $$(".rz-konfeti").length + " parça");
    ciz();
    var kk2 = depoAl("rozetKutlama", null);
    ok("kutlama: ikinci çizimde TEKRAR kutlamadı (günde bir)", soylenen.length === 1 && kk2.tarih === B && kk2.an === kk.an,
       soylenen.length + " okuma (2. çizim sonrası)");

    /* ── 22-23: uyarı, çalışılan günde uyarı yok, boş durum ── */
    ok("uyarı: bugün dolu iken 'serini kaybetme' uyarısı YOK", document.getElementById("rzSeriUyari") === null &&
       document.getElementById("rzBugunTamam") !== null, "bugün tamam kutusu görünür");
    var g2 = {}; Object.keys(g).forEach(function (k) { if (k !== B) g2[k] = g[k]; });
    depoKoy("kocGunluk", g2);
    depoKoy("minitest", v.minitest.filter(function (x) { return tarihtenAnahtar(x.tarih) !== B; }));
    depoKoy("ka.denemeler", []);
    ciz();
    var uy = document.getElementById("rzSeriUyari");
    ok("uyarı: bugün hiç çalışılmamışken uyarı göründü", !!uy && /Serini kaybetmemek/.test(uy.textContent),
       uy ? uy.textContent.replace(/\s+/g, " ").slice(0, 48) : "yok");
    depoKoy("kocGunluk", {}); depoKoy("minitest", []); depoKoy("ka.denemeler", []);
    depoKoy("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 }); depoKoy("kartlar", {});
    depoKoy("oyunEnIyi", {}); depoKoy("sesdene", {});
    var kt2 = ciz();
    var bd = document.getElementById("rzBosDurum");
    ok("boş veri: dürüst boş durum mesajı", !!bd && /Henüz kayıt yok/.test(bd.textContent) && kt2.seri.toplamGun === 0,
       bd ? bd.textContent.slice(0, 46) : "yok");
    ok("boş veri: 84 kare ve 13 rozet yine çizildi", $$(".rz-kare[data-rz-kare]").length === 84 && $$(".rz-rozet").length === 13,
       $$(".rz-kare[data-rz-kare]").length + " kare / " + $$(".rz-rozet").length + " rozet");

    /* ── depoyu eski hâline döndür ── */
    for (i = 0; i < K.length; i++) geri(K[i]);
    try { window.KPSS_SES = eskiSes; } catch (e) {}
    $$(".rz-kutlama-perde, .rz-kutlama-toast").forEach(function (x) { try { x.parentNode.removeChild(x); } catch (e) {} });
    ciz();

    var gecen = t.filter(function (x) { return x.indexOf("✔") === 0; }).length;
    var kap2 = document.createElement("div");
    kap2.id = "rozetTestSonuc";
    kap2.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
    kap2.innerHTML = "<h3>Seri &amp; Rozet testi (çevrimdışı · gerçek veri)</h3>" +
      t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
      "<hr><b>" + gecen + " / " + t.length + " geçti</b>";
    document.body.appendChild(kap2);
    document.title = (document.title || "") + " ROZETTEST " + gecen + "/" + t.length;
  }
})();
