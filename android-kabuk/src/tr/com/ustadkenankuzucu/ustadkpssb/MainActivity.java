package tr.com.ustadkenankuzucu.ustadkpssb;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Vibrator;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * ÜSTAD KPSS-B · Sınav Koçu — WebView kabuğu.
 *
 * Bütün ekran, soru bankası, ders notları ve deneme motoru cihazın içindeki
 * assets klasöründen çalışır; internet olmadan da uygulama açılır.
 * Yalnız "Haberi Kaynağında Aç" bağlantısı tarayıcıya gider.
 *
 * Paket: tr.com.ustadkenankuzucu.ustadkpssb  ·  Aynı motor farklı paketlerle
 * her sınav için ayrı APK olarak derlenir (ÜSTAD MOTOR mimarisi).
 */
public class MainActivity extends Activity {

    private WebView web;
    /** Fotoğraf seçici (kendi profil fotoğrafı) için bekleyen geri çağrı */
    private android.webkit.ValueCallback<Uri[]> dosyaGeriCagri;
    private static final int DOSYA_SEC = 1001;

    /** JS tarafına açılan köprü: window.USTAD.xxx */
    public class Kopru {

        @JavascriptInterface
        public String surum() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; }
            catch (Exception e) { return "1.0"; }
        }

        @JavascriptInterface
        public String cihaz() {
            return Build.MANUFACTURER + " " + Build.MODEL + " · Android " + Build.VERSION.RELEASE;
        }

        /** Sesli karşılama: cihazın Türkçe konuşma motoru kullanılır. */
        @JavascriptInterface
        public void konus(final String metin) {
            Konusucu.konus(MainActivity.this, metin);
        }

        /** Cinsiyete göre ses: perde (pitch) 1'den büyükse kadın, küçükse erkek tonu. */
        @JavascriptInterface
        public void konusTon(final String metin, final double perde, final double hiz) {
            Konusucu.konus(MainActivity.this, metin, (float) perde, (float) hiz);
        }

        @JavascriptInterface
        public void sus() { Konusucu.sus(); }

        @JavascriptInterface
        public boolean sesVarMi() { return Konusucu.varMi(MainActivity.this); }

        @JavascriptInterface
        public void titret(final int ms) {
            try {
                Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (v != null && v.hasVibrator()) v.vibrate(ms);
            } catch (Exception e) { }
        }

        @JavascriptInterface
        public void bildir(final String mesaj) {
            runOnUiThread(new Runnable() {
                public void run() { Toast.makeText(MainActivity.this, mesaj, Toast.LENGTH_SHORT).show(); }
            });
        }

        /** Haber gibi dış bağlantıları cihazın tarayıcısında açar. */
        @JavascriptInterface
        public void disBaglanti(final String adres) {
            runOnUiThread(new Runnable() {
                public void run() {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(adres))); }
                    catch (Exception e) { Toast.makeText(MainActivity.this, "Bağlantı açılamadı", Toast.LENGTH_SHORT).show(); }
                }
            });
        }
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= 21) {
            w.setStatusBarColor(0xFF0E9F8E);
            w.setNavigationBarColor(0xFF0A7F72);
        }
        web = new WebView(this);
        WebSettings a = web.getSettings();
        a.setJavaScriptEnabled(true);
        a.setDomStorageEnabled(true);
        a.setDatabaseEnabled(true);
        a.setAllowFileAccess(true);
        a.setAllowContentAccess(true);
        a.setAllowFileAccessFromFileURLs(true);
        a.setAllowUniversalAccessFromFileURLs(true);
        a.setUseWideViewPort(true);
        a.setLoadWithOverviewMode(false);
        a.setSupportZoom(false);
        a.setBuiltInZoomControls(false);
        a.setSupportMultipleWindows(false);
        a.setTextZoom(100);
        a.setCacheMode(WebSettings.LOAD_NO_CACHE);
        a.setMediaPlaybackRequiresUserGesture(false);
        if (Build.VERSION.SDK_INT >= 21) a.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        web.setBackgroundColor(0xFFEEF7F6);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(true);
        web.addJavascriptInterface(new Kopru(), "USTAD");
        /* Eser koruması: uzun basınca çıkan "kopyala/paylaş" menüsü kapatılır */
        web.setLongClickable(false);
        web.setOnLongClickListener(new View.OnLongClickListener() {
            @Override public boolean onLongClick(View v) { return true; }
        });
        web.setHapticFeedbackEnabled(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String adres) {
                if (adres != null && (adres.startsWith("http://") || adres.startsWith("https://"))) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(adres))); } catch (Exception e) { }
                    return true;
                }
                return false;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage m) { return true; }

            /**
             * HTML'deki <input type="file"> düğmesine basıldığında cihazın
             * galerisini / dosya yöneticisini açar. Bu köprü olmadan
             * WebView'de dosya seçici hiç açılmaz (Kenan'ın fotoğraf seçmesi için şart).
             */
            @Override
            public boolean onShowFileChooser(WebView v,
                                             android.webkit.ValueCallback<Uri[]> cb,
                                             FileChooserParams params) {
                if (dosyaGeriCagri != null) { dosyaGeriCagri.onReceiveValue(null); }
                dosyaGeriCagri = cb;
                try {
                    Intent niyet = params.createIntent();
                    niyet.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(Intent.createChooser(niyet, "Fotoğraf seç"), DOSYA_SEC);
                    return true;
                } catch (Exception e) {
                    dosyaGeriCagri = null;
                    Toast.makeText(MainActivity.this, "Galeri açılamadı", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    /**
     * Geri tuşu: önce açık pencere (test/deneme/not/haber) kapanır, sonra
     * ana sayfaya dönülür, en son uygulamadan çıkılır. Kararı JS verir.
     */
    @Override
    public void onBackPressed() {
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("window.geriBas ? window.geriBas() : 'cik'",
            new android.webkit.ValueCallback<String>() {
                public void onReceiveValue(String s) {
                    if (s == null || s.contains("cik")) { bitir(); }
                }
            });
    }

    /**
     * Seçilen fotoğrafı WebView'e geri verir (galeri / dosya yöneticisi sonucu).
     */
    @Override
    protected void onActivityResult(int istek, int sonuc, Intent veri) {
        if (istek == DOSYA_SEC) {
            if (dosyaGeriCagri != null) {
                Uri[] secilen = null;
                if (sonuc == RESULT_OK && veri != null) {
                    if (veri.getData() != null) {
                        secilen = new Uri[]{ veri.getData() };
                    } else if (veri.getClipData() != null && veri.getClipData().getItemCount() > 0) {
                        secilen = new Uri[]{ veri.getClipData().getItemAt(0).getUri() };
                    }
                }
                dosyaGeriCagri.onReceiveValue(secilen);
                dosyaGeriCagri = null;
            }
            return;
        }
        super.onActivityResult(istek, sonuc, veri);
    }

    private void bitir() {
        if (Build.VERSION.SDK_INT >= 21) finishAndRemoveTask(); else finish();
    }

    @Override
    protected void onDestroy() {
        Konusucu.sus();
        super.onDestroy();
    }
}
