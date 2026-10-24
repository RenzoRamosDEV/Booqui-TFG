import { render, screen } from '@testing-library/react'
import { DemoBadge } from './DemoBadge'

describe('DemoBadge', () => {
  it('labels the app as a demo with simulated data and explains it', () => {
    render(<DemoBadge />)
    const badge = screen.getByText('Demo · datos simulados')
    expect(badge.closest('[role="note"]')).toHaveAccessibleDescription(
      /no hay servidor.*navegador/i,
    )
  })
})
