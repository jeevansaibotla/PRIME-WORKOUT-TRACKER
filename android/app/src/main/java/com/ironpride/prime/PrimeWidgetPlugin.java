package com.ironpride.prime;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PrimeWidget")
public class PrimeWidgetPlugin extends Plugin {
    static final String PREFS = "prime_widget_state";
    static final String KEY_DAY = "dayLabel";
    static final String KEY_NAME = "profileName";
    static final String KEY_SPLIT = "splitName";
    static final String KEY_FOCUS = "focus";
    static final String KEY_REST = "isRest";
    static final String KEY_COUNT = "exerciseCount";
    static final String KEY_STATUS = "status";

    @PluginMethod
    public void syncWidgetState(PluginCall call) {
        JSObject data = call.getData();
        Context context = getContext();
        SharedPreferences.Editor editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        editor.putString(KEY_DAY, data.getString(KEY_DAY, "TODAY"));
        editor.putString(KEY_NAME, data.getString(KEY_NAME, "Athlete"));
        editor.putString(KEY_SPLIT, data.getString(KEY_SPLIT, "PRIME"));
        editor.putString(KEY_FOCUS, data.getString(KEY_FOCUS, "Train with intent"));
        editor.putBoolean(KEY_REST, data.getBoolean(KEY_REST, false));
        editor.putInt(KEY_COUNT, data.getInteger(KEY_COUNT, 0));
        editor.putString(KEY_STATUS, data.getString(KEY_STATUS, "OFFLINE READY"));
        editor.apply();

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, PrimeWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(provider);
        if (ids.length > 0) {
            new PrimeWidgetProvider().onUpdate(context, manager, ids);
        }
        call.resolve();
    }
}
