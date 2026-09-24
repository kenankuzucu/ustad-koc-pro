#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
USTAD-MOTOR / sorulari-derle.py
icerik/uretim/*.json (yazar dosyaları) → icerik/sorular.js + icerik/notlar.js

Neden derleme? Uygulama (WebView/file://) yerel JSON okuyamaz; veriyi .js içine gömeriz.
Betik ayrıca KALİTE DENETİMİ yapar: şık sayısı, doğru indeksi, tekrar eden soru,
konu kapsaması, doğru şık dağılımı ve ders bazlı soru sayısı.

Kullanım: python araclar/sorulari-derle.py
"""
import io
import json
import os
import re
import sys
import collections

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URETIM = os.path.join(KOK, "icerik", "uretim")
SORULAR_JS = os.path.join(KOK, "icerik", "sorular.js")
NOTLAR_JS = os.path.join(KOK, "icerik", "notlar.js")

BEKLENEN = {"Türkçe": 30, "Matematik": 30, "Tarih": 27, "Coğrafya": 18,
            "Vatandaşlık": 9, "Güncel Bilgiler": 6}
SIRA = ["Türkçe", "Matematik", "Tarih", "Coğrafya", "Vatandaşlık", "Güncel Bilgiler"]


def oku(yol):
    with io.open(yol, encoding="utf-8") as f:
        return json.load(f)


def duzelt(metin):
    return re.sub(r"\W+", "", (metin or "").lower())[:80]


def main():
    if not os.path.isdir(URETIM):
        os.makedirs(URETIM)
    dosyalar = sorted(f for f in os.listdir(URETIM) if f.endswith(".json"))
    if not dosyalar:
        print("UYARI: icerik/uretim/ içinde .json yok — boş banka yazılıyor.")
        yaz(SORULAR_JS, "window.USTAD_SORULAR = [];\n")
        yaz(NOTLAR_JS, "window.USTAD_NOTLAR = [];\n")
        return

    tum_sorular, tum_notlar, rapor = [], [], []
    hatalar = []
    for ad in dosyalar:
        try:
            veri = oku(os.path.join(URETIM, ad))
        except Exception as e:
            hatalar.append("%s okunamadı: %s" % (ad, e))
            continue
        ders = veri.get("ders") or ad.replace(".json", "").title()
        sorular = veri.get("sorular") or []
        notlar = veri.get("notlar") or []

        kabul = 0
        for i, s in enumerate(sorular):
            yer = "%s#%d" % (ad, i + 1)
            if len(s.get("secenekler") or []) != 4:
                hatalar.append("%s: şık sayısı 4 değil" % yer); continue
            if not isinstance(s.get("dogru"), int) or not (0 <= s["dogru"] <= 3):
                hatalar.append("%s: doğru indeksi geçersiz (%r)" % (yer, s.get("dogru"))); continue
            if not (s.get("soru") or "").strip():
                hatalar.append("%s: soru metni boş" % yer); continue
            if not (s.get("aciklama") or "").strip():
                s["aciklama"] = "Açıklama eklenmemiş."
            s["ders"] = ders
            tum_sorular.append(s)
            kabul += 1

        for n in notlar:
            n["ders"] = ders
            tum_notlar.append(n)

        dagilim = collections.Counter("ABCD"[s["dogru"]] for s in sorular if isinstance(s.get("dogru"), int))
        rapor.append("%-16s soru:%3d/%-3d not:%2d  şık dağılımı: %s" % (
            ders, kabul, BEKLENEN.get(ders, 0), len(notlar),
            " ".join("%s:%d" % (h, dagilim.get(h, 0)) for h in "ABCD")))

    # ders sırasına diz (Genel Yetenek önce)
    def anahtar(s):
        return SIRA.index(s["ders"]) if s["ders"] in SIRA else 99
    tum_sorular.sort(key=anahtar)

    # tekrar eden soruları bul (metin + soru birlikte bakılır; kalıp soru kökleri yanlış alarm vermesin)
    gorulen, tekrar = set(), []
    for s in tum_sorular:
        k = duzelt((s.get("metin") or "") + " " + (s.get("soru") or "")) + "|" + duzelt(" ".join(s.get("secenekler") or []))
        if k in gorulen:
            tekrar.append(s.get("soru", "")[:70])
        gorulen.add(k)

    # konu kapsaması: her dersin konularından kaçına soru yazılmış
    kapsama = {}
    for s in tum_sorular:
        kapsama.setdefault(s["ders"], set()).add((s.get("konu") or "").strip())

    print("=== DERLEME RAPORU ===")
    print("\n".join(rapor))
    print("Toplam soru: %d | Toplam not: %d" % (len(tum_sorular), len(tum_notlar)))
    print("Ders bazlı konu kapsaması:")
    for d in SIRA:
        if d in kapsama:
            print("  %-16s %2d farklı konu" % (d, len(kapsama[d])))
    if tekrar:
        print("TEKRAR EDEN SORULAR (%d):" % len(tekrar))
        for t in tekrar:
            print("  -", t)
    if hatalar:
        print("EKSİK/HATALI KAYITLAR (%d):" % len(hatalar))
        for h in hatalar[:20]:
            print("  !", h)

    ders_eksik = [(d, sum(1 for s in tum_sorular if s["ders"] == d), BEKLENEN[d])
                  for d in SIRA if sum(1 for s in tum_sorular if s["ders"] == d) < BEKLENEN[d]]
    if ders_eksik:
        print("HEDEFİN ALTINDA KALAN DERSLER:")
        for d, var, hedef in ders_eksik:
            print("  %-16s %d/%d" % (d, var, hedef))

    baslik = ("/* ÜSTAD MOTOR · derlenmiş soru bankası — araclar/sorulari-derle.py üretir.\n"
              "   Kaynak: icerik/uretim/*.json · Sorular ÖZGÜN yazılmıştır (ÖSYM soruları kopyalanmaz). */\n")
    yaz(SORULAR_JS, baslik + "window.USTAD_SORULAR = " + json.dumps(tum_sorular, ensure_ascii=False, indent=1) + ";\n")
    yaz(NOTLAR_JS, baslik + "window.USTAD_NOTLAR = " + json.dumps(tum_notlar, ensure_ascii=False, indent=1) + ";\n")
    print("Yazıldı: %s (%d KB)" % (SORULAR_JS, os.path.getsize(SORULAR_JS) // 1024))
    print("Yazıldı: %s (%d KB)" % (NOTLAR_JS, os.path.getsize(NOTLAR_JS) // 1024))
    return 0 if not hatalar else 1


def yaz(yol, icerik):
    with io.open(yol, "w", encoding="utf-8") as f:
        f.write(icerik)


if __name__ == "__main__":
    sys.exit(main() or 0)
