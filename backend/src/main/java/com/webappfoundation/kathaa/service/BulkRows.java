package com.webappfoundation.kathaa.service;

import java.math.BigDecimal;
import java.util.Map;

/** Tiny helpers for reading SpreadsheetParser rows (keys are trimmed + lower-cased). */
final class BulkRows {
    private BulkRows() {}

    static String str(Map<String, String> row, String key) {
        String v = row.get(key);
        return v == null || v.isBlank() ? null : v.trim();
    }

    static Integer intVal(Map<String, String> row, String key, Integer dflt) {
        String v = str(row, key);
        return v == null ? dflt : Integer.valueOf(v);
    }

    static BigDecimal dec(Map<String, String> row, String key) {
        String v = str(row, key);
        return v == null ? null : new BigDecimal(v.replace(",", "").replace("₹", ""));
    }

    static boolean bool(Map<String, String> row, String key, boolean dflt) {
        String v = str(row, key);
        if (v == null) return dflt;
        return v.equalsIgnoreCase("true") || v.equalsIgnoreCase("yes") || v.equals("1") || v.equalsIgnoreCase("y");
    }

    static String slugify(String s) {
        String slug = s.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return slug.isEmpty() ? "item" : slug;
    }
}
