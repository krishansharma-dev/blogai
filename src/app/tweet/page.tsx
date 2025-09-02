"use client"

import { useState } from "react"
import { Twitter } from "lucide-react"

export default function TweetPage() {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [tweets, setTweets] = useState<string[]>([])
  const [error, setError] = useState("")

  async function generateTweets() {
    setLoading(true)
    setTweets([])
    setError("")
    try {
      const res = await fetch("/api/generate-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else if (Array.isArray(data.tweets)) {
        setTweets(data.tweets)
      } else {
        setError("Unexpected response from server.")
      }
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
              <Twitter className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
                Job Post Tweet Generator
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 md:text-base">
                Convert your job description into short, catchy tweets optimized for reach and engagement.
              </p>
            </div>
          </header>

          {/* Form */}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!loading && content.trim()) generateTweets()
            }}
          >
            <div className="space-y-2">
              <label
                htmlFor="content"
                className="text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Job Posting Content
              </label>
              <textarea
                id="content"
                rows={6}
                placeholder="Paste your job posting content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white/90 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-200/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 text-sm font-medium text-white shadow-sm transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
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
                  "Generate Tweets"
                )}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          {/* Result */}
          {tweets.length > 0 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Generated Tweets
              </h2>
              <ul className="space-y-3">
                {tweets.map((tweet, i) => (
                  <li
                    key={i}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm leading-relaxed text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:bg-slate-900/80"
                    onClick={() =>
                      window.open(
                        `https://x.com/intent/tweet?text=${encodeURIComponent(
                          tweet
                        )}`,
                        "_blank"
                      )
                    }
                    title="Click to post this tweet on X"
                  >
                    {tweet}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
