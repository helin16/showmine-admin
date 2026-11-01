import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InlineInput from '../../../Components/Form/InlineInput'

const box = () => screen.getByRole('textbox') as HTMLInputElement

describe('InlineInput', () => {
  test('shows the value and passes other props to the input', () => {
    const { container } = render(<InlineInput value='Hello' placeholder='Title' className='title' />)
    expect(box()).toHaveValue('Hello')
    expect(box()).toHaveAttribute('placeholder', 'Title')
    expect(container.firstChild).toHaveClass('title')
  })

  test('follows a new value from the parent', () => {
    const { rerender } = render(<InlineInput value='one' />)
    rerender(<InlineInput value='two' />)
    expect(box()).toHaveValue('two')
  })

  test('saves only on blur', async () => {
    const onChange = vi.fn()
    render(<InlineInput value='a' onChange={onChange} />)
    await userEvent.type(box(), 'b')
    expect(box()).toHaveValue('ab')
    expect(onChange).not.toHaveBeenCalled()
    await userEvent.tab()
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('ab')
  })

  test('does not save when nothing changed', async () => {
    const onChange = vi.fn()
    render(<InlineInput value='a' onChange={onChange} />)
    await userEvent.click(box())
    await userEvent.tab()
    expect(onChange).not.toHaveBeenCalled()
  })

  test('keeps the typed text without onChange', async () => {
    render(<InlineInput value='' />)
    await userEvent.type(box(), 'x')
    await userEvent.tab()
    expect(box()).toHaveValue('x')
  })

  test('Enter leaves the field and saves', async () => {
    const onChange = vi.fn()
    render(<InlineInput value='' onChange={onChange} />)
    await userEvent.type(box(), 'x{Enter}')
    expect(box()).not.toHaveFocus()
    expect(onChange).toHaveBeenCalledWith('x')
  })

  test('Enter calls onPressEnter', async () => {
    const onPressEnter = vi.fn()
    render(<InlineInput value='' onPressEnter={onPressEnter} />)
    await userEvent.type(box(), 'x{Enter}')
    expect(onPressEnter).toHaveBeenCalledTimes(1)
  })
})
