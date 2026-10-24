import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { Input } from './Input'
import { Select } from './Select'
import { Textarea } from './Textarea'

const controls = [
  {
    name: 'Input',
    role: 'textbox',
    element: HTMLInputElement,
    render: (props: { error?: string; ref?: React.Ref<HTMLInputElement> }) => (
      <Input label="Email" {...props} />
    ),
  },
  {
    name: 'Textarea',
    role: 'textbox',
    element: HTMLTextAreaElement,
    render: (props: { error?: string; ref?: React.Ref<HTMLTextAreaElement> }) => (
      <Textarea label="Email" {...props} />
    ),
  },
  {
    name: 'Select',
    role: 'combobox',
    element: HTMLSelectElement,
    render: (props: { error?: string; ref?: React.Ref<HTMLSelectElement> }) => (
      <Select label="Email" {...props}>
        <option value="a">A</option>
      </Select>
    ),
  },
] as const

describe.each(controls)('$name', ({ role, element, render: renderControl }) => {
  it('has a visible associated label', () => {
    render(renderControl({}))

    expect(screen.getByText('Email')).toBeVisible()
    expect(screen.getByRole(role, { name: 'Email' })).toBeInTheDocument()
  })

  it('without error is valid and has no description', () => {
    render(renderControl({}))
    const field = screen.getByRole(role, { name: 'Email' })

    expect(field).not.toHaveAttribute('aria-invalid')
    expect(field).not.toHaveAttribute('aria-describedby')
  })

  it('with an error is invalid and described by the message under the field', () => {
    render(renderControl({ error: 'Formato no válido' }))
    const field = screen.getByRole(role, { name: 'Email' })

    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription('Formato no válido')
    expect(screen.getByText('Formato no válido')).toBeVisible()
  })

  it('forwards its ref for React Hook Form', () => {
    const ref = createRef<InstanceType<typeof element>>()
    render(renderControl({ ref: ref as never }))

    expect(ref.current).toBeInstanceOf(element)
  })
})

describe('Input', () => {
  it('passes native props through', () => {
    render(<Input label="Nombre" name="firstName" placeholder="Ana" />)

    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveAttribute('name', 'firstName')
    expect(screen.getByPlaceholderText('Ana')).toBeInTheDocument()
  })

  it('keeps unique ids for two fields with the same label', () => {
    render(
      <>
        <Input label="Email" />
        <Input label="Email" error="Uno" />
      </>,
    )
    const [first, second] = screen.getAllByRole('textbox')

    expect(first!.id).not.toBe(second!.id)
    expect(second).toHaveAccessibleDescription('Uno')
  })
})
