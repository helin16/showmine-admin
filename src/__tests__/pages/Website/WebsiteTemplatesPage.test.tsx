import React from 'react'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import Locale from '../../../Components/Form/Locale'
import WebsiteTemplatesPage from '../../../Pages/Website/WebsiteTemplatesPage'
import WebsiteService from '../../../Services/WebsiteService'
import message from '../../../Components/Form/message'
import { changeCompany } from '../../../Redux/reduxers/auth.slice'
import { COMPANY_WEBSITE_PAGES_URL, COMPANY_WEBSITE_TEMPLATES_URL, COMPANY_WEBSITE_URL } from '../../../UrlMap'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../../components/Access/domHelpers'

// The template gallery (specs/001-website-builder, US4, T050).
vi.mock('../../../Services/WebsiteService', async (importOriginal) => {
  const actual = (await importOriginal()) as { default: object }
  return { default: { ...actual.default, getTemplates: vi.fn(), initialise: vi.fn() } }
})
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('../../../Layouts/BackendPage', () => ({
  default: ({ children, ContentHeader }: { children: React.ReactNode; ContentHeader?: React.ReactNode }) => (
    <main>
      <header>{ContentHeader}</header>
      {children}
    </main>
  ),
}))

beforeAll(() => stubMatchMedia())
beforeEach(() => {
  process.env.REACT_APP_FRONT_END_URL = 'https://reader.test'
})

const company = { id: 'co-1', name: 'Acme', websiteBuilderEnabled: true }
const template = (id: string, extra = {}) => ({
  id,
  version: 1,
  name: { en: `${id} en`, zh: `${id} 中` },
  description: { en: `${id} words`, zh: `${id} 说明` },
  thumbnail: `https://reader.test/templates/${id}.png`,
  ...extra,
})
const templates = [template('shop'), template('simple')]
const httpError = (status: number, data: object) =>
  Object.assign(new Error(`status ${status}`), { response: { status, data } })

const renderPage = (state: object = { auth: { company } }) =>
  renderWithProviders(
    <Routes>
      <Route path={COMPANY_WEBSITE_TEMPLATES_URL} element={<WebsiteTemplatesPage />} />
      <Route path={COMPANY_WEBSITE_URL} element={<div>overview page</div>} />
      <Route path={COMPANY_WEBSITE_PAGES_URL} element={<div>pages list</div>} />
    </Routes>,
    { state, route: COMPANY_WEBSITE_TEMPLATES_URL },
  )
const cardOf = async (name: string) =>
  (await screen.findByRole('heading', { name })).closest('.ant-card') as HTMLElement
const useBtn = async (name: string) => within(await cardOf(name)).getByRole('button', { name: 'Use this template' })

describe('WebsiteTemplatesPage', () => {
  test('with the builder off, shows the not-allowed panel and loads nothing', () => {
    renderPage({ auth: { company: { ...company, websiteBuilderEnabled: false } } })
    expect(screen.getByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
    expect(WebsiteService.getTemplates).not.toHaveBeenCalled()
  })

  test('shows each template with its thumbnail, words and a preview in a new tab', async () => {
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    renderPage()

    const card = await cardOf('shop en')
    expect(within(card).getByText('shop words')).toBeInTheDocument()
    expect(within(card).getByRole('img', { name: 'A preview of the shop en template' })).toHaveAttribute(
      'src',
      'https://reader.test/templates/shop.png',
    )
    const preview = within(card).getByRole('link', { name: 'Preview' })
    expect(preview).toHaveAttribute('href', 'https://reader.test/t/shop')
    expect(preview).toHaveAttribute('target', '_blank')
    expect(preview).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText(/also sets the colour and fonts/)).toBeInTheDocument()
  })

  test('in Chinese, shows the Chinese name and description', async () => {
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    renderPage({ auth: { company }, app: { locale: Locale.zhCN } })
    const card = await cardOf('shop 中')
    expect(within(card).getByText('shop 说明')).toBeInTheDocument()
  })

  test('without the Reader address, preview is disabled and says why', async () => {
    delete process.env.REACT_APP_FRONT_END_URL
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    renderPage()
    const card = await cardOf('shop en')
    expect(within(card).getByRole('button', { name: 'Preview' })).toBeDisabled()
    expect(screen.getByText('Not available: the Reader address is not configured.')).toBeInTheDocument()
  })

  test('cards are one per row on a phone and three on a wide screen', async () => {
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    renderPage()
    const col = (await cardOf('shop en')).closest('.ant-col') as HTMLElement
    expect(col).toHaveClass('ant-col-xs-24')
    expect(col).toHaveClass('ant-col-lg-8')
  })

  test('with no pages yet, uses the template and goes on to its pages', async () => {
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    vi.mocked(WebsiteService.initialise).mockResolvedValue([] as never)
    renderPage()

    fireEvent.click(await useBtn('simple en'))

    expect(WebsiteService.initialise).toHaveBeenCalledExactlyOnceWith({ templateId: 'simple', templateVersion: 1 })
    expect(await screen.findByText('pages list')).toBeInTheDocument()
    expect(message.success).toHaveBeenCalledWith('The simple en template was applied.')
  })

  describe('existing pages', () => {
    beforeEach(() => {
      vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    })

    test('asks before replacing them, naming how many, and replaces with that count', async () => {
      vi.mocked(WebsiteService.initialise)
        .mockRejectedValueOnce(httpError(409, { message: 'This website already has pages.', pageCount: 3 }))
        .mockResolvedValueOnce([] as never)
      renderPage()

      fireEvent.click(await useBtn('shop en'))
      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByText(/This replaces your 3 pages/)).toBeInTheDocument()
      fireEvent.click(within(dialog).getByRole('button', { name: 'Replace pages' }))

      await waitFor(() =>
        expect(WebsiteService.initialise).toHaveBeenLastCalledWith({
          templateId: 'shop',
          templateVersion: 1,
          replace: true,
          pageCount: 3,
        }),
      )
      expect(await screen.findByText('pages list')).toBeInTheDocument()
    })

    test('cancelling replaces nothing', async () => {
      vi.mocked(WebsiteService.initialise).mockRejectedValue(httpError(409, { message: 'Pages', pageCount: 1 }))
      renderPage()

      fireEvent.click(await useBtn('shop en'))
      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByText(/This replaces your 1 page with/)).toBeInTheDocument()
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

      expect(WebsiteService.initialise).toHaveBeenCalledTimes(1)
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    test('pages added meanwhile are named before anything is replaced', async () => {
      vi.mocked(WebsiteService.initialise)
        .mockRejectedValueOnce(httpError(409, { message: 'Pages', pageCount: 2 }))
        .mockRejectedValueOnce(httpError(409, { message: 'Pages', pageCount: 5 }))
      renderPage()

      fireEvent.click(await useBtn('shop en'))
      fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Replace pages' }))

      expect(await screen.findByText(/This replaces your 5 pages/)).toBeInTheDocument()
    })
  })

  test('a plan limit is shown as a message', async () => {
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    vi.mocked(WebsiteService.initialise).mockRejectedValue(httpError(403, { message: 'Your plan allows 1 page.' }))
    renderPage()

    fireEvent.click(await useBtn('shop en'))

    await waitFor(() =>
      expect(message.error).toHaveBeenCalledWith(
        'Your plan does not allow this many pages. Choose a smaller template or change your plan.',
      ),
    )
    expect(screen.queryByText('pages list')).not.toBeInTheDocument()
  })

  test('an updated template reloads the list', async () => {
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    vi.mocked(WebsiteService.initialise).mockRejectedValue(
      httpError(409, { message: 'This template has been updated.' }),
    )
    renderPage()

    fireEvent.click(await useBtn('shop en'))

    await waitFor(() => expect(message.error).toHaveBeenCalledWith(expect.stringMatching(/has been updated/)))
    await waitFor(() => expect(WebsiteService.getTemplates).toHaveBeenCalledTimes(2))
  })

  test('a template withdrawn since loading reloads the list', async () => {
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    vi.mocked(WebsiteService.initialise).mockRejectedValue(httpError(404, { message: 'This template does not exist.' }))
    renderPage()

    fireEvent.click(await useBtn('shop en'))

    await waitFor(() => expect(WebsiteService.getTemplates).toHaveBeenCalledTimes(2))
    expect(message.error).toHaveBeenCalledWith(expect.stringMatching(/has been updated/))
  })

  test('other cards wait while one template is being applied', async () => {
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    vi.mocked(WebsiteService.initialise).mockReturnValue(new Promise(() => undefined) as never)
    renderPage()

    fireEvent.click(await useBtn('shop en'))

    expect(await useBtn('simple en')).toBeDisabled()
    expect(WebsiteService.initialise).toHaveBeenCalledTimes(1)
  })

  test('an answer arriving after a switch of company is dropped', async () => {
    let fail!: (err: unknown) => void
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    vi.mocked(WebsiteService.initialise).mockReturnValue(new Promise((_, reject) => (fail = reject)) as never)
    const { store } = renderPage()
    fireEvent.click(await useBtn('shop en'))

    await act(async () => {
      store.dispatch(changeCompany({ company: { id: 'co-2', name: 'Other', websiteBuilderEnabled: true } }))
    })
    await act(async () => fail(httpError(409, { message: 'Pages', pageCount: 4 })))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Nothing is left waiting on the old request.
    const card = await cardOf('shop en')
    await waitFor(() => expect(within(card).getByText('Use this template').closest('button')).not.toBeDisabled())
    expect(message.error).not.toHaveBeenCalled()
  })

  test('without a website, links to the overview to create one', async () => {
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    vi.mocked(WebsiteService.initialise).mockRejectedValue(
      httpError(404, { message: 'This company has no website yet.' }),
    )
    renderPage()

    fireEvent.click(await useBtn('shop en'))

    fireEvent.click(await screen.findByRole('link', { name: 'Create the website' }))
    expect(await screen.findByText('overview page')).toBeInTheDocument()
  })

  test('a failed load says why and can be tried again', async () => {
    vi.mocked(WebsiteService.getTemplates).mockRejectedValueOnce(httpError(500, { message: 'Server down' }))
    renderPage()
    expect(await screen.findByText('The templates could not be loaded: Server down')).toBeInTheDocument()

    vi.mocked(WebsiteService.getTemplates).mockResolvedValue(templates as never)
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
    expect(await cardOf('shop en')).toBeInTheDocument()
  })

  test('an empty list says so', async () => {
    vi.mocked(WebsiteService.getTemplates).mockResolvedValue([] as never)
    renderPage()
    expect(await screen.findByText('No templates yet.')).toBeInTheDocument()
  })
})
