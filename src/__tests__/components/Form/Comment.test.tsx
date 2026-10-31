import React from 'react'
import { render, screen, within } from '@testing-library/react'
import Comment from '../../../Components/Form/Comment'

describe('Comment', () => {
  test('puts each part in its own area', () => {
    const { container } = render(
      <Comment
        author='Ann'
        datetime='2 days ago'
        avatar={<img alt='Ann avatar' />}
        content='Nice article'
        actions={<button>Reply</button>}
      />,
    )
    const area = (name: string) => container.querySelector(`.ant-comment-${name}`) as HTMLElement
    expect(area('content-author-name')).toHaveTextContent('Ann')
    expect(area('content-author-time')).toHaveTextContent('2 days ago')
    expect(within(area('avatar')).getByAltText('Ann avatar')).toBeInTheDocument()
    expect(area('content-detail')).toHaveTextContent('Nice article')
    expect(within(area('actions')).getByRole('button', { name: 'Reply' })).toBeInTheDocument()
  })

  test('shows nested replies', () => {
    render(
      <Comment author='Ann' datetime='' avatar='' content='' actions=''>
        <p>A reply</p>
      </Comment>,
    )
    expect(screen.getByText('A reply')).toBeInTheDocument()
  })
})
