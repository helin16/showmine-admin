import React from 'react'
import styled from 'styled-components'
import Button, { iButton } from './Button'
import Icons from '../Icons'

const LoadMoreBtnDiv = styled.div`
  text-align: center;
  margin-top: 12px;
  height: 32px;
  line-height: 32px;
`
/**
 *
 * @param onClick
 * @param loading
 * @param showing
 * @constructor
 */
const LoadMoreBtn = ({
  showing,
  onClick,
  icon,
  ...props
}: iButton & {
  showing?: boolean
}) => {
  const handleClicked = (e: React.MouseEvent<any>) => {
    if (typeof onClick === 'function') {
      onClick(e)
    }
  }

  if (showing !== true) {
    return null
  }
  return (
    <LoadMoreBtnDiv
      style={{
        textAlign: 'center',
        marginTop: 12,
        height: 32,
        lineHeight: '32px',
      }}
    >
      <Button {...props} onClick={handleClicked} icon={icon || <Icons.ArrowDownOutlined />}>
        load more
      </Button>
    </LoadMoreBtnDiv>
  )
}

export default LoadMoreBtn
