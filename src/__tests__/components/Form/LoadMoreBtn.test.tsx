import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoadMoreBtn from '../../../Components/Form/LoadMoreBtn'

describe('LoadMoreBtn', () => {
  test.each([[undefined], [false]])('stays hidden when showing is %s', (showing) => {
    const { container } = render(<LoadMoreBtn showing={showing} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<LoadMoreBtn showing onClick={onClick} />)
    await userEvent.click(screen.getByRole('button', { name: /load more/ }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('does not fail without onClick', async () => {
    render(<LoadMoreBtn showing />)
    await userEvent.click(screen.getByRole('button', { name: /load more/ }))
    expect(screen.getByRole('button', { name: /load more/ })).toBeInTheDocument()
  })

  test('shows the down arrow by default', () => {
    const { container } = render(<LoadMoreBtn showing />)
    expect(container.querySelector('.anticon-arrow-down')).toBeInTheDocument()
  })

  test('shows a custom icon instead of the arrow', () => {
    const { container } = render(<LoadMoreBtn showing icon={<i data-testid='custom' />} />)
    expect(screen.getByTestId('custom')).toBeInTheDocument()
    expect(container.querySelector('.anticon-arrow-down')).not.toBeInTheDocument()
  })

  test('does not fire while loading', async () => {
    const onClick = vi.fn()
    const { container } = render(<LoadMoreBtn showing loading onClick={onClick} />)
    expect(container.querySelector('.ant-btn-loading')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
