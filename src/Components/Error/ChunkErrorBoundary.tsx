import React, { ReactNode } from 'react'
import Button from '../Form/Button'
import Result from '../Form/Result'
import translate from '../../i18n/translate'

const RELOADED_BUILD_KEY = 'chunkReloadedBuild'

/**
 * Reloads at most once per build in a tab. If the reloaded page is the same build, the failure isn't
 * a stale tab, so it is left to the retry below. A later deployment is a new build, so it still recovers.
 * @param build
 */
export const reloadOnce = (build: string) => {
  try {
    if (sessionStorage.getItem(RELOADED_BUILD_KEY) === build) return
    sessionStorage.setItem(RELOADED_BUILD_KEY, build)
  } catch {
    // Without storage nothing could stop a loop.
    return
  }
  window.location.reload()
}

type iChunkErrorBoundary = { children: ReactNode }

class ChunkErrorBoundary extends React.Component<iChunkErrorBoundary, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }
    // React.lazy keeps a failed load, and so can the browser, so only a reload tries it again.
    return (
      <div role='alert'>
        <Result
          status='warning'
          title={translate('page-load-failed')}
          extra={
            <Button type='primary' onClick={() => window.location.reload()}>
              {translate('retry')}
            </Button>
          }
        />
      </div>
    )
  }
}

export default ChunkErrorBoundary
