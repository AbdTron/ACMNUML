import { createClient } from '@supabase/supabase-js'

const defaultUrl = 'https://vtphwfdsorogemcmcnyf.supabase.co'
const defaultAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0cGh3ZmRzb3JvZ2VtY21jbnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzAxOTMsImV4cCI6MjA3OTU0NjE5M30.BAR8huPc4eghksLrGfxZCFzS4TMDUhy5xqvied6wXJM'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey
// Try to read from env, fallback to 'acmnumlDB' if not set (your actual bucket name)
// IMPORTANT: This must be 'acmnumlDB' to match your Supabase bucket name
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'acmnumlDB'


export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const getPublicPrefix = () =>
  `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${supabaseBucket}/`

export const getStoragePathFromUrl = (publicUrl) => {
  if (!publicUrl) return null
  const prefix = getPublicPrefix()
  if (publicUrl.startsWith(prefix)) {
    return publicUrl.slice(prefix.length)
  }
  const url = new URL(publicUrl, supabaseUrl)
  const segments = url.pathname.split(`/${supabaseBucket}/`)
  return segments[1] || null
}

export const deleteFromSupabase = async (pathOrUrl) => {
  if (!pathOrUrl) return
  const storageBucket = supabase.storage.from(supabaseBucket)
  const path = pathOrUrl.includes('/storage/v1/object/')
    ? getStoragePathFromUrl(pathOrUrl)
    : pathOrUrl
  if (!path) return
  const { error } = await storageBucket.remove([path])
  if (error) {
    console.warn('Failed to delete file from Supabase:', error.message)
  }
}

export const uploadToSupabase = async (file, folder = 'media') => {
  if (!file) return null
  const fileExt = file.name.split('.').pop()
  const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

  const storageBucket = supabase.storage.from(supabaseBucket)

  const { error } = await storageBucket.upload(filePath, file, {
    cacheControl: '31536000', // 1 year cache for better performance
    upsert: false,
  })

  if (error) {
    throw new Error(error.message || 'Upload failed')
  }

  // Get public URL - Supabase format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
  const {
    data: { publicUrl },
  } = storageBucket.getPublicUrl(filePath)

  return { url: publicUrl, path: filePath }
}

