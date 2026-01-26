// utils.js

/**
 * Build a full page URL with optional query params
 * Example:
 * createPageUrl('/products', { page: 2, search: 'shirt' })
 * => "/products?page=2&search=shirt"
 */
export function createPageUrl(basePath, queryParams) {
  if (!queryParams) return basePath;

  const query = Object.entries(queryParams)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");

  return query ? `${basePath}?${query}` : basePath;
}
