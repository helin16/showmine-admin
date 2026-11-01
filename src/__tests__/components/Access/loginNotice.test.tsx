import React, { Suspense } from 'react'
import { screen, waitFor } from '@testing-library/react'
import { stubMatchMedia } from './domHelpers'
import { renderWithProviders } from '../../testUtils'
import LoginPage from '../../../Pages/Auth/LoginPage'
import LocalStorageService from '../../../Services/LocalStorageService'
import { LOGIN_URL } from '../../../UrlMap'

beforeAll(() => stubMatchMedia())

// In its own file: the WeChat button's chunk must not have loaded yet, as that first render is thrown away.
test('the notice survives the page suspending, and shows only once', async () => {
  LocalStorageService.setLoginNotice('Signed out')
  renderWithProviders(
    <Suspense fallback='loading'>
      <LoginPage />
    </Suspense>,
    { route: `${LOGIN_URL}?password=1`, state: { weChat: { isInWeChat: true } } },
  )
  expect(await screen.findByText('Signed out')).toBeInTheDocument()
  await waitFor(() => expect(LocalStorageService.getLoginNotice()).toBeNull())
})
