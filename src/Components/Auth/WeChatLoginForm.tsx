import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import AuthService from '../../Services/AuthService'
import { STYLE_WECHAT_COLOR } from '../../Constants'
import { initState } from './LoginForm'
import { initError } from '../../Types/IError'

import { BACK_END_URL } from '../../UrlMap'
import Spin from '../Form/Spin'
import Alert from '../Form/Alert'
import Icons from '../Icons'
import SkeletonImage from '../Form/SkeletonImage'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode.react';
import WeChatService from '../../Services/WeChatService';
import message from '../Form/message';
import MathHelper from '../../Helpers/MathHelper';
import Button from '../Form/Button';
import Utils from '../../Services/Utils'

const WeChatQRCodeDiv = styled.div`
  text-align: center;
  width: 100%;
`
const WeChatQRCodeImg = styled.div`
  background: white;
  padding: 10px;
  max-width: 260px;
  min-width: 160px;
  margin: 10px auto;
`
const responseImgStyle = { width: '100%', height: 'auto' }
const initialState = {
  ...initState,
  gettingUrl: false,
  gettingUrlErr: initError,
  validatingTempToken: false,
  validatingTempTokenErr: initError,
  wechatTmpToken: '',
  wechatUserToken: '',
  wechatQrCode: {
    subscribeLoginLogId: '',
    qrcode: '',
  },
}

/**
 * WeChatLoginForm
 * @constructor
 */
const WeChatLoginForm = () => {
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const [loginToken, setLoginToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState('');
  const [count, setCount] = useState(0);
  const [showReloadBtn, setShowReloadBtn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isCanceled = false;

    setIsLoading(true);
    WeChatService.getLoginQrCodeUrl()
      .then(resp => {
        if (isCanceled) return;
        setLoginUrl(`${resp.url || ''}`.trim());
        setLoginToken(`${resp.token || ''}`.trim());
        setUserToken('');
        setShowReloadBtn(false);
      })
      .catch(err => {
        if (isCanceled) return;
        message.error(Utils.getErrorMessage(err));
      })
      .finally(() => {
        if (isCanceled) return;
        setIsLoading(false);
      });

    return () => {
      isCanceled = true;
    }
  }, [count])

  useEffect(() => {
    const token = `${loginToken || ''}`.trim();
    if(token === '') { return }

    let isCanceled = false;
    const start = (i = 0) => {
      return setTimeout(() => {
        WeChatService.getUserFromQrcode(token)
          .then(resp => {
            if (isCanceled) return;
            const authToken = `${resp.token || ''}`.trim();
            if (i < MathHelper.mul(3, 60) && resp.userId === null && resp.error === null && authToken === '') {
              start(MathHelper.add(i, 1));
              return;
            }
            if (authToken !== '') {
              setUserToken(authToken)
              return;
            }
            if (resp.error !== null) {
              message.error(`${resp.error.message || 'Error Occurred'}`);
            }
            setShowReloadBtn(true);
          })
          .catch(err => {
            if (isCanceled) return;
            message.error(Utils.getErrorMessage(err));
          })
          .finally(() => {
            if (isCanceled) return;
          });
      }, 1000)
    }

    start();
    return () => {
      isCanceled = true;
    }
  }, [loginToken])

  const getQrcode = () => {
    const refreshBtn = <small><p>Timed out, please click below button to refresh again.</p><Button onClick={() => setCount(MathHelper.add(count, 1))}>Refresh</Button></small>;
    if (showReloadBtn === true) {
      return refreshBtn
    }

    if (loginUrl === null) {
      return <SkeletonImage style={responseImgStyle}/>;
    }

    if (`${loginUrl || ''}`.trim() !== '') {
      return <QRCode value={`${loginUrl || ''}`.trim()} />
    }

    return refreshBtn
  }

  const getInfoDiv = () => (
    <Alert
      message={
        <Icons.WechatFilled style={{ fontSize: '48px', color: STYLE_WECHAT_COLOR }}/>
      }
      description={
        <div>
          <div>
            You can use your WeChat App on your mobile to scan the QRCode below.
          </div>
          <WeChatQRCodeImg>
            {getQrcode()}
          </WeChatQRCodeImg>
        </div>
      }
      type="info"
    />
  );

  if (`${userToken || ''}`.trim() !== '') {
    AuthService.setLocalAuthToken(`${userToken || ''}`.trim());
    navigate(BACK_END_URL);
    return null;
  }

  /**
   * render
   */
  return (
    <WeChatQRCodeDiv>
      <Spin tip="Requesting QrCode ..." spinning={isLoading}>
        {getInfoDiv()}
      </Spin>
    </WeChatQRCodeDiv>
  );
}

export default WeChatLoginForm
