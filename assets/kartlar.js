/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Kart Tekrarı (aralıklı tekrar) · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Leitner sistemi: yanlış yapılan soru 1. kutuya girer; doğru cevaplandıkça 1 → 3 → 7 → 21 → 60 gün
   aralığıyla ilerler. Tüm veri cihazda (localStorage "ustad.kartlar") tutulur, ağ erişimi yoktur.
   Kartlar yalnızca gerçek kaynaklardan gelir: window.USTAD_SORULAR (özgün soru bankası). */
(function () {
  "use strict";
  var A = window.KARTLAR = window.KARTLAR || {};

  var DEPO = "ustad.kartlar";      // localStorage anahtarı (tam ad)
  var GUN_MS = 86400000;
  var EN_FAZLA = 20;               // "bugün tekrar edilecekler" listesinin sınırı
  var HARFLER = ["A", "B", "C", "D", "E", "F"];
  var zaman = null;                // cevap sonrası yeniden çizim zamanlayıcısı

  /* kutu 1..5 → gün cinsinden tekrar aralığı (kutu 0 kullanılmaz) */
  A.ARALIK = [0, 1, 3, 7, 21, 60];

  /* ───────────── yardımcılar ───────────── */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function iki(n) { return (n < 10 ? "0" : "") + n; }
  /* Türkiye saatine göre gün anahtarı: YYYY-MM-DD */
  function gunAnahtari(t) {
    var d = (t instanceof Date) ? t : new Date(t);
    if (!d || isNaN(d.getTime())) return "";
    return d.getFullYear() + "-" + iki(d.getMonth() + 1) + "-" + iki(d.getDate());
  }
  function bugun() { return gunAnahtari(new Date()); }
  function gunSonraIso(gun) { return new Date(Date.now() + (gun || 0) * GUN_MS).toISOString(); }
  function oku() {
    try {
      var s = localStorage.getItem(DEPO);
      if (!s) return {};
      var o = JSON.parse(s);
      return (o && typeof o === "object" && !Array.isArray(o)) ? o : {};
    } catch (e) { return {}; }
  }
  function yaz(o) { try { localStorage.setItem(DEPO, JSON.stringify(o)); } catch (e) {} }
  function kopya(k) { try { return JSON.parse(JSON.stringify(k)); } catch (e) { return k; } }
  function ses(metin) { try { if (window.KPSS_SES && window.KPSS_SES.konus) window.KPSS_SES.konus(metin); } catch (e) {} }
  function git(kod) { try { if (window.USTAD_MOTOR && window.USTAD_MOTOR.git) window.USTAD_MOTOR.git(kod); } catch (e) {} }

  /* id kuralı: ders + "|" + konu + "|" + soru metninin ilk 48 karakteri */
  function idUret(soru) {
    if (!soru) return "";
    var ders = soru.ders || "";
    var konu = soru.konu || "";
    var metin = String(soru.soru || soru.metin || "").slice(0, 48);
    return ders + "|" + konu + "|" + metin;
  }
  function kutuGoster(k) {
    var kutu = Math.min(5, Math.max(1, parseInt(k.kutu, 10) || 1));
    return kutu + ". kutu · " + A.ARALIK[kutu] + " gün sonra";
  }

  /* ───────────── sözleşme (modüller arası API) ───────────── */

  /* Yanlış yapılan soruyu havuza ekler. Aynı soru tekrar yanlış yapılırsa kayıt açılmaz:
     kez artar, kutu 1'e döner, verilen güncellenir. */
  A.yanlisaEkle = function (soru, verilen) {
    if (!soru || !(soru.soru || soru.metin)) return null;
    var o = oku();
    var id = idUret(soru);
    var ver = (typeof verilen === "number" && verilen >= 0) ? verilen : null;
    var mevcut = o[id];
    if (mevcut) {
      mevcut.kez = (parseInt(mevcut.kez, 10) || 0) + 1;
      mevcut.kutu = 1;
      if (ver !== null) mevcut.verilen = ver;
      mevcut.sonraki = gunSonraIso(0);      // hemen tekrar edilebilir
      mevcut.son = new Date().toISOString();
      o[id] = mevcut;
      yaz(o);
      return kopya(mevcut);
    }
    var kayit = {
      id: id,
      ders: soru.ders || "",
      konu: soru.konu || "",
      soru: soru.soru || "",
      secenekler: Array.isArray(soru.secenekler) ? soru.secenekler.slice(0, 6) : [],
      dogru: (typeof soru.dogru === "number") ? soru.dogru : -1,
      aciklama: soru.aciklama || "",
      metin: soru.metin || "",
      tip: soru.tip || "",
      verilen: ver,
      eklenme: new Date().toISOString(),
      kutu: 1,
      sonraki: gunSonraIso(0),
      kez: 0
    };
    o[id] = kayit;
    yaz(o);
    return kopya(kayit);
  };

  /* Tüm kartlar (eklenme sırasıyla) */
  A.kayitlar = function () {
    var o = oku();
    return Object.keys(o).map(function (id) { return kopya(o[id]); });
  };

  /* Bugün (ve gecikmiş) tekrar edilecekler — en eski tekrar önce, en fazla 20 */
  A.bugunKartlari = function () {
    var b = bugun();
    return A.kayitlar().filter(function (k) {
      return gunAnahtari(k.sonraki) !== "" && gunAnahtari(k.sonraki) <= b;
    }).sort(function (x, y) {
      var a1 = gunAnahtari(x.sonraki), a2 = gunAnahtari(y.sonraki);
      if (a1 !== a2) return a1 < a2 ? -1 : 1;
      var e1 = x.eklenme || "", e2 = y.eklenme || "";
      return e1 < e2 ? -1 : (e1 > e2 ? 1 : 0);
    }).slice(0, EN_FAZLA);
  };

  /* Doğru → kutu+1 (en çok 5); yanlış → kutu=1. sonraki = bugün + ARALIK[kutu]; kez++ */
  A.kutuIlerlet = function (id, dogruMu) {
    var o = oku();
    var k = o[id];
    if (!k) return null;
    if (dogruMu) k.kutu = Math.min(5, (parseInt(k.kutu, 10) || 1) + 1);
    else k.kutu = 1;
    k.sonraki = gunSonraIso(A.ARALIK[k.kutu] || 0);
    k.kez = (parseInt(k.kez, 10) || 0) + 1;
    k.son = new Date().toISOString();
    o[id] = k;
    yaz(o);
    return kopya(k);
  };

  A.kayitSil = function (id) {
    var o = oku();
    if (!o[id]) return false;
    delete o[id];
    yaz(o);
    return true;
  };

  A.ozet = function () {
    var ks = A.kayitlar(), b = bugun();
    var oz = { toplam: ks.length, bugun: 0, kutular: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, dersler: {} };
    ks.forEach(function (k) {
      var kutu = Math.min(5, Math.max(1, parseInt(k.kutu, 10) || 1));
      oz.kutular[kutu]++;
      if (gunAnahtari(k.sonraki) !== "" && gunAnahtari(k.sonraki) <= b) oz.bugun++;
      var ders = k.ders || "Diğer";
      oz.dersler[ders] = (oz.dersler[ders] || 0) + 1;
    });
    return oz;
  };

  /* ───────────── ekran ───────────── */
  function bulKayit(id) {
    return A.kayitlar().filter(function (k) { return k.id === id; })[0] || null;
  }

  function kutularCiz(oz) {
    var dersSayisi = Object.keys(oz.dersler).length;
    var kutu = [
      { b: oz.toplam + " kart", s: "TOPLAM KART" },
      { b: oz.bugun + " kart", s: "BUGÜN TEKRAR" },
      { b: oz.kutular[5] + " kart", s: "5. KUTU (EZBERLENEN)" },
      { b: dersSayisi + " ders", s: "EKLENEN DERS" }
    ];
    return kutu.map(function (x) {
      return '<div class="kt-kutu"><b>' + kacis(x.b) + '</b><span>' + kacis(x.s) + "</span></div>";
    }).join("");
  }

  function kartCiz(k, sira) {
    var siklar = (k.secenekler || []).map(function (m, i) {
      return '<button type="button" class="kt-sik" data-kt-sik="' + i + '">' +
        '<span class="kt-harf">' + (HARFLER[i] || String(i + 1)) + ")</span> " + kacis(m) + "</button>";
    }).join("");
    return '<div class="kt-kart" data-kt-id="' + kacis(k.id) + '">' +
        '<div class="kt-kart-ust">' +
          '<span class="kt-sira">' + sira + ".</span>" +
          '<span class="ka-etiket">' + kacis((k.ders || "Ders") + " · " + (k.konu || "Konu")) + "</span>" +
          '<span class="kt-kutu-bilgi">' + kacis(kutuGoster(k)) + "</span>" +
          (k.tip ? '<span class="ka-etiket">' + kacis(k.tip) + "</span>" : "") +
        "</div>" +
        (k.metin ? '<p class="aciklama kt-metin">' + kacis(k.metin) + "</p>" : "") +
        '<p class="kt-soru">' + kacis(k.soru) + "</p>" +
        '<div class="kt-siklar">' + siklar + "</div>" +
        '<div class="kt-geri" role="status"></div>' +
      "</div>";
  }

  function bugunCiz(liste, toplamKayit) {
    if (toplamKayit === 0) {
      return '<div class="kt-bos">' +
          '<b>🃏 Henüz kart yok.</b>' +
          "<p>Test veya denemede yanlış yaptığın sorular buraya otomatik düşer. " +
          "Her doğru cevapta kart bir üst kutuya geçer: 1 → 3 → 7 → 21 → 60 gün.</p>" +
          '<div class="ka-butonlar">' +
            '<button type="button" class="ka-dugme" data-kt-git="minitest">⏱️ Mini Test</button>' +
            '<button type="button" class="ka-dugme ka-ikincil" data-kt-git="testler">📝 Testler</button>' +
          "</div>" +
        "</div>";
    }
    var bas = '<h4 class="kt-bas">🎯 Bugün tekrar edilecekler <span class="kt-sayi">(' + liste.length + " kart)</span></h4>";
    if (!liste.length) {
      var en = A.kayitlar().map(function (k) { return gunAnahtari(k.sonraki); }).filter(function (g) { return g > bugun(); }).sort()[0];
      return bas + '<div class="kt-bos kt-bos-az">' +
          "<b>Bugün tekrar edilecek kart yok. 👍</b>" +
          "<p>" + (en ? "Sıradaki kart: <b>" + kacis(en) + "</b>. Tekrar zamanı gelince burada otomatik görünür." : "Yeni kart eklemek için test çöz.") + "</p>" +
          '<div class="ka-butonlar">' +
            '<button type="button" class="ka-dugme" data-kt-git="testler">📝 Test çöz</button>' +
          "</div>" +
        "</div>";
    }
    return bas + '<div class="kt-liste">' + liste.map(function (k, i) { return kartCiz(k, i + 1); }).join("") + "</div>";
  }

  function tabloCiz(oz) {
    var bugunListe = A.bugunKartlari();
    var dersler = Object.keys(oz.dersler).sort(function (a, b) { return a.localeCompare(b, "tr-TR"); });
    if (!dersler.length) return "";
    var satirlar = dersler.map(function (d) {
      var bugunAdet = bugunListe.filter(function (k) { return (k.ders || "Diğer") === d; }).length;
      var ezber = A.kayitlar().filter(function (k) { return (k.ders || "Diğer") === d && (parseInt(k.kutu, 10) || 1) >= 5; }).length;
      return "<tr><td>" + kacis(d) + '</td><td class="rakam">' + oz.dersler[d] + '</td><td class="rakam">' + bugunAdet +
        '</td><td class="rakam">' + ezber + "</td></tr>";
    }).join("");
    return '<h4 class="kt-bas">📚 Ders bazlı özet <span class="kt-sayi">(' + oz.toplam + " kart)</span></h4>" +
      '<table class="oyun-tablo kt-tablo"><thead><tr>' +
        "<th>Ders</th><th>Kart</th><th>Bugün</th><th>Ezberlenen (5. kutu)</th>" +
      "</tr></thead><tbody>" + satirlar +
      '</tbody><tfoot><tr class="kt-toplam"><td>TOPLAM</td><td class="rakam">' + oz.toplam +
        '</td><td class="rakam">' + oz.bugun + '</td><td class="rakam">' + oz.kutular[5] + "</td></tr></tfoot></table>";
  }

  function tumCiz() {
    var ks = A.kayitlar().sort(function (a, b) {
      var d = (a.ders || "").localeCompare(b.ders || "", "tr-TR");
      if (d) return d;
      var k = (a.konu || "").localeCompare(b.konu || "", "tr-TR");
      if (k) return k;
      return (a.eklenme || "") < (b.eklenme || "") ? -1 : 1;
    });
    if (!ks.length) return '<p class="aciklama">Kayıtlı kart yok.</p>';
    return '<h4 class="kt-bas">🗂 Tüm kartlar <span class="kt-sayi">(' + ks.length + " kart)</span></h4>" +
      ks.map(function (k, i) {
        return '<div class="kt-tum-satir" data-kt-id="' + kacis(k.id) + '">' +
            '<div class="kt-tum-ust">' +
              '<span class="kt-sira">' + (i + 1) + ".</span>" +
              '<span class="ka-etiket">' + kacis((k.ders || "Ders") + " · " + (k.konu || "Konu")) + "</span>" +
              '<span class="kt-kutu-bilgi">' + kacis(kutuGoster(k)) + "</span>" +
              '<span class="aciklama">eklendi: ' + kacis(gunAnahtari(k.eklenme)) + " · " + kacis(String(parseInt(k.kez, 10) || 0)) + " tekrar</span>" +
            "</div>" +
            '<p class="kt-soru">' + kacis(k.soru) + "</p>" +
            '<button type="button" class="ka-mini" data-kt-sil="' + kacis(k.id) + '">🗑 Kaydı sil</button>' +
          "</div>";
      }).join("");
  }

  function ciz() {
    var alan = $("#kartAlan");
    if (!alan) return;
    if (zaman) { clearTimeout(zaman); zaman = null; }
    var ks = A.kayitlar(), oz = A.ozet();
    alan.innerHTML =
      '<div class="kt-kok">' +
        '<div class="kt-ust">' +
          '<span class="kt-rozet">🃏 Aralıklı Tekrar</span>' +
          '<div class="kt-ust-yazi">' +
            "<b>Kart Tekrarı · Leitner</b>" +
            "<span>Yanlış yaptığın sorular 1. kutuya girer; doğru cevapladıkça 1 → 3 → 7 → 21 → 60 gün aralığıyla ilerler.</span>" +
          "</div>" +
        "</div>" +
        '<div class="kt-kutular" id="ktKutular">' + kutularCiz(oz) + "</div>" +
        '<div class="kt-blok" id="ktBugunBlok">' + bugunCiz(A.bugunKartlari(), ks.length) + "</div>" +
        '<div class="kt-blok" id="ktTabloBlok">' + tabloCiz(oz) + "</div>" +
        '<div class="ka-butonlar kt-butonlar">' +
          '<button type="button" class="ka-dugme" data-kt-tum="1">🗂 Tüm kartlar (' + ks.length + ")</button>" +
          '<button type="button" class="ka-dugme ka-ikincil" data-kt-git="defter">📕 Yanlış Defterim</button>' +
        "</div>" +
        '<div class="kt-tum" id="ktTum" hidden></div>' +
      "</div>";
    if (!alan.dataset.ktBagli) { alan.addEventListener("click", tikla); alan.dataset.ktBagli = "1"; }
  }
  A.ciz = ciz;

  function ozetleriTazele() {
    var oz = A.ozet();
    var ku = $("#ktKutular"); if (ku) ku.innerHTML = kutularCiz(oz);
    var tb = $("#ktTabloBlok"); if (tb) tb.innerHTML = tabloCiz(oz);
  }

  function tikla(ev) {
    var hedef = ev.target;
    if (!hedef || !hedef.closest) return;
    var sik = hedef.closest("[data-kt-sik]");
    if (sik) { sikIsle(sik); return; }
    var tum = hedef.closest("[data-kt-tum]");
    if (tum) { tumDegistir(tum); return; }
    var sil = hedef.closest("[data-kt-sil]");
    if (sil) { A.kayitSil(sil.getAttribute("data-kt-sil")); ciz(); return; }
    var gt = hedef.closest("[data-kt-git]");
    if (gt) { git(gt.getAttribute("data-kt-git")); return; }
  }

  function tumDegistir(dugme) {
    var panel = $("#ktTum");
    if (!panel) return;
    if (panel.hasAttribute("hidden")) {
      panel.innerHTML = tumCiz();
      panel.removeAttribute("hidden");
      dugme.textContent = "🗂 Tüm kartları kapat";
    } else {
      panel.setAttribute("hidden", "hidden");
      dugme.textContent = "🗂 Tüm kartlar (" + A.kayitlar().length + ")";
    }
  }

  function sikIsle(dugme) {
    var kart = dugme.closest(".kt-kart");
    if (!kart || kart.classList.contains("kt-cevaplandi")) return;
    var id = kart.getAttribute("data-kt-id");
    var kayit = bulKayit(id);
    if (!kayit) return;
    var secim = parseInt(dugme.getAttribute("data-kt-sik"), 10);
    var dogruMu = (secim === kayit.dogru);

    kart.classList.add("kt-cevaplandi");
    $$("#kartAlan .kt-kart[data-kt-id=\"" + id.replace(/"/g, "") + "\"] .kt-sik").forEach(function (b) {
      b.disabled = true;
      var i = parseInt(b.getAttribute("data-kt-sik"), 10);
      if (i === kayit.dogru) b.classList.add("kt-dogru");
      else if (b === dugme) b.classList.add("kt-yanlis");
      else b.classList.add("kt-soluk");
    });

    var guncel = A.kutuIlerlet(id, dogruMu) || kayit;
    var gun = A.ARALIK[guncel.kutu] || 0;
    var geri = kart.querySelector(".kt-geri");
    if (geri) {
      if (dogruMu) {
        geri.className = "kt-geri kt-iyi";
        geri.innerHTML = "<b>✔ Doğru!</b> Bir sonraki tekrar " + gun + " gün sonra. (" + kacis(guncel.kutu) + ". kutu)";
      } else {
        geri.className = "kt-geri kt-kotu";
        geri.innerHTML = "<b>✘ Yanlış.</b> Doğru cevap: <b>" + (HARFLER[kayit.dogru] || "?") + ") " +
          kacis(kayit.secenekler[kayit.dogru] || "") + "</b>" +
          (kayit.aciklama ? "<p>" + kacis(kayit.aciklama) + "</p>" : "") +
          '<p class="aciklama">Bu soru 1. kutuya döndü; yarın tekrar edilecek.</p>';
      }
    }
    if (typeof kayit.soru === "string") {
      ses(dogruMu
        ? "Doğru! Bir sonraki tekrar " + gun + " gün sonra."
        : "Yanlış. Doğru cevap " + (HARFLER[kayit.dogru] || "") + ". " + (kayit.aciklama || ""));
    }
    ozetleriTazele();
    /* liste kısa bir geri bildirim süresinden sonra yeniden çizilir (cevap görünür kalsın) */
    if (zaman) clearTimeout(zaman);
    zaman = setTimeout(function () { zaman = null; ciz(); }, 2200);
  }

  /* ───────────── dışarı açılan ───────────── */
  A.bolumAc = function (kod) { if (kod === "kart") ciz(); };
  A.gunAnahtari = gunAnahtari;
  A.bugun = bugun;
  A.temizle = function () { try { localStorage.removeItem(DEPO); } catch (e) {} };

  /* ───────────── otomatik test (?test=1) ───────────── */
  function kartTesti() {
    var t = [], ok = function (ad, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : "")); };
    var eskiHam = null;
    try { eskiHam = localStorage.getItem(DEPO); } catch (e) {}

    A.temizle();   // temiz ölçüm
    var soru = {
      ders: "Türkçe", konu: "Paragraf", zorluk: "Kolay", tip: "Konu Testi",
      metin: "Aşağıdaki parçaya göre soruyu cevaplandırınız.",
      soru: "Bu parçanın ana fikri aşağıdakilerden hangisidir?",
      secenekler: ["Okuma alışkanlığı küçük yaşta kazanılır.", "Kitaplar pahalıdır.",
                   "Kütüphaneler yetersizdir.", "Ders çalışmak zaman ister."],
      dogru: 2, aciklama: "Parçanın bütünü okuma alışkanlığının yaşla ilgisini anlatır."
    };

    ok("aralık dizisi (0,1,3,7,21,60)", A.ARALIK.length === 6 && A.ARALIK[1] === 1 && A.ARALIK[3] === 7 && A.ARALIK[5] === 60, A.ARALIK.join(","));

    A.yanlisaEkle(soru, 0);
    var ks = A.kayitlar();
    ok("yanlisaEkle yeni kayıt açtı", ks.length === 1, ks.length + " kayıt");
    var k = ks[0] || {};
    ok("kayıt alanları (ders/konu/dogru/kutu/verilen)",
       k.ders === "Türkçe" && k.konu === "Paragraf" && k.dogru === 2 && k.kutu === 1 && k.verilen === 0,
       JSON.stringify({ ders: k.ders, konu: k.konu, dogru: k.dogru, kutu: k.kutu, verilen: k.verilen }));
    ok("id kuralı ders|konu|ilk 48 karakter",
       (k.id || "").indexOf("Türkçe|Paragraf|") === 0 && (k.id || "").length === ("Türkçe|Paragraf|").length + 48 && (k.id || "").indexOf("Bu parçanın ana fikri") >= 0,
       k.id);
    ok("tarihler ISO string", typeof k.eklenme === "string" && k.eklenme.indexOf("T") > 0 && typeof k.sonraki === "string" && k.sonraki.indexOf("T") > 0,
       gunAnahtari(k.sonraki));
    ok("bugunKartlari yeni kartı getiriyor", A.bugunKartlari().length === 1, A.bugunKartlari().length + " kart");

    var o1 = A.ozet();
    ok("ozet toplam/bugun", o1.toplam === 1 && o1.bugun === 1, o1.toplam + " toplam / " + o1.bugun + " bugün");
    ok("ozet kutular → 1. kutu", o1.kutular[1] === 1 && o1.kutular[5] === 0, JSON.stringify(o1.kutular));
    ok("ozet dersler", o1.dersler["Türkçe"] === 1, JSON.stringify(o1.dersler));

    /* arayüz */
    A.ciz();
    ok("arayüz: 4 gösterge kutusu", $$("#kartAlan .kt-kutu").length === 4, $$("#kartAlan .kt-kutu").length + " kutu");
    ok("arayüz: bugün listesi kart sayısı", $$("#kartAlan .kt-kart").length === A.bugunKartlari().length, $$("#kartAlan .kt-kart").length + " kart");
    var kartEl = $("#kartAlan .kt-kart");
    ok("arayüz: 4 şık düğmesi", kartEl ? kartEl.querySelectorAll(".kt-sik").length === 4 : false, kartEl ? kartEl.querySelectorAll(".kt-sik").length + " şık" : "kart yok");
    ok("arayüz: ders özeti tablosu + toplam satırı", $$("#kartAlan .oyun-tablo tbody tr").length >= 1 && $$("#kartAlan .oyun-tablo tfoot .kt-toplam").length === 1,
       $$("#kartAlan .oyun-tablo tbody tr").length + " satır");
    ok("arayüz: numaralı liste kuralı (1. + toplam yazılı)",
       $$("#kartAlan .kt-sira").length >= 1 && /\(\d+ kart\)/.test($("#kartAlan").textContent) &&
       /\d+ kart/.test($("#kartAlan .kt-kutu b") ? $("#kartAlan .kt-kutu b").textContent : ""),
       ($("#kartAlan .kt-sira") ? $("#kartAlan .kt-sira").textContent : "?") + " / " + ($("#kartAlan .kt-kutu b") ? $("#kartAlan .kt-kutu b").textContent : "?"));

    /* doğru şıkka tıklama → yeşil + geri bildirim + veri güncellemesi */
    var dogruBtn = kartEl.querySelectorAll(".kt-sik")[2];
    dogruBtn.click();
    var geri = kartEl.querySelector(".kt-geri");
    ok("şıka basınca doğru: yeşil işaret + geri bildirim metni",
       dogruBtn.classList.contains("kt-dogru") && !!geri && geri.classList.contains("kt-iyi") && /Doğru!/.test(geri.textContent) && /gün sonra/.test(geri.textContent),
       geri ? geri.textContent.slice(0, 46) : "geri bildirim yok");
    var u1 = A.kayitlar()[0];
    ok("şıka basınca veri güncellendi (kutu 2 · kez 1)", u1.kutu === 2 && u1.kez === 1, JSON.stringify({ kutu: u1.kutu, kez: u1.kez }));

    /* API: doğru / yanlış */
    var d1 = A.kutuIlerlet(k.id, true);
    ok("kutuIlerlet(doğru) → kutu 3, sonraki bugün+7", d1 && d1.kutu === 3 && gunAnahtari(d1.sonraki) === gunAnahtari(new Date(Date.now() + 7 * GUN_MS)),
       d1 ? d1.kutu + ". kutu · " + gunAnahtari(d1.sonraki) : "yok");
    var y1 = A.kutuIlerlet(k.id, false);
    ok("kutuIlerlet(yanlış) → kutu 1'e döndü", y1 && y1.kutu === 1, y1 ? String(y1.kutu) : "yok");
    ok("yanlış → sonraki yarın", y1 && gunAnahtari(y1.sonraki) === gunAnahtari(new Date(Date.now() + GUN_MS)), y1 ? gunAnahtari(y1.sonraki) : "yok");
    ok("bugunKartlari süzüyor (sonraki yarın → bugün listede yok)", A.bugunKartlari().length === 0, A.bugunKartlari().length + " kart");

    /* aynı soru tekrar yanlış → yeni kayıt açılmaz */
    A.yanlisaEkle(soru, 3);
    var ks2 = A.kayitlar();
    ok("aynı soru tekrar yanlış → yeni kayıt açılmadı", ks2.length === 1, ks2.length + " kayıt");
    ok("tekrar yanlış → kez arttı, kutu 1, verilen güncellendi",
       ks2[0].kez === 4 && ks2[0].kutu === 1 && ks2[0].verilen === 3,
       JSON.stringify({ kez: ks2[0].kez, kutu: ks2[0].kutu, verilen: ks2[0].verilen }));
    ok("aynı soru tekrar yanlış → bugün listesine yeniden düştü", A.bugunKartlari().length === 1, A.bugunKartlari().length + " kart");

    /* 5. kutu sınırı */
    for (var i = 0; i < 7; i++) A.kutuIlerlet(k.id, true);
    var kk = A.kayitlar()[0];
    ok("5. kutu sınırı (en çok 5)", kk.kutu === 5, kk.kutu + ". kutu");
    ok("5. kutu → sonraki bugün+60, bugün listesi boş",
       gunAnahtari(kk.sonraki) === gunAnahtari(new Date(Date.now() + 60 * GUN_MS)) && A.bugunKartlari().length === 0,
       gunAnahtari(kk.sonraki) + " / " + A.bugunKartlari().length + " kart");
    ok("ozet 5. kutu sayısı", A.ozet().kutular[5] === 1, JSON.stringify(A.ozet().kutular));

    /* tüm kartlar paneli + silme */
    A.ciz();
    var tumBtn = $("#kartAlan [data-kt-tum]");
    if (tumBtn) tumBtn.click();
    ok("arayüz: 'Tüm kartlar' paneli kaydı listeliyor", $$("#kartAlan .kt-tum-satir").length === 1, $$("#kartAlan .kt-tum-satir").length + " satır");
    var silBtn = $("#kartAlan [data-kt-sil]");
    if (silBtn) silBtn.click();
    ok("arayüz: 'Kaydı sil' çalıştı", A.kayitlar().length === 0 && A.ozet().toplam === 0, A.kayitlar().length + " kayıt");
    ok("kayitSil(id) → doğru sonuç", A.kayitSil(k.id) === false, "silinmiş kayıtta false");
    A.ciz();
    var bos = $("#kartAlan .kt-bos");
    ok("boş durum metni + yönlendirme düğmeleri",
       !!bos && /Henüz kart yok/.test(bos.textContent) && $$("#kartAlan [data-kt-git]").length >= 2,
       bos ? bos.textContent.slice(0, 34).replace(/\s+/g, " ") : "yok");
    ok("ozet boş havuzda sıfır", A.ozet().toplam === 0 && A.ozet().bugun === 0 && A.ozet().kutular[1] === 0, JSON.stringify(A.ozet().kutular));

    /* temizlik: test verisi gitmesin */
    try {
      if (eskiHam === null) localStorage.removeItem(DEPO); else localStorage.setItem(DEPO, eskiHam);
    } catch (e) {}
    var geriHam = null;
    try { geriHam = localStorage.getItem(DEPO); } catch (e) {}
    ok("test verisi temizlendi (depo eski hâline döndü)", geriHam === eskiHam, geriHam === null ? "boş" : "geri yüklendi");
    A.ciz();

    var kap = document.createElement("div");
    kap.id = "kartTestSonuc";
    kap.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
    kap.innerHTML = "<h3>ÜSTAD KOÇ PRO · Kart Tekrarı testi</h3>" +
      t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
      "<hr><b>" + t.filter(function (x) { return x.indexOf("✔") === 0; }).length + " / " + t.length + " geçti</b>";
    document.body.appendChild(kap);
    /* Başlık işareti: diğer bölümlerin testleri motor.git() ile başlığı sıfırlayabildiği için
       işaret eksikse 10 saniye boyunca yeniden eklenir (yalnızca yoksa eklenir). */
    var gecenAdet = t.filter(function (x) { return x.indexOf("✔") === 0; }).length;
    var baslikYaz = function () {
      if (String(document.title).indexOf("KARTTEST") < 0) {
        document.title = (document.title || "") + " KARTTEST " + gecenAdet + "/" + t.length;
      }
    };
    baslikYaz();
    var sayac = 0;
    var zamanB = setInterval(function () { baslikYaz(); if (++sayac > 40) clearInterval(zamanB); }, 250);
  }

  if (location.search.indexOf("test=1") >= 0) {
    var kos = function () { setTimeout(kartTesti, 500); };
    if (document.readyState === "complete") kos();
    else window.addEventListener("load", kos);
  }
})();
