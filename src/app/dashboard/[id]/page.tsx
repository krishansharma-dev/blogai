"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Clock, BookOpen, ArrowLeft } from "lucide-react"

interface Article {
  id: string
  title: string
  description: string
  excerpt: string
  content: string
  image_url?: string
  word_count: number
  read_time_minutes: number
  content_type: string
  difficulty_level: string
  featured: boolean
  trending: boolean
  created_at: string
  publish_date: string
}

export default function ArticleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/article/get/${id}`)
        if (!res.ok) throw new Error("Failed to load article")
        const data = await res.json()
        if (data.success) {
          setArticle(data.data.article)
        } else {
          setError("Article not found")
        }
      } catch (err) {
        console.error(err)
        setError("Failed to fetch article. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchArticle()
  }, [id])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-6" />
        <Skeleton className="h-64 w-full rounded-lg mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6 mb-2" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{error}</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    )
  }

  if (!article) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push("/dashboard")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>

      <Card>
        {article.image_url && (
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            <img
              src={article.image_url}
              alt={article.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        <CardHeader>
          <CardTitle className="text-3xl font-bold">{article.title}</CardTitle>
          {/* <p className="text-muted-foreground">{article.description}</p> */}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{article.content_type}</Badge>
            <Badge>{article.difficulty_level}</Badge>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {article.read_time_minutes} min read
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> {article.word_count.toLocaleString()} words
            </div>
            <span>{formatDate(article.publish_date || article.created_at)}</span>
          </div>

          <div className="prose max-w-none">
            <p>{article.excerpt}</p>
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
