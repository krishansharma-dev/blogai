import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});



export async function POST(req: Request) {
  try {
    const { topic, keywords } = await req.json();

    const prompt = `
    Write a detailed SEO-friendly blog post about "${topic}".
    Include the following keywords: ${keywords.join(", ")}.
    Use clear headings (H2/H3), bullet points, and a conclusion.
    Make it engaging, professional, and optimized for Google SEO.
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const blogContent = completion.choices[0].message?.content ?? "";

    // ✅ Save to Supabase
    const { data, error } = await supabase
      .from("blogs")
      .insert([{ topic, keywords, content: blogContent }])
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      blog: blogContent,
      id: data.id, // return saved ID
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate and save blog" },
      { status: 500 }
    );
  }
}
