package com.ironpride.prime;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class PrimeWidgetProvider extends AppWidgetProvider {
    private static final int COMPACT_WIDTH_DP = 300;
    private static final int COMPACT_HEIGHT_DP = 150;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(PrimeWidgetPlugin.PREFS, Context.MODE_PRIVATE);
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, manager, appWidgetId, prefs, manager.getAppWidgetOptions(appWidgetId));
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(
            Context context,
            AppWidgetManager manager,
            int appWidgetId,
            Bundle newOptions
    ) {
        super.onAppWidgetOptionsChanged(context, manager, appWidgetId, newOptions);
        SharedPreferences prefs = context.getSharedPreferences(PrimeWidgetPlugin.PREFS, Context.MODE_PRIVATE);
        updateWidget(context, manager, appWidgetId, prefs, newOptions);
    }

    @Override
    public void onEnabled(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, PrimeWidgetProvider.class);
        onUpdate(context, manager, manager.getAppWidgetIds(provider));
    }

    static void updateWidget(
            Context context,
            AppWidgetManager manager,
            int widgetId,
            SharedPreferences prefs,
            Bundle options
    ) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_prime);
        boolean isRest = prefs.getBoolean(PrimeWidgetPlugin.KEY_REST, false);
        String name = prefs.getString(PrimeWidgetPlugin.KEY_NAME, "Jeevan");
        if (TextUtils.isEmpty(name) || "ATHLETE".equalsIgnoreCase(name.trim())) name = "Jeevan";
        String split = prefs.getString(PrimeWidgetPlugin.KEY_SPLIT, isRest ? "Rest Day" : "PRIME");
        String focus = prefs.getString(PrimeWidgetPlugin.KEY_FOCUS, "");
        String status = prefs.getString(PrimeWidgetPlugin.KEY_STATUS, "");

        Calendar now = Calendar.getInstance();
        int hour = now.get(Calendar.HOUR_OF_DAY);
        String greeting = hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
        String weekday = new SimpleDateFormat("EEEE", Locale.US).format(now).toUpperCase(Locale.US);

        views.setTextViewText(R.id.widget_greeting, greeting + " · " + weekday);
        views.setTextViewText(
                R.id.widget_status,
                isRest ? "RECOVERY MODE" : (TextUtils.isEmpty(status) ? "TRAINING READY" : status.toUpperCase(Locale.US))
        );
        views.setTextViewText(R.id.widget_name, TextUtils.isEmpty(name) ? "ATHLETE" : name.toUpperCase(Locale.US));
        views.setTextViewText(R.id.widget_tagline, isRest
                ? "Recover with intent."
                : "Train with intent. Let the work become visible.");
        views.setTextViewText(R.id.widget_action_label, isRest ? "TODAY'S VECTOR" : "TODAY'S WORKOUT");
        views.setTextViewText(R.id.widget_split, (isRest ? "REST DAY" : split).toUpperCase(Locale.US));
        String fallbackFocus = isRest ? "Sleep · Mobility · Walking" : "Train with intent";
        if (isRest && (TextUtils.isEmpty(focus) || "recovery".equalsIgnoreCase(focus))) {
            focus = fallbackFocus;
        } else if (TextUtils.isEmpty(focus)) {
            focus = fallbackFocus;
        }
        views.setTextViewText(R.id.widget_focus, focus);
        views.setTextViewText(R.id.widget_count, "↗");

        int minWidthDp = options == null ? 0 : options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        int minHeightDp = options == null ? 0 : options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0);
        boolean compactWidth = minWidthDp > 0 && minWidthDp < COMPACT_WIDTH_DP;
        boolean compactHeight = minHeightDp > 0 && minHeightDp < COMPACT_HEIGHT_DP;

        views.setViewVisibility(R.id.widget_status, compactWidth ? View.GONE : View.VISIBLE);
        views.setViewVisibility(R.id.widget_tagline, compactHeight ? View.GONE : View.VISIBLE);
        views.setViewVisibility(R.id.widget_focus, (compactWidth || compactHeight) ? View.GONE : View.VISIBLE);
        views.setViewVisibility(R.id.widget_action_label, compactHeight ? View.GONE : View.VISIBLE);
        views.setViewVisibility(R.id.widget_dumbbell, compactWidth ? View.GONE : View.VISIBLE);
        views.setViewVisibility(R.id.widget_count, compactWidth ? View.GONE : View.VISIBLE);
        views.setTextViewTextSize(
                R.id.widget_name,
                TypedValue.COMPLEX_UNIT_SP,
                (compactWidth || compactHeight) ? 24f : 31f
        );
        views.setTextViewTextSize(
                R.id.widget_split,
                TypedValue.COMPLEX_UNIT_SP,
                (compactWidth || compactHeight) ? 14f : 18f
        );

        Intent launch = new Intent(context, MainActivity.class);
        launch.setAction(Intent.ACTION_MAIN);
        launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pending = PendingIntent.getActivity(
                context,
                widgetId,
                launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pending);
        manager.updateAppWidget(widgetId, views);
    }
}
