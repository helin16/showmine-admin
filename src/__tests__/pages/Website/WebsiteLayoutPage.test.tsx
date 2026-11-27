import React from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import WebsiteLayoutPage from '../../../Pages/Website/WebsiteLayoutPage'
import WebsiteService from '../../../Services/WebsiteService'
import message from '../../../Components/Form/message'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../../components/Access/domHelpers'

// The Layout page (specs/004-website-visual-editor, US4, slice 4a, T016).
vi.mock('../../../Services/WebsiteService', () => ({
  default: {
    get: vi.fn(),
    update: vi.fn(),
    getPages: vi.fn(),
    getImages: vi.fn(),
    getPreviewUrl: vi.fn(),
    getReaderUrl: vi.fn(() => null),
  },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('../../../Components/Website/MediaPicker', () => ({
  default: (props: { open: boolean; onPick: (images: object[]) => void }) =>
    props.open ? (
      <button onClick={() => props.onPick([{ id: 'img-2', url: 'https://cdn.test/2.png', fileName: 'two.png' }])}>
        pick (one)
      </button>
    ) : null,
}))
vi.mock('../../../Layouts/BackendPage', () => ({
  default: ({ children, ContentHeader }: { children: React.ReactNode; ContentHeader?: React.ReactNode }) => (
    <main>
      <header>{ContentHeader}</header>
      {children}
    </main>
  ),
}))

beforeAll(() => stubMatchMedia())

const company = { id: 'co-1', name: 'Acme', websiteBuilderEnabled: true }
const website = (extra = {}) => ({
  id: 'w-1',
  companyId: 'co-1',
  slug: 'acme',
  theme: { primaryColor: '#111111', fontPair: 'classic' },
  layout: null,
  hasUnpublishedChanges: false,
  updatedAt: 'w-time',
  ...extra,
})
const pages = [
  { id: 'p2', slug: 'about', title: 'About', position: 1, sections: [], hasUnpublishedChanges: false },
  {
    id: 'p1',
    slug: 'home',
    title: 'Home',
    position: 0,
    sections: [{ id: 's1', type: 'hero', heading: 'Hello' }],
    hasUnpublishedChanges: false,
  },
]
const httpError = (status: number, data: object) =>
  Object.assign(new Error(`status ${status}`), { response: { status, data } })

const renderPage = (auth: object = { company, user: { id: 'u-1' } }) =>
  renderWithProviders(<WebsiteLayoutPage />, { state: { auth } })
const loaded = async (extra = {}) => {
  vi.mocked(WebsiteService.get).mockResolvedValue(website(extra) as never)
  vi.mocked(WebsiteService.getPages).mockResolvedValue(pages as never)
  vi.mocked(WebsiteService.getImages).mockResolvedValue({ data: [] } as never)
  const result = renderPage()
  await screen.findByRole('heading', { name: 'Hello' })
  return result
}
const canvas = () => screen.getByTestId('site-canvas')
const menu = () => within(canvas()).getByRole('navigation')
const saveBtn = () => screen.getByText('Save').closest('button') as HTMLButtonElement
const tab = (name: string) => fireEvent.click(within(screen.getByRole('group', { name: 'Panel tabs' })).getByText(name))
const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } })
const lastSaved = () => vi.mocked(WebsiteService.update).mock.calls.at(-1)?.[0] as Record<string, any>

describe('WebsiteLayoutPage', () => {
  test('with the builder off, shows the not-allowed panel and asks the API nothing', () => {
    renderPage({ company: { ...company, websiteBuilderEnabled: false } })
    expect(screen.getByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
    expect(WebsiteService.get).not.toHaveBeenCalled()
  })

  test('draws the saved layout on the canvas with the first page as a sample, read only', async () => {
    await loaded({
      layout: {
        header: { hiddenPageIds: ['p2'], links: [{ label: 'Login', url: 'https://a.test' }] },
        footer: { columns: [{ heading: 'Contact Info', items: [] }], copyright: '© Acme' },
      },
    })
    expect(
      within(menu())
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toStrictEqual(['Acme', 'Home', 'Login'])
    expect(within(canvas()).getByRole('heading', { name: 'Contact Info' })).toBeInTheDocument()
    expect(within(canvas()).getByText('© Acme')).toHaveClass('site-copyright')
    expect(within(canvas()).queryByRole('button', { name: /Edit/ })).toBeNull()
    expect(saveBtn()).toBeDisabled()
    expect(screen.getByText('Show the logo')).toBeInTheDocument()
  })

  test('has the tabs in a rail on the right of the panel, as the page editor, opening Header first', async () => {
    await loaded()
    const rail = screen.getByRole('group', { name: 'Panel tabs' })
    const content = screen.getByRole('region', { name: 'Panel' })
    expect(content.parentElement).toBe(rail.parentElement)
    expect(content.nextElementSibling).toBe(rail)
    expect(
      within(rail)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toStrictEqual(['Header', 'Footer', 'Theme', 'Blocks'])
    within(rail)
      .getAllByRole('button')
      .forEach((button) => expect(button.querySelector('.anticon')).not.toBeNull())
    expect(within(rail).getByRole('button', { name: 'Header', pressed: true })).toBeInTheDocument()
    expect(within(content).getByText('Show the logo')).toBeInTheDocument()

    tab('Footer')
    expect(within(rail).getByRole('button', { name: 'Footer', pressed: true })).toBeInTheDocument()
    expect(within(rail).getByRole('button', { name: 'Header', pressed: false })).toBeInTheDocument()
    expect(within(content).getByText('Show a footer')).toBeInTheDocument()
    expect(within(content).queryByText('Show the logo')).toBeNull()
  })

  test('hides a page, adds an outside link and saves the whole layout with the theme', async () => {
    const saved = website({ layout: { header: { hiddenPageIds: ['p2'] }, footer: null }, updatedAt: 'later' })
    vi.mocked(WebsiteService.update).mockResolvedValue(saved as never)
    await loaded()

    fireEvent.click(screen.getByRole('checkbox', { name: 'About' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show the website name' }))
    fireEvent.click(screen.getByText('Add a link'))
    const link = screen.getByRole('group', { name: 'Link 1' })
    type(within(link).getByLabelText('Text'), 'Start free')
    type(within(link).getByLabelText(/^Link:/), 'https://admin.test/signup')

    expect(
      within(menu())
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toStrictEqual(['Acme', 'Home', 'Start free'])
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    fireEvent.click(saveBtn())

    await waitFor(() => expect(message.success).toHaveBeenCalled())
    expect(lastSaved()).toStrictEqual({
      theme: { primaryColor: '#111111', fontPair: 'classic' },
      layout: {
        header: {
          hiddenPageIds: ['p2'],
          showName: false,
          links: [{ label: 'Start free', url: 'https://admin.test/signup' }],
        },
        footer: null,
        sharedAbove: [],
        sharedBelow: [],
      },
      updatedAt: 'w-time',
    })
    // The saved layout replaces the draft.
    await waitFor(() => expect(saveBtn()).toBeDisabled())
  })

  test('a page shown again leaves the hidden list; a link can be removed', async () => {
    await loaded({
      layout: { header: { showLogo: false, hiddenPageIds: ['p2'], links: [{ label: 'A', url: '/home' }] } },
    })
    expect(screen.getByRole('checkbox', { name: 'Show the logo' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Show the website name' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'About' })).not.toBeChecked()
    fireEvent.click(screen.getByRole('checkbox', { name: 'About' }))
    fireEvent.click(screen.getByText('Remove Link 1'))
    expect(
      within(menu())
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toStrictEqual(['Acme', 'Home', 'About'])
    expect(screen.getByRole('button', { name: 'Add a link' })).toBeEnabled()
  })

  test('a link text of spaces only counts as empty', async () => {
    await loaded()
    fireEvent.click(screen.getByText('Add a link'))
    const link = screen.getByRole('group', { name: 'Link 1' })
    type(within(link).getByLabelText('Text'), '   ')
    type(within(link).getByLabelText(/^Link:/), '/home')
    fireEvent.click(saveBtn())
    expect(within(link).getByText('Required.')).toBeInTheDocument()
    expect(WebsiteService.update).not.toHaveBeenCalled()
  })

  test('loads the images of the saved footer and of the sample page', async () => {
    vi.mocked(WebsiteService.get).mockResolvedValue(
      website({
        layout: { footer: { columns: [{ items: [{ type: 'image', assetId: 'img-1', alt: 'QR' }] }] } },
      }) as never,
    )
    vi.mocked(WebsiteService.getPages).mockResolvedValue([
      { ...pages[1], sections: [{ id: 's1', type: 'hero', heading: 'Hello', imageAssetId: 'img-3' }] },
    ] as never)
    vi.mocked(WebsiteService.getImages).mockResolvedValue({
      data: [{ id: 'img-1', url: 'https://cdn.test/1.png', fileName: 'one.png' }],
    } as never)
    renderPage()
    expect(await within(await screen.findByTestId('site-canvas')).findByAltText('QR')).toHaveAttribute(
      'src',
      'https://cdn.test/1.png',
    )
    expect(WebsiteService.getImages).toHaveBeenCalledWith(1, ['img-1', 'img-3'])
  })

  test('at most four links', async () => {
    await loaded()
    for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByText('Add a link'))
    expect(screen.getByText('Add a link').closest('button')).toBeDisabled()
  })

  test('checks links and required text before saving, and says where', async () => {
    await loaded()
    fireEvent.click(screen.getByText('Add a link'))
    type(within(screen.getByRole('group', { name: 'Link 1' })).getByLabelText(/^Link:/), 'javascript:x')
    fireEvent.click(saveBtn())

    expect(WebsiteService.update).not.toHaveBeenCalled()
    expect(message.error).toHaveBeenCalledWith('Some fields need fixing before saving.')
    const link = screen.getByRole('group', { name: 'Link 1' })
    expect(within(link).getByText('Required.')).toBeInTheDocument()
    expect(within(link).getByText('Use a web, email or phone link, or /page-name.')).toBeInTheDocument()
    expect(within(link).getByLabelText('Text')).toHaveAttribute('aria-invalid', 'true')
    // Problems go with the next edit, as they are kept by position.
    type(within(link).getByLabelText('Text'), 'Go')
    expect(within(link).queryByText('Required.')).toBeNull()
  })

  test('builds a footer: columns, items, an image, the copyright; empty optional fields are left out', async () => {
    vi.mocked(WebsiteService.update).mockResolvedValue(website() as never)
    await loaded()
    tab('Footer')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show a footer' }))
    const column = () => screen.getByRole('group', { name: 'Column 1' })
    type(within(column()).getByLabelText('Heading'), 'Contact Info')
    fireEvent.click(within(column()).getByRole('button', { name: 'Add Contact line to Column 1' }))
    fireEvent.click(within(column()).getByRole('button', { name: 'Add Text to Column 1' }))
    fireEvent.click(within(column()).getByRole('button', { name: 'Add Button to Column 1' }))
    fireEvent.click(within(column()).getByRole('button', { name: 'Add Image to Column 1' }))
    type(within(screen.getByRole('group', { name: '1. Contact line' })).getByLabelText('Text'), '1 Main St')
    type(within(screen.getByRole('group', { name: '2. Text' })).getByLabelText('Text'), 'Hi\nthere')
    const button = screen.getByRole('group', { name: '3. Button' })
    type(within(button).getByLabelText('Text'), 'Contact Us')
    type(within(button).getByLabelText(/^Link:/), '/about')
    fireEvent.click(within(screen.getByRole('group', { name: '4. Image' })).getByText('Choose image'))
    fireEvent.click(screen.getByText('pick (one)'))
    type(screen.getByLabelText('Copyright line'), '© Acme')

    const footer = within(canvas()).getByRole('contentinfo')
    expect(within(footer).getByRole('heading', { name: 'Contact Info' })).toBeInTheDocument()
    expect(within(footer).getByText('1 Main St').closest('p')).toHaveClass('site-footer-contact')
    expect(within(footer).getByText('Contact Us')).toHaveClass('site-button')
    expect(footer.querySelector('img')).toHaveAttribute('src', 'https://cdn.test/2.png')

    fireEvent.click(saveBtn())
    await waitFor(() => expect(WebsiteService.update).toHaveBeenCalled())
    expect(lastSaved().layout.footer).toStrictEqual({
      columns: [
        {
          heading: 'Contact Info',
          items: [
            { type: 'contact', icon: 'address', text: '1 Main St' },
            { type: 'text', text: 'Hi\nthere' },
            { type: 'button', label: 'Contact Us', url: '/about' },
            { type: 'image', assetId: 'img-2' },
          ],
        },
      ],
      copyright: '© Acme',
    })
  })

  test('a footer image is required; an item, a column or the footer can be removed', async () => {
    await loaded()
    tab('Footer')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show a footer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Image to Column 1' }))
    fireEvent.click(saveBtn())
    expect(screen.getByText('Choose an image.')).toBeInTheDocument()
    expect(WebsiteService.update).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Remove 1. Image'))
    expect(screen.queryByRole('group', { name: '1. Image' })).toBeNull()
    fireEvent.click(screen.getByText('Add a column'))
    fireEvent.click(screen.getByText('Remove Column 1'))
    expect(screen.getAllByRole('group', { name: /^Column/ })).toHaveLength(1)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show a footer' }))
    expect(within(canvas()).queryByRole('contentinfo')).toBeNull()
  })

  test('at most four columns and eight items', async () => {
    await loaded()
    tab('Footer')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show a footer' }))
    for (let i = 0; i < 3; i += 1) fireEvent.click(screen.getByText('Add a column'))
    expect(screen.getByText('Add a column').closest('button')).toBeDisabled()
    const add = () => screen.getByRole('button', { name: 'Add Text to Column 1' })
    for (let i = 0; i < 8; i += 1) fireEvent.click(add())
    expect(add()).toBeDisabled()
  })

  test('the theme: colours, fonts and width show on the canvas and are saved', async () => {
    vi.mocked(WebsiteService.update).mockResolvedValue(website() as never)
    await loaded()
    tab('Theme')
    type(screen.getByLabelText('Heading colour'), '#58468b')
    // With no button colour the picker shows the main colour (spec 005, slice 88b).
    expect(screen.getByLabelText('Button colour')).toHaveValue('#111111')
    expect(screen.queryByRole('button', { name: 'Use the main colour' })).toBeNull()
    type(screen.getByLabelText('Button colour'), '#00aa00')
    // Dropped again, the button follows the main colour.
    fireEvent.click(screen.getByRole('button', { name: 'Use the main colour' }))
    expect(screen.getByLabelText('Button colour')).toHaveValue('#111111')
    expect(screen.queryByRole('button', { name: 'Use the main colour' })).toBeNull()
    expect((canvas().firstElementChild as HTMLElement).style.getPropertyValue('--site-button')).toBe('')
    type(screen.getByLabelText('Button colour'), '#3d82f4')
    // The second button's colour (spec 005), with the text the site picks for it.
    type(screen.getByLabelText('Second button colour'), '#facc15')
    fireEvent.click(screen.getByRole('radio', { name: '1140 px' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Friendly' }))

    const site = canvas().firstElementChild as HTMLElement
    expect(site.style.getPropertyValue('--site-heading')).toBe('#58468b')
    expect(site.style.getPropertyValue('--site-width')).toBe('1140px')
    expect(site).toHaveClass('site-font-friendly')
    expect(site.style.getPropertyValue('--site-button')).toBe('#3d82f4')
    expect(site.style.getPropertyValue('--site-button-text')).toBe('#ffffff')
    expect(site.style.getPropertyValue('--site-secondary')).toBe('#facc15')
    expect(site.style.getPropertyValue('--site-secondary-text')).toBe('#212529')
    fireEvent.click(saveBtn())
    await waitFor(() => expect(WebsiteService.update).toHaveBeenCalled())
    expect(lastSaved().theme).toStrictEqual({
      primaryColor: '#111111',
      fontPair: 'friendly',
      headingColor: '#58468b',
      buttonColor: '#3d82f4',
      secondaryColor: '#facc15',
      contentWidth: 1140,
    })
  })

  test('problems from the API open their tab and show at the field', async () => {
    vi.mocked(WebsiteService.update).mockRejectedValue(
      httpError(400, {
        errors: [{ path: 'layout.footer.copyright', message: 'Text of at most 200 characters.' }],
      }),
    )
    await loaded({ layout: { footer: { columns: [], copyright: 'x' } } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show the logo' }))
    fireEvent.click(saveBtn())

    expect(await screen.findByText('Text of at most 200 characters.')).toBeInTheDocument()
    expect(screen.getByLabelText('Copyright line')).toHaveAttribute('aria-invalid', 'true')
  })

  test('a stale save asks to reload, and reloading loads again', async () => {
    vi.mocked(WebsiteService.update).mockRejectedValue(httpError(409, { message: 'stale' }))
    await loaded()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show the logo' }))
    fireEvent.click(saveBtn())

    const alert = await screen.findByText(/Someone else changed the website/)
    expect(saveBtn()).toBeDisabled()
    fireEvent.click(within(alert.closest('[role="alert"]') as HTMLElement).getByText('Reload'))
    await waitFor(() => expect(WebsiteService.get).toHaveBeenCalledTimes(2))
  })

  test('another failure is said', async () => {
    vi.mocked(WebsiteService.update).mockRejectedValue(new Error('Network down'))
    await loaded()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show the logo' }))
    fireEvent.click(saveBtn())
    await waitFor(() => expect(message.error).toHaveBeenCalled())
    expect(screen.queryByText(/Someone else changed the website/)).toBeNull()
  })

  test('clicking the header or the footer on the canvas opens its tab', async () => {
    await loaded({ layout: { footer: { columns: [], copyright: '© Acme' } } })
    tab('Theme')
    fireEvent.click(within(canvas()).getByRole('contentinfo'))
    expect(screen.getByRole('checkbox', { name: 'Show a footer' })).toBeInTheDocument()
    expect(within(canvas()).getByRole('contentinfo').parentElement).toHaveClass('canvas-part', 'is-selected')
    fireEvent.click(menu())
    expect(screen.getByRole('checkbox', { name: 'Show the logo' })).toBeInTheDocument()
    expect(menu()).toHaveClass('canvas-part', 'is-selected')
  })

  test('preview opens the saved site, only while nothing is unsaved', async () => {
    vi.mocked(WebsiteService.getPreviewUrl).mockResolvedValue({ url: 'https://r.test/s/acme?preview=t' } as never)
    const opened = { opener: {}, location: { href: '' }, close: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(opened as never)
    await loaded()
    const previewBtn = () => screen.getByRole('button', { name: 'Preview' })

    fireEvent.click(previewBtn())
    await waitFor(() => expect(opened.location.href).toBe('https://r.test/s/acme?preview=t'))
    expect(opened.opener).toBeNull()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Show the logo' }))
    expect(previewBtn()).toBeDisabled()
  })

  test('a load failure can be tried again', async () => {
    vi.mocked(WebsiteService.get).mockRejectedValueOnce(new Error('Network down'))
    vi.mocked(WebsiteService.getPages).mockResolvedValue(pages as never)
    renderPage()
    expect(await screen.findByText(/The website could not be loaded/)).toBeInTheDocument()
    vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
    fireEvent.click(screen.getByText('Try again'))
    await screen.findByRole('heading', { name: 'Hello' })
  })

  // Slice 4b (T017d): shared blocks above and below every page.
  describe('shared blocks', () => {
    const shared = (id: string, heading: string) => ({ id, type: 'hero', heading })
    const headings = () =>
      within(canvas())
        .getAllByRole('heading', { level: 1 })
        .map((h) => h.textContent)
    const sentLayout = () => vi.mocked(WebsiteService.update).mock.calls[0][0].layout

    test('a tab in the rail closes the open block', async () => {
      await loaded({ layout: { sharedBelow: [shared('b', 'Band')] } })
      tab('Blocks')
      fireEvent.click(screen.getByRole('button', { name: 'Edit 1. Hero' }))
      expect(screen.getByText('Below every page: Hero')).toBeInTheDocument()
      // The open tab itself closes the block too.
      tab('Blocks')
      expect(screen.queryByText('Below every page: Hero')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Edit 1. Hero' }))
      tab('Header')
      tab('Blocks')
      expect(screen.queryByText('Below every page: Hero')).toBeNull()
      expect(screen.getByRole('button', { name: 'Add Hero' })).toBeInTheDocument()
      expect(canvas().querySelector('.canvas-item.is-selected')).toBeNull()
    })

    test('adds blocks below and above every page, edits one, and saves them', async () => {
      vi.mocked(WebsiteService.update).mockResolvedValue(website() as never)
      await loaded()
      tab('Blocks')
      expect(screen.getByText('0 of 10 shared blocks')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Add Hero' }))
      type(screen.getByLabelText('Heading'), 'Signup Today')
      fireEvent.click(screen.getByText('Back'))
      fireEvent.click(screen.getByLabelText('Above every page'))
      fireEvent.click(screen.getByRole('button', { name: 'Add Hero' }))
      type(screen.getByLabelText('Heading'), 'Welcome')

      // The sample page sits between them, marked as a sample.
      expect(headings()).toStrictEqual(['Welcome', 'Hello', 'Signup Today'])
      expect(within(canvas()).getByText('Sample: the page Home')).toBeInTheDocument()
      fireEvent.click(saveBtn())
      await waitFor(() => expect(WebsiteService.update).toHaveBeenCalled())
      expect(sentLayout().sharedAbove).toStrictEqual([{ id: expect.any(String), type: 'hero', heading: 'Welcome' }])
      expect(sentLayout().sharedBelow).toStrictEqual([
        { id: expect.any(String), type: 'hero', heading: 'Signup Today' },
      ])
    })

    test('moving a block past the sample page moves it below or above', async () => {
      vi.mocked(WebsiteService.update).mockResolvedValue(website() as never)
      await loaded({ layout: { sharedAbove: [shared('a', 'Top')], sharedBelow: [shared('b', 'Band')] } })
      expect(headings()).toStrictEqual(['Top', 'Hello', 'Band'])

      fireEvent.click(within(canvas()).getByRole('button', { name: 'Move 1. Hero down' }))
      expect(headings()).toStrictEqual(['Hello', 'Top', 'Band'])
      expect(within(canvas()).getByRole('button', { name: 'Move 2. Hero down' })).toBeDisabled()
      fireEvent.click(within(canvas()).getByRole('button', { name: 'Move 1. Hero down' }))
      expect(headings()).toStrictEqual(['Hello', 'Band', 'Top'])
      // The first block below can still go up, past the sample page.
      fireEvent.click(within(canvas()).getByRole('button', { name: 'Move 1. Hero up' }))
      expect(headings()).toStrictEqual(['Band', 'Hello', 'Top'])
      expect(within(canvas()).getByRole('button', { name: 'Move 1. Hero up' })).toBeDisabled()

      fireEvent.click(saveBtn())
      await waitFor(() => expect(WebsiteService.update).toHaveBeenCalled())
      expect(sentLayout().sharedAbove).toStrictEqual([shared('b', 'Band')])
      expect(sentLayout().sharedBelow).toStrictEqual([shared('a', 'Top')])
    })

    test('a lone block above can still go down, past the sample page', async () => {
      await loaded({ layout: { sharedAbove: [shared('a', 'Top')] } })
      fireEvent.click(within(canvas()).getByRole('button', { name: 'Move 1. Hero down' }))
      expect(headings()).toStrictEqual(['Hello', 'Top'])
      expect(within(canvas()).getByRole('button', { name: 'Move 1. Hero down' })).toBeDisabled()
    })

    test('removes a block', async () => {
      vi.mocked(WebsiteService.update).mockResolvedValue(website() as never)
      await loaded({ layout: { sharedAbove: [shared('a', 'Top')], sharedBelow: [shared('b', 'Band')] } })
      fireEvent.click(within(canvas()).getByRole('button', { name: 'Remove 1. Hero' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
      expect(headings()).toStrictEqual(['Hello', 'Band'])
      fireEvent.click(saveBtn())
      await waitFor(() => expect(WebsiteService.update).toHaveBeenCalled())
      expect(sentLayout().sharedAbove).toStrictEqual([])
      expect(sentLayout().sharedBelow).toStrictEqual([shared('b', 'Band')])
    })

    test('clicking a block on the canvas opens it in the Blocks tab', async () => {
      await loaded({ layout: { sharedBelow: [shared('b', 'Band')] } })
      fireEvent.click(within(canvas()).getByRole('heading', { name: 'Band' }))
      expect(screen.getByText('Below every page: Hero')).toBeInTheDocument()
      expect(screen.getByLabelText('Heading')).toHaveValue('Band')
    })

    test('ten in all is the most', async () => {
      const ten = Array.from({ length: 10 }, (_, i) => shared(`s${i}`, `B${i}`))
      await loaded({ layout: { sharedAbove: ten.slice(0, 4), sharedBelow: ten.slice(4) } })
      tab('Blocks')
      expect(screen.getByText('10 shared blocks is the most.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add Hero' })).toBeDisabled()
    })

    test('a bad link is found before saving and its block opened', async () => {
      await loaded({ layout: { sharedBelow: [{ ...shared('b', 'Band'), buttonUrl: 'javascript:alert(1)' }] } })
      fireEvent.click(screen.getByRole('checkbox', { name: 'Show the website name' }))
      fireEvent.click(saveBtn())
      expect(WebsiteService.update).not.toHaveBeenCalled()
      expect(screen.getByText('Below every page: Hero')).toBeInTheDocument()
      expect(within(canvas()).getByText('Needs fixing')).toBeInTheDocument()
    })

    test('problems from the API open the block, or show over the blocks', async () => {
      vi.mocked(WebsiteService.update).mockRejectedValue(
        httpError(400, {
          errors: [
            { path: 'layout.sharedBelow[0].heading', message: 'Too long.' },
            { path: 'layout.shared', message: 'The shared blocks are too large.' },
          ],
        }),
      )
      await loaded({ layout: { sharedAbove: [shared('a', 'Top')], sharedBelow: [shared('b', 'Band')] } })
      fireEvent.click(screen.getByRole('checkbox', { name: 'Show the website name' }))
      fireEvent.click(saveBtn())

      expect(await screen.findByText('Too long.')).toBeInTheDocument()
      expect(screen.getByText('Below every page: Hero')).toBeInTheDocument()
      fireEvent.click(screen.getByText('Back'))
      expect(screen.getByText('The shared blocks are too large.')).toBeInTheDocument()
    })

    test('a header problem first opens the Header tab and marks no shared block', async () => {
      vi.mocked(WebsiteService.update).mockRejectedValue(
        httpError(400, {
          errors: [
            { path: 'layout.header.showLogo', message: 'Yes or no.' },
            { path: 'layout.sharedBelow[0].heading', message: 'Too long.' },
          ],
        }),
      )
      await loaded({ layout: { sharedBelow: [shared('b', 'Band')] } })
      fireEvent.click(screen.getByRole('checkbox', { name: 'Show the website name' }))
      fireEvent.click(saveBtn())
      await waitFor(() => expect(message.error).toHaveBeenCalled())
      expect(screen.getByRole('button', { name: 'Header', pressed: true })).toBeInTheDocument()
      expect(canvas().querySelector('.canvas-item.is-selected')).toBeNull()
    })

    test('a problem with the id of a block shows with the block', async () => {
      vi.mocked(WebsiteService.update).mockRejectedValue(
        httpError(400, { errors: [{ path: 'layout.sharedBelow[0].id', message: 'A unique id for the section.' }] }),
      )
      await loaded({ layout: { sharedBelow: [shared('b', 'Band')] } })
      fireEvent.click(screen.getByRole('checkbox', { name: 'Show the website name' }))
      fireEvent.click(saveBtn())
      expect(await screen.findByText('A unique id for the section.')).toBeInTheDocument()
      expect(screen.getByText('Below every page: Hero')).toBeInTheDocument()
    })
  })
})
