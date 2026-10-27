export function paginate<T>(
  items: T[],
  page: number,
  perPage: number,
): { items: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(items.length / perPage))
  const start = (page - 1) * perPage

  return {
    items: items.slice(start, start + perPage),
    page,
    pages,
  }
}
