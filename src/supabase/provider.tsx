'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from './client'

interface SupabaseContextType {
  supabase: SupabaseClient
}

const SupabaseContext = createContext<SupabaseContextType | null>(null)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient())

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context.supabase
}
