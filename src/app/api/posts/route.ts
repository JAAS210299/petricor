import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const PAGE_SIZE = 20
const MAX_START = 500

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestedStart = Number.parseInt(searchParams.get('start') || '0', 10)
  const start = Number.isFinite(requestedStart)
    ? Math.min(Math.max(requestedStart, 0), MAX_START)
    : 0
  const end = start + PAGE_SIZE - 1

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, image_url, media_url, media_type, user_id, edited_at, views_count,
      profiles (id, username, avatar_url, is_verified),
      likes (id, user_id),
      comments (
        id, content, created_at, media_url, media_type,
        profiles (username, avatar_url, is_verified)
      )
    `)
    .order('created_at', { ascending: false })
    .range(start, end)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(posts)
}