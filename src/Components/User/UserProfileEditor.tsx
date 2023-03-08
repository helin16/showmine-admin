import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { MailFilled, MobileFilled } from '@ant-design/icons';
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import { useIntl, FormattedMessage } from 'react-intl';
import { WIZARD_URL } from '../../UrlMap';
import { RootState } from '../../Redux/makeReduxStore';
import { changeLocale } from '../../Redux/reduxers/app.slice';
import IUser from '../../Types/User/IUser';
import SingleImageUploader from '../Form/SingleImageUploader';
import InlineInput from '../Form/InlineInput';
import PasswordConfirm from '../Auth/PasswordConfirm';
import AuthService from '../../Services/AuthService';
import {
  isAuthenticated as isAuthed,
} from '../../Redux/reduxers/auth.slice';
import message from '../Form/message';
import Row from '../Form/Row';
import Col from '../Form/Col';
import Space from '../Form/Space';
import Button from '../Form/Button';
import {BoxTitleDiv, FormInputWrapper, listGutter} from '../../Styles/AppWrapper';
import Divider from '../Form/Divider';
import {RadioButton, RadioGroup} from '../Form/Radio';
import {LANGUAGE_ID_ENGLISH} from '../../Constants';
import Spin from '../Form/Spin';
import IAsset from '../../Types/Asset/IAsset';

const Wrapper = styled.div`

`;
const UserProfileEditor =({ user }: {user: IUser}) => {
  const appState = useSelector(
    (s: RootState) => s.app,
  );
  const dispatch = useDispatch();
  const intl = useIntl();
  const [state, setState] = useState({
    buttonDisable: false,
    password: '',
    confirmedPassword: '',
    user,
    isSaving: false,
  });

  const resetPassword = (password: string, confirmedPassword: string) => {
    if (password === confirmedPassword) {
      setState({
        ...state,
        password,
        confirmedPassword,
        buttonDisable: false,
      });
    } else {
      setState({
        ...state,
        buttonDisable: true,
      });
      message.error(intl.formatMessage({ id: 'confirm-password-diff' }));
    }
  };

  const saveUser = () => {
    const mUser = { ...state.user };
    if (state.password === state.confirmedPassword) {
      mUser.password = state.password;
    } else {
      message.error(intl.formatMessage({ id: 'confirm-password-diff' }));
    }
    setState({
      ...state,
      isSaving: true,
    })
    AuthService.putMe(mUser)
      .then((putResult) => {
        if (putResult.data.success) {
          AuthService.getMe().then((res) => {
            dispatch(isAuthed({
              user: res.data,
              company: res.data.last_visit_company,
            }));
            setState((s) => ({
              ...s,
              authenticating: false,
            }));
            message.success(intl.formatMessage({ id: 'user-update-success' }));
          });
        }
      })
      .catch(err => {
        message.error(err.data.message);
      })
      .finally(() => {
        setState({
          ...state,
          isSaving: false,
        })
      });
  };

  const modifyUser = (index: string, value: any) => {
    if (index === 'language') {
      if (value === 'en') {
        setState({
          ...state,
          user: {
            ...state.user,
            language_id: LANGUAGE_ID_ENGLISH,
          },
        });
      }
    } else {
      setState({
        ...state,
        user: {
          ...state.user,
          [index]: value,
        },
      });
    }
  };

  return (
    <Wrapper>
      <Spin spinning={state.isSaving}>
        <Row gutter={[listGutter, listGutter]}>
          <Col xs={24} sm={24} md={6} style={{ height: '160px' }}>
            <Space direction="vertical">
              <SingleImageUploader
                initImgUrl={user.avatar_img}
                onChange={(newAsset: IAsset) => modifyUser('avatar_asset', newAsset)}/>
              <Link to={WIZARD_URL}>
                <Button type="primary" size="large">
                  {intl.formatMessage({ id: 'get-started' })}
                </Button>
              </Link>
            </Space>
          </Col>
          <Col md={18}>
            <Row gutter={listGutter}>
              <Col md={8}>
                <FormInputWrapper>
                  <BoxTitleDiv><FormattedMessage id='nickname' /></BoxTitleDiv>
                  <InlineInput
                    value={user.nick_name}
                    allowClear
                    placeholder={intl.formatMessage({ id: 'nickname-placeholder' })}
                    onChange={(newValue: string) => { modifyUser('nick_name', newValue); }}
                  />
                </FormInputWrapper>
              </Col>
              <Col md={8}>
                <FormInputWrapper>
                  <BoxTitleDiv>{intl.formatMessage({ id: 'first-name' })}:</BoxTitleDiv>
                  <InlineInput
                    value={user.first_name}
                    allowClear
                    placeholder={intl.formatMessage({ id: 'first-name' })}
                    onChange={(newValue: string) => { modifyUser('first_name', newValue); }}
                  />
                </FormInputWrapper>
              </Col>
              <Col md={8}>
                <FormInputWrapper>
                  <BoxTitleDiv>{intl.formatMessage({ id: 'last-name' })}:</BoxTitleDiv>
                  <InlineInput
                    value={user.last_name}
                    allowClear
                    placeholder={intl.formatMessage({ id: 'last-name' })}
                    onChange={(newValue: string) => { modifyUser('last_name', newValue); }}
                  />
                </FormInputWrapper>
              </Col>
              <Col md={12}>
                <FormInputWrapper>
                  <BoxTitleDiv><FormattedMessage id='email' />:</BoxTitleDiv>
                  <InlineInput
                    allowClear
                    placeholder={intl.formatMessage({ id: 'email-placeholder' })}
                    prefix={<MailFilled/>}
                    value={user.email}
                    onChange={(newValue: string) => { modifyUser('email', newValue); }}
                  />
                </FormInputWrapper>
              </Col>
              <Col md={12}>
                <FormInputWrapper>
                  <BoxTitleDiv>{intl.formatMessage({ id: 'mobile-number' })}:</BoxTitleDiv>
                  <InlineInput
                    allowClear
                    placeholder={intl.formatMessage({ id: 'mobile-number-placeholder' })}
                    prefix={<MobileFilled />}
                    value={user.mobile}
                    onChange={(newValue: string) => { modifyUser('mobile', newValue); }}
                  />
                </FormInputWrapper>
              </Col>
              <Col md={24}>
                <FormInputWrapper>
                  <BoxTitleDiv>{intl.formatMessage({ id: 'language' })}:</BoxTitleDiv>
                  <RadioGroup buttonStyle="solid" value={appState.locale}
                    onChange={ (e) => {
                      // setLocale( e.target.value );
                      dispatch(changeLocale({ ...appState, locale: e.target.value }));
                      modifyUser('language', e.target.value.locale);
                    }}
                  >
                    <RadioButton key="en" value={enUS}>
                      <span aria-label="au-flag" role="img" style={{ marginRight: '10px' }}>
                        🇦🇺
                      </span>
                      English
                    </RadioButton>
                    <RadioButton key="cn" value={zhCN}>
                      <span aria-label="cn-flag" role="img" style={{ marginRight: '10px' }}>
                        🇨🇳
                      </span>
                      中文
                    </RadioButton>
                  </RadioGroup>
                </FormInputWrapper>
              </Col>
              <Col md={24}>
                <Divider orientation="left" plain>{intl.formatMessage({ id: 'reset-password' })}</Divider>
              </Col>
              <Col md={24}>
                <PasswordConfirm
                  onConfirm={resetPassword}
                  labelText={intl.formatMessage({ id: 'new-password' })}
                  btnText={intl.formatMessage({ id: 'confirm-reset' })}
                />
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col className={'text-right'} sm={24}>
            <Button type="primary" loading={state.isSaving} size="large" disabled={state.buttonDisable} onClick={() => saveUser()}>Save</Button>
          </Col>
        </Row>
      </Spin>
    </Wrapper>
  );
};

export default UserProfileEditor;
