# ÜSTAD SINAV KOÇU — Telif, Lisans ve Kopya Koruması

**Eser:** ÜSTAD Sınav Koçu (v1.9) / **ÜSTAD KOÇ PRO** (v2.0+, ayrı paket: koc-pro) · KPSS-B paketi (Genel Yetenek + Genel Kültür)
**Eser sahibi:** Kenan Kuzucu — ÜSTAD SALON KENAN, Selimiye Mah., Şehitkamil / Gaziantep
**Telif:** © 2026 Kenan Kuzucu · Tüm hakları saklıdır.

## 1. Hukuki dayanak
Bu eser (yazılım kodu, ekran tasarımı, simge ve görseller, ders notları ve 120 özgün soru)
**5846 sayılı Fikir ve Sanat Eserleri Kanunu** kapsamında korunmaktadır.

İzinsiz olarak: çoğaltılamaz, kopyalanamaz, satılamaz, kiralanamaz, dağıtılamaz, yayımlanamaz,
değiştirilemez, tersine mühendisliğe tabi tutulamaz, türev eser üretilemez, kendi ürünüymüş gibi
sunulamaz. İhlâl hâlinde tazminat ve cezaî sorumluluk doğar (FSEK m.71 ve ilgili hükümler).

Soru bankası ÖSYM'nin çıkmış sorularından kopyalanmamıştır; 120 sorunun tamamı eser sahibi
tarafından sıfırdan yazılmış özgün içeriktir.

## 2. Uygulamaya gömülü koruma katmanları
| Katman | Ne yapar | Nerede |
|---|---|---|
| Telif ekranı | Künye + FSEK bildirimi + yasaklar + lisans | Menü → "©️ Hakkında & Telif" |
| İçerik imzası (bütünlük) | Soru bankası kurcalanırsa "⚠ İçerik değiştirilmiş" uyarısı verir | `sorular.js` → `USTAD_BUTUNLUK` ↔ `motor.js` → `butunlukKontrol()` |
| Üretim kimliği (filigran) | Her kuruluma özel `UKK-2026-XXXXXX-XXXX` kodu; izinsiz kopya bu kodla izlenir | `motor.js` → `uretimKimligi()` |
| Kopyalama engeli | Sağ tık, sürükleme ve metin seçimi kapalı | `motor.js` + `stil.css` (`user-select:none`) |
| Uzun basma engeli | Android'de "kopyala/paylaş" menüsü çıkmaz | `MainActivity.java` (`setLongClickable(false)`) |
| Kaynak dosya başlıkları | Her kaynak dosyanın başında telif beyanı | `index.html`, `assets/*.js`, `stil.css`, `icerik/*.js` |
| Konsol filigranı | Uygulama açılışında sahip + üretim kimliği yazılır | `motor.js` → `hakkinda()` |

## 3. Kullanım lisansı
Kişisel kullanım. Tek cihaz. Devredilemez, satılamaz. Kullanıcı verileri (çözülen sorular,
notlar, tercihler, fotoğraf) **yalnızca cihazda** saklanır; hiçbir sunucuya gönderilmez.

## 4. Dürüst sınır
Bu katmanlar kopyalamayı **caydırır ve tespit edilebilir kılar**; hiçbir yazılım teknik olarak
%100 kırılmaz değildir. Caydırıcılığı artırmanın sıradaki adımı (isteğe bağlı): lisans sunucusu
+ cihaz kilidi, ya da kullanıcıya özel gömülü kopya kimliğiyle satış.
