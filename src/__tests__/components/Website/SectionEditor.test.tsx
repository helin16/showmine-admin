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
let pickResult: object[] = []
let pickerProps: { multiple?: boolean; max?: number } = {}
vi.mock('../../../Components/Website/MediaPicker', () => ({
  default: (props: { open: boolean; multiple?: boolean; max?: number; onPick: (images: object[]) => void }) => {
    pickerProps = props
    return props.open ? (
      <button onClick={() => props.onPick(pickResult)}>{props.multiple ? 'pick (several)' : 'pick (one)'}</button>
    ) : null
  },
}))
vi.mock('../../../Components/Form/RichTextEditor', () => ({
  default: ({
    value,
    onLiveChange,
    toolbar,
    plugins,
  }: {
    value: string
    onLiveChange: (v: string) => void
    toolbar?: string
    plugins?: string[]
  }) => (
    <textarea
      aria-label={'rich text'}
      data-toolbar={toolbar}
      data-plugins={(plugins || []).join(',')}
      defaultValue={value}
      onChange={(e) => onLiveChange(e.target.value)}
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

  test('an image beside text starts with the image on the left (spec 005)', () => {
    expect(ADDABLE_SECTION_TYPES.indexOf('split')).toBe(1)
    expect(newSection('split')).toMatchObject({ type: 'split', heading: '', imageSide: 'left' })
  })

  test('image and gallery can be added now', () => {
    expect(ADDABLE_SECTION_TYPES).toEqual(expect.arrayContaining(['image', 'gallery']))
    expect(newSection('gallery')).toMatchObject({ type: 'gallery', images: [] })
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

  // specs/005-website-blocks, slice 88a
  test('edits a second button and a note within their limits', () => {
    const onChange = renderEditor({ type: 'hero', heading: 'Hi' })
    expect(screen.getByLabelText('Second button text')).toHaveAttribute('maxlength', '40')
    expect(screen.getByLabelText('Second button link')).toHaveAttribute('maxlength', '2000')
    expect(screen.getByLabelText('Small note under the buttons')).toHaveAttribute('maxlength', '200')
    fireEvent.change(screen.getByLabelText('Second button text'), { target: { value: 'Login' } })
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'hero', heading: 'Hi', button2Text: 'Login' })
    fireEvent.change(screen.getByLabelText('Small note under the buttons'), { target: { value: 'Free' } })
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'hero', heading: 'Hi', note: 'Free' })
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
    fireEvent.change(editor, { target: { value: '<p>b</p>' } })
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

describe('images', () => {
  const images = {
    a1: { id: 'a1', url: 'https://cdn.test/a1.png', fileName: 'shop.png', type: 'WEBSITE', companyId: 'co-1' },
    a2: { id: 'a2', url: 'https://cdn.test/a2.png', fileName: 'team.png', type: 'WEBSITE', companyId: 'co-1' },
    gone: null,
  }
  const renderWithImages = (section: object, picked: object[] = [], errors = {}) => {
    const onChange = vi.fn()
    const onImagesPicked = vi.fn()
    pickResult = picked
    renderWithProviders(
      <SectionEditor
        section={{ id: 's1', ...section } as never}
        onChange={onChange}
        errors={errors}
        images={images as never}
        onImagesPicked={onImagesPicked}
      />,
    )
    return { onChange, onImagesPicked }
  }

  test('a hero image is optional: chosen, shown and removed', () => {
    const { onChange, onImagesPicked } = renderWithImages({ type: 'hero', heading: 'Hi' }, [images.a1])
    expect(screen.getByText('No image')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Choose image' }))
    fireEvent.click(screen.getByRole('button', { name: 'pick (one)' }))
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'hero', heading: 'Hi', imageAssetId: 'a1' })
    expect(onImagesPicked).toHaveBeenCalledWith([images.a1])
  })

  test('a chosen hero image shows its thumbnail and can be removed', () => {
    const { onChange } = renderWithImages({ type: 'hero', heading: 'Hi', imageAssetId: 'a1' })
    expect(screen.getByRole('img', { name: 'shop.png' })).toHaveAttribute('src', 'https://cdn.test/a1.png')
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }))
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'hero', heading: 'Hi' })
  })

  test('an image section edits its image, description and caption; its image cannot be removed', () => {
    const { onChange } = renderWithImages({ type: 'image', assetId: 'a1' }, [images.a2])
    expect(screen.queryByRole('button', { name: 'Remove image' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Description for screen readers')).toHaveAttribute('maxlength', '200')
    expect(screen.getByLabelText('Caption')).toHaveAttribute('maxlength', '300')
    fireEvent.click(screen.getByRole('button', { name: 'Change image' }))
    fireEvent.click(screen.getByRole('button', { name: 'pick (one)' }))
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'image', assetId: 'a2' })
  })

  test('a missing image is marked', () => {
    renderWithImages({ type: 'image', assetId: 'gone' })
    expect(screen.getByText('This image is missing. Choose another.')).toBeInTheDocument()
  })

  test('a gallery adds several images in order, describes, moves and removes them', () => {
    const { onChange } = renderWithImages({ type: 'gallery', images: [{ assetId: 'a1' }] }, [images.a2, images.a1])
    fireEvent.click(screen.getByRole('button', { name: 'Add images' }))
    expect(pickerProps.multiple).toBe(true)
    expect(pickerProps.max).toBe(23)
    fireEvent.click(screen.getByRole('button', { name: 'pick (several)' }))
    expect(onChange).toHaveBeenLastCalledWith({
      id: 's1',
      type: 'gallery',
      images: [{ assetId: 'a1' }, { assetId: 'a2' }, { assetId: 'a1' }],
    })

    fireEvent.change(screen.getByLabelText('Description of image 1'), { target: { value: 'Front' } })
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'gallery', images: [{ assetId: 'a1', alt: 'Front' }] })
  })

  test('gallery images move and are removed', () => {
    const { onChange } = renderWithImages({
      type: 'gallery',
      images: [{ assetId: 'a1' }, { assetId: 'a2', alt: 'Team' }],
    })
    fireEvent.click(screen.getByRole('button', { name: 'Move image 1 down' }))
    expect(screen.getByText('Image moved to position 2.')).toBeInTheDocument()
    expect(onChange).toHaveBeenLastCalledWith({
      id: 's1',
      type: 'gallery',
      images: [{ assetId: 'a2', alt: 'Team' }, { assetId: 'a1' }],
    })
    fireEvent.click(screen.getByRole('button', { name: 'Remove image 2' }))
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'gallery', images: [{ assetId: 'a1' }] })
    fireEvent.change(screen.getByLabelText('Description of image 2'), { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith({
      id: 's1',
      type: 'gallery',
      images: [{ assetId: 'a1' }, { assetId: 'a2' }],
    })
  })

  test('a full gallery cannot add more', () => {
    renderWithImages({ type: 'gallery', images: Array.from({ length: 24 }, () => ({ assetId: 'a1' })) })
    expect(screen.getByRole('button', { name: 'Add images' })).toBeDisabled()
  })

  test('problems from the API show on the gallery image', () => {
    renderWithImages({ type: 'gallery', images: [{ assetId: 'a1' }] }, [], { 'images[0].assetId': 'Missing.' })
    expect(screen.getByRole('alert')).toHaveTextContent('Missing.')
  })

  test('an image beside text edits its text, image, description, side and buttons; its image cannot be removed', () => {
    const { onChange } = renderWithImages({ type: 'split', heading: 'Hi', imageAssetId: 'a1' }, [images.a2])
    expect(screen.queryByRole('button', { name: 'Remove image' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Heading')).toHaveAttribute('maxlength', '120')
    const text = screen.getByLabelText('Text (line breaks are kept)')
    expect(text.tagName).toBe('TEXTAREA')
    expect(text).toHaveAttribute('maxlength', '1000')
    expect(screen.getByLabelText('Description for screen readers')).toHaveAttribute('maxlength', '200')
    expect(screen.getByLabelText('Second button text')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Left' })).toBeChecked()
    expect(screen.getAllByRole('radiogroup')).toHaveLength(1)
    expect(screen.getByRole('radiogroup', { name: 'Image side' })).toContainElement(
      screen.getByRole('radio', { name: 'Right' }),
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Right' }))
    expect(onChange).toHaveBeenLastCalledWith({
      id: 's1',
      type: 'split',
      heading: 'Hi',
      imageAssetId: 'a1',
      imageSide: 'right',
    })
    fireEvent.change(text, { target: { value: 'One\nTwo' } })
    expect(onChange).toHaveBeenLastCalledWith({
      id: 's1',
      type: 'split',
      heading: 'Hi',
      imageAssetId: 'a1',
      text: 'One\nTwo',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Change image' }))
    fireEvent.click(screen.getByRole('button', { name: 'pick (one)' }))
    expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'split', heading: 'Hi', imageAssetId: 'a2' })
  })

  test('an image beside text shows its side as saved', () => {
    renderWithImages({ type: 'split', imageAssetId: 'a1', imageSide: 'right' })
    expect(screen.getByRole('radio', { name: 'Right' })).toBeChecked()
  })

  test('an image section needs an image and a gallery at least one, before saving', () => {
    expect(checkSection({ id: 's', type: 'image' })).toStrictEqual({ assetId: 'Choose an image.' })
    expect(checkSection({ id: 's', type: 'gallery', images: [] })).toStrictEqual({ images: 'Add at least one image.' })
    expect(checkSection({ id: 's', type: 'image', assetId: 'a1' })).toStrictEqual({})
  })
})

describe('checks before saving', () => {
  test.each([
    ['/about', true],
    ['https://a.test', true],
    ['http://a.test', true],
    ['mailto:a@b.test', true],
    ['tel:0300', true],
    ['tel:+44 20 7946 0958', true],
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

  test('the second button needs both its text and its link, and a good link; the first may have one alone', () => {
    const both = 'The second button needs both its text and its link.'
    expect(checkSection({ id: 's', type: 'hero', button2Text: 'Login' })).toStrictEqual({ button2Url: both })
    expect(checkSection({ id: 's', type: 'hero', button2Url: '/login' })).toStrictEqual({ button2Text: both })
    expect(checkSection({ id: 's', type: 'hero', button2Text: 'x', button2Url: 'javascript:x' })).toStrictEqual({
      button2Url: 'Use a web, email or phone link, or /page-name.',
    })
    expect(checkSection({ id: 's', type: 'hero', button2Text: 'x', button2Url: '/login' })).toStrictEqual({})
    expect(checkSection({ id: 's', type: 'hero', buttonText: 'Go' })).toStrictEqual({})
  })

  test('an image beside text needs an image, and its links are checked as the hero', () => {
    expect(checkSection({ id: 's', type: 'split' })).toStrictEqual({ imageAssetId: 'Choose an image.' })
    expect(
      checkSection({ id: 's', type: 'split', imageAssetId: 'a1', buttonUrl: 'nope', button2Text: 'x' }),
    ).toStrictEqual({
      buttonUrl: 'Use a web, email or phone link, or /page-name.',
      button2Url: 'The second button needs both its text and its link.',
    })
    expect(checkSection({ id: 's', type: 'split', imageAssetId: 'a1' })).toStrictEqual({})
  })
})
