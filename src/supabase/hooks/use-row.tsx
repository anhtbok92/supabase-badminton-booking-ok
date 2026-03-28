'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '../provider'

export function useSupabaseRow<T>(
  table: string | null,
  id: string | null
) {
  const supabase = useSupabase()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!table || !id) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)

    async function fetchRow() {
      try {
        const { data: result, error: queryError } = await supabase
          .from(table!)
          .select('*')
          .eq('id', id!)
          .single()

        if (cancelled) return

        if (queryError) {
          setError(new Error(queryError.message))
          setData(null)
        } else {
          setData(result as T)
          setError(null)
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error(String(err)))
        setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRow()

    return () => {
      cancelled = true
    }
  }, [supabase, table, id])

  return { data, loading, error }
}
