import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { renderWithProviders } from '../../testUtils'
import InlineError from '../../../Components/Error/InlineError'
import InvalidAccessPanel from '../../../Components/Error/InvalidAccessPanel'
import { BACK_END_URL } from '../../../UrlMap'

const CurrentPath = () => <output>{useLocation().pathname}</output>

describe('InlineError', () => {
  test('renders nothing without an error', () => {
    const { container } = renderWithProviders(<InlineError error={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('shows the error message as an error alert', () => {
    renderWithProviders(<InlineError error={{ message: 'Saving failed', errors: [] }} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Saving failed')
    expect(alert).toHaveClass('ant-alert-error')
  })
})

describe('InvalidAccessPanel', () => {
  test('shows the 403 message', () => {
    renderWithProviders(<InvalidAccessPanel />)
    expect(screen.getByText('403')).toBeInTheDocument()
    expect(screen.getByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
  })

  test('the default button goes to the back end home', async () => {
    renderWithProviders(
      <>
        <InvalidAccessPanel />
        <CurrentPath />
      </>,
      { route: '/b/forbidden' },
    )
    await userEvent.click(screen.getByRole('button', { name: 'Back Home' }))
    expect(screen.getByRole('status')).toHaveTextContent(BACK_END_URL)
  })

  test('uses the given home url and button text', async () => {
    renderWithProviders(
      <>
        <InvalidAccessPanel homeUrl='/login' backBtnText='Sign in again' />
        <CurrentPath />
      </>,
      { route: '/b/forbidden' },
    )
    await userEvent.click(screen.getByRole('button', { name: 'Sign in again' }))
    expect(screen.getByRole('status')).toHaveTextContent('/login')
  })
})
