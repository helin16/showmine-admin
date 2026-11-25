import React from 'react'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import WebsitePageEditPage from '../../../Pages/Website/WebsitePageEditPage'
import WebsiteService from '../../../Services/WebsiteService'
import message from '../../../Components/Form/message'
import { changeCompany } from '../../../Redux/reduxers/auth.slice'
import { COMPANY_WEBSITE_PAGE_URL, COMPANY_WEBSITE_PAGES_URL } from '../../../UrlMap'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../../components/Access/domHelpers'

// The page editor (specs/001-website-builder, US2, T026).
vi.mock('../../../Services/WebsiteService', () => ({
  default: {
    get: vi.fn(),
    getPages: vi.fn(),
    updatePage: vi.fn(),
    getPreviewUrl: vi.fn(),
    getImages: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    deletePage: vi.fn(),
    // No Reader address: the canvas shows the blocks without the site styles.
    getReaderUrl: vi.fn(() => null),
  },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('../../../Components/Form/RichTextEditor', () => ({
  default: ({ value, onLiveChange }: { value: string; onLiveChange: (v: string) => void }) => (
    <textarea aria-label={'rich text'} defaultValue={value} onChange={(e) => onLiveChange(e.target.value)} />
  ),
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
const website = { id: 'w-1', slug: 'acme', publishedAt: null, hasUnpublishedChanges: true, updatedAt: 'w-time' }
const hero = { id: 'h1', type: 'hero', heading: 'Hello' }
const text = { id: 't1', type: 'text', html: '<p>Hi</p>' }
const page = (extra = {}) => ({
  id: 'p-1',
  slug: 'home',
  title: 'Home',
  position: 0,
  sections: [hero, text],
  hasUnpublishedChanges: true,
  updatedAt: 'page-time',
  ...extra,
})
const httpError = (status: number, data: object) =>
  Object.assign(new Error(`status ${status}`), { response: { status, data } })

// An admin of the company; members get no delete or publish (SMN-80).
const adminOf = (role = 'ADMIN') => [{ companyId: 'co-1', isActive: true, isPending: false, role }]
const renderPage = (auth: object = { company, companyUsers: adminOf() }) =>
  renderWithProviders(
    <Routes>
      <Route path={COMPANY_WEBSITE_PAGE_URL} element={<WebsitePageEditPage />} />
      <Route path={COMPANY_WEBSITE_PAGES_URL} element={<div>pages list</div>} />
    </Routes>,
    { state: { auth }, route: '/b/company/website/pages/p-1' },
  )
const loaded = async (auth?: object) => {
  vi.mocked(WebsiteService.getPages).mockResolvedValue([page()] as never)
  vi.mocked(WebsiteService.get).mockResolvedValue(website as never)
  const result = renderPage(auth)
  await screen.findByDisplayValue('Hello')
  return result
}
const saveBtn = () => screen.getByRole('button', { name: 'Save' })
// The page's title, address name and SEO sit in Options (spec 004, US1): opened first when closed.
const optionsField = (label: string) => {
  if (!screen.queryByLabelText(label)) fireEvent.click(screen.getByRole('button', { name: 'Options' }))
  return screen.getByLabelText(label)
}

describe('WebsitePageEditPage', () => {
  test('with the builder off, shows the not-allowed panel and loads nothing', () => {
    renderPage({ company: { ...company, websiteBuilderEnabled: false } })
    expect(screen.getByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
    expect(WebsiteService.getPages).not.toHaveBeenCalled()
  })

  test('shows the page, its sections in order and the publish bar; nothing to save yet', async () => {
    await loaded()
    expect(optionsField('Title')).toHaveValue('Home')
    // Drawn on the canvas, the first block selected and edited in the panel (spec 004, US2).
    const canvas = screen.getByTestId('site-canvas')
    expect(within(canvas).getByRole('heading', { name: 'Hello' })).toBeInTheDocument()
    const blocks = within(canvas).getAllByRole('button', { name: /^Edit / })
    expect(blocks.map((b) => b.getAttribute('aria-label'))).toStrictEqual(['Edit 1. Hero', 'Edit 2. Text'])
    expect(blocks[0]).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1. Hero')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
    expect(saveBtn()).toBeDisabled()
  })

  // Spec 004, US1: edited like an article: the title row has the actions; the page settings sit in Options.
  test('the title row reads Editing: <title>, with Save, Preview, Publish and Options', async () => {
    await loaded()
    const header = screen.getByRole('banner')
    expect(within(header).getByText('Editing: Home')).toBeInTheDocument()
    for (const name of [/Save/, /Preview/, /Publish/, /Options/]) {
      expect(within(header).getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument()
  })

  test('an admin deletes the page from Options after confirming, and goes back to the pages', async () => {
    vi.mocked(WebsiteService.deletePage).mockResolvedValue({} as never)
    await loaded()
    fireEvent.click(screen.getByRole('button', { name: 'Options' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete page' }))
    expect(WebsiteService.deletePage).not.toHaveBeenCalled()
    fireEvent.click(within(await screen.findByRole('tooltip')).getByRole('button', { name: 'Delete' }))
    expect(WebsiteService.deletePage).toHaveBeenCalledWith('p-1')
    expect(await screen.findByText('pages list')).toBeInTheDocument()
  })

  test('a problem with a field in Options, found on save, opens Options to show it', async () => {
    vi.mocked(WebsiteService.updatePage).mockRejectedValue(
      Object.assign(new Error('x'), {
        response: { status: 400, data: { errors: [{ path: 'title', message: 'Too long.' }] } },
      }),
    )
    await loaded()
    fireEvent.change(optionsField('Title'), { target: { value: 'New' } })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(document.querySelector('.ant-drawer-open')).toBeNull())
    fireEvent.click(saveBtn())
    expect(await screen.findByText('Too long.')).toBeInTheDocument()
    await waitFor(() => expect(document.querySelector('.ant-drawer-open')).not.toBeNull())
  })

  test('an empty title opens Options on every save, even after it was closed', async () => {
    await loaded()
    fireEvent.change(optionsField('Title'), { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(document.querySelector('.ant-drawer-open')).toBeNull())
    fireEvent.click(saveBtn())
    await waitFor(() => expect(document.querySelector('.ant-drawer-open')).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(document.querySelector('.ant-drawer-open')).toBeNull())
    fireEvent.click(saveBtn())
    await waitFor(() => expect(document.querySelector('.ant-drawer-open')).not.toBeNull())
    expect(WebsiteService.updatePage).not.toHaveBeenCalled()
  })

  test('deleting with unsaved changes says they go too, and Delete waits while saving', async () => {
    vi.mocked(WebsiteService.updatePage).mockReturnValue(new Promise(() => undefined) as never)
    await loaded()
    fireEvent.change(optionsField('Title'), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Delete page' }))
    expect(await screen.findByText(/Its unsaved changes go too/)).toBeInTheDocument()
    fireEvent.click(saveBtn())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete page' })).toBeDisabled())
  })

  test('a failed delete says why and stays', async () => {
    vi.mocked(WebsiteService.deletePage).mockRejectedValue(new Error('Server down'))
    await loaded()
    fireEvent.click(screen.getByRole('button', { name: 'Options' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete page' }))
    fireEvent.click(within(await screen.findByRole('tooltip')).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Server down'))
    expect(screen.queryByText('pages list')).not.toBeInTheDocument()
  })

  test('a member edits and previews, with no publish bar', async () => {
    await loaded({ company, companyUsers: adminOf('NORMAL') })
    expect(optionsField('Title')).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Options' }))
    expect(screen.queryByRole('button', { name: 'Delete page' })).toBeNull()
  })

  test('a page of another website, or a removed one, is not found', async () => {
    vi.mocked(WebsiteService.getPages).mockResolvedValue([page({ id: 'p-other' })] as never)
    vi.mocked(WebsiteService.get).mockResolvedValue(website as never)
    renderPage()
    expect(await screen.findByText('This page does not exist.')).toBeInTheDocument()
  })

  test('saves the edited page with the updatedAt it was loaded with', async () => {
    await loaded()
    vi.mocked(WebsiteService.updatePage).mockResolvedValue(page({ title: 'Welcome', updatedAt: 'new-time' }) as never)

    fireEvent.change(optionsField('Title'), { target: { value: 'Welcome ' } })
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
    fireEvent.click(saveBtn())

    expect(WebsiteService.updatePage).toHaveBeenCalledWith('p-1', {
      title: 'Welcome',
      slug: 'home',
      sections: [hero, text],
      seo: { title: '', description: '', imageAssetId: null },
      updatedAt: 'page-time',
    })
    await waitFor(() => expect(message.success).toHaveBeenCalledWith('Saved.'))
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
    // The publish state is read again after a save.
    expect(WebsiteService.get).toHaveBeenCalledTimes(2)
  })

  test('adds, moves and removes sections', async () => {
    await loaded()
    vi.mocked(WebsiteService.updatePage).mockResolvedValue(page() as never)

    fireEvent.click(screen.getByRole('button', { name: 'Move 1. Hero down' }))
    expect(screen.getByRole('button', { name: 'Edit 1. Text' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove 2. Hero' }))
    fireEvent.click(within(await screen.findByRole('tooltip')).getByRole('button', { name: 'Remove' }))
    expect(screen.getByText('Select a block on the page to edit it.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Text' }))
    // The new block is selected, in the panel.
    expect(screen.getByRole('button', { name: 'Edit 2. Text' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('2 of 30 blocks')).toBeInTheDocument()
    fireEvent.click(saveBtn())

    const [, { sections }] = vi.mocked(WebsiteService.updatePage).mock.calls[0] as [
      string,
      { sections: { type: string }[] },
    ]
    expect(sections.map((s) => s.type)).toStrictEqual(['text', 'text'])
  })

  test('the canvas menu lists the pages in order, with the title as typed', async () => {
    vi.mocked(WebsiteService.getPages).mockResolvedValue([
      { ...page(), id: 'p-2', title: 'About', position: 1 },
      page(),
    ] as never)
    vi.mocked(WebsiteService.get).mockResolvedValue(website as never)
    renderPage()
    await screen.findByDisplayValue('Hello')
    fireEvent.change(optionsField('Title'), { target: { value: 'Welcome' } })
    const menu = within(within(screen.getByTestId('site-canvas')).getByRole('navigation')).getAllByRole('listitem')
    expect(menu.map((item) => item.textContent)).toStrictEqual(['Welcome', 'About'])
    expect(within(menu[0]).getByText('Welcome')).toHaveAttribute('aria-current', 'page')
  })

  test('a new block goes after the selected one', async () => {
    await loaded()
    fireEvent.click(screen.getByRole('button', { name: 'Image' }))
    expect(screen.getByRole('button', { name: 'Edit 2. Image' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Edit 3. Text' })).toBeInTheDocument()
  })

  test('a problem in another block selects it, so its field is seen', async () => {
    await loaded()
    vi.mocked(WebsiteService.updatePage).mockRejectedValue(
      httpError(400, { message: 'Bad', errors: [{ path: 'sections[1].html', message: 'Too long.' }] }),
    )
    fireEvent.change(screen.getByLabelText('Heading'), { target: { value: 'Changed' } })
    fireEvent.click(saveBtn())

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Edit 2. Text' })).toHaveAttribute('aria-pressed', 'true'),
    )
    expect(screen.getByLabelText('rich text')).toBeInTheDocument()
    expect(screen.getByText('Needs fixing')).toBeInTheDocument()
  })

  test('a problem the browser can see stops the save and is shown on its field', async () => {
    await loaded()
    fireEvent.change(screen.getByLabelText(/Button link/), { target: { value: 'javascript:alert(1)' } })
    fireEvent.click(saveBtn())

    expect(WebsiteService.updatePage).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Use a web, email or phone link, or /page-name.')
  })

  test('field problems from the API appear on their fields', async () => {
    await loaded()
    vi.mocked(WebsiteService.updatePage).mockRejectedValue(
      httpError(400, {
        message: 'Bad',
        errors: [{ path: 'sections[0].heading', message: 'Text of at most 120 characters.' }],
      }),
    )
    fireEvent.change(screen.getByLabelText('Heading'), { target: { value: 'Changed' } })
    fireEvent.click(saveBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent('Text of at most 120 characters.')
    expect(screen.getByLabelText('Heading')).toHaveAttribute('aria-invalid', 'true')
  })

  test('a stale save asks to reload and keeps the other change', async () => {
    await loaded()
    vi.mocked(WebsiteService.updatePage).mockRejectedValue(
      httpError(409, { message: 'The page was changed by someone else. Reload and try again.' }),
    )
    fireEvent.change(optionsField('Title'), { target: { value: 'Mine' } })
    fireEvent.click(saveBtn())

    expect(await screen.findByText(/Someone else changed this page/)).toBeInTheDocument()
    vi.mocked(WebsiteService.getPages).mockResolvedValue([page({ title: 'Theirs' })] as never)
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(await screen.findByDisplayValue('Theirs')).toBeInTheDocument()
  })

  test('a taken address name is shown on the name', async () => {
    await loaded()
    vi.mocked(WebsiteService.updatePage).mockRejectedValue(
      httpError(409, { message: 'Another page of this website has that address.' }),
    )
    fireEvent.change(optionsField('Address name'), { target: { value: 'about' } })
    fireEvent.click(saveBtn())

    expect(await screen.findByRole('alert')).toHaveTextContent('Another page has this address name.')
  })

  describe('preview', () => {
    const tab = () => ({ opener: {} as unknown, location: { href: '' }, close: vi.fn() })

    test('opens the draft in a new tab that cannot reach this one', async () => {
      await loaded()
      const opened = tab()
      const open = vi.spyOn(window, 'open').mockReturnValue(opened as never)
      vi.mocked(WebsiteService.getPreviewUrl).mockResolvedValue({
        url: 'https://reader.test/s/acme?preview=x',
        expiresAt: '',
      })

      fireEvent.click(screen.getByRole('button', { name: 'Preview' }))

      expect(open).toHaveBeenCalledWith('', '_blank')
      await waitFor(() => expect(opened.location.href).toBe('https://reader.test/s/acme?preview=x'))
      expect(opened.opener).toBeNull()
      expect(WebsiteService.updatePage).not.toHaveBeenCalled()
    })

    test('saves unsaved changes first', async () => {
      await loaded()
      const opened = tab()
      vi.spyOn(window, 'open').mockReturnValue(opened as never)
      vi.mocked(WebsiteService.updatePage).mockResolvedValue(page({ title: 'New' }) as never)
      vi.mocked(WebsiteService.getPreviewUrl).mockResolvedValue({ url: 'https://reader.test/p', expiresAt: '' })

      fireEvent.change(optionsField('Title'), { target: { value: 'New' } })
      fireEvent.click(screen.getByRole('button', { name: 'Preview' }))

      await waitFor(() => expect(opened.location.href).toBe('https://reader.test/p'))
      expect(WebsiteService.updatePage).toHaveBeenCalled()
    })

    test('a failed save closes the tab and makes no link', async () => {
      await loaded()
      const opened = tab()
      vi.spyOn(window, 'open').mockReturnValue(opened as never)
      vi.mocked(WebsiteService.updatePage).mockRejectedValue(httpError(500, { message: 'Server down' }))

      fireEvent.change(optionsField('Title'), { target: { value: 'New' } })
      fireEvent.click(screen.getByRole('button', { name: 'Preview' }))

      await waitFor(() => expect(opened.close).toHaveBeenCalled())
      expect(WebsiteService.getPreviewUrl).not.toHaveBeenCalled()
    })
  })

  describe('unsaved changes', () => {
    test('closing the tab asks first', async () => {
      await loaded()
      fireEvent.change(optionsField('Title'), { target: { value: 'Changed' } })
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    })

    test('nothing is asked without changes', async () => {
      await loaded()
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    })

    test('going back to the pages asks first', async () => {
      await loaded()
      fireEvent.change(optionsField('Title'), { target: { value: 'Changed' } })
      fireEvent.click(screen.getByRole('button', { name: 'Back to pages' }))
      fireEvent.click(within(await screen.findByRole('tooltip')).getByRole('button', { name: 'Leave' }))
      expect(await screen.findByText('pages list')).toBeInTheDocument()
    })
  })

  test('a save answered after a switch of company changes nothing', async () => {
    let finish!: (value: unknown) => void
    const { store } = await loaded()
    vi.mocked(WebsiteService.updatePage).mockReturnValue(new Promise((resolve) => (finish = resolve)) as never)
    fireEvent.change(optionsField('Title'), { target: { value: 'Old company' } })
    fireEvent.click(saveBtn())

    vi.mocked(WebsiteService.getPages).mockResolvedValue([] as never)
    await act(async () => {
      store.dispatch(changeCompany({ company: { id: 'co-2', name: 'Other', websiteBuilderEnabled: true } }))
    })
    await act(async () => finish(page({ title: 'Old company' })))

    expect(message.success).not.toHaveBeenCalled()
    expect(await screen.findByText('This page does not exist.')).toBeInTheDocument()
  })

  describe('after review', () => {
    test('typing in a text section counts as an unsaved change at once', async () => {
      await loaded()
      fireEvent.click(screen.getByRole('button', { name: 'Edit 2. Text' }))
      fireEvent.change(screen.getByLabelText('rich text'), { target: { value: '<p>New words</p>' } })
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
      // The canvas follows at once.
      expect(within(screen.getByTestId('site-canvas')).getByText('New words')).toBeInTheDocument()
      expect(saveBtn()).not.toBeDisabled()
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    })

    test('typing during a save is kept, not replaced by the saved page', async () => {
      let finish!: (value: unknown) => void
      await loaded()
      vi.mocked(WebsiteService.updatePage).mockReturnValue(new Promise((resolve) => (finish = resolve)) as never)
      fireEvent.change(optionsField('Title'), { target: { value: 'First' } })
      fireEvent.click(saveBtn())
      fireEvent.change(optionsField('Title'), { target: { value: 'First and more' } })

      await act(async () => finish(page({ title: 'First', updatedAt: 'new-time' })))

      expect(optionsField('Title')).toHaveValue('First and more')
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    })

    test('after a stale save, keeping my version loads theirs underneath and saves mine over it', async () => {
      await loaded()
      vi.mocked(WebsiteService.updatePage).mockRejectedValueOnce(
        httpError(409, { message: 'The page was changed by someone else. Reload and try again.' }),
      )
      fireEvent.change(optionsField('Title'), { target: { value: 'Mine' } })
      fireEvent.click(saveBtn())
      vi.mocked(WebsiteService.getPages).mockResolvedValue([
        page({ title: 'Theirs', updatedAt: 'their-time' }),
      ] as never)

      fireEvent.click(await screen.findByRole('button', { name: 'Keep my version' }))

      await waitFor(() => expect(screen.queryByText(/Someone else changed this page/)).not.toBeInTheDocument())
      expect(optionsField('Title')).toHaveValue('Mine')
      vi.mocked(WebsiteService.updatePage).mockResolvedValue(page({ title: 'Mine' }) as never)
      await screen.findByText('Editing: Theirs')
      fireEvent.click(screen.getByText('Save').closest('button') as HTMLElement)
      expect(WebsiteService.updatePage).toHaveBeenLastCalledWith(
        'p-1',
        expect.objectContaining({ title: 'Mine', updatedAt: 'their-time' }),
      )
    })

    test('a blocked preview tab shows the link to open by hand', async () => {
      await loaded()
      vi.spyOn(window, 'open').mockReturnValue(null)
      vi.mocked(WebsiteService.getPreviewUrl).mockResolvedValue({
        url: 'https://reader.test/s/acme?preview=x',
        expiresAt: '',
      })

      fireEvent.click(screen.getByRole('button', { name: 'Preview' }))

      const link = await screen.findByRole('link', { name: 'Open the preview' })
      expect(link).toHaveAttribute('href', 'https://reader.test/s/acme?preview=x')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    test('problems with the sections as a whole are shown', async () => {
      await loaded()
      vi.mocked(WebsiteService.updatePage).mockRejectedValue(
        httpError(400, {
          message: 'Bad',
          errors: [
            { path: 'sections', message: 'A list of at most 30 sections.' },
            { path: 'sections[1].type', message: 'One of hero, text.' },
          ],
        }),
      )
      fireEvent.change(optionsField('Title'), { target: { value: 'X' } })
      fireEvent.click(saveBtn())

      expect(await screen.findByText('A list of at most 30 sections.')).toBeInTheDocument()
      expect(screen.getByText('Section 2: One of hero, text.')).toBeInTheDocument()
    })

    test('no more than 30 sections can be added', async () => {
      vi.mocked(WebsiteService.getPages).mockResolvedValue([
        page({ sections: Array.from({ length: 30 }, (_, i) => ({ id: `s${i}`, type: 'articles', count: 3 })) }),
      ] as never)
      vi.mocked(WebsiteService.get).mockResolvedValue(website as never)
      renderPage()
      expect(await screen.findByText('A page can have at most 30 sections.')).toBeInTheDocument()
      for (const name of ['Hero', 'Text', 'Image', 'Gallery', 'Contact details', 'Latest articles']) {
        expect(screen.getByRole('button', { name })).toBeDisabled()
      }
    })

    test('a move is announced', async () => {
      await loaded()
      fireEvent.click(screen.getByRole('button', { name: 'Move 1. Hero down' }))
      expect(screen.getByText('Hero moved to position 2.')).toBeInTheDocument()
    })
  })

  test('loads the thumbnails of the images its sections use, and marks a missing one', async () => {
    vi.mocked(WebsiteService.getPages).mockResolvedValue([
      page({
        sections: [
          { id: 'i1', type: 'image', assetId: 'a1' },
          { id: 'i2', type: 'image', assetId: 'gone' },
        ],
      }),
    ] as never)
    vi.mocked(WebsiteService.get).mockResolvedValue(website as never)
    vi.mocked(WebsiteService.getImages).mockResolvedValue({
      data: [{ id: 'a1', url: 'https://cdn.test/a1.png', fileName: 'a1.png' }],
    } as never)
    renderPage()

    expect(await screen.findByRole('img', { name: 'a1.png' })).toHaveAttribute('src', 'https://cdn.test/a1.png')
    fireEvent.click(screen.getByRole('button', { name: 'Edit 2. Image' }))
    expect(screen.getByText('This image is missing. Choose another.')).toBeInTheDocument()
    expect(WebsiteService.getImages).toHaveBeenCalledWith(1, ['a1', 'gone'])
  })

  test('an image section without an image stops the save', async () => {
    vi.mocked(WebsiteService.getPages).mockResolvedValue([page({ sections: [{ id: 'i1', type: 'image' }] })] as never)
    vi.mocked(WebsiteService.get).mockResolvedValue(website as never)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Options' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Changed' } })
    fireEvent.click(saveBtn())
    expect(await screen.findByText('Choose an image.')).toBeInTheDocument()
    expect(WebsiteService.updatePage).not.toHaveBeenCalled()
  })

  describe('page SEO', () => {
    const openSeo = async () => fireEvent.click(await screen.findByRole('button', { name: 'Options' }))

    test('is folded away until opened, and saves what was typed', async () => {
      await loaded()
      expect(screen.queryByLabelText('Search title')).not.toBeInTheDocument()
      await openSeo()
      fireEvent.change(optionsField('Search title'), { target: { value: 'Fresh bread' } })
      fireEvent.change(optionsField('Search description'), { target: { value: 'Baked daily' } })
      vi.mocked(WebsiteService.updatePage).mockResolvedValue(page({ seo: { title: 'Fresh bread' } }) as never)
      fireEvent.click(saveBtn())
      await waitFor(() =>
        expect(WebsiteService.updatePage).toHaveBeenCalledWith(
          'p-1',
          expect.objectContaining({ seo: { title: 'Fresh bread', description: 'Baked daily', imageAssetId: null } }),
        ),
      )
    })

    test('typing in a field and emptying it again is not a change', async () => {
      await loaded()
      await openSeo()
      fireEvent.change(optionsField('Search title'), { target: { value: 'x' } })
      expect(saveBtn()).toBeEnabled()
      fireEvent.change(optionsField('Search title'), { target: { value: '' } })
      expect(saveBtn()).toBeDisabled()
    })

    test('shows its sharing image, and removing it sends null', async () => {
      vi.mocked(WebsiteService.getPages).mockResolvedValue([page({ seo: { imageAssetId: 's1' } })] as never)
      vi.mocked(WebsiteService.get).mockResolvedValue(website as never)
      vi.mocked(WebsiteService.getImages).mockResolvedValue({
        data: [{ id: 's1', url: 'https://cdn.test/s1.png', fileName: 's1.png' }],
      } as never)
      renderPage()
      await screen.findByDisplayValue('Hello')
      expect(WebsiteService.getImages).toHaveBeenCalledWith(1, ['s1'])
      await openSeo()
      const group = screen.getByRole('group', { name: 'Sharing image' })
      expect(await within(group).findByRole('img', { name: 's1.png' })).toBeInTheDocument()
      fireEvent.click(within(group).getByRole('button', { name: 'Remove image' }))
      expect(within(group).getByText('No image')).toBeInTheDocument()
      vi.mocked(WebsiteService.updatePage).mockResolvedValue(page({ seo: { imageAssetId: null } }) as never)
      fireEvent.click(saveBtn())
      await waitFor(() =>
        expect(WebsiteService.updatePage).toHaveBeenCalledWith(
          'p-1',
          expect.objectContaining({ seo: { title: '', description: '', imageAssetId: null } }),
        ),
      )
    })

    test('SEO problems from the API open the panel and show on their fields', async () => {
      await loaded()
      fireEvent.change(optionsField('Title'), { target: { value: 'Changed' } })
      vi.mocked(WebsiteService.updatePage).mockRejectedValue(
        httpError(400, { errors: [{ path: 'seo.description', message: 'Text of at most 160 characters.' }] }),
      )
      fireEvent.click(saveBtn())
      expect(await screen.findByText('Text of at most 160 characters.')).toBeInTheDocument()
      expect(optionsField('Search description')).toHaveAttribute('aria-invalid', 'true')
    })
  })
})
