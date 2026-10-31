import React from 'react'
import { act, render, screen } from '@testing-library/react'
import InlineRichTextEditor from '../../../Components/Form/InlineRichTextEditor'

const editor = vi.hoisted(() => ({ props: {} as Record<string, any> })) // eslint-disable-line

vi.mock('@tinymce/tinymce-react', () => ({
  Editor: (props: Record<string, unknown>) => {
    editor.props = props
    return <div data-testid='editor'>{props.value as string}</div>
  },
}))

const type = (text: string) => {
  act(() => editor.props.onEditorChange(text))
  act(() => editor.props.onBlur())
}
const outerDiv = () => screen.getByTestId('editor').parentElement?.parentElement

describe('InlineRichTextEditor', () => {
  test('shows the value and passes the editor options on', () => {
    render(<InlineRichTextEditor value='Hello' isInLine showToolBar={false} placeholder='Write' />)
    expect(screen.getByTestId('editor')).toHaveTextContent('Hello')
    expect(editor.props.init).toMatchObject({ inline: true, menubar: false, placeholder: 'Write' })
  })

  test('defaults to a block editor with a toolbar', () => {
    render(<InlineRichTextEditor value='' />)
    expect(editor.props.init).toMatchObject({ inline: false, menubar: true })
  })

  test('follows a new value from the parent', () => {
    const { rerender } = render(<InlineRichTextEditor value='one' />)
    rerender(<InlineRichTextEditor value='two' />)
    expect(screen.getByTestId('editor')).toHaveTextContent('two')
  })

  test('reports a changed value', () => {
    const onChange = vi.fn()
    render(<InlineRichTextEditor value='a' onChange={onChange} />)
    type('b')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('b')
  })

  test('stays quiet when the value did not change', () => {
    const onChange = vi.fn()
    render(<InlineRichTextEditor value='a' onChange={onChange} />)
    type('a')
    expect(onChange).not.toHaveBeenCalled()
  })

  test('keeps the new value without onChange', () => {
    render(<InlineRichTextEditor value='a' />)
    type('b')
    expect(screen.getByTestId('editor')).toHaveTextContent('b')
  })

  test('has no fixed size by default', () => {
    render(<InlineRichTextEditor value='' />)
    expect(outerDiv()).not.toHaveClass('has-height')
  })

  test('uses the height as the max height too', () => {
    render(<InlineRichTextEditor value='' height='200px' />)
    expect(outerDiv()).toHaveClass('has-height')
    expect(outerDiv()).toHaveStyle({ height: '200px', maxHeight: '200px' })
  })

  test('prefers an explicit max height', () => {
    render(<InlineRichTextEditor value='' height='200px' maxHeight='300px' />)
    expect(outerDiv()).toHaveStyle({ height: '200px', maxHeight: '300px' })
  })
})
