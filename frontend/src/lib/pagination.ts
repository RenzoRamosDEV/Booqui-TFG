export type PageItem = number | 'start-ellipsis' | 'end-ellipsis'

const MAX_ITEMS = 7
const EDGE_RUN = MAX_ITEMS - 2

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index)
}

export function getPageItems(current: number, total: number): PageItem[] {
  if (total <= MAX_ITEMS) return range(1, total)

  const page = Math.min(Math.max(current, 1), total)
  if (page < EDGE_RUN) return [...range(1, EDGE_RUN), 'end-ellipsis', total]
  if (page > total - EDGE_RUN + 1) {
    return [1, 'start-ellipsis', ...range(total - EDGE_RUN + 1, total)]
  }
  return [1, 'start-ellipsis', page - 1, page, page + 1, 'end-ellipsis', total]
}
