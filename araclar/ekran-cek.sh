#!/usr/bin/env bash
# ÜSTAD MOTOR · ekran-cek.sh — tasarımın ekran görüntülerini alır (headless Chrome)
# statik=1 → geçiş animasyonları kapanır (headless'te animasyon kareleri donuyor)
set -u
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
KOK="C:/Users/kenan/OneDrive/Desktop/USTAD-MOTOR"
CIKTI="$KOK/ekran-goruntuleri"
mkdir -p "$CIKTI"

cevir() {  # $1 = sorgu, $2 = dosya adı, $3 = pencere yüksekliği (varsayılan 1050)
  local yuk="${3:-1050}"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
     --window-size=1280,"$yuk" --force-device-scale-factor=1 \
     --virtual-time-budget=3000 \
     --screenshot="$CIKTI/$2.png" "file:///$KOK/index.html?$1&statik=1&ses=0" >/dev/null 2>&1
  if [ -f "$CIKTI/$2.png" ]; then
    printf "%-20s %s KB\n" "$2.png" "$(( $(stat -c%s "$CIKTI/$2.png") / 1024 ))"
  else
    printf "%-20s HATA\n" "$2.png"
  fi
}

cevir ""                                        "01-giris"
cevir "isim=Kenan"                              "02-ana-sayfa"
cevir "isim=Kenan&ekran=program&demo=1"         "03-ders-programi"  2000
cevir "isim=Kenan&ekran=testler"                "04-testler"
cevir "isim=Kenan&ekran=deneme"                 "05-deneme-sinavi"
cevir "isim=Kenan&ekran=notlar"                 "06-ders-notlari"
cevir "isim=Kenan&ekran=istatistik"             "07-istatistik"
cevir "isim=Kenan&ekran=ayarlar"                "08-ayarlar"
cevir "isim=Kenan&menu=1"                       "09-menu"
cevir "isim=Kenan&test=1"                       "10-test-cozme"
cevir "isim=Kenan&ekran=oneriyor&yanlis=1"      "11-ustad-oneriyor"
cevir "isim=Kenan&renk=gece"                    "12-gece-paleti"
cevir "isim=Kenan&ekran=ayarlar&renk=lavanta"   "13-lavanta"
cevir "isim=Kenan&ekran=deneme"                 "14-deneme-ekrani"
cevir "isim=Kenan&ekran=deneme&deneme=basla"    "15-deneme-soru"
cevir "isim=Kenan&ekran=deneme&deneme=optik"    "16-optik-form"
cevir "isim=Kenan&ekran=deneme&deneme=sonuc"    "17-deneme-sonuc"   1800
cevir "isim=Kenan&ekran=deneme&deneme=kilit"    "18-sure-kiliti"
cevir "isim=Kenan&haber=0"                      "19-haber-penceresi"
cevir "isim=Kenan&ekran=notlar"                 "20-ders-notlari"
