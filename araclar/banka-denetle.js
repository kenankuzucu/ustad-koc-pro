#!/usr/bin/env node
/* ÜSTAD KOÇ PRO · banka denetleyici (tek tek inceleme)
   Kullanım: node araclar/banka-denetle.js [dosya...]
   Dosya verilmezse icerik/banka-*.js ve icerik/konular-*.js taranır.
   Her dosya AYRI AYRI yüklenir ve ölçülür; sonunda dosyalar arası tekrar denetimi yapılır. */
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const KOK = path.resolve(__dirname, "..");
const ICERIK = path.join(KOK, "icerik");
const SORU_ALAN = ["konu", "zorluk", "tip", "metin", "soru", "secenekler", "dogru", "aciklama", "ders"];
const NOT_ALAN = ["baslik", "konu", "ozet", "metin", "pufNoktalar", "sinavIpucu", "ders"];

function dosyalar() {
  if (process.argv.length > 2) return process.argv.slice(2);
  return fs.readdirSync(ICERIK).filter(f => /^(banka|konular)-.*\.js$/.test(f)).sort().map(f => path.join("icerik", f));
}
function yukle(tam) {
  const w = {};
  vm.runInContext(fs.readFileSync(tam, "utf8"), vm.createContext({ window: w, console }));
  return { sorular: w.USTAD_SORULAR_EK || [], notlar: w.USTAD_NOTLAR_EK || [], w };
}
function kisa(s, n = 70) { s = String(s || "").replace(/\s+/g, " "); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

const rapor = [], tumSoru = [], tumNot = [];
for (const goreli of dosyalar()) {
  const tam = path.isAbsolute(goreli) ? goreli : path.join(KOK, goreli);
  const ad = path.relative(KOK, tam).replace(/\\/g, "/");
  if (!fs.existsSync(tam)) { console.log(`· ${ad} → DOSYA YOK`); rapor.push({ dosya: ad, durum: "yok" }); continue; }
  let veri;
  try { veri = yukle(tam); } catch (e) { console.log(`· ${ad} → YÜKLENEMEDİ: ${e.message.slice(0, 80)}`); rapor.push({ dosya: ad, durum: "hata", hata: e.message.slice(0, 80) }); continue; }
  const S = veri.sorular, N = veri.notlar, hatalar = [];
  if (S.length) {
    const harf = [0, 0, 0, 0], zor = {}, konu = {}, gorulen = new Map();
    S.forEach((o, i) => {
      SORU_ALAN.forEach(a => { if (o[a] === undefined || o[a] === null || o[a] === "") { if (!(a === "metin")) hatalar.push(`${i + 1}. soru: "${a}" boş`); } });
      if (!Array.isArray(o.secenekler) || o.secenekler.length !== 4) hatalar.push(`${i + 1}. soru: seçenek sayısı ${Array.isArray(o.secenekler) ? o.secenekler.length : "yok"}`);
      else {
        const tekil = new Set(o.secenekler.map(x => String(x).trim().toLowerCase()));
        if (tekil.size !== 4) hatalar.push(`${i + 1}. soru: aynı seçenek tekrar ediyor`);
        if (o.secenekler.some(x => /^(hepsi|hiçbiri|tümü|hiç bir)/i.test(String(x).trim()))) hatalar.push(`${i + 1}. soru: kaçamak seçenek ("hepsi/hiçbiri")`);
      }
      if (!Number.isInteger(o.dogru) || o.dogru < 0 || o.dogru > 3) hatalar.push(`${i + 1}. soru: dogru=${o.dogru}`);
      else harf[o.dogru]++;
      if (String(o.aciklama || "").trim().length < 60) hatalar.push(`${i + 1}. soru: açıklama kısa (${String(o.aciklama || "").length})`);
      if (!["Kolay", "Orta", "Zor"].includes(o.zorluk)) hatalar.push(`${i + 1}. soru: zorluk="${o.zorluk}"`);
      zor[o.zorluk] = (zor[o.zorluk] || 0) + 1; konu[o.konu] = (konu[o.konu] || 0) + 1;
      const ic = String(o.soru || "").trim().toLowerCase().replace(/\s+/g, " ");
      if (ic && gorulen.has(ic)) hatalar.push(`${i + 1}. soru: dosya içi tekrar (${gorulen.get(ic)}. soruyla aynı)`); else if (ic) gorulen.set(ic, i + 1);
      tumSoru.push({ dosya: ad, no: i + 1, ic, soru: String(o.soru || ""), cevap: "ABCD"[o.dogru], ders: o.ders, konu: o.konu });
    });
    const bayt = fs.statSync(tam).size, sha = crypto.createHash("sha256").update(fs.readFileSync(tam)).digest("hex");
    console.log(`\n=== ${ad} · ${S.length} soru · ${(bayt / 1024).toFixed(1)} KB · sha256 ${sha.slice(0, 16)}…`);
    console.log(`    zorluk: ${JSON.stringify(zor)} · cevap dağılımı A/B/C/D: ${harf.join("/")} · konu çeşidi: ${Object.keys(konu).length}`);
    console.log(`    örnek: ${kisa(S[0].soru, 90)} → ${"ABCD"[S[0].dogru]} | ${kisa(S[0].konu, 30)}`);
    console.log(`    hata sayısı: ${hatalar.length}${hatalar.length ? " → " + hatalar.slice(0, 6).join(" ; ") + (hatalar.length > 6 ? ` … (+${hatalar.length - 6})` : "") : " ✔"}`);
    rapor.push({ dosya: ad, durum: "ok", soru: S.length, bayt, sha256: sha, zorluk: zor, cevapDagilimi: harf, hata: hatalar.length, ornekHatalar: hatalar.slice(0, 12) });
  }
  if (N.length) {
    const ders = {}, metinSorun = [], hepsi = new Set();
    N.forEach((o, i) => {
      NOT_ALAN.forEach(a => { if (o[a] === undefined || o[a] === null || (Array.isArray(o[a]) ? !o[a].length : String(o[a]).trim() === "")) hatalar.push(`${i + 1}. konu: "${a}" boş`); });
      if (Array.isArray(o.metin) && o.metin.length < 4) metinSorun.push(i + 1);
      if (Array.isArray(o.pufNoktalar) && o.pufNoktalar.length < 3) metinSorun.push(`püf ${i + 1}`);
      ders[o.ders] = (ders[o.ders] || 0) + 1;
      const b = String(o.baslik || "").trim().toLowerCase();
      if (b && hepsi.has(b)) hatalar.push(`${i + 1}. konu: başlık tekrarı`); else hepsi.add(b);
      tumNot.push({ dosya: ad, baslik: String(o.baslik || ""), ders: o.ders });
    });
    const kelime = N.reduce((t, o) => t + String((o.metin || []).join(" ")).split(/\s+/).filter(Boolean).length, 0);
    const bayt = fs.statSync(tam).size, sha = crypto.createHash("sha256").update(fs.readFileSync(tam)).digest("hex");
    console.log(`\n=== ${ad} · ${N.length} konu · ${(bayt / 1024).toFixed(1)} KB · sha256 ${sha.slice(0, 16)}…`);
    console.log(`    ders dağılımı: ${JSON.stringify(ders)} · ortalama ${Math.round(kelime / Math.max(N.length, 1))} kelime/konu`);
    console.log(`    örnek: ${kisa(N[0].baslik, 60)} | ${kisa(N[0].ozet, 80)}`);
    console.log(`    hata sayısı: ${hatalar.length}${hatalar.length ? " → " + hatalar.slice(0, 6).join(" ; ") : " ✔"}${metinSorun.length ? " · kısa metin/püf: " + metinSorun.slice(0, 8).join(",") : ""}`);
    rapor.push({ dosya: ad, durum: "ok", konu: N.length, bayt, sha256: sha, ders, hata: hatalar.length, ornekHatalar: hatalar.slice(0, 12) });
  }
  if (!S.length && !N.length) { console.log(`\n=== ${ad} → dosya yüklendi ama içerik dizisi boş (USTAD_SORULAR_EK / USTAD_NOTLAR_EK yok).`); rapor.push({ dosya: ad, durum: "bos" }); }
}
/* dosyalar arası tekrar */
const capraz = new Map(), caprazListe = [];
tumSoru.forEach(o => { if (!o.ic) return; if (capraz.has(o.ic)) caprazListe.push(`${o.dosya}#${o.no} ↔ ${capraz.get(o.ic)}`); else capraz.set(o.ic, `${o.dosya}#${o.no}`); });
const caprazNot = new Map(), caprazNotListe = [];
tumNot.forEach(o => { const b = o.baslik.trim().toLowerCase(); if (!b) return; if (caprazNot.has(b)) caprazNotListe.push(`${o.dosya}:${o.baslik} ↔ ${caprazNot.get(b)}`); else caprazNot.set(b, o.dosya); });
console.log(`\n=== TOPLAM: ${tumSoru.length} soru · ${tumNot.length} konu · dosyalar arası tekrar: soru ${caprazListe.length}, konu ${caprazNotListe.length}`);
if (caprazListe.length) console.log("   tekrarlar: " + caprazListe.slice(0, 8).join(" ; "));
if (caprazNotListe.length) console.log("   konu tekrarları: " + caprazNotListe.slice(0, 8).join(" ; "));
console.log("JSON:" + JSON.stringify({ dosyalar: rapor, toplamSoru: tumSoru.length, toplamKonu: tumNot.length, caprazTekrar: caprazListe.length, caprazKonuTekrar: caprazNotListe.length }));
