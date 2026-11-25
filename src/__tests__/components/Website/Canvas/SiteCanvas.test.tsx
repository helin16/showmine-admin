import React from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import SiteCanvas from '../../../../Components/Website/Canvas/SiteCanvas'
import { cleanHtml } from '../../../../Components/Website/Canvas/canvasBlocks'
import WebsiteService from '../../../../Services/WebsiteService'
import { IWebsiteSection } from '../../../../Types/Website/IWebsite'
import { stubMatchMedia } from '../../Access/domHelpers'

// The canvas of the page editor (specs/004-website-visual-editor, US2, T006).
vi.mock('../../../../Services/WebsiteService', () => ({ default: { getReaderUrl: vi.fn() } }))

beforeAll(() => stubMatchMedia())

const sections: IWebsiteSection[] = [
  {
    id: 'h',
    type: 'hero',
    heading: 'Hello',
    subheading: 'Sub',
    buttonText: 'Go',
    buttonUrl: '/about',
    imageAssetId: 'a1',
  },
  { id: 't', type: 'text', html: '<p>Words <a href="https://x.test">link</a></p>' },
  { id: 'i', type: 'image', assetId: 'a1', alt: 'Shop', caption: 'Our shop' },
  { id: 'g', type: 'gallery', images: [{ assetId: 'a1', alt: 'One' }, { assetId: 'gone' }] },
  { id: 'c', type: 'contact', showPhone: true, showEmail: true, showAddress: false, mapUrl: 'https://maps.test/x' },
  { id: 'r', type: 'articles', count: 6 },
]
const images = { a1: { id: 'a1', url: 'https://cdn.test/a1.png', fileName: 'a1.png' } as never, gone: null }
const company = { id: 'co', name: 'Acme', contactNumber: '0400 000 000', email: 'a@acme.test', address: '1 St' }
const props = (extra = {}) => ({
  website: {
    id: 'w',
    slug: 'acme',
    hasUnpublishedChanges: false,
    theme: { primaryColor: '#ff0000', fontPair: 'classic' },
  },
  company,
  pageTitles: ['Home', 'About'],
  currentIndex: 1,
  sections,
  images,
  problemIds: [],
  onSelect: vi.fn(),
  onMove: vi.fn(),
  onRemove: vi.fn(),
  ...extra,
})
const canvas = () => screen.getByTestId('site-canvas')
const fetchMock = vi.fn()

beforeEach(() => {
  vi.mocked(WebsiteService.getReaderUrl).mockReturnValue(null)
  fetchMock.mockReset()
  // Not stubGlobal: undoing that would also undo the setup's ResizeObserver.
  vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)
})
afterEach(() => vi.restoreAllMocks())

describe('SiteCanvas', () => {
  test('draws the blocks in order with the Reader class names, theme and menu', () => {
    render(<SiteCanvas {...(props() as never)} />)
    const site = canvas().firstElementChild as HTMLElement
    expect(site).toHaveClass('site', 'site-font-classic')
    expect(site.style.getPropertyValue('--site-primary')).toBe('#ff0000')
    expect(within(site).getByRole('navigation')).toHaveClass('site-nav')
    expect(within(site).getByText('About').closest('a')).toHaveAttribute('aria-current', 'page')
    expect(within(site).getByText('Home').closest('a')).not.toHaveAttribute('aria-current')

    const page = site.querySelector('.site-page') as HTMLElement
    const drawn = Array.from(page.querySelectorAll('[role=button] > *')).map((el) => el.className)
    expect(drawn).toStrictEqual([
      'site-hero with-image',
      'site-text',
      'site-image',
      'site-gallery',
      'site-contact',
      'site-articles',
    ])
    expect(page.querySelector('.site-hero')).toHaveStyle({ backgroundImage: 'url("https://cdn.test/a1.png")' })
    expect(within(page).getByText('Go')).toHaveClass('site-button')
    expect(within(page).getByText('Our shop').tagName).toBe('FIGCAPTION')
    // Only images still among the website images are drawn.
    expect(page.querySelectorAll('.site-gallery img')).toHaveLength(1)
    expect(within(page).getByText('0400 000 000')).toBeInTheDocument()
    expect(within(page).queryByText('1 St')).not.toBeInTheDocument()
    expect(page.querySelector('.site-map')).toHaveAttribute('src', 'https://maps.test/x')
    expect(within(page).getByText('The latest 6 articles show here.')).toBeInTheDocument()
  })

  test('falls back to the default font and colour, and draws no button without a link', () => {
    render(
      <SiteCanvas
        {...(props({
          website: { id: 'w', theme: { primaryColor: 'red', fontPair: 'odd' } },
          sections: [{ id: 'h', type: 'hero', heading: 'Hi', buttonText: 'Go' }],
        }) as never)}
      />,
    )
    const site = canvas().firstElementChild as HTMLElement
    expect(site).toHaveClass('site-font-modern')
    expect(site.style.getPropertyValue('--site-primary')).toBe('')
    expect(site.querySelector('.site-hero')).not.toHaveClass('with-image')
    expect(within(site).queryByText('Go')).not.toBeInTheDocument()
  })

  test('narrows to tablet and phone widths', () => {
    render(<SiteCanvas {...(props() as never)} />)
    expect(canvas()).toHaveStyle({ maxWidth: '100%' })
    fireEvent.click(screen.getByText('Tablet'))
    expect(canvas()).toHaveStyle({ maxWidth: '768px' })
    fireEvent.click(screen.getByText('Phone'))
    expect(canvas()).toHaveStyle({ maxWidth: '375px' })
  })

  test('selects a block by click or keyboard, and shows the toolbar on the selected one', () => {
    const p = props({ selectedId: 't' })
    render(<SiteCanvas {...(p as never)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit 1. Hero' }))
    expect(p.onSelect).toHaveBeenLastCalledWith('h')
    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit 3. Image' }), { key: 'Enter' })
    expect(p.onSelect).toHaveBeenLastCalledWith('i')
    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit 4. Gallery' }), { key: ' ' })
    expect(p.onSelect).toHaveBeenLastCalledWith('g')
    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit 5. Contact details' }), { key: 'a' })
    expect(p.onSelect).toHaveBeenCalledTimes(3)

    expect(screen.getByRole('button', { name: 'Edit 2. Text' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Edit 1. Hero' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Move 2. Text up' }))
    expect(p.onMove).toHaveBeenLastCalledWith(1, -1)
    fireEvent.click(screen.getByRole('button', { name: 'Move 2. Text down' }))
    expect(p.onMove).toHaveBeenLastCalledWith(1, 1)
    expect(screen.queryByRole('button', { name: 'Move 1. Hero up' })).not.toBeInTheDocument()
  })

  test('the first block cannot move up, nor the last down', () => {
    const { rerender } = render(<SiteCanvas {...(props({ selectedId: 'h' }) as never)} />)
    expect(screen.getByRole('button', { name: 'Move 1. Hero up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move 1. Hero down' })).not.toBeDisabled()
    rerender(<SiteCanvas {...(props({ selectedId: 'r' }) as never)} />)
    expect(screen.getByRole('button', { name: 'Move 6. Latest articles down' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move 6. Latest articles up' })).not.toBeDisabled()
  })

  test('removes the selected block after confirming', async () => {
    const p = props({ selectedId: 'i' })
    render(<SiteCanvas {...(p as never)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove 3. Image' }))
    expect(p.onRemove).not.toHaveBeenCalled()
    fireEvent.click(within(await screen.findByRole('tooltip')).getByRole('button', { name: 'Remove' }))
    expect(p.onRemove).toHaveBeenCalledWith(2)
  })

  test('marks the blocks with problems', () => {
    render(<SiteCanvas {...(props({ problemIds: ['g'] }) as never)} />)
    const marks = screen.getAllByText('Needs fixing')
    expect(marks).toHaveLength(1)
    expect(marks[0].parentElement?.parentElement?.parentElement).toContainElement(
      screen.getByRole('button', { name: 'Edit 4. Gallery' }),
    )
  })

  test('links on the canvas go nowhere', () => {
    render(<SiteCanvas {...(props() as never)} />)
    const link = within(canvas()).getByText('link')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    const plain = new MouseEvent('click', { bubbles: true, cancelable: true })
    within(canvas()).getByText('Our shop').dispatchEvent(plain)
    expect(plain.defaultPrevented).toBe(false)
  })

  describe('the site styles', () => {
    test('without the Reader address, says so and draws the blocks plain', () => {
      const { container } = render(<SiteCanvas {...(props() as never)} />)
      expect(screen.getByRole('status')).toHaveTextContent('The website styles could not be loaded')
      expect(container.textContent).not.toContain('.site-hero')
      expect(fetchMock).not.toHaveBeenCalled()
    })

    test('are read from the Reader once, and used', async () => {
      vi.mocked(WebsiteService.getReaderUrl).mockImplementation((path: string) => `https://reader.test${path}`)
      fetchMock.mockResolvedValue({ ok: true, text: () => Promise.resolve('.site-hero{color:red}') })
      const { container, unmount } = render(<SiteCanvas {...(props() as never)} />)
      await waitFor(() => expect(container.querySelector('style')).toHaveTextContent('.site-hero{color:red}'))
      expect(fetchMock).toHaveBeenCalledWith('https://reader.test/website.css')
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      unmount()
      const again = render(<SiteCanvas {...(props() as never)} />)
      await waitFor(() => expect(again.container.querySelector('style')).toHaveTextContent('.site-hero{color:red}'))
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test('a failed read says so, and is tried again next time', async () => {
      vi.mocked(WebsiteService.getReaderUrl).mockImplementation((path: string) => `https://other.test${path}`)
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 })
      const { unmount } = render(<SiteCanvas {...(props() as never)} />)
      expect(await screen.findByRole('status')).toBeInTheDocument()
      unmount()
      fetchMock.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('.site{}') })
      const { container } = render(<SiteCanvas {...(props() as never)} />)
      await waitFor(() => expect(container.querySelector('style')).toHaveTextContent('.site{}'))
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })

  // SC-003: a change shows within 100 ms on a page of 30 blocks.
  test('redraws 30 blocks within 100 ms', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: `s${i}`, type: 'hero', heading: `Block ${i}` }))
    const { rerender } = render(<SiteCanvas {...(props({ sections: many }) as never)} />)
    const changed = many.map((s, i) => (i === 15 ? { ...s, heading: 'Changed' } : s))
    const start = performance.now()
    act(() => rerender(<SiteCanvas {...(props({ sections: changed }) as never)} />))
    expect(performance.now() - start).toBeLessThan(100)
    expect(screen.getByText('Changed')).toBeInTheDocument()
  })
})

// Unsaved text is cleaned before it is drawn (research R2a).
describe('cleanHtml', () => {
  test('drops scripts, handlers, ids and unsafe links', () => {
    const html = cleanHtml(
      '<p id="__NEXT_DATA__" onclick="x()">Hi<script>alert(1)</script><img src="x" onerror="alert(1)">' +
        '<a href="javascript:alert(1)">a</a><a href="data:text/html,x">b</a><a href="//evil.test">c</a>' +
        '<a href="https://ok.test" target="_blank">d</a><a href="/about">e</a><a href="mailto:a@b.test">f</a></p>' +
        '<form><input></form><style>body{display:none}</style>',
    )
    expect(html).not.toMatch(/script|onclick|onerror|javascript|data:|evil|__NEXT_DATA__|<form|<input|<style/)
    expect(html).toContain('href="https://ok.test"')
    expect(html).toContain('href="/about"')
    expect(html).toContain('href="mailto:a@b.test"')
  })

  test('drops names, svg and math, and keeps relative links', () => {
    const html = cleanHtml(
      '<img name="gtag" src="https://x.test/a.png"><a name="dataLayer" href="about">a</a><a href="?x=1">b</a>' +
        '<svg><a href="https://x.test">s</a></svg><math><mi>x</mi></math>',
    )
    expect(html).not.toMatch(/name=|<svg|<math/)
    expect(html).toContain('href="about"')
    expect(html).toContain('href="?x=1"')
    expect(html).toContain('src="https://x.test/a.png"')
  })

  test('keeps frames only from the hosts the API keeps', () => {
    const html = cleanHtml(
      '<iframe src="https://www.youtube.com/embed/x" allowfullscreen></iframe>' +
        '<iframe src="https://evil.test/x"></iframe><iframe src="http://v.qq.com/x"></iframe><iframe></iframe>',
    )
    expect(html.match(/<iframe/g)).toHaveLength(1)
    expect(html).toContain('src="https://www.youtube.com/embed/x"')
    expect(html).toContain('allowfullscreen')
  })
})
