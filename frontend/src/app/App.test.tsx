import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('renders a main landmark', () => {
    render(<App />)

    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
