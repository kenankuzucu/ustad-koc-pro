/* © 2026 Kenan Kuzucu · ÜSTAD KPSS-B KOÇ PRO · KPSS ARAÇLAR eklentisi · TÜM HAKLARI SAKLIDIR (5846 FSEK).
   Geri sayım · net & puan · 2026 güncel bilgiler · 2011-2021 çıkmış sorular.
   Ayrı uygulama değildir; KOÇ PRO'nun bölümleri arasına eklenir. Motor dosyalarına dokunulmaz. */
(function () {
  "use strict";
  var KA = window.KPSS_ARACLAR = window.KPSS_ARACLAR || {};

  var AY = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  var GUN = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function tarihYazi(t) { return t.getDate() + " " + AY[t.getMonth()] + " " + t.getFullYear() + " · " + GUN[t.getDay()]; }
  function iki(n) { return n < 10 ? "0" + n : "" + n; }
  function depoAl(k, v) { try { var s = localStorage.getItem("ustad.ka." + k); return s === null ? v : JSON.parse(s); } catch (e) { return v; } }
  function depoKoy(k, v) { try { localStorage.setItem("ustad.ka." + k, JSON.stringify(v)); } catch (e) {} }
  function konus(metin) {
    try {
      if (!window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance(metin);
      u.lang = "tr-TR"; u.rate = 0.98;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ───────────── veri kaynakları ───────────── */
  function takvim() { return window.KPSS_TAKVIM || window.TAKVIM || { sinavlar: [], sonuclar: [], yapi: null }; }
  function guncelMaddeler() { var g = window.KPSS_GUNCEL || window.GUNCEL || {}; return g.maddeler || []; }
  function guncelDerleme() { var g = window.KPSS_GUNCEL || window.GUNCEL || {}; return g.derleme || "-"; }
  function cikmisVeri() { return window.KPSS_CIKMIS || window.CIKMIS || { yillar: [], ozgun: [] }; }

  /* ───────────── 1) SINAV GERİ SAYIMI ───────────── */
  var sayimZaman = null;
  function hedefler() {
    return (takvim().sinavlar || []).map(function (s) {
      return { ad: s.ad, zaman: new Date(s.tarih).getTime(), ham: s };
    }).sort(function (a, b) { return a.zaman - b.zaman; });
  }
  function siradaki() {
    var simdi = Date.now(), hs = hedefler(), sec = null;
    for (var i = 0; i < hs.length; i++) { if (hs[i].zaman > simdi) { sec = hs[i]; break; } }
    if (!sec) sec = hs[hs.length - 1];
    if (!sec) return null;
    var fark = sec.zaman - simdi;
    return { s: sec, gun: fark > 0 ? Math.floor(fark / 86400000) : 0, gecti: fark <= 0 };
  }
  function sayimTikle() {
    var sd = siradaki(); if (!sd) return;
    var kalan = Math.max(0, sd.s.zaman - Date.now());
    var d = Math.floor(kalan / 86400000), sa = Math.floor(kalan % 86400000 / 3600000),
        dk = Math.floor(kalan % 3600000 / 60000), sn = Math.floor(kalan % 60000 / 1000);
    var e;
    if ((e = $("#kaHedefAd"))) e.textContent = sd.s.ad;
    if ((e = $("#kaGun"))) e.textContent = iki(d);
    if ((e = $("#kaSaat"))) e.textContent = iki(sa);
    if ((e = $("#kaDakika"))) e.textContent = iki(dk);
    if ((e = $("#kaSaniye"))) e.textContent = iki(sn);
    if ((e = $("#kaSayimNot"))) {
      var t = new Date(sd.s.zaman);
      e.innerHTML = "<b>" + tarihYazi(t) + "</b> · " + iki(t.getHours()) + ":" + iki(t.getMinutes()) +
        (sd.s.ham && sd.s.ham.sure ? " · " + kacis(sd.s.ham.sure) : "") +
        (sd.s.ham && sd.s.ham.not ? " · " + kacis(sd.s.ham.not) : "");
    }
  }
  function sayimListe() {
    var kap = $("#kaSayimListe"); if (!kap) return;
    var simdi = Date.now(), sd = siradaki();
    kap.innerHTML = (takvim().sinavlar || []).map(function (s) {
      var t = new Date(s.tarih), fark = t.getTime() - simdi, gecti = fark <= 0;
      var gun = Math.floor(Math.abs(fark) / 86400000);
      return '<div class="ka-hedef' + (gecti ? " gecti" : (sd && s.ad === sd.s.ad ? " simdi" : "")) + '">' +
        '<b>' + kacis(s.ad) + '</b><span>' + tarihYazi(t) + (s.sure ? " · " + kacis(s.sure) : "") + "</span>" +
        '<em>' + (gecti ? "yapıldı" : gun + " gün") + "</em></div>";
    }).join("") +
      ((takvim().sonuclar || []).length ? '<div class="ka-alt-baslik">Sonuç açıklama tarihleri</div>' +
        (takvim().sonuclar).map(function (s) {
          var t = new Date(s.tarih), gecti = t.getTime() < simdi;
          var gun = Math.floor((t.getTime() - simdi) / 86400000);
          return '<div class="ka-hedef sonuc"><b>' + kacis(s.ad) + '</b><span>' + tarihYazi(t) + "</span>" +
            "<em>" + (gecti ? "açıklandı" : gun + " gün") + "</em></div>";
        }).join("") : "");
  }
  function yapiTablosu() {
    var kap = $("#kaYapi"); if (!kap) return;
    var y = takvim().yapi; if (!y) { kap.innerHTML = ""; return; }
    var toplam = y.testler.reduce(function (a, b) { return a + b.soru; }, 0);
    kap.innerHTML = '<p class="aciklama">' + kacis(y.oturum) + "</p><p class=\"aciklama\">" + kacis(y.kural) + "</p>" +
      '<table class="ka-tablo"><thead><tr><th>Test</th><th>Ders</th><th>Soru</th></tr></thead><tbody>' +
      y.testler.map(function (t) {
        return "<tr><td>" + kacis(t.ad) + "</td><td>" + kacis(t.ders) + '</td><td class="rakam">' + t.soru + "</td></tr>";
      }).join("") + '<tr class="toplam"><td><b>Toplam</b></td><td>Genel Yetenek + Genel Kültür</td><td class="rakam"><b>' +
      toplam + "</b></td></tr></tbody></table>";
  }
  KA.sayimCiz = function () {
    var kap = $("#kaSayimAlan"); if (!kap) return;
    kap.innerHTML =
      '<div class="ka-sayim-kutular">' +
        ['<div class="ka-kutu"><b id="kaGun">00</b><span>GÜN</span></div>',
         '<div class="ka-kutu"><b id="kaSaat">00</b><span>SAAT</span></div>',
         '<div class="ka-kutu"><b id="kaDakika">00</b><span>DAKİKA</span></div>',
         '<div class="ka-kutu"><b id="kaSaniye">00</b><span>SANİYE</span></div>'].join("") +
      "</div>" +
      '<h3 class="ka-orta" id="kaHedefAd">—</h3>' +
      '<p class="aciklama" id="kaSayimNot"></p>' +
      '<div class="ka-butonlar">' +
        '<button class="ka-dugme" id="kaHatirla">🔔 Sınav hatırlatıcısı kur</button>' +
        '<button class="ka-dugme ka-ikincil" id="kaSesle">🔊 Kalan günü oku</button>' +
      "</div>" +
      '<div class="ka-liste" id="kaSayimListe"></div>' +
      '<div id="kaYapi"></div>';
    sayimTikle(); sayimListe(); yapiTablosu();
    if (sayimZaman) clearInterval(sayimZaman);
    sayimZaman = setInterval(function () { sayimTikle(); }, 1000);
    $("#kaHatirla").addEventListener("click", hatirlatici);
    $("#kaSesle").addEventListener("click", function () {
      var sd = siradaki();
      if (sd) konus(sd.s.ad + " sınavına " + sd.gun + " gün kaldı.");
    });
  };
  function hatirlatici() {
    var sd = siradaki(); if (!sd) return;
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    var kalan = sd.s.zaman - Date.now(), plan = 0;
    [7, 1].forEach(function (gun) {
      var ms = kalan - gun * 86400000;
      if (ms > 0) { setTimeout(function () {
        bildir("ÜSTAD KOÇ PRO · " + gun + " gün kaldı", sd.s.ad + " — " + tarihYazi(new Date(sd.s.zaman)));
      }, ms); plan++; }
    });
    depoKoy("hatirlatici", { ad: sd.s.ad, zaman: sd.s.zaman, gunler: [7, 1], kuruldu: Date.now() });
    konus("Hatırlatıcı kuruldu. Sınava son " + sd.gun + " gün.");
    alert(plan + " hatırlatıcı planlandı: " + sd.s.ad + "\n(Sınavdan 7 gün ve 1 gün önce bildirim.)");
  }
  function bildir(baslik, metin) {
    try { if ("Notification" in window && Notification.permission === "granted") new Notification(baslik, { body: metin }); } catch (e) {}
  }

  /* ───────────── 2) NET & PUAN ───────────── */
  KA.VARSAYIM = { ortalama: 55, ss: 15, puanOrt: 50, puanSS: 10 };
  KA.gosterge = function (dogru) {
    var v = KA.VARSAYIM, p = v.puanOrt + v.puanSS * (dogru - v.ortalama) / v.ss;
    if (p < 0) p = 0; if (p > 100) p = 100;
    return Math.round(p * 10) / 10;
  };
  function sayi(id) { var e = $("#" + id); var v = parseInt(e && e.value ? e.value : "0", 10); return isNaN(v) ? 0 : v; }
  function bosluklar() {
    ["kaGy", "kaGk"].forEach(function (on) {
      var d = sayi(on + "D"), y = sayi(on + "Y"), b = 60 - d - y;
      var e = $("#" + on + "Bos");
      if (e) { e.textContent = "boş: " + (b < 0 ? "!" : b); e.className = "ka-etiket" + (b < 0 ? " ka-hata" : ""); }
    });
  }
  KA.hesapla = function (sessiz) {
    bosluklar();
    var gyD = sayi("kaGyD"), gyY = sayi("kaGyY"), gkD = sayi("kaGkD"), gkY = sayi("kaGkY");
    var kap = $("#kaPuanSonuc"); if (!kap) return null;
    if (gyD + gyY > 60 || gkD + gkY > 60) {
      kap.innerHTML = '<p class="ka-hata">✘ Genel Yetenek ve Genel Kültür testlerinin her birinde doğru + yanlış 60\'ı geçemez.</p>';
      return null;
    }
    var tDogru = gyD + gkD, yuzde = Math.round(tDogru / 120 * 1000) / 10, hedef = sayi("kaHedef");
    var puan = KA.gosterge(tDogru), fark = tDogru - hedef;
    kap.innerHTML =
      '<div class="ka-sonuc-izgara">' +
        '<div><span class="ka-etiket">TOPLAM DOĞRU</span><b class="ka-buyuk">' + tDogru + "/120</b></div>" +
        '<div><span class="ka-etiket">NET (yanlış götürmez)</span><b class="ka-buyuk">' + tDogru + "</b></div>" +
        '<div><span class="ka-etiket">YÜZDE</span><b class="ka-buyuk">' + yuzde + "%</b></div>" +
        '<div><span class="ka-etiket">GÖSTERGE PUAN*</span><b class="ka-buyuk">' + puan + "</b></div>" +
      "</div>" +
      '<table class="ka-tablo"><thead><tr><th>Test</th><th>Doğru</th><th>Yanlış</th><th>Boş</th></tr></thead><tbody>' +
        "<tr><td>Genel Yetenek</td><td class='rakam'>" + gyD + "</td><td class='rakam'>" + gyY + "</td><td class='rakam'>" + (60 - gyD - gyY) + "</td></tr>" +
        "<tr><td>Genel Kültür</td><td class='rakam'>" + gkD + "</td><td class='rakam'>" + gkY + "</td><td class='rakam'>" + (60 - gkD - gkY) + "</td></tr>" +
      "</tbody></table>" +
      '<p class="aciklama">' + (fark >= 0 ? "🎯 Hedefini (" + hedef + " doğru) " + fark + " doğru aştın."
        : "🎯 Hedefe " + Math.abs(fark) + " doğru kaldı (hedef " + hedef + ").") + "</p>" +
      '<p class="aciklama">* Gösterge puan varsayımla hesaplanır (ortalama ' + KA.VARSAYIM.ortalama +
        " doğru, standart sapma " + KA.VARSAYIM.ss + " → standart puan ort. " + KA.VARSAYIM.puanOrt +
        "/SS " + KA.VARSAYIM.puanSS + "). Resmî KPSS puanı yalnızca ÖSYM sonuç belgesinde geçerlidir.</p>";
    if (!sessiz) konus("Toplam " + tDogru + " doğru. Yüzde " + yuzde + ".");
    return { tDogru: tDogru, yuzde: yuzde, gosterge: puan };
  };
  function denemeCiz() {
    var kap = $("#kaDenemeler"); if (!kap) return;
    var g = depoAl("denemeler", []);
    if (!g.length) { kap.innerHTML = '<p class="aciklama">Kayıtlı hızlı deneme yok. Sayıları girip "Bu denemeyi kaydet"e bas.</p>'; return; }
    kap.innerHTML = '<table class="ka-tablo"><thead><tr><th>#</th><th>Tarih</th><th>Doğru</th><th>Yüzde</th><th>Gösterge</th><th></th></tr></thead><tbody>' +
      g.slice().reverse().map(function (d, i) {
        return "<tr><td class='rakam'>" + (g.length - i) + "</td><td>" + new Date(d.tarih).toLocaleDateString("tr-TR") +
          "</td><td class='rakam'><b>" + d.tDogru + "</b></td><td class='rakam'>" + d.yuzde + "%</td><td class='rakam'>" +
          d.gosterge + "</td><td><button class='ka-mini' data-ka-sil='" + d.id + "'>sil</button></td></tr>";
      }).join("") + "</tbody></table>";
    $$("#kaDenemeler [data-ka-sil]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-ka-sil");
        depoKoy("denemeler", depoAl("denemeler", []).filter(function (x) { return x.id !== id; }));
        denemeCiz();
      });
    });
  }
  KA.puanCiz = function () {
    var kap = $("#kaPuanAlan"); if (!kap) return;
    kap.innerHTML =
      '<p class="aciklama">KPSS\'de yanlış doğruyu götürmez: <b>net = doğru sayısı</b>. Deneme sonucunu buraya gir, anında gör.</p>' +
      '<div class="ka-form">' +
        '<div class="ka-test"><h4>Genel Yetenek (60)</h4>' +
          '<label>Doğru<input type="number" id="kaGyD" min="0" max="60" value="0"></label>' +
          '<label>Yanlış<input type="number" id="kaGyY" min="0" max="60" value="0"></label>' +
          '<span class="ka-etiket" id="kaGyBos">boş: 60</span></div>' +
        '<div class="ka-test"><h4>Genel Kültür (60)</h4>' +
          '<label>Doğru<input type="number" id="kaGkD" min="0" max="60" value="0"></label>' +
          '<label>Yanlış<input type="number" id="kaGkY" min="0" max="60" value="0"></label>' +
          '<span class="ka-etiket" id="kaGkBos">boş: 60</span></div>' +
      "</div>" +
      '<label class="ka-hedef-gir">Hedeflediğin toplam doğru<input type="number" id="kaHedef" min="0" max="120" value="' +
        depoAl("hedef", 85) + '"></label>' +
      '<div class="ka-butonlar">' +
        '<button class="ka-dugme" id="kaHesapla">Hesapla</button>' +
        '<button class="ka-dugme ka-ikincil" id="kaKaydet">Bu denemeyi kaydet</button>' +
        '<button class="ka-dugme ka-ikincil" id="kaTemizle">Temizle</button>' +
      "</div>" +
      '<div class="ka-sonuc" id="kaPuanSonuc"><p class="aciklama">Doğru ve yanlış sayılarını girip <b>Hesapla</b>\'ya bas.</p></div>' +
      '<h3 class="ka-orta">📈 Kayıtlı hızlı denemeler</h3>' +
      '<div id="kaDenemeler"></div>';
    ["kaGyD","kaGyY","kaGkD","kaGkY"].forEach(function (id) {
      $("#" + id).addEventListener("input", function () { bosluklar(); KA.hesapla(true); });
    });
    $("#kaHedef").addEventListener("change", function () { depoKoy("hedef", sayi("kaHedef")); });
    $("#kaHesapla").addEventListener("click", function () { KA.hesapla(false); });
    $("#kaKaydet").addEventListener("click", function () {
      var o = KA.hesapla(true);
      if (!o) { alert("Önce sayıları düzelt."); return; }
      var g = depoAl("denemeler", []);
      g.push({ id: "d" + Date.now(), tarih: new Date().toISOString(), tDogru: o.tDogru, yuzde: o.yuzde, gosterge: o.gosterge });
      depoKoy("denemeler", g);
      denemeCiz();
      alert("Deneme kaydedildi (" + o.tDogru + " doğru).");
    });
    $("#kaTemizle").addEventListener("click", function () {
      ["kaGyD","kaGyY","kaGkD","kaGkY"].forEach(function (id) { $("#" + id).value = 0; });
      bosluklar(); KA.hesapla(true);
    });
    bosluklar(); denemeCiz();
  };

  /* ───────────── 3) 2026 GÜNCEL BİLGİLER ───────────── */
  KA.guncelCiz = function () {
    var kap = $("#kaGuncelAlan"); if (!kap) return;
    var hepsi = guncelMaddeler();
    if (!hepsi.length) { kap.innerHTML = '<p class="aciklama">Güncel bilgi paketi yüklenemedi.</p>'; return; }
    var konular = [];
    hepsi.forEach(function (m) { if (m.konu && konular.indexOf(m.konu) < 0) konular.push(m.konu); });
    kap.innerHTML =
      '<p class="aciklama">' + hepsi.length + " güncel bilgi · derleme: " + kacis(guncelDerleme()) +
        " · her madde kaynaklıdır (kaynağı doğrulanamayan bilgi pakete alınmadı).</p>" +
      '<div class="ka-butonlar">' +
        '<input class="ka-ara" id="kaGAra" placeholder="Ara: kişi, kurum, sayı, olay…">' +
        '<select id="kaGFiltre"><option value="">Tüm konular</option>' +
          konular.map(function (k) { return "<option>" + kacis(k) + "</option>"; }).join("") + "</select>" +
        '<button class="ka-dugme" id="kaGTekrar">🎯 Hızlı tekrar (10 kart)</button>' +
      "</div>" +
      '<div id="kaGListe"></div>' +
      '<div id="kaGTekrarAlan" style="display:none"></div>';
    function ciz() {
      var q = ($("#kaGAra").value || "").toLocaleLowerCase("tr-TR"), f = $("#kaGFiltre").value;
      var liste = hepsi.filter(function (m) {
        if (f && m.konu !== f) return false;
        if (!q) return true;
        return (m.konu + " " + m.bilgi).toLocaleLowerCase("tr-TR").indexOf(q) >= 0;
      });
      $("#kaGListe").innerHTML = liste.length ? liste.map(function (m, i) {
        return '<div class="ka-guncel"><h4>' + kacis(m.konu) +
          (m.guvenilirlik === "orta" ? ' <span class="ka-etiket">tek kaynak</span>' : "") + "</h4>" +
          "<p>" + kacis(m.bilgi) + "</p>" + (m.tarih ? '<span class="ka-etiket">' + kacis(m.tarih) + "</span> " : "") +
          (m.kaynak_url ? '<a href="' + kacis(m.kaynak_url) + '" target="_blank" rel="noopener">kaynak: ' +
            kacis(m.kaynak_ad || "bağlantı") + "</a>" : "") +
          ' <button class="ka-mini" data-ka-oku="' + i + '">🔊 oku</button></div>';
      }).join("") : '<p class="aciklama">Aramaya uyan madde yok.</p>';
      $$("#kaGListe [data-ka-oku]").forEach(function (b) {
        b.addEventListener("click", function () {
          var m = liste[parseInt(b.getAttribute("data-ka-oku"), 10)];
          if (m) konus(m.konu + ". " + m.bilgi);
        });
      });
    }
    $("#kaGAra").addEventListener("input", ciz);
    $("#kaGFiltre").addEventListener("change", ciz);
    $("#kaGTekrar").addEventListener("click", tekrarBaslat);
    ciz();
  };
  function tekrarBaslat() {
    var kap = $("#kaGTekrarAlan"), hepsi = guncelMaddeler();
    if (!kap || hepsi.length < 4) { alert("Tekrar için yeterli madde yok."); return; }
    var kopya = hepsi.slice(), sec = [];
    while (sec.length < 10 && kopya.length) sec.push(kopya.splice(Math.floor(Math.random() * kopya.length), 1)[0]);
    var i = 0, bilinen = 0;
    kap.style.display = "";
    function kart() {
      if (i >= sec.length) {
        kap.innerHTML = '<div class="ka-guncel"><h4>🎯 Tekrar bitti</h4><p>' + sec.length + " kartın " + bilinen +
          " tanesini biliyordun.</p><button class='ka-dugme' id='kaGKapat'>Kapat</button></div>";
        $("#kaGKapat").addEventListener("click", function () { kap.style.display = "none"; kap.innerHTML = ""; });
        konus("Tekrar bitti. " + bilinen + " kart bildin.");
        return;
      }
      var m = sec[i];
      kap.innerHTML = '<div class="ka-guncel"><span class="ka-etiket">Kart ' + (i + 1) + "/" + sec.length + "</span>" +
        "<h4>" + kacis(m.konu) + "</h4>" +
        '<div id="kaGCevap" style="display:none"><p>' + kacis(m.bilgi) + "</p>" +
        (m.kaynak_url ? '<a href="' + kacis(m.kaynak_url) + '" target="_blank" rel="noopener">kaynak: ' + kacis(m.kaynak_ad || "") + "</a>" : "") + "</div>" +
        '<div class="ka-butonlar"><button class="ka-dugme" id="kaGKAc">Cevabı göster</button>' +
        '<button class="ka-dugme ka-ikincil" id="kaGKBil" style="display:none">✔ Biliyorum</button>' +
        '<button class="ka-dugme ka-ikincil" id="kaGKTek" style="display:none">🔁 Tekrar et</button></div></div>';
      $("#kaGKAc").addEventListener("click", function () {
        $("#kaGCevap").style.display = "block";
        $("#kaGKAc").style.display = "none"; $("#kaGKBil").style.display = ""; $("#kaGKTek").style.display = "";
      });
      $("#kaGKBil").addEventListener("click", function () { bilinen++; i++; kart(); });
      $("#kaGKTek").addEventListener("click", function () { sec.push(m); i++; kart(); });
    }
    kart();
  }

  /* ───────────── 4) ÇIKMIŞ SORULAR (2011-2021) ───────────── */
  var cSecYil = null;
  KA.cikmisCiz = function () {
    var kap = $("#kaCikmisAlan"); if (!kap) return;
    var C = cikmisVeri();
    kap.innerHTML =
      '<div class="ka-uyari"><b>Telif:</b> ÖSYM kitapçıklarında "Bu soruların telif hakları ÖSYM\'ye aittir. Sorular ÖSYM\'nin yazılı izni ' +
        'olmaksızın hiçbir kişi, kurum veya kuruluş tarafından kullanılamaz." yazar. Bu yüzden soru metinleri uygulamaya alınmaz; ' +
        "resmî kitapçık bağlantıları verilir ve alıştırma soruları <b>tamamen özgün</b> yazılır.</div>" +
      '<h3 class="ka-orta">📘 Yıl seç (2011-2021)</h3>' +
      '<div class="ka-yillar" id="kaYillar">' + C.yillar.map(function (y) {
        return '<button class="ka-mini" data-ka-yil="' + y.yil + '">' + y.yil + "</button>";
      }).join("") + "</div>" +
      '<div id="kaYilDetay"></div>' +
      '<h3 class="ka-orta">🧠 ÖSYM tarzında özgün sorular (' + (C.ozgun || []).length + " soru)</h3>" +
      '<p class="aciklama">Aşağıdaki sorular tamamen özgün yazılmıştır; ÖSYM sorularının kopyası değildir. Cevabı seç, anında geri bildirim al.</p>' +
      '<div class="ka-butonlar" id="kaDersler"></div>' +
      '<div id="kaSoruAlan"></div>';
    $$("#kaYillar [data-ka-yil]").forEach(function (b) {
      b.addEventListener("click", function () { yilCiz(b.getAttribute("data-ka-yil")); });
    });
    var dersler = [];
    (C.ozgun || []).forEach(function (s) { if (dersler.indexOf(s.ders) < 0) dersler.push(s.ders); });
    $("#kaDersler").innerHTML = '<button class="ka-dugme" data-ka-ders="">Tümü (' + (C.ozgun || []).length + ")</button>" +
      dersler.map(function (d) {
        var n = (C.ozgun || []).filter(function (s) { return s.ders === d; }).length;
        return '<button class="ka-dugme ka-ikincil" data-ka-ders="' + kacis(d) + '">' + kacis(d) + " (" + n + ")</button>";
      }).join("");
    $$("#kaDersler [data-ka-ders]").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("#kaDersler .ka-dugme").forEach(function (x) { x.className = "ka-dugme ka-ikincil"; });
        b.className = "ka-dugme";
        sorulariHazirla(b.getAttribute("data-ka-ders") || null);
      });
    });
    if (C.yillar.length) yilCiz(C.yillar[C.yillar.length - 1].yil);
    sorulariHazirla(null);
  };
  function yilCiz(yil) {
    var C = cikmisVeri(), y = C.yillar.filter(function (x) { return String(x.yil) === String(yil); })[0];
    if (!y) return;
    cSecYil = yil;
    $$("#kaYillar [data-ka-yil]").forEach(function (b) {
      b.className = "ka-mini" + (b.getAttribute("data-ka-yil") === String(yil) ? " ka-secili" : "");
    });
    $("#kaYilDetay").innerHTML = '<div class="ka-yil-kutu"><h4>' + y.yil + " · " + kacis(y.tur || "KPSS") + "</h4>" +
      '<p class="aciklama">' + kacis(y.yapi || "60 Genel Yetenek + 60 Genel Kültür / 130 dakika") + "</p>" +
      '<div class="ka-etiketler">' + (y.konu || []).map(function (k) { return '<span class="ka-etiket">' + kacis(k) + "</span>"; }).join("") + "</div>" +
      '<div class="ka-butonlar">' +
        (y.kitapciklar || []).map(function (k) {
          return '<a class="ka-dugme ka-ikincil" href="' + kacis(k.url) + '" target="_blank" rel="noopener">📄 ' +
            kacis((k.tur || "Lisans") + " kitapçığı") + "</a>";
        }).join("") +
        (y.duyuru_url ? '<a class="ka-dugme ka-ikincil" href="' + kacis(y.duyuru_url) + '" target="_blank" rel="noopener">📰 ÖSYM duyuru sayfası</a>' : "") +
        (y.arsiv_url ? '<a class="ka-dugme" href="' + kacis(y.arsiv_url) + '" target="_blank" rel="noopener">🏛 ÖSYM soru kitapçığı sayfası</a>' : "") +
        ((y.kitapciklar || []).length ? "" : '<span class="ka-etiket">doğrulanmış doğrudan PDF yok — resmî sayfadan yıl seç</span>') +
      "</div>" + (y.not ? '<p class="aciklama">' + kacis(y.not) + "</p>" : "") + "</div>";
  }
  var sorular = [], sira = 0, durum = [];
  function sorulariHazirla(ders) {
    var hepsi = cikmisVeri().ozgun || [];
    sorular = ders ? hepsi.filter(function (s) { return s.ders === ders; }) : hepsi;
    sira = 0; durum = [];
    soruCiz();
  }
  function soruCiz() {
    var kap = $("#kaSoruAlan"); if (!kap) return;
    if (!sorular.length) { kap.innerHTML = '<p class="aciklama">Bu derste soru yok.</p>'; return; }
    if (sira >= sorular.length) {
      var d = durum.filter(function (x) { return x; }).length;
      kap.innerHTML = '<div class="ka-yesil"><h4>✅ Set bitti</h4><p>' + sorular.length + " sorunun " + d +
        " tanesini doğru cevapladın (yüzde " + Math.round(d / sorular.length * 100) + ").</p>" +
        '<div class="ka-butonlar"><button class="ka-dugme" id="kaBasla">Baştan çöz</button>' +
        '<button class="ka-dugme ka-ikincil" id="kaYanlislar">Yanlışları tekrar çöz</button></div></div>';
      $("#kaBasla").addEventListener("click", function () { sorulariHazirla(cSecDers()); });
      $("#kaYanlislar").addEventListener("click", function () {
        var y = sorular.filter(function (s, i) { return !durum[i]; });
        if (!y.length) { alert("Yanlışın yok, hepsini doğru cevapladın. 🎉"); return; }
        sorular = y; durum = []; sira = 0; soruCiz();
      });
      konus("Set bitti. " + d + " doğru.");
      return;
    }
    var s = sorular[sira];
    kap.innerHTML = '<div class="ka-soru"><div class="ka-ust"><span class="ka-etiket">' + kacis(s.ders) + " · " + kacis(s.konu) +
      '</span><span class="ka-etiket">Soru ' + (sira + 1) + " / " + sorular.length + "</span></div>" +
      '<p class="ka-soru-metin">' + kacis(s.soru) + "</p>" +
      s.siklar.map(function (k, i) {
        return '<button class="ka-sik" data-ka-sik="' + i + '">' + "ABCDE".charAt(i) + ") " + kacis(k) + "</button>";
      }).join("") + '<div id="kaGeri"></div>' +
      '<div class="ka-butonlar"><button class="ka-dugme" id="kaSonraki" style="display:none">Sonraki soru →</button></div></div>';
    var cevaplandi = false;
    $$("#kaSoruAlan [data-ka-sik]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (cevaplandi) return;
        cevaplandi = true;
        var verilen = parseInt(b.getAttribute("data-ka-sik"), 10), dogru = verilen === s.dogru;
        durum[sira] = dogru;
        $$("#kaSoruAlan [data-ka-sik]").forEach(function (c) {
          var i = parseInt(c.getAttribute("data-ka-sik"), 10);
          if (i === s.dogru) c.className = "ka-sik dogru";
          else if (i === verilen) c.className = "ka-sik yanlis";
          else c.className = "ka-sik soluk";
        });
        $("#kaGeri").innerHTML = '<div class="ka-geri ' + (dogru ? "iyi" : "kotu") + '"><b>' +
          (dogru ? "✔ Doğru cevap verdin." : "✘ Yanlış. Doğru cevap: " + "ABCDE".charAt(s.dogru) + ") " + kacis(s.siklar[s.dogru])) +
          "</b>" + (s.aciklama ? "<p>" + kacis(s.aciklama) + "</p>" : "") + "</div>";
        $("#kaSonraki").style.display = "";
        konus(dogru ? "Doğru cevap verdiniz." : "Yanlış. Doğru cevap " + "ABCDE".charAt(s.dogru) + ".");
      });
    });
    $("#kaSonraki").addEventListener("click", function () { sira++; soruCiz(); });
  }
  function cSecDers() { var b = document.querySelector("#kaDersler .ka-dugme:not(.ka-ikincil)"); return b ? b.getAttribute("data-ka-ders") || null : null; }

  /* ───────────── bölüm açılışları ───────────── */
  KA.bolumAc = function (kod) {
    if (kod === "sayim") KA.sayimCiz();
    else if (kod === "puan") KA.puanCiz();
    else if (kod === "guncel") KA.guncelCiz();
    else if (kod === "cikmis") KA.cikmisCiz();
    if (sayimZaman && kod !== "sayim") { clearInterval(sayimZaman); sayimZaman = null; }
  };

  /* ───────────── kendi kendini test (?test=1) ───────────── */
  if (location.search.indexOf("test=1") >= 0) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        var s = [], ok = function (ad, kosul, ek) { s.push((kosul ? "✔" : "✘") + " " + ad + (ek ? " → " + ek : "")); };
        var tk = takvim();
        ok("takvim: sınav listesi", (tk.sinavlar || []).length >= 3, (tk.sinavlar || []).length + " kayıt");
        ok("takvim: tarihler sıralı", (tk.sinavlar || []).every(function (x, i, a) { return i === 0 || new Date(a[i - 1].tarih) <= new Date(x.tarih); }));
        ok("sayım: sıradaki hedef", !!siradaki(), siradaki() ? siradaki().s.ad : "-");
        KA.sayimCiz();
        ok("sayım: DOM gün sayısı", /^\d\d$/.test($("#kaGun").textContent), "kaGun=" + $("#kaGun").textContent);
        ok("puan: 55 doğru → 50", KA.gosterge(55) === 50, String(KA.gosterge(55)));
        ok("puan: 70 doğru → 60", KA.gosterge(70) === 60, String(KA.gosterge(70)));
        KA.puanCiz();
        $("#kaGyD").value = 45; $("#kaGyY").value = 10; $("#kaGkD").value = 40; $("#kaGkY").value = 15;
        var o = KA.hesapla(true);
        ok("puan: net = doğru (85)", o && o.tDogru === 85, o ? String(o.tDogru) : "null");
        ok("puan: boş etiketi", $("#kaGyBos").textContent.trim() === "boş: 5", $("#kaGyBos").textContent.trim());
        $("#kaGyY").value = 90; ok("puan: sınır aşımı engellendi", KA.hesapla(true) === null && $("#kaPuanSonuc").innerHTML.indexOf("✘") >= 0);
        $("#kaGyY").value = 10;
        KA.guncelCiz();
        var g = guncelMaddeler();
        ok("güncel: madde sayısı", g.length >= 20, g.length + " madde");
        ok("güncel: kaynağı olmayan madde yok", g.every(function (m) { return !!m.kaynak_ad; }));
        ok("güncel: DOM'da liste", $$("#kaGListe .ka-guncel").length === g.length, $$("#kaGListe .ka-guncel").length + " kart");
        KA.cikmisCiz();
        var C = cikmisVeri();
        ok("çıkmış: 2011-2021 (11 yıl)", C.yillar.length === 11, C.yillar.length + " yıl");
        ok("çıkmış: sorular 5 benzersiz şık + açıklama", (C.ozgun || []).every(function (x) {
          return x.siklar.length === 5 && new Set(x.siklar).size === 5 && x.dogru >= 0 && x.dogru <= 4 && x.aciklama;
        }), (C.ozgun || []).length + " soru");
        ok("çıkmış: DOM'da yıl düğmeleri", $$("#kaYillar [data-ka-yil]").length === 11, $$("#kaYillar [data-ka-yil]").length + "");
        ok("çıkmış: DOM'da şıklar", $$("#kaSoruAlan [data-ka-sik]").length === 5, $$("#kaSoruAlan [data-ka-sik]").length + "");
        ok("menü: yeni bölümler göründü mü", $$(".menu-oge").length >= 13, $$(".menu-oge").length + " menü öğesi");
        var kap = document.createElement("div");
        kap.id = "kaTestSonuc";
        kap.style.cssText = "position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:16px;overflow:auto;font:13px/1.7 monospace";
        kap.innerHTML = "<h3>KOÇ PRO · KPSS ARAÇLAR testi</h3>" + s.map(function (x) { return "<div>" + x + "</div>"; }).join("") +
          "<hr><b>" + s.filter(function (x) { return x.indexOf("✔") === 0; }).length + " / " + s.length + " geçti</b>";
        document.body.appendChild(kap);
        document.title = "TEST " + s.filter(function (x) { return x.indexOf("✔") === 0; }).length + "/" + s.length;
      }, 500);
    });
  }
})();
