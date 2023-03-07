import React, { useEffect, useState } from 'react';
import { BaseButtonProps } from 'antd/es/button/button';
import { useSelector } from 'react-redux';
import { STYLE_WECHAT_COLOR } from '../../Constants';
import { RootState } from '../../Redux/makeReduxStore';
import WeChatService from '../../Services/WeChatService';
import { getFullUrl, THIRD_PARTY_AUTH_URL_WE_CHAT } from '../../UrlMap';
import Button from '../Form/Button';
import Icons from '../Icons';
import message from '../Form/message';

export const weChatBtnStyle = {
  background: STYLE_WECHAT_COLOR,
  borderColor: STYLE_WECHAT_COLOR,
  color: 'white',
};

const initialState = {
  loading: true,
  inAppAuthUrl: '',
};

const WeChatInAppLoginBtn = ({
  redirectUrl, originUrl, btnText, ...props
}: BaseButtonProps & {
  redirectUrl?: string, originUrl?: string, btnText?: string
}) => {
  const [state, setState] = useState(initialState);
  const { isInWeChat } = useSelector((s: RootState) => s.weChat);

  useEffect(() => {
    if (isInWeChat !== true) return;
    setState((s) => ({
      ...s,
      loading: true,
    }));

    let isCancelled = false;
    WeChatService.getWeChatInAppLoginUrl((redirectUrl || getFullUrl(THIRD_PARTY_AUTH_URL_WE_CHAT)), originUrl)
      .then((res) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          loading: false,
          inAppAuthUrl: res.data.auth_url,
        }));
      })
      .catch((err) => {
        if (isCancelled === true) return;
        message.error(`Error when fetch login url ${err.response.data.message}`);
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [isInWeChat, redirectUrl, originUrl]);

  if (isInWeChat !== true) {
    return null;
  }
  return (
    <Button {...({
      block: true,
      icon: <Icons.WechatFilled />,
      style: weChatBtnStyle,
      ...props,
    })} loading={state.loading} href={state.inAppAuthUrl} disabled={state.inAppAuthUrl === ''}>
      {btnText || 'WeChat'}
    </Button>
  );
};

export default WeChatInAppLoginBtn;
