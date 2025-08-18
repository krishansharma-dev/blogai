"use client";

import { useState } from "react";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState("");

  const generateBlog = async () => {
    setLoading(true);
    setBlog("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          keywords: keywords.split(",").map((k) => k.trim()),
        }),
      });
      const data = await res.json();
      setBlog(data.blog);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">AI Blog Generator ✍️</h1>

      <input
        type="text"
        placeholder="Enter blog topic..."
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="border rounded p-2 w-full mb-3"
      />

      <input
        type="text"
        placeholder="Enter keywords (comma separated)..."
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        className="border rounded p-2 w-full mb-3"
      />

      <button
        onClick={generateBlog}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Generating..." : "Generate Blog"}
      </button>

      {blog && (
        <div className="mt-6 p-4 border rounded bg-gray-50 whitespace-pre-wrap">
          <h2 className="text-xl font-semibold mb-2">Generated Blog:</h2>
          <div dangerouslySetInnerHTML={{ __html: blog }} />
        </div>
      )}
    </main>
  );
}
