import React from 'react'
import { renderWithProviders } from '../../testUtils'
import RetrievePasswordForm from '../../../Components/Auth/RetrievePasswordForm'
import CompanyUserInviteBtn from '../../../Components/User/CompanyUserInviteBtn'
import RedirectChannelEditor from '../../../Components/Channel/Wizard/RedirectChannelEditor'
import WordPressChannelEditor from '../../../Components/Channel/Wizard/WordPressChannelEditor'

const channel = { type: 'Facebook', name: 'Page' } as never
const company = { id: 'co-1', name: 'Acme' } as never

// These features are commented out in the source: pin that they stay out of the UI until they are restored.
test.each([
  ['RetrievePasswordForm', <RetrievePasswordForm key='0' />],
  ['CompanyUserInviteBtn', <CompanyUserInviteBtn key='0' company={company} />],
  ['RedirectChannelEditor', <RedirectChannelEditor key='0' channel={channel} />],
])('%s is disabled and renders nothing', (_name, ui) => {
  expect(renderWithProviders(ui).container).toBeEmptyDOMElement()
})

test('WordPressChannelEditor renders an empty placeholder', () => {
  const { container } = renderWithProviders(<WordPressChannelEditor channel={channel} />)
  expect(container.innerHTML).toBe('<div></div>')
})
