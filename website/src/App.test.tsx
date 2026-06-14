import { render, screen } from '@testing-library/react'
import App from './App'

describe('Yawab landing page', () => {
  beforeEach(() => {
    render(<App />)
  })

  test('renders the hero h1 headline', () => {
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  test('renders Download section with primary download button', () => {
    const section = screen.getByRole('region', { name: /download/i })
    expect(section.querySelector('[data-slot="primary"]')).toBeInTheDocument()
  })

  test('renders at least 4 feature headings', () => {
    const section = screen.getByRole('region', { name: /features/i })
    const headings = section.querySelectorAll('h3')
    expect(headings.length).toBeGreaterThanOrEqual(4)
  })
})
