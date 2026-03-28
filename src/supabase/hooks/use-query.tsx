'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSupabase } from '../provider'

type QueryBuilder = (query: any) => any

interface UseSupabaseQueryOptions {
  realtime?: boolean
  /** Extra dependencies that should trigger a re-fetch when changed */
  deps?: any[]
  /** Polling interval in milliseconds. When set, data will be re-fetched at this interval */
  pollingInterval?: number
}

export function useSupabaseQuery<T>(
  table: string | null,
  queryBuilder?: QueryBuilder,
  options?: UseSupabaseQueryOptions
) {
  const supabase = useSupabase()
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const queryBuilderRef = useRef(queryBuilder)
  queryBuilderRef.current = queryBuilder

  // Serialize deps to a string so it can be used as a stable dependency
  const depsKey = options?.deps ? JSON.stringify(options.deps) : ''

  const fetchData = useCallback(async (isInitial = false) => {
    if (!table) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    if (isInitial) setLoading(true)
    try {
      let query = supabase.from(table).select('*')
      if (queryBuilderRef.current) {
        query = queryBuilderRef.current(query)
      }
      const { data: result, error: queryError } = await query
      if (queryError) {
        setError(new Error(queryError.message))
        setData(null)
      } else {
        setData(result as T[])
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setData(null)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, table, depsKey])

  useEffect(() => {
    fetchData(true)
  }, [fetchData])

  // Realtime subscription
  useEffect(() => {
    if (!table || !options?.realtime) return

    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, table, options?.realtime, fetchData])

  // Polling interval
  useEffect(() => {
    if (!table || !options?.pollingInterval || options.pollingInterval <= 0) return

    const interval = setInterval(() => {
      fetchData()
    }, options.pollingInterval)

    return () => clearInterval(interval)
  }, [table, options?.pollingInterval, fetchData])

  return { data, loading, error, refetch: fetchData }
}
