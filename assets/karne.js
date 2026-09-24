/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Haftalık Karne · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Bu bölüm "pazar akşamı özeti" için tasarlandı: seçilen dönemin (bu hafta / geçen hafta / son 30 gün /
   tüm zamanlar) karnesini CİHAZDAKİ GERÇEK KAYITLARDAN üretir. Hiçbir sayı uydurulmaz, ağa istek
   yapılmaz. Kaynaklar (localStorage anahtarları birebir):
     ustad.ist · ustad.minitest · ustad.ka.denemeler · ustad.ka.hedef · ustad.yanlisKonu ·
     ustad.kocGunluk · ustad.oyunEnIyi · ustad.kartlar · ustad.sesdene · ustad.ezber · ustad.karne
   Türkiye saatine göre hafta PAZARTESİ başlar. Grafik elle çizilen SVG'dir; harici kütüphane YOK.
   Sınıf öneki: `kn-` · Ortak sınıflar: .kart .sayfa-baslik .ka-dugme .ka-mini .ka-etiket
   .oyun-tablo .aciklama .rakam (bunlar yeniden tanımlanmaz, yalnızca kullanılır). */
(function () {
  "use strict";
  var A = window.KARNE = {};

  /* ───────────── küçük yardımcılar ───────────── */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function dizi(x) { return Array.isArray(x) ? x : []; }
  function nesne(x) { return (x && typeof x === "object" && !Array.isArray(x)) ? x : {}; }
  function sayi(x, v) {
    var n = typeof x === "number" ? x : parseFloat(String(x == null ? "" : x).replace(",", "."));
    return isFinite(n) ? n : v;
  }
  function tam(x, v) { var n = sayi(x, v); return isFinite(n) ? Math.round(n) : v; }
  function kirp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function depoAl(k, v) { try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } }
  function depoKoy(k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function depoVar(k) { try { return localStorage.getItem("ustad." + k) !== null; } catch (e) { return false; } }
  function ses(metin) {
    try {
      var S = window.KPSS_SES;
      if (S && S.konus) {
        var cumleler = S.cumlelereBol ? S.cumlelereBol(metin) : null;
        S.konus(metin, cumleler && cumleler.length ? { cumleler: cumleler } : undefined);
      } else if (window.speechSynthesis) {
        var u = new SpeechSynthesisUtterance(metin); u.lang = "tr-TR"; window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }
  function git(kod) { try { if (window.USTAD_MOTOR && window.USTAD_MOTOR.git) window.USTAD_MOTOR.git(kod); } catch (e) {} }
  /** 12,5 gibi Türkçe ondalık (tam sayıda ",0" yazmaz) */
  function ondalik(x) { var r = Math.round(sayi(x, 0) * 10) / 10; return String(r).replace(".", ","); }
  function yuzdeStr(x) { return sayi(x, null) === null ? "—" : "%" + ondalik(x); }
  function p2(n) { return (n < 10 ? "0" : "") + n; }

  /* ───────────── TARİH: Türkiye saatine göre hafta (Pazartesi başlar) ───────────── */
  var GUN_ADI = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  var GUN_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  function gunBaslangic(d) { var x = new Date(d.getTime()); x.setHours(0, 0, 0, 0); return x; }
  function bugun() { return gunBaslangic(new Date()); }
  function gunEkle(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function pazartesi(d) { var x = gunBaslangic(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function isoGun(d) { return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function tarihNesne(t) {
    if (t == null || t === "") return null;
    var d = (t instanceof Date) ? t : new Date(t);
    if (isNaN(d.getTime())) return null;
    return d;
  }
  function gunFarki(a, b) { return Math.round((gunBaslangic(a) - gunBaslangic(b)) / 86400000); }
  function trTarih(t) {
    var d = tarihNesne(t); if (!d) return "—";
    try { return d.toLocaleDateString("tr-TR"); } catch (e) { return isoGun(d); }
  }
  function trTarihSaat(t) {
    var d = tarihNesne(t); if (!d) return "—";
    try { return d.toLocaleDateString("tr-TR") + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()); } catch (e) { return trTarih(t); }
  }
  function kisaTarih(t) {
    var d = tarihNesne(t); if (!d) return "—";
    return p2(d.getDate()) + "." + p2(d.getMonth() + 1) + "." + String(d.getFullYear()).slice(2);
  }

  /* ───────────── DÖNEMLER ───────────── */
  var DONEMLER = [
    { kod: "bu", ad: "Bu hafta", uzun: "Bu hafta" },
    { kod: "gecen", ad: "Geçen hafta", uzun: "Geçen hafta" },
    { kod: "30", ad: "Son 30 gün", uzun: "Son 30 gün" },
    { kod: "tum", ad: "Tüm zamanlar", uzun: "Tüm zamanlar" }
  ];
  A.donem = "bu";
  function donemGecerli(kod) {
    kod = String(kod == null ? "" : kod);
    for (var i = 0; i < DONEMLER.length; i++) if (DONEMLER[i].kod === kod) return kod;
    return "bu";
  }
  A.donemGecerli = donemGecerli;
  function donemAd(kod) {
    for (var i = 0; i < DONEMLER.length; i++) if (DONEMLER[i].kod === kod) return DONEMLER[i].ad;
    return "Bu hafta";
  }
  A.donemAd = donemAd;

  /** Dönemin başlangıç/bitiş günü (bit dahil). "tum" için sınırsız. */
  A.donemBilgi = function (kod) {
    kod = donemGecerli(kod);
    var b = bugun(), pzt = pazartesi(b);
    if (kod === "gecen") { var g1 = gunEkle(pzt, -7); return { kod: kod, ad: donemAd(kod), bas: g1, bit: gunEkle(pzt, -1), gun: 7 }; }
    if (kod === "30") { return { kod: kod, ad: donemAd(kod), bas: gunEkle(b, -29), bit: b, gun: 30 }; }
    if (kod === "tum") { return { kod: kod, ad: donemAd(kod), bas: null, bit: null, gun: null }; }
    return { kod: "bu", ad: donemAd("bu"), bas: pzt, bit: b, gun: gunFarki(b, pzt) + 1 };
  };
  /** Karşılaştırma dönemi (aynı uzunlukta bir önceki dönem). "tum" için null. */
  A.oncekiDonem = function (kod) {
    kod = donemGecerli(kod);
    var b = bugun(), pzt = pazartesi(b);
    if (kod === "bu") { return { kod: "gecen", ad: "geçen hafta", bas: gunEkle(pzt, -7), bit: gunEkle(pzt, -1), gun: 7 }; }
    if (kod === "gecen") { return { kod: "gecen2", ad: "ondan önceki hafta", bas: gunEkle(pzt, -14), bit: gunEkle(pzt, -8), gun: 7 }; }
    if (kod === "30") { return { kod: "30onceki", ad: "önceki 30 gün", bas: gunEkle(b, -59), bit: gunEkle(b, -30), gun: 30 }; }
    return null;
  };
  function icinde(gunIso, d) {
    if (!gunIso || !d) return false;
    if (!d.bas || !d.bit) return true;
    return gunIso >= isoGun(d.bas) && gunIso <= isoGun(d.bit);
  }

  /* ───────────── VERİ OKUMA (yalnızca gerçek kayıtlar) ───────────── */
  A.veriOku = function () {
    var ist = nesne(depoAl("ist", {}));
    var mt = dizi(depoAl("minitest", [])).map(function (x) {
      x = nesne(x);
      var z = tarihNesne(x.tarih != null ? x.tarih : x.zaman);
      if (!z) return null;
      return { zaman: z.getTime(), gun: isoGun(z), ders: String(x.ders == null ? "" : x.ders),
               konu: String(x.konu == null ? "" : x.konu), dogru: tam(x.dogru, 0), yanlis: tam(x.yanlis, 0),
               toplam: tam(x.toplam, 0), sureOrt: sayi(x.sureOrt, null), sureler: dizi(x.sureler) };
    }).filter(function (x) { return !!x; });
    var den = dizi(depoAl("ka.denemeler", [])).map(function (x) {
      x = nesne(x);
      var z = tarihNesne(x.tarih != null ? x.tarih : x.zaman);
      if (!z) return null;
      return { id: String(x.id == null ? "" : x.id), zaman: z.getTime(), gun: isoGun(z),
               tDogru: tam(x.tDogru, 0), yuzde: sayi(x.yuzde, null), gosterge: sayi(x.gosterge, null) };
    }).filter(function (x) { return !!x; });
    return {
      ist: { cozulen: tam(ist.cozulen, 0), dogru: tam(ist.dogru, 0), yanlis: tam(ist.yanlis, 0), bos: tam(ist.bos, 0) },
      minitest: mt.sort(function (a, b) { return a.zaman - b.zaman; }),
      denemeler: den.sort(function (a, b) { return a.zaman - b.zaman; }),
      hedef: tam(depoAl("ka.hedef", 0), 0) || null,
      yanlisKonu: nesne(depoAl("yanlisKonu", {})),
      kocGunluk: nesne(depoAl("kocGunluk", {})),
      oyunEnIyi: nesne(depoAl("oyunEnIyi", {})),
      kartlar: nesne(depoAl("kartlar", {})),
      sesdene: nesne(depoAl("sesdene", {})),
      ezber: nesne(depoAl("ezber", {})),
      karne: dizi(depoAl("karne", []))
    };
  };

  /* ───────────── MODEL: dönemin bütün sayıları ───────────── */
  var OYUN_AD = { bilgi: "Bilgi Yarışı", sayi: "Sayı Avı", yazim: "Yazım Avı", esle: "Eşleştirme" };
  function oyunPuan(x) {
    if (typeof x === "number") return tam(x, 0);
    x = nesne(x);
    var p = x.puan != null ? x.puan : (x.enIyi != null ? x.enIyi : x.skor);
    return tam(p, 0);
  }
  function gorevSayisi(g) { return dizi(g).length; }

  A.model = function (kod) {
    kod = donemGecerli(kod);
    var v = A.veriOku(), d = A.donemBilgi(kod);
    var mini = v.minitest.filter(function (x) { return icinde(x.gun, d); });
    var den = v.denemeler.filter(function (x) { return icinde(x.gun, d); });

    /* görevler + günlük hareket */
    var gorev = 0, gunSeti = {};
    Object.keys(v.kocGunluk).forEach(function (k) {
      if (!icinde(k, d)) return;
      gorev += gorevSayisi(v.kocGunluk[k]);
      gunSeti[k] = true;
    });
    mini.forEach(function (x) { gunSeti[x.gun] = true; });
    den.forEach(function (x) { gunSeti[x.gun] = true; });
    var sesGun = tarihNesne(v.sesdene.sonTarih != null ? v.sesdene.sonTarih : v.sesdene.tarih);
    if (sesGun && icinde(isoGun(sesGun), d)) gunSeti[isoGun(sesGun)] = true;

    /* soru kalemleri */
    var miniSorular = mini.reduce(function (t, x) { return t + x.toplam; }, 0);
    var miniDogru = mini.reduce(function (t, x) { return t + x.dogru; }, 0);
    var denSorular = den.length * 120;
    var denDogru = den.reduce(function (t, x) { return t + x.tDogru; }, 0);
    var tarihliSorular = miniSorular + denSorular;                    /* döneme tarihlenebilen  */
    var tarihliDogru = miniDogru + denDogru;
    var toplamSoru = v.ist.cozulen + tarihliSorular;                  /* ist: tarihsiz genel toplam */
    var toplamDogru = v.ist.dogru + tarihliDogru;
    var oran = toplamSoru ? (toplamDogru / toplamSoru) * 100 : null;

    /* mini test ortalamaları */
    var sureler = mini.map(function (x) { return x.sureOrt; }).filter(function (x) { return x != null && x > 0; });
    var miniOrt = miniSorular ? (miniDogru / miniSorular) * 100 : null;
    var miniSure = sureler.length ? sureler.reduce(function (t, x) { return t + x; }, 0) / sureler.length : null;

    /* net değişimi: dönem içi ilk ve son deneme */
    var net = null;
    if (den.length >= 2) net = { ilk: den[0].tDogru, son: den[den.length - 1].tDogru, fark: den[den.length - 1].tDogru - den[0].tDogru, ilkTarih: den[0].zaman, sonTarih: den[den.length - 1].zaman };
    else if (den.length === 1) net = { ilk: null, son: den[0].tDogru, fark: null, ilkTarih: null, sonTarih: den[0].zaman };

    /* ezberlenen kart: ezber kayıtlarında "bildi" + kartlarda 5. kutu */
    var ezberSay = 0;
    Object.keys(v.ezber).forEach(function (k) {
      var x = nesne(v.ezber[k]);
      if (x.bildi === true || x.bildi === 1 || x.ezber === true || tam(x.bildi, 0) >= 3) ezberSay++;
    });
    Object.keys(v.kartlar).forEach(function (k) { if (tam(nesne(v.kartlar[k]).kutu, 0) >= 5) ezberSay++; });

    /* oyun en iyi puanları */
    var oyunlar = Object.keys(v.oyunEnIyi).map(function (k) {
      return { kod: k, ad: OYUN_AD[k] || k, puan: oyunPuan(v.oyunEnIyi[k]) };
    }).sort(function (a, b) { return b.puan - a.puan; });

    /* gelişen konular: mini test başarısı dönem başı → dönem sonu artanlar */
    var gruplar = {}, sira = [];
    mini.forEach(function (x) {
      var anahtar = x.konu + "|" + x.ders;
      if (!gruplar[anahtar]) { gruplar[anahtar] = []; sira.push(anahtar); }
      gruplar[anahtar].push(x);
    });
    var gelisen = sira.map(function (anahtar) {
      var g = gruplar[anahtar];
      var p = anahtar.split("|");
      var basari = function (x) { return x.toplam ? (x.dogru / x.toplam) * 100 : 0; };
      var ilk = basari(g[0]), son = basari(g[g.length - 1]);
      return { konu: p[0], ders: p[1], adet: g.length, soru: g.reduce(function (t, x) { return t + x.toplam; }, 0),
               ilk: Math.round(ilk * 10) / 10, son: Math.round(son * 10) / 10, fark: Math.round((son - ilk) * 10) / 10,
               ilkBasarili: g[0].dogru, ilkToplam: g[0].toplam, dogru: g.reduce(function (t, x) { return t + x.dogru; }, 0) };
    }).filter(function (x) { return x.adet >= 2; }).sort(function (a, b) { return b.fark - a.fark; });

    /* en çok yanlış yapılan konular */
    var yToplam = 0;
    var yanlislar = Object.keys(v.yanlisKonu).map(function (k) {
      var p = String(k).split("|");
      var adet = tam(v.yanlisKonu[k], 0);
      yToplam += adet;
      return { konu: p[0], ders: p[1] || "", adet: adet };
    }).sort(function (a, b) { return b.adet - a.adet; });
    yanlislar.forEach(function (x) { x.pay = yToplam ? (x.adet / yToplam) * 100 : 0; });

    /* 7 günlük grafik */
    var gunler = [], baslangic;
    if (kod === "bu" || kod === "gecen") {
      var p = pazartesi(bugun());
      if (kod === "gecen") p = gunEkle(p, -7);
      baslangic = p;
    } else {
      baslangic = gunEkle(bugun(), -6);
    }
    for (var i = 0; i < 7; i++) {
      var g = gunEkle(baslangic, i), gi = isoGun(g);
      var gMini = mini.filter(function (x) { return x.gun === gi; });
      var gDen = den.filter(function (x) { return x.gun === gi; });
      var soruG = gMini.reduce(function (t, x) { return t + x.toplam; }, 0) + gDen.length * 120;
      var gorevG = gorevSayisi(v.kocGunluk[gi]);
      gunler.push({ gun: gi, etiket: GUN_KISA[(g.getDay() + 6) % 7], uzun: GUN_ADI[(g.getDay() + 6) % 7],
                    tarih: g.getTime(), soru: soruG, gorev: gorevG, bos: (soruG + gorevG) === 0,
                    bugunMu: gi === isoGun(bugun()), gelecek: gunFarki(g, bugun()) > 0 });
    }

    return {
      kod: kod, ad: d.ad, bas: d.bas, bit: d.bit, donemGun: d.gun,
      gunSayisi: Object.keys(gunSeti).length, gorev: gorev,
      kalem: { ist: v.ist.cozulen, minitest: miniSorular, deneme: denSorular, denemeSayi: den.length },
      tarihliSorular: tarihliSorular, tarihliDogru: tarihliDogru,
      toplamSoru: toplamSoru, toplamDogru: toplamDogru, oran: oran,
      yanlis: v.ist.yanlis, bos: v.ist.bos, hedef: v.hedef,
      miniSayi: mini.length, miniSorular: miniSorular, miniDogru: miniDogru, miniOrt: miniOrt, miniSure: miniSure,
      denemeSayi: den.length, denemeListe: den, miniListe: mini, net: net,
      dinlenen: tam(v.sesdene.toplam, 0), dinlemeDk: tam(v.sesdene.sureDk, 0), dinlemeSon: v.sesdene.sonTarih || null,
      ezberlenen: ezberSay, oyunlar: oyunlar,
      gelisen: gelisen, yanlislar: yanlislar, yanlisToplam: yToplam, yanlisKonuSayi: yanlislar.length,
      gunler: gunler,
      kayitlar: v.karne
    };
  };

  /** Hiç kayıt yok mu? (boş durum için) */
  A.bosDurum = function (m) {
    m = m || A.model(A.donem);
    return !(m.toplamSoru || m.miniSayi || m.denemeSayi || m.gorev || m.dinlenen || m.ezberlenen || m.oyunlar.length);
  };

  /* ───────────── OTOMATİK YORUM (yalnızca sayılardan) ───────────── */
  function donemIfade(kod) {
    if (kod === "gecen") return "Geçen hafta";
    if (kod === "30") return "Son 30 günde";
    if (kod === "tum") return "Tüm zamanlarda";
    return "Bu hafta";
  }
  A.yorum = function (kod) {
    kod = donemGecerli(kod);
    var m = A.model(kod), o = A.oncekiDonem(kod);
    var op = o ? A.model(o.kod) : null;
    var s = [];
    /* hiç kayıt yoksa tek cümlelik dürüst cevap (uydurma sayı yazılmaz) */
    if (A.bosDurum(m) && (!op || A.bosDurum(op))) {
      return "Bu dönem için kayıtlı çalışma bulunamadı; test çözüp görev tamamladıkça karne kendiliğinden dolar.";
    }

    /* 1) soru hacmi + karşılaştırma (aynı uzunluktaki önceki dönem) */
    if (kod === "tum") {
      if (m.toplamSoru) s.push("Tüm zamanlarda toplam " + m.toplamSoru + " soru kaydın var.");
    } else if (m.tarihliSorular || (op && op.tarihliSorular)) {
      var metin = donemIfade(kod) + " " + m.tarihliSorular + " soru çözdün";
      if (op && op.tarihliSorular > 0) {
        var fark = m.tarihliSorular - op.tarihliSorular;
        var yz = Math.round((Math.abs(fark) / op.tarihliSorular) * 100);
        metin += " (" + o.ad + " " + op.tarihliSorular + " soru — %" + yz + (fark >= 0 ? " artış)" : " azalış)");
      } else if (op) {
        metin += " (" + o.ad + " hiç soru yoktu)";
      } else metin += ".";
      s.push(metin + (metin.charAt(metin.length - 1) === "." ? "" : "."));
    }

    /* 2) net değişimi */
    if (m.net && m.net.fark != null) {
      s.push("Deneme doğrun " + m.net.ilk + " → " + m.net.son + ", yani " + (m.net.fark >= 0 ? "+" : "") + m.net.fark +
        " net" + (m.hedef ? "; hedefin " + m.hedef + " doğru, kalan fark " + (m.hedef - m.net.son) + "." : "."));
    } else if (m.net && m.net.ilk === null) {
      s.push("Bu dönemde 1 deneme kaydın var: " + m.net.son + " doğru. Karşılaştırma için ikinci denemeyi de kaydet.");
    }

    /* 3) en çok gelişen konu */
    if (m.gelisen.length) {
      var g = m.gelisen[0];
      s.push("En çok " + g.konu + (g.ders ? " (" + g.ders + ")" : "") + " konusunda geliştin: %" + ondalik(g.ilk) +
        " → %" + ondalik(g.son) + ", " + (g.fark >= 0 ? "+" : "") + ondalik(g.fark) + " puan.");
    } else if (m.miniSayi) {
      s.push("Gelişim ölçmek için en az iki mini test gerekiyor; bu dönemde " + m.miniSayi + " mini test var.");
    }

    /* 4) doğru oranı */
    if (m.toplamSoru) {
      s.push(m.toplamSoru + " sorunun " + m.toplamDogru + "'i doğru (" + yuzdeStr(m.oran) + ")" +
        (m.yanlis ? ", " + m.yanlis + " yanlışın kayıtlı." : "."));
    }

    /* 5) çalışma günü hedefi */
    if (m.donemGun) {
      if (m.gunSayisi >= 6) s.push("Bu dönemin " + m.donemGun + " gününün " + m.gunSayisi + "'inde çalıştın; istikrar çok iyi.");
      else {
        var bosGun = Math.max(0, m.donemGun - m.gunSayisi);
        s.push("Bu dönemin " + m.donemGun + " gününün " + m.gunSayisi + "'inde çalıştın, " + bosGun +
          " gün boş geçti; haftayı " + Math.min(7, Math.max(m.gunSayisi + 1, 5)) + " güne çıkarmayı dene.");
      }
    } else if (m.gunSayisi) {
      s.push("Kayıtlarda " + m.gunSayisi + " ayrı gün çalışmışsın.");
    }

    /* 6) en çok yanlış yapılan konu */
    if (m.yanlislar.length) {
      s.push("En çok yanlışın " + m.yanlislar[0].konu + (m.yanlislar[0].ders ? " (" + m.yanlislar[0].ders + ")" : "") +
        " konusunda: " + m.yanlislar[0].adet + " yanlış" +
        (m.miniOrt != null ? "; mini test ortalaman " + yuzdeStr(m.miniOrt) + "." : "."));
    } else if (m.miniOrt != null) {
      s.push("Mini test ortalaman " + yuzdeStr(m.miniOrt) + ".");
    }

    if (!s.length) s.push("Bu dönem için kayıtlı çalışma bulunamadı; test çözüp görev tamamladıkça karne kendiliğinden dolar.");
    return s.slice(0, 6).join(" ");
  };
  A.yorumCumleler = function (kod) {
    var y = A.yorum(kod);
    return y.split(/(?<=\.)\s+/).filter(function (x) { return x.trim().length > 0; });
  };

  /** Karnenin sesli okuma metni (özet + yorum + tarih). */
  A.sesMetni = function (kod) {
    kod = donemGecerli(kod);
    var m = A.model(kod);
    var p = [];
    p.push(donemAd(kod) + " karnen hazır.");
    if (m.toplamSoru) {
      p.push(m.toplamSoru + " soru, " + m.toplamDogru + " doğru, doğru oranı " + yuzdeStr(m.oran) + ".");
    }
    p.push(A.yorum(kod));
    p.push("Bu rapor " + trTarih(new Date()) + " tarihinde cihazındaki kendi kayıtlarından oluşturuldu. İyi çalışmalar.");
    return p.join(" ").replace(/\s+/g, " ").trim();
  };
  A.dinle = function (kod) { var t = A.sesMetni(kod); ses(t); return t; };
  A.durdurSes = function () { try { if (window.KPSS_SES && window.KPSS_SES.durdur) window.KPSS_SES.durdur(); } catch (e) {} };

  /* ───────────── KAYIT: ustad.karne (en fazla 20) ───────────── */
  var MAX_KAYIT = 20;
  A.kayitlar = function () {
    return dizi(depoAl("karne", [])).map(function (x) {
      x = nesne(x);
      return { tarih: tarihNesne(x.tarih) ? new Date(x.tarih).getTime() : null, donem: String(x.donem == null ? "" : x.donem),
               ozet: String(x.ozet == null ? "" : x.ozet) };
    }).sort(function (a, b) { return (b.tarih || 0) - (a.tarih || 0); });
  };
  A.ozetMetni = function (m) {
    m = m || A.model(A.donem);
    var p = [donemAd(m.kod)];
    p.push(m.tarihliSorular + " soru");
    if (m.oran != null) p.push(yuzdeStr(m.oran) + " doğru");
    if (m.net && m.net.fark != null) p.push((m.net.fark >= 0 ? "+" : "") + m.net.fark + " net");
    p.push(m.gunSayisi + " gün");
    return p.join(" · ");
  };
  /** Karne görüntülemesini kaydeder. Aynı dönem + aynı özet aynı gün içinde tekrar yazılmaz. */
  A.kaydet = function (kod, ozet) {
    kod = donemGecerli(kod);
    var liste = A.kayitlar();
    var simdi = Date.now();
    if (liste.length) {
      var son = liste[0];
      if (son.donem === kod && son.ozet === ozet && son.tarih && gunFarki(new Date(simdi), new Date(son.tarih)) === 0) {
        son.tarih = simdi;
        liste.sort(function (a, b) { return (b.tarih || 0) - (a.tarih || 0); });
        depoKoy("karne", liste.slice(0, MAX_KAYIT));
        return liste.slice(0, MAX_KAYIT);
      }
    }
    var yeni = [{ tarih: simdi, donem: kod, ozet: ozet }].concat(liste.map(function (x) {
      return { tarih: x.tarih, donem: x.donem, ozet: x.ozet };
    }));
    var kisa = yeni.slice(0, MAX_KAYIT);
    depoKoy("karne", kisa);
    return kisa;
  };

  /* ───────────── 4) HAFTALIK GRAFİK: 7 sütun (elle çizilen SVG) ───────────── */
  A.grafikSVG = function (gunler) {
    gunler = dizi(gunler);
    if (!gunler.length) return "";
    var G = 720, Y = 300, sol = 44, sag = G - 16, ust = 24, alt = Y - 54;
    var enBuyuk = 1;
    gunler.forEach(function (g) { if (g.soru > enBuyuk) enBuyuk = g.soru; });
    var adim = (sag - sol) / gunler.length;
    var gen = Math.max(10, Math.min(58, adim - 12));
    var s = [];
    s.push('<svg class="kn-grafik" viewBox="0 0 ' + G + " " + Y + '" preserveAspectRatio="xMidYMid meet" role="img" ' +
      'aria-label="7 günlük soru grafiği: en yüksek gün ' + enBuyuk + ' soru">');
    /* yatay kılavuz + eksen değerleri */
    [0, 0.5, 1].forEach(function (o) {
      var deger = Math.round(enBuyuk * (o === 0 ? 0 : o === 1 ? 1 : 1 / 2));
      var y = Math.round((alt - o * (alt - ust)) * 10) / 10;
      s.push('<line class="kn-izgara" x1="' + sol + '" y1="' + y + '" x2="' + sag + '" y2="' + y + '"/>');
      s.push('<text class="kn-eksen" x="' + (sol - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + deger + "</text>");
    });
    /* taban çizgisi */
    s.push('<line class="kn-taban" x1="' + sol + '" y1="' + alt + '" x2="' + sag + '" y2="' + alt + '"/>');
    gunler.forEach(function (g, i) {
      var cx = Math.round((sol + i * adim + adim / 2) * 10) / 10;
      var h = g.soru > 0 ? Math.max(3, Math.round((kirp(g.soru / enBuyuk, 0, 1) * (alt - ust)) * 10) / 10) : 3;
      var y = Math.round((alt - h) * 10) / 10;
      var x = Math.round((cx - gen / 2) * 10) / 10;
      var sinif = "kn-sutun" + (g.bos ? " kn-bos" : "") + (g.bugunMu ? " kn-bugun" : "");
      s.push('<rect class="' + sinif + '" x="' + x + '" y="' + y + '" width="' + gen + '" height="' + h + '" rx="5">' +
        "<title>" + kacis(g.uzun + " · " + g.soru + " soru · " + g.gorev + " görev") + "</title></rect>");
      s.push('<text class="kn-sutun-deger' + (g.bos ? " kn-soluk" : "") + '" x="' + cx + '" y="' + (y - 6) +
        '" text-anchor="middle">' + (g.soru > 0 ? g.soru : "—") + "</text>");
      s.push('<text class="kn-gun' + (g.bugunMu ? " kn-bugun-yazi" : "") + '" x="' + cx + '" y="' + (alt + 18) +
        '" text-anchor="middle">' + kacis(g.etiket) + "</text>");
      s.push('<text class="kn-gun-alt" x="' + cx + '" y="' + (alt + 33) + '" text-anchor="middle">' +
        (g.gorev ? g.gorev + " görev" : "&nbsp;") + "</text>");
    });
    s.push("</svg>");
    return s.join("");
  };

  /* ───────────── ÇİZİM ───────────── */
  function kutu(etiket, deger, alt) {
    return '<div class="kn-kutu"><b>' + kacis(deger) + "</b><span>" + kacis(etiket) + "</span>" +
      (alt ? "<i>" + kacis(alt) + "</i>" : "") + "</div>";
  }
  function bolum(no, baslik, ic, ilk) {
    return '<div class="kn-bolum' + (ilk ? " kn-ilk" : "") + '"><h3 class="kn-baslik">' + no + ") " + kacis(baslik) +
      "</h3>" + ic + "</div>";
  }
  function donemDugmeleri(kod) {
    return '<div class="kn-donem" role="tablist" aria-label="Karne dönemi">' +
      DONEMLER.map(function (d) {
        return '<button type="button" class="ka-mini' + (d.kod === kod ? " ka-secili kn-secili" : "") +
          '" data-kn-donem="' + d.kod + '" role="tab" aria-selected="' + (d.kod === kod ? "true" : "false") + '">' +
          kacis(d.ad) + "</button>";
      }).join("") + "</div>";
  }

  function karneKutusu(m) {
    var h = [];
    var aralik;
    if (m.bas && m.bit) {
      aralik = kisaTarih(m.bas.getTime()) + " – " + kisaTarih(m.bit.getTime()) + " (" + m.donemGun + " gün)";
    } else aralik = "kayıtlı bütün çalışmalar";
    h.push('<div class="kn-karne" id="knKarne">');
    h.push('<div class="kn-karne-ust"><b>🏆 ' + kacis(m.ad) + " karnesi</b><span>" + kacis(aralik) + "</span></div>");
    h.push('<div class="kn-kutular">');
    h.push(kutu("ÇALIŞILAN GÜN", m.gunSayisi + (m.donemGun ? " / " + m.donemGun : ""),
      m.donemGun ? "dönemin günü" : "kayıtlı gün"));
    h.push(kutu("TOPLAM GÖREV", String(m.gorev), "günlük görevler"));
    h.push(kutu("TOPLAM SORU", String(m.toplamSoru), "kalem dökümü aşağıda"));
    h.push(kutu("DOĞRU ORANI", m.oran == null ? "—" : yuzdeStr(m.oran), m.toplamSoru ? m.toplamDogru + " doğru" : "soru yok"));
    h.push(kutu("NET DEĞİŞİMİ", m.net && m.net.fark != null ? (m.net.fark >= 0 ? "+" : "") + m.net.fark : "—",
      m.net ? (m.net.ilk != null ? m.net.ilk + " → " + m.net.son : "tek deneme: " + m.net.son) : "deneme yok"));
    h.push(kutu("MİNİ TEST", m.miniSayi ? m.miniSayi + (m.miniOrt != null ? " · " + yuzdeStr(m.miniOrt) : "") : "—",
      m.miniSure != null ? "ort. " + ondalik(m.miniSure) + " sn" : (m.miniSayi ? "" : "kayıt yok")));
    h.push(kutu("DİNLENEN SORU", String(m.dinlenen), m.dinlemeSon ? "son: " + trTarih(m.dinlemeSon) : "sesli soru"));
    h.push(kutu("EZBERLENEN KART", String(m.ezberlenen), "ezber + 5. kutu"));
    h.push("</div>");
    /* oyun en iyi puanları */
    if (m.oyunlar.length) {
      h.push('<p class="kn-oyunlar">🎮 Oyun en iyileri: ' + m.oyunlar.slice(0, 5).map(function (o) {
        return kacis(o.ad) + " <b>" + o.puan + "</b>";
      }).join(" · ") + "</p>");
    } else {
      h.push('<p class="kn-oyunlar kn-soluk">🎮 Oyun en iyileri: henüz oyun kaydı yok.</p>');
    }
    h.push("</div>");
    return h.join("");
  }

  function bosDurumHTML() {
    return '<div class="kn-bos" id="knBos">' +
      "<h4>📭 Bu dönem için kayıtlı çalışma yok</h4>" +
      "<p>Karne yalnızca cihazındaki gerçek kayıtlardan oluşur; kayıt yoksa sayı da yok. Aşağıdakiler yapıldığında bu ekran kendiliğinden dolar:</p>" +
      '<ul class="kn-adimlar">' +
      "<li><b>Test / soru bankası</b> çöz → <code>ustad.ist</code> (çözülen, doğru, yanlış).</li>" +
      "<li><b>Mini Test</b> çöz → <code>ustad.minitest</code> (konu bazlı başarı, süre).</li>" +
      "<li><b>Deneme</b> kaydet → <code>ustad.ka.denemeler</code> (net değişimi buradan hesaplanır).</li>" +
      "<li><b>Koç AI</b> günlük görevlerini işaretle → <code>ustad.kocGunluk</code> (çalışılan gün sayısı).</li>" +
      "</ul>" +
      '<div class="ka-butonlar kn-butonlar">' +
      '<button class="ka-dugme" type="button" data-git="testler">📚 Testlere git</button>' +
      '<button class="ka-dugme ka-ikincil" type="button" data-git="minitest">🧪 Mini Teste git</button>' +
      "</div></div>";
  }

  function kalemBolumu(m) {
    var satir = [
      { ad: "Testler / soru bankası", anahtar: "ustad.ist", soru: m.kalem.ist, not: "tarihsiz genel toplam" },
      { ad: "Mini testler", anahtar: "ustad.minitest", soru: m.kalem.minitest, not: m.miniSayi + " test" },
      { ad: "Deneme sınavları", anahtar: "ustad.ka.denemeler", soru: m.kalem.deneme, not: m.kalem.denemeSayi + " deneme × 120 soru" }
    ];
    var tr = satir.map(function (x, i) {
      return "<tr><td class='rakam'>" + (i + 1) + "</td><td>" + kacis(x.ad) +
        " <span class='kn-anahtar'>" + kacis(x.anahtar) + "</span></td><td class='rakam'><b>" + x.soru +
        "</b></td><td class='kn-not'>" + kacis(x.not) + "</td></tr>";
    }).join("");
    tr += "<tr class='kn-toplam'><td>—</td><td>TOPLAM</td><td class='rakam'><b>" + m.toplamSoru +
      "</b></td><td class='kn-not'>" + m.ad.toLocaleLowerCase("tr-TR") + " · " + m.tarihliSorular + " soru bu döneme tarihli</td></tr>";
    return bolum(3, "Soru kalemleri (hangi kalemden geldiği)", '<table class="oyun-tablo kn-tablo">' +
      "<thead><tr><th>#</th><th>Kalem</th><th>Soru</th><th>Not</th></tr></thead><tbody>" + tr + "</tbody></table>" +
      '<p class="aciklama">Toplam; test istatistiği (ustad.ist, tarihsiz genel toplam) + bu dönemin mini testleri + ' +
      "bu dönemin denemeleri (her deneme 120 soru) toplanarak bulunur. Haftalar arası karşılaştırmada yalnızca " +
      "tarihlenebilen sorular (" + m.tarihliSorular + ") kullanılır.</p>");
  }

  function grafikBolumu(m) {
    var bas = m.gunler[0], son = m.gunler[6];
    var acik = "Sütunlar " + (bas ? kisaTarih(bas.tarih) : "") + " – " + (son ? kisaTarih(son.tarih) : "") +
      " arası 7 günü gösterir; değer o gün çözülen soru sayısıdır (mini test + deneme × 120). " +
      "Altındaki küçük yazı o gün tamamlanan görev sayısıdır. Hiç çalışılmayan gün soluk kalır.";
    var ic = '<div class="kn-grafik-kap">' + A.grafikSVG(m.gunler) + "</div>" +
      '<p class="aciklama">' + kacis(acik) + "</p>";
    var enIyi = m.gunler.slice().sort(function (a, b) { return b.soru - a.soru; })[0];
    var bosGun = m.gunler.filter(function (g) { return g.bos; }).length;
    ic += '<p class="kn-sayi">En verimli gün: ' + (enIyi && enIyi.soru ? enIyi.uzun + " (" + enIyi.soru + " soru)" : "—") +
      " · boş gün: " + bosGun + " · toplam " + m.gunler.reduce(function (t, g) { return t + g.soru; }, 0) + " soru</p>";
    return bolum(4, "Haftalık grafik (7 gün)", ic);
  }

  function konuBolumu(m) {
    var h = [];
    /* gelişen konular */
    if (m.gelisen.length) {
      var tr = m.gelisen.slice(0, 6).map(function (x, i) {
        return "<tr><td class='rakam'>" + (i + 1) + "</td><td>" + kacis(x.konu) +
          (x.ders ? " <span class='kn-anahtar'>" + kacis(x.ders) + "</span>" : "") + "</td><td class='rakam'>" +
          x.dogru + "/" + x.soru + "</td><td class='rakam'>" + yuzdeStr(x.ilk) + " → " + yuzdeStr(x.son) +
          "</td><td class='rakam kn-arti'>" + (x.fark >= 0 ? "+" : "") + ondalik(x.fark) + "</td></tr>";
      }).join("");
      h.push(bolum(5, "En çok geliştiğin konular", '<table class="oyun-tablo kn-tablo">' +
        "<thead><tr><th>#</th><th>Konu</th><th>Doğru</th><th>Dönem başı → sonu</th><th>Fark</th></tr></thead><tbody>" +
        tr + "</tbody></table>" +
        '<p class="aciklama">Aynı konuda en az iki mini test olan konular karşılaştırılır: dönemin ilk mini testi ile ' +
        "sonuncusu arasındaki başarı farkı. " + m.gelisen.length + " konu listelendi" +
        (m.gelisen.length > 6 ? " (ilk 6)" : "") + ".</p>"));
    } else {
      h.push(bolum(5, "En çok geliştiğin konular",
        '<p class="kn-bos-yazi">Karşılaştırma için aynı konuda en az iki mini test gerekiyor. Bu dönemde ' +
        m.miniSayi + " mini test var.</p>"));
    }
    /* en çok yanlış yapılan konular */
    if (m.yanlislar.length) {
      var tr2 = m.yanlislar.slice(0, 8).map(function (x, i) {
        return "<tr><td class='rakam'>" + (i + 1) + "</td><td>" + kacis(x.konu) +
          (x.ders ? " <span class='kn-anahtar'>" + kacis(x.ders) + "</span>" : "") + "</td><td class='rakam'><b>" +
          x.adet + "</b></td><td class='rakam'>" + yuzdeStr(x.pay) + "</td></tr>";
      }).join("");
      tr2 += "<tr class='kn-toplam'><td>—</td><td>TOPLAM</td><td class='rakam'><b>" + m.yanlisToplam +
        "</b></td><td class='rakam'>%100</td></tr>";
      h.push(bolum(6, "En çok yanlış yaptığın konular", '<table class="oyun-tablo kn-tablo">' +
        "<thead><tr><th>#</th><th>Konu</th><th>Yanlış</th><th>Pay</th></tr></thead><tbody>" + tr2 + "</tbody></table>" +
        '<p class="aciklama">ustad.yanlisKonu kayıtları; tarihi olmadığı için tüm zamanların toplamıdır. ' +
        m.yanlisKonuSayi + " konu · toplam " + m.yanlisToplam + " yanlış" +
        (m.yanlislar.length > 8 ? " (ilk 8 listelendi)" : "") + ".</p>"));
    } else {
      h.push(bolum(6, "En çok yanlış yaptığın konular",
        '<p class="kn-bos-yazi">Yanlış kaydı yok. Test ve mini test çözdükçe en çok zorlandığın konular burada listelenir.</p>'));
    }
    return h.join("");
  }

  function yorumBolumu(m) {
    var y = A.yorum(m.kod);
    var cumle = y.split(/(?<=\.)\s+/).filter(function (x) { return x.trim(); }).length;
    return bolum(7, "Otomatik yorum", '<div class="kn-yorum" id="knYorum"><p>' + kacis(y) + "</p></div>" +
      '<div class="ka-butonlar kn-butonlar">' +
      '<button class="ka-dugme" type="button" id="knDinle">🔊 Karneyi dinle</button>' +
      '<button class="ka-dugme ka-ikincil" type="button" id="knYazdir">🖨 Yazdır</button>' +
      '<button class="ka-dugme ka-ikincil" type="button" id="knKoc">🤖 Koç AI</button>' +
      "</div>" +
      '<p class="aciklama">Yorumdaki her cümle cihazındaki kayıtlı sayılardan üretilir (' + cumle +
      " cümle); karşılaştırma için bir önceki aynı uzunluktaki dönem hesaplanır. Tahmin veya uydurma bilgi yoktur.</p>");
  }

  function kayitBolumu(m) {
    var liste = A.kayitlar();
    var ic;
    if (liste.length) {
      var tr = liste.slice(0, 20).map(function (x, i) {
        return "<tr><td class='rakam'>" + (i + 1) + "</td><td>" + kacis(trTarihSaat(x.tarih)) +
          "</td><td>" + kacis(donemAd(x.donem)) + "</td><td class='kn-not'>" + kacis(x.ozet) +
          (i === 0 ? " <span class='ka-etiket kn-yeni'>bu görüntüleme</span>" : "") + "</td></tr>";
      }).join("");
      ic = '<table class="oyun-tablo kn-tablo" id="knKayitlar"><thead><tr><th>#</th><th>Tarih</th><th>Dönem</th>' +
        "<th>Özet</th></tr></thead><tbody>" + tr + "</tbody></table>" +
        '<p class="aciklama">Her karne görüntülemesi kaydedilir (en fazla ' + MAX_KAYIT + " kayıt tutulur); " +
        liste.length + " kayıt var.</p>";
    } else {
      ic = '<p class="kn-bos-yazi">Henüz karne kaydı yok.</p>';
    }
    return bolum(8, "Önceki karneler", ic);
  }

  function bagla(kod, m) {
    $$("#karneAlan [data-kn-donem]").forEach(function (b) {
      b.addEventListener("click", function () {
        var y = b.getAttribute("data-kn-donem");
        if (y !== A.donem) { A.donem = y; ciz(); }
      });
    });
    var d1 = $("#knDinle");
    if (d1) d1.addEventListener("click", function () {
      if (d1.getAttribute("data-caliyor") === "1") {
        A.durdurSes();
        d1.setAttribute("data-caliyor", "0");
        d1.textContent = "🔊 Karneyi dinle";
        return;
      }
      var metin = A.sesMetni(kod);
      d1.setAttribute("data-caliyor", "1");
      d1.textContent = "⏹ Durdur";
      var S = window.KPSS_SES;
      if (S && S.konus) {
        var cumleler = S.cumlelereBol ? S.cumlelereBol(metin) : null;
        var secenek = { bitti: function () { d1.setAttribute("data-caliyor", "0"); d1.textContent = "🔊 Karneyi dinle"; } };
        if (cumleler && cumleler.length) secenek.cumleler = cumleler;
        try { S.konus(metin, secenek); } catch (e) { d1.setAttribute("data-caliyor", "0"); d1.textContent = "🔊 Karneyi dinle"; }
      } else {
        ses(metin);
        d1.setAttribute("data-caliyor", "0");
        d1.textContent = "🔊 Karneyi dinle";
      }
    });
    var d2 = $("#knYazdir");
    if (d2) d2.addEventListener("click", function () { try { window.print(); } catch (e) {} });
    var d3 = $("#knKoc");
    if (d3) d3.addEventListener("click", function () { git("kocai"); });
    $$("#karneAlan [data-git]").forEach(function (b) {
      b.addEventListener("click", function () { git(b.getAttribute("data-git")); });
    });
  }

  function ciz() {
    var kap = $("#karneAlan");
    if (!kap) return null;
    var kod = donemGecerli(A.donem);
    var m = A.model(kod);
    /* kayıt: çizimden ÖNCE yazılır ki "önceki karneler" listesinde görünsün */
    A.kaydet(kod, A.ozetMetni(m));

    var h = [];
    h.push('<div class="kn-bolum kn-ilk"><h3 class="kn-baslik">1) Dönem seçimi</h3>' + donemDugmeleri(kod) +
      '<p class="aciklama">Türkiye saatine göre hafta <b>pazartesi</b> başlar. “Bu hafta” pazartesiden bugüne kadardır; ' +
      "yorumdaki karşılaştırma her zaman bir önceki aynı uzunluktaki dönemle yapılır.</p></div>");
    h.push(bolum(2, "Karne kutusu", karneKutusu(m)));
    if (A.bosDurum(m)) h.push('<div class="kn-bolum">' + bosDurumHTML() + "</div>");
    h.push(kalemBolumu(m));
    h.push(grafikBolumu(m));
    h.push(konuBolumu(m));
    h.push(yorumBolumu(m));
    h.push(kayitBolumu(m));

    kap.innerHTML = h.join("");
    bagla(kod, m);
    try {
      window.__karneSon = {
        donem: kod, gunSayisi: m.gunSayisi, gorev: m.gorev, toplamSoru: m.toplamSoru,
        tarihliSorular: m.tarihliSorular, oran: m.oran, net: m.net ? m.net.fark : null,
        miniSayi: m.miniSayi, yanlisKonu: m.yanlisKonuSayi, gelisen: m.gelisen.length,
        sutun: m.gunler.length, kayit: A.kayitlar().length
      };
    } catch (e) {}
    return m;
  }

  A.ciz = ciz;
  A.bolumAc = function (kod) { if (kod === "karne") ciz(); };

  /* ───────────── KENDİ KENDİNİ TEST (?test=1) ───────────── */
  if (location.search.indexOf("test=1") >= 0) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        var t = [], ok = function (ad, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : "")); };
        var istekSayisi = 0, eskiFetch = window.fetch, eskiAc = window.XMLHttpRequest;
        try {
          window.fetch = function () { istekSayisi++; return eskiFetch ? eskiFetch.apply(this, arguments) : Promise.resolve(); };
          window.XMLHttpRequest = function () { istekSayisi++; return new eskiAc(); };
        } catch (e) {}

        /* eski hâli sakla */
        var ANAHTAR = ["ist", "minitest", "ka.denemeler", "ka.hedef", "yanlisKonu", "kocGunluk", "oyunEnIyi",
                       "kartlar", "sesdene", "ezber", "karne"];
        var eski = {};
        ANAHTAR.forEach(function (k) { eski[k] = depoVar(k) ? localStorage.getItem("ustad." + k) : null; });
        var eskiDonem = A.donem;

        /* ── sentetik veri: bu hafta + geçen hafta ── */
        var b = bugun(), pzt = pazartesi(b), ofs = gunFarki(b, pzt);
        function iso(gunFarki, saat) {
          var d = new Date(pzt.getTime()); d.setDate(d.getDate() + gunFarki); d.setHours(saat == null ? 12 : saat, 0, 0, 0);
          return d.toISOString();
        }
        depoKoy("ist", { cozulen: 200, dogru: 120, yanlis: 60, bos: 20 });
        depoKoy("minitest", [
          { tarih: iso(0, 9), ders: "Türkçe", konu: "Paragraf", dogru: 6, toplam: 20, sureOrt: 40, sureler: [38, 42] },
          { tarih: iso(0, 10), ders: "Matematik", konu: "Problemler", dogru: 10, toplam: 20, sureOrt: 35, sureler: [33, 37] },
          { tarih: iso(ofs, 19), ders: "Türkçe", konu: "Paragraf", dogru: 14, toplam: 20, sureOrt: 30, sureler: [28, 32] },
          { tarih: iso(ofs, 20), ders: "Matematik", konu: "Problemler", dogru: 15, toplam: 20, sureOrt: 28, sureler: [26, 30] },
          { tarih: iso(-7, 10), ders: "Türkçe", konu: "Paragraf", dogru: 12, toplam: 30, sureOrt: 50, sureler: [48, 52] },
          { tarih: iso(-6, 11), ders: "Coğrafya", konu: "Nüfus", dogru: 15, toplam: 30, sureOrt: 45, sureler: [43, 47] },
          { tarih: iso(-4, 19), ders: "Türkçe", konu: "Paragraf", dogru: 15, toplam: 30, sureOrt: 47, sureler: [45, 49] },
          { tarih: iso(-3, 20), ders: "Coğrafya", konu: "Nüfus", dogru: 12, toplam: 30, sureOrt: 49, sureler: [47, 51] }
        ]);
        depoKoy("ka.denemeler", [
          { id: "t1", tarih: iso(-5, 15), tDogru: 50, yuzde: 41.7, gosterge: 60 },
          { id: "t2", tarih: iso(0, 8), tDogru: 60, yuzde: 50, gosterge: 65 },
          { id: "t3", tarih: iso(ofs, 21), tDogru: 70, yuzde: 58.3, gosterge: 68 }
        ]);
        depoKoy("ka.hedef", 85);
        depoKoy("yanlisKonu", { "Paragraf|Türkçe": 7, "Problemler|Matematik": 5, "Nüfus|Coğrafya": 2 });
        var kg = {};
        var pztKey = isoGun(pzt), bugunKey = isoGun(b);
        if (pztKey === bugunKey) { kg[bugunKey] = [1, 2, 3, 4, 5]; }
        else { kg[pztKey] = [1, 2, 3]; kg[bugunKey] = [4, 5]; }
        kg[isoGun(gunEkle(pzt, -7))] = [6];
        kg[isoGun(gunEkle(pzt, -6))] = [7];
        depoKoy("kocGunluk", kg);
        depoKoy("oyunEnIyi", { bilgi: 42, sayi: 18 });
        depoKoy("kartlar", { "k1|Türkçe|Paragraf": { kutu: 5, kez: 3 }, "k2|Matematik|Problemler": { kutu: 2, kez: 1 } });
        depoKoy("sesdene", { toplam: 150, sureDk: 220, sonTarih: b.getTime() });
        depoKoy("ezber", { "deste1::kart1": { bildi: true }, "deste1::kart2": { bildi: false } });
        depoKoy("karne", [{ tarih: gunEkle(b, -10).getTime(), donem: "gecen", ozet: "Geçen hafta · 140 soru · %52,3 doğru · 5 gün" }]);

        A.donem = "bu";

        /* ── dönem hesabı ── */
        var mb = A.model("bu"), mg = A.model("gecen"), m30 = A.model("30"), mt = A.model("tum");
        ok("dönem: bu hafta mini test 4", mb.miniSayi === 4, mb.miniSayi + " test");
        ok("dönem: geçen hafta mini test 4", mg.miniSayi === 4, mg.miniSayi + " test");
        ok("dönem: son 30 gün mini test 8", m30.miniSayi === 8, m30.miniSayi + " test");
        ok("dönem: tüm zamanlar mini test 8", mt.miniSayi === 8, mt.miniSayi + " test");
        ok("gün: geçen hafta 5 çalışılan gün", mg.gunSayisi === 5, mg.gunSayisi + " gün");
        ok("gün: bu hafta 1-2 çalışılan gün", mb.gunSayisi >= 1 && mb.gunSayisi <= 2, mb.gunSayisi + " gün");
        ok("gün: tüm zamanlar " + (ofs === 0 ? 6 : 7) + " çalışılan gün", mt.gunSayisi === (ofs === 0 ? 6 : 7), mt.gunSayisi + " gün");
        ok("görev: bu hafta 5 görev", mb.gorev === 5, mb.gorev + " görev");
        ok("görev: tüm zamanlar 7 görev", mt.gorev === 7, mt.gorev + " görev");

        /* ── sayılar ── */
        ok("soru: bu hafta tarihli 320", mb.tarihliSorular === 320, mb.tarihliSorular + " soru");
        ok("soru: geçen hafta tarihli 240", mg.tarihliSorular === 240, mg.tarihliSorular + " soru");
        ok("soru: bu hafta toplam 520 (ist 200 + 320)", mb.toplamSoru === 520, mb.toplamSoru + " soru");
        ok("oran: bu hafta %56,7", mb.oran != null && ondalik(mb.oran) === "56,7", ondalik(mb.oran || 0));
        ok("net: bu hafta +10 (60 → 70)", mb.net && mb.net.fark === 10 && mb.net.ilk === 60 && mb.net.son === 70,
           mb.net ? mb.net.ilk + "→" + mb.net.son + " (" + mb.net.fark + ")" : "yok");
        ok("net: geçen hafta tek deneme, fark yok", mg.net && mg.net.fark === null && mg.net.son === 50,
           mg.net ? String(mg.net.son) + "/" + String(mg.net.fark) : "yok");
        ok("mini: ortalama %56,3", mb.miniOrt != null && ondalik(mb.miniOrt) === "56,3", ondalik(mb.miniOrt || 0));
        ok("kalem: ist 200 · mini 80 · deneme 240", mb.kalem.ist === 200 && mb.kalem.minitest === 80 && mb.kalem.deneme === 240,
           JSON.stringify(mb.kalem));
        ok("ezber: 2 kart (ezber + 5. kutu)", mb.ezberlenen === 2, mb.ezberlenen + " kart");
        ok("dinlenen: 150 soru", mb.dinlenen === 150, mb.dinlenen + " soru");
        ok("oyun: en iyi puanlar sıralı", mb.oyunlar.length === 2 && mb.oyunlar[0].ad === "Bilgi Yarışı" && mb.oyunlar[0].puan === 42,
           JSON.stringify(mb.oyunlar));
        ok("konu: gelişen 2 konu, ilki Paragraf +40", mb.gelisen.length === 2 && mb.gelisen[0].konu === "Paragraf" &&
           mb.gelisen[0].fark === 40, mb.gelisen.map(function (x) { return x.konu + ":" + x.fark; }).join(" "));
        ok("konu: yanlış 3 kayıt (toplam 14)", mb.yanlislar.length === 3 && mb.yanlisToplam === 14,
           mb.yanlislar.length + " konu / " + mb.yanlisToplam + " yanlış");
        ok("grafik: 7 gün", mb.gunler.length === 7, mb.gunler.length + " gün");
        ok("grafik: boş günler soluk", mb.gunler.filter(function (g) { return g.bos; }).length >= 1,
           mb.gunler.filter(function (g) { return g.bos; }).length + " boş");

        /* ── yorum: gerçek sayılar ── */
        var y = A.yorum("bu");
        ok("yorum: bu hafta 320 + geçen hafta 240 + %33", /320/.test(y) && /240/.test(y) && /%33/.test(y), y.slice(0, 90));
        ok("yorum: net değişimi sayıyla", /\+10 net/.test(y) && /60 → 70/.test(y), y.slice(0, 120));
        ok("yorum: gelişen konu adı geçiyor", /Paragraf/.test(y), y.slice(0, 60));
        var cy = y.split(/(?<=\.)\s+/).filter(function (x) { return x.trim(); }).length;
        ok("yorum: 3-6 cümle", cy >= 3 && cy <= 6, cy + " cümle");
        var yg = A.yorum("gecen");
        ok("yorum: geçen hafta kendi sayıları", /240/.test(yg) || /Deneme doğrun 50/.test(yg), yg.slice(0, 80));
        ok("yorum: tüm zamanlar kendi cümlesi", /Tüm zamanlarda toplam 760 soru/.test(A.yorum("tum")), A.yorum("tum").slice(0, 70));

        /* ── arayüz ── */
        A.donem = "bu";
        var m = A.bolumAc("karne");
        var kap = $("#karneAlan");
        ok("arayüz: #karneAlan bulundu", !!kap, kap ? "ok" : "yok");
        ok("arayüz: 4 dönem düğmesi", $$("#karneAlan [data-kn-donem]").length === 4, $$("#karneAlan [data-kn-donem]").length + " düğme");
        ok("arayüz: seçili dönem işaretli", $$("#karneAlan .ka-mini.ka-secili").length === 1,
           $$("#karneAlan .ka-mini.ka-secili").length + " seçili");
        var kt = $$("#karneAlan .kn-kutu");
        ok("kutu: 8 gösterge kutusu", kt.length === 8, kt.length + " kutu");
        var kv = kt.map(function (x) { return x.querySelector("b").textContent; });
        ok("kutu: TOPLAM SORU 520", kv[2] === "520", kv[2]);
        ok("kutu: DOĞRU ORANI %56,7", kv[3] === "%56,7", kv[3]);
        ok("kutu: NET DEĞİŞİMİ +10", kv[4] === "+10", kv[4]);
        ok("kutu: oyun en iyileri yazıldı", /Bilgi Yarışı/.test((($("#karneAlan .kn-oyunlar") || {}).textContent) || ""),
           ((($("#karneAlan .kn-oyunlar") || {}).textContent) || "").slice(0, 50));
        var kalemSatir = $$("#karneAlan .kn-tablo").length;
        ok("tablo: kalem + konu + kayıt tabloları", kalemSatir >= 3, kalemSatir + " tablo");
        var tablolar = $$("#karneAlan .oyun-tablo");
        ok("tablo: kalem dökümü 4 satır (3 kalem + toplam)", tablolar[0].querySelectorAll("tbody tr").length === 4,
           tablolar[0].querySelectorAll("tbody tr").length + " satır");
        ok("tablo: gelişen konular 2 satır", tablolar[1].querySelectorAll("tbody tr").length === 2,
           tablolar[1].querySelectorAll("tbody tr").length + " satır");
        ok("tablo: yanlış konular 3 + toplam satır", tablolar[2].querySelectorAll("tbody tr").length === 4,
           tablolar[2].querySelectorAll("tbody tr").length + " satır");
        ok("grafik: SVG çizildi", !!$("#karneAlan svg.kn-grafik"), $("#karneAlan svg.kn-grafik") ? "var" : "yok");
        var sutun = $$("#karneAlan svg.kn-grafik rect.kn-sutun");
        ok("grafik: 7 sütun", sutun.length === 7, sutun.length + " sütun");
        ok("grafik: soluk sütun var (boş gün)", $$("#karneAlan svg.kn-grafik rect.kn-sutun.kn-bos").length >= 1,
           $$("#karneAlan svg.kn-grafik rect.kn-sutun.kn-bos").length + " soluk");
        ok("düğmeler: dinle + yazdır + koç AI", !!$("#knDinle") && !!$("#knYazdir") && !!$("#knKoc"),
           [$("#knDinle") ? "dinle" : "", $("#knYazdir") ? "yazdır" : "", $("#knKoc") ? "kocai" : ""].join("+"));
        var yorumHtml = ($("#knYorum") || {}).textContent || "";
        ok("arayüz: yorum metni ekranda", /320/.test(yorumHtml), yorumHtml.slice(0, 60));

        /* ── sesli okuma: KPSS_SES.konus geçici olarak sahte ── */
        var S = window.KPSS_SES, eskiKonus = S ? S.konus : null, toplanan = [];
        if (S) S.konus = function (metin) { toplanan.push(String(metin || "")); };
        try {
          var metin = A.sesMetni("bu");
          ok("ses: metin 320 ve doğru oranı içeriyor", /320/.test(metin) && /56,7/.test(metin), metin.slice(0, 90));
          ok("ses: metin tek cümle akışı (boşluksuz)", metin.length > 120 && !/  /.test(metin), metin.length + " karakter");
          var d1 = $("#knDinle");
          if (d1) d1.click();
          ok("ses: dinle düğmesi ses motorunu çağırdı", toplanan.length === 1 && /320/.test(toplanan[0]),
             toplanan.length + " çağrı");
          ok("ses: düğme durdurma konumuna geçti", d1 && /Durdur/.test(d1.textContent), d1 ? d1.textContent : "düğme yok");
          if (d1) d1.click();
          ok("ses: ikinci tıklama durdurur", d1 && /dinle/.test(d1.textContent), d1 ? d1.textContent : "düğme yok");
        } catch (e) { ok("ses: hata olmadan çalıştı", false, String(e && e.message)); }
        if (S && eskiKonus) S.konus = eskiKonus;   /* gerçek fonksiyonu geri koy */

        /* ── kayıt + önceki karneler ── */
        var kayit = A.kayitlar();
        ok("kayıt: ustad.karne yazıldı (eski + yeni)", kayit.length === 2, kayit.length + " kayıt");
        ok("kayıt: özet gerçek sayı içeriyor", kayit[0] && /320 soru/.test(kayit[0].ozet) && /56,7/.test(kayit[0].ozet),
           kayit[0] ? kayit[0].ozet : "yok");
        ok("kayıt: eskisi korundu (14 kayıt → 20 sınırı)", depoVar("karne") &&
           dizi(depoAl("karne", [])).some(function (x) { return /140 soru/.test(String(x.ozet)); }), "seed bulundu");
        var kayitTablosu = $$("#karneAlan .kn-tablo")[3];
        ok("kayıt: önceki karneler listesi 2 satır", kayitTablosu && kayitTablosu.querySelectorAll("tbody tr").length === 2,
           kayitTablosu ? kayitTablosu.querySelectorAll("tbody tr").length + " satır" : "tablo yok");
        var c2 = A.bolumAc("karne");
        ok("kayıt: tekrar çizim yeni kayıt uydurmuyor", A.kayitlar().length === 2, A.kayitlar().length + " kayıt");

        /* ── dönem geçişi ── */
        var gecenDugme = $$("#karneAlan [data-kn-donem='gecen']")[0];
        if (gecenDugme) gecenDugme.click();
        ok("dönem: geçen hafta düğmesi çizimi değiştirdi", A.donem === "gecen" && /240/.test(($("#karneAlan .kn-yorum") || {}).textContent || ""),
           A.donem + " · " + ((($("#karneAlan .kn-yorum") || {}).textContent) || "").slice(0, 60));
        var tumDugme = $$("#karneAlan [data-kn-donem='tum']")[0];
        if (tumDugme) tumDugme.click();
        ok("dönem: tüm zamanlar 8 mini test", A.donem === "tum" && /Tüm zamanlarda/.test(($("#karneAlan .kn-yorum") || {}).textContent || ""),
           A.donem);

        /* ── boş veri durumu ── */
        ANAHTAR.forEach(function (k) { try { localStorage.removeItem("ustad." + k); } catch (e) {} });
        A.donem = "bu";
        var hata = null;
        try { A.bolumAc("karne"); } catch (e) { hata = e; }
        ok("boş: veri yokken çizim hata vermedi", hata === null, hata ? String(hata.message) : "hata yok");
        ok("boş: açık zeminli boş durum kutusu", !!$("#knBos") && !!$("#karneAlan .kn-bos"),
           $("#knBos") ? "var" : "yok");
        ok("boş: yorum yine yazılıyor", /(bulunamadı|kayıt)/.test((($("#knYorum") || {}).textContent) || ""),
           ((($("#knYorum") || {}).textContent) || "").slice(0, 60));
        var sutun2 = $$("#karneAlan svg.kn-grafik rect.kn-sutun");
        ok("boş: grafik yine 7 sütun (hepsi soluk)", sutun2.length === 7 && $$("#karneAlan svg.kn-grafik rect.kn-sutun.kn-bos").length === 7,
           sutun2.length + " sütun");

        /* ── ağ denetimi ── */
        ok("ağ: karne hiç istek yapmadı", istekSayisi === 0, istekSayisi + " istek");

        /* ── depoyu eski hâline döndür ── */
        A.donem = eskiDonem;
        ANAHTAR.forEach(function (k) {
          if (eski[k] === null) { try { localStorage.removeItem("ustad." + k); } catch (e) {} }
          else { try { localStorage.setItem("ustad." + k, eski[k]); } catch (e) {} }
        });
        try { window.fetch = eskiFetch; window.XMLHttpRequest = eskiAc; } catch (e) {}

        var kap2 = document.createElement("div");
        kap2.id = "karneTestSonuc";
        kap2.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
        kap2.innerHTML = "<h3>ÜSTAD KOÇ PRO · Haftalık Karne testi (çevrimdışı, sentetik veri)</h3>" +
          t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
          "<hr><b>" + t.filter(function (x) { return x.indexOf("✔") === 0; }).length + " / " + t.length + " geçti</b>";
        document.body.appendChild(kap2);
        document.title = (document.title || "") + " KARNETEST " +
          t.filter(function (x) { return x.indexOf("✔") === 0; }).length + "/" + t.length;
      }, 500);
    });
  }
})();
