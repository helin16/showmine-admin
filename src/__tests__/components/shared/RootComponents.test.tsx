import React from 'react'
import { render, screen } from '@testing-library/react'
import { renderWithProviders } from '../../testUtils'
import AppFooter from '../../../Components/AppFooter'
import AppInit from '../../../Components/AppInit'
import AppLogo from '../../../Components/AppLogo'
import Icons from '../../../Components/Icons'
import PageBox from '../../../Components/PageBox'

describe('AppFooter', () => {
  test('shows the copyright and passes props to the element', () => {
    render(<AppFooter data-testid='footer' />)
    expect(screen.getByTestId('footer')).toHaveTextContent('© ShowMine since 2013')
  })
})

describe('AppInit', () => {
  test('shows the loading message with a spinning icon', () => {
    const { container } = renderWithProviders(<AppInit />)
    expect(screen.getByText('Fetching your account details...')).toBeInTheDocument()
    expect(screen.getByText('please be patient...')).toBeInTheDocument()
    expect(container.querySelector('.anticon-sync svg')).toHaveClass('anticon-spin')
  })
})

describe('AppLogo', () => {
  test('defaults to a width of 180', () => {
    render(<AppLogo />)
    const logo = screen.getByAltText('Logo')
    expect(logo).toHaveAttribute('src', '/img/logo.png')
    expect(logo).toHaveStyle({ width: '180px' })
  })

  test('uses the requested width', () => {
    render(<AppLogo width={64} />)
    expect(screen.getByAltText('Logo')).toHaveStyle({ width: '64px' })
  })
})

describe('Icons', () => {
  test.each(Object.keys(Icons))('%s renders an svg', (name) => {
    const Icon = Icons[name as keyof typeof Icons]
    const { container } = render(<Icon />)
    expect(container.querySelector('span[role="img"] svg')).toBeInTheDocument()
  })
})

describe('PageBox', () => {
  test('renders children and adds the caller class', () => {
    render(
      <PageBox className='login'>
        <p>Sign in</p>
      </PageBox>,
    )
    expect(screen.getByText('Sign in').parentElement).toHaveClass('page-box', 'login')
  })

  test('has only the base class without a caller class', () => {
    render(<PageBox>content</PageBox>)
    const box = screen.getByText('content')
    expect(box).toHaveClass('page-box')
    expect(box.className).not.toContain('undefined')
  })
})
