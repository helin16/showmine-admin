import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { removedAuthentication } from '../../Redux/reduxers/auth.slice';
import { LOGIN_URL } from '../../UrlMap';
import AuthService from '../../Services/AuthService';
import Button from '../Form/Button';
import Icons from '../Icons';
/**
 * logout btn
 * @constructor
 */
const LogoutBtn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  /**
   * logout
   */
  const logout = () => {
    AuthService.removeLocalAuthToken();
    dispatch(removedAuthentication());
    navigate(LOGIN_URL);
  };
  /**
   * render
   */
  return (
    <Button type={'text'} icon={<Icons.LogoutOutlined />} onClick={logout}></Button>
  );
};

export default LogoutBtn;
