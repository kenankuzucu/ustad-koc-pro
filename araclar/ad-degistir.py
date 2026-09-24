# -*- coding: utf-8 -*-
"""ÜSTAD KOÇ PRO → ad değişikliği: "ÜSTAD KPSS-B KOÇ PRO" + sürüm 2.3.
Yalnızca GÖRÜNEN AD ve SÜRÜM metinleri değişir; motor mantığına dokunulmaz.
"""
import pathlib, re, sys

PROJE = pathlib.Path(r"C:\Users\kenan\OneDrive\Desktop\USTAD-MOTOR-2")
KABUK = pathlib.Path(r"C:\Users\kenan\AndroidBuild\ustad-koc-pro-app")
YENI_AD = "ÜSTAD KPSS-B KOÇ PRO"
ESKI_AD = "ÜSTAD KOÇ PRO"
YENI_SURUM = "2.3"
ESKI_SURUM = "2.2"

degisim = 0
def uygula(yol, ciftler, zorunlu=True):
    global degisim
    p = pathlib.Path(yol)
    t = p.read_text(encoding="utf-8")
    ozet = []
    for eski, yeni in ciftler:
        n = t.count(eski)
        if n:
            t = t.replace(eski, yeni)
            ozet.append(f"{n}x {eski[:46]!r}")
            degisim += n
        elif zorunlu:
            ozet.append(f"BULUNAMADI: {eski[:46]!r}")
    p.write_text(t, encoding="utf-8")
    print(f"--- {p}")
    for s in ozet: print("    ", s)

uygula(PROJE / "index.html", [
    (f"<title>{ESKI_AD} · Sınav Koçu</title>", f"<title>{YENI_AD} · Sınav Koçu</title>"),
    (f"<b>{ESKI_AD}</b>", f"<b>{YENI_AD}</b>"),
    (f'<meta name="surum" content="{ESKI_SURUM}">', f'<meta name="surum" content="{YENI_SURUM}">'),
    (f"© 2026 Kenan Kuzucu · {ESKI_AD}", f"© 2026 Kenan Kuzucu · {YENI_AD}"),
])
uygula(PROJE / "assets/motor.js", [
    (f"'<img src=\"tasarim/ustad-kafa.png\" alt=\"\"><b>{ESKI_AD}</b>'",
     f"'<img src=\"tasarim/ustad-kafa.png\" alt=\"\"><b>{YENI_AD}</b>'"),
    (f'document.title = "{ESKI_AD} · "', f'document.title = "{YENI_AD} · "'),
    (f'ad: "{ESKI_AD}",', f'ad: "{YENI_AD}",'),
    (f"<div class='panel-ad'><b>{ESKI_AD}</b>", f"<div class='panel-ad'><b>{YENI_AD}</b>"),
    (f"© 2026 Kenan Kuzucu · {ESKI_AD} · Sınav Koçu (KPSS-B paketi)",
     f"© 2026 Kenan Kuzucu · {YENI_AD} · Sınav Koçu (KPSS-B paketi)"),
])
uygula(PROJE / "assets/koc.js", [(f'uygulama: "{ESKI_AD}"', f'uygulama: "{YENI_AD}"')], zorunlu=False)
# kabuk kopyaları (belge/kaynak eşliği)
uygula(PROJE / "android-kabuk/res/values/strings.xml",
       [(f'<string name="uygulama_adi">{ESKI_AD}</string>', f'<string name="uygulama_adi">{YENI_AD}</string>')])
uygula(PROJE / "android-kabuk/AndroidManifest.xml",
       [(f'android:versionCode="3"', 'android:versionCode="4"'),
        (f'android:versionName="{ESKI_SURUM}"', f'android:versionName="{YENI_SURUM}"')])
# derlemede KULLANILAN kabuk (AndroidBuild)
uygula(KABUK / "res/values/strings.xml",
       [(f'<string name="uygulama_adi">{ESKI_AD}</string>', f'<string name="uygulama_adi">{YENI_AD}</string>')])
uygula(KABUK / "AndroidManifest.xml",
       [(f'android:versionCode="3"', 'android:versionCode="4"'),
        (f'android:versionName="{ESKI_SURUM}"', f'android:versionName="{YENI_SURUM}"')])

print("\nTOPLAM değişiklik:", degisim)
# kontrol
for y, anahtar in [(PROJE / "index.html", YENI_AD), (PROJE / "assets/motor.js", YENI_AD),
                   (KABUK / "res/values/strings.xml", YENI_AD), (KABUK / "AndroidManifest.xml", YENI_SURUM),
                   (PROJE / "index.html", YENI_SURUM)]:
    t = pathlib.Path(y).read_text(encoding="utf-8")
    print(("  ✔ " if anahtar in t else "  ✘ ") + str(y).split("\\")[-1] + " → " + anahtar)
print("kalan eski ad sayısı (motor.js):", (PROJE / "assets/motor.js").read_text(encoding="utf-8").count(ESKI_AD))
print("kalan eski sürüm (index.html):", (PROJE / "index.html").read_text(encoding="utf-8").count('content="2.2"'))
