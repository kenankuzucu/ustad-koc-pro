/* ÜSTAD KPSS ARAÇLAR · 2026 sınav takvimi (gerçek veri, kaynaklı)
   Kaynaklar: ÖSYM 2026-KPSS başvuru kılavuzları (dokuman.osym.gov.tr) ve ÖSYM 2026 sınav takvimi.
   Uyarı: ÖSYM takvim değişikliği yapabilir; kesin bilgi için osym.gov.tr. */
window.KPSS_TAKVIM = {
  derleme: "24 Eylül 2026",
  kaynaklar: [
    "ÖSYM 2026-KPSS Lisans Başvuru Kılavuzu (dokuman.osym.gov.tr)",
    "ÖSYM 2026-KPSS Ön Lisans Başvuru Kılavuzu (dokuman.osym.gov.tr)",
    "ÖSYM 2026 yılı sınav takvimi (osym.gov.tr)"
  ],
  sinavlar: [
    { kod:"lisans-gygk", ad:"2026-KPSS Lisans · Genel Yetenek-Genel Kültür", tarih:"2026-09-06T10:15:00+03:00",
      saat:"10.15", sure:"130 dakika", soru:120, durum:"yapıldı",
      basvuru:"1-13 Temmuz 2026", ucret:"800 TL",
      not:"Lisans düzeyinde Genel Yetenek-Genel Kültür oturumuna girmek zorunludur." },
    { kod:"lisans-alan1", ad:"2026-KPSS Lisans · Alan Bilgisi (1. gün)", tarih:"2026-09-12T10:15:00+03:00",
      saat:"10.15", durum:"yapıldı", basvuru:"1-13 Temmuz 2026", ucret:"Oturum başına 500 TL" },
    { kod:"lisans-alan2", ad:"2026-KPSS Lisans · Alan Bilgisi (2. gün)", tarih:"2026-09-13T10:15:00+03:00",
      saat:"10.15", durum:"yapıldı", basvuru:"1-13 Temmuz 2026", ucret:"Oturum başına 500 TL" },
    { kod:"onlisans", ad:"2026-KPSS Ön Lisans · Genel Yetenek-Genel Kültür", tarih:"2026-10-04T10:15:00+03:00",
      saat:"10.15", sure:"130 dakika", soru:120, durum:"yaklaşıyor",
      basvuru:"29 Temmuz-10 Ağustos 2026", ucret:"800 TL",
      not:"B grubu kadrolara atanmak isteyen ön lisans mezunları için geçerlilik 2026 sınavıyla yenilenir." },
    { kod:"ortaogretim", ad:"2026-KPSS Ortaöğretim · Genel Yetenek-Genel Kültür", tarih:"2026-10-25T10:15:00+03:00",
      saat:"10.15", sure:"130 dakika", soru:120, durum:"yaklaşıyor",
      basvuru:"27 Ağustos-8 Eylül 2026", ucret:"800 TL" },
    { kod:"dhbt", ad:"2026-DHBT · Din Hizmetleri Alan Bilgisi Testi", tarih:"2026-11-01T10:15:00+03:00",
      saat:"10.15", sure:"60 dakika", durum:"yaklaşıyor",
      basvuru:"22-30 Eylül 2026", ucret:"DHBT ücreti (ÖSYM kılavuzu)",
      not:"DHBT'ye KPSS'ye girilen öğrenim düzeyinde katılmak zorunludur." }
  ],
  sonuclar: [
    { ad:"2026-KPSS Lisans sonuçları", tarih:"2026-10-07T00:00:00+03:00" },
    { ad:"2026-KPSS Ön Lisans sonuçları", tarih:"2026-10-30T00:00:00+03:00" },
    { ad:"2026-KPSS Ortaöğretim sonuçları", tarih:"2026-11-19T00:00:00+03:00" }
  ],
  /* KPSS-B (Lisans GY-GK) test yapısı — geçmiş yıllarda değişmeyen yapı */
  yapi: {
    oturum: "Genel Yetenek (GY) + Genel Kültür (GK) = 120 soru / 130 dakika",
    testler: [
      { ad:"Türkçe",              ders:"Genel Yetenek", soru:30 },
      { ad:"Matematik",           ders:"Genel Yetenek", soru:30 },
      { ad:"Tarih",               ders:"Genel Kültür", soru:27 },
      { ad:"Coğrafya",            ders:"Genel Kültür", soru:18 },
      { ad:"Vatandaşlık ve Güncel Bilgiler", ders:"Genel Kültür", soru:15 }
    ],
    kural: "KPSS Genel Yetenek-Genel Kültür'de yanlış cevap doğru cevabı götürmez; net = doğru sayısı."
  }
};
