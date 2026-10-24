import { z } from 'zod'
import { zodResolver } from './zod-resolver'

const schema = z
  .object({
    name: z.string().min(2, 'Muy corto'),
    age: z.coerce.number().int('Entero').min(18, 'Mayor de edad'),
    nested: z.object({ city: z.string().min(1, 'Ciudad obligatoria') }),
  })
  .refine((values) => values.name !== 'root', { message: 'Nombre reservado', path: ['name'] })

const resolve = zodResolver(schema)
const options = { fields: {}, shouldUseNativeValidation: false }

describe('zodResolver', () => {
  it('returns the parsed values and no errors when valid', async () => {
    const result = await resolve(
      { name: 'Mel', age: '30', nested: { city: 'Madrid' } },
      undefined,
      options,
    )

    expect(result).toEqual({
      values: { name: 'Mel', age: 30, nested: { city: 'Madrid' } },
      errors: {},
    })
  })

  it('returns errors keyed by path and no values when invalid', async () => {
    const result = await resolve({ name: 'M', age: '12', nested: { city: '' } }, undefined, options)

    expect(result.values).toEqual({})
    expect(result.errors).toEqual({
      name: { type: 'too_small', message: 'Muy corto' },
      age: { type: 'too_small', message: 'Mayor de edad' },
      nested: { city: { type: 'too_small', message: 'Ciudad obligatoria' } },
    })
  })

  it('keeps only the first message of a field', async () => {
    const twoRules = zodResolver(
      z.object({ code: z.string().min(3, 'Primero').regex(/^\d+$/, 'Segundo') }),
    )

    const result = await twoRules({ code: 'a' }, undefined, options)

    expect(result.errors).toEqual({ code: { type: 'too_small', message: 'Primero' } })
  })

  it('reports refinements on their path', async () => {
    const result = await resolve(
      { name: 'root', age: 20, nested: { city: 'x' } },
      undefined,
      options,
    )

    expect(result.errors).toEqual({ name: { type: 'custom', message: 'Nombre reservado' } })
  })

  it('reports object-level issues without a path under root', async () => {
    const whole = zodResolver(z.object({ a: z.string() }).refine(() => false, 'Todo mal'))

    const result = await whole({ a: 'x' }, undefined, options)

    expect(result.errors).toEqual({ root: { type: 'custom', message: 'Todo mal' } })
  })
})
