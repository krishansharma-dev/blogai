import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: { url: string | URL; }) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Query parameters
    const page = parseInt(searchParams.get('page') ?? '') || 1;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '') || 10, 50); // Max 50 items per page
    const status = searchParams.get('status') || 'published';
    const contentType = searchParams.get('content_type') ?? undefined;
    const difficulty = searchParams.get('difficulty') ?? undefined;
    const featured = searchParams.get('featured') === 'true';
    const trending = searchParams.get('trending') === 'true';
    const search = searchParams.get('search') ?? undefined;
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        url,
        description,
        excerpt,
        image_url,
        word_count,
        read_time_minutes,
        content_type,
        difficulty_level,
        slug,
        meta_title,
        meta_description,
        status,
        featured,
        trending,
        created_at,
        updated_at,
        publish_date
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    if (difficulty) {
      query = query.eq('difficulty_level', difficulty);
    }

    if (featured) {
      query = query.eq('featured', true);
    }

    if (trending) {
      query = query.eq('trending', true);
    }

    // Full-text search
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sorting
    const validSortFields = [
      'created_at', 'updated_at', 'title', 'word_count', 
      'read_time_minutes', 'publish_date'
    ];
    
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { 
        ascending: sortOrder === 'asc',
        nullsFirst: false 
      });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: articles, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count ?? 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get statistics for the current filter set
    let statsQuery = supabase
      .from('articles')
      .select('word_count, read_time_minutes, content_type, difficulty_level', { count: 'exact' });

    // Apply the same filters for stats (except pagination)
    if (status) statsQuery = statsQuery.eq('status', status);
    if (contentType) statsQuery = statsQuery.eq('content_type', contentType);
    if (difficulty) statsQuery = statsQuery.eq('difficulty_level', difficulty);
    if (featured) statsQuery = statsQuery.eq('featured', true);
    if (trending) statsQuery = statsQuery.eq('trending', true);
    if (search) {
      statsQuery = statsQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: statsData, count: totalCount } = await statsQuery;

    // Calculate stats
    const stats: {
      total: number | null,
      avgWordCount: number,
      avgReadTime: number,
      contentTypes: Record<string, number>,
      difficultyLevels: Record<string, number>
    } = {
      total: totalCount,
      avgWordCount: statsData && totalCount
        ? Math.round(statsData.reduce((sum, item) => sum + (item.word_count || 0), 0) / totalCount)
        : 0,
      avgReadTime: statsData && totalCount
        ? Math.round(statsData.reduce((sum, item) => sum + (item.read_time_minutes || 0), 0) / totalCount)
        : 0,
      contentTypes: {},
      difficultyLevels: {}
    };

    // Count by content type
    statsData?.forEach(item => {
      if (item.content_type) {
        stats.contentTypes[item.content_type] = (stats.contentTypes[item.content_type] || 0) + 1;
      }
      if (item.difficulty_level) {
        stats.difficultyLevels[item.difficulty_level] = (stats.difficultyLevels[item.difficulty_level] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        articles,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        },
        stats,
        filters: {
          status,
          contentType,
          difficulty,
          featured,
          trending,
          search,
          sortBy,
          sortOrder
        }
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
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// GET single article by ID or slug
export async function getArticle(identifier: string) {
  try {
    // Check if identifier is UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let query;
    if (isUuid) {
      query = supabase
        .from('articles')
        .select('*')
        .filter('id', 'eq', identifier)
        .single();
    } else {
      query = supabase
        .from('articles')
        .select('*')
        .filter('slug', 'eq', identifier)
        .single();
    }

    const { data: article, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Article not found" },
          { status: 404 }
        );
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: { article }
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch article" },
      { status: 500 }
    );
  }
}