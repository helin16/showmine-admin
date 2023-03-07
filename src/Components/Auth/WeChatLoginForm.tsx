import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import AuthService from '../../Services/AuthService';
import { STYLE_WECHAT_COLOR } from '../../Constants';
import { initState } from './LoginForm';
import { initError } from '../../Types/IError';

import { BACK_END_URL } from '../../UrlMap';
import Spin from '../Form/Spin';
import Alert from '../Form/Alert';
import Icons from '../Icons';
import SkeletonImage from '../Form/SkeletonImage';
import {useNavigate} from 'react-router-dom';

const WeChatQRCodeDiv = styled.div`
  text-align: center;
  width: 100%;
`;
const WeChatQRCodeImg = styled.div`
  background: white;
  padding: 10px;
  max-width: 260px;
  min-width: 160px;
  margin: 10px auto;
`;
const responseImgStyle = { width: '100%', height: 'auto' };
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
};
/**
 * WeChatLoginForm
 * @constructor
 */
const WeChatLoginForm = () => {
  const [formState, setFormState] = useState(initialState);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   *
   */
  useEffect(() => {
    if (formState.wechatUserToken !== '') {
      return;
    }
    if (formState.wechatTmpToken !== '') {
      return;
    }
    setFormState((s) => ({
      ...s,
      gettingUrl: true,
    }));
    let isCancelled = false;
    AuthService.getWeChatLoginUrl()
      .then((res) => {
        if (isCancelled === true) return;
        setFormState((s) => ({
          ...s,
          wechatQrCode: res.data,
          gettingUrl: false,
        }));
      })
      .catch((err) => {
        if (isCancelled === true) return;
        setFormState((s) => ({
          ...s,
          gettingUrlErr: err.data,
          gettingUrl: false,
        }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [formState.wechatTmpToken, formState.wechatUserToken]);
  /**
   * getting the user token from tmp token
   */
  useEffect(() => {
    if (formState.wechatUserToken !== '') {
      return;
    }
    if (formState.wechatTmpToken === '') {
      return;
    }
    let isCancelled = false;
    setFormState((s) => ({ ...s, validatingTempToken: true }));
    AuthService.validateTmpLoginCode(formState.wechatTmpToken)
      .then((res) => {
        if (isCancelled === true) {
          return;
        }
        if (res.data.return_code !== '') {
          setFormState((s) => ({
            ...s,
            wechatUserToken: res.data.return_code,
          }));
        }
      })
      .catch((err) => {
        if (isCancelled === true) {
          return;
        }
        setFormState((s) => ({
          ...s,
          validatingTempTokenErr: err.data,
        }));
      })
      .finally(() => {
        if (isCancelled === true) {
          return;
        }
        setFormState((s) => ({
          ...s,
          validatingTempToken: false,
        }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
      setFormState(initialState);
    };
  }, [dispatch, formState.wechatTmpToken, formState.wechatUserToken]);
  /**
   * getting the tmp token
   */
  useEffect(() => {
    if (formState.wechatUserToken !== '') {
      return;
    }
    if (formState.wechatQrCode.subscribeLoginLogId === '') {
      return;
    }
    const interval = setInterval(async () => {
      await AuthService.checkWeChatLoginUser(formState.wechatQrCode.subscribeLoginLogId)
        .then((res) => {
          if (res.data.log && res.data.log.tmp_token !== '') {
            clearInterval(interval);
            setFormState((s) => ({
              ...s,
              wechatTmpToken: res.data.log.tmp_token,
            }));
          }
        });
    }, 500);
    return () => { // eslint-disable-line
      clearInterval(interval);
    };
  }, [formState.wechatQrCode.subscribeLoginLogId, formState.wechatUserToken]);
  /**
   *
   * @param img
   */
  const getImg = (img: React.ReactNode) => (
    formState.validatingTempToken === true
      ? <Spin tip={'Scanned Success, login ...'}>img</Spin> : img
  );
  /**
   *
   */
  const getInfoDiv = (img?: React.ReactNode) => (
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
            {
              !img ? <SkeletonImage style={responseImgStyle}/>
                : getImg(img)
            }
          </WeChatQRCodeImg>
        </div>
      }
      type="info"
    />
  );

  if (formState.wechatUserToken !== '') {
    AuthService.setLocalAuthToken(formState.wechatUserToken);
    navigate(BACK_END_URL);
    return null;
  }
  /**
   * render
   */
  return (
    <WeChatQRCodeDiv>
      { formState.gettingUrl === true
        ? <Spin tip="Requesting QrCode ...">{getInfoDiv()}</Spin>
        : getInfoDiv(<img alt='' src={formState.wechatQrCode.qrcode} style={responseImgStyle}/>)
      }
    </WeChatQRCodeDiv>
  );
};

export default WeChatLoginForm;
