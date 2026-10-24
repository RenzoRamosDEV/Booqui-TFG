import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs } from './Tabs'

const items = [
  { id: 'info', label: 'Información', content: <p>Panel info</p> },
  { id: 'tickets', label: 'Entradas', content: <p>Panel entradas</p> },
  { id: 'map', label: 'Mapa', content: <p>Panel mapa</p> },
]

function setup(defaultValue?: string) {
  const onChange = vi.fn()
  render(<Tabs label="Detalle" items={items} defaultValue={defaultValue} onChange={onChange} />)
  return { onChange, tab: (name: string) => screen.getByRole('tab', { name }) }
}

describe('Tabs', () => {
  it('selects the first tab by default and shows its panel', () => {
    const { tab } = setup()

    expect(screen.getByRole('tablist', { name: 'Detalle' })).toBeInTheDocument()
    expect(tab('Información')).toHaveAttribute('aria-selected', 'true')
    expect(tab('Entradas')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tabpanel', { name: 'Información' })).toHaveTextContent('Panel info')
  })

  it('uses roving tabindex', () => {
    const { tab } = setup('tickets')

    expect(tab('Entradas')).toHaveAttribute('tabindex', '0')
    expect(tab('Información')).toHaveAttribute('tabindex', '-1')
    expect(tab('Mapa')).toHaveAttribute('tabindex', '-1')
  })

  it('activates a tab on click', async () => {
    const { tab, onChange } = setup()

    await userEvent.click(tab('Mapa'))

    expect(tab('Mapa')).toHaveAttribute('aria-selected', 'true')
    expect(onChange).toHaveBeenCalledWith('map')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel mapa')
  })

  it.each([
    ['Información', '{ArrowRight}', 'Entradas'],
    ['Mapa', '{ArrowRight}', 'Información'],
    ['Entradas', '{ArrowLeft}', 'Información'],
    ['Información', '{ArrowLeft}', 'Mapa'],
    ['Entradas', '{Home}', 'Información'],
    ['Información', '{End}', 'Mapa'],
  ])('from %s, %s moves focus and selection to %s', async (start, key, expected) => {
    const startId = items.find((item) => item.label === start)!.id
    const { tab } = setup(startId)
    tab(start).focus()

    await userEvent.keyboard(key)

    expect(tab(expected)).toHaveFocus()
    expect(tab(expected)).toHaveAttribute('aria-selected', 'true')
  })

  it('ignores other keys', async () => {
    const { tab, onChange } = setup()
    tab('Información').focus()

    await userEvent.keyboard('{ArrowDown}')

    expect(tab('Información')).toHaveAttribute('aria-selected', 'true')
    expect(onChange).not.toHaveBeenCalled()
  })
})
