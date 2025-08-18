"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Import the client

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: { name: string };
}

interface Summary {
  title: string;
  source: string;
  summary: string;
  approved?: boolean;
}

export default function SummarizePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("selectedArticles");
    if (stored) {
      setArticles(JSON.parse(stored));
    }
  }, []);

  const summarize = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles }),
      });
      const data = await res.json();

      // Assume summaries come back in Markdown paragraphs → split by numbers
      const parsed = data.summaries
        .split(/\d+\./)
        .filter((s: string) => s.trim().length > 0)
        .map((s: string, i: number) => ({
          title: articles[i]?.title || `Article ${i + 1}`,
          source: articles[i]?.source?.name || "Unknown",
          summary: s.trim(),
        }));

      setSummaries(parsed);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const approveSummary = async (summary: Summary) => {
    const { error } = await supabase.from("news_summaries").insert([
      {
        title: summary.title,
        source: summary.source,
        summary: summary.summary,
        approved: true,
      },
    ]);

    if (error) {
      console.error(error);
      alert("❌ Failed to save");
    } else {
      alert("✅ Approved & saved to Supabase");
      setSummaries((prev) =>
        prev.map((s) =>
          s.title === summary.title ? { ...s, approved: true } : s
        )
      );
    }
  };

  const rejectSummary = (summary: Summary) => {
    setSummaries((prev) =>
      prev.filter((s) => s.title !== summary.title)
    );
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📝 Review & Approve Summaries</h1>

      {/* Show selected articles before summarizing */}
      {summaries.length === 0 && (
        <div className="space-y-4">
          {articles.map((article, i) => (
            <div key={i} className="border rounded p-4 bg-white shadow">
              <h2 className="text-lg font-semibold">{article.title}</h2>
              <p className="text-sm text-gray-600">{article.source?.name}</p>
              <p className="text-sm text-gray-800">{article.description}</p>
            </div>
          ))}
        </div>
      )}

      {articles.length > 0 && summaries.length === 0 && (
        <div className="mt-6">
          <button
            onClick={summarize}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Summarizing..." : "Generate Summaries"}
          </button>
        </div>
      )}

      {summaries.length > 0 && (
        <div className="mt-6 space-y-4">
          {summaries.map((s, i) => (
            <div
              key={i}
              className={`border rounded p-4 shadow ${
                s.approved ? "bg-green-50" : "bg-white"
              }`}
            >
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="text-sm text-gray-600">{s.source}</p>
              <p className="text-gray-800 mt-2">{s.summary}</p>

              {!s.approved && (
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => approveSummary(s)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Approve ✅
                  </button>
                  <button
                    onClick={() => rejectSummary(s)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Reject ❌
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}