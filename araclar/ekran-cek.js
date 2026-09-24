/* © 2026 Kenan Kuzucu · ÜSTAD KPSS-B KOÇ PRO · ekran görüntüsü aracı (Chrome DevTools Protocol).
   Kullanım:  node araclar/ekran-cek.js <bölüm1> [bölüm2 ...]
   Örnek:     node araclar/ekran-cek.js sayim puan guncel cikmis
   Önce Chrome şu bayrakla açılmalı:
     chrome.exe --headless=new --remote-debugging-port=9333 --user-data-dir=<klasör> about:blank
   Kapı (ilk açılış perdesi) otomatik geçilir: isim yazılır, BAŞLA ve Atla düğmelerine basılır. */
const fs = require("fs");
const path = require("path");

const PORT = process.env.CDP_PORT || 9333;
const PROJE = path.resolve(__dirname, "..");
const SAYFA = "file:///" + PROJE.replace(/\\/g, "/") + "/index.html";
const ONBELLEK = "?v=" + Date.now();   // tarayıcı önbelleğini atla
const CIKTI = path.join(PROJE, "ekran-goruntuleri");
const BOLUMLER = process.argv.slice(2);
if (!BOLUMLER.length) { console.error("Kullanım: node araclar/ekran-cek.js sayim puan guncel cikmis"); process.exit(2); }
fs.mkdirSync(CIKTI, { recursive: true });

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function hedefBul() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const l = await r.json();
      const s = l.find((t) => t.type === "page");
      if (s && s.webSocketDebuggerUrl) return s.webSocketDebuggerUrl;
    } catch (e) {}
    await bekle(500);
  }
  throw new Error("Chrome CDP bulunamadı (port " + PORT + ")");
}

async function main() {
  const wsUrl = await hedefBul();
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const bekleyen = new Map();
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && bekleyen.has(m.id)) { bekleyen.get(m.id)(m); bekleyen.delete(m.id); }
  });
  await new Promise((r) => ws.addEventListener("open", r));
  const gonder = (method, params = {}) => new Promise((res) => {
    const n = ++id;
    bekleyen.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const js = async (ifade) => {
    const r = await gonder("Runtime.evaluate", { expression: ifade, returnByValue: true, awaitPromise: true });
    return r.result && r.result.result ? r.result.result.value : null;
  };

  await gonder("Page.enable");
  await gonder("Network.enable");
  await gonder("Network.setCacheDisabled", { cacheDisabled: true });
  await gonder("Runtime.enable");
  await gonder("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1150, deviceScaleFactor: 1, mobile: false });

  let ilk = true;
  for (const bolum of BOLUMLER) {
    await gonder("Page.navigate", { url: SAYFA + ONBELLEK + "#" + bolum });
    await bekle(ilk ? 3500 : 2200);
    if (ilk) {
      const r = await js(`(() => {
        const inp = document.querySelector('#perdeIsim') || document.querySelector('#perde input[type=text]') || document.querySelector('#perde input');
        if (inp) { inp.value = 'Kenan'; inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true})); }
        const cins = document.querySelector('#perdeCins .cins-dugme');
        if (cins) cins.click();
        const bas = [...document.querySelectorAll('#perde button')].find(b => /BAŞLA/i.test(b.textContent));
        if (bas) bas.click();
        return (inp ? 'isim yazıldı' : 'isim alanı yok') + ' | ' + (bas ? 'BAŞLA basıldı' : 'BAŞLA yok');
      })()`);
      console.log("kapı: " + r);
      await bekle(1200);
      const a = await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => /Atla/i.test(x.textContent)); if (b) { b.click(); return 'Atla basıldı'; } return 'tanıtım yok'; })()`);
      console.log("tanıtım: " + a);
      await bekle(900);
      // Kapı kapandığında uygulama "ana" bölümüne döner; istenen bölüme yeniden gidilir
      await gonder("Page.navigate", { url: SAYFA + ONBELLEK + "#" + bolum });
      await bekle(1800);
      ilk = false;
    }
    const durum = await js(`(() => {
      const e = document.querySelector('#ekran-${bolum}');
      const aktif = e ? getComputedStyle(e).display : 'yok';
      return '${bolum}: ekran=' + aktif + ' | menü öğesi=' + document.querySelectorAll('.menu-oge').length +
        ' | başlık=' + (document.querySelector('#baslik') ? document.querySelector('#baslik').textContent.trim() : '-');
    })()`);
    console.log(durum);
    const sc = await gonder("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    const dosya = path.join(CIKTI, "arac-" + bolum + ".png");
    fs.writeFileSync(dosya, Buffer.from(sc.result.data, "base64"));
    console.log("  → " + dosya + " (" + fs.statSync(dosya).size + " bayt)");
  }
  ws.close();
}
main().catch((e) => { console.error("HATA: " + e.message); process.exit(1); });
