import { NextResponse } from "next/server";
import OpenAI from "openai";

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
      model: "gpt-4o-mini", // cost-effective + fast
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    return NextResponse.json({
      blog: completion.choices[0].message?.content,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate blog" }, { status: 500 });
  }
}
