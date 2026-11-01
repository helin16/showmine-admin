import React, { lazy, Suspense } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import ChunkErrorBoundary, { reloadOnce } from '../../Components/Error/ChunkErrorBoundary'
import { changeLanguage } from '../../i18n/translate'
import { messages } from '../../i18n/messages'
import { LOCALES } from '../../Constants'

const reload = vi.fn()

const failingPage = () => lazy(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module')))

const renderPage = (Page: React.ComponentType) =>
  render(
    <ChunkErrorBoundary>
      <Suspense fallback='loading'>
        <Page />
      </Suspense>
    </ChunkErrorBoundary>,
  )

beforeEach(() => {
  vi.stubGlobal('location', { reload })
  // React reports every error a boundary catches.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  sessionStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  changeLanguage(LOCALES.ENGLISH)
})

describe('ChunkErrorBoundary', () => {
  test('shows the page when it loads', async () => {
    renderPage(lazy(async () => ({ default: () => <div>page</div> })))
    expect(await screen.findByText('page')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('a failed load shows a message instead of a blank page', async () => {
    renderPage(failingPage())
    expect(await screen.findByRole('alert')).toHaveTextContent(messages.en['page-load-failed'])
    expect(reload).not.toHaveBeenCalled()
  })

  test('the message and retry are localized', async () => {
    changeLanguage(LOCALES.CHINESE)
    renderPage(failingPage())
    expect(await screen.findByRole('alert')).toHaveTextContent(messages['zh-cn']['page-load-failed'])
    expect(screen.getByRole('button')).toHaveTextContent(/重\s*试/)
  })

  test('retry reloads, because React.lazy keeps a failed load', async () => {
    renderPage(failingPage())
    fireEvent.click(await screen.findByRole('button', { name: messages.en.retry }))
    expect(reload).toHaveBeenCalledTimes(1)
  })
})

describe('reloadOnce', () => {
  test('reloads a stale tab only once for a build', () => {
    reloadOnce('build-a')
    reloadOnce('build-a')
    reloadOnce('build-a')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('recovers again after a later deployment', () => {
    reloadOnce('build-a')
    reloadOnce('build-b')
    expect(reload).toHaveBeenCalledTimes(2)
  })

  test('does not reload without storage, which could loop', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    reloadOnce('build-a')
    expect(reload).not.toHaveBeenCalled()
  })
})
