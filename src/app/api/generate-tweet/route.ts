import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    const prompt = `
    Convert the following job posting into 2–3 professional, catchy tweets.
    - Keep each tweet under 280 characters.
    - Use simple language and engaging tone.
    - Add relevant hashtags and a call to action (like "Apply now!").
    - Avoid repeating the same phrasing in every tweet.
    
    Job Posting:
    ${content}
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const rawOutput = completion.choices[0].message?.content || "";
    // Split into tweets (assuming model outputs them in lines/bullets)
    const tweets = rawOutput
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !/^\d+[\.\)]/.test(t)); // clean numbering

    return NextResponse.json({ tweets });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate tweets" }, { status: 500 });
  }
}
