#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
USTAD-MOTOR / haber-cek.py
Canlı haber beslemesi: eğitim/sınav haber kaynaklarını çeker, süzer, tekrarları atar ve
uygulamanın okuyacağı `icerik/besleme.js` dosyasını üretir.

Neden .js? WebView ve file:// altında `fetch` ile yerel JSON okunamaz (CORS/güvenlik).
Bu yüzden veri JSONP gibi bir .js dosyasına gömülür — APK içinde de sorunsuz çalışır.

Kullanım:  python araclar/haber-cek.py
Zamanlanmış çalıştırma: 15 dakikada bir (cron / Görev Zamanlayıcı).
"""
import io
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKTI_JS = os.path.join(KOK, "icerik", "besleme.js")
CIKTI_JSON = os.path.join(KOK, "icerik", "besleme.json")
EN_FAZLA = 40
KOTA = 12          # her kaynaktan en fazla kaç haber alınsın (kaynak çeşitliliği için)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) USTAD-MOTOR/1.0"

# ---- Kaynaklar: yalnız gerçekten çalıştığı denenmiş adresler ----
KAYNAKLAR = [
    {"ad": "Hürriyet Eğitim", "url": "https://www.hurriyet.com.tr/rss/egitim", "tip": "rss"},
    {"ad": "TRT Haber Eğitim", "url": "https://www.trthaber.com/egitim_articles.rss", "tip": "rss"},
    {"ad": "Anadolu Ajansı Eğitim", "url": "https://www.aa.com.tr/tr/rss/default?cat=egitim", "tip": "rss"},
    {"ad": "NTV Eğitim", "url": "https://www.ntv.com.tr/egitim.rss", "tip": "atom"},
    {"ad": "KPSS Cafe", "url": "https://www.kpsscafe.com.tr/rss", "tip": "rss", "suzgec": True},
    {"ad": "Kamudanhaber", "url": "https://www.kamudanhaber.net/rss", "tip": "rss", "suzgec": True},
]

# Genel haber kaynaklarını süzerken aranan kelimeler (sınav/eğitim gündemi)
ANAHTARLAR = [
    "kpss", "ösym", "osym", "sınav", "sinav", "eğitim", "egitim", "üniversite", "universite",
    "öğretmen", "ogretmen", "atama", "kadro", "mülakat", "mulakat", "yds", "ales", "tyt", "ayt",
    "lgs", "meb", "yks", "burs", "öğrenci", "ogrenci", "üniversite", "akademi", "sertifika",
    "lisans", "ön lisans", "onlisans", "ortaöğretim", "ortaogretim", "soru", "kontenjan",
]


def indir(url, zaman=25):
    istek = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(istek, timeout=zaman) as y:
        ham = y.read()
    return ham.decode("utf-8", "replace")


def metin_temizle(s, uzunluk=260):
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = (s.replace("&nbsp;", " ").replace("&amp;", "&").replace("&quot;", '"')
          .replace("&#39;", "'").replace("&apos;", "'").replace("&lt;", "<").replace("&gt;", ">"))
    s = re.sub(r"\s+", " ", s).strip()
    return s[:uzunluk]


def tarih_coz(s):
    if not s:
        return ""
    s = s.strip()
    for bicim in ("%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S %Z",
                  "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%d.%m.%Y %H:%M"):
        try:
            d = datetime.strptime(s, bicim)
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            return d.astimezone().isoformat(timespec="minutes")
        except ValueError:
            continue
    return s[:40]


def rss_oku(kaynak):
    """RSS (<item>) ve Atom (<entry>) beslemelerini okur."""
    haberler = []
    try:
        ham = indir(kaynak["url"])
    except Exception as e:
        print("  ! %s çekilemedi: %s" % (kaynak["ad"], e))
        return haberler
    try:
        kok = ET.fromstring(ham.encode("utf-8", "replace"))
    except ET.ParseError as e:
        print("  ! %s XML çözülemedi: %s" % (kaynak["ad"], e))
        return haberler

    for oge in kok.iter():
        yerel = oge.tag.split("}")[-1].lower()
        if yerel not in ("item", "entry"):
            continue
        alan, baglantilar = {}, []
        for c in oge:
            ad = c.tag.split("}")[-1].lower()
            alan[ad] = (c.text or "")
            if ad == "link":
                baglantilar.append(c.get("href") or c.text or "")
        baslik = metin_temizle(alan.get("title", ""), 180)
        if not baslik:
            continue
        url = (alan.get("link") or "").strip()
        if not url.startswith("http"):
            url = next((b for b in baglantilar if (b or "").startswith("http")), "")
        tarih = alan.get("pubdate") or alan.get("published") or alan.get("updated") or alan.get("date") or ""
        ozet = alan.get("description") or alan.get("summary") or alan.get("content") or ""
        haberler.append({
            "baslik": baslik,
            "kaynak": kaynak["ad"],
            "tarih": tarih_coz(tarih),
            "ozet": metin_temizle(ozet),
            "url": url.strip(),
        })
    return haberler


def suzgec_uygun(haber):
    k = (haber["baslik"] + " " + haber["ozet"]).lower()
    return any(a in k for a in ANAHTARLAR)


def main():
    print("Haber beslemesi çekiliyor…")
    tum, gruplar = [], []
    for kaynak in KAYNAKLAR:
        haberler = rss_oku(kaynak)
        ham_sayi = len(haberler)
        if kaynak.get("suzgec"):
            haberler = [h for h in haberler if suzgec_uygun(h)]
        # her kaynaktan en yeni haberler (kaynak çeşitliliği korunsun)
        haberler.sort(key=lambda h: h["tarih"], reverse=True)
        haberler = haberler[:KOTA]
        etiket = "süzüldü" if kaynak.get("suzgec") else "tamamı"
        print("  - %-20s %2d/%2d haber (%s)" % (kaynak["ad"], len(haberler), ham_sayi, etiket))
        gruplar.append(haberler)
        tum.extend(haberler)

    # kaynakları sırayla harmanla (her kaynak listede görünsün) + tekrarları at
    en_uzun = max([len(x) for x in gruplar] or [0])
    sirali = []
    for i in range(en_uzun):
        for grup in gruplar:
            if i < len(grup):
                sirali.append(grup[i])

    gorulen, temiz = set(), []
    for h in sirali:
        anahtar = re.sub(r"\W+", "", h["baslik"].lower())[:60]
        if not anahtar or anahtar in gorulen:
            continue
        gorulen.add(anahtar)
        temiz.append(h)

    temiz.sort(key=lambda h: h["tarih"], reverse=True)
    temiz = temiz[:EN_FAZLA]

    paket = {
        "guncelleme": datetime.now().astimezone().isoformat(timespec="minutes"),
        "kaynakSayisi": len(KAYNAKLAR),
        "haberSayisi": len(temiz),
        "haberler": temiz,
    }
    with io.open(CIKTI_JSON, "w", encoding="utf-8") as f:
        json.dump(paket, f, ensure_ascii=False, indent=1)
    with io.open(CIKTI_JS, "w", encoding="utf-8") as f:
        f.write("/* ÜSTAD MOTOR · canlı haber beslemesi — araclar/haber-cek.py üretir.\n"
                "   Bu dosyayı elle düzenleme; yeni çekimde üzerine yazılır. */\n")
        f.write("window.USTAD_BESLEME = ")
        json.dump(paket, f, ensure_ascii=False)
        f.write(";\n")

    print("Toplam %d haber yazıldı → %s" % (len(temiz), CIKTI_JS))
    if temiz:
        print("En yeni: [%s] %s" % (temiz[0]["kaynak"], temiz[0]["baslik"][:96]))
        print("En eski: [%s] %s" % (temiz[-1]["kaynak"], temiz[-1]["baslik"][:96]))


if __name__ == "__main__":
    main()
