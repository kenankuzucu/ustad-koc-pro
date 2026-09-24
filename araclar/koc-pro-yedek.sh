#!/usr/bin/env bash
# ÜSTAD KOÇ PRO — GitHub özel depo yedeği (tek komut)
# Kullanım:  bash araclar/koc-pro-yedek.sh "kısa açıklama"
# Yaptığı: masaüstündeki USTAD-KOC-PRO-v*.apk dosyalarını apk/ klasörüne kopyalar,
#          her şeyi commit'ler ve özel depoya push eder.
set -u
PROJE="/c/Users/kenan/OneDrive/Desktop/USTAD-MOTOR-2"
DEPO="https://github.com/kenankuzucu/ustad-koc-pro.git"
MASAUSTU="/c/Users/kenan/OneDrive/Desktop"
MESAJ="${1:-ÜSTAD KOÇ PRO güncelleme}"

cd "$PROJE" || { echo "Proje bulunamadı: $PROJE"; exit 1; }
mkdir -p apk

# masaüstündeki KOÇ PRO APK'larını arşive al
for f in "$MASAUSTU"/USTAD-KOC-PRO-v*.apk; do
  [ -e "$f" ] || continue
  ad=$(basename "$f")
  hedef="apk/$(echo "$ad" | tr '[:upper:]' '[:lower:]')"
  cp -f "$f" "$hedef"
  echo "  arşiv: $hedef"
done

git add -A
if git diff --cached --quiet; then
  echo "Değişiklik yok — commit atlandı."
else
  git commit -q -m "$MESAJ"
fi

# token'ı ortamdan geçir (sohbete/loga yazılmaz)
ENV_DOSYA="$HOME/AppData/Local/hermes/.env"
GITHUB_TOKEN=$(grep -m1 '^GITHUB_TOKEN' "$ENV_DOSYA" | cut -d= -f2- | tr -d '"'"'"' \r')
export GITHUB_TOKEN

YARDIMCI='!f(){ echo username=kenankuzucu; echo password=$GITHUB_TOKEN; }; f'
git remote remove origin 2>/dev/null
git remote add origin "$DEPO"
git -c "credential.helper=$YARDIMCI" push -u origin main || exit 1
git config credential.helper ""

echo "YEDEK TAMAM → $DEPO"
git log --oneline -1
echo "Yerel commit: $(git rev-parse HEAD)"
