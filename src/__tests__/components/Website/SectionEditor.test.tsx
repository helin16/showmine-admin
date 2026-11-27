import React from 'react'
import { fireEvent, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import SectionEditor, {
  ADDABLE_SECTION_TYPES,
  checkSection,
  getImageIds,
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

  test('a message form can be added, starting with an empty heading (spec 006)', () => {
    expect(ADDABLE_SECTION_TYPES).toContain('form')
    expect(newSection('form')).toMatchObject({ type: 'form', heading: '' })
  })

  test('pricing starts with one empty plan, a map at medium height (spec 005)', () => {
    expect(ADDABLE_SECTION_TYPES).toEqual(expect.arrayContaining(['pricing', 'map']))
    expect(ADDABLE_SECTION_TYPES.indexOf('pricing')).toBe(3)
    expect(newSection('pricing')).toMatchObject({ type: 'pricing', plans: [{ name: '', price: '' }] })
    expect(newSection('map')).toMatchObject({ type: 'map', height: 'medium' })
  })

  test('a card grid starts with three columns and one empty card (spec 005)', () => {
    expect(ADDABLE_SECTION_TYPES.indexOf('cards')).toBe(2)
    expect(newSection('cards')).toMatchObject({ type: 'cards', columns: '3', items: [{}] })
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

  // specs/006-website-message-form
  describe('message form', () => {
    test('edits its words within their limits; the visitor fields are not editable', () => {
      const onChange = renderEditor({ type: 'form', heading: 'Hi', buttonText: 'Go' })
      expect(screen.getByText(/Visitors fill in first name, last name, email and message/)).toBeInTheDocument()
      expect(screen.getByLabelText('Heading')).toHaveAttribute('maxlength', '120')
      expect(screen.getByLabelText('Intro')).toHaveAttribute('maxlength', '500')
      expect(screen.getByLabelText('Intro').tagName).toBe('TEXTAREA')
      expect(screen.getByLabelText('Button text (optional, Send)')).toHaveAttribute('maxlength', '40')
      expect(screen.getByLabelText('Thank-you note (optional)')).toHaveAttribute('maxlength', '300')
      expect(screen.getByLabelText('Thank-you note (optional)').tagName).toBe('TEXTAREA')
      fireEvent.change(screen.getByLabelText('Thank-you note (optional)'), { target: { value: 'Thanks!' } })
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        type: 'form',
        heading: 'Hi',
        buttonText: 'Go',
        thanks: 'Thanks!',
      })
      fireEvent.change(screen.getByLabelText('Button text (optional, Send)'), { target: { value: '' } })
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'form', heading: 'Hi' })
      expect(checkSection({ id: 's', type: 'form' })).toStrictEqual({})
    })

    // specs/007-website-hubspot-map
    const PORTAL = 'HubSpot portal ID'
    const FORM = 'HubSpot form ID'
    const FIELD = 'HubSpot field for the message (optional, message)'
    const NO_EMAIL = 'Do not email new messages (they still show in Website > Messages)'
    const GUID = '4fd8c4ec-a157-4e53-b588-52bcd1123e06'

    test('edits the HubSpot settings within their limits, and the no-email switch', () => {
      const onChange = renderEditor({ type: 'form', hubspotPortalId: '1' })
      expect(screen.getByText(/each message is also sent to that HubSpot form/)).toBeInTheDocument()
      expect(screen.getByLabelText(PORTAL)).toHaveAttribute('maxlength', '12')
      expect(screen.getByLabelText(PORTAL)).toHaveValue('1')
      expect(screen.getByLabelText(FORM)).toHaveAttribute('maxlength', '36')
      expect(screen.getByLabelText(FIELD)).toHaveAttribute('maxlength', '100')
      fireEvent.change(screen.getByLabelText(FORM), { target: { value: GUID } })
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'form', hubspotPortalId: '1', hubspotFormId: GUID })
      fireEvent.change(screen.getByLabelText(FIELD), { target: { value: 'comments' } })
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        type: 'form',
        hubspotPortalId: '1',
        hubspotMessageField: 'comments',
      })
      fireEvent.change(screen.getByLabelText(PORTAL), { target: { value: '' } })
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'form' })
      expect(screen.getByRole('checkbox', { name: NO_EMAIL })).not.toBeChecked()
      fireEvent.click(screen.getByRole('checkbox', { name: NO_EMAIL }))
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'form', hubspotPortalId: '1', noEmail: true })
    })

    test('no email is left out when switched back off', () => {
      const onChange = renderEditor({ type: 'form', noEmail: true })
      expect(screen.getByRole('checkbox', { name: NO_EMAIL })).toBeChecked()
      fireEvent.click(screen.getByRole('checkbox', { name: NO_EMAIL }))
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'form' })
    })

    test('checks the HubSpot settings before saving, as the API does', () => {
      const check = (extra: object) => checkSection({ id: 's', type: 'form', ...extra })
      expect(
        check({ hubspotPortalId: '14545640', hubspotFormId: GUID.toUpperCase(), hubspotMessageField: 'comments' }),
      ).toStrictEqual({})
      expect(check({ hubspotPortalId: '14545640' })).toStrictEqual({ hubspotFormId: 'Required.' })
      expect(check({ hubspotFormId: GUID })).toStrictEqual({ hubspotPortalId: 'Required.' })
      expect(check({ hubspotPortalId: '1'.repeat(13), hubspotFormId: GUID })).toStrictEqual({
        hubspotPortalId: 'Digits only, as in the HubSpot embed code.',
      })
      expect(check({ hubspotPortalId: '12a', hubspotFormId: `${GUID}x` })).toStrictEqual({
        hubspotPortalId: 'Digits only, as in the HubSpot embed code.',
        hubspotFormId: 'A form ID like 4fd8c4ec-a157-4e53-b588-52bcd1123e06.',
      })
      expect(check({ hubspotFormId: `x${GUID}`, hubspotPortalId: '1' })).toMatchObject({
        hubspotFormId: 'A form ID like 4fd8c4ec-a157-4e53-b588-52bcd1123e06.',
      })
      expect(check({ hubspotMessageField: 'Comments' })).toStrictEqual({
        hubspotMessageField: 'A HubSpot field name: small letters, digits and _.',
      })
      expect(check({ hubspotMessageField: 'a'.repeat(101) })).toMatchObject({ hubspotMessageField: expect.any(String) })
      expect(check({ hubspotMessageField: 'message_2' })).toStrictEqual({})
    })

    test('shows a problem on a HubSpot field', () => {
      renderEditor({ type: 'form', hubspotPortalId: 'x' }, { hubspotPortalId: 'Not in the expected form.' })
      expect(screen.getByLabelText(PORTAL)).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByRole('alert')).toHaveTextContent('Not in the expected form.')
    })
  })

  // specs/005-website-blocks, slice 88c
  describe('pricing plans', () => {
    const pricing = (plans: object[], extra = {}) => ({ type: 'pricing', plans, ...extra })
    const plan = (number: number) => within(screen.getByRole('group', { name: `Plan ${number}` }))

    test('edits a plan: name, price, period, features one per line, button and highlight', () => {
      const onChange = renderEditor(pricing([{ name: 'Free', price: '$0' }]))
      expect(plan(1).getByLabelText('Name')).toHaveAttribute('maxlength', '40')
      expect(plan(1).getByLabelText('Price, such as $49')).toHaveAttribute('maxlength', '20')
      expect(plan(1).getByLabelText('Period, such as monthly (optional)')).toHaveAttribute('maxlength', '20')
      fireEvent.change(plan(1).getByLabelText('Period, such as monthly (optional)'), { target: { value: 'monthly' } })
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...pricing([{ name: 'Free', price: '$0', period: 'monthly' }]),
      })
      fireEvent.change(plan(1).getByLabelText('Features, one per line (up to 10)'), {
        target: { value: '1 user\n2G storage' },
      })
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...pricing([{ name: 'Free', price: '$0', features: ['1 user', '2G storage'] }]),
      })
      fireEvent.click(plan(1).getByRole('checkbox', { name: 'Make this plan stand out' }))
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...pricing([{ name: 'Free', price: '$0', highlight: true }]),
      })
      fireEvent.change(plan(1).getByLabelText('Button text'), { target: { value: 'Start' } })
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...pricing([{ name: 'Free', price: '$0', buttonText: 'Start' }]),
      })
    })

    test('shows saved features one per line; empty fields, no features and no highlight are left out', () => {
      const saved = {
        name: 'Free',
        price: '$0',
        period: 'monthly',
        features: ['a', 'b'],
        highlight: true,
        buttonUrl: '/x',
      }
      const onChange = renderEditor(pricing([saved]))
      expect(plan(1).getByLabelText('Features, one per line (up to 10)')).toHaveValue('a\nb')
      expect(plan(1).getByRole('checkbox', { name: 'Make this plan stand out' })).toBeChecked()
      fireEvent.change(plan(1).getByLabelText('Features, one per line (up to 10)'), { target: { value: '' } })
      const { features, ...withoutFeatures } = saved
      expect(features).toHaveLength(2)
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', ...pricing([withoutFeatures]) })
      fireEvent.click(plan(1).getByRole('checkbox', { name: 'Make this plan stand out' }))
      const { highlight, ...plain } = saved
      expect(highlight).toBe(true)
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', ...pricing([plain]) })
      fireEvent.change(plan(1).getByLabelText(/Button link/), { target: { value: '' } })
      const { buttonUrl, ...noLink } = saved
      expect(buttonUrl).toBe('/x')
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', ...pricing([noLink]) })
      fireEvent.change(plan(1).getByLabelText('Name'), { target: { value: '' } })
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', ...pricing([{ ...saved, name: '' }]) })
    })

    test('adds, moves and removes plans, up to 4', () => {
      const onChange = renderEditor(
        pricing([
          { name: 'A', price: '1' },
          { name: 'B', price: '2' },
        ]),
      )
      expect(screen.getByText('2 of 4 plans')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Move Plan 1 up' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Move Plan 2 down' })).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: 'Move Plan 1 down' }))
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...pricing([
          { name: 'B', price: '2' },
          { name: 'A', price: '1' },
        ]),
      })
      expect(screen.getByText('Plan moved to position 2.')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Move Plan 2 up' }))
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...pricing([
          { name: 'B', price: '2' },
          { name: 'A', price: '1' },
        ]),
      })
      fireEvent.click(screen.getByRole('button', { name: 'Remove Plan 1' }))
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', ...pricing([{ name: 'B', price: '2' }]) })
      fireEvent.click(screen.getByRole('button', { name: 'Add a plan' }))
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...pricing([
          { name: 'A', price: '1' },
          { name: 'B', price: '2' },
          { name: '', price: '' },
        ]),
      })
    })

    test('a change to one plan leaves the others; removing a later plan keeps the first', () => {
      const onChange = renderEditor(
        pricing([
          { name: 'A', price: '1' },
          { name: 'B', price: '2' },
          { name: 'C', price: '3' },
        ]),
      )
      fireEvent.change(plan(2).getByLabelText('Price, such as $49'), { target: { value: '$9' } })
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...pricing([
          { name: 'A', price: '1' },
          { name: 'B', price: '$9' },
          { name: 'C', price: '3' },
        ]),
      })
      fireEvent.click(screen.getByRole('button', { name: 'Remove Plan 2' }))
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...pricing([
          { name: 'A', price: '1' },
          { name: 'C', price: '3' },
        ]),
      })
    })

    test('blank feature lines are dropped on leaving the box, and do not count', () => {
      const onChange = renderEditor(pricing([{ name: 'A', price: '1', features: ['a', '', '  ', 'b', ''] }]))
      fireEvent.blur(plan(1).getByLabelText('Features, one per line (up to 10)'))
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...pricing([{ name: 'A', price: '1', features: ['a', 'b'] }]),
      })
      expect(
        checkSection({
          id: 's',
          type: 'pricing',
          plans: [{ name: 'A', price: '1', features: [...Array(10).fill('x'), '', ' '] }],
        }),
      ).toStrictEqual({})
    })

    test('blank-free features are left alone on leaving the box', () => {
      const onChange = renderEditor(pricing([{ name: 'A', price: '1', features: ['a'] }]))
      fireEvent.blur(plan(1).getByLabelText('Features, one per line (up to 10)'))
      expect(onChange).not.toHaveBeenCalled()
    })

    test('a feature line over 100 characters is named before saving', () => {
      expect(
        checkSection({ id: 's', type: 'pricing', plans: [{ name: 'A', price: '1', features: ['x'.repeat(100)] }] }),
      ).toStrictEqual({})
      expect(
        checkSection({
          id: 's',
          type: 'pricing',
          plans: [{ name: 'A', price: '1', features: ['ok', 'x'.repeat(101)] }],
        }),
      ).toStrictEqual({ 'plans[0].features': 'Each line at most 100 characters.' })
    })

    test('with 4 plans no more can be added', () => {
      renderEditor(pricing(Array.from({ length: 4 }, () => ({ name: 'a', price: '1' }))))
      expect(screen.getByRole('button', { name: 'Add a plan' })).toBeDisabled()
    })

    test('problems show on the plan field, its features and the list', () => {
      renderEditor(
        pricing([
          { name: 'A', price: '1' },
          { name: 'B', price: '' },
        ]),
        {
          'plans[1].price': 'Required.',
          'plans[1].features[3]': 'Text of at most 100 characters.',
          plans: 'A list of 1 to 4.',
        },
      )
      expect(plan(2).getByLabelText('Price, such as $49')).toHaveAttribute('aria-invalid', 'true')
      expect(plan(2).getByText('Required.')).toBeInTheDocument()
      expect(plan(2).getByText('Text of at most 100 characters.')).toBeInTheDocument()
      expect(plan(2).getByLabelText('Features, one per line (up to 10)')).toHaveAttribute('aria-invalid', 'true')
      expect(plan(1).queryByRole('alert')).toBeNull()
      expect(screen.getByText('A list of 1 to 4.')).toBeInTheDocument()
    })

    test('needs a plan with a name and price, at most 10 features and good links, before saving', () => {
      expect(checkSection({ id: 's', type: 'pricing', plans: [] })).toStrictEqual({ plans: 'Add at least one plan.' })
      expect(checkSection({ id: 's', type: 'pricing' })).toStrictEqual({ plans: 'Add at least one plan.' })
      expect(
        checkSection({
          id: 's',
          type: 'pricing',
          plans: [
            { name: 'ok', price: '1', features: Array(10).fill('x') },
            { name: ' ', price: '', features: Array(11).fill('x'), buttonUrl: 'nope' },
          ],
        }),
      ).toStrictEqual({
        'plans[1].name': 'Required.',
        'plans[1].price': 'Required.',
        'plans[1].features': 'At most 10 lines.',
        'plans[1].buttonUrl': 'Use a web, email or phone link, or /page-name.',
      })
    })
  })

  describe('map', () => {
    test('edits the map address and height; medium unless saved', () => {
      const onChange = renderEditor({ type: 'map', mapUrl: 'https://maps.test/a' })
      expect(screen.getByRole('radiogroup', { name: 'Height' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked()
      fireEvent.click(screen.getByRole('radio', { name: 'Large' }))
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        type: 'map',
        mapUrl: 'https://maps.test/a',
        height: 'large',
      })
      fireEvent.change(screen.getByLabelText('Map link (https)'), { target: { value: 'https://maps.test/b' } })
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'map', mapUrl: 'https://maps.test/b' })
    })

    // specs/007-website-hubspot-map
    test('edits the optional China map link', () => {
      const CHINA = 'Map link for China (optional, https, e.g. Amap): shown in WeChat and in China'
      const onChange = renderEditor({ type: 'map', mapUrl: 'https://maps.test/a' })
      expect(screen.getByLabelText(CHINA)).toHaveAttribute('maxlength', '2000')
      fireEvent.change(screen.getByLabelText(CHINA), { target: { value: 'https://uri.amap.com/x' } })
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        type: 'map',
        mapUrl: 'https://maps.test/a',
        chinaMapUrl: 'https://uri.amap.com/x',
      })
    })

    test('a cleared China map link is left out', () => {
      const CHINA = 'Map link for China (optional, https, e.g. Amap): shown in WeChat and in China'
      const onChange = renderEditor({
        type: 'map',
        mapUrl: 'https://maps.test/a',
        chinaMapUrl: 'https://uri.amap.com/x',
      })
      expect(screen.getByLabelText(CHINA)).toHaveValue('https://uri.amap.com/x')
      fireEvent.change(screen.getByLabelText(CHINA), { target: { value: '' } })
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', type: 'map', mapUrl: 'https://maps.test/a' })
    })

    test('needs the China map link to be https too', () => {
      const map = { id: 's', type: 'map', mapUrl: 'https://maps.test' }
      expect(checkSection({ ...map, chinaMapUrl: 'http://amap.com' })).toStrictEqual({
        chinaMapUrl: 'Use a link starting with https://.',
      })
      expect(checkSection({ ...map, chinaMapUrl: 'https://uri.amap.com/x' })).toStrictEqual({})
    })

    test('shows the saved height', () => {
      renderEditor({ type: 'map', mapUrl: 'https://maps.test/a', height: 'small' })
      expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked()
    })

    test('needs an https address before saving', () => {
      expect(checkSection({ id: 's', type: 'map' })).toStrictEqual({ mapUrl: 'Use a link starting with https://.' })
      expect(checkSection({ id: 's', type: 'map', mapUrl: 'http://maps.test' })).toStrictEqual({
        mapUrl: 'Use a link starting with https://.',
      })
      expect(checkSection({ id: 's', type: 'map', mapUrl: 'https://maps.test' })).toStrictEqual({})
    })
  })

  // specs/005-website-blocks, slice 88b
  describe('card grid', () => {
    const cards = (items: object[], extra = {}) => ({ type: 'cards', columns: '3', items, ...extra })
    const card = (number: number) => within(screen.getByRole('group', { name: `Card ${number}` }))

    test('edits the heading, intro, columns and boxes', () => {
      const { onChange } = renderWithImages(cards([{ title: 'A' }]))
      expect(screen.getByLabelText('Heading')).toHaveAttribute('maxlength', '120')
      expect(screen.getByLabelText('Intro')).toHaveAttribute('maxlength', '500')
      expect(screen.getByRole('radiogroup', { name: 'Columns' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: '3' })).toBeChecked()
      fireEvent.click(screen.getByRole('radio', { name: '4' }))
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', ...cards([{ title: 'A' }]), columns: '4' })
      fireEvent.click(screen.getByRole('checkbox', { name: 'Show the cards in boxes' }))
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', ...cards([{ title: 'A' }]), boxed: true })
    })

    test('shows the saved columns and boxes; 3 columns when none is saved', () => {
      renderWithImages({ type: 'cards', columns: '2', boxed: true, items: [{}] })
      expect(screen.getByRole('radio', { name: '2' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Show the cards in boxes' })).toBeChecked()
    })

    test('edits the title, text and link of a card within their limits; a cleared field is left out', () => {
      const { onChange } = renderWithImages(cards([{ title: 'A' }, { title: 'B', link: '/b' }]))
      expect(card(1).getByLabelText('Title')).toHaveAttribute('maxlength', '80')
      expect(card(1).getByLabelText('Text')).toHaveAttribute('maxlength', '300')
      expect(card(1).getByLabelText('Text').tagName).toBe('TEXTAREA')
      expect(card(2).getByLabelText('Link (optional)')).toHaveValue('/b')
      fireEvent.change(card(2).getByLabelText('Text'), { target: { value: 'Words' } })
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...cards([{ title: 'A' }, { title: 'B', link: '/b', text: 'Words' }]),
      })
      fireEvent.change(card(2).getByLabelText('Link (optional)'), { target: { value: '' } })
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', ...cards([{ title: 'A' }, { title: 'B' }]) })
    })

    test('chooses, shows and removes the image of a card', () => {
      const { onChange, onImagesPicked } = renderWithImages(cards([{ title: 'A' }, { imageAssetId: 'a1' }]), [
        images.a2,
      ])
      expect(card(1).getByText('No image')).toBeInTheDocument()
      expect(card(2).getByRole('img', { name: 'shop.png' })).toBeInTheDocument()
      fireEvent.click(card(1).getByRole('button', { name: 'Choose image' }))
      fireEvent.click(screen.getByRole('button', { name: 'pick (one)' }))
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...cards([{ title: 'A', imageAssetId: 'a2' }, { imageAssetId: 'a1' }]),
      })
      expect(onImagesPicked).toHaveBeenCalledWith([images.a2])
      fireEvent.click(card(2).getByRole('button', { name: 'Remove image' }))
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', ...cards([{ title: 'A' }, {}]) })
    })

    test('adds, moves and removes cards, up to 12', () => {
      const { onChange } = renderWithImages(cards([{ title: 'A' }, { title: 'B' }, { title: 'C' }]))
      expect(screen.getByText('3 of 12 cards')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Move Card 1 up' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Move Card 3 down' })).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: 'Move Card 1 down' }))
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...cards([{ title: 'B' }, { title: 'A' }, { title: 'C' }]),
      })
      expect(screen.getByText('Card moved to position 2.')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Move Card 3 up' }))
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...cards([{ title: 'A' }, { title: 'C' }, { title: 'B' }]),
      })
      fireEvent.click(screen.getByRole('button', { name: 'Remove Card 2' }))
      expect(onChange).toHaveBeenLastCalledWith({ id: 's1', ...cards([{ title: 'A' }, { title: 'C' }]) })
      fireEvent.click(screen.getByRole('button', { name: 'Add a card' }))
      expect(onChange).toHaveBeenLastCalledWith({
        id: 's1',
        ...cards([{ title: 'A' }, { title: 'B' }, { title: 'C' }, {}]),
      })
    })

    test('with 12 cards no more can be added', () => {
      renderWithImages(cards(Array.from({ length: 12 }, () => ({}))))
      expect(screen.getByRole('button', { name: 'Add a card' })).toBeDisabled()
      expect(screen.getByText('12 of 12 cards')).toBeInTheDocument()
    })

    test('problems show on the card field, the card image and the list', () => {
      renderWithImages(cards([{ title: 'A' }, { imageAssetId: 'a1', link: 'x' }]), [], {
        'items[1].link': 'Bad link.',
        'items[1].imageAssetId': 'Missing.',
        items: 'A list of 1 to 12.',
      })
      expect(card(2).getByLabelText('Link (optional)')).toHaveAttribute('aria-invalid', 'true')
      expect(card(2).getByText('Bad link.')).toBeInTheDocument()
      expect(card(2).getByText('Missing.')).toBeInTheDocument()
      expect(card(1).queryByRole('alert')).toBeNull()
      expect(screen.getByText('A list of 1 to 12.')).toBeInTheDocument()
    })

    test('needs a card, and good links, before saving; its images count as used', () => {
      expect(checkSection({ id: 's', type: 'cards', items: [] })).toStrictEqual({ items: 'Add at least one card.' })
      expect(checkSection({ id: 's', type: 'cards' })).toStrictEqual({ items: 'Add at least one card.' })
      expect(checkSection({ id: 's', type: 'cards', items: [{ link: '/a' }, { link: 'nope' }, {}] })).toStrictEqual({
        'items[1].link': 'Use a web, email or phone link, or /page-name.',
      })
      expect(
        getImageIds([
          { id: 's', type: 'cards', items: [{ imageAssetId: 'a1' }, {}, { imageAssetId: 'a2' }] },
          { id: 'h', type: 'hero', imageAssetId: 'a1' },
        ]),
      ).toStrictEqual(['a1', 'a2'])
    })
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
