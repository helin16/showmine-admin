import React from 'react'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import PublishBar, { describeProblems } from '../../../Components/Website/PublishBar'
import WebsiteService from '../../../Services/WebsiteService'
import message from '../../../Components/Form/message'
import { changeCompany } from '../../../Redux/reduxers/auth.slice'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../Access/domHelpers'

// The publish bar (specs/001-website-builder, US3, T047).
vi.mock('../../../Services/WebsiteService', () => ({
  default: { publish: vi.fn(), unpublish: vi.fn(), getPages: vi.fn() },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))

beforeAll(() => stubMatchMedia())

const website = (extra = {}) => ({
  id: 'w-1',
  companyId: 'co-1',
  slug: 'acme',
  publishedAt: null,
  hasUnpublishedChanges: true,
  updatedAt: '2026-11-24T01:00:00.000Z',
  ...extra,
})
const published = { publishedAt: '2026-11-20T00:00:00.000Z', hasUnpublishedChanges: false }
const httpError = (status: number, data: object) =>
  Object.assign(new Error(`status ${status}`), { response: { status, data } })
const pages = [
  { id: 'p-1', slug: 'home', title: 'Home', position: 0, hasUnpublishedChanges: true },
  { id: 'p-2', slug: 'about', title: 'About us', position: 1, hasUnpublishedChanges: true },
]

const renderBar = (props = {}) => {
  const onChanged = vi.fn()
  const onStale = vi.fn()
  renderWithProviders(<PublishBar website={website() as never} onChanged={onChanged} onStale={onStale} {...props} />)
  return { onChanged, onStale }
}
const publishBtn = () => screen.getByRole('button', { name: 'Publish' })

describe('PublishBar', () => {
  test.each([
    [{}, 'Not published', false],
    [{ publishedAt: '2026-11-20T00:00:00.000Z', hasUnpublishedChanges: true }, 'with changes not yet published', false],
    [published, 'Published', true],
  ])('state %o shows "%s"; publish disabled: %s', (extra, text, isDisabled) => {
    renderBar({ website: website(extra) })
    expect(screen.getByText(new RegExp(text))).toBeInTheDocument()
    expect(publishBtn().closest('button')!.disabled).toBe(isDisabled)
  })

  test('publishes with the updatedAt it was given', async () => {
    vi.mocked(WebsiteService.publish).mockResolvedValue(website(published) as never)
    const { onChanged } = renderBar()

    fireEvent.click(publishBtn())

    expect(WebsiteService.publish).toHaveBeenCalledWith('2026-11-24T01:00:00.000Z')
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(website(published)))
    expect(message.success).toHaveBeenCalledWith('Published. Visitors now see this version.')
  })

  test('cannot publish while the page has unsaved changes, and says so', () => {
    renderBar({ hasUnsavedChanges: true })
    expect(publishBtn()).toBeDisabled()
    expect(screen.getByText('Save the page first to publish its changes.')).toBeInTheDocument()
  })

  test('a refused publish lists each problem in words, linked to its page', async () => {
    vi.mocked(WebsiteService.publish).mockRejectedValue(
      httpError(400, {
        message: 'The website cannot be published yet.',
        errors: [
          { path: 'pages[about].sections[1].buttonUrl', message: 'No page has this address.' },
          { path: 'pages[home].seo.imageAssetId', message: 'This image is missing.' },
          { path: 'seo.imageAssetId', message: 'This image is missing.' },
        ],
      }),
    )
    vi.mocked(WebsiteService.getPages).mockResolvedValue(pages as never)
    renderBar()

    fireEvent.click(publishBtn())

    const problem = await screen.findByRole('link', { name: 'Page About us, section 2: No page has this address.' })
    expect(problem).toHaveAttribute('href', '/b/company/website/pages/p-2')
    expect(screen.getByRole('link', { name: 'Page Home: This image is missing.' })).toHaveAttribute(
      'href',
      '/b/company/website/pages/p-1',
    )
    expect(screen.getByText('Website: This image is missing.')).toBeInTheDocument()
  })

  test('a stale publish asks the page to reload', async () => {
    vi.mocked(WebsiteService.publish).mockRejectedValue(httpError(409, { message: 'stale' }))
    const { onStale, onChanged } = renderBar()

    fireEvent.click(publishBtn())

    await waitFor(() => expect(onStale).toHaveBeenCalled())
    expect(onChanged).not.toHaveBeenCalled()
  })

  test('unpublishing asks first', async () => {
    vi.mocked(WebsiteService.unpublish).mockResolvedValue(website() as never)
    const { onChanged } = renderBar({ website: website(published) })

    fireEvent.click(screen.getByRole('button', { name: 'Unpublish' }))
    expect(WebsiteService.unpublish).not.toHaveBeenCalled()
    const confirm = await screen.findByRole('tooltip')
    fireEvent.click(within(confirm).getByRole('button', { name: 'Unpublish' }))

    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(website()))
    expect(message.success).toHaveBeenCalledWith('Unpublished. Visitors no longer see the website.')
  })

  test('no unpublish before the first publish', () => {
    renderBar()
    expect(screen.queryByRole('button', { name: 'Unpublish' })).not.toBeInTheDocument()
  })

  test('describeProblems keeps a slug as the name when the page is unknown, and the no-pages message as is', () => {
    expect(
      describeProblems(
        [
          { path: 'pages', message: 'Add a page first.' },
          { path: 'pages[gone].sections[0].heading', message: 'Too long.' },
        ],
        [],
      ),
    ).toStrictEqual([{ text: 'Add a page first.' }, { text: 'Page gone, section 1: Too long.', pageId: undefined }])
  })

  // specs/004, slice 4a: a problem in the layout says where and links to the Layout page.
  test('describeProblems names the place in the layout', () => {
    expect(
      describeProblems(
        [
          { path: 'layout.header.links[1].url', message: 'No page has this address.' },
          { path: 'layout.footer.columns[0].items[2].assetId', message: 'Missing.' },
          { path: 'layout.footer.columns[3].heading', message: 'Too long.' },
          { path: 'layout.extra', message: 'Not a known field.' },
          { path: 'layout.sharedAbove[0].buttonUrl', message: 'No page has this address.' },
          { path: 'layout.sharedBelow[2].assetId', message: 'Missing.' },
        ],
        [],
      ),
    ).toStrictEqual([
      { text: 'Header, link 2: No page has this address.', isLayout: true },
      { text: 'Footer, column 1, item 3: Missing.', isLayout: true },
      { text: 'Footer, column 4: Too long.', isLayout: true },
      { text: 'Website layout: Not a known field.', isLayout: true },
      { text: 'Above every page, block 1: No page has this address.', isLayout: true },
      { text: 'Below every page, block 3: Missing.', isLayout: true },
    ])
  })

  test('an answer arriving after a switch of company is dropped', async () => {
    let finish!: (value: unknown) => void
    vi.mocked(WebsiteService.publish).mockReturnValue(new Promise((resolve) => (finish = resolve)) as never)
    const onChanged = vi.fn()
    const { store } = renderWithProviders(
      <PublishBar website={website() as never} onChanged={onChanged} onStale={vi.fn()} />,
      { state: { auth: { company: { id: 'co-1' } } } as never },
    )
    fireEvent.click(publishBtn())
    await act(async () => {
      store.dispatch(changeCompany({ company: { id: 'co-2' } }))
    })
    await act(async () => finish(website(published)))
    expect(onChanged).not.toHaveBeenCalled()
    expect(message.success).not.toHaveBeenCalled()
  })
})
