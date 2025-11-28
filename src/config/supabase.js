import { createClient } from '@supabase/supabase-js'

// Initialize constants first
const defaultUrl = 'https://vtphwfdsorogemcmcnyf.supabase.co'
const defaultAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0cGh3ZmRzb3JvZ2VtY21jbnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzAxOTMsImV4cCI6MjA3OTU0NjE5M30.BAR8huPc4eghksLrGfxZCFzS4TMDUhy5xqvied6wXJM'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'acmnumlDB'

// Initialize Supabase client
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get public URL prefix
function getPublicPrefix() {
  const baseUrl = supabaseUrl.replace(/\/$/, '')
  return `${baseUrl}/storage/v1/object/public/${supabaseBucket}/`
}

function getStoragePathFromUrl(publicUrl) {
  if (!publicUrl) return null
  const prefix = getPublicPrefix()
  if (publicUrl.startsWith(prefix)) {
    return publicUrl.slice(prefix.length)
  }
  try {
    const url = new URL(publicUrl, supabaseUrl)
    const segments = url.pathname.split(`/${supabaseBucket}/`)
    return segments[1] || null
  } catch {
    return null
  }
}

async function deleteFromSupabase(pathOrUrl) {
  if (!pathOrUrl) return
  try {
    const bucket = supabaseClient.storage.from(supabaseBucket)
    const path = pathOrUrl.includes('/storage/v1/object/')
      ? getStoragePathFromUrl(pathOrUrl)
      : pathOrUrl
    if (!path) return
    const { error } = await bucket.remove([path])
    if (error) {
      console.warn('Failed to delete file from Supabase:', error.message)
    }
  } catch (error) {
    console.warn('Error in deleteFromSupabase:', error.message)
  }
}

async function uploadToSupabase(file, folder = 'media') {
  if (!file) {
    throw new Error('No file provided')
  }
  
  try {
    const fileExt = file.name.split('.').pop()
    const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    const bucket = supabaseClient.storage.from(supabaseBucket)

    const { error } = await bucket.upload(filePath, file, {
      cacheControl: '31536000', // 1 year cache for better performance
      upsert: false,
    })

    if (error) {
      throw new Error(error.message || 'Upload failed')
    }

    // Get public URL - Supabase format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const {
      data: { publicUrl },
    } = bucket.getPublicUrl(filePath)

    return { url: publicUrl, path: filePath }
  } catch (error) {
    console.error('Error in uploadToSupabase:', error)
    throw error
  }
}

// Export everything at the end
export const supabase = supabaseClient
export { getStoragePathFromUrl, deleteFromSupabase, uploadToSupabase }
