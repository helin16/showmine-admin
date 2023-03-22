import AuthPage from '../../Layouts/AuthPage'
import PageBox from '../../Components/PageBox'
import LoginForm from '../../Components/Auth/LoginForm'
import AppLogo from '../../Components/AppLogo'
import { useEffect, useState } from 'react'
import { FlexContainer, FormInputWrapper } from '../../Styles/AppWrapper'
import Button from '../../Components/Form/Button'
import Icons from '../../Components/Icons'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import { useNavigate } from 'react-router-dom'
import { BACK_END_URL } from '../../UrlMap'
import WeChatInAppLoginBtn, { weChatBtnStyle } from '../../Components/Auth/WeChatInAppLoginBtn'
import WeChatLoginForm from '../../Components/Auth/WeChatLoginForm'
import AuthService from '../../Services/AuthService'

const LOGIN_METHOD_NORMAL = 'normal'
const LOGIN_METHOD_WECHAT = 'wechat'
const LOGIN_METHOD_FACEBOOK = 'facebook'
const LoginPage = () => {
  const { isInWeChat } = useSelector((state: RootState) => state.weChat)
  const [loginMethod, setLoginMethod] = useState(LOGIN_METHOD_NORMAL)
  const navigate = useNavigate()
  const token = AuthService.getLocalAuthToken()

  useEffect(() => {
    if (`${token || ''}`.trim() !== '') {
      navigate(BACK_END_URL)
    }
  }, [token, navigate])

  const getLogForm = () => {
    if (loginMethod === LOGIN_METHOD_WECHAT) {
      return <WeChatLoginForm />
    }
    if (loginMethod === LOGIN_METHOD_FACEBOOK) {
      return null
    }
    return <LoginForm />
  }

  const getNormalLoginBtn = () => {
    return (
      <Button
        block
        icon={<Icons.LockFilled />}
        onClick={() => {
          setLoginMethod(LOGIN_METHOD_NORMAL)
        }}
      >
        Password Login
      </Button>
    )
  }
  const getWeChatBtn = () => {
    if (isInWeChat === true) {
      return <WeChatInAppLoginBtn />
    }
    return (
      <Button
        block
        icon={<Icons.WechatFilled />}
        style={weChatBtnStyle}
        onClick={() => {
          setLoginMethod(LOGIN_METHOD_WECHAT)
        }}
      >
        WeChat
      </Button>
    )
  }

  const getLoginMethodDiv = () => {
    if (loginMethod === LOGIN_METHOD_WECHAT) {
      return (
        <FlexContainer className={'justify-content-space-between'}>
          {getNormalLoginBtn()}
          {getWeChatBtn()}
        </FlexContainer>
      )
    }
    if (loginMethod === LOGIN_METHOD_FACEBOOK) {
      return (
        <FlexContainer className={'justify-content-space-between'}>
          {getNormalLoginBtn()}
          {getWeChatBtn()}
        </FlexContainer>
      )
    }
    return (
      <FlexContainer className={'justify-content-space-between'}>
        {getNormalLoginBtn()}
        {getWeChatBtn()}
      </FlexContainer>
    )
  }

  return (
    <AuthPage>
      <PageBox>
        <>
          <AppLogo />
          <FormInputWrapper>{getLogForm()}</FormInputWrapper>
          <FormInputWrapper>{getLoginMethodDiv()}</FormInputWrapper>
        </>
      </PageBox>
    </AuthPage>
  )
}

export default LoginPage
