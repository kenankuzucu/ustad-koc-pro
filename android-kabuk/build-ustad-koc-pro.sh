#!/usr/bin/env bash
# ÜSTAD KOÇ PRO · build-ustad-koc-pro.sh
# ÜSTAD KOÇ PRO web motorunu Android APK'ya çevirir (Gradle'sız: aapt2 + d8 + apksigner).
# Kullanım: bash build-ustad-motor.sh [cikti-adi.apk]
set -e
P="/c/Users/kenan/AndroidBuild/ustad-koc-pro-app"
KAYNAK="/c/Users/kenan/OneDrive/Desktop/USTAD-MOTOR-2"
BT="/c/Users/kenan/AndroidBuild/tools/bt30/android-11"
JDK="/c/Users/kenan/AndroidBuild/tools/jdk8/jdk8u504-b01"
AJAR_W="C:/Users/kenan/AndroidBuild/tools/platform30/android-11/android.jar"
D8_W="C:/Users/kenan/AndroidBuild/tools/bt30/android-11/lib/d8.jar"
APS_W="C:/Users/kenan/AndroidBuild/tools/bt30/android-11/lib/apksigner.jar"
JAVA="$JDK/bin/java.exe"
KS="C:/Users/kenan/OneDrive/Desktop/SIBER-APK-ANAHTAR-SAKLA/siber.jks"
KS_P="$(grep -o 'ks-pass pass:[^ ]*' /c/Users/kenan/AndroidBuild/build-ehliyet.sh | head -1 | cut -d: -f2)"
CIKTI="${1:-ustad-koc-pro-v2.0.apk}"

echo "=== 0) web motorunu assets'e kopyala ==="
rm -rf "$P/assets"
mkdir -p "$P/assets/assets" "$P/assets/icerik" "$P/assets/tasarim"
cp "$KAYNAK/index.html" "$P/assets/"
cp "$KAYNAK"/assets/*.css "$KAYNAK"/assets/*.js "$P/assets/assets/"
cp "$KAYNAK"/icerik/*.js "$P/assets/icerik/"
cp "$KAYNAK"/tasarim/*.png "$P/assets/tasarim/"
echo "assets boyutu: $(du -sh "$P/assets" | cut -f1)"
ls -1 "$P/assets" "$P/assets/assets" "$P/assets/icerik" "$P/assets/tasarim"

cd "$P"
rm -rf build 2>/dev/null || true
mkdir -p build/gen build/classes build/dex

echo "=== 0b) ikonlar ==="
python arac-simge.py

echo "=== 1) aapt2 compile ==="
"$BT/aapt2.exe" compile --dir res -o build/res.zip

echo "=== 2) aapt2 link ==="
"$BT/aapt2.exe" link -o build/base.apk -I "$AJAR_W" --manifest AndroidManifest.xml \
  -A "C:/Users/kenan/AndroidBuild/ustad-koc-pro-app/assets" \
  -R build/res.zip --java build/gen --min-sdk-version 21 --target-sdk-version 36 --auto-add-overlay

echo "=== 3) javac ==="
"$JDK/bin/javac.exe" -encoding UTF-8 -source 1.8 -target 1.8 -bootclasspath "$AJAR_W" -cp "$AJAR_W" \
  -d build/classes $(find src build/gen -name "*.java")
echo "sınıf: $(find build/classes -name '*.class' | wc -l)"

echo "=== 4) d8 ==="
"$JAVA" -cp "$D8_W" com.android.tools.r8.D8 --lib "$AJAR_W" --min-api 21 --release \
  --output build/dex $(find build/classes -name "*.class" | tr '\n' ' ')

echo "=== 5) dex'i apk içine koy ==="
python - <<'PY'
import zipfile, shutil, os
src = "build/base.apk"; dst = "build/dexli.apk"
zin = zipfile.ZipFile(src, 'r'); zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
for it in zin.infolist():
    zout.writestr(it, zin.read(it.filename))
zout.write("build/dex/classes.dex", "classes.dex"); zout.close(); zin.close()
shutil.move(dst, src)
print("classes.dex eklendi, boyut:", os.path.getsize(src))
PY

echo "=== 6) zipalign + imza ==="
"$BT/zipalign.exe" -f -p 4 build/base.apk build/hizali.apk
"$JAVA" -jar "$APS_W" sign --ks "$KS" --ks-pass "pass:$KS_P" --key-pass "pass:$KS_P" \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  --out "build/$CIKTI" build/hizali.apk

echo "=== 7) doğrulama ==="
"$JAVA" -jar "$APS_W" verify --print-certs "build/$CIKTI" | head -4
"$BT/zipalign.exe" -c -p 4 "build/$CIKTI" && echo "hizalama: TAMAM"
"$BT/aapt2.exe" dump badging "build/$CIKTI" | head -6
python - <<PY
import zipfile, os, hashlib
yol = "build/$CIKTI"
z = zipfile.ZipFile(yol)
ad = [n for n in z.namelist() if n.startswith("assets/")]
veri = open(yol, "rb").read()
print("APK boyutu :", os.path.getsize(yol), "bayt")
print("sha256     :", hashlib.sha256(veri).hexdigest()[:16])
print("assets     :", len(ad), "dosya | classes.dex:", "classes.dex" in z.namelist())
for n in sorted(ad):
    print("   ", n, z.getinfo(n).file_size)
PY
echo "CIKTI: $P/build/$CIKTI"
