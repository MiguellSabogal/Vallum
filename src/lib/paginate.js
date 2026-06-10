export const PAGE_SIZE = 24;

// Trocea una lista según ?page=N (1-based). Clampa valores fuera de rango.
export function paginate(all, rawPage, pageSize = PAGE_SIZE) {
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const parsed = parseInt(rawPage, 10);
  const page = Math.min(totalPages, Math.max(1, Number.isNaN(parsed) ? 1 : parsed));
  const items = all.slice((page - 1) * pageSize, page * pageSize);
  return { items, page, totalPages, totalCount };
}
