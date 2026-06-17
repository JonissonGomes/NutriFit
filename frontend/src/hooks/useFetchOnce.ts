import { useEffect, useRef } from 'react'

interface UseFetchOnceOptions {
  enabled?: boolean
  deps?: unknown[]
}

/**
 * Executa um fetch uma vez por chave estável; cancela ao desmontar ou trocar deps.
 */
export function useFetchOnce(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<void>,
  options: UseFetchOnceOptions = {}
) {
  const { enabled = true, deps = [] } = options
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    void fetcherRef.current(controller.signal)

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, ...deps])
}
