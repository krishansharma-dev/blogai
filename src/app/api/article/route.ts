import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

function calculateReadTime(wordCount: number) {
  return Math.ceil(wordCount / 225);
}

function extractMetaFromContent(content: string) {
  const textContent = content.replace(/<[^>]*>/g, '');
  const firstParagraph = textContent.split('\n\n')[0] || textContent.substring(0, 300);
  const excerpt = firstParagraph.length > 300 
    ? firstParagraph.substring(0, 297) + '...' 
    : firstParagraph;

  const metaDescription = excerpt.length > 160 
    ? excerpt.substring(0, 157) + '...' 
    : excerpt;

  return { excerpt, metaDescription };
}

export async function POST(req: { 
  json: () => PromiseLike<{
    id?: string;
    title: any;
    description: any;
    keywords: any;
    contentType?: "article" | "tutorial" | "news" | "video" | "podcast" | undefined;
    difficultyLevel?: "beginner" | "intermediate" | "advanced" | undefined;
    featured?: boolean | undefined;
    generateImage?: boolean | undefined;
    customImageUrl?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    metaTitle?: string | undefined;
    metaDescription?: string | undefined;
    status?: string | undefined;
  }>
}) {
  try {
    const {
      id, // Added for update operations
      title,
      description,
      keywords,
      contentType = 'article',
      difficultyLevel = 'beginner',
      featured = false,
      generateImage = false,
      customImageUrl,
      content: providedContent,
      excerpt: providedExcerpt,
      metaTitle: providedMetaTitle,
      metaDescription: providedMetaDescription,
      status = 'published'
    } = await req.json();

    // Input validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Article title is required" },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Article description is required" },
        { status: 400 }
      );
    }

    // Generate or validate slug
    let slug = generateSlug(title);
    const { data: existingArticle } = await supabase
      .from("articles")
      .select("slug")
      .eq("slug", slug)
      .neq("id", id || '') // Exclude current article if updating
      .single();

    if (existingArticle) {
      slug = `${slug}-${Date.now()}`;
    }

    let content = providedContent;
    let excerpt = providedExcerpt;
    let metaDescription = providedMetaDescription;
    let metaTitle = providedMetaTitle || title;
    let wordCount = 0;
    let readTime = 0;
    let imageUrl = customImageUrl || null;

    // Generate content if not provided (for new articles or when content isn't edited)
    if (!content) {
      const contentTypePrompts = {
        article: "Write a comprehensive, well-researched article",
        tutorial: "Write a step-by-step tutorial with clear instructions and examples",
        news: "Write a news article with facts, quotes, and current relevance",
        video: "Write a detailed video script with timestamps and visual cues",
        podcast: "Write a podcast episode script with engaging dialogue and segments"
      };

      const difficultyPrompts = {
        beginner: "suitable for beginners with no prior knowledge",
        intermediate: "for readers with some background knowledge",
        advanced: "for expert-level audience with deep technical knowledge"
      };

      const prompt = `
      ${contentTypePrompts[contentType] || contentTypePrompts.article} about "${title}".
      
      Description: ${description}
      ${keywords ? `Keywords to include: ${Array.isArray(keywords) ? keywords.join(', ') : keywords}` : ''}
      
      Requirements:
      - Target audience: ${difficultyPrompts[difficultyLevel]}
      - Content type: ${contentType}
      - Use clean HTML formatting compatible with rich text editors
      - Use semantic HTML with proper hierarchy (h1, h2, h3)
      - Include an engaging introduction that hooks the reader
      - Provide detailed, actionable content with examples
      - Add relevant bullet points and numbered lists
      - Include a strong conclusion with key takeaways
      - Aim for 1500-2500 words
      - Write in a professional yet engaging tone
      - Optimize for SEO with natural keyword integration
      - Include relevant examples, case studies, or practical applications
      - Ensure content is compatible with rich text editors like Quill or CKEditor
      
      ${contentType === 'tutorial' ? `
      Additional Tutorial Requirements:
      - Number each main step clearly
      - Include prerequisites section
      - Add troubleshooting tips
      - Provide expected outcomes for each step
      ` : ''}
      
      ${contentType === 'news' ? `
      Additional News Requirements:
      - Start with the most important information (inverted pyramid)
      - Include relevant background context
      - Use present tense for recent events
      - Maintain journalistic objectivity
      ` : ''}
      
      Format the response in clean HTML with semantic tags (h1, h2, h3, p, ul, ol, strong, em) suitable for rich text editor integration.
      `;

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
      });

      content = completion.choices[0].message?.content ?? "";
      if (!content) {
        throw new Error("No content generated from OpenAI");
      }
    }

    // Calculate content metrics
    wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    readTime = calculateReadTime(wordCount);
    
    // Use provided excerpt and metaDescription or generate them
    if (!excerpt || !metaDescription) {
      const meta = extractMetaFromContent(content);
      excerpt = providedExcerpt || meta.excerpt;
      metaDescription = providedMetaDescription || meta.metaDescription;
    }

    // Optimize meta title for SEO
    metaTitle = metaTitle.length > 60 ? metaTitle.substring(0, 57) + '...' : metaTitle;

    // Generate image if requested and no custom URL provided
    if (generateImage && !customImageUrl) {
      try {
        const imagePrompt = `Create a professional, clean illustration for an article titled "${title}". Style: modern, minimalist, suitable for a blog header.`;
        const imageResponse = await client.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          size: "1024x1024",
          quality: "standard",
          n: 1,
        });
        imageUrl = imageResponse.data?.[0]?.url || null;
      } catch (imageError) {
        console.warn("Failed to generate image:", imageError);
      }
    }

    // Prepare article data
    const articleData = {
      title: title.trim(),
      url: `https://yourdomain.com/articles/${slug}`,
      description: description.trim(),
      content,
      excerpt,
      image_url: imageUrl,
      word_count: wordCount,
      read_time_minutes: readTime,
      content_type: contentType,
      difficulty_level: difficultyLevel,
      slug,
      meta_title: metaTitle,
      meta_description: metaDescription,
      status,
      featured,
      trending: false,
      updated_at: new Date().toISOString(),
      ...(id ? {} : { created_at: new Date().toISOString() }) // Only set created_at for new articles
    };

    let data;
    let error;

    // Update or insert based on whether ID is provided
    if (id) {
      ({ data, error } = await supabase
        .from("articles")
        .update(articleData)
        .eq("id", id)
        .select("*")
        .single());
    } else {
      ({ data, error } = await supabase
        .from("articles")
        .insert([articleData])
        .select("*")
        .single());
    }

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      article: {
        id: data.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        slug: data.slug,
        url: data.url,
        wordCount: data.word_count,
        readTime: data.read_time_minutes,
        contentType: data.content_type,
        difficultyLevel: data.difficulty_level,
        imageUrl: data.image_url,
        featured: data.featured,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        metaTitle: data.meta_title,
        metaDescription: data.meta_description,
        status: data.status
      }
    });

  } catch (error) {
    console.error("API Error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate and save article" },
      { status: 500 }
    );
  }
}