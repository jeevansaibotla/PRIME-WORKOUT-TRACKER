package com.ironpride.prime;

import android.os.Bundle;
import android.util.Log;
import android.view.Window;
import android.view.WindowInsetsController;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        long launchStartedAt = android.os.SystemClock.elapsedRealtime();
        splashScreen.setKeepOnScreenCondition(() -> {
            // Release on actual WebView readiness, never after an artificial minimum duration.
            if (android.os.SystemClock.elapsedRealtime() - launchStartedAt > 12_000) return false;
            return getBridge() == null
                || getBridge().getWebView() == null
                || getBridge().getWebView().getProgress() < 100;
        });
        try {
            registerPlugin(PrimeWidgetPlugin.class);
        } catch (RuntimeException error) {
            Log.e("PRIME", "Widget plugin registration failed; continuing app startup.", error);
        }
        super.onCreate(savedInstanceState);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
        Window window = getWindow();
        window.setStatusBarColor(getColor(com.ironpride.prime.R.color.prime_ivory));
        window.setNavigationBarColor(getColor(com.ironpride.prime.R.color.prime_ivory));
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                );
            }
        }
    }
}
