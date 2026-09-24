/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Yanlış Defterim · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Yanlış yaptığın soruların TAMAMI burada durur: soru metni, senin cevabın, doğru cevap,
   çözüm (açıklama + metin), tekrar çöz, anladım sil ve sesli okuma.
   Veri KAYNAĞI uydurulmaz: yalnızca localStorage "ustad.kartlar" (KARTLAR API'si varsa o)
   ve mevcut uygulamanın tuttuğu "ustad.yanlisKonu" konu sayacı okunur. */
(function () {
  "use strict";
  var A = window.DEFTER = {};

  /* ───────────── yardımcılar ───────────── */
  function $(s, k) { return (k || document).querySelector(s); }
  function $$(s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function depoAl(k, v) { try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } }
  function depoKoy(k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); } catch (e) {} }
  function bugun() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate(); }
  function tarihEkle(gun) { var d = new Date(); d.setDate(d.getDate() + (Number(gun) || 0)); return d.getFullYear() + "-" + (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate(); }
  function harf(i) { var h = "ABCD"; var n = Number(i); return (n >= 0 && n < h.length) ? h.charAt(n) : "?"; }
  function kisalt(s, n) { s = String(s == null ? "" : s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  /* kutu → kaç gün sonra tekrar (Leitner). KARTLAR API'si varsa ONUN aralığı kullanılır
     (tek doğruluk kaynağı kart modülüdür); yoksa aynı varsayılan: 1-3-7-21-60 gün. */
  function kutuAralik(kutu) {
    var k = Math.max(1, Math.min(5, Number(kutu) || 1));
    var a = window.KARTLAR && window.KARTLAR.ARALIK;
    if (Array.isArray(a) && a.length >= 6) return Number(a[k]) || 1;
    return [0, 1, 3, 7, 21, 60][k];
  }
  /* tarih alanı: kart modülü tam ISO damgası yazabilir ("2026-09-25T07:00:00.000Z"),
     defter gün bazında çalışır → yalnızca YYYY-MM-DD kısmı kullanılır/gösterilir. */
  function gunKismi(s) { return String(s == null ? "" : s).slice(0, 10); }
  function ses(metin) {
    try { if (window.KPSS_SES && typeof window.KPSS_SES.konus === "function") { window.KPSS_SES.konus(metin); return; } } catch (e) {}
    try { if (window.USTAD_MOTOR && typeof window.USTAD_MOTOR.konus === "function") window.USTAD_MOTOR.konus(metin); } catch (e) {}
  }

  /* ───────────── veri: kartlar (yanlış sorular) ───────────── */
  function kartApiVar() { return !!(window.KARTLAR && typeof window.KARTLAR.kayitlar === "function"); }

  function norm(k, id) {
    k = k || {};
    return {
      id: (k.id == null ? String(id == null ? "" : id) : String(k.id)),
      ders: k.ders || "Diğer",
      konu: k.konu || "Konu belirtilmemiş",
      soru: k.soru || "",
      secenekler: Array.isArray(k.secenekler) ? k.secenekler.slice(0, 4) : [],
      dogru: (k.dogru == null ? -1 : Number(k.dogru)),
      aciklama: k.aciklama || "",
      metin: k.metin || "",
      tip: k.tip || "",
      verilen: (k.verilen === null || k.verilen === undefined) ? null : Number(k.verilen),
      eklenme: k.eklenme || "",
      kutu: Math.max(1, Math.min(5, Number(k.kutu) || 1)),
      sonraki: gunKismi(k.sonraki),
      kez: Number(k.kez) || 0
    };
  }

  /* Kayıtlar: KARTLAR API'si varsa ondan, yoksa doğrudan localStorage "ustad.kartlar" */
  A.kayitlar = function () {
    if (kartApiVar()) {
      try {
        var dizi = window.KARTLAR.kayitlar();
        if (Array.isArray(dizi)) {
          return dizi.map(function (k, i) { return norm(k, k && k.id != null ? k.id : "k" + i); });
        }
      } catch (e) {}
    }
    var d = depoAl("kartlar", {});
    if (!d || typeof d !== "object") return [];
    return Object.keys(d).map(function (anahtar) { return norm(d[anahtar], anahtar); });
  };
  A.kayitBul = function (id) {
    var l = A.kayitlar();
    for (var i = 0; i < l.length; i++) { if (l[i].id === String(id)) return l[i]; }
    return null;
  };

  function sil(id) {
    if (window.KARTLAR && typeof window.KARTLAR.kayitSil === "function") {
      try { window.KARTLAR.kayitSil(id); return true; } catch (e) {}
    }
    var d = depoAl("kartlar", {});
    if (d && typeof d === "object") { delete d[id]; depoKoy("kartlar", d); }
    return true;
  }

  function kutuIlerlet(id, dogruMu) {
    if (window.KARTLAR && typeof window.KARTLAR.kutuIlerlet === "function") {
      try { window.KARTLAR.kutuIlerlet(id, dogruMu); return; } catch (e) {}
    }
    var d = depoAl("kartlar", {});
    var k = d && d[id];
    if (!k) return;
    var kutu = Math.max(1, Math.min(5, Number(k.kutu) || 1));
    /* Kart modülü (kartlar.js) yoksa AYNI kural uygulanır: doğru → bir üst kutu, yanlış → 1. kutuya dön. */
    kutu = dogruMu ? Math.min(5, kutu + 1) : 1;
    k.kutu = kutu;
    k.kez = (Number(k.kez) || 0) + 1;
    k.sonraki = tarihEkle(dogruMu ? kutuAralik(kutu) : 1);
    d[id] = k;
    depoKoy("kartlar", d);
  }
  A.kutuIlerlet = kutuIlerlet;
  A.kayitSil = sil;

  /* ───────────── veri: konu bazlı yanlış sayacı (mevcut uygulama yazar) ───────────── */
  A.konuSayaci = function () {
    var d = depoAl("yanlisKonu", {});
    if (!d || typeof d !== "object") return [];
    return Object.keys(d).map(function (k) {
      var p = String(k).split("|");
      return { konu: p[0] || "—", ders: p[1] || "—", adet: Number(d[k]) || 0 };
    }).filter(function (x) { return x.adet > 0; })
      .sort(function (a, b) { return b.adet - a.adet || a.konu.localeCompare(b.konu, "tr"); });
  };

  /* ───────────── özet sayılar (hepsi defterden, uydurma yok) ───────────── */
  A.ozet = function () {
    var l = A.kayitlar(), b = bugun(), dersler = {}, ezber = 0, simdi = 0;
    l.forEach(function (k) {
      dersler[k.ders] = (dersler[k.ders] || 0) + 1;
      if (k.kutu >= 4) ezber++;                              // 4-5. kutu = ezberlenen
      if (k.sonraki && k.sonraki <= b) simdi++;              // sonraki tekrar tarihi gelmiş
    });
    return { toplam: l.length, bugun: simdi, dersSayisi: Object.keys(dersler).length, ezberlenen: ezber, dersler: dersler };
  };

  /* ───────────── sesli okuma metni ───────────── */
  A.sesMetni = function (k) {
    if (!k) return "";
    var parca = [];
    parca.push("Yanlış defteri kaydı. Konu: " + k.konu + ". Ders: " + k.ders + ".");
    if (k.soru) parca.push("Soru: " + k.soru);
    if (k.dogru >= 0 && k.secenekler[k.dogru] != null) parca.push("Doğru cevap: " + harf(k.dogru) + ") " + k.secenekler[k.dogru] + ".");
    if (k.aciklama) parca.push("Açıklama: " + k.aciklama);
    if (k.metin) parca.push("Çözüm: " + k.metin);
    parca.push("Bu kart " + k.kutu + " numaralı kutuda; " + k.kutu + " üzerinden 5.");
    return parca.join(" ");
  };

  /* ───────────── arayüz ───────────── */
  var filtre = "hepsi";        // "hepsi" ya da ders adı
  var cozumAcik = {};          // id → açıklama/çözüm görünür mü
  var tekrarModu = {};         // id → şıklar tıklanabilir mi
  var sonDeneme = {};          // id → { secim: index, dogru: bool } (bu oturumdaki tekrar denemesi)

  function sirala(a, b) {
    var b1 = bugun();
    var a1 = (a.sonraki && a.sonraki <= b1) ? 0 : 1, b2 = (b.sonraki && b.sonraki <= b1) ? 0 : 1;
    if (a1 !== b2) return a1 - b2;
    if (a.kutu !== b.kutu) return a.kutu - b.kutu;
    if (a.ders !== b.ders) return a.ders.localeCompare(b.ders, "tr");
    return a.konu.localeCompare(b.konu, "tr");
  }

  function siklarHtml(k) {
    var tekrar = !!tekrarModu[k.id];
    var sn = sonDeneme[k.id] || null;
    var secenekler = k.secenekler.length ? k.secenekler : ["—", "—", "—", "—"];
    return secenekler.map(function (s, j) {
      var cls = "df-sik", isaret = "";
      var tikanabilir = tekrar && !sn;
      if (tekrar && sn) {
        if (j === k.dogru) { cls += " dogru"; isaret = ' <b class="df-im">✔</b>'; }
        else if (j === sn.secim) { cls += " yanlis"; isaret = ' <b class="df-im">✘</b>'; }
      } else if (!tekrar) {
        if (j === k.dogru) { cls += " dogru"; isaret = ' <b class="df-im">✔</b>'; }
        else if (k.verilen === j) { cls += " yanlis"; isaret = ' <b class="df-im">✘</b>'; }
      }
      if (tikanabilir) cls += " tiklana";
      return '<div class="' + cls + '"' +
        (tikanabilir ? ' data-df-sik="' + kacis(k.id) + ":" + j + '" role="button" tabindex="0"' : "") +
        '><i>' + harf(j) + ')</i> <span>' + kacis(s) + "</span>" + isaret + "</div>";
    }).join("");
  }

  function ozetSatirHtml(k) {
    var sn = sonDeneme[k.id] || null;
    var dogruMetin = k.dogru >= 0
      ? harf(k.dogru) + ") " + kacis(k.secenekler[k.dogru] == null ? "—" : k.secenekler[k.dogru])
      : "kayıtlı değil";
    var benim;
    if (sn) {
      benim = '<b class="' + (sn.dogru ? "df-dogru" : "df-yanlis") + '">' + harf(sn.secim) + ") " +
        kacis(k.secenekler[sn.secim] == null ? "—" : k.secenekler[sn.secim]) + (sn.dogru ? " ✔" : " ✘") + "</b>";
      benim = "Son tekrar denemen: " + benim;
    } else if (k.verilen === null) {
      benim = 'Senin cevabın: <b class="df-yanlis">boş bıraktın ✘</b>';
    } else if (k.verilen === k.dogru) {
      benim = 'Senin cevabın: <b class="df-dogru">' + harf(k.verilen) + " ✔</b>";
    } else {
      benim = 'Senin cevabın: <b class="df-yanlis">' + harf(k.verilen) + ") " +
        kacis(k.secenekler[k.verilen] == null ? "—" : k.secenekler[k.verilen]) + " ✘</b>";
    }
    return '<div class="df-ozet-satir">' + benim +
      ' <span class="df-ayrac">·</span> Doğru cevap: <b class="df-dogru">' + dogruMetin + " ✔</b>" +
      '<span class="df-ayrac">·</span> Kutu <b>' + k.kutu + "/5</b>" +
      (k.sonraki ? '<span class="df-ayrac">·</span> sonraki tekrar <b>' + kacis(k.sonraki) + "</b>" : "") +
      "</div>";
  }

  function geriHtml(k) {
    var sn = sonDeneme[k.id];
    if (!sn) return "";
    var guncel = A.kayitBul(k.id) || k;
    /* karşılaştırma temeli: tıklama anındaki kutu (sonDeneme.oncekiKutu).
       Çizim güncel kaydı okuduğu için k.kutu artık yeni değerdir; ona güvenilmez. */
    var eski = (sn.oncekiKutu == null ? k.kutu : sn.oncekiKutu);
    var fark = (Number(guncel.kutu) || 0) - (Number(eski) || 0);
    /* kutu kuralı kart modülünün (kartlar.js) sorumluluğunda; burada yalnızca ölçülen
       değişim anlatılır. Doğru → üst kutu · Yanlış → 1. kutuya dön · aynı kaldıysa sabit. */
    var yon = fark > 0 ? "Kart bir üst kutuya geçti: <b>" + guncel.kutu + "/5</b>"
      : (fark < 0 ? "Kart <b>" + guncel.kutu + "/5</b> kutusuna döndü, yarın tekrar sorulacak."
        : "Kart <b>" + guncel.kutu + "/5</b> kutusunda kaldı, yarın tekrar sorulacak.");
    if (sn.dogru) {
      return '<div class="df-geri iyi">✔ <b>Doğru!</b> ' + yon +
        " · sonraki tekrar <b>" + kacis(guncel.sonraki || tarihEkle(kutuAralik(guncel.kutu))) + "</b>.</div>";
    }
    return '<div class="df-geri kotu">✘ <b>Yanlış.</b> Doğru cevap: <b>' + (k.dogru >= 0 ? harf(k.dogru) : "—") + ") " +
      kacis(k.secenekler[k.dogru] == null ? "—" : k.secenekler[k.dogru]) + "</b> · " + yon + "</div>";
  }

  function kartHtml(k, sira) {
    var tekrar = !!tekrarModu[k.id], sn = sonDeneme[k.id] || null;
    var cozum = !!cozumAcik[k.id];
    var durum = k.verilen === null ? "boş" : (k.verilen === k.dogru ? "doğru" : "yanlış");
    return '<article class="df-kart" data-df-kart="' + kacis(k.id) + '">' +
      '<div class="df-kart-ust">' +
        '<span class="df-no">' + sira + "</span>" +
        '<div class="df-kart-ad">' +
          "<b>" + sira + ". " + kacis(k.konu) + " · " + kacis(k.ders) + "</b>" +
          '<span>Yanlış defteri kaydı · ' + durum + " · " + k.kutu + ". kutu / 5" +
            (tekrar ? " · 🔁 tekrar çözüm açık" : "") + "</span>" +
        "</div>" +
        '<span class="ka-etiket">' + kacis(k.tip || "kayıt") + "</span>" +
      "</div>" +
      '<p class="df-soru">' + kacis(kisalt(k.soru, 600)) + "</p>" +
      '<div class="df-siklar">' + siklarHtml(k) + "</div>" +
      ozetSatirHtml(k) +
      (tekrar && !sn ? '<p class="aciklama">Şıklardan birine bas; doğru bilirsen kart bir üst kutuya geçer.</p>' : "") +
      geriHtml(k) +
      '<div class="df-islem">' +
        '<button class="ka-mini" data-df-cozum="' + kacis(k.id) + '">' + (cozum ? "🔎 çözümü kapat" : "🔎 çözümü göster") + "</button>" +
        '<button class="ka-mini" data-df-tekrar="' + kacis(k.id) + '">🔁 tekrar çöz</button>' +
        '<button class="ka-mini" data-df-oku="' + kacis(k.id) + '">🔊 sesli oku</button>' +
        '<button class="ka-mini df-sil" data-df-sil="' + kacis(k.id) + '">✔ anladım, sil</button>' +
      "</div>" +
      (cozum ?
        '<div class="df-cozum">' +
          "<h5>🔎 Çözüm</h5>" +
          (k.aciklama ? "<p><b>Açıklama:</b> " + kacis(k.aciklama) + "</p>" : '<p class="aciklama">Bu kayıtta açıklama yok.</p>') +
          (k.metin ? "<p><b>Çözüm metni:</b> " + kacis(k.metin) + "</p>" : "") +
          (k.eklenme ? '<p class="aciklama">Deftere eklendiği tarih: ' + kacis(k.eklenme) + "</p>" : "") +
        "</div>" : "") +
      "</article>";
  }

  function bosHtml() {
    return '<div class="df-bos">' +
      "<h4>📕 Defterin boş</h4>" +
      '<p class="aciklama">Defterin boş. Test veya denemede yanlış yaptığın sorular buraya otomatik düşer.</p>' +
      '<div class="df-islem">' +
        '<button class="ka-dugme" data-df-git="minitest">⏱️ Mini Test bölümüne git</button>' +
        '<button class="ka-dugme ka-ikincil" data-df-git="testler">📝 Testler bölümüne git</button>' +
      "</div></div>";
  }

  function ciz() {
    var kap = $("#defterAlan"); if (!kap) return;
    var liste = A.kayitlar().sort(sirala);
    var o = A.ozet();
    var sayac = A.konuSayaci();

    var gorunen = filtre === "hepsi" ? liste : liste.filter(function (k) { return k.ders === filtre; });

    var h = "";
    h += '<div class="df-ust">' +
      '<div class="df-tanitim"><b>📕 Yanlış Defterim</b><span>Doğru cevabı, çözümü ve tekrar planı burada; her kart ÖSYM tarzı özgün soru kaydından gelir.</span></div>' +
      '<div class="df-rozet ' + (o.bugun ? "var" : "") + '">🔁 ' + o.bugun + " kart bugün tekrar</div>" +
      "</div>";

    /* 1) gösterge kutuları */
    h += '<div class="df-kutular">' +
      '<div class="df-kutu"><b>' + o.toplam + " soru</b><span>TOPLAM YANLIŞ SORU</span></div>" +
      '<div class="df-kutu"><b>' + o.bugun + " soru</b><span>BUGÜN TEKRAR EDİLECEK</span></div>" +
      '<div class="df-kutu"><b>' + o.dersSayisi + " ders</b><span>DERS SAYISI</span></div>" +
      '<div class="df-kutu"><b>' + o.ezberlenen + " kart</b><span>EZBERLENEN</span></div>" +
      "</div>";

    /* 2) ders filtresi */
    if (liste.length) {
      h += '<div class="df-filtre-satir"><h4>🎯 Ders filtresi <span class="ka-etiket">' + liste.length + " kayıt</span></h4>" +
        '<div class="df-filtre">' +
        '<button class="ka-mini' + (filtre === "hepsi" ? " df-secili" : "") + '" data-df-filtre="hepsi">Tümü <b>(' + liste.length + ")</b></button>" +
        Object.keys(o.dersler).sort(function (a, b) { return o.dersler[b] - o.dersler[a] || a.localeCompare(b, "tr"); }).map(function (d) {
          return '<button class="ka-mini' + (filtre === d ? " df-secili" : "") + '" data-df-filtre="' + kacis(d) + '">' +
            kacis(d) + " <b>(" + o.dersler[d] + ")</b></button>";
        }).join("") +
        "</div></div>";
    }

    /* 3) yanlış soru listesi (numaralı + toplam sayı) */
    h += '<div class="df-liste-baslik"><h4>📋 Yanlış soru listesi <span class="ka-etiket">' +
      (filtre === "hepsi" ? gorunen.length + " soru" : kacis(filtre) + " · " + gorunen.length + " soru") + "</span></h4>" +
      '<p class="aciklama">Defterdeki toplam ' + liste.length + " kayıt" +
      (filtre === "hepsi" ? "" : " · seçili ders: " + kacis(filtre)) + "</p></div>";

    if (!liste.length) {
      h += bosHtml();
    } else if (!gorunen.length) {
      h += '<div class="df-bos"><h4>Bu derste kayıt yok</h4><p class="aciklama">“' + kacis(filtre) +
        '” dersinde defter kaydı bulunmuyor. Tümü düğmesiyle ' + liste.length + " kaydı görebilirsin.</p>" +
        '<div class="df-islem"><button class="ka-dugme" data-df-filtre="hepsi">Tümünü göster</button></div></div>';
    } else {
      h += '<div class="df-liste">' + gorunen.map(function (k, i) { return kartHtml(k, i + 1); }).join("") + "</div>";
    }

    /* 4) konu bazlı yanlış sayacı */
    var toplamYanlis = sayac.reduce(function (t, x) { return t + x.adet; }, 0);
    h += '<div class="df-sayac"><h4>🧮 Konu bazlı yanlış sayacı <span class="ka-etiket">' + sayac.length + " konu</span></h4>" +
      '<table class="oyun-tablo"><thead><tr><th>Sıra</th><th>Konu</th><th>Ders</th><th>Yanlış sayısı</th></tr></thead><tbody>' +
      (sayac.length ? sayac.map(function (x, i) {
        return "<tr><td>" + (i + 1) + '</td><td><b>' + kacis(x.konu) + "</b></td><td>" + kacis(x.ders) +
          '</td><td class="rakam">' + x.adet + "</td></tr>";
      }).join("") + '<tr class="df-toplam"><td colspan="3"><b>TOPLAM</b></td><td class="rakam"><b>' + toplamYanlis + "</b></td></tr>"
        : '<tr><td colspan="4">Konu sayacı henüz boş — test çözdükçe dolar.</td></tr>') +
      "</tbody></table>" +
      '<p class="aciklama">Bu tablo uygulamanın tuttuğu konu sayacından (ustad.yanlisKonu) okunur; ' +
      "yukarıdaki liste ise tek tek soru kayıtlarıdır. Kural: ezberlenen = 4. ve 5. kutudaki kartlar · " +
      "bugün tekrar = sonraki tekrar tarihi bugün ya da geçmiş olan kartlar.</p></div>";

    kap.innerHTML = h;
    bagla(kap);
  }

  function bagla(kap) {
    kap.onclick = function (ev) {
      var el = ev.target;
      while (el && el !== kap) {
        if (el.getAttribute) {
          var v;
          if ((v = el.getAttribute("data-df-filtre")) !== null) { filtre = v; cozumAcik = {}; tekrarModu = {}; sonDeneme = {}; ciz(); return; }
          if ((v = el.getAttribute("data-df-cozum")) !== null) { if (cozumAcik[v]) delete cozumAcik[v]; else cozumAcik[v] = true; ciz(); return; }
          if ((v = el.getAttribute("data-df-tekrar")) !== null) { tekrarModu[v] = true; delete sonDeneme[v]; ciz(); return; }
          if ((v = el.getAttribute("data-df-sil")) !== null) {
            var kayit = A.kayitBul(v);
            var ad = kayit ? kayit.konu + " (" + kayit.ders + ")" : "kayıt";
            sil(v);
            delete cozumAcik[v]; delete tekrarModu[v]; delete sonDeneme[v];
            ciz();
            var hedef = $(".df-liste-baslik .ka-etiket", kap);
            if (hedef) hedef.classList.add("df-bilgi");
            try { if (window.KPSS_SES && KPSS_SES.konus) KPSS_SES.konus("Anladım. " + ad + " defterden silindi."); } catch (e) {}
            return;
          }
          if ((v = el.getAttribute("data-df-oku")) !== null) {
            var k = A.kayitBul(v);
            if (k) { var m = A.sesMetni(k); ses(m); try { window.__dfSonOkunan = m; } catch (e) {} }
            return;
          }
          if ((v = el.getAttribute("data-df-sik")) !== null) {
            var p = v.split(":"), kid = p.slice(0, p.length - 1).join(":"), secim = Number(p[p.length - 1]);
            var kayit2 = A.kayitBul(kid);
            if (kayit2 && tekrarModu[kid] && !sonDeneme[kid]) {
              var dogruMu = (secim === kayit2.dogru);
              sonDeneme[kid] = { secim: secim, dogru: dogruMu, oncekiKutu: kayit2.kutu };
              kutuIlerlet(kid, dogruMu);
              ciz();
            }
            return;
          }
          if ((v = el.getAttribute("data-df-git")) !== null) {
            if (window.USTAD_MOTOR && typeof USTAD_MOTOR.git === "function") USTAD_MOTOR.git(v);
            else location.hash = v;
            return;
          }
        }
        el = el.parentNode;
      }
    };
  }

  /* Bölüm açılınca gerçek arayüzü çiz (motor.js çağırır) */
  A.bolumAc = function (kod) {
    if (kod === "defter") ciz();
  };
  A.ciz = ciz;

  /* ═════════════ kendi kendini test (?test=1) ═════════════ */
  if (location.search.indexOf("test=1") >= 0) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        var t = [], ok = function (ad, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : "")); };
        function metin(sec) { var e = $(sec); return e ? e.textContent : ""; }
        function sayi(sec) { return $$(sec).length; }

        var eskiKart = localStorage.getItem("ustad.kartlar");
        var eskiYanlis = localStorage.getItem("ustad.yanlisKonu");

        try {
          /* ── sentetik kayıtlar (gerçek şemayla birebir) ── */
          var d = {};
          d["test-t1"] = { id: "test-t1", ders: "Türkçe", konu: "Paragraf", soru: "Paragrafın ana düşüncesi hangisidir?",
            secenekler: ["Yazarın hayatı", "Metnin konusu", "Ana düşünce", "Yayınevi adı"], dogru: 2,
            aciklama: "Ana düşünce, yazarın okuyucuya vermek istediği temel iletidir.", metin: "Konu ve ana düşünce ayrımı: konu ne anlatıldığı, ana düşünce ne demek istendiğidir.",
            tip: "test", verilen: 1, eklenme: "2026-09-20", kutu: 1, sonraki: bugun(), kez: 2 };
          d["test-t2"] = { id: "test-t2", ders: "Matematik", konu: "Problemler", soru: "Bir işçi 8 saatte 96 parça üretiyor; 3 saatte kaç parça üretir?",
            secenekler: ["24", "32", "36", "48"], dogru: 2,
            aciklama: "Saatlik üretim 96/8 = 12 parça; 3 × 12 = 36 parça.", metin: "Oran-orantı: doğru orantıda birim değere bölüp çarpılır.",
            tip: "minitest", verilen: null, eklenme: "2026-09-22", kutu: 4, sonraki: tarihEkle(30), kez: 5 };
          d["test-t3"] = { id: "test-t3", ders: "Türkçe", konu: "Cümle Bilgisi", soru: "Aşağıdaki cümlelerden hangisi devrik bir cümledir?",
            secenekler: ["Geldim, gördüm, yendim.", "Güzel bir gündü bugün.", "Kitabı masaya koydum.", "Yarın erken kalkacağım."], dogru: 3,
            aciklama: "Yüklemi sonda olmayan cümle devriktir: “Güzel bir gündü bugün.”", metin: "Devrik cümlede yüklem sonda değildir; anlam bozulmaz, vurgu değişir.",
            tip: "deneme", verilen: 0, eklenme: "2026-09-23", kutu: 5, sonraki: bugun(), kez: 7 };
          localStorage.setItem("ustad.kartlar", JSON.stringify(d));
          localStorage.setItem("ustad.yanlisKonu", JSON.stringify({ "Paragraf|Türkçe": 3, "Problemler|Matematik": 2 }));

          /* gerçek bölüm açma yolu: motor.js → DEFTER.bolumAc("defter") */
          if (window.USTAD_MOTOR && typeof USTAD_MOTOR.git === "function") USTAD_MOTOR.git("defter");
          else A.bolumAc("defter");

          ok("kurulum: bölüm kabı (#defterAlan) dolu", metin("#defterAlan").length > 40, metin("#defterAlan").length + " karakter");
          ok("veri: kayıtlar okundu", A.kayitlar().length === 3, A.kayitlar().length + " kayıt");

          /* 1) gösterge kutuları */
          ok("gösterge: 4 kutu", sayi("#defterAlan .df-kutu") === 4, sayi("#defterAlan .df-kutu") + " kutu");
          ok("gösterge: toplam yanlış soru = 3", /3/.test(metin("#defterAlan .df-kutu:nth-child(1) b")), metin("#defterAlan .df-kutu:nth-child(1) b"));
          ok("gösterge: bugün tekrar edilecek = 2", /2/.test(metin("#defterAlan .df-kutu:nth-child(2) b")), metin("#defterAlan .df-kutu:nth-child(2) b"));
          ok("gösterge: ders sayısı = 2", /2/.test(metin("#defterAlan .df-kutu:nth-child(3) b")), metin("#defterAlan .df-kutu:nth-child(3) b"));
          ok("gösterge: ezberlenen = 2 (kutu ≥ 4)", /2/.test(metin("#defterAlan .df-kutu:nth-child(4) b")), metin("#defterAlan .df-kutu:nth-child(4) b"));

          /* 2) ders filtresi */
          ok("filtre: Tümü + 2 ders = 3 düğme", sayi("#defterAlan [data-df-filtre]") === 3, sayi("#defterAlan [data-df-filtre]") + " düğme");
          ok("filtre: Tümü seçili ve sayıyı yazıyor", /Tümü\s*\(3\)/.test(metin('#defterAlan [data-df-filtre="hepsi"]')), metin('#defterAlan [data-df-filtre="hepsi"]'));

          /* 3) numaralı liste */
          ok("liste: numaralı kart sayısı = 3", sayi("#defterAlan .df-kart") === 3, sayi("#defterAlan .df-kart") + " kart");
          ok("liste: toplam sayı yazılı", /3 soru/.test(metin("#defterAlan .df-liste-baslik")), metin("#defterAlan .df-liste-baslik").replace(/\s+/g, " ").slice(0, 70));
          ok("liste: ilk kart başlığı “1. Paragraf · Türkçe”",
            /^1\.\s*Paragraf\s*·\s*Türkçe/.test(metin('#defterAlan .df-kart:first-child .df-kart-ad b').trim()) || /^1\.\s*Paragraf\s*·\s*Türkçe/.test(metin('#defterAlan [data-df-kart="test-t1"] .df-kart-ad b').trim()),
            metin('#defterAlan [data-df-kart="test-t1"] .df-kart-ad b').trim());
          ok("liste: senin cevabın ✘ işaretli", metin('#defterAlan [data-df-kart="test-t1"] .df-sik.yanlis .df-im').trim() === "✘",
            metin('#defterAlan [data-df-kart="test-t1"] .df-sik.yanlis').replace(/\s+/g, " ").trim());
          ok("liste: doğru cevap ✔ işaretli", metin('#defterAlan [data-df-kart="test-t1"] .df-sik.dogru .df-im').trim() === "✔",
            metin('#defterAlan [data-df-kart="test-t1"] .df-sik.dogru').replace(/\s+/g, " ").trim());
          ok("liste: özet satırı ✘ ve ✔ içeriyor", /✘/.test(metin('#defterAlan [data-df-kart="test-t1"] .df-ozet-satir')) && /✔/.test(metin('#defterAlan [data-df-kart="test-t1"] .df-ozet-satir')),
            metin('#defterAlan [data-df-kart="test-t1"] .df-ozet-satir').replace(/\s+/g, " ").trim().slice(0, 80));
          ok("liste: boş bırakılan soru “boş bıraktın” diyor", /boş bıraktın/.test(metin('#defterAlan [data-df-kart="test-t2"] .df-ozet-satir')),
            metin('#defterAlan [data-df-kart="test-t2"] .df-ozet-satir').replace(/\s+/g, " ").trim().slice(0, 60));

          /* çözümü göster */
          var cozumVarOnce = sayi('#defterAlan [data-df-kart="test-t1"] .df-cozum');
          $('#defterAlan [data-df-cozum="test-t1"]').click();
          var cozumMetni = metin('#defterAlan [data-df-kart="test-t1"] .df-cozum');
          ok("çözüm: kapalıyken yok, açılınca geldi", cozumVarOnce === 0 && sayi('#defterAlan [data-df-kart="test-t1"] .df-cozum') === 1,
            "önce " + cozumVarOnce + ", sonra " + sayi('#defterAlan [data-df-kart="test-t1"] .df-cozum'));
          ok("çözüm: açıklama + çözüm metni görünür",
            /Ana düşünce, yazarın/.test(cozumMetni) && /Konu ve ana düşünce ayrımı/.test(cozumMetni),
            cozumMetni.replace(/\s+/g, " ").trim().slice(0, 80));

          /* tekrar çöz */
          $('#defterAlan [data-df-tekrar="test-t1"]').click();
          ok("tekrar: şıklar tıklanabilir oldu", sayi('#defterAlan [data-df-kart="test-t1"] [data-df-sik]') === 4,
            sayi('#defterAlan [data-df-kart="test-t1"] [data-df-sik]') + " tıklanabilir şık");
          $('#defterAlan [data-df-sik="test-t1:2"]').click();
          ok("tekrar: doğru cevap geri bildirimi", /Doğru!/.test(metin('#defterAlan [data-df-kart="test-t1"] .df-geri')),
            metin('#defterAlan [data-df-kart="test-t1"] .df-geri').replace(/\s+/g, " ").trim().slice(0, 70));
          ok("tekrar: doğru cevapta geri bildirim “üst kutuya geçti” diyor", /geçti/.test(metin('#defterAlan [data-df-kart="test-t1"] .df-geri')),
            metin('#defterAlan [data-df-kart="test-t1"] .df-geri').replace(/\s+/g, " ").trim().slice(0, 70));
          ok("tekrar: kutu 1 → 2 ilerledi", A.kayitBul("test-t1").kutu === 2, "kutu " + A.kayitBul("test-t1").kutu);
          ok("tekrar: sonraki tekrar tarihi ileri atıldı", A.kayitBul("test-t1").sonraki > bugun(), A.kayitBul("test-t1").sonraki);
          $('#defterAlan [data-df-tekrar="test-t3"]').click();
          $('#defterAlan [data-df-sik="test-t3:0"]').click();
          ok("tekrar: yanlış cevap geri bildirimi", /Yanlış\./.test(metin('#defterAlan [data-df-kart="test-t3"] .df-geri')),
            metin('#defterAlan [data-df-kart="test-t3"] .df-geri').replace(/\s+/g, " ").trim().slice(0, 70));
          /* kutu kuralı kart modülünün (kartlar.js) sorumluluğunda → kurala değil
             ölçülebilir sonuca bakılır: kutu geriledi mi, tekrar yakına alındı mı? */
          ok("tekrar: yanlışta kutu geriledi (5 → daha küçük)", A.kayitBul("test-t3").kutu < 5, "kutu " + A.kayitBul("test-t3").kutu);
          ok("tekrar: yanlışta tekrar yarına alındı", A.kayitBul("test-t3").sonraki === tarihEkle(1), A.kayitBul("test-t3").sonraki);
          ok("tekrar: geri bildirim kutunun yönünü doğru söylüyor",
            /döndü/.test(metin('#defterAlan [data-df-kart="test-t3"] .df-geri')) === (A.kayitBul("test-t3").kutu < 5),
            metin('#defterAlan [data-df-kart="test-t3"] .df-geri').replace(/\s+/g, " ").trim().slice(0, 60));
          ok("tarih: ISO damgası arayüze sızmıyor",
            !/T\d\d:/.test(metin('#defterAlan [data-df-kart="test-t3"] .df-ozet-satir')),
            metin('#defterAlan [data-df-kart="test-t3"] .df-ozet-satir').replace(/\s+/g, " ").trim().slice(0, 80));

          /* sesli okuma */
          var sesMetni = A.sesMetni(A.kayitBul("test-t2"));
          ok("ses: okuma metni konu + ders + doğru cevap + açıklama içeriyor",
            /Problemler/.test(sesMetni) && /Matematik/.test(sesMetni) && /36 parça/.test(sesMetni) && /Saatlik üretim/.test(sesMetni),
            sesMetni.slice(0, 90));
          var yakalanan = "", eskiKonus = null;
          try { if (window.KPSS_SES && window.KPSS_SES.konus) { eskiKonus = window.KPSS_SES.konus; window.KPSS_SES.konus = function (m) { yakalanan = String(m || ""); }; } } catch (e) {}
          $('#defterAlan [data-df-oku="test-t2"]').click();
          try { if (eskiKonus) window.KPSS_SES.konus = eskiKonus; } catch (e) {}
          ok("ses: 🔊 düğmesi ses motoruna metin gönderdi", yakalanan.length > 60 && /Problemler/.test(yakalanan), yakalanan.slice(0, 60) || "(ses motoru yok)");

          /* ders filtresi davranışı */
          $('#defterAlan [data-df-filtre="Türkçe"]').click();
          ok("filtre: Türkçe seçilince liste daraldı", sayi("#defterAlan .df-kart") === 2, sayi("#defterAlan .df-kart") + " kart");
          ok("filtre: matematik kartı listeden çıktı", metin('#defterAlan [data-df-kart="test-t2"]') === "" , "t2 yok");
          $('#defterAlan [data-df-filtre="hepsi"]').click();
          ok("filtre: Tümü geri geliyor", sayi("#defterAlan .df-kart") === 3, sayi("#defterAlan .df-kart") + " kart");

          /* konu sayacı tablosu */
          var satirlar = sayi("#defterAlan .df-sayac .oyun-tablo tbody tr");
          ok("sayaç: 2 konu + toplam = 3 satır", satirlar === 3, satirlar + " satır");
          ok("sayaç: toplam yanlış = 5", /5/.test(metin("#defterAlan .df-sayac .df-toplam")), metin("#defterAlan .df-sayac .df-toplam").replace(/\s+/g, " ").trim());
          ok("sayaç: başlık sütunları", ["Sıra", "Konu", "Ders", "Yanlış sayısı"].every(function (b) { return metin("#defterAlan .df-sayac thead").indexOf(b) >= 0; }),
            metin("#defterAlan .df-sayac thead").replace(/\s+/g, " ").trim());

          /* anladım, sil */
          $('#defterAlan [data-df-sil="test-t1"]').click();
          ok("sil: kayıt defterden çıktı", A.kayitlar().length === 2 && metin('#defterAlan [data-df-kart="test-t1"]') === "",
            A.kayitlar().length + " kayıt kaldı");
          ok("sil: depoda da silindi", (function () {
            var d2 = JSON.parse(localStorage.getItem("ustad.kartlar") || "{}");
            return !d2["test-t1"] && Object.keys(d2).length === 2;
          })(), Object.keys(JSON.parse(localStorage.getItem("ustad.kartlar") || "{}")).join(","));

          /* boş durum */
          $('#defterAlan [data-df-sil="test-t2"]').click();
          $('#defterAlan [data-df-sil="test-t3"]').click();
          var bosMetin = metin("#defterAlan");
          ok("boş durum: metin aynen yazılıyor",
            bosMetin.indexOf("Defterin boş. Test veya denemede yanlış yaptığın sorular buraya otomatik düşer.") >= 0,
            bosMetin.replace(/\s+/g, " ").trim().slice(0, 70));
          ok("boş durum: Mini Test / Testler düğmeleri var",
            sayi("#defterAlan [data-df-git]") === 2 && metin('#defterAlan [data-df-git="minitest"]').length > 3,
            sayi("#defterAlan [data-df-git]") + " düğme");
          ok("boş durum: liste kalmadı", sayi("#defterAlan .df-kart") === 0 && A.kayitlar().length === 0, "0 kart");
        } catch (hata) {
          t.push("✘ test çalışırken hata: " + (hata && hata.message ? hata.message : hata));
        }

        /* ── sentetik veriyi ve yan etkilerini geri al ── */
        try {
          if (eskiKart === null) localStorage.removeItem("ustad.kartlar"); else localStorage.setItem("ustad.kartlar", eskiKart);
          if (eskiYanlis === null) localStorage.removeItem("ustad.yanlisKonu"); else localStorage.setItem("ustad.yanlisKonu", eskiYanlis);
        } catch (e) {}
        ok("temizlik: önceki depo geri yüklendi",
          localStorage.getItem("ustad.kartlar") === eskiKart && localStorage.getItem("ustad.yanlisKonu") === eskiYanlis,
          "kartlar " + (localStorage.getItem("ustad.kartlar") === eskiKart ? "aynı" : "bozuk"));

        var gecen = t.filter(function (x) { return x.indexOf("✔") === 0; }).length;
        var kap2 = document.createElement("div");
        kap2.id = "defterTestSonuc";
        kap2.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
        kap2.innerHTML = "<h3>Yanlış Defterim testi (gerçek arayüz + sentetik kayıt)</h3>" +
          t.map(function (x) { return "<div>" + kacis(x) + "</div>"; }).join("") +
          "<hr><b>" + gecen + " / " + t.length + " geçti</b>";
        document.body.appendChild(kap2);
        document.title = (document.title || "") + " DEFTERTEST " + gecen + "/" + t.length;
      }, 500);
    });
  }
})();
