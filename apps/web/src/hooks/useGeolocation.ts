import { useCallback, useEffect, useState } from 'react'

export interface GeoCoords {
  lat: number
  lng: number
}

export type GeoStatus = 'idle' | 'prompt' | 'pending' | 'granted' | 'denied' | 'unsupported'

const STORAGE_KEY = 'offh.geo'

function read(): GeoCoords | null {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY)
    return v ? (JSON.parse(v) as GeoCoords) : null
  } catch {
    return null
  }
}

function persist(coords: GeoCoords) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coords))
  } catch {
    /* ignore */
  }
}

export function useGeolocation(opts?: { eager?: boolean }) {
  const [coords, setCoords] = useState<GeoCoords | null>(() => read())
  const [status, setStatus] = useState<GeoStatus>(() => (read() ? 'granted' : 'idle'))
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported')
      return
    }
    setStatus('pending')
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(next)
        persist(next)
        setStatus('granted')
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'idle')
        setError(err.message)
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000, enableHighAccuracy: false }
    )
  }, [])

  const clear = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setCoords(null)
    setStatus('idle')
  }, [])

  useEffect(() => {
    if (!opts?.eager || status !== 'idle' || coords) return
    const id = window.setTimeout(request, 0)
    return () => window.clearTimeout(id)
  }, [opts?.eager, status, coords, request])

  return { coords, status, error, request, clear }
}

/** 서울 시청 (위치 미제공 시 데모 폴백) */
export const SEOUL_FALLBACK: GeoCoords = { lat: 37.5665, lng: 126.978 }
