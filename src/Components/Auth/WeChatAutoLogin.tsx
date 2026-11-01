import { useEffect } from 'react'
import { NavigateFunction } from 'react-router-dom'
import AuthService from '../../Services/AuthService'
import LocalStorageService, {
  AUTO_LOGIN_DONE,
  AUTO_LOGIN_FAILED,
  AUTO_LOGIN_SENT,
} from '../../Services/LocalStorageService'
import WeChatService from '../../Services/WeChatService'

type iWeChatAutoLogin = {
  from: string | null
  search: string
  // From the page, as importing the router's hooks here splits the sign-in page's JS into more, larger chunks.
  navigate: NavigateFunction
  // Called when the sign-in page should show after all, with whether to say WeChat failed.
  onSettled: (failed: boolean) => void
}

/**
 * Signs a signed-out user in through WeChat. It shows nothing: the sign-in page shows the loading panel.
 * @constructor
 */
const WeChatAutoLogin = ({ from, search, navigate, onSettled }: iWeChatAutoLogin) => {
  // Once per page load: getUser only answers a state once, and the mark decides what happens next.
  useEffect(() => {
    const fail = () => {
      LocalStorageService.setAutoLoginMark(AUTO_LOGIN_FAILED)
      onSettled(true)
    }

    const searchParams = new URLSearchParams(search)
    const failAndCleanAddress = () => {
      fail()
      searchParams.delete('state')
      searchParams.delete('wechatError')
      navigate({ search: `?${searchParams}` }, { replace: true })
    }

    if (searchParams.has('wechatError')) {
      failAndCleanAddress()
      return
    }

    const state = `${searchParams.get('state') || ''}`.trim()
    if (state !== '') {
      WeChatService.getUserFromQrcode(state)
        .then((resp) => {
          const authToken = `${resp.token || ''}`.trim()
          if (authToken === '') {
            throw new Error('No user for this WeChat sign-in')
          }
          AuthService.setLocalAuthToken(authToken)
          LocalStorageService.setAutoLoginMark(AUTO_LOGIN_DONE)
          navigate(WeChatService.getSafeReturnPath(from), { replace: true })
        })
        .catch(failAndCleanAddress)
      return
    }

    const mark = LocalStorageService.getAutoLoginMark()
    if (mark === AUTO_LOGIN_SENT || mark === AUTO_LOGIN_FAILED) {
      fail()
      return
    }
    if (mark === AUTO_LOGIN_DONE || !LocalStorageService.setAutoLoginMark(AUTO_LOGIN_SENT)) {
      onSettled(false)
      return
    }

    // Leaving WeChat with the back button can restore this very page, with no effect running again.
    const onPageShow = ({ persisted }: PageTransitionEvent) => {
      if (persisted) fail()
    }
    window.addEventListener('pageshow', onPageShow)
    WeChatService.goToWeChatLogin(from).catch(fail)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default WeChatAutoLogin
