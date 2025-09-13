"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, Clock, BookOpen, TrendingUp, Star } from "lucide-react"

interface Article {
  id: string
  title: string
  description: string
  excerpt: string
  image_url?: string
  word_count: number
  read_time_minutes: number
  content_type: string
  difficulty_level: string
  slug: string
  featured: boolean
  trending: boolean
  created_at: string
  publish_date: string
}

interface ArticlesResponse {
  success: boolean
  data: {
    articles: Article[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
    stats: {
      total: number
      avgWordCount: number
      avgReadTime: number
      contentTypes: Record<string, number>
      difficultyLevels: Record<string, number>
    }
  }
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<ArticlesResponse["data"]["pagination"] | null>(null)
  const [stats, setStats] = useState<ArticlesResponse["data"]["stats"] | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [contentType, setContentType] = useState("all")
  const [difficulty, setDifficulty] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFeatured, setShowFeatured] = useState(false)
  const [showTrending, setShowTrending] = useState(false)

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (search) params.append("search", search)
      if (contentType !== "all") params.append("content_type", contentType)
      if (difficulty !== "all") params.append("difficulty", difficulty)
      if (showFeatured) params.append("featured", "true")
      if (showTrending) params.append("trending", "true")

      const response = await fetch(`/api/article/get?${params}`)
      const data: ArticlesResponse = await response.json()

      if (data.success) {
        setArticles(data.data.articles)
        setPagination(data.data.pagination)
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch articles:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [currentPage, search, contentType, difficulty, sortBy, sortOrder, showFeatured, showTrending])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchArticles()
  }

  const resetFilters = () => {
    setSearch("")
    setContentType("all")
    setDifficulty("all")
    setSortBy("created_at")
    setSortOrder("desc")
    setShowFeatured(false)
    setShowTrending(false)
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Articles</h1>
        {stats && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{stats.total} articles</span>
            <span>Avg. {stats.avgReadTime} min read</span>
            <span>Avg. {stats.avgWordCount} words</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex flex-wrap gap-4">
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="tutorial">Tutorial</SelectItem>
              <SelectItem value="guide">Guide</SelectItem>
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="news">News</SelectItem>
            </SelectContent>
          </Select>

          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="publish_date">Publish Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="read_time_minutes">Read Time</SelectItem>
              <SelectItem value="word_count">Word Count</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest</SelectItem>
              <SelectItem value="asc">Oldest</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={showFeatured ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFeatured(!showFeatured)}
            >
              <Star className="h-4 w-4 mr-1" />
              Featured
            </Button>
            <Button
              variant={showTrending ? "default" : "outline"}
              size="sm"
              onClick={() => setShowTrending(!showTrending)}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Trending
            </Button>
          </div>

          <Button variant="ghost" onClick={resetFilters}>
            <Filter className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
          <Link key={article.id} href={`/dashboard/${article.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                {article.image_url && (
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={article.image_url || "/placeholder.svg"}
                      alt={article.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 text-balance">{article.title}</CardTitle>
                    <div className="flex gap-1 flex-shrink-0">
                      {article.featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      {article.trending && <TrendingUp className="h-4 w-4 text-blue-500" />}
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {article.content_type}
                    </Badge>
                    <Badge className={`text-xs ${getDifficultyColor(article.difficulty_level)}`}>
                      {article.difficulty_level}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.read_time_minutes} min
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {article.word_count.toLocaleString()} words
                      </div>
                    </div>
                    <span>{formatDate(article.publish_date || article.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" disabled={!pagination.hasPrevPage} onClick={() => setCurrentPage(currentPage - 1)}>
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, Math.max(1, currentPage - 2))) + i

              if (pageNum > pagination.totalPages) return null

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button variant="outline" disabled={!pagination.hasNextPage} onClick={() => setCurrentPage(currentPage + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* No Results */}
      {!loading && articles.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No articles found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search criteria or filters</p>
          <Button onClick={resetFilters}>Reset Filters</Button>
        </div>
      )}
    </div>
  )
}
