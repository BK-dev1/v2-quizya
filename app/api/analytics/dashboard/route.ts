import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for faster queries
    const { data: exams } = await supabaseAdmin
      .from("exams")
      .select("id")
      .eq("created_by", user.id);

    const examIds = exams?.map((e) => e.id) || [];

    // Only fetch sessions if there are exams
    let sessions = [];
    if (examIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("exam_sessions")
        .select("id, score")
        .in("exam_id", examIds)
        .eq("status", "completed");
      sessions = data || [];
    }

    const totalSessions = sessions.length;
    const avgScore =
      totalSessions > 0
        ? Math.round(
            sessions.reduce((sum, s) => sum + (s.score || 0), 0) /
              totalSessions
          )
        : 0;

    return NextResponse.json({
      totalExams: exams?.length || 0,
      totalSessions,
      avgScore,
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
