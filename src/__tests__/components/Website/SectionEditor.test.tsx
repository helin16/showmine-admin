import React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { vi } from 'vitest'
import SectionEditor, {
  ADDABLE_SECTION_TYPES,
  checkSection,
  isLink,
  newSection,
} from '../../../Components/Website/SectionEditors'
import { renderWithProviders } from '../../testUtils'

// The section editors (specs/001-website-builder, US2, T026).
vi.mock('../../../Components/Form/RichTextEditor', () => ({
  default: ({
    value,
    onChange,
    toolbar,
    plugins,
  }: {
    value: string
    onChange: (v: string) => void
    toolbar?: string
    plugins?: string[]
  }) => (
    <textarea
      aria-label={'rich text'}
      data-toolbar={toolbar}
      data-plugins={(plugins || []).join(',')}
      defaultValue={value}
      onBlur={(e) => onChange(e.target.value)}
    />
  ),
}))

const renderEditor = (section: object, errors = {}) => {
  const onChange = vi.fn()
  renderWithProviders(<SectionEditor section={{ id: 's1', ...section } as never} onChange={onChange} errors={errors} />)
  return onChange
}

describe('newSection', () => {
  test.each(ADDABLE_SECTION_TYPES)('makes a %s section with its own id', (type) => {
    const a = newSection(type)
    const b = newSection(type)
    expect(a.type).toBe(type)
    expect(a.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(a.id).not.toBe(b.id)
  })

  test('image and gallery cannot be added until the image library arrives', () => {
    expect(ADDABLE_SECTION_TYPES).not.toContain('image')
    expect(ADDABLE_SECTION_TYPES).not.toContain('gallery')
  })
})

describe('hero', () => {
  test('edits each field within its limit', () => {
    const onChange = renderEditor({ type: 'hero', heading: 'Hi' })
    expect(screen.getByLabelText('Heading')).toHaveAttribute('maxlength', '120')
    expect(screen.getByLabelText('Subheading')).toHaveAttribute('maxlength', '300')
    expect(screen.getByLabelText('Button text')).toHaveAttribute('maxlength', '40')

    fireEvent.change(screen.getByLabelText('Heading'), { target: { value: 'Welcome' } })
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'hero', heading: 'Welcome' })
  })

  test('a cleared link is left out rather than saved empty', () => {
    const onChange = renderEditor({ type: 'hero', heading: 'Hi', buttonUrl: '/about' })
    fireEvent.change(screen.getByLabelText(/Button link/), { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'hero', heading: 'Hi' })
  })

  test('shows a problem on its field', () => {
    renderEditor({ type: 'hero', heading: 'Hi' }, { heading: 'Too long.' })
    expect(screen.getByRole('alert')).toHaveTextContent('Too long.')
    expect(screen.getByLabelText('Heading')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('text', () => {
  test('uses the rich text editor without upload buttons', () => {
    const onChange = renderEditor({ type: 'text', html: '<p>a</p>' })
    const editor = screen.getByLabelText('rich text')
    expect(editor.getAttribute('data-toolbar')).not.toMatch(/image|media|customInsertButton/)
    expect(editor.getAttribute('data-plugins')).not.toMatch(/image|media/)
    fireEvent.blur(editor, { target: { value: '<p>b</p>' } })
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'text', html: '<p>b</p>' })
  })
})

describe('contact', () => {
  test('switches each detail and edits the map link', () => {
    const onChange = renderEditor({ type: 'contact', showPhone: true, showEmail: false })
    expect(screen.getByLabelText('Show the phone number')).toBeChecked()
    fireEvent.click(screen.getByLabelText('Show the email'))
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'contact', showPhone: true, showEmail: true })
    fireEvent.change(screen.getByLabelText('Map link (https)'), { target: { value: 'https://maps.test/x' } })
    expect(onChange).toHaveBeenLastCalledWith({
      id: 's1',
      type: 'contact',
      showPhone: true,
      showEmail: false,
      mapUrl: 'https://maps.test/x',
    })
  })
})

describe('articles', () => {
  test('a count from 3 to 12, and an optional tag', () => {
    const onChange = renderEditor({ type: 'articles', count: 3 })
    const count = screen.getByLabelText('Number of articles (3 to 12)')
    expect(count).toHaveAttribute('aria-valuemin', '3')
    expect(count).toHaveAttribute('aria-valuemax', '12')
    fireEvent.change(screen.getByLabelText('Only articles with this tag (optional)'), { target: { value: 'news' } })
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'articles', count: 3, tagName: 'news' })
  })
})

test('image and gallery sections say they wait for the image library', () => {
  renderEditor({ type: 'gallery', images: [] })
  expect(screen.getByText(/once the image library is available/)).toBeInTheDocument()
})

describe('checks before saving', () => {
  test.each([
    ['/about', true],
    ['https://a.test', true],
    ['http://a.test', true],
    ['mailto:a@b.test', true],
    ['tel:0300', true],
    ['javascript:alert(1)', false],
    ['about', false],
    ['/About', false],
    ['//evil.test', false],
  ])('%s is a link: %s', (link, expected) => {
    expect(isLink(link)).toBe(expected)
  })

  test('a bad button link or a map link that is not https is named', () => {
    expect(checkSection({ id: 's', type: 'hero', buttonUrl: 'javascript:x' })).toStrictEqual({
      buttonUrl: 'Use a web, email or phone link, or /page-name.',
    })
    expect(checkSection({ id: 's', type: 'contact', mapUrl: 'http://maps.test' })).toStrictEqual({
      mapUrl: 'Use a link starting with https://.',
    })
    expect(checkSection({ id: 's', type: 'hero', buttonUrl: '/about' })).toStrictEqual({})
  })
})
