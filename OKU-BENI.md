# ÜSTAD SINAV KOÇU · KPSS-B paketi

**Eser:** ÜSTAD Sınav Koçu — KPSS-B (Genel Yetenek + Genel Kültür)
**Eser sahibi:** Kenan Kuzucu — ÜSTAD SALON KENAN, Selimiye Mah., Şehitkamil / Gaziantep
**Telif:** © 2026 Kenan Kuzucu · **TÜM HAKLARI SAKLIDIR.** 5846 sayılı FSEK kapsamında korunur.
İzinsiz çoğaltma, kopyalama, satış, dağıtım, değiştirme ve tersine mühendislik yasaktır.

> Ayrıntılı beyan: [`TELIF-VE-HAKLAR.md`](TELIF-VE-HAKLAR.md) · Uygulama içinde: Menü → **©️ Hakkında & Telif**

## İçerik
| Klasör | Ne var |
|---|---|
| `index.html` + `assets/` | ÜSTAD MOTOR çekirdeği; `assets/koc.js` + `assets/koc.css` = KOÇ PRO eklenti modülü (15 özellik) (menü, testler, deneme, notlar, istatistik, ayarlar, tebrik, hakkında) |
| `icerik/` | 120 özgün soru, 20 ders notu, sınav paketi verisi, canlı haber beslemesi |
| `tasarim/` | Logo ve simge dosyaları |
| `araclar/` | Soru derleyici, haber çekici, logo işleyici, belge üretici (Python) |
| `ekran-goruntuleri/` | Geliştirme kanıt görüntüleri (her sürümün testi) |
| `android-kabuk/` | APK kabuğu kaynakları: `MainActivity.java`, `Konusucu.java`, `AndroidManifest.xml`, `res/`, `build-ustad-motor.sh`, `cdp-test.py` |
| `apk/` | Derlenmiş ve imzalanmış APK |

## Sürüm
| Sürüm | Yenilik |
|---|---|
| 1.0 – 1.2 | Motor iskeleti, 120 soru, ders notları, canlı haber, deneme motoru, ilk APK'lar |
| 1.3 | Maskotlu tebrik/teselli animasyonu (kız/erkek maskot) |
| 1.4 | Anında geri bildirim **bandı** (soru kutusunun üstünde yapışkan; doğru yeşil / yanlış kırmızı) |
| 1.5 | Doğru–yanlış–boş soru panelleri (testlerde), kendi fotoğrafınla madalyon, galeriden fotoğraf seçme |
| 1.6 | Ana sayfa panel madalyonu + yeni özellik kartları, panel tazeleme hatası düzeltmesi |
| 1.7 | Cinsiyete göre sesli karşılama (kız → kadın tonu, erkek → erkek tonu) |
| 1.8 | Yanlış Cevaplananlar düğmesi + üç soru panelinin denemede de çalışması (simetri) |
| 1.9 | **Hakkında & Telif** bölümü, içerik imzası (bütünlük), üretim kimliği (filigran), kopyalama engeli |
| 2.0 | **KOÇ PRO** kimliği: yeni paket adı (ikisi yan yana kurulur), isim/marka değişikliği; içerik v1.9 ile aynı |
| 2.1 | **15 KOÇ PRO özelliği**: akıllı tekrar · konu haritası · yazılı (klasik) mod · soruyu dinle · kendi sorularım · geri sayım + seri · rozet/seviye · karne (PDF) · kaygı/nefes · yedekle-geri yükle · günün sorusu · usta modu · çoklu profil · yazı boyutu + gece modu · optik form |

Kurulu sürüm: **2.1** · paket adı: `tr.com.ustadkenankuzucu.ustadkpssb`

## Derleme (Gradle'sız: aapt2 + d8 + apksigner)
```bash
bash android-kabuk/build-ustad-motor.sh "ustad-kpssb-vX.Y.apk"
# çıktı: android-kabuk/build/ustad-kpssb-vX.Y.apk
```
Kabuğun `assets/` klasörüne bu deponun kök içeriği kopyalanır; sürüm `AndroidManifest.xml` (versionCode/versionName)
ve `index.html` içindeki `<meta name="surum">` birlikte artırılır.

## Koruma katmanları (özet)
- **İçerik imzası:** `icerik/sorular.js` içindeki `USTAD_BUTUNLUK` ↔ `assets/motor.js` → `butunlukKontrol()`.
  Soru bankası değiştirilirse Hakkında ekranı "⚠ İçerik değiştirilmiş" uyarısı verir.
- **Üretim kimliği (filigran):** her kuruluma özel `UKK-2026-XXXXXX-XXXX` kodu.
- **Kopyalama engeli:** metin seçimi/sağ tık/uzun basma kapalı.
- Her kaynak dosyanın başında telif başlığı; APK içinde `res/values/strings.xml` telif metni.

## KOÇ PRO sürüm geçmişi

| Sürüm | İçerik |
|-------|--------|
| 2.0 | v1.9'un isim/paket değişmiş kopyası (ÜSTAD KOÇ PRO) |
| 2.1 | 15 koçluk özelliği: akıllı tekrar, konu haritası, yazılı mod, soruyu dinle, kendi soru ekleme, geri sayım+seri, rozet/seviye, karne+sertifika, kaygı modülü, yedekle/geri yükle, günün sorusu, usta modu, çoklu profil, yazı boyutu+gece modu, optik form |
| 2.2 | 23 yeni özellik (koc2.js + koc3.js): uyarlamalı zorluk, deneme simülasyonu + puan tahmini, hata defteri, kronometre/hız analizi, konu trendi, şık dağılımı, son 7 gün programı, çalışma arkadaşı kodu, hatırlatma saati, soru paketi paylaşımı, ezber kartları, formül kartları, günlük görevler, maskot kıyafetleri, haftalık rapor, widget önizleme, karne görseli (PNG), tanıtım turu, tema seçici |

### Dosya mimarisi
- `assets/motor.js` · `assets/deneme.js` · `assets/stil.css` — v1.9 çekirdeği (değişmedi)
- `assets/koc.js` + `assets/koc.css` — KOÇ PRO çekirdeği (v2.1, 15 özellik)
- `assets/koc2.js` — sınav & analiz modülü (v2.2)
- `assets/koc3.js` — motivasyon & araçlar modülü (v2.2)
- Eklenti modüller çekirdeğe `KOC.cizKancalari` / `KOC.bitisKancalari` kancalarıyla bağlanır.

### Derleme
```
bash android-kabuk/build-ustad-koc-pro.sh "ustad-koc-pro-v2.2.apk"
cp build/ustad-koc-pro-v2.2.apk ~/Desktop/USTAD-KOC-PRO-v2.2.apk
```
