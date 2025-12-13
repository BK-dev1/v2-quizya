import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: exams } = await supabase
      .from("exams")
      .select("id, title, created_at")
      .eq("created_by", user.id);

    // Get exam sessions with scores
    const { data: sessions } = await supabase
      .from("exam_sessions")
      .select(
        `
        id,
        score,
        created_at,
        exam_id
      `
      )
      .in("exam_id", exams?.map((e) => e.id) || [])
      .eq("status", "completed");

    const totalSessions = sessions?.length || 0;
    const avgScore =
      totalSessions > 0
        ? Math.round(
            (sessions || []).reduce((sum, s) => sum + (s.score || 0), 0) /
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
