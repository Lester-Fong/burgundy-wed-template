export function safeExternalUrl(value?: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

/** Only a client-verified Google Maps link should be supplied to the venue template. */
export function safeGoogleMapsUrl(value?: string): string | undefined {
  const safe = safeExternalUrl(value)
  if (!safe) return undefined

  const url = new URL(safe)
  if (url.username || url.password) return undefined
  if (url.hostname === 'maps.app.goo.gl' || url.hostname === 'maps.google.com') return safe
  if (
    (url.hostname === 'google.com' || url.hostname === 'www.google.com') &&
    (url.pathname === '/maps' || url.pathname.startsWith('/maps/'))
  )
    return safe
  return undefined
}
