import React from 'react';
import { Link } from 'react-router-dom';
import { BACK_END_URL } from '../../UrlMap';
import Result from '../Form/Result';
import Button from '../Form/Button';

const InvalidAccessPanel = ({ homeUrl, backBtnText }: {homeUrl?: string, backBtnText?: string}) => (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you are not authorized to access this page."
      extra={<Link to={homeUrl || BACK_END_URL}>
        <Button type="primary">{backBtnText || 'Back Home'}</Button>
      </Link>}
    />
);

export default InvalidAccessPanel;
