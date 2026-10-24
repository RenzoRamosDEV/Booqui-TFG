import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Input } from '../../../components/ui/Input'

type PersonValues = {
  firstName: string
  lastName: string
  dateOfBirth: string
  contactEmail: string
  contactPhone: string
}

export function PersonFields<T extends PersonValues>({
  register,
  errors,
}: {
  register: UseFormRegister<T>
  errors: FieldErrors<PersonValues>
}) {
  const field = register as unknown as UseFormRegister<PersonValues>
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...field('firstName')}
        />
        <Input
          label="Apellidos"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...field('lastName')}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Fecha de nacimiento"
          type="date"
          autoComplete="bday"
          error={errors.dateOfBirth?.message}
          {...field('dateOfBirth')}
        />
        <Input
          label="Teléfono (opcional)"
          type="tel"
          autoComplete="tel"
          placeholder="+34600111222"
          error={errors.contactPhone?.message}
          {...field('contactPhone')}
        />
      </div>
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.contactEmail?.message}
        {...field('contactEmail')}
      />
    </>
  )
}
