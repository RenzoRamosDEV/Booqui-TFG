import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

type ErrorTree = Record<string, unknown>

function setFirst(tree: ErrorTree, path: string[], error: { type: string; message: string }) {
  const [head, ...rest] = path as [string, ...string[]]
  if (rest.length === 0) {
    tree[head] ??= error
    return
  }
  setFirst((tree[head] ??= {}) as ErrorTree, rest, error)
}

/** Minimal stand-in for `@hookform/resolvers/zod`: first message per field, nested by path. */
export function zodResolver<Input extends FieldValues, Output extends FieldValues>(
  schema: z.ZodType<Output, Input>,
): Resolver<Input, unknown, Output> {
  return async (values) => {
    const result = await schema.safeParseAsync(values)
    if (result.success) return { values: result.data, errors: {} }
    const errors: ErrorTree = {}
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.map(String) : ['root']
      setFirst(errors, path, { type: issue.code, message: issue.message })
    }
    return { values: {}, errors: errors as FieldErrors<Input> }
  }
}
