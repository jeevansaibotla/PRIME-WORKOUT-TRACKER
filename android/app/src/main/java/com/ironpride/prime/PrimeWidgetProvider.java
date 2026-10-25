package com.ironpride.prime;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.text.TextUtils;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class PrimeWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(PrimeWidgetPlugin.PREFS, Context.MODE_PRIVATE);
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId, prefs);
        }
    }

    @Override
    public void onEnabled(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, PrimeWidgetProvider.class);
        onUpdate(context, manager, manager.getAppWidgetIds(provider));
    }

    static void updateWidget(Context context, AppWidgetManager manager, int widgetId, SharedPreferences prefs) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_prime);
        boolean isRest = prefs.getBoolean(PrimeWidgetPlugin.KEY_REST, false);
        String day = prefs.getString(PrimeWidgetPlugin.KEY_DAY, "Today");
        String name = prefs.getString(PrimeWidgetPlugin.KEY_NAME, "Athlete");
        String split = prefs.getString(PrimeWidgetPlugin.KEY_SPLIT, isRest ? "Rest Day" : "PRIME");
        String focus = prefs.getString(PrimeWidgetPlugin.KEY_FOCUS, isRest ? "Recovery" : "Train with intent");
        int count = prefs.getInt(PrimeWidgetPlugin.KEY_COUNT, 0);
        String status = prefs.getString(PrimeWidgetPlugin.KEY_STATUS, isRest ? "RECOVERY MODE" : "OFFLINE CORE");

        Calendar now = Calendar.getInstance();
        int hour = now.get(Calendar.HOUR_OF_DAY);
        String greeting = hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
        String weekday = new SimpleDateFormat("EEEE", Locale.US).format(now).toUpperCase(Locale.US);
        String greetingLine = greeting + " · " + weekday;

        views.setTextViewText(R.id.widget_greeting, greetingLine);
        views.setTextViewText(R.id.widget_name, TextUtils.isEmpty(name) ? "ATHLETE" : name.toUpperCase(Locale.US));
        views.setTextViewText(R.id.widget_split, split);
        views.setTextViewText(R.id.widget_focus, focus);
        views.setTextViewText(R.id.widget_status, status);
        views.setTextViewText(R.id.widget_count, isRest ? "↗" : "↗");

        Intent launch = new Intent(context, MainActivity.class);
        launch.setAction(Intent.ACTION_VIEW);
        launch.setData(Uri.parse("prime://today"));
        PendingIntent pending = PendingIntent.getActivity(
                context,
                1001,
                launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pending);
        manager.updateAppWidget(widgetId, views);
    }
}
