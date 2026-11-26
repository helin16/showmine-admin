import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import SidePanel from '../../../Components/Website/SidePanel'
import Icons from '../../../Components/Icons'

// The website editors' right panel (SMN-91): the content, then the tab rail on the right.
const tabs = [
  { key: 'header', label: 'Header', Icon: Icons.VerticalAlignTopOutlined },
  { key: 'theme', label: 'Theme', Icon: Icons.BgColorsOutlined },
] as const

describe('SidePanel', () => {
  it('shows the content, then the tabs in a rail on the right with the open one marked', () => {
    const onTab = vi.fn()
    const { container } = render(
      <SidePanel tabs={tabs} active={'theme'} onTab={onTab}>
        <p>Theme fields</p>
      </SidePanel>,
    )
    const panel = container.firstElementChild as HTMLElement
    const [content, rail] = Array.from(panel.children)
    expect(content).toBe(screen.getByRole('region', { name: 'Panel' }))
    expect(within(content as HTMLElement).getByText('Theme fields')).toBeInTheDocument()
    expect(rail).toBe(screen.getByRole('group', { name: 'Panel tabs' }))
    expect(
      within(rail as HTMLElement)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Header', 'Theme'])
    expect(screen.getByRole('button', { name: 'Theme' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Theme' })).toHaveClass('active')
    expect(screen.getByRole('button', { name: 'Header' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Header' })).not.toHaveClass('active')
    fireEvent.click(screen.getByRole('button', { name: 'Header' }))
    expect(onTab).toHaveBeenCalledWith('header')
  })

  it('marks no tab while something else is shown', () => {
    render(
      <SidePanel tabs={tabs} onTab={vi.fn()}>
        <p>A block</p>
      </SidePanel>,
    )
    screen.getAllByRole('button').forEach((button) => {
      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(button).not.toHaveClass('active')
    })
  })
})
