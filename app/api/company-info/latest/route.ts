import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Proxy to backend GET /company-info/latest/data.
 * Returns 200 with { data: null } when backend returns 404 "No previous company info found"
 * so the frontend can treat "not found" as a normal case (prefill from user/empty) without errors.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const backendUrl = base.endsWith("/api/v1") ? base : `${base.replace(/\/$/, "")}/api/v1`;
    const response = await fetch(`${backendUrl}/company-info/latest/data`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 404) {
      const body = await response.json().catch(() => ({}));
      const detail = typeof body?.detail === "string" ? body.detail : "";
      if (detail.toLowerCase().includes("no previous company info") || detail.toLowerCase().includes("not found")) {
        return NextResponse.json({ data: null }, { status: 200 });
      }
    }
    const data = await response.json().catch(() => null);
    return NextResponse.json(response.ok ? { data } : data, { status: response.status });
  } catch (e) {
    console.error("company-info/latest proxy error:", e);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
