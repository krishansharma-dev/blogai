import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if id is a UUID (for direct lookup)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    let query;

    if (isUuid) {
      query = supabase.from("articles").select("*").eq("id", id).single();
    } else {
      query = supabase.from("articles").select("*").eq("slug", id).single();
    }

    const { data: article, error } = await query

    if (error || !article) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { article },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch article" },
      { status: 500 }
    )
  }
}
