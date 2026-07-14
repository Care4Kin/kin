import { useState, useEffect } from 'react'
import { useFetch } from './useFetch'

// Fetches a list resource and mirrors it into local state so pages can
// optimistically add/update/remove items after create/edit/delete calls
// without waiting on a refetch.
export function useResourceList(fetchFn, deps, enabled = true) {
  const { data, loading, error } = useFetch(fetchFn, deps, enabled)
  const [items, setItems] = useState([])

  useEffect(() => { if (data) setItems(data) }, [data])

  return { items, setItems, loading, error }
}
