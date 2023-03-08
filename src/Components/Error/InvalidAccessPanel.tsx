import React from 'react';
import {useNavigate} from 'react-router-dom';
import { BACK_END_URL } from '../../UrlMap';
import Result from '../Form/Result';
import Button from '../Form/Button';

type iInvalidAccessPanel = {
  homeUrl?: string, backBtnText?: string
}
const InvalidAccessPanel = ({ homeUrl, backBtnText }: iInvalidAccessPanel) => {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you are not authorized to access this page."
      extra={
        <Button type="primary" onClick={() => navigate(homeUrl || BACK_END_URL)}>{backBtnText || 'Back Home'}</Button>
      }
    />
  )
};

export default InvalidAccessPanel;
