/** Fields of `values` that differ from `original`. Empty strings are never sent: the backend ignores nulls. */
export function changedFields<T extends Record<string, unknown>>(
  original: Record<string, unknown>,
  values: T,
): Partial<T> {
  const diff: Partial<T> = {}
  for (const key of Object.keys(values) as Array<keyof T & string>) {
    const value = values[key]
    if (value === undefined || value === '') continue
    if (value !== original[key]) diff[key] = value
  }
  return diff
}
