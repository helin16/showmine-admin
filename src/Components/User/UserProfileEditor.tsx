import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { MailFilled, MobileFilled } from '@ant-design/icons'
import { useIntl, FormattedMessage } from 'react-intl'
import { RootState } from '../../Redux/makeReduxStore'
import { changeLocale } from '../../Redux/reduxers/app.slice'
import IUser from '../../Types/User/IUser'
import SingleImageUploader from '../Form/SingleImageUploader'
import InlineInput from '../Form/InlineInput'
import PasswordConfirm from '../Auth/PasswordConfirm'
import AuthService from '../../Services/AuthService'
import message from '../Form/message'
import Row from '../Form/Row'
import Col from '../Form/Col'
import Space from '../Form/Space'
import { BoxTitleDiv, FormInputWrapper, listGutter } from '../../Styles/AppWrapper'
import Divider from '../Form/Divider'
import { RadioButton, RadioGroup } from '../Form/Radio'
import Spin from '../Form/Spin'
import IAsset, {ASSET_TYPE_USER_AVATAR} from '../../Types/Asset/IAsset'
import Locale from '../Form/Locale'
import {isAuthenticated as isAuthed} from '../../Redux/reduxers/auth.slice';
import Utils from '../../Services/Utils'

const Wrapper = styled.div``
const UserProfileEditor = ({ user }: { user: IUser }) => {
  const {app: appState, auth: authState} = useSelector(
    (s: RootState) => s,
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
  // The saved address may not change, and InlineInput only follows a new value, so this drops what was typed.
  const [emailInputKey, setEmailInputKey] = useState(0);

  const modifyUser = (newData: { [key: string]: string | null }) => {
    setState({
      ...state,
      isSaving: true,
    })
    AuthService.updateMe(newData)
      .then((res) => {
        const isWaiting = !!res.user.pendingEmail && res.user.pendingEmail === newData.email?.trim();
        message.success(isWaiting ? intl.formatMessage({ id: 'email-confirm-sent' }, { email: res.user.pendingEmail }) : 'Profile updated.')
        if ('email' in newData) {
          setEmailInputKey((key) => key + 1);
        }
        dispatch(isAuthed({...authState, user: res.user}));
        dispatch(changeLocale({ ...appState, locale: `${res.user.languageCode}` === Locale.enUS.locale ? Locale.enUS : Locale.zhCN}));
      })
      .catch(err => {
        message.error(Utils.getErrorMessage(err));
      })
      .finally(() => {
        setState({
          ...state,
          isSaving: false,
        })
      });
  };

  return (
    <Wrapper>
      <Spin spinning={state.isSaving}>
        <Row gutter={[listGutter, listGutter]}>
          <Col xs={24} sm={24} md={6} style={{ height: '160px' }}>
            <Space orientation="vertical">
              <SingleImageUploader
                assetType={ASSET_TYPE_USER_AVATAR}
                onSetIsSaving={(saving) => setState({...state, isSaving: saving})}
                initImgUrl={user.AvatarAsset?.url || ''}
                onChange={(newAsset: IAsset | null) => modifyUser({ avatarAssetId: `${newAsset?.id || ''}`.trim() === '' ? null : `${newAsset?.id || ''}`}) }/>
            </Space>
          </Col>
          <Col md={18}>
            <Row gutter={listGutter}>
              <Col md={8}>
                <FormInputWrapper>
                  <BoxTitleDiv><FormattedMessage id='nickname' /></BoxTitleDiv>
                  <InlineInput
                    value={user.nickName || ''}
                    allowClear
                    placeholder={intl.formatMessage({ id: 'nickname-placeholder' })}
                    onChange={(newValue: string) => { modifyUser({nickName: newValue}) }}
                  />
                </FormInputWrapper>
              </Col>
              <Col md={8}>
                <FormInputWrapper>
                  <BoxTitleDiv>{intl.formatMessage({ id: 'first-name' })}:</BoxTitleDiv>
                  <InlineInput
                    value={user.firstName || ''}
                    allowClear
                    placeholder={intl.formatMessage({ id: 'first-name' })}
                    onChange={(newValue: string) => { modifyUser({firstName: newValue}) }}
                  />
                </FormInputWrapper>
              </Col>
              <Col md={8}>
                <FormInputWrapper>
                  <BoxTitleDiv>{intl.formatMessage({ id: 'last-name' })}:</BoxTitleDiv>
                  <InlineInput
                    value={user.lastName || ''}
                    allowClear
                    placeholder={intl.formatMessage({ id: 'last-name' })}
                    onChange={(newValue: string) => { modifyUser({lastName: newValue}); }}
                  />
                </FormInputWrapper>
              </Col>
              <Col md={12}>
                <FormInputWrapper>
                  <BoxTitleDiv><FormattedMessage id='email' />:</BoxTitleDiv>
                  <InlineInput
                    key={emailInputKey}
                    allowClear
                    placeholder={intl.formatMessage({ id: 'email-placeholder' })}
                    prefix={<MailFilled/>}
                    value={user.email || ''}
                    onChange={(newValue: string) => { modifyUser({email: newValue}); }}
                  />
                  {user.pendingEmail ? <FormattedMessage id='email-pending' values={{ email: user.pendingEmail }} /> : null}
                </FormInputWrapper>
              </Col>
              <Col md={12}>
                <FormInputWrapper>
                  <BoxTitleDiv>{intl.formatMessage({ id: 'mobile-number' })}:</BoxTitleDiv>
                  <InlineInput
                    allowClear
                    placeholder={intl.formatMessage({ id: 'mobile-number-placeholder' })}
                    prefix={<MobileFilled />}
                    value={user.mobile || ''}
                    onChange={(newValue: string) => { modifyUser({mobile: newValue}); }}
                  />
                </FormInputWrapper>
              </Col>
              <Col md={24}>
                <FormInputWrapper>
                  <BoxTitleDiv>{intl.formatMessage({ id: 'language' })}:</BoxTitleDiv>
                  <RadioGroup buttonStyle="solid" value={appState.locale}
                    onChange={ (e) => {
                      modifyUser({languageCode: e.target.value.locale}, );
                    }}
                  >
                    <RadioButton key="en" value={Locale.enUS}>
                      <span aria-label="au-flag" role="img" style={{ marginRight: '10px' }}>
                        🇦🇺
                      </span>
                      English
                    </RadioButton>
                    <RadioButton key="cn" value={Locale.zhCN}>
                      <span aria-label="cn-flag" role="img" style={{ marginRight: '10px' }}>
                        🇨🇳
                      </span>
                      中文
                    </RadioButton>
                  </RadioGroup>
                </FormInputWrapper>
              </Col>
              <Col md={24}>
                <Divider titlePlacement="start" plain>{intl.formatMessage({ id: 'reset-password' })}</Divider>
              </Col>
              <Col md={24}>
                <PasswordConfirm
                  onConfirm={(password) => modifyUser({password})}
                  labelText={intl.formatMessage({ id: 'new-password' })}
                  btnText={intl.formatMessage({ id: 'confirm' })}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Spin>
    </Wrapper>
  );
}

export default UserProfileEditor
