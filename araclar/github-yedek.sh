#!/usr/bin/env bash
# ÜSTAD MOTOR · GitHub yedeği — değişiklikleri tek komutla yedekler.
# Kullanım:  bash araclar/github-yedek.sh "kısa açıklama"
# © 2026 Kenan Kuzucu · ÜSTAD Sınav Koçu · TÜM HAKLARI SAKLIDIR (5846 FSEK).
set -e
cd "$(dirname "$0")/.."
NOT="${1:-güncelleme}"

# Token Hermes'in sır dosyasından gelir (komut satırına yazılmaz, sohbete dökülmez).
set -a; source ~/AppData/Local/hermes/.env; set +a
export GIT_TERMINAL_PROMPT=0

# Yeni sürüm APK'sı masaüstünde oluştuysa depoya kopyala
for f in ~/OneDrive/Desktop/USTAD-KPSS-B-v*.apk; do
  [ -e "$f" ] && cp -u "$f" apk/ 2>/dev/null || true
done

git init -q 2>/dev/null || true
git add -A
git -c user.name="kenankuzucu" -c user.email="63556102+kenankuzucu@users.noreply.github.com" \
    commit -q -m "ÜSTAD Sınav Koçu · KPSS-B · $NOT" || echo "(yeni değişiklik yok)"
git remote get-url origin >/dev/null 2>&1 || git remote add origin https://github.com/kenankuzucu/ustad-motor.git
git -c 'credential.helper=!f() { echo username=kenankuzucu; echo password=$GITHUB_TOKEN; }; f' push -u origin main
echo "YEDEK TAMAM → https://github.com/kenankuzucu/ustad-motor"
