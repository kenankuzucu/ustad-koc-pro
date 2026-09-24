/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · CDP ile sayfa içi JS çalıştırma (sağlam sürüm).
   Kullanım: node araclar/cdp-kos.js "<url>" "<ifade>" [port]
   Fark: hedef bulma ve WebSocket adımı ayrı ayrı raporlanır; http modülüyle çalışır,
   fetch/proxy sorunlarından etkilenmez. Chrome: --headless=new --remote-debugging-port=9333 */
const http = require("http");
const PORT = Number(process.argv[4] || process.env.CDP_PORT || 9333);
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

function listele(port) {
  return new Promise((res, rej) => {
    const istek = http.get({ host: "127.0.0.1", port, path: "/json/list", timeout: 8000 }, (r) => {
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(new Error("JSON çözülemedi: " + e.message)); } });
    });
    istek.on("error", (e) => rej(new Error("http hatası: " + e.message)));
    istek.on("timeout", () => { istek.destroy(); rej(new Error("http zaman aşımı")); });
  });
}

async function hedef(port) {
  let son = "";
  for (let i = 0; i < 20; i++) {
    try {
      const l = await listele(port);
      const s = l.find((t) => t.type === "page");
      if (s && s.webSocketDebuggerUrl) return s.webSocketDebuggerUrl;
      son = "hedef listesi boş (page yok), toplam " + l.length;
    } catch (e) { son = e.message; }
    await bekle(500);
  }
  throw new Error("CDP hedefi yok → " + son + " (port " + port + ")");
}

async function main() {
  const url = process.argv[2];
  const ifade = process.argv[3] || "1";
  const wsUrl = await hedef(PORT);
  const ws = new WebSocket(wsUrl);
  let id = 0; const bekleyen = new Map(); const olaylar = [];
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && bekleyen.has(m.id)) { bekleyen.get(m.id)(m); bekleyen.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") olaylar.push("EXCEPTION: " + (m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || m.params.exceptionDetails.text));
    if (m.method === "Runtime.consoleAPICalled") olaylar.push("LOG: " + (m.params.args || []).map((a) => a.value).join(" "));
  });
  await new Promise((r, rj) => { ws.addEventListener("open", r); ws.addEventListener("error", () => rj(new Error("WebSocket bağlanamadı"))); });
  const gonder = (method, params = {}) => new Promise((res) => { const n = ++id; bekleyen.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  await gonder("Runtime.enable");
  await gonder("Page.enable");
  await gonder("Network.enable");
  await gonder("Network.setCacheDisabled", { cacheDisabled: true });
  if (url) { await gonder("Page.navigate", { url }); await bekle(4000); }
  const r = await gonder("Runtime.evaluate", { expression: ifade, returnByValue: true, awaitPromise: true });
  if (r.result && r.result.exceptionDetails) console.log("SAYFA HATASI:", JSON.stringify(r.result.exceptionDetails).slice(0, 900));
  else console.log("SONUÇ:", JSON.stringify(r.result && r.result.result ? r.result.result.value : r.result).slice(0, 4000));
  if (olaylar.length) console.log("OLAYLAR:\n" + olaylar.slice(-15).join("\n"));
  ws.close();
}
main().catch((e) => { console.error("HATA: " + e.message); process.exit(1); });
