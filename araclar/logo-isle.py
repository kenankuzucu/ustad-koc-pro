#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
USTAD-MOTOR / logo-isle.py  (v2)
ÜSTAD.docx içindeki logo png'lerini uygulamaya hazırlar:
  1) turuncu çerçeveyi ve açık zemin'i KOMŞULUK (flood-fill) yöntemiyle siler -> şeffaf PNG
  2) şeffaf kenarları kırpar, WebView için uygun boyuta küçültür
  3) hem şeffaf sürümü hem "kart içinde" sürümü üretir (hangisi güzel görünürse)
Kullanım: python araclar/logo-isle.py
"""
import os
import sys
import zipfile
import shutil
import tempfile
from collections import deque
from PIL import Image

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TASARIM = os.path.join(KOK, "tasarim")
DOCX = r"C:\Users\kenan\OneDrive\Desktop\ÜSTAD.docx"
GENISLIK = 720


def docxten_cikar():
    if not os.path.exists(DOCX):
        sys.exit("ÜSTAD.docx bulunamadı: " + DOCX)
    gecici = tempfile.mkdtemp(prefix="ustad-logo-")
    with zipfile.ZipFile(DOCX) as z:
        for ad in z.namelist():
            if ad.startswith("word/media/"):
                z.extract(ad, gecici)
    return gecici


def arka_plan_mi(px, zemin):
    """Açık zemin (beyaz/gri) veya turuncu çerçeve ise True döner."""
    r, g, b = px
    # 1) açık zemin: parlak ve renksiz
    if min(r, g, b) >= 158 and (max(r, g, b) - min(r, g, b)) <= 34:
        return True
    # 2) turuncu çerçeve
    if r >= 195 and 105 <= g <= 205 and b <= 120:
        return True
    # 3) zemine renk yakınlığı (yumuşak gölge/leke)
    uzaklik = abs(r - zemin[0]) + abs(g - zemin[1]) + abs(b - zemin[2])
    return uzaklik <= 42


def zemin_rengi(px, g, y):
    """Kenarlardan ortalama zemin rengini hesaplar."""
    toplam = [0, 0, 0]
    sayi = 0
    for j in (0, 1, y - 2, y - 1):
        for i in range(g):
            p = px[i, j]
            for k in range(3):
                toplam[k] += p[k]
            sayi += 1
    for i in (0, 1, g - 2, g - 1):
        for j in range(y):
            p = px[i, j]
            for k in range(3):
                toplam[k] += p[k]
            sayi += 1
    return tuple(t // max(1, sayi) for t in toplam)


def zemini_sil(im):
    """Kenarlardan başlayan flood-fill ile zemin + çerçeveyi şeffaf yapar."""
    im = im.convert("RGBA")
    px = im.load()
    g, y = im.size
    zemin = zemin_rengi(px, g, y)
    gorulen = bytearray(g * y)
    kuyruk = deque()

    def ekle(i, j):
        if 0 <= i < g and 0 <= j < y and not gorulen[j * g + i]:
            gorulen[j * g + i] = 1
            if arka_plan_mi(px[i, j][:3], zemin):
                px[i, j] = (px[i, j][0], px[i, j][1], px[i, j][2], 0)
                kuyruk.append((i, j))

    for i in range(g):
        ekle(i, 0); ekle(i, y - 1)
    for j in range(y):
        ekle(0, j); ekle(g - 1, j)

    while kuyruk:
        i, j = kuyruk.popleft()
        ekle(i + 1, j); ekle(i - 1, j); ekle(i, j + 1); ekle(i, j - 1)
    return im


def yumusat_kenar(im, esik=170):
    """Zemine komşu yarı saydam (antialias) pikselleri eritir."""
    im = im.convert("RGBA")
    px = im.load()
    g, y = im.size
    for j in range(1, y - 1):
        for i in range(1, g - 1):
            r, gg, b, a = px[i, j]
            if a == 0:
                continue
            # saydam komşusu olan açık renkli piksel -> yumuşak alfa
            komsu_saydam = 0
            for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if px[i + di, j + dj][3] == 0:
                    komsu_saydam += 1
            if komsu_saydam and min(r, gg, b) >= esik:
                oran = (255 - min(r, gg, b)) / float(255 - esik) if esik < 255 else 1.0
                px[i, j] = (r, gg, b, int(255 * max(0.0, min(1.0, oran))))
    return im


def koyu_surum(im, oran=0.45, esik=168, hedef=(238, 244, 255)):
    """Koyu zemin sürümü: sağ taraftaki (yazı) lacivert harfleri açık renge çevirir.
    Kafa gradyanı (sol taraf) olduğu gibi kalır."""
    im = im.convert("RGBA")
    px = im.load()
    g, y = im.size
    basla = int(g * oran)
    for j in range(y):
        for i in range(basla, g):
            r, gg, b, a = px[i, j]
            if a == 0:
                continue
            parlak = 0.299 * r + 0.587 * gg + 0.114 * b
            if parlak < esik:
                k = min(1.0, (esik - parlak) / float(esik))
                f = 0.55 + 0.45 * k          # koyu harf -> koyu kalksın
                px[i, j] = (
                    int(r + (hedef[0] - r) * f),
                    int(gg + (hedef[1] - gg) * f),
                    int(b + (hedef[2] - b) * f), a)
    return im


def kucult(im, genislik=GENISLIK):
    oran = genislik / float(im.width)
    return im.resize((genislik, max(1, int(im.height * oran))), Image.LANCZOS)


def main():
    os.makedirs(TASARIM, exist_ok=True)
    gecici = docxten_cikar()
    isler = [("image1.png", "ustad-logo-tam"), ("image2.png", "ustad-logo-kpss")]
    rapor = []
    for kaynak, ad in isler:
        yol = os.path.join(gecici, "word", "media", kaynak)
        if not os.path.exists(yol):
            rapor.append("ATLANDI " + kaynak)
            continue
        im = Image.open(yol).convert("RGBA")
        im = zemini_sil(im)
        im = yumusat_kenar(im)
        kutu = im.getbbox()
        if kutu:
            im = im.crop(kutu)
        im = kucult(im)
        hedef_yol = os.path.join(TASARIM, ad + ".png")
        im.save(hedef_yol)
        rapor.append("%-24s %dx%d  %d KB" % (ad + ".png", im.width, im.height, os.path.getsize(hedef_yol) // 1024))
        koyu = koyu_surum(im)
        koyu_yol = os.path.join(TASARIM, ad + "-koyu.png")
        koyu.save(koyu_yol)
        rapor.append("%-24s %dx%d  %d KB" % (ad + "-koyu.png", koyu.width, koyu.height, os.path.getsize(koyu_yol) // 1024))
        # yalnız kafa işareti (üst şerit ve menü başlığı için) — tek sürüm yeter
        if ad == "ustad-logo-tam":
            kafa = im.crop((0, 0, int(im.width * 0.46), im.height))
            kk = kafa.getbbox()
            if kk:
                kafa = kafa.crop(kk)
            kafa_yol = os.path.join(TASARIM, "ustad-kafa.png")
            kafa.save(kafa_yol)
            rapor.append("%-24s %dx%d  %d KB" % ("ustad-kafa.png", kafa.width, kafa.height, os.path.getsize(kafa_yol) // 1024))
    shutil.rmtree(gecici, ignore_errors=True)
    print("\n".join(rapor))


if __name__ == "__main__":
    main()
