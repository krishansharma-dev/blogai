"use client"

import { useState } from "react"
import { PenTool } from "lucide-react"

export default function Home() {
  const [topic, setTopic] = useState("")
  const [keywords, setKeywords] = useState("")
  const [loading, setLoading] = useState(false)
  const [blog, setBlog] = useState("")

  async function generateBlog() {
    setLoading(true)
    setBlog("")
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          keywords: keywords.split(",").map((k) => k.trim()),
        }),
      })
      const data = await res.json()
      setBlog(data.blog)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
      <main className="mx-auto flex min-h-[100svh] max-w-3xl items-center justify-center p-4 md:p-6">
        <section className="w-full rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/70">
          {/* Header */}
          <header className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
              <PenTool className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
                AI Blog Generator
              </h1>
              <p className="mt-1 text-pretty text-sm text-slate-600 dark:text-slate-400 md:text-base">
                Generate well-structured blog posts from a topic and a set of keywords. Clean, minimal, and fast.
              </p>
            </div>
          </header>

          {/* Form */}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!loading) generateBlog()
            }}
            aria-label="Blog generation form"
          >
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Blog topic
              </label>
              <input
                id="topic"
                type="text"
                placeholder="e.g., The future of remote work"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-12 w-full rounded-lg border border-slate-300 bg-white/90 px-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-200/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="keywords" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Keywords (comma separated)
              </label>
              <input
                id="keywords"
                type="text"
                placeholder="e.g., productivity, hybrid teams, async"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="h-12 w-full rounded-lg border border-slate-300 bg-white/90 px-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-200/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-b-transparent"
                      aria-hidden="true"
                    />
                    Generating
                  </>
                ) : (
                  "Generate Blog"
                )}
              </button>
            </div>
          </form>

          {/* Result */}
          {blog && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Generated Blog</h2>
              <div
                className="max-h-96 overflow-y-auto rounded-lg bg-slate-50/70 p-4 text-sm leading-7 text-slate-800 shadow-inner dark:bg-slate-950/50 dark:text-slate-200
                           [&>*]:mb-4 [&>*:last-child]:mb-0
                           [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold
                           [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold
                           [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold
                           [&_ul]:list-disc [&_ul]:pl-5
                           [&_ol]:list-decimal [&_ol]:pl-5
                           [&_a]:text-blue-600 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: blog }}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
