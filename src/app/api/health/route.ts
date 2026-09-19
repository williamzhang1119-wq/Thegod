import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/openai";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "venture-1",
    version: "3.0.0",
    demoMode: isDemoMode(),
    features: [
      "homework-helper",
      "age-bands",
      "hint-ladder",
      "coach-actions",
      "subject-focus",
      "mastery-tracking",
      "stuck-detection",
      "streaming",
      "passport",
      "quiz",
      "adventures",
      "daily-challenge",
      "parent-report",
      "xp-streaks",
      "session-insights",
    ],
  });
}
