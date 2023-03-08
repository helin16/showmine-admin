import React, { useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { useIntl } from 'react-intl';
import { RootState } from '../../Redux/makeReduxStore';
import ArticleService from '../../Services/ArticleService';
import IArticle, {initialArticle} from '../../Types/Article/IArticle';
import { ARTICLE_DETAILS_URL, getUrl } from '../../UrlMap';
import message from '../Form/message';
import {BoxTitleDiv, FormInputWrapper} from '../../Styles/AppWrapper';
import InlineInput from '../Form/InlineInput';
import Button from '../Form/Button';
import Icons from '../Icons';
import {useNavigate} from 'react-router-dom';

const NewArticleGuideDiv = styled.div``;

type iState = {
  saving: boolean,
  newArticle: IArticle,
}
const initialState: iState = {
  saving: false,
  newArticle: initialArticle,
};

const NewArticleGuide = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const [state, setState] = useState(initialState);
  const intl = useIntl();
  const navigate = useNavigate();

  const handleValueChanged = (newTitle: string) => {
    setState({
      ...state,
      newArticle: {
        ...state.newArticle,
        title: newTitle,
      },
    });
  };

  const creatArticle = () => {
    if (!user || !user.last_visit_company_id || user.last_visit_company_id === null) {
      message.error(intl.formatMessage({ id: 'no-company' }));
      return;
    }
    if (state.newArticle.title === '') {
      message.error(intl.formatMessage({ id: 'need-title' }));
      return;
    }
    setState({
      ...state,
      saving: true,
    });
    ArticleService.createArticleUnderACompany(user.last_visit_company_id, { ...state.newArticle, date_publish: moment().format('Y-m-d') })
      .then((res) => {
        setState({
          ...state,
          newArticle: res.data,
          saving: false,
        });
      })
      .catch((err) => {
        message.error(intl.formatMessage({ id: 'failed-create' }, { text: err.message }));
        setState({
          ...state,
          saving: false,
        });
      });
  };

  if (state.newArticle && state.newArticle.id && state.newArticle.id !== '') {
    navigate(getUrl(ARTICLE_DETAILS_URL, ':id', state.newArticle.id));
    return null;
  }

  return (
    <NewArticleGuideDiv>
      <FormInputWrapper>
        <BoxTitleDiv><h1>{intl.formatMessage({ id: 'what-in-mind' })}</h1></BoxTitleDiv>
        <InlineInput
          placeholder={intl.formatMessage({ id: 'what-in-mind' })}
          allowClear
          value={state.newArticle.title}
          onChange={handleValueChanged}
        />
      </FormInputWrapper>
      {state.newArticle.title === '' ? null : (
        <Button type={'primary'} loading={state.saving} onClick={creatArticle}>
          {intl.formatMessage({ id: 'continue' })}
          <Icons.RightOutlined />
        </Button>
      )}
    </NewArticleGuideDiv>
  );
};

export default NewArticleGuide;
