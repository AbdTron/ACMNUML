import { createClient } from '@supabase/supabase-js'

const defaultUrl = 'https://vtphwfdsorogemcmcnyf.supabase.co'
const defaultAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0cGh3ZmRzb3JvZ2VtY21jbnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzAxOTMsImV4cCI6MjA3OTU0NjE5M30.BAR8huPc4eghksLrGfxZCFzS4TMDUhy5xqvied6wXJM'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const uploadToSupabase = async (file, folder = 'media') => {
  if (!file) return null
  const fileExt = file.name.split('.').pop()
  const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

  const { error } = await supabase.storage.from('media').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw error
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('media').getPublicUrl(filePath)

  return publicUrl
}


