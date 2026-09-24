/* © 2026 Kenan Kuzucu · ÜSTAD KPSS-B KOÇ PRO · EĞİTİCİ OYUNLAR · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   4 oyun: bilgi yarışı · sayı avı · yazım avı · eşleştirme.
   İçerik uydurulmaz: sorular mevcut verilerden (özgün sorular, ders notları, 2026 güncel bilgi) üretilir,
   matematik sorularının cevabı kod içinde hesaplanır. */
(function () {
  "use strict";
  var O = window.KPSS_OYUN = window.KPSS_OYUN || {};

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function depoAl(k, v) { try { var s = localStorage.getItem("ustad." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } }
  function depoKoy(k, v) { try { localStorage.setItem("ustad." + k, JSON.stringify(v)); } catch (e) {} }
  function ses(metin) { try { if (window.KPSS_SES && KPSS_SES.konus) KPSS_SES.konus(metin, { zorla: true }); } catch (e) {} }
  function karistir(a) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }
  function enIyi() { return depoAl("oyunEnIyi", {}); }
  function enIyiKoy(id, puan, tur) {
    var e = enIyi();
    var eski = e[id];
    var yeni = (!eski) || (tur === "sure" ? puan < eski.puan : puan > eski.puan);
    if (yeni) { e[id] = { puan: puan, tarih: Date.now(), tur: tur || "puan" }; depoKoy("oyunEnIyi", e); }
    return yeni;
  }

  /* ───────────── içerik ───────────── */
  function ozgunSorular() { var c = window.KPSS_CIKMIS || window.CIKMIS || {}; return c.ozgun || []; }
  function guncelMaddeler() { var g = window.KPSS_GUNCEL || window.GUNCEL || {}; return g.maddeler || []; }
  function dersler() { var n = window.USTAD_NOTLAR || {}; return Object.keys(n).map(function (k) { return n[k]; }); }
  function kisalt(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  /* Yazım avı verisi: {doğru, yanlış, kural} — sık yapılan yazım yanlışları. */
  var YAZIM = [
    ["her şey", "herşey", "“şey” her zaman ayrı yazılır."],
    ["birçok", "bir çok", "“birçok” kalıplaşmış, bitişik yazılır."],
    ["yalnız", "yanlız", "Doğrusu “yalnız”dır; n ve l yer değiştirmez."],
    ["yanlış", "yalnış", "“yanlış” — yanıltmak kökünden."],
    ["hiçbir", "hiç bir", "“hiçbir” bitişik yazılır."],
    ["birkaç", "bir kaç", "“birkaç” bitişik yazılır."],
    ["başvuru", "baş vuru", "“başvuru” bitişik yazılır."],
    ["bugün", "bu gün", "“bugün” bitişik yazılır."],
    ["üstünkörü", "üstün körü", "“üstünkörü” bitişik yazılır."],
    ["kılavuz", "klavuz", "Doğrusu “kılavuz”dur."],
    ["şoför", "şöför", "Doğrusu “şoför”dür."],
    ["sürpriz", "süpriz", "Doğrusu “sürpriz”dir (ilk hecede r vardır)."],
    ["orijinal", "orjinal", "Doğrusu “orijinal”dir."],
    ["mütevazı", "mütevazi", "Alçakgönüllü anlamında “mütevazı” yazılır."],
    ["eşofman", "eşortman", "Doğrusu “eşofman”dır."],
    ["antrenman", "antreman", "Doğrusu “antrenman”dır."],
    ["perşembe", "perşenbe", "Doğrusu “perşembe”dir (m ile)."],
    ["nüfus", "nufus", "Doğrusu “nüfus”tur."],
    ["dinozor", "dinazor", "Doğrusu “dinozor”dur."],
    ["tren", "tiren", "Doğrusu “tren”dir."]
  ];

  /* ───────────── soru üreticileri ───────────── */
  /** Şıkları tekilleştirir ve 4'e tamamlar; mümkün değilse null döner (bozuk soru üretilmez). */
  function sikKur(dogruMetin, celdiriciler) {
    var hepsi = [dogruMetin];
    celdiriciler.forEach(function (c) {
      c = String(c == null ? "" : c).trim();
      if (c && hepsi.indexOf(c) < 0) hepsi.push(c);
    });
    if (hepsi.length < 4) return null;
    var secili = karistir(hepsi.slice(1)).slice(0, 3);
    var dord = karistir([dogruMetin].concat(secili));
    return { siklar: dord, dogru: dord.indexOf(dogruMetin) };
  }
  function bilgiSorulari() {
    var liste = [];
    // 1) ÖSYM tarzında ÖZGÜN sorular (mevcut banka)
    ozgunSorular().forEach(function (s) {
      var dogruMetin = s.siklar[s.dogru];
      var k = sikKur(dogruMetin, s.siklar.filter(function (_k, i) { return i !== s.dogru; }));
      if (!k) return;
      liste.push({ kaynak: "Özgün soru · " + (s.ders || ""), soru: s.soru, siklar: k.siklar,
                   dogru: k.dogru, aciklama: s.aciklama || "" });
    });
    // 2) Ders notları: konu → hangi ders?
    var ds = dersler();
    ds.forEach(function (d) {
      if (!d.baslik || !d.ders) return;
      var k = sikKur(d.ders, ds.filter(function (x) { return x.ders && x.ders !== d.ders; }).map(function (x) { return x.ders; }));
      if (!k) return;
      liste.push({ kaynak: "Ders notları", soru: "“" + d.baslik + "” konusu hangi derse aittir?",
                   siklar: k.siklar, dogru: k.dogru, aciklama: kisalt(d.ozet, 200) });
    });
    // 3) 2026 güncel bilgiler: konu → doğru bilgi
    var gm = guncelMaddeler();
    gm.forEach(function (m, i) {
      var dogru = kisalt(m.bilgi, 90);
      var k = sikKur(dogru, gm.filter(function (_x, j) { return j !== i; }).map(function (x) { return kisalt(x.bilgi, 90); }));
      if (!k) return;
      liste.push({ kaynak: "2026 güncel bilgi" + (m.tarih ? " · " + m.tarih : ""),
                   soru: "2026 güncel bilgiler — “" + m.konu + "” başlığında hangisi doğrudur?",
                   siklar: k.siklar, dogru: k.dogru, aciklama: kisalt(m.bilgi, 220) });
    });
    return liste;
  }
  function sayiSorusu() {
    var tip = Math.floor(Math.random() * 7), s, cevap, adim = "";
    if (tip === 0) { var a = 20 * (2 + Math.floor(Math.random() * 40)), y = [5, 10, 15, 20, 25, 40, 50][Math.floor(Math.random() * 7)];
      cevap = a * y / 100; s = a + " sayısının %" + y + "'i kaçtır?"; adim = a + " × " + y + " ÷ 100 = " + cevap; }
    else if (tip === 1) { var f = 40 * (2 + Math.floor(Math.random() * 20)), in_ = Math.round(f * 0.15);
      cevap = f - in_; s = "Etiket fiyatı " + f + " TL olan ürüne %15 indirim yapılırsa yeni fiyat kaç TL olur?"; adim = f + " − " + in_ + " = " + cevap; }
    else if (tip === 2) { var maliyet = 20 * (2 + Math.floor(Math.random() * 20)), satis = maliyet + maliyet * 0.25 / 1;
      cevap = 25; s = "Maliyeti " + maliyet + " TL olan ürün " + satis + " TL'ye satılırsa kâr yüzde kaçtır?"; adim = "kâr " + (satis - maliyet) + " TL → %25"; }
    else if (tip === 3) { var x = 3 + Math.floor(Math.random() * 12), y2 = 3 + Math.floor(Math.random() * 12);
      cevap = x * y2 - x; s = x + " × " + y2 + " − " + x + " işleminin sonucu kaçtır?"; adim = x + "×" + y2 + "=" + (x * y2) + ", " + (x * y2) + "−" + x + "=" + cevap; }
    else if (tip === 4) { var bolunen = 5 * (10 + Math.floor(Math.random() * 30)) + (1 + Math.floor(Math.random() * 4));
      cevap = bolunen % 5; s = bolunen + " sayısının 5 ile bölümünden kalan kaçtır?"; adim = bolunen + " = 5×" + Math.floor(bolunen / 5) + " + " + cevap; }
    else if (tip === 5) { var sayilar = [2 + Math.floor(Math.random() * 15), 5 + Math.floor(Math.random() * 15), 10 + Math.floor(Math.random() * 15)];
      while ((sayilar[0] + sayilar[1] + sayilar[2]) % 3 !== 0) sayilar[2]++;
      cevap = (sayilar[0] + sayilar[1] + sayilar[2]) / 3;
      s = sayilar.join(", ") + " sayılarının aritmetik ortalaması kaçtır?"; adim = "toplam " + (sayilar[0] + sayilar[1] + sayilar[2]) + " ÷ 3 = " + cevap; }
    else { var yasA = 8 + Math.floor(Math.random() * 10), yasB = 3 + Math.floor(Math.random() * 7), yil = 4 + Math.floor(Math.random() * 4);
      cevap = (yasA + yasB) + 2 * yil; s = "Ayşe " + yasA + ", kardeşi " + yasB + " yaşında. " + yil + " yıl sonra yaşlarının toplamı kaç olur?";
      adim = "şimdi " + (yasA + yasB) + ", +" + (2 * yil) + " = " + cevap; }
    var siklar = [cevap];
    var sapma = Math.max(1, Math.round(Math.abs(cevap) * (0.08 + Math.random() * 0.35)));
    var adaylar = karistir([cevap + sapma, cevap - sapma, cevap + 2 * sapma, cevap - 2 * sapma,
      cevap + 3 * sapma, cevap + 10, Math.max(1, Math.round(cevap * 1.5)), Math.max(1, Math.round(cevap / 2))]);
    adaylar.forEach(function (a) {
      a = Math.round(a * 100) / 100;
      if (siklar.length < 4 && a > 0 && siklar.indexOf(a) < 0) siklar.push(a);
    });
    var guvenlik = 0;
    while (siklar.length < 4 && guvenlik < 80) {                 // her koşulda 4 benzersiz şık
      guvenlik++;
      var r = 1 + Math.floor(Math.random() * 45);
      if (siklar.indexOf(r) < 0) siklar.push(r);
    }
    var karisik = karistir(siklar);
    return { kaynak: "Sayı avı", soru: s, siklar: karisik.map(String), dogru: karisik.indexOf(cevap), aciklama: adim };
  }
  function yazimSorusu(haric) {
    var havuz = YAZIM.filter(function (p) { return !haric || haric.indexOf(p[0]) < 0; });
    var p = havuz[Math.floor(Math.random() * havuz.length)];
    var siklar = karistir([p[0], p[1]]);
    return { kaynak: "Yazım avı", soru: "Aşağıdakilerden hangisinin yazımı DOĞRUDUR?", siklar: siklar,
             dogru: siklar.indexOf(p[0]), aciklama: p[2], anahtar: p[0] };
  }

  /* ───────────── oyun iskeleti ───────────── */
  var OYUNLAR = [
    { id: "bilgi", ad: "Bilgi Yarışı", simg: "⚡", aciklama: "30 saniyede kaç soru? Özgün sorular, ders notları ve 2026 güncel bilgiler karışık." },
    { id: "sayi", ad: "Sayı Avı", simg: "🔢", aciklama: "60 saniyede hızlı matematik: yüzde, indirim, kâr, ortalama… Cevap kod içinde hesaplanır." },
    { id: "yazim", ad: "Yazım Avı", simg: "✍️", aciklama: "Sık yapılan 20 yazım yanlışını yakala; her cevapta kuralı öğren." },
    { id: "esle", ad: "Eşleştirme", simg: "🧩", aciklama: "Ders başlığı ile püf noktasını eşleştir. Hafıza + dikkat." }
  ];
  var durum = null;   // { oyun, puan, seri, dogru, yanlis, kalan, soru, zamanlayici }

  O.bolumAc = function (kod) {
    if (kod === "oyun") secim();
    else if (durum && durum.zamanlayici) { clearInterval(durum.zamanlayici); durum.zamanlayici = null; }
  };

  function secim() {
    var kap = $("#oyunAlan"); if (!kap) return;
    if (durum && durum.zamanlayici) { clearInterval(durum.zamanlayici); durum.zamanlayici = null; }
    durum = null;
    var e = enIyi();
    kap.innerHTML =
      '<p class="aciklama">Eğitici oyunlar: içerik uygulamanın kendi ders notlarından, özgün soru bankasından ve ' +
        '2026 güncel bilgi paketinden üretilir. Doğru cevapta seri puanı (streak) artar.</p>' +
      '<div class="oyun-secim">' + OYUNLAR.map(function (o) {
        var iyi = e[o.id];
        return '<button class="oyun-kart" data-oyun="' + o.id + '"><b>' + o.simg + " " + o.ad + "</b>" +
          "<span>" + o.aciklama + "</span>" +
          (iyi ? '<span class="ka-etiket">en iyi: ' + iyi.puan + (iyi.tur === "sure" ? " sn" : " puan") + "</span>" : "") + "</button>";
      }).join("") + "</div>" +
      '<table class="oyun-tablo"><thead><tr><th>Oyun</th><th>En iyi</th><th>Tarih</th></tr></thead><tbody>' +
        OYUNLAR.map(function (o) {
          var iyi = e[o.id];
          return "<tr><td>" + o.simg + " " + o.ad + "</td><td>" + (iyi ? iyi.puan + (iyi.tur === "sure" ? " sn" : " puan") : "—") +
            "</td><td>" + (iyi ? new Date(iyi.tarih).toLocaleDateString("tr-TR") : "—") + "</td></tr>";
        }).join("") + "</tbody></table>";
    $$("#oyunAlan [data-oyun]").forEach(function (b) {
      b.addEventListener("click", function () { basla(b.getAttribute("data-oyun")); });
    });
  }
  function basla(id) {
    if (id === "esle") return eslemeBasla();
    var havuz = id === "sayi" ? null : (id === "yazim" ? null : bilgiSorulari());
    if (id === "bilgi" && (!havuz || havuz.length < 5)) { alert("Soru havuzu yetersiz."); return; }
    durum = { oyun: id, puan: 0, seri: 0, dogru: 0, yanlis: 0, kalan: id === "sayi" ? 60 : 30,
              havuz: havuz, yazimGecilen: [], soru: null };
    soruCiz();
    durum.zamanlayici = setInterval(function () {
      if (!durum) return;
      durum.kalan--;
      var s = $("#oyunSure"); if (s) s.style.width = Math.max(0, durum.kalan / (durum.oyun === "sayi" ? 60 : 30) * 100) + "%";
      var k = $("#oyunKalan"); if (k) k.textContent = durum.kalan;
      if (durum.kalan <= 0) bitir();
    }, 1000);
  }

  function soruAl() {
    if (durum.oyun === "sayi") return sayiSorusu();
    if (durum.oyun === "yazim") return yazimSorusu(durum.yazimGecilen);
    if (!durum.havuz || !durum.havuz.length) durum.havuz = bilgiSorulari();
    return durum.havuz.splice(Math.floor(Math.random() * durum.havuz.length), 1)[0];
  }
  function soruCiz() {
    var kap = $("#oyunAlan"); if (!kap || !durum) return;
    var s = durum.soru = soruAl();
    if (durum.oyun === "yazim") durum.yazimGecilen.push(s.anahtar);
    kap.innerHTML =
      '<div class="oyun-puan">' +
        '<div class="oyun-kutu"><b id="oyunPuan">' + durum.puan + "</b><span>PUAN</span></div>" +
        '<div class="oyun-kutu"><b id="oyunSeri">' + durum.seri + "🔥</b><span>SERİ</span></div>" +
        '<div class="oyun-kutu"><b>' + durum.dogru + "</b><span>DOĞRU</span></div>" +
        '<div class="oyun-kutu"><b>' + durum.yanlis + "</b><span>YANLIŞ</span></div>" +
        '<div class="oyun-kutu"><b id="oyunKalan">' + durum.kalan + "</b><span>" + (durum.oyun === "yazim" ? "KALAN SORU" : "SANİYE") + "</span></div>" +
      "</div>" +
      '<div class="oyun-sure"><i id="oyunSure" style="width:' + (durum.kalan / (durum.oyun === "sayi" ? 60 : 30) * 100) + '%"></i></div>' +
      '<div class="oyun-soru"><span class="ka-etiket">' + kacis(s.kaynak) + "</span>" +
        "<h4>" + kacis(s.soru) + "</h4>" +
        s.siklar.map(function (k, i) { return '<button class="oyun-sik" data-sik="' + i + '">' + "ABCD".charAt(i) + ") " + kacis(k) + "</button>"; }).join("") +
        '<div id="oyunGeri"></div>' +
        '<div class="ka-butonlar"><button class="ka-dugme ka-ikincil" id="oyunBitir">Oyunu bitir</button></div></div>';
    var cevaplandi = false;
    $$("#oyunAlan [data-sik]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (cevaplandi || !durum) return;
        cevaplandi = true;
        var secim = Number(b.getAttribute("data-sik")), dogruMu = secim === s.dogru;
        $$("#oyunAlan [data-sik]").forEach(function (c) {
          var i = Number(c.getAttribute("data-sik"));
          c.className = "oyun-sik" + (i === s.dogru ? " dogru" : (i === secim ? " yanlis" : " soluk"));
        });
        if (dogruMu) { durum.dogru++; durum.seri++; durum.puan += 10 + Math.min(10, durum.seri) * 2; ses("Doğru"); }
        else { durum.yanlis++; durum.seri = 0; durum.puan = Math.max(0, durum.puan - 3); ses("Yanlış. Doğru cevap " + "ABCD".charAt(s.dogru)); }
        $("#oyunGeri").innerHTML = '<div class="oyun-geri ' + (dogruMu ? "iyi" : "kotu") + '"><b>' +
          (dogruMu ? "✔ Doğru" : "✘ Yanlış — doğru cevap " + "ABCD".charAt(s.dogru) + ")") + "</b>" +
          (s.aciklama ? "<p>" + kacis(s.aciklama) + "</p>" : "") + "</div>";
        setTimeout(function () { if (durum && (durum.oyun === "yazim" ? durum.dogru + durum.yanlis < YAZIM.length : true)) soruCiz(); },
                   durum.oyun === "yazim" ? 1400 : 900);
      });
    });
    $("#oyunBitir").addEventListener("click", bitir);
  }
  function bitir() {
    if (!durum) return;
    if (durum.zamanlayici) clearInterval(durum.zamanlayici);
    var o = OYUNLAR.filter(function (x) { return x.id === durum.oyun; })[0] || { ad: "Oyun", simg: "🎮" };
    var d = durum; durum = null;
    var toplam = d.dogru + d.yanlis, yuzde = toplam ? Math.round(d.dogru / toplam * 100) : 0;
    var rekor = enIyiKoy(d.oyun, d.puan, "puan");
    $("#oyunAlan").innerHTML =
      '<div class="oyun-bitti"><h4>' + o.simg + " " + o.ad + " bitti!</h4>" +
      '<div class="oyun-puan">' +
        '<div class="oyun-kutu"><b>' + d.puan + "</b><span>PUAN</span></div>" +
        '<div class="oyun-kutu"><b>' + d.dogru + "</b><span>DOĞRU</span></div>" +
        '<div class="oyun-kutu"><b>' + d.yanlis + "</b><span>YANLIŞ</span></div>" +
        '<div class="oyun-kutu"><b>%' + yuzde + "</b><span>BAŞARI</span></div>" +
      "</div>" +
      (rekor ? '<p class="aciklama">🏆 Yeni rekor!</p>' : "") +
      '<div class="ka-butonlar">' +
        '<button class="ka-dugme" id="oyunTekrar">🔁 Yeniden oyna</button>' +
        '<button class="ka-dugme ka-ikincil" id="oyunListe">🎮 Oyun listesi</button>' +
      "</div></div>";
    ses("Oyun bitti. Puanın " + d.puan + ". Doğru " + d.dogru + ", yanlış " + d.yanlis + ".");
    $("#oyunTekrar").addEventListener("click", function () { basla(d.oyun); });
    $("#oyunListe").addEventListener("click", secim);
  }

  /* ───────────── 4) EŞLEŞTİRME ───────────── */
  function eslemeBasla() {
    var ds = dersler().filter(function (d) { return d.baslik && d.pufNoktalar && d.pufNoktalar.length; });
    if (ds.length < 4) { alert("Eşleştirme için ders notu yetersiz."); return; }
    var secili = karistir(ds).slice(0, 6);
    var pullar = [];
    secili.forEach(function (d, i) {
      pullar.push({ cift: i, tur: "baslik", metin: d.baslik, ders: d.ders });
      pullar.push({ cift: i, tur: "puf", metin: kisalt(d.pufNoktalar[0], 110), ders: d.ders });
    });
    durum = { oyun: "esle", pullar: karistir(pullar).map(function (p) { return Object.assign({ acik: false, eslesti: false }, p); }),
              acik: [], hamle: 0, baslangic: Date.now(), puan: 0 };
    tahtaCiz();
  }
  function tahtaCiz() {
    var kap = $("#oyunAlan"); if (!kap || !durum) return;
    var gecen = Math.round((Date.now() - durum.baslangic) / 1000);
    kap.innerHTML =
      '<div class="oyun-puan">' +
        '<div class="oyun-kutu"><b>' + durum.hamle + "</b><span>HAMLE</span></div>" +
        '<div class="oyun-kutu"><b>' + gecen + "</b><span>SANİYE</span></div>" +
        '<div class="oyun-kutu"><b>' + durum.pullar.filter(function (p) { return p.eslesti; }).length / 2 + "</b><span>EŞLEŞEN ÇİFT</span></div>" +
      "</div>" +
      '<p class="aciklama">Bir konu başlığına, o konunun püf noktasını eşleştir. Kart aç, çiftini bul.</p>' +
      '<div class="oyun-tahta">' + durum.pullar.map(function (p, i) {
        var kapaliMi = !p.acik && !p.eslesti;
        return '<button class="oyun-pul ' + (p.eslesti ? "eslesti" : (kapaliMi ? "kapali" : "acik")) + '" data-pul="' + i + '">' +
          (kapaliMi ? "?" : kacis(p.metin)) + "</button>";
      }).join("") + "</div>" +
      '<div class="ka-butonlar"><button class="ka-dugme ka-ikincil" id="oyunListe">🎮 Oyun listesi</button></div>';
    $$("#oyunTahta, #oyunAlan [data-pul]").forEach(function (b) {
      b.addEventListener("click", function () { pulAc(Number(b.getAttribute("data-pul"))); });
    });
    $("#oyunListe").addEventListener("click", function () { durum = null; secim(); });
  }
  function pulAc(i) {
    if (!durum || durum.oyun !== "esle") return;
    var p = durum.pullar[i];
    if (!p || p.eslesti || p.acik) return;
    p.acik = true;
    durum.acik.push(i);
    if (durum.acik.length === 2) {
      durum.hamle++;
      var a = durum.pullar[durum.acik[0]], b = durum.pullar[durum.acik[1]];
      if (a.cift === b.cift) {
        a.eslesti = b.eslesti = true;
        durum.acik = [];
        ses("Eşleşti");
      } else {
        var anlik = durum.acik.slice();
        durum.acik = [];
        setTimeout(function () {
          if (!durum) return;
          anlik.forEach(function (k) { durum.pullar[k].acik = false; });
          tahtaCiz();
        }, 900);
      }
    }
    tahtaCiz();
    if (durum && durum.pullar.every(function (x) { return x.eslesti; })) {
      var saniye = Math.round((Date.now() - durum.baslangic) / 1000);
      var puan = Math.max(20, 200 - durum.hamle * 6 - saniye);
      var rekor = enIyiKoy("esle", saniye, "sure");
      var h = durum.hamle;
      durum = null;
      $("#oyunAlan").innerHTML = '<div class="oyun-bitti"><h4>🧩 Eşleştirme tamam!</h4>' +
        '<div class="oyun-puan">' +
          '<div class="oyun-kutu"><b>' + saniye + "</b><span>SANİYE</span></div>" +
          '<div class="oyun-kutu"><b>' + h + "</b><span>HAMLE</span></div>" +
          '<div class="oyun-kutu"><b>' + puan + "</b><span>PUAN</span></div>" +
        "</div>" + (rekor ? '<p class="aciklama">🏆 En hızlı tamamlama!</p>' : "") +
        '<div class="ka-butonlar"><button class="ka-dugme" id="oyunTekrar">🔁 Yeniden</button>' +
        '<button class="ka-dugme ka-ikincil" id="oyunListe2">🎮 Oyun listesi</button></div></div>';
      ses("Tebrikler, tüm çiftleri buldun.");
      $("#oyunTekrar").addEventListener("click", eslemeBasla);
      $("#oyunListe2").addEventListener("click", secim);
    }
  }

  /* ───────────── kendi kendini test (?test=1) ───────────── */
  if (location.search.indexOf("test=1") >= 0) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        var t = [], ok = function (ad, kosul, ek) { t.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : "")); };
        var b = bilgiSorulari();
        ok("bilgi: soru havuzu 60+", b.length >= 60, b.length + " soru");
        ok("bilgi: her soru 4 şık", b.every(function (s) { return s.siklar.length === 4; }));
        ok("bilgi: doğru şık sınırda", b.every(function (s) { return s.dogru >= 0 && s.dogru <= 3; }));
        ok("bilgi: şıklar benzersiz", b.every(function (s) { return new Set(s.siklar).size === 4; }));
        ok("bilgi: açıklama var", b.every(function (s) { return !!s.aciklama; }));
        var yanlisSayi = 0;
        for (var i = 0; i < 40; i++) {
          var s2 = sayiSorusu();
          if (s2.siklar.length !== 4 || new Set(s2.siklar).size !== 4 || s2.dogru < 0) yanlisSayi++;
        }
        ok("sayı: 40 üretimde bozuk soru yok", yanlisSayi === 0, yanlisSayi + " bozuk");
        var y = yazimSorusu([]);
        ok("yazım: 2 şık ve doğru işaretli", y.siklar.length === 2 && y.siklar[y.dogru] === y.anahtar, y.siklar.join(" / "));
        ok("yazım: 20 çift veri", YAZIM.length === 20, YAZIM.length + " çift");
        ok("yazım: tüm çiftlerde doğru≠yanlış", YAZIM.every(function (p) { return p[0] !== p[1] && p[2]; }));
        secim();
        ok("oyun: 4 oyun kartı", $$("#oyunAlan [data-oyun]").length === 4, $$("#oyunAlan [data-oyun]").length + " kart");
        eslemeBasla();
        ok("eşleştirme: 12 pul", $$("#oyunAlan [data-pul]").length === 12, $$("#oyunAlan [data-pul]").length + " pul");
        ok("eşleştirme: 6 çift", durum && durum.pullar.length === 12 && durum.pullar.filter(function (p) { return p.tur === "baslik"; }).length === 6);
        basla("sayi");
        ok("sayı avı: soru çizildi", $$("#oyunAlan [data-sik]").length === 4, $$("#oyunAlan [data-sik]").length + " şık");
        ok("sayı avı: süre çubuğu", !!$("#oyunSure"));
        bitir();
        ok("oyun: bitiş ekranı", !!$("#oyunTekrar"));
        ok("oyun: rekor kaydı", !!enIyi().sayi, JSON.stringify(enIyi().sayi));
        var kap = document.createElement("div");
        kap.id = "oyunTestSonuc";
        kap.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
        kap.innerHTML = "<h3>KOÇ PRO · eğitici oyunlar testi</h3>" + t.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
          "<hr><b>" + t.filter(function (x) { return x.indexOf("✔") === 0; }).length + " / " + t.length + " geçti</b>";
        document.body.appendChild(kap);
        document.title = (document.title || "") + " OYUNTEST " + t.filter(function (x) { return x.indexOf("✔") === 0; }).length + "/" + t.length;
      }, 500);
    });
  }
})();
