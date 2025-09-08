import { describe, expect, test, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

describe('Login page', () => {
  test('renders login form', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/Ingreso Administrador/i)).toBeInTheDocument()
  })

  test('redirects to /admin after successful login', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      status: 200,
      json: async () => ({ accessToken: 'fake', user: { id: '1', email: 'admin@demo.cl', role: 'Admin' } }),
    } as any)

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'admin@demo.cl' } })
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Admin!123' } })
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }))

    await waitFor(() => {
      expect(screen.getByText(/Bienvenido, Admin/i)).toBeInTheDocument()
    })
    fetchSpy.mockRestore()
  })
})

