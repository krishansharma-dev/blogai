import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { articles } = await req.json();

    const prompt = `
    Summarize the following news articles into concise, easy-to-read points (2–3 sentences each).
    Focus on the key information only. Return results in Markdown format.

    Articles:
    ${articles.map((a: any, i: number) => `${i + 1}. ${a.title}\n${a.description || ""}`).join("\n\n")}
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    return NextResponse.json({
      summaries: completion.choices[0].message?.content,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
