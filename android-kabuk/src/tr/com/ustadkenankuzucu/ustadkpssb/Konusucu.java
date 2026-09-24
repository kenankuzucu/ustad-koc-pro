package tr.com.ustadkenankuzucu.ustadkpssb;

import android.content.Context;
import android.speech.tts.TextToSpeech;
import android.util.Log;

import java.util.Locale;

/** Sesli karşılama ve sesli okuma. Motor bir kez kurulur, sonra aynı örnek kullanılır.
 *  Motor henüz hazır değilken gelen metin "bekleyen" alanına alınır ve hazır olunca okunur
 *  (ilk karşılama anonsu kaybolmaz).
 *
 *  CİNSİYETE GÖRE SES: JS tarafı konusTon(metin, perde, hız) çağırır.
 *  Perde (pitch) 1.0'ın üstündeyse kadın sesi, altındaysa erkek sesi kabul edilir; cihazda
 *  cinsiyet etiketli Türkçe ses varsa (ör. "tr-tr-x-...-female") o seçilir, yoksa perde farkı
 *  ile ince/kalın ton uygulanır. Böylece kız öğrenci maskotu kadın, erkek öğrenci maskotu erkek sesiyle konuşur. */
public class Konusucu {

    private static final String ETIKET = "USTAD-KPSSB";
    private static TextToSpeech tts = null;
    private static boolean hazir = false;
    private static boolean kuruluyor = false;
    private static String bekleyen = null;
    private static float sonPerde = 1.0f;
    private static float sonHiz = 0.97f;

    public static synchronized void konus(final Context c, String metin) {
        konus(c, metin, 1.0f, 0.97f);
    }

    public static synchronized void konus(final Context c, String metin, final float perde, final float hiz) {
        if (metin == null || metin.trim().length() == 0) return;
        final String m = metin.trim();
        sonPerde = perde;
        sonHiz = hiz;
        if (tts == null && !kuruluyor) {
            kuruluyor = true;
            try {
                tts = new TextToSpeech(c.getApplicationContext(), new TextToSpeech.OnInitListener() {
                    public void onInit(int durum) {
                        hazir = (durum == TextToSpeech.SUCCESS);
                        kuruluyor = false;
                        if (hazir) {
                            try {
                                int r = tts.setLanguage(new Locale("tr", "TR"));
                                if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                                    Log.e(ETIKET, "konusucu: Turkce ses paketi yok, varsayilan kullanilir");
                                }
                                ayarlariUygula();
                            } catch (Throwable t) { }
                        } else {
                            Log.e(ETIKET, "konusucu kurulamadi");
                        }
                        if (hazir && bekleyen != null) { ayarlariUygula(); soyle(bekleyen); bekleyen = null; }
                    }
                });
            } catch (Throwable t) {
                kuruluyor = false;
                Log.e(ETIKET, "konusucu olusturulamadi: " + t.getMessage());
            }
        }
        if (hazir) { ayarlariUygula(); soyle(m); }
        else bekleyen = m;
    }

    /** Perde/hız + cinsiyete uygun sesi uygular (her konuşmadan önce çağrılır). */
    private static void ayarlariUygula() {
        if (tts == null) return;
        try {
            boolean kadin = sonPerde > 1.05f;
            if (android.os.Build.VERSION.SDK_INT >= 21) {
                java.util.Set<android.speech.tts.Voice> sesler = tts.getVoices();
                if (sesler != null) {
                    android.speech.tts.Voice secilen = null;
                    for (android.speech.tts.Voice v : sesler) {
                        if (v == null) continue;
                        Locale l = v.getLocale();
                        if (l == null || !"tr".equalsIgnoreCase(l.getLanguage())) continue;
                        String ad = (v.getName() == null ? "" : v.getName()).toLowerCase(Locale.ROOT);
                        boolean kadinSes = ad.indexOf("female") >= 0 || ad.indexOf("kadin") >= 0 || ad.indexOf("filiz") >= 0 || ad.indexOf("aylin") >= 0;
                        boolean erkekSes = ad.indexOf("male") >= 0 || ad.indexOf("erkek") >= 0 || ad.indexOf("tolga") >= 0;
                        if ((kadin && kadinSes) || (!kadin && erkekSes)) { secilen = v; break; }
                    }
                    if (secilen != null) tts.setVoice(secilen);
                }
            }
            tts.setSpeechRate(sonHiz);
            tts.setPitch(sonPerde);
        } catch (Throwable t) {
            Log.e(ETIKET, "ayarlariUygula: " + t.getMessage());
        }
    }

    private static void soyle(String metin) {
        try {
            tts.speak(metin, TextToSpeech.QUEUE_ADD, null, "ustad-kpssb");
            Log.e(ETIKET, "sesli okundu (" + sonPerde + "): " + metin);
        } catch (Throwable t) {
            Log.e(ETIKET, "soyle: " + t.getMessage());
        }
    }

    public static void sus() {
        try { if (tts != null) tts.stop(); } catch (Throwable t) { }
        bekleyen = null;
    }

    public static boolean varMi(Context c) {
        try { return hazir || tts != null; } catch (Throwable t) { return false; }
    }
}
