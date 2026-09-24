/* © 2026 Kenan Kuzucu · ÜSTAD KOÇ PRO · Sınav Koçu (KPSS-B paketi) · TÜM HAKLARI SAKLIDIR.
   5846 sayılı FSEK kapsamında korunur. İzinsiz çoğaltma, kopyalama, satış, dağıtım,
   değiştirme ve tersine mühendislik yasaktır. Telif ihlali hakkında: icerik/../Hakkimda.
   Bu dosya ÜSTAD MOTOR için özgün üretilmiştir; ÖSYM soruları kullanılmamıştır. */
/* ═══════════════════════════════════════════════════════════════════
   ÜSTAD MOTOR · SINAV PAKETİ: ÜSTAD KPSS-B  (Lisans · Genel Yetenek + Genel Kültür)
   Bu dosya "paket"tir: motor değişmez, yalnız bu dosya sınava göre değişir.
   Aynı dosyanın kopyası ÜSTAD KPSS-A / Ön Lisans / Ortaöğretim / AGS / TYT ... paketleri olur.
   Soru metinleri ÖZGÜN yazılmıştır (ÖSYM soruları telif korumalıdır, kopyalanmaz).
   ═══════════════════════════════════════════════════════════════════ */
window.USTAD_PAKET = {
  sinav: {
    kod: "KPSS-B",
    ad: "KPSS Lisans (B)",
    tam: "Genel Yetenek – Genel Kültür",
    soruSayisi: 120,
    dakika: 130,
    bolumler: [
      { ad: "Genel Yetenek", dersler: ["Türkçe", "Matematik"], soru: 60 },
      { ad: "Genel Kültür", dersler: ["Tarih", "Coğrafya", "Vatandaşlık", "Güncel Bilgiler"], soru: 60 }
    ]
  },

  /* ---- Dersler ve sınavdaki soru sayıları ---- */
  dersler: [
    {
      ad: "Türkçe", soru: 30, simg: "📖", bolum: "Genel Yetenek",
      konular: ["Sözcükte Anlam", "Cümlede Anlam", "Paragraf", "Ses Bilgisi", "Yazım Kuralları",
                "Noktalama İşaretleri", "Sözcük Türleri", "Sözcük Yapısı", "Cümlenin Ögeleri",
                "Cümle Türleri", "Anlatım Bozuklukları", "Sözel Mantık"]
    },
    {
      ad: "Matematik", soru: 30, simg: "🔢", bolum: "Genel Yetenek",
      konular: ["Temel Kavramlar", "Sayılar", "Bölme ve Bölünebilme", "EBOB-EKOK", "Rasyonel Sayılar",
                "Ondalık Sayılar", "Basit Eşitsizlikler", "Mutlak Değer", "Üslü ve Köklü Sayılar",
                "Çarpanlara Ayırma", "Oran-Orantı", "Denklemler", "Problemler", "Kümeler",
                "Fonksiyonlar", "Permütasyon-Kombinasyon", "Olasılık", "Tablo ve Grafik",
                "Geometri", "Sayısal Mantık"]
    },
    {
      ad: "Tarih", soru: 27, simg: "🏛️", bolum: "Genel Kültür",
      konular: ["İslamiyet Öncesi Türk Tarihi", "İlk Türk-İslam Devletleri", "Türkiye Selçuklu Devleti",
                "Osmanlı Kuruluş ve Yükseliş", "Osmanlı Duraklama ve Gerileme", "Osmanlı Dağılma Dönemi",
                "Kurtuluş Savaşı", "Atatürk İlke ve İnkılapları", "Atatürk Dönemi Dış Politika",
                "Çağdaş Türk ve Dünya Tarihi"]
    },
    {
      ad: "Coğrafya", soru: 18, simg: "🗺️", bolum: "Genel Kültür",
      konular: ["Türkiye'nin Coğrafi Konumu", "Yer Şekilleri", "İklim ve Bitki Örtüsü", "Nüfus ve Yerleşme",
                "Türkiye Ekonomisi: Tarım", "Hayvancılık ve Ormancılık", "Madencilik ve Enerji",
                "Sanayi", "Ulaşım-Ticaret-Turizm", "Bölgeler ve Doğal Afetler"]
    },
    {
      ad: "Vatandaşlık", soru: 9, simg: "⚖️", bolum: "Genel Kültür",
      konular: ["Temel Hukuk Kavramları", "Anayasal Gelişmeler", "1982 Anayasası Temel İlkeleri",
                "Temel Hak ve Ödevler", "Yasama", "Yürütme", "Yargı", "İdare Hukuku"]
    },
    {
      ad: "Güncel Bilgiler", soru: 6, simg: "📰", bolum: "Genel Kültür",
      konular: ["Türkiye Gündemi", "Dünya Gündemi", "Uluslararası Kuruluşlar ve Zirveler",
                "Ödüller ve Başarılar", "Spor ve Kültür-Sanat Gündemi"]
    }
  ],

  /* ---- ÖRNEK SORULAR (özgün; motor testleri bunlarla gösterir) ---- */
  ornekSorular: [
    {
      ders: "Türkçe", konu: "Paragraf", zorluk: "Orta", tip: "Konu Testi",
      metin: "Bir yazının anlaşılır olması, uzunluğuna değil düşüncelerin düzenli sıralanmasına bağlıdır. " +
             "Okur, söyleneni ancak cümleler arasında mantık bağı kurabildiğinde kavrar.",
      soru: "Bu parçada anlatılmak istenen nedir?",
      secenekler: [
        "Yazıda uzunluk, anlaşılırlığın ölçüsüdür.",
        "Anlaşılırlık, düşüncelerin tutarlı sıralanmasıyla sağlanır.",
        "Okuyucu, uzun metinleri daha kolay anlar.",
        "Cümle sayısı arttıkça anlam derinleşir."
      ],
      dogru: 1,
      aciklama: "Parça, uzunluk yerine düşünce düzeni ve mantık bağının altını çiziyor."
    },
    {
      ders: "Matematik", konu: "Problemler", zorluk: "Orta", tip: "Konu Testi",
      metin: "Bir kitabevinde kalemler 6'şar, defterler 8'erli paketler hâlinde satılıyor. " +
             "Rafta 84 kalem ve 96 defter olduğu bilinmektedir.",
      soru: "Kalem ve defter paketlerinin toplam sayısı kaçtır?",
      secenekler: ["24", "26", "28", "30"],
      dogru: 1,
      aciklama: "84 ÷ 6 = 14 kalem paketi, 96 ÷ 8 = 12 defter paketi; toplam 26 paket."
    },
    {
      ders: "Tarih", konu: "Kurtuluş Savaşı", zorluk: "Kolay", tip: "Konu Testi",
      metin: "Bu kongrede alınan kararla, işgal altındaki bölgelerde millî direniş cemiyetlerinin " +
             "tek çatı altında birleştirilmesi benimsenmiştir.",
      soru: "Metinde sözü edilen kongre aşağıdakilerden hangisidir?",
      secenekler: ["Amasya Genelgesi", "Erzurum Kongresi", "Sivas Kongresi", "Lozan Antlaşması"],
      dogru: 2,
      aciklama: "Millî cemiyetlerin tek çatıda birleştirilmesi Sivas Kongresi kararıdır."
    },
    {
      ders: "Coğrafya", konu: "Türkiye'nin Coğrafi Konumu", zorluk: "Kolay", tip: "Konu Testi",
      metin: "Türkiye, kuzey yarım kürede orta kuşakta yer alır.",
      soru: "Bu durumun sonucu aşağıdakilerden hangisidir?",
      secenekler: [
        "Kuzeyinde karasal iklim görülmez.",
        "Dört mevsimin belirgin yaşanması",
        "Yıl boyunca gece ile gündüz eşit olur.",
        "Ülkenin tamamı tropikal kuşakta kalır."
      ],
      dogru: 1,
      aciklama: "Orta kuşakta bulunma, mevsimlerin belirgin olmasını sağlar."
    },
    {
      ders: "Vatandaşlık", konu: "1982 Anayasası Temel İlkeleri", zorluk: "Kolay", tip: "Konu Testi",
      metin: "Anayasa'nın 2. maddesinde nitelikleri sayılan cumhuriyet yönetimi vardır.",
      soru: "1982 Anayasası'na göre Türkiye Devleti'nin yönetim biçimi nedir?",
      secenekler: ["Monarşi", "Cumhuriyet", "Federal devlet", "Konfederasyon"],
      dogru: 1,
      aciklama: "Anayasa'nın 1. maddesi: Türkiye Devleti bir Cumhuriyettir."
    },
    {
      ders: "Güncel Bilgiler", konu: "Uluslararası Kuruluşlar ve Zirveler", zorluk: "Orta", tip: "Konu Testi",
      metin: "Sınav soruları güncel gelişmelerden hazırlanır.",
      soru: "Bu satır bilgi amaçlı örnek kayıttır; güncel sorular yayın öncesi kaynaktan doğrulanır.",
      secenekler: ["Doğru", "Yanlış", "Boş", "İptal"],
      dogru: 0,
      aciklama: "Örnek kayıt: güncel bilgiler modülü gerçek kaynak bağlandığında sorular buradan akar."
    }
  ],

  /* ---- DUYURULAR: örnek besleme. Yayında haber servisi (RSS→JSON) buraya yazar. ---- */
  duyurular: [
    { baslik: "Örnek duyuru: sınav takvimi haberleri haber servisi bağlanınca burada akar.", kaynak: "ÖRNEK BESLEME", url: "" },
    { baslik: "Örnek duyuru: güncel bilgiler bülteni haftalık eklenir.", kaynak: "ÖRNEK BESLEME", url: "" },
    { baslik: "Örnek duyuru: branş bazlı soru dağılımı değişiklikleri buraya düşer.", kaynak: "ÖRNEK BESLEME", url: "" }
  ],

  /* ---- DENEME SINAVI TAKVİMİ (her hafta 1) ---- */
  denemeler: [
    { no: 1, ad: "Deneme 1 · Genel Yetenek-Genel Kültür", soru: 120, dakika: 130, durum: "açık" },
    { no: 2, ad: "Deneme 2 · Genel Yetenek-Genel Kültür", soru: 120, dakika: 130, durum: "kilitli" },
    { no: 3, ad: "Deneme 3 · Genel Yetenek-Genel Kültür", soru: 120, dakika: 130, durum: "kilitli" }
  ],

  /* ---- DERS NOTLARI (özet; tam notlar yayın paketinde) ---- */
  notlar: [
    { ders: "Türkçe", baslik: "Paragrafta Anlam", ozet: "Konu, ana düşünce, yardımcı düşünce, anlatım biçimleri ve paragrafın yapısı.", konu: 12 },
    { ders: "Matematik", baslik: "Bölme ve Bölünebilme", ozet: "Bölünebilme kuralları, kalan bulma, kalanlı bölme özellikleri.", konu: 4 },
    { ders: "Tarih", baslik: "Kurtuluş Savaşı", ozet: "Kongreler, cepheler, antlaşmalar ve siyasi gelişmelerin kronolojisi.", konu: 7 },
    { ders: "Coğrafya", baslik: "Türkiye'nin İklimi", ozet: "İklim elemanları, sıcaklık ve yağış dağılışı, iklim tipleri.", konu: 3 },
    { ders: "Vatandaşlık", baslik: "Temel Hak ve Ödevler", ozet: "Hakların sınıflandırılması, sınırlama rejimi, temel ödevler.", konu: 4 },
    { ders: "Güncel Bilgiler", baslik: "Haftalık Güncel Bülten", ozet: "Haftanın siyasi, ekonomik ve kültürel gelişmelerinin özeti.", konu: 1 }
  ]
};
