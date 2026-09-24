/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · CDP ile sayfa içi JS çalıştırma + hata yakalama (tanı aracı).
   Kullanım: node araclar/cdp-eval.js "<url>" "<ifade>"
   Chrome şu bayrakla açık olmalı: --headless=new --remote-debugging-port=9333 */
const PORT = process.env.CDP_PORT || 9333;
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

async function main() {
  const url = process.argv[2];
  const ifade = process.argv[3] || "1";
  const ws = new WebSocket(await hedef());
  let id = 0; const bekleyen = new Map(); const olaylar = [];
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && bekleyen.has(m.id)) { bekleyen.get(m.id)(m); bekleyen.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") olaylar.push("EXCEPTION: " + JSON.stringify(m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || m.params.exceptionDetails.text));
    if (m.method === "Runtime.consoleAPICalled") olaylar.push("LOG: " + (m.params.args || []).map((a) => a.value).join(" "));
  });
  await new Promise((r) => ws.addEventListener("open", r));
  const gonder = (method, params = {}) => new Promise((res) => { const n = ++id; bekleyen.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
  await gonder("Runtime.enable");
  await gonder("Page.enable");
  await gonder("Network.enable");
  await gonder("Network.setCacheDisabled", { cacheDisabled: true });
  if (url) { await gonder("Page.navigate", { url }); await bekle(3500); }
  const r = await gonder("Runtime.evaluate", { expression: ifade, returnByValue: true, awaitPromise: true });
  console.log("SONUÇ:", JSON.stringify(r.result && r.result.result ? r.result.result.value : r.result, null, 1).slice(0, 3000));
  if (r.result && r.result.exceptionDetails) console.log("HATA:", JSON.stringify(r.result.exceptionDetails).slice(0, 1200));
  if (olaylar.length) console.log("OLAYLAR:\n" + olaylar.slice(-25).join("\n"));
  ws.close();
}
main().catch((e) => { console.error("HATA: " + e.message); process.exit(1); });
