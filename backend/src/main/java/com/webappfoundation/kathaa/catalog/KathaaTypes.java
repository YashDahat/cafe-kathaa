package com.webappfoundation.kathaa.catalog;

import java.time.ZoneId;

/** Item types + workflow codes owned by the Cafe Kathaa domain. */
public final class KathaaTypes {
    private KathaaTypes() {}

    public static final String MENU_DISH = "MENU_DISH";
    public static final String SEATING = "SEATING";

    public static final String WF_TABLE = "kathaa-table";
    public static final String WF_TAKEAWAY = "kathaa-takeaway";

    /** Terminal "happy" stages that earn a Chapters stamp. */
    public static final String STAGE_FINISHED = "FINISHED";
    public static final String STAGE_COLLECTED = "COLLECTED";

    public static final String BRANCH_SLUG = "cafe-kathaa-fc-road";
    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
}
