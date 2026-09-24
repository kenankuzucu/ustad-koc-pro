/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Deneme Analizi · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Bu bölüm yalnızca CİHAZDAKİ GERÇEK VERİYİ okur ve gösterir; hiçbir sayı uydurulmaz, ağa istek yapılmaz.
   Veri kaynakları (localStorage): ustad.ka.denemeler (hızlı deneme geçmişi), ustad.ka.hedef (hedef doğru),
   ustad.yanlisKonu (konu|ders → yanlış adedi), ustad.minitest (mini test geçmişi), ustad.ist (toplam istatistik).
   Net gelişim grafiği elle çizilen SVG'dir — harici kütüphane YOK. */
(function () {
  "use strict";
  var A = window.DANALIZ = window.DANALIZ || {};

  /* ───────────── küçük yardımcılar ───────────── */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function depoAl(k, v) { try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } }
  function depoKoy(k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); } catch (e) {} }
  function depoVar(k) { try { return localStorage.getItem("ustad." + k) !== null; } catch (e) { return false; } }
  function depoSil(k) { try { localStorage.removeItem("ustad." + k); } catch (e) {} }
  function sayi(x, v) {
    var n = typeof x === "number" ? x : parseFloat(String(x == null ? "" : x).replace(",", "."));
    return isFinite(n) ? n : v;
  }
  function tam(x, v) { var n = sayi(x, v); return isFinite(n) ? Math.round(n) : v; }
  function kirp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function yuzdeStr(x) { var r = Math.round(x * 10) / 10; return String(r).replace(".", ","); }
  function trTarih(t) {
    try { var d = new Date(t); if (isNaN(d.getTime())) return "—"; return d.toLocaleDateString("tr-TR"); }
    catch (e) { return "—"; }
  }
  function kisaTarih(t) {
    try {
      var d = new Date(t); if (isNaN(d.getTime())) return "—";
      var g = d.getDate(), a = d.getMonth() + 1;
      return (g < 10 ? "0" : "") + g + "." + (a < 10 ? "0" : "") + a;
    } catch (e) { return "—"; }
  }
  function ses(metin) { try { if (window.KPSS_SES && window.KPSS_SES.konus) window.KPSS_SES.konus(metin); } catch (e) {} }
  function git(kod) { try { if (window.USTAD_MOTOR && window.USTAD_MOTOR.git) window.USTAD_MOTOR.git(kod); } catch (e) {} }
  function buyuk(s) { s = String(s || ""); return s ? s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1) : s; }

  /* ───────────── 1) VERİ OKUMA ───────────── */
  A.veriOku = function () {
    var ham = depoAl("ka.denemeler", []);
    var liste = (Array.isArray(ham) ? ham : []).filter(function (d) { return d && typeof d === "object"; })
      .map(function (d, i) {
        return {
          id: d.id == null ? "d" + i : String(d.id),
          tarih: d.tarih || d.tarihISO || "",
          tDogru: kirp(tam(d.tDogru, 0), 0, 120),
          yuzde: d.yuzde == null ? null : sayi(d.yuzde, null),
          gosterge: d.gosterge == null ? null : sayi(d.gosterge, null),
          kalan: d.Kalan != null ? d.Kalan : (d.kalan != null ? d.kalan : null),
          dy: d.DogruYanlis || d.dogruYanlis || null,
          sira: i
        };
      });
    liste.sort(function (a, b) {
      var ta = Date.parse(a.tarih), tb = Date.parse(b.tarih);
      if (isFinite(ta) && isFinite(tb) && ta !== tb) return ta - tb;
      return a.sira - b.sira;
    });
    var hedef = kirp(tam(depoAl("ka.hedef", 85), 85), 0, 120);
    var yanlisKonu = depoAl("yanlisKonu", {});
    if (!yanlisKonu || typeof yanlisKonu !== "object") yanlisKonu = {};
    var mt = depoAl("minitest", []);
    var ist = depoAl("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 });
    return {
      denemeler: liste, hedef: hedef, yanlisKonu: yanlisKonu,
      minitest: Array.isArray(mt) ? mt : [], ist: (ist && typeof ist === "object") ? ist : {},
      dersler: ((window.USTAD_PAKET || {}).dersler || [])
    };
  };

  /* ───────────── 2) MODEL (ölçülen sayılar) ───────────── */
  A.model = function (v) {
    v = v || A.veriOku();
    var l = v.denemeler, n = l.length, son = n ? l[n - 1] : null;
    var egilim = "veri yok", trend = null;
    if (n === 1) egilim = "tek deneme";
    else if (n > 1) {
      trend = son.tDogru - l[n - 2].tDogru;
      egilim = trend > 0 ? "yükseliyor" : (trend < 0 ? "düşüyor" : "sabit");
    }
    var ucFark = n >= 3 ? son.tDogru - l[n - 3].tDogru : null;
    var toplam = 0;
    l.forEach(function (x) { toplam += x.tDogru; });
    return {
      adet: n, liste: l, son: son, hedef: v.hedef,
      fark: son ? son.tDogru - v.hedef : null,
      egilim: egilim, trend: trend, ucFark: ucFark,
      ortalama: n ? Math.round(toplam / n * 10) / 10 : 0,
      son20: l.slice(-20)
    };
  };

  /* ───────────── 3) DERS BAZLI YANLIŞ DAĞILIMI ───────────── */
  A.dersYanlis = function (v) {
    v = v || A.veriOku();
    var harita = {};
    Object.keys(v.yanlisKonu || {}).forEach(function (k) {
      var adet = tam(v.yanlisKonu[k], 0);
      if (adet <= 0) return;
      var p = String(k).split("|");
      var konu = (p[0] || "").trim() || "Konu";
      var ders = (p[1] || "").trim() || "Diğer";
      if (!harita[ders]) harita[ders] = { ders: ders, adet: 0, konular: {} };
      harita[ders].adet += adet;
      harita[ders].konular[konu] = (harita[ders].konular[konu] || 0) + adet;
    });
    var toplam = 0;
    var liste = Object.keys(harita).map(function (d) { toplam += harita[d].adet; return harita[d]; })
      .sort(function (a, b) { return b.adet - a.adet || String(a.ders).localeCompare(String(b.ders), "tr"); });
    liste.forEach(function (x) {
      x.enCok = Object.keys(x.konular).sort(function (a, b) { return x.konular[b] - x.konular[a] || String(a).localeCompare(String(b), "tr"); })[0] || "";
      x.enCokAdet = x.enCok ? x.konular[x.enCok] : 0;
      x.pay = toplam ? Math.round(x.adet / toplam * 1000) / 10 : 0;
    });
    return { liste: liste, toplam: toplam };
  };

  /* ───────────── 4) MİNİ TEST GEÇMİŞİ ───────────── */
  A.miniTestler = function (v) {
    v = v || A.veriOku();
    var harita = {};
    (v.minitest || []).forEach(function (x) {
      if (!x || typeof x !== "object") return;
      var konu = String(x.konu || "").trim() || "Konu";
      var ders = String(x.ders || "").trim();
      var toplam = sayi(x.toplam, 0);
      if (toplam <= 0) toplam = sayi(x.tDogru, 0);
      if (toplam <= 0) return;
      var dogru = kirp(sayi(x.dogru, 0), 0, toplam);
      var sure = x.sureOrt == null ? null : sayi(x.sureOrt, null);
      if (sure === null && Array.isArray(x.sureler) && x.sureler.length) {
        var t = 0;
        x.sureler.forEach(function (s) { t += sayi(s, 0); });
        sure = t / x.sureler.length;
      }
      var anahtar = (ders ? ders + " · " : "") + konu;
      if (!harita[anahtar]) harita[anahtar] = { konu: konu, ders: ders, deneme: 0, dogru: 0, toplam: 0, sureTop: 0, sureAdet: 0 };
      var h = harita[anahtar];
      h.deneme++; h.dogru += dogru; h.toplam += toplam;
      if (sure !== null && isFinite(sure)) { h.sureTop += sure; h.sureAdet++; }
    });
    return Object.keys(harita).map(function (k) {
      var h = harita[k];
      h.basari = h.toplam ? Math.round(h.dogru / h.toplam * 100) : 0;
      h.sure = h.sureAdet ? Math.round(h.sureTop / h.sureAdet) : null;
      return h;
    }).sort(function (a, b) { return a.basari - b.basari || b.toplam - a.toplam || String(a.konu).localeCompare(String(b.konu), "tr"); });
  };

  /* ───────────── 5) OTOMATİK YORUM (yalnızca sayılardan) ───────────── */
  A.yorum = function (v, m) {
    v = v || A.veriOku();
    m = m || A.model(v);
    if (!m.adet) {
      return "Kayıtlı deneme yok; grafik ve tablo ilk deneme kaydedilince oluşur. Net & Puan bölümünde sonucunu girip kaydedebilir " +
        "ya da Deneme Sınavı bölümünde 120 soruluk provayı çözebilirsin.";
    }
    var s = [];
    if (m.adet >= 3 && m.ucFark !== null) {
      s.push(m.ucFark >= 0 ? "Son 3 denemede netin " + m.ucFark + " arttı."
        : "Son 3 denemede netin " + Math.abs(m.ucFark) + " azaldı.");
    } else if (m.adet === 2) {
      s.push("İki denemede doğrun " + m.liste[0].tDogru + " → " + m.son.tDogru + " oldu.");
    }
    s.push(m.fark >= 0
      ? "Son denemende " + m.son.tDogru + " doğru yaptın; hedefini (" + m.hedef + ") " + m.fark + " doğru aştın."
      : "Son denemende " + m.son.tDogru + " doğru yaptın; hedefe (" + m.hedef + ") " + Math.abs(m.fark) + " doğru kaldı.");
    var y = A.dersYanlis(v);
    if (y.liste.length && y.toplam > 0) {
      var bir = y.liste[0];
      s.push("En çok yanlışın " + bir.ders + ": " + bir.adet + " yanlış" +
        (bir.enCok && bir.enCokAdet ? " (" + bir.enCok + " " + bir.enCokAdet + ")" : "") +
        "; tüm yanlışların %" + yuzdeStr(bir.pay) + "'i bu derste.");
    }
    var mt = A.miniTestler(v);
    if (mt.length) {
      var z = mt[0];
      s.push("Mini testlerde en zayıf konun " + z.konu + " (" + z.ders + "): %" + z.basari + " başarı" +
        (z.sure !== null ? ", ortalama " + z.sure + " sn" : "") + ".");
    }
    if (m.adet >= 2) {
      s.push(m.adet + " denemede ortalaman " + yuzdeStr(m.ortalama) + " doğru; eğilim " + m.egilim + ".");
    }
    return s.slice(0, 5).join(" ");
  };
  A.yorumDinle = function () { var y = A.yorum(); ses(y); return y; };

  /* ───────────── 6) NET GELİŞİM GRAFİĞİ (elle çizilen SVG) ───────────── */
  A.grafikSVG = function (liste, hedef) {
    liste = liste || [];
    var n = liste.length;
    if (!n) return "";
    var G = 720, Y = 330, sol = 48, sag = G - 18, ust = 26, alt = Y - 74;
    var adim = n > 1 ? (sag - sol) / (n - 1) : 0;
    var px = function (i) { return n > 1 ? sol + i * adim : Math.round((sol + sag) / 2); };
    var py = function (v) { return alt - (kirp(sayi(v, 0), 0, 120) / 120) * (alt - ust); };
    var s = [];
    s.push('<svg class="da-grafik" viewBox="0 0 ' + G + " " + Y + '" preserveAspectRatio="xMidYMid meet" role="img" ' +
      'aria-label="Net gelişim grafiği: ' + n + ' deneme, hedef ' + hedef + ' doğru">');
    /* yatay kılavuz çizgileri + eksen sayıları (0-120) */
    [0, 30, 60, 90, 120].forEach(function (v) {
      var y = Math.round(py(v) * 10) / 10;
      s.push('<line class="da-izgara" x1="' + sol + '" y1="' + y + '" x2="' + sag + '" y2="' + y + '"/>');
      s.push('<text class="da-eksen" x="' + (sol - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + v + "</text>");
    });
    /* hedef seviyesi — kesikli çizgi (etiket solda: son nokta değer etiketiyle çakışmasın) */
    var hy = Math.round(py(hedef) * 10) / 10;
    s.push('<line class="da-hedef" x1="' + sol + '" y1="' + hy + '" x2="' + sag + '" y2="' + hy + '"/>');
    s.push('<text class="da-hedef-yazi" x="' + (sol + 4) + '" y="' + (hy - 6) + '" text-anchor="start">hedef ' + hedef + "</text>");
    /* doğru sayısı çizgisi */
    var d = liste.map(function (x, i) { return (i ? "L" : "M") + px(i) + " " + Math.round(py(x.tDogru) * 10) / 10; }).join(" ");
    s.push('<path class="da-cizgi" d="' + d + '"/>');
    /* noktalar + değer etiketleri + döndürülmüş tarih etiketleri */
    liste.forEach(function (x, i) {
      var cx = Math.round(px(i) * 10) / 10, cy = Math.round(py(x.tDogru) * 10) / 10, son = (i === n - 1);
      s.push('<circle class="da-nokta' + (son ? " son" : "") + '" cx="' + cx + '" cy="' + cy + '" r="' + (son ? 6.5 : 4.2) + '"/>');
      s.push('<text class="da-deger' + (son ? " son" : "") + '" x="' + cx + '" y="' + (cy - (son ? 13 : 10)) +
        '" text-anchor="middle">' + x.tDogru + "</text>");
      var et = kisaTarih(x.tarih);
      if (et === "—") et = "#" + (i + 1);
      var ly = alt + 18;
      s.push('<text class="da-tarih" x="' + cx + '" y="' + ly + '" text-anchor="end" transform="rotate(-35 ' + cx + " " + ly + ')">' +
        kacis(et) + "</text>");
    });
    s.push("</svg>");
    return s.join("");
  };

  /* ───────────── 7) ÇİZİM ───────────── */
  function dersBilgi(dersler, ad) {
    for (var i = 0; i < (dersler || []).length; i++) {
      if (String(dersler[i].ad) === String(ad)) {
        return { simg: dersler[i].simg || "", konuSayisi: (dersler[i].konular || []).length, bolum: dersler[i].bolum || "" };
      }
    }
    return { simg: "", konuSayisi: 0, bolum: "" };
  }
  function kutu(etiket, deger, alt) {
    return '<div class="da-kutu"><b>' + kacis(deger) + "</b><span>" + kacis(etiket) + "</span>" +
      (alt ? "<i>" + kacis(alt) + "</i>" : "") + "</div>";
  }
  function bolum(no, baslik, ic) {
    return '<div class="da-bolum"><h3 class="da-baslik">' + no + ") " + kacis(baslik) + "</h3>" + ic + "</div>";
  }

  function ciz() {
    var kap = $("#danalizAlan");
    if (!kap) return null;
    var v = A.veriOku(), m = A.model(v), y = A.dersYanlis(v), mt = A.miniTestler(v);
    var h = [];

    /* 1) gösterge kutuları */
    h.push('<div class="da-bolum da-ilk"><h3 class="da-baslik">1) Gösterge kutuları</h3>' +
      '<div class="da-kutular">' +
      kutu("DENEME SAYISI", String(m.adet), m.adet ? "kayıtlı deneme" : "kayıt yok") +
      kutu("SON DOĞRU", m.son ? m.son.tDogru + "/120" : "—", m.son ? trTarih(m.son.tarih) : "kayıt yok") +
      kutu("HEDEF FARKI", m.fark === null ? "—" : (m.fark >= 0 ? "+" + m.fark : String(m.fark)), "hedef " + v.hedef + " doğru") +
      kutu("NET EĞİLİMİ", buyuk(m.egilim), m.trend === null ? "karşılaştırma yok" : "son iki deneme " + (m.trend >= 0 ? "+" : "") + m.trend) +
      "</div></div>");

    /* 7) veri yoksa boş durum (en üstte değil, hemen gösterge altında) */
    if (!m.adet) {
      h.push('<div class="da-bolum"><div class="da-bos" id="daBos">' +
        "<h4>📈 Kayıtlı deneme yok</h4>" +
        "<p>Grafik, tablo ve yorum <b>ilk deneme kaydedildiğinde</b> otomatik oluşur. Deneme iki yoldan kaydedilir:</p>" +
        '<ol class="da-adimlar">' +
        "<li><b>Net &amp; Puan</b> bölümü (kod: <code>puan</code>) → doğru/yanlış sayılarını gir, “Bu denemeyi kaydet”e bas.</li>" +
        "<li><b>Deneme Sınavı</b> bölümü (kod: <code>deneme</code>) → 120 soruluk provayı çöz; sonuç otomatik kaydedilir.</li>" +
        "</ol>" +
        '<div class="ka-butonlar da-butonlar">' +
        '<button class="ka-dugme" id="daGitPuan" data-git="puan" type="button">🧮 Net &amp; Puan’a git</button>' +
        '<button class="ka-dugme ka-ikincil" id="daGitDeneme" data-git="deneme" type="button">🎯 Deneme Sınavı’na git</button>' +
        "</div></div></div>");
    }

    /* 2) net gelişim grafiği */
    if (m.adet) {
      h.push(bolum(2, "Net gelişim grafiği" + (m.adet > 20 ? " (son 20 deneme)" : ""),
        '<p class="aciklama">Yatay eksen deneme sırası (tarih etiketi döndürülmüş), dikey eksen 0-120 doğru. ' +
        "Kırmızı kesikli çizgi hedefin (" + v.hedef + " doğru), büyük nokta son denemen. Elle çizilen SVG grafik; harici kütüphane yok.</p>" +
        '<div class="da-grafik-kap">' + A.grafikSVG(m.son20, v.hedef) + "</div>"));
    } else {
      h.push(bolum(2, "Net gelişim grafiği",
        '<p class="da-bos-yazi">Kayıtlı deneme olmadığı için grafik çizilemedi. İlk denemeyi kaydettiğinde çizgi burada oluşur.</p>'));
    }

    /* 3) deneme tablosu */
    if (m.adet) {
      var topD = 0, topYuz = 0, yuzSay = 0, topG = 0, gSay = 0, topF = 0;
      var satir = m.liste.map(function (x, i) {
        var f = x.tDogru - v.hedef;
        topD += x.tDogru; topF += f;
        if (x.yuzde !== null) { topYuz += x.yuzde; yuzSay++; }
        if (x.gosterge !== null) { topG += x.gosterge; gSay++; }
        return "<tr><td class='rakam'>" + (i + 1) + "</td><td>" + kacis(trTarih(x.tarih)) +
          "</td><td class='rakam'><b>" + x.tDogru + "</b></td><td class='rakam'>" +
          (x.yuzde === null ? "—" : yuzdeStr(x.yuzde) + "%") + "</td><td class='rakam'>" +
          (x.gosterge === null ? "—" : Math.round(x.gosterge)) + "</td><td class='rakam " +
          (f >= 0 ? "da-arti" : "da-eksi") + "'>" + (f >= 0 ? "+" + f : f) + "</td></tr>";
      }).join("");
      var ortF = Math.round(topF / m.adet);
      h.push(bolum(3, "Deneme tablosu",
        '<table class="oyun-tablo da-tablo"><thead><tr><th>Sıra</th><th>Tarih</th><th>Doğru</th><th>Yüzde</th>' +
        "<th>Gösterge Puan</th><th>Hedef Farkı</th></tr></thead><tbody>" + satir +
        '<tr class="toplam"><td>TOPLAM</td><td>' + m.adet + " deneme</td><td class='rakam'>" + topD +
        "</td><td class='rakam'>" + (yuzSay ? yuzdeStr(topYuz / yuzSay) + "%" : "—") +
        "</td><td class='rakam'>" + (gSay ? Math.round(topG / gSay) : "—") +
        "</td><td class='rakam " + (ortF >= 0 ? "da-arti" : "da-eksi") + "'>" + (ortF >= 0 ? "+" + ortF : ortF) +
        "</td></tr></tbody></table>" +
        '<p class="aciklama">Üstteki satırlar en eskiden yeniye sıralıdır; yüzde = doğru / 120, hedef farkı = doğru − hedef (' + v.hedef + ").</p>") +
        '<p class="da-sayi">' + m.adet + " deneme · toplam " + topD + " doğru · ortalama " + yuzdeStr(m.ortalama) + " doğru</p>");
    } else {
      h.push(bolum(3, "Deneme tablosu", '<p class="da-bos-yazi">Tabloda gösterilecek deneme kaydı yok.</p>'));
    }

    /* 4) ders bazlı yanlış dağılımı */
    if (y.liste.length) {
      var cubuklar = y.liste.map(function (x, i) {
        var bilgi = dersBilgi(v.dersler, x.ders);
        var enCok = i === 0 ? " da-en-cok" : "";
        return '<li class="da-cubuk-satir' + enCok + '">' +
          '<div class="da-cubuk-ust"><b>' + (i + 1) + ") " + (bilgi.simg ? bilgi.simg + " " : "") + kacis(x.ders) + "</b>" +
          "<span>" + x.adet + " yanlış · %" + yuzdeStr(x.pay) + "</span></div>" +
          '<div class="da-cubuk"><i style="width:' + kirp(Math.max(3, Math.round(x.pay)), 3, 100) + '%"></i></div>' +
          (x.enCok ? '<p class="da-cubuk-alt">en çok: ' + kacis(x.enCok) + " (" + x.enCokAdet + " yanlış)" +
            (bilgi.konuSayisi ? " · dersin " + bilgi.konuSayisi + " konusu var" : "") + "</p>" : "") +
          "</li>";
      }).join("");
      h.push(bolum(4, "Ders bazlı yanlış dağılımı",
        '<p class="aciklama">Yanlış kayıtları derse göre toplandı; en çok yanlış yapılan ders en üstte.</p>' +
        '<ol class="da-cubuklar">' + cubuklar + "</ol>" +
        '<p class="da-sayi">' + y.liste.length + " ders · toplam " + y.toplam + " yanlış</p>"));
    } else {
      h.push(bolum(4, "Ders bazlı yanlış dağılımı",
        '<p class="da-bos-yazi">Yanlış kaydı yok. Test ve deneme çözdükçe yanlış yaptığın dersler burada çubuklarla listelenir.</p>'));
    }

    /* 5) mini test geçmişi */
    if (mt.length) {
      var zayifSay = Math.min(5, mt.length);
      var mSatir = mt.map(function (x, i) {
        var zayif = i < zayifSay;
        return "<tr" + (zayif ? ' class="da-zayif"' : "") + "><td>" + kacis(x.konu) +
          (x.ders ? ' <span class="da-mini-ders">' + kacis(x.ders) + "</span>" : "") +
          (zayif && mt.length > 5 ? '<span class="da-zayif-etiket">en zayıf</span>' : "") +
          "</td><td class='rakam'>" + x.deneme + "</td><td class='rakam'>%" + x.basari +
          "</td><td class='rakam'>" + (x.sure === null ? "—" : x.sure + " sn") + "</td></tr>";
      }).join("");
      h.push(bolum(5, "Mini test geçmişi",
        '<table class="oyun-tablo da-mini-tablo"><thead><tr><th>Konu</th><th>Deneme</th><th>Başarı</th>' +
        "<th>Ortalama Süre</th></tr></thead><tbody>" + mSatir + "</tbody></table>" +
        '<p class="aciklama">Konular başarıya göre (en düşükten) sıralıdır; ilk ' + zayifSay + " satır işaretli.</p>" +
        '<p class="da-sayi">' + mt.length + " konu · toplam " +
        mt.reduce(function (t, x) { return t + x.deneme; }, 0) + " mini test</p>"));
    } else {
      h.push(bolum(5, "Mini test geçmişi",
        '<p class="da-bos-yazi">Mini test kaydı yok. Mini Test bölümünü çözdükçe konu bazlı başarı ve ortalama süre burada listelenir.</p>'));
    }

    /* 6) otomatik yorum + düğmeler */
    h.push(bolum(6, "Otomatik yorum",
      '<div class="da-yorum" id="daYorum"><p>' + kacis(A.yorum(v, m)) + "</p></div>" +
      '<div class="ka-butonlar da-butonlar">' +
      '<button class="ka-dugme" id="daDinle" type="button">🔊 Yorumu dinle</button>' +
      '<button class="ka-dugme ka-ikincil" id="daKoc" type="button">🤖 Koç AI’ya sor</button>' +
      '<button class="ka-dugme ka-ikincil" id="daYazdir" type="button">🖨 PDF gibi paylaş / yazdır</button>' +
      "</div>" +
      '<p class="da-not">Yorumdaki her cümle cihazındaki kayıtlı sayılardan üretilir; tahmin veya uydurma bilgi yoktur. ' +
      "Yanlışlar; Testler, Deneme Sınavı ve Mini Test bölümleri çözüldükçe ders bazında birikir.</p>"));

    kap.innerHTML = h.join("");

    /* düğme bağlantıları */
    var d1 = $("#daDinle"); if (d1) d1.addEventListener("click", function () { A.yorumDinle(); });
    var d2 = $("#daKoc"); if (d2) d2.addEventListener("click", function () { git("kocai"); });
    var d3 = $("#daYazdir"); if (d3) d3.addEventListener("click", function () { try { window.print(); } catch (e) {} });
    var d4 = $("#daGitPuan"); if (d4) d4.addEventListener("click", function () { git("puan"); });
    var d5 = $("#daGitDeneme"); if (d5) d5.addEventListener("click", function () { git("deneme"); });

    try { window.__danalizSon = { adet: m.adet, egilim: m.egilim, fark: m.fark, ders: y.liste.length, konu: mt.length }; } catch (e) {}
    return v;
  }

  A.bolumAc = function (kod) { if (kod === "danaliz") ciz(); };
  A.ciz = ciz;
  A.bosDurum = function () { return !A.model().adet; };

  /* ───────────── 8) KENDİ KENDİNİ TEST (?test=1) ───────────── */
  if (location.search.indexOf("test=1") >= 0) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        var t = [], ok = function (ad2, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad2 + (ek ? " → " + ek : "")); };

        /* eski hâli sakla */
        var eskiD = depoVar("ka.denemeler") ? depoAl("ka.denemeler", null) : null;
        var eskiH = depoVar("ka.hedef") ? depoAl("ka.hedef", null) : null;
        var eskiY = depoVar("yanlisKonu") ? depoAl("yanlisKonu", null) : null;
        var eskiM = depoVar("minitest") ? depoAl("minitest", null) : null;
        var eskiDV = { d: depoVar("ka.denemeler"), h: depoVar("ka.hedef"), y: depoVar("yanlisKonu"), m: depoVar("minitest") };

        /* sentetik veri */
        var simdi = Date.now(), gun = 86400000;
        var dog = [40, 52, 60, 71, 78];
        var besli = dog.map(function (d, i) {
          return { id: "t" + i, tarih: new Date(simdi - (dog.length - 1 - i) * 3 * gun).toISOString(),
                   tDogru: d, yuzde: Math.round(d / 120 * 1000) / 10, gosterge: Math.round(30 + d * 0.3) };
        });
        depoKoy("ka.denemeler", besli);
        depoKoy("ka.hedef", 85);
        depoKoy("yanlisKonu", { "Paragraf|Türkçe": 7, "Sözcükte Anlam|Türkçe": 3, "Problemler|Matematik": 5, "Nüfus|Coğrafya": 2 });
        depoKoy("minitest", [
          { tarih: new Date(simdi - 3 * gun).toISOString(), ders: "Türkçe", konu: "Paragraf", dogru: 4, toplam: 10, sureOrt: 42, sureler: [40, 44] },
          { tarih: new Date(simdi - 2 * gun).toISOString(), ders: "Matematik", konu: "Problemler", dogru: 8, toplam: 10, sureOrt: 30, sureler: [28, 32] },
          { tarih: new Date(simdi - gun).toISOString(), ders: "Türkçe", konu: "Paragraf", dogru: 5, toplam: 10, sureOrt: 38, sureler: [36, 40] }
        ]);

        /* — veri/model — */
        var v = A.veriOku(), m = A.model(v);
        ok("veri: 5 deneme okundu", m.adet === 5, m.adet + " deneme");
        ok("veri: kronolojik sıra 40,52,60,71,78", m.liste.map(function (x) { return x.tDogru; }).join(",") === "40,52,60,71,78",
           m.liste.map(function (x) { return x.tDogru; }).join(","));
        ok("veri: hedef 85", v.hedef === 85, String(v.hedef));
        ok("veri: yanlış konu 4 kayıt", Object.keys(v.yanlisKonu).length === 4, Object.keys(v.yanlisKonu).length + " kayıt");
        ok("hesap: son doğru 78", m.son && m.son.tDogru === 78, m.son ? String(m.son.tDogru) : "yok");
        ok("hesap: hedef farkı -7", m.fark === 78 - 85, String(m.fark));
        ok("hesap: eğilim yükseliyor", m.egilim === "yükseliyor", m.egilim);
        /* "son 3 deneme" = son 3 kaydın penceresi (60 → 78). Verilen sentetik diziye göre
           gerçek artış 78-60 = 18'dir; yorumdaki sayı bu ölçümle birebir aynı olmalı. */
        ok("hesap: son 3 denemede artış 18 (78-60)", m.ucFark === 18 && m.ucFark === (m.liste[4].tDogru - m.liste[2].tDogru),
           String(m.ucFark));
        ok("hesap: ortalama 60,2 doğru", m.ortalama === 60.2, String(m.ortalama));
        var dy = A.dersYanlis(v);
        ok("ders: 3 ders · 17 yanlış", dy.liste.length === 3 && dy.toplam === 17, dy.liste.length + " ders / " + dy.toplam + " yanlış");
        ok("ders: en üstte Türkçe (10 yanlış)", dy.liste[0].ders === "Türkçe" && dy.liste[0].adet === 10,
           dy.liste[0].ders + " " + dy.liste[0].adet);
        ok("ders: Türkçe payı %58,8", yuzdeStr(dy.liste[0].pay) === "58,8", yuzdeStr(dy.liste[0].pay));
        ok("ders: en çok konu Paragraf", dy.liste[0].enCok === "Paragraf", dy.liste[0].enCok);
        var mtt = A.miniTestler(v);
        ok("minitest: 2 konu", mtt.length === 2, mtt.length + " konu");
        ok("minitest: en zayıf Paragraf %45", mtt[0].konu === "Paragraf" && mtt[0].basari === 45, mtt[0].konu + " %" + mtt[0].basari);
        ok("minitest: ortalama süre 40 sn", mtt[0].sure === 40, String(mtt[0].sure));
        ok("minitest: deneme sayısı 2", mtt[0].deneme === 2, String(mtt[0].deneme));

        /* — arayüz — */
        A.bolumAc("danaliz");
        var kap = $("#danalizAlan");
        ok("arayüz: alan bulundu", !!kap, kap ? "ok" : "yok");
        var kutular = $$("#danalizAlan .da-kutu b").map(function (b) { return b.textContent; });
        ok("gösterge: 4 kutu", $$("#danalizAlan .da-kutu").length === 4, $$("#danalizAlan .da-kutu").length + " kutu");
        ok("gösterge: DENEME SAYISI 5", kutular[0] === "5", String(kutular[0]));
        ok("gösterge: SON DOĞRU 78/120", kutular[1] === "78/120", String(kutular[1]));
        ok("gösterge: HEDEF FARKI -7", kutular[2] === "-7", String(kutular[2]));
        ok("gösterge: NET EĞİLİMİ Yükseliyor", String(kutular[3]).toLocaleLowerCase("tr-TR") === "yükseliyor", String(kutular[3]));
        var svg = $("#danalizAlan svg.da-grafik");
        ok("grafik: SVG çizildi", !!svg, svg ? "var" : "yok");
        ok("grafik: çizgi yolu (path)", $$("#danalizAlan svg.da-grafik path.da-cizgi").length === 1,
           $$("#danalizAlan svg.da-grafik path.da-cizgi").length + " yol");
        var nokta = $$("#danalizAlan svg.da-grafik circle.da-nokta");
        ok("grafik: 5 nokta", nokta.length === 5, nokta.length + " nokta");
        ok("grafik: hedef kesikli çizgi", $$("#danalizAlan svg.da-grafik line.da-hedef").length === 1,
           $$("#danalizAlan svg.da-grafik line.da-hedef").length + " çizgi");
        ok("grafik: 5 değer etiketi", $$("#danalizAlan svg.da-grafik text.da-deger").length === 5,
           $$("#danalizAlan svg.da-grafik text.da-deger").length + " etiket");
        ok("grafik: 5 tarih etiketi (döndürülmüş)",
           $$("#danalizAlan svg.da-grafik text.da-tarih").length === 5 &&
           // eslint-disable-next-line
           $$("#danalizAlan svg.da-grafik text.da-tarih").every(function (x) { return /rotate\(-35/.test(x.getAttribute("transform") || ""); }),
           $$("#danalizAlan svg.da-grafik text.da-tarih").length + " tarih");
        ok("grafik: son nokta büyük işaret", nokta.length === 5 && parseFloat(nokta[4].getAttribute("r")) > parseFloat(nokta[0].getAttribute("r")),
           nokta.length === 5 ? nokta[4].getAttribute("r") + " > " + nokta[0].getAttribute("r") : "nokta yok");
        ok("grafik: değer etiketleri doğru sayıları yazıyor",
           $$("#danalizAlan svg.da-grafik text.da-deger").map(function (x) { return x.textContent; }).join(",") === "40,52,60,71,78",
           $$("#danalizAlan svg.da-grafik text.da-deger").map(function (x) { return x.textContent; }).join(","));
        var dSatir = $$("#danalizAlan .da-tablo tbody tr");
        ok("tablo: 6 satır (5 deneme + toplam)", dSatir.length === 6, dSatir.length + " satır");
        ok("tablo: toplam satırı", $$("#danalizAlan .da-tablo tr.toplam").length === 1, $$("#danalizAlan .da-tablo tr.toplam").length + " satır");
        ok("tablo: 6 sütun", $$("#danalizAlan .da-tablo thead th").length === 6, $$("#danalizAlan .da-tablo thead th").length + " sütun");
        ok("tablo: ilk satır 40 / son satır 78",
           dSatir[0].querySelectorAll("td")[2].textContent === "40" && dSatir[4].querySelectorAll("td")[2].textContent === "78",
           dSatir[0].querySelectorAll("td")[2].textContent + " … " + dSatir[4].querySelectorAll("td")[2].textContent);
        ok("tablo: '5 deneme' yazısı", /5 deneme/.test(kap.textContent), "var");
        var cubuklar = $$("#danalizAlan .da-cubuk-satir");
        ok("ders: 3 yatay çubuk", cubuklar.length === 3, cubuklar.length + " çubuk");
        ok("ders: çubuk genişlikleri yüzdeye göre azalıyor",
           parseFloat(cubuklar[0].querySelector(".da-cubuk i").style.width) > parseFloat(cubuklar[2].querySelector(".da-cubuk i").style.width),
           cubuklar[0].querySelector(".da-cubuk i").style.width + " > " + cubuklar[2].querySelector(".da-cubuk i").style.width);
        ok("ders: '3 ders · toplam 17 yanlış' yazısı", /3 ders · toplam 17 yanlış/.test(kap.textContent), "var");
        ok("minitest: tablo 2 satır", $$("#danalizAlan .da-mini-tablo tbody tr").length === 2,
           $$("#danalizAlan .da-mini-tablo tbody tr").length + " satır");
        ok("minitest: zayıf konular işaretli", $$("#danalizAlan .da-mini-tablo tr.da-zayif").length === 2,
           $$("#danalizAlan .da-mini-tablo tr.da-zayif").length + " işaretli");
        ok("minitest: 4 sütun", $$("#danalizAlan .da-mini-tablo thead th").length === 4,
           $$("#danalizAlan .da-mini-tablo thead th").length + " sütun");
        var yEl = $("#daYorum");
        var yMetin = yEl ? yEl.textContent : "";
        ok("yorum: üretildi", !!yEl && yMetin.length > 60, yMetin.slice(0, 70));
        ok("yorum: 'netin 18 arttı' cümlesi", /netin 18 arttı/.test(yMetin), yMetin.slice(0, 40));
        ok("yorum: hedefe 7 doğru kaldı", /hedefe \(85\) 7 doğru kaldı/.test(yMetin), "var");
        ok("yorum: en çok yanlış Türkçe", /En çok yanlışın Türkçe: 10 yanlış/.test(yMetin), "var");
        ok("yorum: mini test cümlesi", /en zayıf konun Paragraf/.test(yMetin), "var");
        /* 6. deneme eklenince "son 3 denemede artış" gerçekten 12 olur (83 - 71) */
        depoKoy("ka.denemeler", besli.concat([{ id: "t5", tarih: new Date(simdi).toISOString(),
          tDogru: 83, yuzde: 69.2, gosterge: 55 }]));
        var m6 = A.model(A.veriOku()), y6 = A.yorum();
        ok("yorum: 6 denemede son 3 artış 12 (83-71)", m6.ucFark === 12, String(m6.ucFark));
        ok("yorum: 'netin 12 arttı' cümlesi", /netin 12 arttı/.test(y6), y6.slice(0, 45));
        depoKoy("ka.denemeler", besli);
        ok("düğme: 🔊 Yorumu dinle", !!$("#daDinle"), "var");
        ok("düğme: Koç AI'ya sor", !!$("#daKoc") && /Koç AI/.test($("#daKoc").textContent), $("#daKoc") ? $("#daKoc").textContent : "yok");
        ok("düğme: PDF/yazdır", !!$("#daYazdir") && !!window.print, $("#daYazdir") ? $("#daYazdir").textContent : "yok");
        /* düğme gerçekten bağlı mı: koç düğmesi motora gidiyor mu */
        try { $("#daKoc").click(); } catch (e) {}
        ok("düğme: Koç AI düğmesi çalışıyor", !!document.querySelector("#ekran-kocai.acik"),
           document.querySelector("#ekran-kocai.acik") ? "kocai açıldı" : "açılmadı");
        /* danaliz ekranına geri dön (yazdırma düğmesi kasıtlı denenmez: headless tarayıcıda yazdırma penceresi kilitlenir) */
        A.bolumAc("danaliz");
        var yy = A.yorumDinle();
        ok("yorum: sesli okuma metni üretiyor", typeof yy === "string" && yy.length > 60, String(yy).slice(0, 40));

        /* — boş durum — */
        depoKoy("ka.denemeler", []);
        depoSil("yanlisKonu");
        depoSil("minitest");
        A.bolumAc("danaliz");
        var bos = $("#daBos");
        ok("boş durum: mesaj kutusu çıktı", !!bos, bos ? "var" : "yok");
        ok("boş durum: 'Net & Puan' yönlendirmesi", !!bos && /Net & Puan/.test(bos.textContent), "var");
        ok("boş durum: puan ve deneme kodları yazılı", !!bos && /puan/.test(bos.textContent) && /deneme/.test(bos.textContent), "var");
        ok("boş durum: grafik çizilmedi", !$("#danalizAlan svg.da-grafik"), "yok");
        ok("boş durum: hedef farkı —", A.model(A.veriOku()).fark === null, String(A.model(A.veriOku()).fark));
        ok("boş durum: yorum yönlendiriyor", /Net & Puan/.test(A.yorum()), A.yorum().slice(0, 40));
        ok("boş durum: deneme sayısı 0", $$("#danalizAlan .da-kutu b")[0].textContent === "0", $$("#danalizAlan .da-kutu b")[0].textContent);

        /* — eski hâle döndür — */
        if (!eskiDV.d) depoSil("ka.denemeler"); else depoKoy("ka.denemeler", eskiD);
        if (!eskiDV.h) depoSil("ka.hedef"); else depoKoy("ka.hedef", eskiH);
        if (!eskiDV.y) depoSil("yanlisKonu"); else depoKoy("yanlisKonu", eskiY);
        if (!eskiDV.m) depoSil("minitest"); else depoKoy("minitest", eskiM);
        A.bolumAc("danaliz");
        var geri = A.model(A.veriOku());
        ok("geri alma: deneme sayısı eski hâlinde", geri.adet === (eskiDV.d && Array.isArray(eskiD) ? eskiD.length : 0),
           geri.adet + " / beklenen " + (eskiDV.d && Array.isArray(eskiD) ? eskiD.length : 0));
        ok("geri alma: hedef eski hâlinde", depoAl("ka.hedef", 85) === (eskiDV.h ? eskiH : 85), String(depoAl("ka.hedef", 85)));
        ok("geri alma: yanlış konu eski hâlinde", eskiDV.y ? typeof depoAl("yanlisKonu", null) === "object" : !depoVar("yanlisKonu"), "ok");

        /* — rapor — */
        var gecen = t.filter(function (x) { return x.indexOf("✔") === 0; }).length;
        var kap2 = document.createElement("div");
        kap2.id = "danalizTestSonuc";
        kap2.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
        kap2.innerHTML = "<h3>ÜSTAD DENEME ANALİZİ testi</h3>" + t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
          "<hr><b>" + gecen + " / " + t.length + " geçti</b>";
        document.body.appendChild(kap2);
        document.title = (document.title || "") + " DANALIZTEST " + gecen + "/" + t.length;
      }, 500);
    });
  }
})();
