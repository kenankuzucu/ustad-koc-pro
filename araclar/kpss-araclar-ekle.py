# -*- coding: utf-8 -*-
"""ÜSTAD KPSS-B KOÇ PRO · KPSS ARAÇLAR bölümlerini projeye ekler.
Ayrı uygulama DEĞİL: geri sayım, net & puan, 2026 güncel bilgiler ve çıkmış sorular
bölümleri KOÇ PRO'nun içine katılır (Kenan'ın isteği: "ayrı değil, bunun içine ekle").
Veri dosyaları ARAÇLAR projesinden kopyalanır, global adları KPSS_* ön ekiyle çakışmasız yazılır.
Kullanım: python araclar/kpss-araclar-ekle.py
"""
import pathlib, re, sys

KOC = pathlib.Path(__file__).resolve().parent.parent
ARAC = pathlib.Path.home() / "OneDrive/Desktop/USTAD-KPSS-ARACLAR"
ESLEME = [("takvim.js", "kpss-takvim.js", "TAKVIM", "KPSS_TAKVIM"),
          ("guncel.js", "kpss-guncel.js", "GUNCEL", "KPSS_GUNCEL"),
          ("cikmis.js", "kpss-cikmis.js", "CIKMIS", "KPSS_CIKMIS")]

if not ARAC.exists():
    sys.exit("ARAÇLAR projesi bulunamadı: " + str(ARAC))

for kaynak_ad, hedef_ad, eski, yeni in ESLEME:
    kaynak = ARAC / "icerik" / kaynak_ad
    hedef = KOC / "icerik" / hedef_ad
    s = kaynak.read_text(encoding="utf-8")
    # yalnız global tanımını çakışmasız ada çevir (içerik metnine dokunma)
    s2 = re.sub(r"window\.%s\s*=" % eski, "window.%s =" % yeni, s)
    assert s2 != s or ("window.%s" % yeni) in s, "global ad değişmedi: " + kaynak_ad
    hedef.write_text(s2, encoding="utf-8")
    print("kopyalandı: icerik/%s ← %s (%d bayt)" % (hedef_ad, kaynak_ad, hedef.stat().st_size))

# doğrulama: KOÇ PRO'nun kendi dosyalarıyla ad çakışması yok
cakisan = []
for p in list((KOC / "assets").glob("*.js")) + list((KOC / "icerik").glob("*.js")):
    if p.name in [e[1] for e in ESLEME]:
        continue
    t = p.read_text(encoding="utf-8", errors="replace")
    for _, _, _, yeni in ESLEME:
        if ("window.%s =" % yeni) in t or ("window.%s=" % yeni) in t:
            cakisan.append((p.name, yeni))
print("çakışma:", cakisan if cakisan else "yok ✔")

# özet
for _, hedef_ad, _, yeni in ESLEME:
    t = (KOC / "icerik" / hedef_ad).read_text(encoding="utf-8")
    m = re.search(r"window\.%s\s*=\s*\{" % yeni, t)
    print("  %-16s global tanım: %s" % (hedef_ad, "var ✔" if m else "YOK ✘"))
