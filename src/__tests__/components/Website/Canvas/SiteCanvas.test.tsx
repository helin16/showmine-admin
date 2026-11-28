import React from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import SiteCanvas from '../../../../Components/Website/Canvas/SiteCanvas'
import { cleanHtml, FOOTER_ICONS, getThemeStyle } from '../../../../Components/Website/Canvas/canvasBlocks'
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
  pages: [
    { id: 'p1', title: 'Home' },
    { id: 'p2', title: 'About' },
  ],
  currentIndex: 1,
  sections,
  images,
  problemIds: [],
  onSelect: vi.fn(),
  onMove: vi.fn(),
  onRemove: vi.fn(),
  onPreview: vi.fn(),
  canPreview: true,
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
    expect(site).not.toHaveClass('site-style-airy')
    expect(site.style.getPropertyValue('--site-primary')).toBe('#ff0000')
    expect(within(site).getByRole('navigation')).toHaveClass('site-nav')
    expect(within(site).getByText('About').closest('a')).toHaveAttribute('aria-current', 'page')
    expect(within(site).getByText('Home').closest('a')).not.toHaveAttribute('aria-current')

    const page = site.querySelector('.site-page') as HTMLElement
    const drawn = Array.from(page.querySelectorAll('.canvas-item')).map((item) => item.lastElementChild?.className)
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

  // specs/005-website-blocks, slice 88a: the same markup as the Reader's Buttons and Split.
  test('draws a second button, a note, and an image beside text on its side', () => {
    render(
      <SiteCanvas
        {...(props({
          sections: [
            {
              id: 'h',
              type: 'hero',
              buttonText: 'Go',
              buttonUrl: '/a',
              button2Text: 'Login',
              button2Url: '/b',
              note: 'Free',
            },
            { id: 'x', type: 'hero', heading: 'Half', button2Text: 'No link' },
            {
              id: 's',
              type: 'split',
              heading: 'Side',
              text: 'One\nTwo',
              imageAssetId: 'a1',
              imageAlt: 'Shop',
              imageSide: 'right',
            },
            { id: 'l', type: 'split', heading: 'Left', imageAssetId: 'gone' },
          ],
        }) as never)}
      />,
    )
    const [hero, half] = Array.from(canvas().querySelectorAll('.site-hero'))
    expect(
      Array.from(hero.querySelectorAll('.site-buttons a')).map((a) => [
        a.textContent,
        a.className,
        a.getAttribute('href'),
      ]),
    ).toStrictEqual([
      ['Go', 'site-button', '#'],
      ['Login', 'site-button second', '#'],
    ])
    expect(hero.querySelector('.site-buttons .site-note')).toHaveTextContent('Free')
    expect(half.querySelector('.site-buttons')).toBeNull()
    const [right, left] = Array.from(canvas().querySelectorAll('.site-split'))
    expect(right).toHaveClass('image-right')
    expect(right.querySelector('img')).toHaveAttribute('src', 'https://cdn.test/a1.png')
    expect(right.querySelector('img')).toHaveAttribute('alt', 'Shop')
    expect(right.querySelector('.site-split-text h2')).toHaveTextContent('Side')
    expect(right.querySelector('.site-split-text p')?.textContent).toBe('One\nTwo')
    expect(left).toHaveClass('image-left')
    expect(left.querySelector('img')).toBeNull()
  })

  // specs/006-website-message-form: the Reader's form markup, its fields disabled and nothing sent.
  test('draws a message form with its words, the four fields disabled', () => {
    render(
      <SiteCanvas
        {...(props({
          sections: [
            { id: 'f', type: 'form', heading: 'Drop us a note', intro: 'Any time', buttonText: 'Post it' },
            { id: 'g', type: 'form' },
          ],
        }) as never)}
      />,
    )
    const [form, plain] = Array.from(canvas().querySelectorAll('.site-form'))
    expect(form.querySelector('h2')).toHaveTextContent('Drop us a note')
    expect(form.querySelector('.site-cards-intro')).toHaveTextContent('Any time')
    expect(Array.from(form.querySelectorAll('.site-form-field')).map((f) => f.className)).toStrictEqual([
      'site-form-field firstName',
      'site-form-field lastName',
      'site-form-field email',
      'site-form-field message',
    ])
    expect(Array.from(form.querySelectorAll('label')).map((l) => l.textContent)).toStrictEqual([
      'First name 名',
      'Last name 姓',
      'Email 邮箱',
      'Message 留言',
    ])
    form.querySelectorAll('input, textarea, button').forEach((el) => expect(el).toBeDisabled())
    expect(form.querySelector('textarea')).not.toBeNull()
    expect(form.querySelector('button.site-button')).toHaveTextContent('Post it')
    expect(plain.querySelector('button')).toHaveTextContent('Send')
    expect(plain.querySelector('h2')).toBeNull()
  })

  // specs/005-website-blocks, slice 88c: the same markup as the Reader's Pricing and MapBlock.
  test('draws pricing plans and a map block', () => {
    render(
      <SiteCanvas
        {...(props({
          sections: [
            {
              id: 'p',
              type: 'pricing',
              heading: 'Plans',
              plans: [
                {
                  name: 'Free',
                  price: '$0',
                  period: 'monthly',
                  features: ['1 user', ' ', 'x'],
                  buttonText: 'Go',
                  buttonUrl: '/a',
                },
                { name: 'Pro', price: '$9', highlight: true, buttonText: 'Go' },
              ],
            },
            { id: 'm', type: 'map', mapUrl: 'https://maps.test/x', height: 'small' },
            { id: 'n', type: 'map', mapUrl: 'http://maps.test/y' },
            { id: 'o', type: 'map', mapUrl: 'https://maps.test/z', height: 'huge' },
          ],
        }) as never)}
      />,
    )
    const block = canvas().querySelector('.site-pricing') as HTMLElement
    expect(block.querySelector('h2')).toHaveTextContent('Plans')
    const plans = Array.from(block.querySelectorAll(':scope > ul > li'))
    expect(plans.map((p) => p.className)).toStrictEqual(['site-plan', 'site-plan highlight'])
    expect(plans[0].querySelector('.site-price')?.textContent).toBe('$0 monthly')
    expect(Array.from(plans[0].querySelectorAll('ul li')).map((li) => li.textContent)).toStrictEqual(['1 user', 'x'])
    expect(plans[0].querySelector('a.site-button')).toHaveAttribute('href', '#')
    expect(plans[1].querySelector('a')).toBeNull()
    const maps = Array.from(canvas().querySelectorAll('.site-map-block'))
    expect(maps.map((m) => m.className)).toStrictEqual(['site-map-block small', 'site-map-block medium'])
    expect(maps[0].querySelector('iframe')).toHaveAttribute('src', 'https://maps.test/x')
    expect(maps[0].querySelector('iframe')).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin')
  })

  // specs/005-website-blocks, slice 88b: the same markup as the Reader's Cards.
  test('draws a card grid with its columns, boxes, images and linked cards', () => {
    render(
      <SiteCanvas
        {...(props({
          sections: [
            {
              id: 'c',
              type: 'cards',
              heading: 'Channels',
              intro: 'Many places',
              columns: '4',
              boxed: true,
              items: [
                { imageAssetId: 'a1', title: 'WeChat', text: 'Official', link: '/a' },
                { title: 'Plain' },
                { imageAssetId: 'gone' },
              ],
            },
            { id: 'd', type: 'cards', columns: '7', items: [] },
          ],
        }) as never)}
      />,
    )
    const [grid, bare] = Array.from(canvas().querySelectorAll('.site-cards'))
    expect(grid.className).toBe('site-cards columns-4 boxed')
    expect(grid.querySelector('h2')).toHaveTextContent('Channels')
    expect(grid.querySelector('.site-cards-intro')).toHaveTextContent('Many places')
    const items = Array.from(grid.querySelectorAll('ul > li'))
    expect(items).toHaveLength(3)
    expect(items[0].querySelector('a.site-card')).toHaveAttribute('href', '#')
    expect(items[0].querySelector('img')).toHaveAttribute('src', 'https://cdn.test/a1.png')
    expect(items[0].querySelector('h3')).toHaveTextContent('WeChat')
    expect(items[0].querySelector('p')).toHaveTextContent('Official')
    expect(items[1].querySelector('a')).toBeNull()
    expect(items[1].querySelector('div.site-card h3')).toHaveTextContent('Plain')
    expect(items[2].querySelector('img')).toBeNull()
    expect(bare.className).toBe('site-cards columns-3')
    expect(bare.querySelector('h2')).toBeNull()
  })

  test('falls back to the default font and colour, and draws no button without a link', () => {
    render(
      <SiteCanvas
        {...(props({
          website: { id: 'w', theme: { primaryColor: 'red', fontPair: 'odd', style: 'plain' } },
          sections: [{ id: 'h', type: 'hero', heading: 'Hi', buttonText: 'Go' }],
        }) as never)}
      />,
    )
    const site = canvas().firstElementChild as HTMLElement
    expect(site).toHaveClass('site-font-modern')
    expect(site).not.toHaveClass('site-style-airy')
    expect(site.style.getPropertyValue('--site-primary')).toBe('')
    expect(site.querySelector('.site-hero')).not.toHaveClass('with-image')
    expect(within(site).queryByText('Go')).not.toBeInTheDocument()
  })

  test('narrows to tablet and phone widths with the device buttons', () => {
    render(<SiteCanvas {...(props() as never)} />)
    const group = screen.getByRole('group', { name: 'Width' })
    expect(canvas()).toHaveStyle({ maxWidth: '100%' })
    expect(within(group).getByRole('button', { name: 'Desktop' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(group).getByRole('button', { name: 'Tablet' }))
    expect(canvas()).toHaveStyle({ maxWidth: '768px' })
    expect(within(group).getByRole('button', { name: 'Tablet' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(group).getByRole('button', { name: 'Desktop' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(within(group).getByRole('button', { name: 'Phone' }))
    expect(canvas()).toHaveStyle({ maxWidth: '375px' })
  })

  test('Preview in the bar above the canvas', () => {
    const p = props()
    render(<SiteCanvas {...(p as never)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(p.onPreview).toHaveBeenCalled()
  })

  test('Preview is off when the page cannot be previewed', () => {
    render(<SiteCanvas {...(props({ canPreview: false }) as never)} />)
    expect(screen.getByRole('button', { name: 'Preview' })).toBeDisabled()
  })

  test('selects a block by clicking it or its Edit button; the canvas around the page unselects', () => {
    const p = props({ selectedId: 't' })
    render(<SiteCanvas {...(p as never)} />)
    fireEvent.click(screen.getByText('Hello'))
    expect(p.onSelect).toHaveBeenLastCalledWith('h')
    fireEvent.click(screen.getByRole('button', { name: 'Edit 3. Image' }))
    expect(p.onSelect).toHaveBeenLastCalledWith('i')
    fireEvent.click(canvas().parentElement as HTMLElement)
    expect(p.onSelect).toHaveBeenLastCalledWith(undefined)
    expect(p.onSelect).toHaveBeenCalledTimes(3)

    expect(screen.getByTestId('canvas-item-t')).toHaveClass('canvas-item', 'is-selected')
    expect(screen.getByTestId('canvas-item-h')).not.toHaveClass('is-selected')
    expect(screen.getByRole('button', { name: 'Edit 2. Text' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Edit 1. Hero' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('each block has the corner tools; they do not also select or unselect', () => {
    const p = props({ selectedId: 't' })
    render(<SiteCanvas {...(p as never)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Move 2. Text up' }))
    expect(p.onMove).toHaveBeenLastCalledWith(1, -1)
    fireEvent.click(screen.getByRole('button', { name: 'Move 4. Gallery down' }))
    expect(p.onMove).toHaveBeenLastCalledWith(3, 1)
    expect(p.onSelect).not.toHaveBeenCalled()
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
    expect(marks[0].closest('.canvas-item')).toBe(screen.getByTestId('canvas-item-g'))
    expect(screen.getByTestId('canvas-item-g')).toHaveClass('has-problem')
    expect(screen.getByTestId('canvas-item-h')).not.toHaveClass('has-problem')
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

    test('files named from the root come from the Reader (SMN-93)', async () => {
      vi.mocked(WebsiteService.getReaderUrl).mockImplementation((path: string) => `https://fonts.test${path}`)
      fetchMock.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('@font-face{src:url(/fonts/a.woff2)}.x{background:url(data:x)}'),
      })
      const { container } = render(<SiteCanvas {...(props() as never)} />)
      await waitFor(() =>
        expect(container.querySelector('style')?.textContent).toBe(
          '@font-face{src:url(https://fonts.test/fonts/a.woff2)}.x{background:url(data:x)}',
        ),
      )
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

// As the Reader's Nav (SMN-86): /website.css shows the button and folds the links below 1024 px of canvas width.
describe('SiteCanvas menu', () => {
  const nav = () => within(canvas()).getByRole('navigation')
  const open = () => {
    render(<SiteCanvas {...(props() as never)} />)
    const button = within(nav()).getByRole('button', { name: 'Menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls', 'site-menu')
    expect(within(nav()).getByRole('list')).toHaveAttribute('id', 'site-menu')
    expect(nav()).not.toHaveClass('is-open')
    fireEvent.click(button)
    expect(nav()).toHaveClass('site-nav', 'is-open')
    expect(within(nav()).getByRole('button', { name: 'Close' })).toHaveAttribute('aria-expanded', 'true')
  }

  test('opens, then Close closes it', () => {
    open()
    fireEvent.click(within(nav()).getByRole('button', { name: 'Close' }))
    expect(nav()).not.toHaveClass('is-open')
    expect(within(nav()).getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  test('Escape closes it; other keys do not', () => {
    open()
    fireEvent.keyDown(within(nav()).getByText('Home'), { key: 'Tab' })
    expect(nav()).toHaveClass('is-open')
    fireEvent.keyDown(within(nav()).getByText('Home'), { key: 'Escape' })
    expect(nav()).not.toHaveClass('is-open')
    expect(within(nav()).getByRole('button', { name: 'Menu' })).toHaveFocus()
  })

  test('Escape does nothing while it is closed', () => {
    render(<SiteCanvas {...(props() as never)} />)
    const home = within(nav()).getByText('Home')
    home.focus()
    fireEvent.keyDown(home, { key: 'Escape' })
    expect(home).toHaveFocus()
  })

  test('using it keeps the selected block', () => {
    const onSelect = vi.fn()
    render(<SiteCanvas {...(props({ onSelect }) as never)} />)
    fireEvent.click(within(nav()).getByRole('button', { name: 'Menu' }))
    fireEvent.click(within(nav()).getByText('Home'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  test('another width closes it', () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Phone' }))
    expect(nav()).not.toHaveClass('is-open')
  })

  test('a page link closes it', () => {
    open()
    fireEvent.click(within(nav()).getByText('Home'))
    expect(nav()).not.toHaveClass('is-open')
    expect(within(nav()).getByRole('button', { name: 'Menu' })).toHaveFocus()
  })
})

// The layout's header, footer and theme (specs/004, slice 4a): as the Reader draws them.
describe('SiteCanvas layout', () => {
  const withLayout = (layout: object, theme: object = {}) =>
    props({ website: { ...props().website, theme: { ...props().website.theme, ...theme }, layout } })
  const nav = () => within(canvas()).getByRole('navigation')
  const companyWithLogo = { ...company, LogoAsset: { url: 'https://cdn.test/logo.png' } }

  test('the header leaves hidden pages out, adds outside links, and hides the logo or the name', () => {
    const { unmount } = render(
      <SiteCanvas
        {...(withLayout({
          header: {
            hiddenPageIds: ['p1'],
            showLogo: false,
            links: [
              { label: 'Login', url: 'https://a.test' },
              { label: '', url: '/x' },
            ],
          },
        }) as never)}
        company={companyWithLogo as never}
      />,
    )
    expect(
      within(nav())
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toStrictEqual(['Acme', 'About', 'Login'])
    expect(nav().querySelector('img')).toBeNull()
    unmount()

    render(
      <SiteCanvas {...(withLayout({ header: { showName: false } }) as never)} company={companyWithLogo as never} />,
    )
    const name = within(nav()).getByRole('link', { name: 'Acme' })
    expect(name).not.toHaveTextContent('Acme')
    expect(name.querySelector('img')).toHaveAttribute('src', 'https://cdn.test/logo.png')
  })

  test('with no logo shown, the name is shown anyway', () => {
    render(
      <SiteCanvas
        {...(withLayout({ header: { showLogo: false, showName: false } }) as never)}
        company={companyWithLogo as never}
      />,
    )
    const name = within(nav()).getByRole('link', { name: 'Acme' })
    expect(name).toHaveTextContent('Acme')
    expect(name).not.toHaveAttribute('aria-label')
  })

  test('a page without an id is always listed', () => {
    render(<SiteCanvas {...(withLayout({ header: { hiddenPageIds: ['p1'] } }) as never)} pages={[{ title: 'Home' }]} />)
    expect(within(nav()).getByText('Home')).toBeInTheDocument()
  })

  test('draws the footer items as the Reader does', () => {
    render(
      <SiteCanvas
        {...(withLayout({
          footer: {
            columns: [
              {
                heading: 'Contact Info',
                items: [
                  { type: 'contact', icon: 'wechat', text: 'acme6' },
                  { type: 'contact', icon: 'fax', text: 'No icon' },
                  { type: 'text', text: 'Hello' },
                  { type: 'button', label: 'Contact Us', url: '/about' },
                  { type: 'button', label: '', url: '/about' },
                ],
              },
              {
                items: [
                  { type: 'image', assetId: 'a1', alt: 'QR' },
                  { type: 'image', assetId: 'a1', alt: 'Licence', link: 'https://gov.test' },
                  { type: 'image', assetId: 'gone', alt: 'Gone' },
                  { type: 'video' },
                ],
              },
            ],
            copyright: '© Acme',
          },
        }) as never)}
      />,
    )
    const footer = within(canvas()).getByRole('contentinfo')
    expect(footer).toHaveClass('site-footer')
    const [first, second] = Array.from(footer.querySelectorAll('.site-footer-columns > .site-footer-column'))
    expect(within(first as HTMLElement).getByRole('heading', { name: 'Contact Info' })).toBeInTheDocument()
    const [wechat, noIcon] = Array.from(first.querySelectorAll('.site-footer-contact'))
    expect(wechat.querySelectorAll('svg path')).toHaveLength(FOOTER_ICONS.wechat.length)
    expect(wechat.querySelector('svg')).toHaveAttribute('aria-hidden')
    expect(noIcon.querySelector('svg')).toBeNull()
    expect(within(first as HTMLElement).getByText('Hello')).toHaveClass('site-footer-text')
    expect(within(first as HTMLElement).getAllByRole('link')).toHaveLength(1)
    expect(within(first as HTMLElement).getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '#')
    expect(
      within(second as HTMLElement)
        .getByAltText('QR')
        .closest('a'),
    ).toBeNull()
    expect(
      within(second as HTMLElement)
        .getByAltText('QR')
        .closest('p'),
    ).toHaveClass('site-footer-image')
    expect(
      within(second as HTMLElement)
        .getByAltText('Licence')
        .closest('a'),
    ).toHaveAttribute('href', '#')
    expect(within(second as HTMLElement).queryByAltText('Gone')).toBeNull()
    expect(second.children).toHaveLength(2)
    expect(within(footer).getByText('© Acme')).toHaveClass('site-copyright')
  })

  test('no footer without one; a footer without columns or copyright is still drawn', () => {
    const { unmount } = render(<SiteCanvas {...(withLayout({ footer: null }) as never)} />)
    expect(within(canvas()).queryByRole('contentinfo')).toBeNull()
    unmount()
    render(<SiteCanvas {...(withLayout({ footer: {} }) as never)} />)
    expect(within(canvas()).getByRole('contentinfo').querySelector('.site-copyright')).toBeNull()
  })

  test('sets the theme variables the API allows, and nothing else', () => {
    expect(
      getThemeStyle({
        primaryColor: '#111111',
        backgroundColor: '#e5eefe',
        headingColor: '#58468b',
        secondaryColor: '#ff9900',
        contentWidth: 1280,
      }),
    ).toStrictEqual({
      '--site-primary': '#111111',
      '--site-bg': '#e5eefe',
      '--site-heading': '#58468b',
      '--site-secondary': '#ff9900',
      // Dark text on the orange second button, as the Reader (spec 005).
      '--site-secondary-text': '#212529',
      '--site-width': '1280px',
    })
    // The first button's colour (slice 88b), with its text.
    expect(getThemeStyle({ buttonColor: '#facc15' })).toStrictEqual({
      '--site-button': '#facc15',
      '--site-button-text': '#212529',
    })
    expect(getThemeStyle({ secondaryColor: '#909090' })).toMatchObject({ '--site-secondary-text': '#ffffff' })
    expect(getThemeStyle({ secondaryColor: '#a0a0a0' })).toMatchObject({ '--site-secondary-text': '#212529' })
    expect(getThemeStyle({ secondaryColor: '#4b3f8f' })).toStrictEqual({
      '--site-secondary': '#4b3f8f',
      '--site-secondary-text': '#ffffff',
    })
    expect(getThemeStyle({ primaryColor: 'red', headingColor: 'url(x)', contentWidth: 1000 })).toBeUndefined()
    expect(getThemeStyle()).toBeUndefined()
    render(<SiteCanvas {...(withLayout(null, { backgroundColor: '#e5eefe' }) as never)} />)
    expect((canvas().firstElementChild as HTMLElement).style.getPropertyValue('--site-bg')).toBe('#e5eefe')
  })

  test('fixed blocks are shown in their places without tools, with their note; clicking them selects nothing', () => {
    const onSelect = vi.fn()
    const fixed = (id: string, heading: string) => ({ id, type: 'hero', heading })
    render(
      <SiteCanvas
        {...(props({ onSelect, sections: [] }) as never)}
        fixedBlocks={[
          { at: 0, sections: [fixed('f1', 'Top')], note: 'Shared' },
          { at: 0, sections: [] },
          { at: 0, sections: [fixed('f2', 'Bottom')] },
        ]}
      />,
    )
    const top = within(canvas()).getByRole('heading', { name: 'Top' }).closest('.canvas-sample') as HTMLElement
    expect(within(top).getByText('Shared')).toHaveClass('canvas-sample-note')
    expect(canvas().querySelectorAll('.canvas-sample')).toHaveLength(2)
    expect(within(canvas()).queryByRole('button', { name: /^Edit/ })).toBeNull()
    fireEvent.click(within(canvas()).getByRole('heading', { name: 'Top' }))
    expect(onSelect).toHaveBeenCalledWith(undefined)
  })

  test('fixed blocks go before the editable block at their place, or after the last', () => {
    const hero = (id: string, heading: string) => ({ id, type: 'hero', heading })
    render(
      <SiteCanvas
        {...(props({ sections: [hero('a', 'One'), hero('b', 'Two')] }) as never)}
        fixedBlocks={[
          { at: 1, sections: [hero('m', 'Middle')] },
          { at: 2, sections: [hero('z', 'End')] },
        ]}
      />,
    )
    expect(
      within(canvas())
        .getAllByRole('heading', { level: 1 })
        .map((h) => h.textContent),
    ).toStrictEqual(['One', 'Middle', 'Two', 'End'])
    expect(within(canvas()).getAllByRole('button', { name: /^Edit/ })).toHaveLength(2)
  })

  test('picks the header or the footer when asked to, and marks the one picked', () => {
    const onSelectPart = vi.fn()
    const onSelect = vi.fn()
    render(
      <SiteCanvas
        {...(withLayout({ footer: { columns: [] } }) as never)}
        onSelect={onSelect}
        onSelectPart={onSelectPart}
        selectedPart={'footer'}
      />,
    )
    const footerPart = within(canvas()).getByRole('contentinfo').parentElement as HTMLElement
    expect(footerPart).toHaveClass('canvas-part', 'is-selected')
    expect(nav()).toHaveClass('site-nav', 'canvas-part')
    expect(nav()).not.toHaveClass('is-selected')
    fireEvent.click(footerPart)
    fireEvent.click(nav())
    expect(onSelectPart.mock.calls).toStrictEqual([['footer'], ['header']])
    expect(onSelect).not.toHaveBeenCalled()
  })

  test('without picking, the header and footer are not marked and a footer click unselects', () => {
    const onSelect = vi.fn()
    render(<SiteCanvas {...(withLayout({ footer: { columns: [] } }) as never)} onSelect={onSelect} />)
    const footerPart = within(canvas()).getByRole('contentinfo').parentElement as HTMLElement
    expect(footerPart).not.toHaveClass('canvas-part')
    expect(nav()).not.toHaveClass('canvas-part')
    fireEvent.click(footerPart)
    expect(onSelect).toHaveBeenCalledWith(undefined)
  })
})

// specs/009-website-pages-match
describe('SiteCanvas pages (spec 009)', () => {
  const draw = (list: IWebsiteSection[]) => render(<SiteCanvas {...(props({ sections: list }) as never)} />)
  const item = (id: string) => screen.getByTestId(`canvas-item-${id}`)

  test('pairs side by side blocks in one row; three in a row make a pair and a lone block', () => {
    draw([
      { id: 'a', type: 'text', html: '<p>a</p>', sideBySide: true },
      { id: 'b', type: 'text', html: '<p>b</p>', sideBySide: true },
      { id: 'c', type: 'text', html: '<p>c</p>', sideBySide: true },
      { id: 'd', type: 'text', html: '<p>d</p>' },
    ])
    const rows = canvas().querySelectorAll('.site-row')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toContainElement(item('a'))
    expect(rows[0]).toContainElement(item('b'))
    expect(rows[0]).not.toContainElement(item('c'))
    expect(item('c').parentElement).toHaveClass('site-page')
  })

  test('a lone side by side block is not wrapped', () => {
    draw([{ id: 'a', type: 'text', html: '<p>a</p>', sideBySide: true }])
    expect(canvas().querySelector('.site-row')).toBeNull()
  })

  test('hero and map take site-full, hero dark-text; articles featured', () => {
    draw([
      { id: 'h', type: 'hero', heading: 'Hi', fullWidth: true, darkText: true },
      { id: 'm', type: 'map', mapUrl: 'https://maps.test/x', fullWidth: true },
      { id: 'r', type: 'articles', layout: 'featured' },
    ])
    expect(canvas().querySelector('.site-hero')).toHaveClass('site-full', 'dark-text')
    expect(canvas().querySelector('.site-map-block')).toHaveClass('site-full')
    expect(canvas().querySelector('.site-articles')).toHaveClass('featured')
  })

  test('without the fields nothing changes', () => {
    draw([
      { id: 'h', type: 'hero', heading: 'Hi' },
      { id: 'm', type: 'map', mapUrl: 'https://maps.test/x' },
      { id: 'r', type: 'articles' },
    ])
    expect(canvas().querySelector('.site-hero')).not.toHaveClass('site-full', 'dark-text')
    expect(canvas().querySelector('.site-map-block')).not.toHaveClass('site-full')
    expect(canvas().querySelector('.site-articles')).not.toHaveClass('featured')
    expect(canvas().querySelector('.site-row')).toBeNull()
  })
})

// specs/010-website-rows (SMN-96, SMN-95)
describe('SiteCanvas rows (spec 010)', () => {
  const draw = (list: IWebsiteSection[], extra = {}) =>
    render(<SiteCanvas {...(props({ sections: list, ...extra }) as never)} />)
  const item = (id: string) => screen.getByTestId(`canvas-item-${id}`)
  const t = (id: string, extra = {}): IWebsiteSection => ({ id, type: 'text', html: `<p>${id}</p>`, ...extra })

  test('a row has the Reader markup with its defaults', () => {
    draw([{ id: 'r', type: 'row', blocks: [t('a'), t('b', { basis: '1/3' }), t('c', { basis: 'auto' })] }])
    const row = canvas().querySelector('.site-page .site-flex') as HTMLElement
    expect(row.tagName).toBe('SECTION')
    expect(row.className).toBe('site-flex site-flex-boxed site-pad-medium')
    expect(row.getAttribute('style')).toBeNull()
    const inner = row.firstElementChild as HTMLElement
    expect(inner.tagName).toBe('DIV')
    expect(inner.className).toBe('site-flex-inner site-dir-row site-justify-start site-align-stretch site-gap-medium')
    const items = Array.from(inner.children) as HTMLElement[]
    expect(items.map((i) => i.tagName)).toStrictEqual(['DIV', 'DIV', 'DIV'])
    expect(items.map((i) => i.classList.contains('site-flex-item'))).toStrictEqual([true, true, true])
    // auto and absent: no basis class; 1/3 has a dash.
    expect(items.map((i) => Array.from(i.classList).filter((c) => c.startsWith('site-basis')))).toStrictEqual([
      [],
      ['site-basis-1-3'],
      [],
    ])
    expect(items[0].querySelector('section.site-text')).not.toBeNull()
  })

  test('every option sets its class and the background its variable', () => {
    draw([
      {
        id: 'r',
        type: 'row',
        width: 'full',
        background: '#aabbcc',
        padding: 'large',
        direction: 'column',
        wrap: false,
        justify: 'space-between',
        align: 'center',
        gap: 'small',
        blocks: [t('a', { basis: 'full' }), t('b', { basis: '2/5' }), t('c', { basis: '3/4' })],
      },
    ])
    const row = canvas().querySelector('.site-flex') as HTMLElement
    expect(row.className).toBe('site-flex site-flex-full site-pad-large')
    expect(row.style.getPropertyValue('--flex-bg')).toBe('#aabbcc')
    expect(row.firstElementChild?.className).toBe(
      'site-flex-inner site-dir-column site-justify-space-between site-align-center site-gap-small site-nowrap',
    )
    expect(row.querySelector('.site-basis-full')).not.toBeNull()
    expect(row.querySelector('.site-basis-2-5')).not.toBeNull()
    expect(row.querySelector('.site-basis-3-4')).not.toBeNull()
  })

  test('values outside the lists fall back to the defaults, and a bad colour is ignored', () => {
    draw([
      {
        id: 'r',
        type: 'row',
        width: 'x',
        padding: 'y',
        justify: 'z',
        background: 'red',
        blocks: [t('a', { basis: '9/9' })],
      },
    ])
    const row = canvas().querySelector('.site-flex') as HTMLElement
    expect(row.className).toBe('site-flex site-flex-boxed site-pad-medium')
    expect(row.getAttribute('style')).toBeNull()
    expect(row.querySelector('.site-flex-item')?.className).toBe('site-flex-item canvas-child')
  })

  test('a row inside a row is drawn the same way, recursively', () => {
    draw([
      {
        id: 'r',
        type: 'row',
        blocks: [
          {
            id: 'r2',
            type: 'row',
            direction: 'column',
            blocks: [t('a'), { id: 'bt', type: 'buttons', buttonText: 'Go', buttonUrl: '/x' }],
          },
        ],
      },
    ])
    const inner = canvas().querySelector('.site-flex .site-flex-item .site-flex') as HTMLElement
    expect(inner).not.toBeNull()
    expect(inner.querySelector('.site-dir-column')).not.toBeNull()
    expect(inner.querySelectorAll('.site-flex-item')).toHaveLength(2)
  })

  test('a block inside a row is selected by clicking it, by its id; the outline follows the selection', () => {
    const onSelect = vi.fn()
    draw([{ id: 'r', type: 'row', blocks: [t('a'), { id: 'r2', type: 'row', blocks: [t('b')] }] }], {
      onSelect,
      selectedId: 'b',
      problemIds: ['a'],
    })
    expect(item('b')).toHaveClass('site-flex-item', 'canvas-child', 'is-selected')
    expect(item('a')).toHaveClass('has-problem')
    fireEvent.click(item('a'))
    expect(onSelect).toHaveBeenLastCalledWith('a')
    // The click stops there: it does not also select the row.
    expect(onSelect).toHaveBeenCalledTimes(1)
    fireEvent.click(item('b'))
    expect(onSelect).toHaveBeenLastCalledWith('b')
    expect(onSelect).toHaveBeenCalledTimes(2)
    fireEvent.click(item('r'))
    expect(onSelect).toHaveBeenLastCalledWith('r')
  })

  test('a row is moved and removed as one block, with the page tools', () => {
    const onMove = vi.fn()
    const onRemove = vi.fn()
    draw([t('a'), { id: 'r', type: 'row', blocks: [t('b')] }], { onMove, onRemove })
    fireEvent.click(screen.getByRole('button', { name: 'Move 2. Row up' }))
    expect(onMove).toHaveBeenCalledWith(1, -1)
    // Only the page's list has tools: the blocks inside the row are managed in the panel.
    expect(screen.getAllByRole('button', { name: /^Edit / })).toHaveLength(2)
  })

  test('buttons block: the band buttons in a site-buttons-block section', () => {
    draw([
      {
        id: 'bt',
        type: 'buttons',
        buttonText: 'Join',
        buttonUrl: '/x',
        button2Text: 'More',
        button2Url: '/y',
        note: 'Free',
      },
    ])
    const block = canvas().querySelector('section.site-buttons-block') as HTMLElement
    const buttons = block.querySelector('.site-buttons') as HTMLElement
    expect(Array.from(buttons.querySelectorAll('a')).map((a) => a.className)).toStrictEqual([
      'site-button',
      'site-button second',
    ])
    expect(buttons.querySelector('p.site-note')?.textContent).toBe('Free')
  })

  test('tile block: a section with icon, title and text; a link makes it an a', () => {
    draw([
      { id: 't1', type: 'tile', imageAssetId: 'a1', imageAlt: 'Icon', title: 'Fast', text: 'Quick' },
      { id: 't2', type: 'tile', title: 'Linked', link: '/about' },
    ])
    const [plain, linked] = Array.from(canvas().querySelectorAll('.site-tile')) as HTMLElement[]
    expect(plain.tagName).toBe('SECTION')
    expect(plain.querySelector('img.site-tile-icon')).toHaveAttribute('src', 'https://cdn.test/a1.png')
    expect(plain.querySelector('img.site-tile-icon')).toHaveAttribute('alt', 'Icon')
    expect(plain.querySelector('.site-tile-body > h3.site-tile-title')?.textContent).toBe('Fast')
    expect(plain.querySelector('.site-tile-body > p.site-tile-text')?.textContent).toBe('Quick')
    expect(linked.tagName).toBe('A')
    expect(linked.querySelector('img')).toBeNull()
  })

  test('a shared block hidden on the page drawn is left out; others stay (SMN-95)', () => {
    draw([t('own')], {
      currentIndex: 1,
      fixedBlocks: [
        {
          at: 0,
          sections: [t('gone', { hiddenPageIds: ['p2'] }), t('kept', { hiddenPageIds: ['p1'] }), t('all')],
          note: 'Shared',
        },
        { at: 1, sections: [t('below', { hiddenPageIds: ['p2'] })], note: 'Shared' },
      ],
    })
    const text = canvas().textContent
    expect(text).not.toContain('gone')
    expect(text).not.toContain('below')
    expect(text).toContain('kept')
    expect(text).toContain('all')
    // A group left with nothing shows no note either.
    expect(screen.getAllByText('Shared')).toHaveLength(1)
  })

  test('an editable shared block hidden on the sample page stays selectable, faded (Layout page)', () => {
    draw([t('mine', { hiddenPageIds: ['p1'] }), t('other')], { currentIndex: 0 })
    expect(item('mine')).toHaveClass('canvas-hidden-here')
    expect(item('other')).not.toHaveClass('canvas-hidden-here')
  })
})
