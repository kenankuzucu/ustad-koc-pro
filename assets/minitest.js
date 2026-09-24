/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Mini Test (konu bazlı + süreli) · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Kaynaklar: window.USTAD_SORULAR (özgün soru bankası), window.USTAD_PAKET.dersler, window.KPSS_SES.konus,
   window.USTAD_MOTOR.git, window.KARTLAR.yanlisaEkle (varsa). Hiçbir veri uydurulmaz; tüm sayılar ölçümden gelir. */
(function () {
  "use strict";
  var A = window.MINITEST = window.MINITEST || {};

  var HEDEF_SN = 70;          /* süreli modda soru başına hedef süre — Kenan'ın istediği gerçek sınav temposu */
  var MAX_KAYIT = 50;         /* geçmişte tutulacak en fazla mini test kaydı */
  var HARFLER = ["A", "B", "C", "D"];
  var TUMU = "__tum__";

  /* ───────────────────────── yardımcılar ───────────────────────── */
  function $(s) { return document.querySelector(s); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function depoAl(k, v) { try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } }
  function depoKoy(k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); } catch (e) {} }
  function ses(metin) { try { if (window.KPSS_SES && KPSS_SES.konus) KPSS_SES.konus(metin); } catch (e) {} }
  function karistir(a) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }
  function i2(n) { return n < 10 ? "0" + n : "" + n; }
  function tarihYaz(ts) {
    var d = new Date(ts);
    return i2(d.getDate()) + "." + i2(d.getMonth() + 1) + "." + d.getFullYear() + " " + i2(d.getHours()) + ":" + i2(d.getMinutes());
  }
  function sureYaz(sn) { return (sn == null ? 0 : sn) + " sn"; }
  /** Süreli mod uyarı metni: bu soru hedefi aştıysa ne söyleneceğini üretir. */
  function sureUyari(gecen, hedef) { return "Bu soru " + gecen + " sn sürdü, hedef " + hedef + " sn"; }

  /* ───────────────────────── veri ───────────────────────── */
  function sorular() { var s = window.USTAD_SORULAR; return Array.isArray(s) ? s : []; }
  function dersler() { var p = window.USTAD_PAKET; return (p && p.dersler) || []; }
  function dersBul(ad) { var d = dersler().filter(function (x) { return x.ad === ad; })[0]; return d || null; }
  function konuSayilari(dersAd) {
    var m = {};
    sorular().forEach(function (s) { if (s.ders === dersAd) m[s.konu] = (m[s.konu] || 0) + 1; });
    return m;
  }
  function gecmis() { var g = depoAl("minitest", []); return Array.isArray(g) ? g : []; }
  function gecmisKoy(g) { depoKoy("minitest", g.slice(0, MAX_KAYIT)); }
  function ist() {
    var i = depoAl("ist", null);
    if (!i || typeof i !== "object") i = { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 };
    i.cozulen = i.cozulen || 0; i.dogru = i.dogru || 0; i.yanlis = i.yanlis || 0; i.bos = i.bos || 0;
    return i;
  }
  function yanlisKonu() { var m = depoAl("yanlisKonu", null); return (m && typeof m === "object") ? m : {}; }
  /** ustad.yanlisKonu sayacı: "Konu|Ders" anahtarı — yanlış defteriyle aynı biçim. */
  function yanlisKonuArttir(konu, ders) {
    var m = yanlisKonu(), k = konu + "|" + ders;
    m[k] = (m[k] || 0) + 1;
    depoKoy("yanlisKonu", m);
    return m;
  }
  /** ustad.ist sayacı: her cevap anında işlenir (test yarıda bırakılsa da istatistik doğru kalır). */
  function istArttir(dogruMu) {
    var i = ist();
    i.cozulen++;
    if (dogruMu) i.dogru++; else i.yanlis++;
    depoKoy("ist", i);
    return i;
  }
  function zayifKonu() {
    var m = yanlisKonu(), en = null;
    Object.keys(m).forEach(function (k) {
      var n = Number(m[k]) || 0;
      if (!en || n > en.adet) en = { anahtar: k, adet: n };
    });
    if (!en) return null;
    var p = en.anahtar.split("|");
    return { konu: p[0], ders: p[1] || "", adet: en.adet };
  }

  /* ───────────────────────── durum ───────────────────────── */
  var D = {
    ders: null, konu: TUMU, adet: 10, sureli: true,
    sorular: [], i: 0, secimler: [], sureler: [],
    dogru: 0, yanlis: 0, sonuc: null, uyari: null,
    basladi: 0, soruBasladi: 0, sayac: null, tamam: false
  };
  A.durum = D;
  A.HEDEF_SN = HEDEF_SN;
  A.sureUyari = sureUyari;
  A.gecmis = gecmis;
  A.ist = ist;
  A.yanlisKonu = yanlisKonu;
  A.zayifKonu = zayifKonu;

  /* ───────────────────────── soru seçimi (konu → ders → banka) ───────────────────────── */
  function secimOlustur(dersAd, konuAd, adet) {
    var hepsi = sorular();
    var dersHavuzu = hepsi.filter(function (s) { return s.ders === dersAd; });
    var konuHavuzu = (konuAd === TUMU || !konuAd) ? dersHavuzu : dersHavuzu.filter(function (s) { return s.konu === konuAd; });
    var secili = karistir(konuHavuzu);
    if (secili.length < adet) {                    /* konu yetmezse aynı dersin diğer konularından tamamla */
      var yan = dersHavuzu.filter(function (s) { return konuAd !== TUMU && s.konu !== konuAd; });
      secili = secili.concat(karistir(yan));
    }
    if (secili.length < adet) {                    /* ders de yetmezse bankadan tamamla */
      var diger = hepsi.filter(function (s) { return s.ders !== dersAd; });
      secili = secili.concat(karistir(diger));
    }
    return secili.slice(0, adet);
  }
  /** Seçilen konuda kaç soru var, kaçı dersin diğer konularından geldi — kullanıcıya dürüst bilgi. */
  function havuzBilgi(dersAd, konuAd, adet) {
    var hepsi = sorular();
    var dersToplam = hepsi.filter(function (s) { return s.ders === dersAd; }).length;
    var konuToplam = (konuAd === TUMU) ? dersToplam : hepsi.filter(function (s) { return s.ders === dersAd && s.konu === konuAd; }).length;
    return { konuToplam: konuToplam, dersToplam: dersToplam, istenen: adet };
  }

  /* ───────────────────────── göstergeler ───────────────────────── */
  function gostergeDom() {
    var g = gecmis(), testSayisi = g.length, basariTop = 0, sureTop = 0, soruTop = 0;
    g.forEach(function (k) {
      var t = Number(k.toplam) || 0;
      if (t) basariTop += ((Number(k.dogru) || 0) / t) * 100;
      (k.sureler || []).forEach(function (x) { if (typeof x === "number") { sureTop += x; soruTop++; } });
    });
    var yuzde = testSayisi ? Math.round(basariTop / testSayisi) : 0;
    var ortSure = soruTop ? Math.round(sureTop / soruTop) : 0;
    var z = zayifKonu();
    return '<div class="mt-kutular">' +
      kutu(testSayisi, "ÇÖZÜLEN MİNİ TEST") +
      kutu("%" + yuzde, "ORTALAMA BAŞARI") +
      kutu(sureYaz(ortSure), "ORTALAMA SÜRE/SORU") +
      kutu(z ? z.konu + (z.ders ? " · " + z.ders : "") : "—", "EN ZAYIF KONU", true) +
      '</div>';
  }
  function kutu(deger, etiket, genis) {
    return '<div class="mt-kutu' + (genis ? " mt-genis" : "") + '"><b>' + kacis(deger) + '</b><span>' + kacis(etiket) + '</span></div>';
  }

  /* ───────────────────────── kurulum ekranı ───────────────────────── */
  function kurulumDom() {
    var ds = dersler(), dersAd = D.ders;
    if (!dersAd && ds.length) { dersAd = ds[0].ad; D.ders = dersAd; if (!D.konu) D.konu = TUMU; }
    var dersButon = ds.map(function (d) {
      return '<button class="mt-sec' + (d.ad === dersAd ? " mt-secili" : "") + '" data-mt="ders" data-ders="' + kacis(d.ad) + '">' +
        '<span>' + kacis(d.simg || "") + ' ' + kacis(d.ad) + '</span><span class="mt-sayi">' + (d.soru || 0) + ' soru</span></button>';
    }).join("");
    if (!dersButon) dersButon = '<span class="aciklama">Soru paketi yüklenmemiş.</span>';

    var ks = konuSayilari(dersAd), dersToplam = 0;
    Object.keys(ks).forEach(function (k) { dersToplam += ks[k]; });
    var konuButon = '<button class="mt-sec' + ((D.konu === TUMU || !D.konu) ? " mt-secili" : "") + '" data-mt="konu" data-konu="' + TUMU + '">' +
        '<span>🎯 Tüm konular</span><span class="mt-sayi">' + dersToplam + '</span></button>' +
      (dersBul(dersAd) ? (dersBul(dersAd).konular || []).filter(function (k) { return ks[k]; }).map(function (k) {
        return '<button class="mt-sec' + (k === D.konu ? " mt-secili" : "") + '" data-mt="konu" data-konu="' + kacis(k) + '">' +
          '<span>' + kacis(k) + '</span><span class="mt-sayi">' + ks[k] + '</span></button>';
      }).join("") : "");

    var adetButon = [5, 10, 20].map(function (n) {
      return '<button class="mt-sec' + (n === D.adet ? " mt-secili" : "") + '" data-mt="adet" data-adet="' + n + '">' + n + ' soru</button>';
    }).join("");

    var bilgi = havuzBilgi(dersAd, D.konu, D.adet);
    var notMetni;
    if (D.konu === TUMU) {
      notMetni = kacis(dersAd) + " dersinde toplam " + bilgi.dersToplam + " soru var.";
    } else {
      notMetni = "“" + kacis(D.konu) + "” konusunda " + bilgi.konuToplam + " soru var.";
      if (bilgi.konuToplam < D.adet) notMetni += " " + D.adet + " soru için kalanı " + kacis(dersAd) + " dersinin diğer konularından ekleyeceğim.";
    }
    if (bilgi.dersToplam && bilgi.dersToplam < D.adet) notMetni += " Ders soruları yetmezse bankanın tamamından tamamlanır.";

    return '<div class="mt-kurulum">' +
      '<div class="mt-adim"><b>1) Ders seç</b><div class="mt-secim">' + dersButon + '</div></div>' +
      '<div class="mt-adim"><b>2) Konu seç (yanındaki sayı bankadaki soru adedi)</b><div class="mt-secim">' + konuButon + '</div></div>' +
      '<div class="mt-adim"><b>3) Soru sayısı</b><div class="mt-secim">' + adetButon + '</div></div>' +
      '<div class="mt-adim"><b>4) Süreli mod (soru başına ' + HEDEF_SN + ' sn hedef)</b>' +
        '<button class="mt-anahtar' + (D.sureli ? " mt-acik" : "") + '" data-mt="sureli"><i></i><span>' +
        (D.sureli ? "AÇIK · " + HEDEF_SN + " sn/soru" : "KAPALI · serbest tempo") + '</span></button></div>' +
      '<div class="mt-not">' + notMetni + '</div>' +
      '<div class="mt-alt"><button class="ka-dugme" data-mt="basla">▶ BAŞLA</button>' +
      '<span class="aciklama" style="margin:0">Doğru/yanlış her cevap işlenir, yanlışlar karta ve deftere gider.</span></div>' +
      '</div>';
  }

  /* ───────────────────────── test ekranı ───────────────────────── */
  function testDom() {
    var toplam = D.sorular.length || 1;
    var gecen = Math.max(0, Math.round((Date.now() - D.soruBasladi) / 1000));
    var yuzde = Math.round((D.i / toplam) * 100);
    return '<div class="mt-test">' +
      '<div class="mt-ust">' +
        '<span class="ka-etiket mt-ilerleme" id="mtIlerleme">' + (D.i + 1) + " / " + D.sorular.length + '</span>' +
        '<span class="ka-etiket mt-kronometre" id="mtKronometre">' + gecen + ' sn</span>' +
        (D.sureli ? '<span class="ka-etiket">Süreli mod · hedef ' + HEDEF_SN + ' sn</span>' : '<span class="ka-etiket">Serbest tempo</span>') +
        '<span class="ka-etiket">' + kacis(D.ders) + (D.konu === TUMU ? "" : " · " + kacis(D.konu)) + '</span>' +
      '</div>' +
      '<div class="mt-cubuk"><i style="width:' + yuzde + '%"></i></div>' +
      soruDom() +
      '</div>';
  }

  function soruDom() {
    var s = D.sorular[D.i];
    if (!s) return '<p class="aciklama">Soru bulunamadı.</p>';
    var secili = D.secimler[D.i];
    var cevaplandi = secili != null;
    var sik = (s.secenekler || []).map(function (metin, ix) {
      var sinif = "mt-sik";
      if (cevaplandi) {
        if (ix === s.dogru) sinif += " mt-dogru";
        else if (ix === secili) sinif += " mt-yanlis";
        else sinif += " mt-soluk";
      }
      return '<button class="' + sinif + '" data-mt="sec" data-sec="' + ix + '"' + (cevaplandi ? " disabled" : "") + '>' +
        '<b>' + HARFLER[ix] + '</b><span>' + kacis(metin) + '</span></button>';
    }).join("");

    var geri = "";
    if (cevaplandi) {
      var gecen = D.sureler[D.i] || 0;
      var dogruMu = secili === s.dogru;
      var asim = (D.sureli && gecen > HEDEF_SN) ? '<div class="mt-asim-uyari">⏱ ' + kacis(sureUyari(gecen, HEDEF_SN)) + '</div>' : "";
      geri = '<div class="mt-geri ' + (dogruMu ? "mt-ok" : "mt-hata") + '">' +
        '<b>' + (dogruMu ? "✔ Doğru" : "✘ Yanlış — doğru cevap " + HARFLER[s.dogru]) + '</b>' +
        aciklamaDom(s) + asim + '</div>';
    }
    var son = D.i + 1 >= D.sorular.length;
    var dugme = cevaplandi
      ? '<div class="mt-alt"><button class="ka-dugme" data-mt="' + (son ? "bitir" : "sonraki") + '">' +
        (son ? "Sonucu gör ▸" : "Sonraki soru ▸") + '</button></div>'
      : '<p class="aciklama" style="margin:10px 0 0">Şıklardan birini seç.</p>';

    return '<div class="mt-soru">' +
      (s.metin ? '<p class="mt-metin">' + kacis(s.metin) + '</p>' : "") +
      '<h4>' + kacis(s.soru) + '</h4>' + sik + geri + dugme + '</div>';
  }
  function aciklamaDom(s) { return s.aciklama ? '<div class="aciklama" style="margin:0">' + kacis(s.aciklama) + '</div>' : ""; }

  /* ───────────────────────── sonuç ekranı ───────────────────────── */
  function sonucDom() {
    var r = D.sonuc;
    if (!r) return "";
    var uniteler = '<div class="mt-kutular">' +
      kutu(r.dogru, "DOĞRU") + kutu(r.yanlis, "YANLIŞ") + kutu("%" + r.yuzde, "BAŞARI") +
      kutu(sureYaz(r.ortSure), "ORTALAMA SÜRE/SORU") +
      (r.sureli ? kutu("hedef " + HEDEF_SN + " sn", "SÜRELİ MOD") : "") +
      '</div>';
    var yavas = '<div class="mt-yavasl"><b>🐢 En yavaş 3 soru</b><ol>' +
      r.enYavas.map(function (y) {
        return '<li>' + kacis(y.konu) + ' — <b class="rakam">' + sureYaz(y.sure) + '</b>' +
          (r.sureli && y.sure > HEDEF_SN ? ' <span class="mt-asim-uyari">(hedef aşıldı)</span>' : "") + '</li>';
      }).join("") + '</ol></div>';
    var yanlislar = r.yanlislar.length
      ? '<h3 class="mt-sonuc-baslik">✘ Yanlışlar (' + r.yanlislar.length + ')</h3>' + r.yanlislar.map(function (y) {
          var s = y.soru;
          return '<div class="mt-yanlis-bir"><b>' + kacis(s.konu) + ' · ' + kacis(s.ders) + '</b>' +
            kacis(s.soru) + '<div class="mt-dogru-sik" style="margin-top:5px">✔ Doğru şık: ' + HARFLER[s.dogru] + ') ' +
            kacis((s.secenekler || [])[s.dogru]) + '</div>' + aciklamaDom(s) + '</div>';
        }).join("")
      : '<div class="mt-not">Yanlış yok — hepsi doğru. 👏</div>';
    return '<div class="mt-sonuc">' +
      '<h3 class="mt-sonuc-baslik">Mini test bitti · ' + kacis(D.ders) + (D.konu === TUMU ? "" : " · " + kacis(D.konu)) + '</h3>' +
      '<p class="aciklama">' + kacis(D.sesliMetin) + '</p>' + uniteler + yavas + yanlislar +
      '<div class="mt-alt">' +
        '<button class="ka-dugme" data-mt="tekrar">🔄 Tekrar dene</button>' +
        '<button class="ka-dugme ka-ikincil" data-mt="zayif">🎯 Zayıf konuya test</button>' +
        '<button class="ka-dugme ka-ikincil" data-mt="defter">📕 Defterime git</button>' +
      '</div>' +
      '<div class="mt-not">Yanlışlar otomatik olarak yanlış defterine ve (varsa) kart tekrarına eklendi.</div>' +
      '</div>';
  }

  /* ───────────────────────── geçmiş tablosu ───────────────────────── */
  function gecmisDom() {
    var g = gecmis();
    var satir = g.map(function (k) {
      var t = Number(k.toplam) || 0;
      return '<tr><td class="rakam">' + tarihYaz(k.tarih) + '</td><td>' + kacis(k.ders) + '</td><td>' +
        kacis(k.konu === TUMU ? "Tüm konular" : k.konu) + '</td><td class="rakam">' + (Number(k.dogru) || 0) + " / " + t +
        '</td><td class="rakam">' + sureYaz(Math.round(Number(k.sureOrt) || 0)) + '</td></tr>';
    }).join("");
    if (!satir) satir = '<tr><td colspan="5" class="aciklama">Henüz mini test çözülmemiş.</td></tr>';
    return '<div class="mt-gecmis">' +
      '<h3>📚 Mini test geçmişi</h3>' +
      '<p class="aciklama">Toplam <b class="rakam">' + g.length + '</b> kayıt gösteriliyor (en yeni üstte, en fazla ' + MAX_KAYIT + ' kayıt tutulur).</p>' +
      '<table class="oyun-tablo"><thead><tr><th>Tarih</th><th>Ders</th><th>Konu</th><th>Doğru/Toplam</th><th>Ort. süre</th></tr></thead>' +
      '<tbody>' + satir + '</tbody></table>' +
      (g.length ? '<button class="ka-mini" data-mt="temizle">Geçmişi temizle</button>' : "") +
      '</div>';
  }

  /* ───────────────────────── çizim / görünüm ───────────────────────── */
  function ekranGoster(hangi) {
    var k = $("#mtKurulum"), t = $("#mtTest"), s = $("#mtSonuc");
    if (k) k.className = "mt-kurulum" + (hangi === "kurulum" ? "" : " mt-gizli");
    if (t) t.className = "mt-test" + (hangi === "test" ? "" : " mt-gizli");
    if (s) s.className = "mt-sonuc" + (hangi === "sonuc" ? "" : " mt-gizli");
  }
  function kurulumYenile() { var k = $("#mtKurulum"); if (k) k.innerHTML = kurulumDom(); }
  function testYenile() { var t = $("#mtTest"); if (t) t.innerHTML = testDom(); }
  function sonucYenile() { var s = $("#mtSonuc"); if (s) s.innerHTML = sonucDom(); }
  function gostergeYenile() { var u = $("#mtGosterge"); if (u) u.innerHTML = gostergeDom(); }
  function gecmisYenile() { var g = $("#mtGecmis"); if (g) g.innerHTML = gecmisDom(); }

  function ciz() {
    var kap = $("#minitestAlan");
    if (!kap) return;
    if (!D.ders && dersler().length) D.ders = dersler()[0].ad;
    kap.innerHTML =
      '<div id="mtGosterge">' + gostergeDom() + '</div>' +
      '<div class="mt-kurulum" id="mtKurulum">' + kurulumDom() + '</div>' +
      '<div class="mt-test mt-gizli" id="mtTest"></div>' +
      '<div class="mt-sonuc mt-gizli" id="mtSonuc"></div>' +
      '<div id="mtGecmis">' + gecmisDom() + '</div>';
    bagla();
    if (D.sorular.length && !D.tamam) { ekranGoster("test"); testYenile(); }
    else if (D.sonuc && D.tamam) { ekranGoster("sonuc"); sonucYenile(); }
    else ekranGoster("kurulum");
  }

  function bagla() {
    var kap = $("#minitestAlan");
    if (!kap || kap.getAttribute("data-mt-bagli")) return;
    kap.setAttribute("data-mt-bagli", "1");
    kap.addEventListener("click", tik);
  }

  function tik(e) {
    var el = e.target && e.target.closest ? e.target.closest("[data-mt]") : null;
    if (!el) return;
    var is = el.getAttribute("data-mt");
    if (is === "ders") { D.ders = el.getAttribute("data-ders"); D.konu = TUMU; kurulumYenile(); }
    else if (is === "konu") { D.konu = el.getAttribute("data-konu"); kurulumYenile(); }
    else if (is === "adet") { D.adet = parseInt(el.getAttribute("data-adet"), 10) || 10; kurulumYenile(); }
    else if (is === "sureli") { D.sureli = !D.sureli; kurulumYenile(); }
    else if (is === "basla") { basla(); }
    else if (is === "sec") { sec(parseInt(el.getAttribute("data-sec"), 10)); }
    else if (is === "sonraki" || is === "bitir") { ilerle(); }
    else if (is === "tekrar") { D.tamam = false; D.sonuc = null; kurulumYenile(); ekranGoster("kurulum"); }
    else if (is === "zayif") { zayifKonuyaTest(); }
    else if (is === "defter") { try { if (window.USTAD_MOTOR && USTAD_MOTOR.git) USTAD_MOTOR.git("defter"); } catch (e2) {} }
    else if (is === "temizle") { gecmisKoy([]); gecmisYenile(); gostergeYenile(); }
  }

  /* ───────────────────────── kronometre ───────────────────────── */
  function sayacBasla() {
    if (D.sayac) { clearInterval(D.sayac); D.sayac = null; }
    D.sayac = setInterval(sayacTik, 1000);
  }
  function sayacDurdur() { if (D.sayac) { clearInterval(D.sayac); D.sayac = null; } }
  function sayacTik() {
    var el = $("#mtKronometre");
    if (!el) { sayacDurdur(); return; }   /* bölümden çıkıldıysa sayacı boşa çalıştırma */
    var gecen = Math.max(0, Math.round((Date.now() - D.soruBasladi) / 1000));
    el.textContent = gecen + " sn";
    if (D.sureli && gecen > HEDEF_SN) el.classList.add("mt-asim");
  }

  /* ───────────────────────── test akışı ───────────────────────── */
  function basla() {
    if (!D.ders && dersler().length) D.ders = dersler()[0].ad;
    var liste = secimOlustur(D.ders, D.konu, D.adet);
    if (!liste.length) { ses("Bu seçimde soru bulunamadı."); return; }
    D.sorular = liste;
    D.i = 0; D.secimler = []; D.sureler = []; D.dogru = 0; D.yanlis = 0;
    D.sonuc = null; D.tamam = false; D.sesliMetin = "";
    D.basladi = Date.now(); D.soruBasladi = Date.now();
    sayacBasla();
    ekranGoster("test");
    testYenile();
    return liste.length;
  }

  /** Şık seçimi: süreyi ölçer, istatistiği ve yanlış konu sayacını işler, karta bildirir. */
  function sec(secIndex) {
    if (D.tamam || !D.sorular.length) return false;
    if (D.secimler[D.i] != null) return false;          /* aynı soruya iki kez cevap verilmez */
    var s = D.sorular[D.i];
    if (!s) return false;
    var gecen = Math.max(0, Math.round((Date.now() - D.soruBasladi) / 1000));
    D.secimler[D.i] = secIndex;
    D.sureler[D.i] = gecen;
    var dogruMu = secIndex === s.dogru;
    if (dogruMu) D.dogru++;
    else {
      D.yanlis++;
      yanlisKonuArttir(s.konu, s.ders);
      if (D.sureli && gecen > HEDEF_SN) D.uyari = sureUyari(gecen, HEDEF_SN);
      try { if (window.KARTLAR && KARTLAR.yanlisaEkle) KARTLAR.yanlisaEkle(s, secIndex); } catch (e) {}
    }
    istArttir(dogruMu);
    ses(dogruMu ? "Doğru" : "Yanlış. Doğru cevap " + HARFLER[s.dogru] + ". " + (s.aciklama || ""));
    testYenile();
    return true;
  }

  function ilerle() {
    if (D.secimler[D.i] == null) return false;
    if (D.i + 1 >= D.sorular.length) { bitir(); return true; }
    D.i++;
    D.soruBasladi = Date.now();
    testYenile();
    return true;
  }

  function bitir() {
    D.tamam = true;
    sayacDurdur();
    var toplam = D.sorular.length;
    var cevaplanan = D.dogru + D.yanlis;
    var sureTop = 0;
    D.sureler.forEach(function (x) { sureTop += (typeof x === "number" ? x : 0); });
    var yuzde = toplam ? Math.round((D.dogru / toplam) * 100) : 0;
    var ortSure = cevaplanan ? Math.round(sureTop / cevaplanan) : 0;
    var enYavas = D.sorular.map(function (s, ix) {
      return { konu: s.konu, ders: s.ders, sure: D.sureler[ix] || 0 };
    }).sort(function (a, b) { return b.sure - a.sure; }).slice(0, 3);
    var yanlislar = D.sorular.map(function (s, ix) {
      return { soru: s, secim: D.secimler[ix], ix: ix, sure: D.sureler[ix] || 0 };
    }).filter(function (x) { return x.secim != null && x.secim !== x.soru.dogru; });

    D.sonuc = { yuzde: yuzde, ortSure: ortSure, enYavas: enYavas, yanlislar: yanlislar,
                toplam: toplam, dogru: D.dogru, yanlis: D.yanlis, sureli: D.sureli, hedef: HEDEF_SN };

    /* geçmiş kaydı — en yeni üstte, en fazla 50 kayıt */
    var kayit = { tarih: Date.now(), ders: D.ders, konu: D.konu, dogru: D.dogru, yanlis: D.yanlis,
                  toplam: toplam, sureOrt: ortSure, sureler: D.sureler.slice() };
    var g = gecmis();
    g.unshift(kayit);
    gecmisKoy(g);

    /* sesli sonuç */
    D.sesliMetin = "Mini test bitti. " + toplam + " sorudan " + D.dogru + " doğru, " + D.yanlis +
      " yanlış. Başarı yüzde " + yuzde + ". Soru başına ortalama " + ortSure + " saniye." +
      (enYavas.length && ortSure ? " En yavaş konu: " + enYavas[0].konu + ", " + enYavas[0].sure + " saniye." : "");
    ses(D.sesliMetin);

    sonucYenile();
    ekranGoster("sonuc");
    gostergeYenile();
    gecmisYenile();
    return D.sonuc;
  }

  function zayifKonuyaTest() {
    var z = A.zayifKonu();
    if (!z) { ses("Henüz yanlış kaydı yok. Önce bir mini test çöz."); return false; }
    var bulunan = sorular().filter(function (s) { return s.konu === z.konu; });
    if (!bulunan.length) { ses("Bu konu bankada bulunamadı."); return false; }
    D.ders = z.ders || bulunan[0].ders;
    D.konu = z.konu;
    D.tamam = false; D.sonuc = null;
    var n = basla();
    return !!n;
  }

  /* ───────────────────────── bölüm açılışı (motor çağırır) ───────────────────────── */
  A.bolumAc = function (kod) { if (kod === "minitest") ciz(); };
  A.ciz = ciz;
  A.basla = basla;
  A.sec = sec;
  A.ilerle = ilerle;
  A.bitir = bitir;
  A.zayifKonuyaTest = zayifKonuyaTest;
  A.secimOlustur = secimOlustur;

  /* ───────────────────────── kendi kendini test (?test=1) ───────────────────────── */
  if (location.search.indexOf("test=1") >= 0) {
    var kos = function () {
      var t = [];
      var ok = function (ad, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : "")); };
      var al = function (s) { return localStorage.getItem("ustad." + s); };
      var koy = function (s, v) { try { localStorage.setItem("ustad." + s, JSON.stringify(v)); } catch (e) {} };
      var metin = function (sel) { var e = document.querySelector(sel); return e ? e.textContent : ""; };
      var say = function (sel) { return document.querySelectorAll(sel).length; };

      /* ── eski depoyu yedekle, bilinen tabana çek ── */
      var eskiIst = al("ist"), eskiYanlis = al("yanlisKonu"), eskiMt = al("minitest");
      koy("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 });
      koy("yanlisKonu", {});
      koy("minitest", []);

      /* ── ses ve kart kancaları (uydurma yok: gerçekten çağrıldı mı diye dinliyoruz) ── */
      var sesli = [], eskiKonus = null;
      try {
        if (window.KPSS_SES) { eskiKonus = window.KPSS_SES.konus; window.KPSS_SES.konus = function (m) { sesli.push(String(m || "")); }; }
      } catch (e) {}
      var kartlar = [], eskiKartlar = window.KARTLAR;
      try { window.KARTLAR = { yanlisaEkle: function (s, v) { kartlar.push(s && s.konu); } }; } catch (e) {}

      /* ── 1) kurulum ekranı ── */
      A.bolumAc("minitest");
      ok("arayüz: bölüm çizildi", !!document.querySelector("#minitestAlan .mt-kurulum"));
      var dersSay = say("#minitestAlan [data-mt='ders']");
      ok("kurulum: ders düğmeleri (ders sayısı kadar)", dersSay >= 4 && dersSay === dersler().length, dersSay + " düğme");
      var konuSay = say("#minitestAlan [data-mt='konu']");
      ok("kurulum: konu düğmeleri (tümü + konular)", konuSay >= 2, konuSay + " düğme");
      ok("kurulum: soru sayısı seçenekleri 5/10/20", say("#minitestAlan [data-mt='adet']") === 3, say("#minitestAlan [data-mt='adet']") + " düğme");
      ok("kurulum: göstergeler (4 kutu)", say("#minitestAlan .mt-kutu") === 4, say("#minitestAlan .mt-kutu") + " kutu");

      /* ── 2) ders + konu + adet seçimi ── */
      var dersD = document.querySelectorAll("#minitestAlan [data-mt='ders']");
      dersD[1].click();
      ok("seçim: ders seçildi", A.durum.ders === dersler()[1].ad, String(A.durum.ders));
      var konuD = document.querySelectorAll("#minitestAlan [data-mt='konu']");
      ok("seçim: konular seçilen derse göre tazelendi", konuD.length >= 2, konuD.length + " düğme");
      konuD[1].click();
      ok("seçim: konu seçildi", !!A.durum.konu && A.durum.konu !== "__tum__", String(A.durum.konu));
      document.querySelector("#minitestAlan [data-mt='adet'][data-adet='10']").click();
      ok("seçim: soru sayısı 10", A.durum.adet === 10, String(A.durum.adet));
      var suOnce = A.durum.sureli;
      document.querySelector("#minitestAlan [data-mt='sureli']").click();
      ok("seçim: süreli mod aç/kapa", A.durum.sureli === !suOnce, "süreli=" + A.durum.sureli);
      document.querySelector("#minitestAlan [data-mt='sureli']").click();
      ok("seçim: süreli mod geri açıldı", A.durum.sureli === suOnce, "süreli=" + A.durum.sureli);

      /* ── 3) test başlatma ── */
      document.querySelector("#minitestAlan [data-mt='basla']").click();
      ok("test: başlatıldı, 10 soru seçildi", A.durum.sorular.length === 10, A.durum.sorular.length + " soru");
      ok("test: şık sayısı 4 (A/B/C/D)", say("#minitestAlan .mt-sik") === 4, say("#minitestAlan .mt-sik") + " şık");
      ok("test: A/B/C/D harf etiketleri", (metin("#minitestAlan .mt-sik") || "").indexOf("A") === 0, metin("#minitestAlan .mt-sik").slice(0, 12));
      ok("test: ilerleme göstergesi 1 / 10", /1\s*\/\s*10/.test(metin("#mtIlerleme")), metin("#mtIlerleme"));

      var cevapla = function (ix, dogruMu) {
        var s = A.durum.sorular[ix];
        if (!s) return false;
        var secim = dogruMu ? s.dogru : (s.dogru + 1) % 4;
        var b = document.querySelector('#minitestAlan .mt-sik[data-sec="' + secim + '"]');
        if (!b) return false;
        b.click();
        var n = document.querySelector("#minitestAlan [data-mt='sonraki']") || document.querySelector("#minitestAlan [data-mt='bitir']");
        if (n) n.click();
        return true;
      };

      /* ── 4) doğru cevap akışı ── */
      var s0 = A.durum.sorular[0];
      document.querySelector('#minitestAlan .mt-sik[data-sec="' + s0.dogru + '"]').click();
      ok("cevap: doğru şık yeşil işaretlendi", !!document.querySelector("#minitestAlan .mt-sik.mt-dogru"));
      ok("cevap: doğru sayacı arttı", A.durum.dogru === 1 && A.durum.yanlis === 0, A.durum.dogru + " doğru / " + A.durum.yanlis + " yanlış");
      ok("cevap: süre kaydedildi (sureler dizisi)", A.durum.sureler.length === 1 && typeof A.durum.sureler[0] === "number",
         JSON.stringify(A.durum.sureler));
      ok("cevap: 'Doğru' sesli geri bildirimi", sesli.some(function (x) { return /Doğru/.test(x); }), String(sesli[0] || "—").slice(0, 40));
      ok("cevap: doğruda yanlış konu sayacı artmadı", Object.keys(yanlisKonu()).length === 0, Object.keys(yanlisKonu()).length + " kayıt");
      document.querySelector("#minitestAlan [data-mt='sonraki']").click();
      ok("ilerleme: sonraki soruya geçti", A.durum.i === 1, "i=" + A.durum.i);
      ok("ilerleme: gösterge 2 / 10", /2\s*\/\s*10/.test(metin("#mtIlerleme")), metin("#mtIlerleme"));

      /* ── 5) yanlış cevap akışı ── */
      var s1 = A.durum.sorular[1];
      var yanlisSec = (s1.dogru + 1) % 4;
      document.querySelector('#minitestAlan .mt-sik[data-sec="' + yanlisSec + '"]').click();
      ok("cevap: yanlış şık kırmızı işaretlendi", !!document.querySelector("#minitestAlan .mt-sik.mt-yanlis"));
      ok("cevap: doğru şık ayrıca gösterildi", !!document.querySelector("#minitestAlan .mt-sik.mt-dogru"));
      ok("cevap: açıklama metni gösterildi", metin("#minitestAlan .mt-geri").length > 20, metin("#minitestAlan .mt-geri").length + " karakter");
      ok("kayıt: yanlış konu sayacı (ustad.yanlisKonu)", (yanlisKonu()[s1.konu + "|" + s1.ders] || 0) === 1,
         JSON.stringify(yanlisKonu()));
      ok("kart: yanlış karta bildirildi", kartlar.length === 1 && kartlar[0] === s1.konu, JSON.stringify(kartlar));
      ok("cevap: süre dizisi büyüdü", A.durum.sureler.length === 2, A.durum.sureler.length + " süre");
      document.querySelector("#minitestAlan [data-mt='sonraki']").click();
      ok("ilerleme: yanlıştan sonra 3. soruya geçti", A.durum.i === 2, "i=" + A.durum.i);

      /* ── 6) testi bitir ── */
      var akis = [], uyum = 0;
      for (var i = 2; i < 10; i++) {
        var domSr = document.querySelector("#minitestAlan .mt-soru h4");
        var beklenen = A.durum.sorular[A.durum.i];
        if (domSr && beklenen && domSr.textContent === beklenen.soru) uyum++;
        if (A.durum.i !== i) akis.push("kayma:" + i + "≠" + A.durum.i);
        cevapla(i, true);
      }
      ok("akış: gösterilen soru ile iç durum uyumlu (8 adım)", uyum === 8 && !akis.length, uyum + "/8 " + akis.join(" "));
      ok("sonuç: ekran çizildi", !!document.querySelector("#minitestAlan .mt-sonuc"));
      ok("sonuç: doğru/yanlış sayısı", A.durum.sonuc && A.durum.sonuc.dogru === 9 && A.durum.sonuc.yanlis === 1,
         A.durum.sonuc ? A.durum.sonuc.dogru + "/" + A.durum.sonuc.yanlis : "—");
      ok("sonuç: yüzde doğru hesaplandı (%90)", A.durum.sonuc && A.durum.sonuc.yuzde === 90,
         A.durum.sonuc ? "%" + A.durum.sonuc.yuzde : "—");
      ok("sonuç: ortalama süre sayı", A.durum.sonuc && typeof A.durum.sonuc.ortSure === "number", A.durum.sonuc ? A.durum.sonuc.ortSure + " sn" : "—");
      ok("sonuç: en yavaş 3 soru listesi", A.durum.sonuc && A.durum.sonuc.enYavas.length === 3,
         A.durum.sonuc ? A.durum.sonuc.enYavas.length + " satır" : "—");
      ok("sonuç: yanlış listesi (konu + doğru şık + açıklama)", A.durum.sonuc && A.durum.sonuc.yanlislar.length === 1,
         A.durum.sonuc ? A.durum.sonuc.yanlislar.length + " yanlış" : "—");
      ok("sonuç: metinde yüzde yazıyor", /%90/.test(metin("#minitestAlan .mt-sonuc")), "aranan: %90");
      ok("süre: 10 sorunun süresi kayıtlı", A.durum.sureler.length === 10, A.durum.sureler.length + " süre");

      /* ── 7) kalıcı kayıtlar ── */
      var g = A.gecmis();
      ok("geçmiş: kayıt yazıldı (ustad.minitest)", g.length === 1, g.length + " kayıt");
      ok("geçmiş: kayıt alanları tam", g.length === 1 && typeof g[0].tarih === "number" && g[0].ders && g[0].konu &&
         g[0].dogru === 9 && g[0].toplam === 10 && typeof g[0].sureOrt === "number" && (g[0].sureler || []).length === 10,
         g.length ? JSON.stringify({ ders: g[0].ders, konu: g[0].konu, dogru: g[0].dogru, toplam: g[0].toplam, sureler: (g[0].sureler || []).length }) : "—");
      var istS = ist();
      ok("istatistik: ustad.ist güncellendi", istS.cozulen === 10 && istS.dogru === 9 && istS.yanlis === 1, JSON.stringify(istS));
      ok("geçmiş tablosu: satır sayısı = kayıt sayısı", say("#minitestAlan .oyun-tablo tbody tr") === 1,
         say("#minitestAlan .oyun-tablo tbody tr") + " satır");
      ok("süre: aşım uyarısı metni", A.sureUyari(82, 70) === "Bu soru 82 sn sürdü, hedef 70 sn", A.sureUyari(82, 70));

      /* ── 8) sesli sonuç okuması ── */
      ok("sesli: sonuç okundu", sesli.some(function (x) { return /Mini test bitti/.test(x); }),
         String(sesli[sesli.length - 1] || "—").slice(0, 60));

      /* ── 9) sonuç düğmeleri ── */
      var zb = document.querySelector("#minitestAlan [data-mt='zayif']");
      ok("düğme: 'zayıf konuya test' var", !!zb);
      if (zb) zb.click();
      ok("düğme: zayıf konuya test başlattı", A.durum.sorular.length > 0 && A.durum.konu === s1.konu,
         "konu=" + A.durum.konu + " · " + A.durum.sorular.length + " soru");
      A.bitir();
      var tb = document.querySelector("#minitestAlan [data-mt='tekrar']");
      ok("düğme: 'tekrar dene' var", !!tb);
      if (tb) tb.click();
      ok("düğme: 'tekrar dene' kurulum ekranına döndü",
         !!document.querySelector("#minitestAlan .mt-kurulum") && !document.querySelector("#minitestAlan .mt-kurulum").classList.contains("mt-gizli"),
         say("#minitestAlan [data-mt='ders']") + " ders düğmesi");

      /* ── eski depoyu geri koy ── */
      if (eskiIst === null) { try { localStorage.removeItem("ustad.ist"); } catch (e) {} } else { try { localStorage.setItem("ustad.ist", eskiIst); } catch (e) {} }
      if (eskiYanlis === null) { try { localStorage.removeItem("ustad.yanlisKonu"); } catch (e) {} } else { try { localStorage.setItem("ustad.yanlisKonu", eskiYanlis); } catch (e) {} }
      if (eskiMt === null) { try { localStorage.removeItem("ustad.minitest"); } catch (e) {} } else { try { localStorage.setItem("ustad.minitest", eskiMt); } catch (e) {} }
      try { if (window.KPSS_SES && eskiKonus) window.KPSS_SES.konus = eskiKonus; } catch (e) {}
      try { window.KARTLAR = eskiKartlar; } catch (e) {}

      var gecenSayi = t.filter(function (x) { return x.indexOf("✔") === 0; }).length;
      document.title = (document.title || "") + " MINITESTTEST " + gecenSayi + "/" + t.length;
      ok("başlık: document.title'e MINITESTTEST eklendi", document.title.indexOf("MINITESTTEST") >= 0, "…" + document.title.slice(-24));
      gecenSayi = t.filter(function (x) { return x.indexOf("✔") === 0; }).length;

      var kap = document.createElement("div");
      kap.id = "minitestTestSonuc";
      kap.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
      kap.innerHTML = "<h3>ÜSTAD KOÇ PRO · Mini Test testi (çevrimdışı)</h3>" +
        t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
        "<hr><b>" + gecenSayi + " / " + t.length + " geçti</b>";
      document.body.appendChild(kap);
    };
    if (document.readyState === "complete") setTimeout(kos, 500);
    else window.addEventListener("load", function () { setTimeout(kos, 500); });
  }
})();
