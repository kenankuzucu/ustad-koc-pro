/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · TEK ARAMA (assets/arama.js) sayfa içi testini ölçer.
   Chrome şu bayrakla açık olmalı: --headless=new --remote-debugging-port=9333
   Kullanım: node araclar/arama-test.js [url]

   Neden böyle: uygulama ?test=1 kipinde açılınca TÜM modüllerin kendi testleri çalışır; bazı
   testler kayıt/temizle akışlarını denerken koc.js içindeki location.reload() belgeyi baştan
   yükler ve ölçüm ortasında sayfayı siler. Bu yüzden ölçüm aracı:
     1) sayfayı ?test=1 OLMADAN açar (başka modülün testi çalışmasın) ve belgenin oturmasını bekler,
     2) adrese history.replaceState ile ?test=1 ekler — yalnız TEK ARAMA testi tetiklenir,
     3) assets/arama.css + assets/arama.js enjekte eder (index.html'e DOKUNMAZ),
     4) belge yeniden yüklenirse farkı görüp yeniden enjekte eder,
     5) #aramaTestSonuc kutusunu okuyup geçen/toplam ve ✘ listesini yazar. */
const PORT = process.env.CDP_PORT || 9333;
const TEMIZ = "file:///C:/Users/kenan/OneDrive/Desktop/USTAD-MOTOR-2/index.html?isim=Olcum&statik=1";
const VARSAYILAN = TEMIZ;
const URL_ = process.argv[2] || VARSAYILAN;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function hedef() {
  for (let i = 0; i < 40; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const s = l.find((t) => t.type === "page");
      if (s && s.webSocketDebuggerUrl) return s.webSocketDebuggerUrl;
    } catch (e) {}
    await bekle(500);
  }
  throw new Error("CDP yok");
}

const ENJEKTE = `(() => new Promise((coz) => {
  var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "assets/arama.css";
  document.head.appendChild(l);
  var s = document.createElement("script"); s.src = "assets/arama.js";
  s.onload = () => coz("YÜKLENDİ");
  s.onerror = () => coz("YÜKLENEMEDİ");
  document.head.appendChild(s);
}))()`;

async function main() {
  const ws = new WebSocket(await hedef());
  let id = 0; const bekleyen = new Map(); const hatalar = [];
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && bekleyen.has(m.id)) { bekleyen.get(m.id)(m); bekleyen.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails || {};
      const y = (d.exception && (d.exception.description || d.exception.value)) || d.text || "";
      if (String(y).indexOf("arama") >= 0) hatalar.push(String(y).split("\n")[0]);
    }
  });
  await new Promise((r) => ws.addEventListener("open", r));
  const gonder = (method, params = {}) => new Promise((res) => {
    const n = ++id; bekleyen.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const deger = async (expr, awaitPromise) => {
    const r = await gonder("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: !!awaitPromise });
    const v = r.result && r.result.result;
    return v ? (v.value !== undefined ? v.value : JSON.stringify(v)) : JSON.stringify(r);
  };
  const kimlik = () => deger('performance.timeOrigin + "|" + Math.round(performance.now())');
  const kutuOku = () => deger(`(() => { const h = document.getElementById("aramaTestSonuc");
      if (!h) return null;
      const s = Array.from(h.querySelectorAll("div")).map(d => d.textContent.trim());
      return { gecen: s.filter(x => x.startsWith("✔")).length, toplam: s.length,
               hatalar: s.filter(x => x.startsWith("✘")) }; })()`);

  await gonder("Runtime.enable");
  await gonder("Page.enable");
  console.log("→ açılıyor:", URL_);
  await gonder("Page.navigate", { url: URL_ });
  await bekle(3000);

  /* 1) belge otursun: aynı timeOrigin ve en az 9 sn yaşında */
  let onceki = null, stabil = false;
  for (let i = 0; i < 60; i++) {
    const k = String(await kimlik());
    const yas = Number(k.split("|")[1] || 0);
    if (k.split("|")[0] === String(onceki).split("|")[0] && yas > 9000) { stabil = true; break; }
    onceki = k;
    await bekle(700);
  }
  console.log("→ belge oturdu:", stabil ? "evet" : "hayır (yine de denenecek)", String(onceki));

  /* 2+3) test kipini aç, enjekte et, gerekirse belge yenilendiğinde yeniden enjekte et.
     Sayfa ?test=1 ile açıldıysa arama.js zaten index.html'e bağlıdır → enjeksiyon yapılmaz. */
  const gerekli = URL_.indexOf("test=1") < 0;
  let rapor = null, deneme = 0;
  while (deneme < 4 && !rapor) {
    deneme++;
    const k0 = String(await deger("performance.timeOrigin"));
    const kip = await deger(`(() => { if (location.search.indexOf("test=1") < 0)
        history.replaceState(null, "", location.pathname + "?test=1" + location.hash);
      return location.search; })()`);
    const enj = gerekli ? await deger(ENJEKTE, true) : "GEREKMEDİ (index.html'e bağlı)";
    console.log(`→ enjeksiyon #${deneme}:`, enj, "| kip:", kip);
    for (let i = 0; i < 24; i++) {
      await bekle(500);
      const k1 = String(await deger("performance.timeOrigin"));
      if (k1 !== k0) { console.log("→ belge yenilendi, yeniden enjekte edilecek"); break; }
      const v = await kutuOku();
      if (v && v.toplam) { rapor = v; break; }
    }
  }

  console.log("\n═══ ÜSTAD TEK ARAMA · sayfa içi test ═══");
  if (!rapor) {
    console.log("TEST KUTUSU YOK →", String(await deger("document.title + ' | ARAMA=' + (typeof window.ARAMA)")));
    if (hatalar.length) console.log("İSTİSNALAR:\n" + hatalar.slice(-5).join("\n"));
    process.exit(1);
  }
  console.log("SONUÇ: " + rapor.gecen + " / " + rapor.toplam + " geçti");
  console.log(rapor.hatalar.length ? "BAŞARISIZ:\n" + rapor.hatalar.join("\n") : "BAŞARISIZ: yok ✔");
  if (hatalar.length) console.log("İSTİSNALAR:\n" + hatalar.slice(-5).join("\n"));
  process.exit(rapor.hatalar.length ? 1 : 0);
}
main().catch((e) => { console.error("HATA: " + e.message); process.exit(1); });
