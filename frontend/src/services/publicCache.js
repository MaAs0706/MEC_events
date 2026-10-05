const CACHE_PREFIX = 'nexus.public-cache.'
const memoryCache = new Map()

export const PUBLIC_CACHE_TTL_MS = 30_000

function storageKey(key) {
  return `${CACHE_PREFIX}${key}`
}

export function readPublicCache(key) {
  const inMemory = memoryCache.get(key)
  if (inMemory) return inMemory

  try {
    const rawValue = sessionStorage.getItem(storageKey(key))
    if (!rawValue) return null

    const cachedValue = JSON.parse(rawValue)
    if (!cachedValue || typeof cachedValue.savedAt !== 'number' || !('data' in cachedValue)) {
      sessionStorage.removeItem(storageKey(key))
      return null
    }

    memoryCache.set(key, cachedValue)
    return cachedValue
  } catch {
    return null
  }
}

export function writePublicCache(key, data) {
  const cachedValue = { data, savedAt: Date.now() }
  memoryCache.set(key, cachedValue)

  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(cachedValue))
  } catch {
    // Caching is an enhancement. The page still works if browser storage is unavailable.
  }

  return cachedValue
}

export function isPublicCacheFresh(cachedValue, maxAge = PUBLIC_CACHE_TTL_MS) {
  return Boolean(cachedValue && Date.now() - cachedValue.savedAt < maxAge)
}

export function clearPublicCache(key) {
  memoryCache.delete(key)
  try {
    sessionStorage.removeItem(storageKey(key))
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
