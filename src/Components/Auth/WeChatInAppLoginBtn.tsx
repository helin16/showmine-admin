import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { weChatBtnStyle } from '../../Constants'
import { RootState } from '../../Redux/makeReduxStore'
import WeChatService from '../../Services/WeChatService'
import Button, { iButton } from '../Form/Button'
import { WechatFilled } from '@ant-design/icons'
import message from '../Form/message'
import Utils from '../../Services/Utils'

const WeChatInAppLoginBtn = ({
  from,
  btnText,
  ...props
}: iButton & {
  from?: string | null
  btnText?: string
}) => {
  const [loading, setLoading] = useState(false)
  const { isInWeChat } = useSelector((s: RootState) => s.weChat)

  // The address is only good for minutes, so it's fetched when tapped and not when the page opens.
  const login = () => {
    setLoading(true)
    WeChatService.goToWeChatLogin(from).catch((err) => {
      setLoading(false)
      message.error(`Error when fetch login url ${Utils.getErrorMessage(err)}`)
    })
  }

  if (isInWeChat !== true) {
    return null
  }
  return (
    <Button
      {...{
        block: true,
        icon: <WechatFilled />,
        style: weChatBtnStyle,
        ...props,
      }}
      loading={loading}
      onClick={login}
    >
      {btnText || 'WeChat'}
    </Button>
  )
}

export default WeChatInAppLoginBtn
