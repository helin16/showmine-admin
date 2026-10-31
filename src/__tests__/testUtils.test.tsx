import React from 'react'
import { screen } from '@testing-library/react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { describe, expect, test } from 'vitest'
import { renderWithProviders } from './testUtils'

const Probe = () => {
  const company = useSelector((s: any) => s.auth.company)
  const { pathname } = useLocation()
  const intl = useIntl()
  return <div>{`${company?.name}|${pathname}|${intl.locale}`}</div>
}

describe('renderWithProviders()', () => {
  test('provides store state, the route, and translations', () => {
    renderWithProviders(<Probe />, { state: { auth: { company: { name: 'Acme' } as any } }, route: '/b/articles' })
    expect(screen.getByText(/^Acme\|\/b\/articles\|/)).toBeInTheDocument()
  })
})
