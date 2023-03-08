import React from 'react';
import { ARTICLE_LIST_URL } from '../../UrlMap';
import Result, {iResult} from '../Form/Result';
import Button from '../Form/Button';
import {useNavigate} from 'react-router-dom';

type IInvalidArticleDetails =  iResult & {description?: any};
const InvalidArticleDetails = ({ description, ...props }:IInvalidArticleDetails) => {
  const navigate = useNavigate();
  return (
    <Result
      {...props}
      extra={[
        <Button type="primary" key="article-list" onClick={() => navigate(ARTICLE_LIST_URL)}>
          Back to list
        </Button>
      ]}
    >
      {description ? (
        <div className="desc">
          {description}
        </div>
      ) : null}
    </Result>
  );
}

export default InvalidArticleDetails;
