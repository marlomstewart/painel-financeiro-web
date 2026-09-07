import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { MetasCategorias } from './MetasCategorias'

test('mantém nome longo e ações acessíveis para categoria de garagem', () => {
  render(<MetasCategorias
    categorias={[{ id: 'gas', nome: 'Categoria de garagem com um nome bastante longo para celular', meta: 100, tipo: 'despesa', is_garagem: true }]}
    addCategoria={vi.fn()} editarSetup={vi.fn()} removerSetup={vi.fn()}
    modal={{ prompt: vi.fn(), options: vi.fn(), confirm: vi.fn() }} temGaragem showToast={vi.fn()}
  />)

  const nome = screen.getByText('Categoria de garagem com um nome bastante longo para celular')
  expect(nome.className).toContain('line-clamp-2')
  expect(screen.getByText('Garagem')).toBeTruthy()
  expect(screen.getByTitle('Editar')).toBeTruthy()
  expect(screen.getByTitle('Excluir')).toBeTruthy()
})
