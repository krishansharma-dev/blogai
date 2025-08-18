"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: { name: string };
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Article[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchNews();
  }, []);

  const toggleSelect = (article: Article) => {
    if (selected.find((a) => a.url === article.url)) {
      setSelected(selected.filter((a) => a.url !== article.url));
    } else if (selected.length < 5) {
      setSelected([...selected, article]);
    } else {
      alert("You can only select up to 5 articles.");
    }
  };

  const goToSummarize = () => {
    localStorage.setItem("selectedArticles", JSON.stringify(selected));
    router.push("/news/summarize");
  };

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📰 News Review Dashboard</h1>
      {selected.length > 0 && (
        <div className="mt-6">
          <button
            onClick={goToSummarize}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Continue to Summarize ({selected.length}/5)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <div key={index} className="border rounded-lg shadow p-4 bg-white relative">
            <input
              type="checkbox"
              checked={!!selected.find((a) => a.url === article.url)}
              onChange={() => toggleSelect(article)}
              className="absolute top-3 right-3 w-5 h-5"
            />

            {article.urlToImage && (
              <img
                src={article.urlToImage}
                alt={article.title}
                className="w-full h-40 object-cover rounded mb-3"
              />
            )}
            <h2 className="text-lg font-semibold mb-2">{article.title}</h2>
            <p className="text-sm text-gray-600 mb-2">{article.source?.name}</p>
            <p className="text-sm text-gray-800 line-clamp-3">{article.description}</p>
          </div>
        ))}
      </div>

     
    </main>
  );
}
