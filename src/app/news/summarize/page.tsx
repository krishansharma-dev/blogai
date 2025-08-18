"use client";

import { useEffect, useState } from "react";

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: { name: string };
}

export default function SummarizePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [summaries, setSummaries] = useState("");
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
      setSummaries(data.summaries);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📝 Summarize Selected News</h1>

      <div className="space-y-4">
        {articles.map((article, i) => (
          <div key={i} className="border rounded p-4 bg-white shadow">
            <h2 className="text-lg font-semibold">{article.title}</h2>
            <p className="text-sm text-gray-600">{article.source?.name}</p>
            <p className="text-sm text-gray-800">{article.description}</p>
          </div>
        ))}
      </div>

      {articles.length > 0 && (
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

      {summaries && (
        <div className="mt-6 p-4 border rounded bg-gray-50 whitespace-pre-wrap">
          <h2 className="text-xl font-semibold mb-2">AI Summaries:</h2>
          <div dangerouslySetInnerHTML={{ __html: summaries }} />
        </div>
      )}
    </main>
  );
}
