// src/app/api/posts/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const start = parseInt(searchParams.get('start') || '0', 10)
  const end = parseInt(searchParams.get('end') || '19', 10)

  const supabase = await createServerSupabaseClient()

  // Solicitamos a Supabase únicamente el rango exacto de filas
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id, content, created_at, image_url, user_id,
      profiles (id, username, avatar_url),
      likes (id, user_id),
      comments (id)
    `)
    .order('created_at', { ascending: false })
    .range(start, end)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(posts)
}