/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Sınav Koçu (KPSS-B paketi) · TÜM HAKLARI SAKLIDIR.
   5846 sayılı FSEK kapsamında korunur. İzinsiz çoğaltma, kopyalama, satış ve dağıtım yasaktır. */

/* ═══════════════════════════════════════════════════════════════════════════
   ÜSTAD KOÇ PRO · MOTİVASYON & ARAÇLAR MODÜLÜ (koc3.js)
   5 ezber kartları (flashcard) · 6 formül/kural kartları · 9 günlük görevler ·
   10 maskot kıyafetleri (rozet ödülleri) · 11 haftalık rapor · 14 widget önizleme ·
   16 karne görseli (PNG) · 18 ilk kullanım turu · 20 tema seçici
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var K = window.KOC; if (!K) return;
  var D = K.Depo;

  /* ═══════════ 5) EZBER KARTLARI ═══════════ */
  var EZBER = [
    { d: "Tarih", o: "İlk Türk devleti ve kurucusu?", a: "Asya Hun Devleti (Büyük Hun) — Kurucusu: Teoman (Mete Han döneminde en güçlü hâli)" },
    { d: "Tarih", o: "Orhun Yazıtları hangi devlete ait, kim yazdırdı?", a: "II. Göktürk (Kutluk) Devleti — Bilge Kağan, Kültigin ve Tonyukuk adına dikildi (Türkçenin ilk yazılı belgeleri)" },
    { d: "Tarih", o: "Malazgirt Savaşı'nın sonucu (1071)?", a: "Anadolu'nun kapıları Türklere açıldı; Anadolu Selçuklu Devleti'nin kuruluşuna ortam hazırlandı" },
    { d: "Tarih", o: "İstanbul'un fethinin dünya tarihi açısından sonucu (1453)?", a: "Orta Çağ kapandı, Yeni Çağ başladı; Bizans yıkıldı; top surları yıkabilen güçlü toplar kullanıldı" },
    { d: "Tarih", o: "Osmanlı'da Tanzimat Fermanı (1839) ne getirdi?", a: "Can-mal güvenliği, vergide adalet, kanun önünde eşitlik; padişah kendi gücünü ilk kez kanunla sınırladı" },
    { d: "Tarih", o: "Kurtuluş Savaşı'nın hazırlık dönemi kongreleri?", a: "Amasya Genelgesi (1919) → Erzurum Kongresi → Sivas Kongresi (millî kararlar, Müdafaa-i Hukuk çatısı)" },
    { d: "Tarih", o: "Saltanat ne zaman, hangi kanunla kaldırıldı?", a: "1 Kasım 1922 — TBMM kararıyla saltanat kaldırıldı, 29 Ekim 1923'te Cumhuriyet ilan edildi" },
    { d: "Coğrafya", o: "Türkiye'de en çok yağış alan bölge ve neden?", a: "Doğu Karadeniz — kuzeyden gelen nemli hava kütlelerinin dağlara çarpıp yükselmesi (orografik yağış)" },
    { d: "Coğrafya", o: "Akdeniz ikliminin özellikleri?", a: "Yazlar sıcak-kurak, kışlar ılık-yağışlı; maki bitki örtüsü; Akdeniz, Ege ve Güney Marmara'da" },
    { d: "Coğrafya", o: "Türkiye'nin en büyük gölü ve oluşumu?", a: "Van Gölü — volkanik set gölü (Nemrut Dağı lavları Seti'ni kapatmıştır)" },
    { d: "Coğrafya", o: "Nüfus yoğunluğu hesaplama formülü?", a: "Nüfus yoğunluğu = Toplam nüfus / Yüzölçümü (kişi/km²)" },
    { d: "Coğrafya", o: "Türkiye'de en fazla tarım ürünü çeşitliliğinin nedeni?", a: "Matematik konum (ılıman kuşak) + yükselti + üç farklı iklim tipi + değişken yer şekilleri" },
    { d: "Vatandaşlık", o: "1982 Anayasası'na göre devletin temel nitelikleri?", a: "Demokratik, lâik, sosyal hukuk devleti; insan haklarına saygılı, Atatürk milliyetçiliğine bağlı" },
    { d: "Vatandaşlık", o: "Temel hak ve ödevler kaça ayrılır?", a: "Kişi hakları ve ödevleri (negatif), sosyal-ekonomik haklar (pozitif), siyasi haklar ve ödevler" },
    { d: "Vatandaşlık", o: "TBMM'de kanun teklif etme yetkisi kimde?", a: "Bakanlar Kurulu (hükümet) kanun tasarısı, milletvekilleri kanun teklifi verir" },
    { d: "Vatandaşlık", o: "Anayasa Mahkemesi'ne kimler başvurabilir?", a: "Cumhurbaşkanı, iktidar ve ana muhalefet partisi grupları, en az 1/5 milletvekili; bireysel başvuru ise Anayasa Mahkemesi'ne yapılır" },
    { d: "Vatandaşlık", o: "Seçme ve seçilme yaşı?", a: "18 yaşını dolduran her Türk vatandaşı seçme hakkına sahiptir; milletvekili seçilme yaşı 18'dir" },
    { d: "Türkçe", o: "Yazım kuralı: “de/da” ne zaman ayrı yazılır?", a: "Bulunma eki olan -de/-da birleşik; bağlaç olan “de/da” her zaman ayrı yazılır ve cümleden çıkarılabilir" },
    { d: "Türkçe", o: "Yazım kuralı: “ki” nasıl yazılır?", a: "Bağlaç olan “ki” ayrı; ek olan -ki (akşamki, benimki) birleşik yazılır" },
    { d: "Türkçe", o: "Cümlenin ögeleri nelerdir?", a: "Yüklem, özne, nesne (belirtili/belirtisiz), dolaylı tümleç (yer tamlayıcısı), zarf tümleci" },
    { d: "Matematik", o: "Yüzde artış/azalış hesabı?", a: "Yeni değer = Eski × (1 ± oran/100). Örn. 200'ün %15 artışı: 200 × 1,15 = 230" },
    { d: "Güncel Bilgiler", o: "Türkiye'nin uzay programı adı?", a: "Millî Uzay Programı (2021'de açıklandı); ilk Türk astronot 2024'te uzaya gitti" }
  ];
  function ezberPaneli() {
    var kendi = D.al("koc3.ezber", []);
    var tumu = EZBER.concat(kendi);
    var s = D.al("koc3.ezberSira", 0) % tumu.length;
    var k = panel("🃏 Ezber Kartları (" + tumu.length + ")",
      "<p class='aciklama'>Karta dokun: arka yüzü açılır. “Biliyorum” dersen kart havuza seyrek döner.</p>" +
      "<div class='koc-kart' id='kocKart'><div class='koc-kart-ic'>" +
      "<b>" + tumu[s].d + "</b><p class='koc-kart-soru'>" + tumu[s].o + "</p>" +
      "<span class='koc-kart-cevap'>" + tumu[s].a + "</span>" +
      "<i class='koc-kart-ipucu'>Cevabı görmek için karta dokun</i></div></div>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-biliyorum='1'>✔ Biliyorum</button>" +
      "<button class='ikincil-dugme' data-tekrar='1'>🔁 Tekrar göster</button>" +
      "<button class='ikincil-dugme' data-ekle='1'>➕ Kendi kartım</button></div>", "geniş");
    if (!k) return;
    var kart = k.querySelector("#kocKart");
    kart.addEventListener("click", function () { kart.classList.toggle("acik"); });
    k.querySelector("[data-biliyorum]").addEventListener("click", function () {
      D.koy("koc3.ezberSira", s + 1); var p = $(".koc-panel"); if (p) p.parentNode.removeChild(p); ezberPaneli();
    });
    k.querySelector("[data-tekrar]").addEventListener("click", function () { kart.classList.remove("acik"); });
    k.querySelector("[data-ekle]").addEventListener("click", function () {
      var q = prompt("Kartın ön yüzü (soru):"); if (!q) return;
      var a = prompt("Arka yüzü (cevap):"); if (!a) return;
      var l = D.al("koc3.ezber", []); l.push({ d: "Kendi", o: q, a: a }); D.koy("koc3.ezber", l);
      var p = $(".koc-panel"); if (p) p.parentNode.removeChild(p); ezberPaneli();
    });
  }

  /* ═══════════ 6) FORMÜL & KURAL KARTLARI ═══════════ */
  var FORMUL = [
    { d: "Matematik", a: "Üslü sayı", b: "a^m · a^n = a^(m+n) · a^m / a^n = a^(m−n) · (a^m)^n = a^(m·n) · a^0 = 1" },
    { d: "Matematik", a: "Çarpanlara ayırma", b: "a² − b² = (a−b)(a+b) · (a+b)² = a² + 2ab + b² · (a−b)² = a² − 2ab + b²" },
    { d: "Matematik", a: "Yüzde", b: "%x artış: Ç × (1 + x/100) · %x azalış: Ç × (1 − x/100) · Artış oranı = (son − ilk)/ilk × 100" },
    { d: "Matematik", a: "Hareket problemi", b: "Yol = Hız × Zaman · Aynı yön: (V1 − V2) · Zıt yön: (V1 + V2) · Ortalama hız = Toplam yol / Toplam zaman" },
    { d: "Matematik", a: "İşçi-havuz problemi", b: "1/A + 1/B = 1/t (birlikte süre) · t = (A·B)/(A+B)" },
    { d: "Matematik", a: "Permütasyon / Kombinasyon", b: "P(n,r) = n!/(n−r)! · C(n,r) = n!/(r!(n−r)!) · Tekrarlı permütasyon: n!/(n1!·n2!…)" },
    { d: "Matematik", a: "Olasılık", b: "P = İstenen durum / Tüm durumlar · Bağımsız olaylar: P(A ve B) = P(A)·P(B)" },
    { d: "Matematik", a: "Kümeler", b: "s(A∪B) = s(A) + s(B) − s(A∩B) · Alt küme sayısı = 2^n · Öz alt küme = 2^n − 1" },
    { d: "Matematik", a: "Geometri — alan/çevre", b: "Üçgen alan = (taban × yükseklik)/2 · Daire alan = πr², çevre = 2πr · Dikdörtgen alan = a·b" },
    { d: "Matematik", a: "Bölünebilme", b: "3: rakamlar toplamı 3'ün katı · 4: son iki basamak 4'ün katı · 9: rakamlar toplamı 9'un katı · 11: (tek basamaklar − çift basamaklar) 11'in katı" },
    { d: "Türkçe", a: "Noktalama — noktalı virgül (;)", b: "Ögeler arasında virgül bulunan sıralamalarda grupları ayırır; anlamca bağlı ama bağlaçsız cümleleri birleştirir" },
    { d: "Türkçe", a: "Noktalama — kesme işareti (')", b: "Özel adlara getirilen çekim ekleri ayrılır; yapım eki ve çoğul eki ayrılmaz (Ankaralı, Türkler)" },
    { d: "Türkçe", a: "Anlatım bozuklukları", b: "Öge eksikliği, tamlama yanlışı, gereksiz sözcük, çelişen sözler, mantık hatası, deyim yanlışı" },
    { d: "Türkçe", a: "Paragrafta ana fikir", b: "Yazarın asıl anlatmak istediği; genelde son cümlelerde; yardımcı fikirler ana fikri destekler" },
    { d: "Tarih", a: "Kronoloji", b: "1071 Malazgirt · 1299 Osmanlı kuruluşu · 1453 İstanbul · 1839 Tanzimat · 1919 Kongreler · 1922 Saltanat kaldırıldı · 1923 Cumhuriyet" },
    { d: "Vatandaşlık", a: "Yasama-yürütme-yargı", b: "Yasama: TBMM · Yürütme: Cumhurbaşkanı · Yargı: bağımsız mahkemeler (Anayasa Mahkemesi en üst)" },
    { d: "Coğrafya", a: "İklim tipleri kısaca", b: "Akdeniz: yaz kurak · Karadeniz: her mevsim yağışlı · Karasal: kış sert, yağış az · Marmara: geçiş" },
    { d: "Genel", a: "Sınav stratejisi", b: "Kolay sorularla başla · 90 sn'de çözemediğini işaretleyip geç · Boş bırakma (yanlış doğruyu götürmez)" }
  ];
  function formulPaneli() {
    var govde = "<p class='aciklama'>Hızlı tekrar kartları. Aramak için kutuya yaz.</p>" +
      "<input class='koc-girdi' id='kocFormulAra' placeholder='Ara: yüzde, noktalama, üslü…'>" +
      "<div class='koc-liste' id='kocFormulListe'>" + FORMUL.map(function (x) {
        return "<div class='koc-formul' data-ara='" + (x.a + " " + x.b + " " + x.d).toLocaleLowerCase("tr-TR") + "'>" +
          "<b>" + x.a + "</b><i>" + x.d + "</i><p>" + x.b + "</p></div>";
      }).join("") + "</div>";
    var k = panel("🧮 Formül ve Kural Kartları (" + FORMUL.length + ")", govde, "geniş");
    if (!k) return;
    k.querySelector("#kocFormulAra").addEventListener("input", function (e) {
      var q = e.target.value.toLocaleLowerCase("tr-TR").trim();
      k.querySelectorAll(".koc-formul").forEach(function (x) {
        x.style.display = (!q || (x.getAttribute("data-ara") || "").indexOf(q) >= 0) ? "" : "none";
      });
    });
  }

  /* ═══════════ 9) GÜNLÜK GÖREVLER ═══════════ */
  function gorev() {
    var g = D.al("koc3.gorev", null), b = new Date().toISOString().slice(0, 10);
    if (!g || g.tarih !== b) g = { tarih: b, soru: 0, not: false, tekrar: false, tamam: false };
    return g;
  }
  function gorevKaydet(g) { D.koy("koc3.gorev", g); }
  function gorevCiz(hedef) {
    var g = gorev();
    var soruTamam = g.soru >= 20;
    var tamam = soruTamam && g.not && g.tekrar;
    if (tamam && !g.tamam) {
      g.tamam = true; gorevKaydet(g);
      var kp = D.al("koc.puan", { dogru: 0, test: 0 }); kp.dogru += 5; D.koy("koc.puan", kp);
      setTimeout(function () {
        if (window.USTAD_MOTOR.konus) window.USTAD_MOTOR.konus("Günlük görevlerin tamam! Beş bonus puan kazandın.");
        if (window.USTAD_MOTOR.kutlama) window.USTAD_MOTOR.kutlama(100, "Günlük Görevler", "hepsi tamam ✔");
      }, 200);
    }
    if (hedef) hedef.innerHTML =
      "<div class='koc-gorev " + (soruTamam ? "tamam" : "") + "'><b>" + (soruTamam ? "✔" : "○") + "</b> Bugün 20 soru çöz <i>" + Math.min(20, g.soru) + "/20</i></div>" +
      "<div class='koc-gorev " + (g.tekrar ? "tamam" : "") + "'><b>" + (g.tekrar ? "✔" : "○") + "</b> Akıllı tekrar kuyruğunu çalış</div>" +
      "<div class='koc-gorev " + (g.not ? "tamam" : "") + "'><b>" + (g.not ? "✔" : "○") + "</b> Bir ders notunu oku</div>" +
      "<div class='koc-cubuk'><i style='width:" + Math.round(((Math.min(20, g.soru) / 20) * 60 + (g.tekrar ? 20 : 0) + (g.not ? 20 : 0))) + "%'></i></div>";
    return g;
  }
  function gorevPaneli() {
    var k = panel("🎯 Günlük Görevler", "<p class='aciklama'>Üç görevi tamamla: 5 bonus puan ve maskotundan tebrik.</p><div id='kocGorevAlan'></div>" +
      "<div class='soru-alt'><button class='ikincil-dugme' data-not='1'>📚 Not okudum</button>" +
      "<button class='ikincil-dugme' data-tekrar='1'>🔁 Tekrara git</button>" +
      "<button class='ikincil-dugme' data-test='1'>▶ Teste git</button></div>", "geniş");
    if (!k) return;
    gorevCiz(k.querySelector("#kocGorevAlan"));
    k.querySelector("[data-not]").addEventListener("click", function () { var g = gorev(); g.not = true; gorevKaydet(g); gorevCiz(k.querySelector("#kocGorevAlan")); });
    k.querySelector("[data-tekrar]").addEventListener("click", function () { var g = gorev(); g.tekrar = true; gorevKaydet(g); gorevCiz(k.querySelector("#kocGorevAlan")); });
    k.querySelector("[data-test]").addEventListener("click", function () { var p = $(".koc-panel"); if (p) p.parentNode.removeChild(p); K.git("testler"); });
  }

  /* ═══════════ 10) MASKOT KIYAFETLERİ ═══════════ */
  var KIYAFET = [
    { k: "tac", ad: "Taç", simg: "👑", kosul: function () { return (D.al("koc.puan", {}).dogru || 0) >= 100; }, svg: "<g transform='translate(120,26)'><path d='M-34 8 L-22 -14 L-6 2 L0 -20 L6 2 L22 -14 L34 8 Z' fill='#f5c542' stroke='#c99a2e' stroke-width='2'/><circle cx='-22' cy='-16' r='3' fill='#e2574c'/><circle cx='0' cy='-22' r='3' fill='#2b7fd4'/><circle cx='22' cy='-16' r='3' fill='#3fa15e'/></g>" },
    { k: "madalya", ad: "Madalya", simg: "🏅", kosul: function () { return (D.al("koc.puan", {}).dogru || 0) >= 300; }, svg: "<g><path d='M104 150 L118 176 L98 176 Z' fill='#2b7fd4'/><path d='M136 150 L122 176 L142 176 Z' fill='#dc2626'/><circle cx='120' cy='188' r='16' fill='#f5c542' stroke='#c99a2e' stroke-width='2'/><text x='120' y='194' font-size='16' text-anchor='middle' fill='#8a5a00'>1</text></g>" },
    { k: "gozluk", ad: "Gözlük", simg: "👓", kosul: function () { return (D.al("koc.seri", {}).gun || 0) >= 7; }, svg: "<g stroke='#2f3a48' stroke-width='3' fill='none'><circle cx='102' cy='66' r='13'/><circle cx='138' cy='66' r='13'/><path d='M115 66 h10'/><path d='M89 62 l-10 -6'/><path d='M151 62 l10 -6'/></g>" },
    { k: "ceket", ad: "ÜSTAD Ceketi", simg: "🧥", kosul: function () { return (D.al("koc.seri", {}).gun || 0) >= 30; }, svg: "<g fill='#1f4f7a' opacity='.92'><path d='M96 132 q24 -12 48 0 l8 60 q-32 10 -64 0 Z'/><path d='M112 136 l8 12 l8 -12' fill='#f2f6f8'/></g>" },
    { k: "kravat", ad: "Kırmızı Kravat", simg: "🎀", kosul: function () { return (D.al("koc.puan", {}).test || 0) >= 20; }, svg: "<g><path d='M120 146 l9 8 l-9 34 l-9 -34 Z' fill='#dc2626'/><path d='M112 142 h16 l-8 8 Z' fill='#b2261c'/></g>" }
  ];
  function kiyafetler() {
    return KIYAFET.map(function (x) { var v = x.kosul(); return { k: x.k, ad: x.ad, simg: x.simg, svg: x.svg, var_mi: v }; });
  }
  function aksesuarSVG() {
    return kiyafetler().filter(function (x) { return x.var_mi; }).map(function (x) { return x.svg; }).join("");
  }
  function kiyafetPaneli() {
    var kf = kiyafetler(), acik = kf.filter(function (x) { return x.var_mi; }).length;
    var govde = "<p class='aciklama'>Açılan aksesuarlar tebrik ekranındaki maskota gerçekten giydirilir. Açılan: <b>" + acik + "/" + kf.length + "</b></p>" +
      "<div class='koc-rozetler'>" + kf.map(function (x) {
        return "<div class='koc-rozet " + (x.var_mi ? "var" : "yok") + "'><span>" + x.simg + "</span><b>" + x.ad + "</b><i>" +
          (x.var_mi ? "açık" : kosulYazi(x.k)) + "</i></div>";
      }).join("") + "</div>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-goster='1'>🎬 Maskotumla göster</button></div>";
    var k = panel("👑 Maskot Kıyafetleri", govde, "geniş");
    if (!k) return;
    k.querySelector("[data-goster]").addEventListener("click", function () {
      var p = $(".koc-panel"); if (p) p.parentNode.removeChild(p);
      if (window.USTAD_MOTOR.kutlama) window.USTAD_MOTOR.kutlama(85, "Kıyafet Provası", "aksesuarlarımı beğendin mi?");
    });
  }
  function kosulYazi(k) {
    return k === "tac" ? "100 doğru" : k === "madalya" ? "300 doğru" : k === "gozluk" ? "7 gün seri" : k === "ceket" ? "30 gün seri" : "20 test";
  }
  /* Kutlama perdesi açılınca maskota aksesuarları ekle */
  function aksesuarBagla() {
    var gozlem = new MutationObserver(function () {
      var perde = $(".kutlama-perde");
      if (!perde || perde.getAttribute("data-aksesuar") === "1") return;
      var svg = perde.querySelector("svg.maskot-svg");
      if (!svg) return;
      perde.setAttribute("data-aksesuar", "1");
      var ek = document.createElementNS("http://www.w3.org/2000/svg", "g");
      ek.setAttribute("class", "maskot-aksesuar");
      ek.innerHTML = aksesuarSVG();
      svg.appendChild(ek);
    });
    gozlem.observe(document.body, { childList: true, subtree: true });
  }

  /* ═══════════ 11) HAFTALIK RAPOR ═══════════ */
  function haftalikRapor() {
    var kesim = Date.now() - 7 * 86400000;
    var hiz = D.al("koc2.hiz", []).filter(function (x) { return new Date(x.tarih).getTime() >= kesim; });
    var dn = D.al("koc2.denemeler", []).filter(function (x) { return new Date(x.tarih).getTime() >= kesim; });
    var ist = D.al("ist", { cozulen: 0, dogru: 0 });
    var seri = D.al("koc.seri", {}), kp = D.al("koc.puan", {}), rz = (D.al("koc.rozet", []) || []).length;
    var ad = D.al("isim", "") || "Öğrenci";
    var metin = "🎓 ÜSTAD KOÇ PRO · HAFTALIK RAPOR\n" +
      "👤 " + ad + "\n" +
      "📝 Bu hafta çözülen: " + hiz.length + " soru\n" +
      "🎯 Deneme: " + dn.length + (dn.length ? " (son tahmini puan: " + dn[dn.length - 1].puan + ")" : "") + "\n" +
      "✅ Toplam doğru: " + (ist.dogru || 0) + " / " + (ist.cozulen || 0) +
      " (%" + (ist.cozulen ? Math.round((ist.dogru / ist.cozulen) * 100) : 0) + ")\n" +
      "🔥 Çalışma serisi: " + (seri.gun || 0) + " gün (en iyi " + (seri.en || 0) + ")\n" +
      "🏅 Rozet: " + rz + "\n" +
      "⏱ Soru başına ortalama: " + (hiz.length ? Math.round(hiz.reduce(function (a, x) { return a + x.sn; }, 0) / hiz.length) : 0) + " sn";
    var govde = "<div class='koc-rapor' id='kocRapor'>" + metin.split("\n").map(function (s) { return "<div>" + s + "</div>"; }).join("") + "</div>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-kopyala='1'>📤 Metni kopyala (WhatsApp'a yapıştır)</button></div>";
    var k = panel("📊 Haftalık Rapor", govde, "geniş");
    if (!k) return;
    k.querySelector("[data-kopyala]").addEventListener("click", function () {
      try { navigator.clipboard.writeText(metin); alert("Rapor kopyalandı:\n\n" + metin); } catch (e) { alert(metin); }
    });
  }

  /* ═══════════ 14) WIDGET ÖNİZLEME ═══════════ */
  function widgetPaneli() {
    var kg = K.kalanGun(), gs = K.gununSorusu(), seri = D.al("koc.seri", {});
    var govde = "<p class='aciklama'>Telefon ana ekranındaki görünüm böyle olacak. (Gerçek widget, Android tarafına eklenince ana ekranına yerleşir.)</p>" +
      "<div class='koc-tel'><div class='koc-tel-ic'><div class='koc-widget'>" +
        "<b>🎓 KOÇ PRO</b>" +
        "<span class='koc-widget-buyuk'>" + (kg === null ? "—" : kg) + " gün</span>" +
        "<i>🔥 " + (seri.gun || 0) + " gün seri</i>" +
        "<p>" + (gs ? gs.soru.slice(0, 70) + "…" : "") + "</p>" +
      "</div><div class='koc-tel-not'>widget · ana ekran</div></div></div>";
    panel("📱 Ana Ekran Widget'ı (önizleme)", govde, "geniş");
  }

  /* ═══════════ 16) KARNE GÖRSELİ (PNG) ═══════════ */
  function karneGorseli() {
    var ist = D.al("ist", { cozulen: 0, dogru: 0, yanlis: 0, bos: 0 });
    var h = K.konuHaritasi(), dersler = {};
    h.forEach(function (x) { dersler[x.ders] = dersler[x.ders] || { d: 0, y: 0 }; dersler[x.ders].d += x.dogru; dersler[x.ders].y += x.yanlis; });
    var adlar = Object.keys(dersler);
    var sv = K.seviyeBilgi(), seri = D.al("koc.seri", {}), ad = D.al("isim", "") || "Öğrenci";
    var c = document.createElement("canvas");
    c.width = 900; c.height = 1200;
    var x = c.getContext("2d");
    x.fillStyle = "#f4f8fb"; x.fillRect(0, 0, 900, 1200);
    x.fillStyle = "#7c3aed"; x.fillRect(0, 0, 900, 130);
    x.fillStyle = "#fff"; x.font = "bold 40px Segoe UI, Arial"; x.fillText("ÜSTAD KOÇ PRO · KARNE", 50, 70);
    x.font = "22px Segoe UI, Arial"; x.fillText(ad + " · " + new Date().toLocaleDateString("tr-TR"), 50, 105);
    var kutu = [[ist.cozulen, "Çözülen"], [ist.dogru, "Doğru"], [ist.yanlis, "Yanlış"], ["%" + (ist.cozulen ? Math.round((ist.dogru / ist.cozulen) * 100) : 0), "Başarı"]];
    kutu.forEach(function (k, i) {
      var kx = 50 + i * 205;
      x.fillStyle = "#fff"; x.strokeStyle = "#d8dfe8"; x.lineWidth = 2;
      x.beginPath(); x.roundRect(kx, 180, 185, 130, 16); x.fill(); x.stroke();
      x.fillStyle = "#5b21b6"; x.font = "bold 42px Segoe UI, Arial"; x.textAlign = "center";
      x.fillText(String(k[0]), kx + 92, 245);
      x.fillStyle = "#667"; x.font = "18px Segoe UI, Arial"; x.fillText(k[1], kx + 92, 280);
      x.textAlign = "left";
    });
    x.fillStyle = "#1f2933"; x.font = "bold 26px Segoe UI, Arial"; x.fillText("Ders Bazlı Başarı", 50, 370);
    adlar.forEach(function (d, i) {
      var y = 410 + i * 52, o = dersler[d].d + dersler[d].y ? Math.round((dersler[d].d / (dersler[d].d + dersler[d].y)) * 100) : 0;
      x.fillStyle = "#fff"; x.fillRect(50, y - 26, 800, 42);
      x.fillStyle = "#2c3742"; x.font = "20px Segoe UI, Arial"; x.fillText(d, 66, y);
      x.fillStyle = "#e3e8ee"; x.fillRect(420, y - 18, 320, 18);
      x.fillStyle = o >= 70 ? "#12a150" : o >= 45 ? "#e08a00" : "#dc2626"; x.fillRect(420, y - 18, 320 * (o / 100), 18);
      x.fillStyle = "#334"; x.font = "bold 20px Segoe UI, Arial"; x.textAlign = "right"; x.fillText("%" + o, 840, y); x.textAlign = "left";
    });
    var y2 = 410 + adlar.length * 52 + 40;
    x.fillStyle = "#f7f4ff"; x.fillRect(50, y2, 800, 120);
    x.fillStyle = "#4c1d95"; x.font = "bold 24px Segoe UI, Arial";
    x.fillText("Seviye " + sv.no + " · " + sv.ad + "  ·  " + sv.dogru + " doğru", 70, y2 + 45);
    x.fillText("🔥 " + (seri.gun || 0) + " gün seri  ·  🏅 " + ((D.al("koc.rozet", []) || []).length) + " rozet", 70, y2 + 85);
    x.fillStyle = "#8a8f98"; x.font = "15px Segoe UI, Arial";
    x.fillText("© 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Tüm hakları saklıdır. 5846 sayılı FSEK kapsamında korunur.", 50, 1140);
    var veri;
    try { veri = c.toDataURL("image/png"); } catch (e) { alert("Görsel oluşturulamadı."); return; }
    var govde = "<p class='aciklama'>Karnen görsel olarak hazır. İndir ve paylaş.</p>" +
      "<img src='" + veri + "' alt='Karne' style='width:100%;border-radius:14px;border:1px solid #d8dfe8'>" +
      "<div class='soru-alt'><button class='buyuk-dugme' data-indir='1'>⬇ PNG olarak indir</button>" +
      "<button class='ikincil-dugme' data-yeni='1'>🔄 Yenile</button></div>";
    var k = panel("🖼 Karne Görseli", govde, "geniş");
    if (!k) return;
    k.querySelector("[data-indir]").addEventListener("click", function () {
      try {
        var a = document.createElement("a");
        a.href = veri; a.download = "ustad-koc-pro-karne-" + new Date().toISOString().slice(0, 10) + ".png";
        document.body.appendChild(a); a.click(); setTimeout(function () { document.body.removeChild(a); }, 400);
        alert("Karne görseli indirildi.");
      } catch (e) { alert("İndirilemedi; ekran görüntüsü alabilirsin."); }
    });
    k.querySelector("[data-yeni]").addEventListener("click", function () { var p = $(".koc-panel"); if (p) p.parentNode.removeChild(p); karneGorseli(); });
  }

  /* ═══════════ 18) İLK KULLANIM TURU ═══════════ */
  function turBasla(zorla) {
    if (!zorla && D.al("koc3.turBitti", false)) return;
    var adimlar = [
      { sec: "#menuDugme, .menu-dugme, #menuAc", bas: "☰ Menü", metin: "Sol üstteki menüden tüm bölümlere geçebilirsin: Testler, Deneme, Ders Notları, KOÇ PRO…" },
      { sec: "#ekran-ana .kart", bas: "🏠 Ana Sayfa", metin: "Ana sayfada günlük durumun, KOÇ PRO şeridi ve duyurular var." },
      { sec: "#kocMenuOge", bas: "🎓 KOÇ PRO", metin: "Burası yeni merkez: akıllı tekrar, konu haritası, karne, rozetler, yedek, uyarlamalı test, deneme simülasyonu…" },
      { sec: "#ekran-ana .ozellik-satir", bas: "✨ Özellikler", metin: "Anında geri bildirim, doğru/yanlış panelleri, maskotlu tebrik, kendi fotoğrafın — hepsi burada." },
      { sec: null, bas: "🎉 Hazırsın!", metin: "Şimdi bir test çöz ve KOÇ PRO’nun seni tanımasına izin ver. Başarılar!" }
    ];
    var i = 0;
    function kapat() { var e = $(".koc-tur"); if (e) e.parentNode.removeChild(e); }
    function ciz() {
      kapat();
      if (i >= adimlar.length) { D.koy("koc3.turBitti", true); return; }
      var a = adimlar[i];
      var el = a.sec ? $(a.sec) : null;
      var hedef = null;
      if (el) { try { var y = el.getBoundingClientRect(); hedef = { t: y.top, l: y.left, w: y.width, h: y.height }; } catch (e) {} }
      var kap = document.createElement("div");
      kap.className = "koc-tur";
      kap.innerHTML = (hedef ? "<div class='koc-tur-isik' style='top:" + (hedef.t - 6) + "px;left:" + (hedef.l - 6) + "px;width:" + (hedef.w + 12) + "px;height:" + (hedef.h + 12) + "px'></div>" : "") +
        "<div class='koc-tur-kutu'><b>" + a.bas + "</b><p>" + a.metin + "</p>" +
        "<div class='koc-tur-alt'><span>" + (i + 1) + " / " + adimlar.length + "</span>" +
        "<button class='ikincil-dugme' data-atla='1'>Atla</button>" +
        "<button class='buyuk-dugme' data-ileri='1'>" + (i === adimlar.length - 1 ? "Başla 🚀" : "İleri →") + "</button></div></div>";
      document.body.appendChild(kap);
      kap.querySelector("[data-ileri]").addEventListener("click", function () { i++; ciz(); });
      kap.querySelector("[data-atla]").addEventListener("click", function () { kapat(); D.koy("koc3.turBitti", true); });
    }
    ciz();
  }

  /* ═══════════ 20) TEMA SEÇİCİ ═══════════ */
  var RENKLER = ["turkuaz", "badem", "lavanta", "gul", "gokyuzu", "nane", "kum", "karanfil", "fistik", "antik", "deniz", "gece"];
  var RENK_AD = { turkuaz: "Turkuaz", badem: "Badem", lavanta: "Lavanta", gul: "Gül", gokyuzu: "Gökyüzü", nane: "Nane",
                  kum: "Kum", karanfil: "Karanfil", fistik: "Fıstık", antik: "Antik", deniz: "Deniz", gece: "Gece" };
  function temaPaneli() {
    var su = document.documentElement.getAttribute("data-renk") || D.al("renk", "turkuaz");
    var govde = "<p class='aciklama'>KOÇ PRO dahil tüm uygulamanın renk teması. Seçimin cihazda saklanır.</p>" +
      "<div class='koc-tema'>" + RENKLER.map(function (r) {
        return "<button class='koc-tema-dugme " + (r === su ? "secili" : "") + "' data-tema='" + r + "'>" + (r === su ? "✔ " : "") + RENK_AD[r] + "</button>";
      }).join("") + "</div>";
    var k = panel("🎨 Tema Seçici", govde, "geniş");
    if (!k) return;
    k.querySelectorAll("[data-tema]").forEach(function (x) {
      x.addEventListener("click", function () {
        var r = x.getAttribute("data-tema");
        document.documentElement.setAttribute("data-renk", r);
        D.koy("renk", r);
        k.querySelectorAll("[data-tema]").forEach(function (y) { y.classList.remove("secili"); y.textContent = RENK_AD[y.getAttribute("data-tema")]; });
        x.classList.add("secili"); x.textContent = "✔ " + RENK_AD[r];
      });
    });
  }

  /* ═══════════ panel + blok ═══════════ */
  function panel(baslik, govde, genis) {
    var eski = $(".koc-panel"); if (eski) eski.parentNode.removeChild(eski);
    var kap = document.createElement("div");
    kap.className = "modul koc-panel " + (genis || "");
    kap.innerHTML = "<div class='modul-ic'><div class='soru-kutu'><h3 class='koc-panel-baslik'>" + baslik + "</h3>" + govde +
      "<div class='soru-alt'><button class='ikincil-dugme' data-kapat='1'>Kapat</button></div></div></div>";
    document.body.appendChild(kap);
    kap.querySelector("[data-kapat]").addEventListener("click", function () { kap.parentNode.removeChild(kap); });
    return kap;
  }

  function blokEkle() {
    var alan = $("#kocAlan"); if (!alan || $("#koc3Blok")) return;
    var g = gorev();
    var d = document.createElement("div");
    d.id = "koc3Blok"; d.className = "koc-blok";
    d.innerHTML = "<h3>🎯 Günlük Görevler ve Araçlar</h3>" +
      "<div id='koc3Gorev'></div>" +
      "<div class='soru-alt'>" +
        "<button class='buyuk-dugme' data-k3='gorev'>🎯 Günlük görevler</button>" +
        "<button class='ikincil-dugme' data-k3='ezber'>🃏 Ezber kartları</button>" +
        "<button class='ikincil-dugme' data-k3='formul'>🧮 Formül kartları</button>" +
        "<button class='ikincil-dugme' data-k3='kiyafet'>👑 Maskot kıyafetleri</button>" +
        "<button class='ikincil-dugme' data-k3='rapor'>📊 Haftalık rapor</button>" +
        "<button class='ikincil-dugme' data-k3='widget'>📱 Widget önizleme</button>" +
        "<button class='ikincil-dugme' data-k3='karneGorsel'>🖼 Karne görseli (PNG)</button>" +
        "<button class='ikincil-dugme' data-k3='tema'>🎨 Tema seçici</button>" +
        "<button class='ikincil-dugme' data-k3='tur'>🧭 Tanıtım turu</button>" +
      "</div>";
    alan.appendChild(d);
    gorevCiz(d.querySelector("#koc3Gorev"));
    d.querySelectorAll("[data-k3]").forEach(function (x) {
      x.addEventListener("click", function () {
        var i = x.getAttribute("data-k3");
        if (i === "gorev") gorevPaneli();
        else if (i === "ezber") ezberPaneli();
        else if (i === "formul") formulPaneli();
        else if (i === "kiyafet") kiyafetPaneli();
        else if (i === "rapor") haftalikRapor();
        else if (i === "widget") widgetPaneli();
        else if (i === "karneGorsel") karneGorseli();
        else if (i === "tema") temaPaneli();
        else if (i === "tur") turBasla(true);
      });
    });
  }

  /* test bitince günlük görev sayacı + trend kaydı */
  (K.bitisKancalari = K.bitisKancalari || []).push(function () {
    var g = gorev();
    var adet = 0;
    try { adet = K.sonTestBilgi ? K.sonTestBilgi().adet : 0; } catch (e) {}
    g.soru = (g.soru || 0) + Math.min(20, adet);
    gorevKaydet(g);
    if ($("#koc3Gorev")) gorevCiz($("#koc3Gorev"));
    try { if (window.KOC2 && window.KOC2.trendKaydet) window.KOC2.trendKaydet(K.konuHaritasi()); } catch (e) {}
  });

  (K.cizKancalari = K.cizKancalari || []).push(blokEkle);

  window.KOC3 = {
    ezberPaneli: ezberPaneli, formulPaneli: formulPaneli, gorevPaneli: gorevPaneli, gorevCiz: gorevCiz,
    kiyafetPaneli: kiyafetPaneli, kiyafetler: kiyafetler, aksesuarSVG: aksesuarSVG, haftalikRapor: haftalikRapor,
    widgetPaneli: widgetPaneli, karneGorseli: karneGorseli, turBasla: turBasla, temaPaneli: temaPaneli,
    gorev: gorev, EZBER: EZBER, FORMUL: FORMUL, KIYAFET: KIYAFET
  };
  setTimeout(function () {
    try {
      aksesuarBagla();
      if ($("#kocAlan")) K.ciz();
      if (!D.al("koc3.turBitti", false)) setTimeout(function () { turBasla(false); }, 1500);
    } catch (e) {}
  }, 1000);
})();
