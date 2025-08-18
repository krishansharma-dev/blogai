import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { articles } = await req.json();

    const summaries: string[] = [];

    for (const article of articles) {
      const inputText = `${article.title}\n${article.description || ""}`;

      const res = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: inputText }),
        }
      );

      const data = await res.json();
      summaries.push(data[0]?.summary_text || "⚠️ Could not summarize");
    }

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "HF summarization failed" }, { status: 500 });
  }
}
