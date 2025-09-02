import { NextResponse } from "next/server"
import OpenAI from "openai"
import { supabase } from "@/lib/supabase"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Generate tweets
    const tweetRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a copywriter who creates engaging tweets." },
        { role: "user", content: `Turn this job posting into 3 short, catchy tweets:\n\n${content}` },
      ],
    })

    const tweets =
      tweetRes.choices[0]?.message?.content
        ?.split("\n")
        .filter((t) => t.trim().length > 0) ?? []

    // Generate structured job data
    const dataRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You extract structured job data in JSON format." },
        {
          role: "user",
          content: `Extract JSON with fields: title, location, skills (array), description from:\n\n${content}`,
        },
      ],
      response_format: { type: "json_object" },
    })

    const jobData = JSON.parse(dataRes.choices[0]?.message?.content ?? "{}")

    // Insert into Supabase
    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          title: jobData.title,
          location: jobData.location,
          skills: jobData.skills || [],
          description: jobData.description,
     
        },
      ])
      .select()
      .single()

    if (error) {
      console.error(error)
      return NextResponse.json({ error: "Database insert failed" }, { status: 500 })
    }

    return NextResponse.json({ tweets, jobData: data })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to generate job post" }, { status: 500 })
  }
}
