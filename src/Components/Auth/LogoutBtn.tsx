import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { removedAuthentication } from '../../Redux/reduxers/auth.slice'
import { LOGIN_URL } from '../../UrlMap'
import AuthService from '../../Services/AuthService'
import Button from '../Form/Button'
import Icons from '../Icons'
import Modal from '../Form/Modal';
import {FormattedMessage, useIntl} from 'react-intl';
/**
 * logout btn
 * @constructor
 */
const LogoutBtn = () => {
  const [isConfirming, setIsConfirming] = useState(false)
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const intl = useIntl()
  /**
   * logout
   */
  const logout = () => {
    AuthService.logout();
    AuthService.removeLocalAuthToken()
    dispatch(removedAuthentication())
    navigate(LOGIN_URL)
  }

  const getPopup = () => {
    if (isConfirming !== true) {
      return null;
    }
    return (
      <Modal
        open={true}
        title={intl.formatMessage({ id: 'confirmingLogout' })}
        onOk={() => logout()}
        okText={intl.formatMessage({ id: 'yes' })}
        okButtonProps={{ type: 'primary', icon: <Icons.LogoutOutlined />}}
        onCancel={() => setIsConfirming(false)}
        cancelButtonProps={{ type: 'text' }}
      >
        <p>
          <FormattedMessage id='confirmingLogout' />
        </p>
      </Modal>
    )
  }
  /**
   * render
   */
  return (
    <>
      <Button type={'text'} icon={<Icons.LogoutOutlined />} onClick={() => setIsConfirming(true)}></Button>
      {getPopup()}
    </>
  )
}

export default LogoutBtn
