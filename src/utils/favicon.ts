/**
 * Derives a favicon image URL for a given app URL using Google's public
 * favicon service, so dashboard tiles can show each site's real icon
 * without needing anyone to manually track down and upload logo files.
 * Returns null if the URL can't be parsed.
 */
export function faviconUrlFor(appUrl: string, size = 128): string | null {
  try {
    const { hostname } = new URL(appUrl)
    return `https://www.google.com/s2/favicons?sz=${size}&domain=${hostname}`
  } catch {
    return null
  }
}
