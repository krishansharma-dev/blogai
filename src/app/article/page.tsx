"use client"

import { useState, useEffect, useRef } from "react"
import { 
  FileText, 
  Copy, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  Clock, 
  BookOpen,
  Star,
  Image as ImageIcon,
  ExternalLink,
  Edit2,
  Save
} from "lucide-react"
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

export default function ArticleGenerator() {
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    keywords: "",
    contentType: "article",
    difficultyLevel: "beginner",
    featured: false,
    generateImage: false,
    customImageUrl: "",
    content: "",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    status: "published"
  })
  
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const quillRef = useRef<HTMLDivElement>(null)
  const quillInstance = useRef<Quill | null>(null)

  type Article = {
    keywords: any
    description: string
    id: string
    title: string
    slug: string
    url: string
    excerpt: string
    content: string
    wordCount: number
    readTime: number
    difficultyLevel: string
    featured: boolean
    imageUrl?: string
    contentType: string
    createdAt: string
    updatedAt?: string
    metaTitle: string
    metaDescription: string
    status: string
  }

  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("content")

  const contentTypes = [
    { value: "article", label: "Article", icon: FileText },
    { value: "tutorial", label: "Tutorial", icon: BookOpen },
    { value: "news", label: "News", icon: FileText },
    { value: "video", label: "Video Script", icon: FileText },
    { value: "podcast", label: "Podcast Script", icon: FileText }
  ]

  const difficultyLevels = [
    { value: "beginner", label: "Beginner", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" },
    { value: "intermediate", label: "Intermediate", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" },
    { value: "advanced", label: "Advanced", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" }
  ]

  const statusOptions = [
    { value: "published", label: "Published" },
    { value: "draft", label: "Draft" },
    { value: "archived", label: "Archived" }
  ]

  // Initialize Quill editor
  useEffect(() => {
    if (quillRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(quillRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            ['link', 'image'],
            ['clean']
          ]
        }
      })

      quillInstance.current.on('text-change', () => {
        const content = quillInstance.current?.root.innerHTML || ''
        setFormData(prev => ({ ...prev, content }))
      })
    }

    return () => {
      if (quillInstance.current) {
        quillInstance.current = null
      }
    }
  }, [])

  // Update Quill content when article changes
  useEffect(() => {
    if (article && quillInstance.current && isEditing) {
      quillInstance.current.root.innerHTML = article.content
    }
  }, [article, isEditing])

  async function generateOrUpdateArticle() {
    if (!formData.title.trim()) {
      setError("Please enter an article title")
      return
    }

    if (!formData.description.trim()) {
      setError("Please enter an article description")
      return
    }

    setLoading(true)
    setError("")
    setCopied(false)

    try {
      const payload = {
        ...formData,
        keywords: formData.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        content: isEditing ? formData.content : undefined,
        excerpt: formData.excerpt || undefined,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        customImageUrl: formData.customImageUrl || undefined,
      }

      const res = await fetch("/api/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to process article")
      }

      setArticle(data.article)
      setActiveTab("content")
      setIsEditing(false)
      setFormData(prev => ({
        ...prev,
        id: data.article.id,
        content: data.article.content,
        excerpt: data.article.excerpt,
        metaTitle: data.article.metaTitle,
        metaDescription: data.article.metaDescription,
        status: data.article.status
      }))
    } catch (error) {
      console.error(error)
      setError(error instanceof Error ? error.message : "Failed to process article")
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard(content: string) {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  function downloadArticle(format = 'html') {
    if (!article) return
    
    let content = article.content
    let mimeType = 'text/html'
    let extension = 'html'
    
    if (format === 'md') {
      content = content
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, '$1\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      mimeType = 'text/markdown'
      extension = 'md'
    }
    
    const element = document.createElement("a")
    const file = new Blob([content], { type: mimeType })
    element.href = URL.createObjectURL(file)
    element.download = `${article.slug}.${extension}`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const startEditing = () => {
    if (article) {
      setFormData({
        id: article.id,
        title: article.title,
        description: article.description,
        keywords: article.keywords?.join(", ") || "",
        contentType: article.contentType,
        difficultyLevel: article.difficultyLevel,
        featured: article.featured,
        generateImage: false,
        customImageUrl: article.imageUrl || "",
        content: article.content,
        excerpt: article.excerpt,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        status: article.status
      })
      setIsEditing(true)
    }
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-slate-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-purple-950">
      <main className="mx-auto flex min-h-[100svh] max-w-6xl items-center justify-center p-4 md:p-6">
        <section className="w-full rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/70">
          {/* Header */}
          <header className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
                AI Article Generator
              </h1>
              <p className="mt-1 text-pretty text-sm text-slate-600 dark:text-slate-400 md:text-base">
                Generate and edit comprehensive, SEO-optimized articles with rich text editing and full field control.
              </p>
            </div>
          </header>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault()
              if (!loading) generateOrUpdateArticle()
            }}
          >
            {/* Title & Description */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Article Title *
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g., The Complete Guide to Remote Work"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white/90 px-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-200/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-purple-500 dark:focus:ring-purple-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="keywords" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Keywords (optional)
                </label>
                <input
                  id="keywords"
                  type="text"
                  placeholder="e.g., productivity, collaboration, tools"
                  value={formData.keywords}
                  onChange={(e) => handleInputChange('keywords', e.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white/90 px-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-200/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-purple-500 dark:focus:ring-purple-500/20"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Article Description *
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe what your article should cover, key points to address, target audience, etc."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white/90 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-200/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-purple-500 dark:focus:ring-purple-500/20"
                required
              />
            </div>

            {/* Content Type & Difficulty */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Content Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {contentTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleInputChange('contentType', type.value)}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition ${
                          formData.contentType === type.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-400 dark:bg-purple-900/20 dark:text-purple-300'
                            : 'border-slate-300 bg-white/90 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Difficulty Level
                </label>
                <div className="space-y-2">
                  {difficultyLevels.map((level) => (
                    <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="difficulty"
                        value={level.value}
                        checked={formData.difficultyLevel === level.value}
                        onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                        className="text-purple-600 dark:text-purple-500"
                      />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${level.color}`}>
                        {level.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Status & Options */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white/90 px-4 text-base text-slate-900 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-200/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-purple-500 dark:focus:ring-purple-500/20"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="customImageUrl" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Custom Image URL (optional)
                </label>
                <input
                  id="customImageUrl"
                  type="text"
                  placeholder="e.g., https://example.com/image.jpg"
                  value={formData.customImageUrl}
                  onChange={(e) => handleInputChange('customImageUrl', e.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white/90 px-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-200/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-purple-500 dark:focus:ring-purple-500/20"
                />
              </div>
            </div>

            {/* Additional Fields for Editing */}
            {isEditing && (
              <>
                <div className="space-y-2">
                  <label htmlFor="metaTitle" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Meta Title
                  </label>
                  <input
                    id="metaTitle"
                    type="text"
                    placeholder="SEO-optimized meta title"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white/90 px-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-200/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-purple-500 dark:focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="excerpt" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Excerpt
                  </label>
                  <textarea
                    id="excerpt"
                    rows={3}
                    placeholder="Brief article summary for SEO"
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white/90 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-200/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-purple-500 dark:focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="metaDescription" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    rows={3}
                    placeholder="SEO-optimized meta description (max 160 characters)"
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white/90 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-200/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-purple-500 dark:focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Content
                  </label>
                  <div ref={quillRef} className="h-[400px] bg-white dark:bg-slate-900" />
                </div>
              </>
            )}

            {/* Options */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="text-purple-600 dark:text-purple-500"
                />
                <Star className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Mark as Featured</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.generateImage}
                  onChange={(e) => handleInputChange('generateImage', e.target.checked)}
                  className="text-purple-600 dark:text-purple-500"
                />
                <ImageIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Generate Featured Image</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-2">
              {article && !isEditing && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-600 px-6 text-sm font-medium text-white shadow-sm transition active:translate-y-px hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Article
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.description.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 text-sm font-medium text-white shadow-sm transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
              >
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-b-transparent" />
                    {isEditing ? 'Updating Article...' : 'Generating Article...'}
                  </>
                ) : (
                  <>
                    {isEditing ? <Save className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    {isEditing ? 'Save Changes' : 'Generate Article'}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Results */}
          {article && !isEditing && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-white/70 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              {/* Article Header */}
              <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {article.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>{article.wordCount} words</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{article.readTime} min read</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full ${
                        difficultyLevels.find(d => d.value === article.difficultyLevel)?.color
                      }`}>
                        {difficultyLevels.find(d => d.value === article.difficultyLevel)?.label}
                      </span>
                      {article.featured && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="h-3 w-3 fill-current" />
                          <span>Featured</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(article.content)}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-slate-100 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => downloadArticle('html')}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-slate-100 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Download className="h-3 w-3" />
                      HTML
                    </button>
                    <button
                      onClick={() => downloadArticle('md')}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-slate-100 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Download className="h-3 w-3" />
                      MD
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                {[
                  { id: 'content', label: 'Content', icon: Eye },
                  { id: 'metadata', label: 'SEO & Metadata', icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                        activeTab === tab.id
                          ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'content' && (
                  <div
                    className="prose prose-slate max-w-none dark:prose-invert
                               prose-headings:text-slate-900 dark:prose-headings:text-slate-100
                               prose-a:text-purple-600 dark:prose-a:text-purple-400
                               prose-strong:text-slate-900 dark:prose-strong:text-slate-100
                               prose-code:text-purple-600 dark:prose-code:text-purple-400"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                )}

                {activeTab === 'metadata' && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">URL Slug</label>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="flex-1 rounded bg-slate-100 px-2 py-1 text-sm dark:bg-slate-800">
                            {article.slug}
                          </code>
                          <button
                            onClick={() => copyToClipboard(article.slug)}
                            className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Article URL</label>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="flex-1 rounded bg-slate-100 px-2 py-1 text-sm dark:bg-slate-800">
                            {article.url}
                          </code>
                          <button
                            onClick={() => copyToClipboard(article.url)}
                            className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Meta Title</label>
                      <div className="mt-1">
                        <input
                          value={article.metaTitle}
                          readOnly
                          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        />
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {article.metaTitle?.length || 0}/60 characters
                          </span>
                          <button
                            onClick={() => copyToClipboard(article.metaTitle)}
                            className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                          >
                            Copy Meta Title
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Meta Description</label>
                      <div className="mt-1">
                        <textarea
                          value={article.metaDescription}
                          readOnly
                          rows={3}
                          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        />
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {article.metaDescription?.length || 0}/160 characters
                          </span>
                          <button
                            onClick={() => copyToClipboard(article.metaDescription)}
                            className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                          >
                            Copy Meta Description
                          </button>
                        </div>
                      </div>
                    </div>

                    {article.imageUrl && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Featured Image</label>
                        <div className="mt-2">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="h-32 w-full rounded-lg object-cover"
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <code className="flex-1 rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                              {article.imageUrl}
                            </code>
                            <button
                              onClick={() => copyToClipboard(article.imageUrl ?? "")}
                              className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <a
                              href={article.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Content Type</label>
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                            {contentTypes.find(t => t.value === article.contentType)?.label}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Difficulty</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            difficultyLevels.find(d => d.value === article.difficultyLevel)?.color
                          }`}>
                            {difficultyLevels.find(d => d.value === article.difficultyLevel)?.label}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Created</label>
                        <div className="mt-1">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(article.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {article.updatedAt && (
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Updated</label>
                          <div className="mt-1">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(article.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Article Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Word Count:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{article.wordCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Read Time:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{article.readTime} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Article ID:</span>
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{article.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Status:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {statusOptions.find(s => s.value === article.status)?.label}
                            {article.featured && (
                              <span className="ml-2 flex items-center gap-1 text-yellow-600">
                                <Star className="h-3 w-3 fill-current" />
                                Featured
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}