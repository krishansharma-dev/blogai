import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=tesla&from=2025-07-18&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`
    );

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
