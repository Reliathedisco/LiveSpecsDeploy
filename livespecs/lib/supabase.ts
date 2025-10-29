import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://clfqwbtpfkclogfdjglf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZnF3YnRwZmtjbG9nZmRqZ2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzY1NTMsImV4cCI6MjA3NzIxMjU1M30.bp89vzXDsNOVQVnjwUscenOXacm_7WgA4OVi9zCFvFc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getSupabaseClient() {
  return supabase
}
